#!/usr/bin/env python3
"""
Legacy Data Ingestion & Migration Script for Care Ads Manager V1.0
Imports existing campaigns.json and payments.json from the PHP flat-file storage
into the normalized PostgreSQL database (care_ads_db) idempotently.
"""

import sys
import os
import json
import uuid
from decimal import Decimal
from datetime import datetime, timezone
import asyncio

# Add backend directory to sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend"))
sys.path.insert(0, backend_dir)

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models import (
    User, UserRole, Advertiser, CampaignOrder, CampaignStatus,
    PricingModel, Creative, CreativeStatus, Payment, PaymentStatus,
    Placement
)
from app.core.audit import record_audit_event


def parse_datetime(dt_str):
    if not dt_str:
        return datetime.now(timezone.utc)
    try:
        # Standard formats: "2026-10-26 14:30:00" or ISO format
        if " " in dt_str:
            dt = datetime.strptime(dt_str, "%Y-%m-%d %H:%M:%S")
        else:
            dt = datetime.fromisoformat(dt_str)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except Exception:
        return datetime.now(timezone.utc)


async def migrate_data(campaigns_path: str, payments_path: str):
    print(f"Starting ingestion from:\n  - Campaigns: {campaigns_path}\n  - Payments: {payments_path}")
    
    campaigns = []
    payments = []
    
    if os.path.exists(campaigns_path):
        with open(campaigns_path, "r", encoding="utf-8") as f:
            try:
                campaigns = json.load(f)
            except Exception as e:
                print(f"Error parsing campaigns.json: {e}")
    else:
        print(f"Warning: {campaigns_path} not found. Proceeding with empty list.")

    if os.path.exists(payments_path):
        with open(payments_path, "r", encoding="utf-8") as f:
            try:
                payments = json.load(f)
            except Exception as e:
                print(f"Error parsing payments.json: {e}")
    else:
        print(f"Warning: {payments_path} not found. Proceeding with empty list.")

    async with AsyncSessionLocal() as session:
        # Fetch placements mapping
        p_res = await session.execute(select(Placement))
        placements_dict = {p.code: p.id for p in p_res.scalars().all()}
        default_placement_id = next(iter(placements_dict.values())) if placements_dict else None

        # Fetch super admin user for auditing
        admin_res = await session.execute(
            select(User).where(User.role == UserRole.SUPER_ADMIN).limit(1)
        )
        admin_user = admin_res.scalar_one_or_none()
        admin_id = admin_user.id if admin_user else None

        migrated_campaigns = 0
        migrated_payments = 0

        for c_data in campaigns:
            c_code = c_data.get("id") or str(uuid.uuid4())
            email = c_data.get("advertiserEmail") or "legacy_advertiser@caretechservices.com"
            brand = c_data.get("brandName") or c_data.get("title") or "Anunciante Histórico"

            # 1. Ensure User & Advertiser exist
            u_stmt = select(User).where(User.email == email)
            u_res = await session.execute(u_stmt)
            user = u_res.scalar_one_or_none()
            if not user:
                user = User(
                    email=email,
                    hashed_password="$argon2id$v=19$m=65536,t=3,p=4$legacy_migration_unusable_hash",
                    role=UserRole.ADVERTISER,
                    is_active=True
                )
                session.add(user)
                await session.flush()

            adv_stmt = select(Advertiser).where(Advertiser.user_id == user.id)
            adv_res = await session.execute(adv_stmt)
            advertiser = adv_res.scalar_one_or_none()
            if not advertiser:
                advertiser = Advertiser(
                    user_id=user.id,
                    company_name=brand,
                    contact_name=c_data.get("contactName") or brand,
                    contact_phone=c_data.get("advertiserPhone") or "",
                    billing_email=email,
                    tax_id=c_data.get("taxId") or "900000000-0"
                )
                session.add(advertiser)
                await session.flush()

            # 2. Check if CampaignOrder already migrated
            co_stmt = select(CampaignOrder).where(CampaignOrder.order_code == c_code)
            co_res = await session.execute(co_stmt)
            existing_order = co_res.scalar_one_or_none()
            if existing_order:
                print(f"Skipping already imported campaign: {c_code}")
                continue

            # Map status
            status_map = {
                "ACTIVE": CampaignStatus.ACTIVE,
                "PENDING_REVIEW": CampaignStatus.CONTRACT_ACCEPTED,
                "PENDING": CampaignStatus.CONTRACT_ACCEPTED,
                "PAUSED": CampaignStatus.PAUSED,
                "COMPLETED": CampaignStatus.COMPLETED
            }
            mapped_status = status_map.get(c_data.get("status"), CampaignStatus.CONTRACT_ACCEPTED)
            
            placement_code = f"{c_data.get('gameId', 'solitario')}_{c_data.get('placement', 'top')}"
            placement_id = placements_dict.get(placement_code, default_placement_id)

            created_at = parse_datetime(c_data.get("createdAt"))
            total_usd = Decimal(str(c_data.get("totalUsd", 0.0)))
            total_cop = Decimal(str(c_data.get("totalCop", 0.0)))

            order = CampaignOrder(
                order_code=c_code,
                advertiser_id=advertiser.id,
                placement_id=placement_id,
                status=mapped_status,
                pricing_model=PricingModel.TIME,
                flight_start=created_at,
                flight_end=created_at,  # Can be expanded based on plan weeks
                gross_amount_usd=total_usd,
                net_amount_usd=total_usd,
                gross_amount_cop=total_cop,
                net_amount_cop=total_cop,
                metadata_snapshot={"legacy_raw": c_data}
            )
            session.add(order)
            await session.flush()

            # Creative
            creative = Creative(
                campaign_order_id=order.id,
                title=c_data.get("title") or brand,
                description=c_data.get("description") or "",
                cta_text=c_data.get("ctaText") or "Ver Más",
                target_url=c_data.get("targetUrl") or c_data.get("shopUrl") or "https://caretechservices.com",
                logo_url=c_data.get("logo") or c_data.get("logoUrl"),
                status=CreativeStatus.APPROVED if mapped_status == CampaignStatus.ACTIVE else CreativeStatus.PENDING_REVIEW
            )
            session.add(creative)

            await record_audit_event(
                session=session,
                actor_id=admin_id,
                action="MIGRATE_LEGACY_CAMPAIGN",
                resource_type="campaign_order",
                resource_id=order.id,
                new_state={"order_code": c_code, "status": mapped_status.value},
                note=f"Migrated from legacy flat-file store: {c_code}"
            )
            migrated_campaigns += 1

        # 3. Process payments
        for p_data in payments:
            ref = p_data.get("reference") or str(uuid.uuid4())
            pay_stmt = select(Payment).where(Payment.reference_code == ref)
            pay_res = await session.execute(pay_stmt)
            if pay_res.scalar_one_or_none():
                print(f"Skipping already imported payment: {ref}")
                continue

            # Find matching order
            match_order_stmt = select(CampaignOrder).where(CampaignOrder.order_code == ref)
            match_order_res = await session.execute(match_order_stmt)
            matched_order = match_order_res.scalar_one_or_none()

            if not matched_order:
                continue

            pay_status = PaymentStatus.CAPTURED if p_data.get("status") == "PAID" else PaymentStatus.PENDING
            p_usd = Decimal(str(p_data.get("amountUsd", 0.0)))
            p_cop = Decimal(str(p_data.get("amountCop", 0.0)))

            payment = Payment(
                campaign_order_id=matched_order.id,
                reference_code=ref,
                gateway=p_data.get("paymentMethod") or "MANUAL",
                amount_usd=p_usd,
                amount_cop=p_cop,
                status=pay_status,
                gateway_tx_id=p_data.get("epaycoRef") or p_data.get("paypalTxId") or p_data.get("mercadopagoId"),
                raw_webhook_payload=p_data,
                created_at=parse_datetime(p_data.get("createdAt"))
            )
            session.add(payment)
            migrated_payments += 1

        await session.commit()
        print(f"Migration completed successfully.")
        print(f"  - Campaigns Migrated: {migrated_campaigns}")
        print(f"  - Payments Migrated: {migrated_payments}")


if __name__ == "__main__":
    c_path = sys.argv[1] if len(sys.argv) > 1 else os.path.join(backend_dir, "data/campaigns.json")
    p_path = sys.argv[2] if len(sys.argv) > 2 else os.path.join(backend_dir, "data/payments.json")
    asyncio.run(migrate_data(c_path, p_path))
