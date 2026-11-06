import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Text, Boolean, Integer, Numeric, DateTime, 
    ForeignKey, Enum as SAEnum, JSON, Index
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum
from app.core.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class UserRole(str, enum.Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    FINANCE_ADMIN = "FINANCE_ADMIN"
    SALES_MANAGER = "SALES_MANAGER"
    AD_MODERATOR = "AD_MODERATOR"
    OPERATIONS_MANAGER = "OPERATIONS_MANAGER"
    AUDITOR = "AUDITOR"
    ADVERTISER = "ADVERTISER"


class CampaignStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    QUOTED = "QUOTED"
    CONTRACT_ACCEPTED = "CONTRACT_ACCEPTED"
    PAYMENT_CONFIRMED = "PAYMENT_CONFIRMED"
    APPROVED = "APPROVED"
    SCHEDULED = "SCHEDULED"
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    REJECTED = "REJECTED"
    COMPLETED = "COMPLETED"
    RECONCILED = "RECONCILED"


class PricingModel(str, enum.Enum):
    TIME = "TIME"
    SLOT = "SLOT"
    IMPRESSION = "IMPRESSION"
    HYBRID = "HYBRID"


class CreativeStatus(str, enum.Enum):
    PENDING_REVIEW = "PENDING_REVIEW"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    FLAGGED = "FLAGGED"


class PaymentStatus(str, enum.Enum):
    PENDING = "PENDING"
    AUTHORIZED = "AUTHORIZED"
    CAPTURED = "CAPTURED"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"
    CHARGEBACK = "CHARGEBACK"
    RECONCILED = "RECONCILED"


# ==============================================================================
# 1. IDENTITY & USERS (Con soporte de 2FA TOTP)
# ==============================================================================

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(SAEnum(UserRole), default=UserRole.ADVERTISER, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # 2FA (MFA)
    mfa_secret = Column(String(64), nullable=True)
    mfa_enabled = Column(Boolean, default=False, nullable=False)
    
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    advertiser = relationship("Advertiser", back_populates="user", uselist=False)


# ==============================================================================
# 2. ADVERTISERS & CONTRACTS
# ==============================================================================

class Advertiser(Base):
    __tablename__ = "advertisers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=True)
    company_name = Column(String(255), nullable=False)
    legal_name = Column(String(255), nullable=True)
    tax_id = Column(String(64), nullable=True)  # NIT / RFC / CIF / Tax ID
    email = Column(String(255), index=True, nullable=False)
    phone = Column(String(64), nullable=True)
    country = Column(String(8), default="CO", nullable=False)
    address = Column(String(255), nullable=True)
    website = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    user = relationship("User", back_populates="advertiser")
    contracts = relationship("Contract", back_populates="advertiser")
    orders = relationship("CampaignOrder", back_populates="advertiser")


class Contract(Base):
    __tablename__ = "contracts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    advertiser_id = Column(UUID(as_uuid=True), ForeignKey("advertisers.id"), nullable=False)
    contract_type = Column(String(64), default="DIGITAL_ADVERTISING_FRAMEWORK", nullable=False)
    title = Column(String(255), nullable=False)
    version = Column(String(32), default="v1.0", nullable=False)
    terms_text = Column(Text, nullable=False)
    terms_hash_sha256 = Column(String(64), nullable=False)
    is_accepted = Column(Boolean, default=False, nullable=False)
    accepted_at = Column(DateTime(timezone=True), nullable=True)
    accepted_ip = Column(String(64), nullable=True)
    accepted_user_agent = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    advertiser = relationship("Advertiser", back_populates="contracts")
    orders = relationship("CampaignOrder", back_populates="contract")


# ==============================================================================
# 3. INVENTORY & PLACEMENTS
# ==============================================================================

class Placement(Base):
    __tablename__ = "placements"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String(64), unique=True, index=True, nullable=False)  # ej: "solitario_top"
    game_id = Column(String(64), index=True, nullable=False)           # ej: "solitario"
    name = Column(String(128), nullable=False)
    position = Column(String(32), nullable=False)                       # "top" o "bottom"
    rotation_seconds = Column(Integer, default=60, nullable=False)
    slots_per_hour = Column(Integer, default=60, nullable=False)
    max_concurrent = Column(Integer, default=1, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    orders = relationship("CampaignOrder", back_populates="placement")


# ==============================================================================
# 4. CAMPAIGN ORDERS & CREATIVES
# ==============================================================================

class CampaignOrder(Base):
    __tablename__ = "campaign_orders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String(64), unique=True, index=True, nullable=False)  # ej: "CAMP_1762468393"
    advertiser_id = Column(UUID(as_uuid=True), ForeignKey("advertisers.id"), nullable=False)
    contract_id = Column(UUID(as_uuid=True), ForeignKey("contracts.id"), nullable=True)
    placement_id = Column(UUID(as_uuid=True), ForeignKey("placements.id"), nullable=False)
    pricing_model = Column(SAEnum(PricingModel), default=PricingModel.TIME, nullable=False)
    status = Column(SAEnum(CampaignStatus), default=CampaignStatus.DRAFT, nullable=False)
    
    # Financial fields (Strict NUMERIC, No Float)
    currency = Column(String(8), default="USD", nullable=False)
    subtotal = Column(Numeric(12, 2), default=0.00, nullable=False)
    tax_amount = Column(Numeric(12, 2), default=0.00, nullable=False)
    total_amount = Column(Numeric(12, 2), default=0.00, nullable=False)
    total_cop = Column(Numeric(14, 2), default=0.00, nullable=False)
    
    payment_status = Column(SAEnum(PaymentStatus), default=PaymentStatus.PENDING, nullable=False)
    
    # Flight Dates (Vigencias y Horarios)
    start_date = Column(DateTime(timezone=True), nullable=True)
    end_date = Column(DateTime(timezone=True), nullable=True)
    slot_minute = Column(Integer, nullable=True)
    priority_level = Column(Integer, default=1, nullable=False)
    
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    advertiser = relationship("Advertiser", back_populates="orders")
    contract = relationship("Contract", back_populates="orders")
    placement = relationship("Placement", back_populates="orders")
    creatives = relationship("Creative", back_populates="order")
    payments = relationship("Payment", back_populates="order")
    fulfillment_reports = relationship("FulfillmentReport", back_populates="order")


class Creative(Base):
    __tablename__ = "creatives"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("campaign_orders.id"), nullable=False)
    title = Column(String(128), nullable=False)
    description = Column(String(255), nullable=False)
    logo_url = Column(Text, nullable=True)
    web_url = Column(String(512), nullable=False)
    donation_url = Column(String(512), nullable=True)
    shop_url = Column(String(512), nullable=True)
    status = Column(SAEnum(CreativeStatus), default=CreativeStatus.PENDING_REVIEW, nullable=False)
    review_notes = Column(Text, nullable=True)
    reviewed_by = Column(UUID(as_uuid=True), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    order = relationship("CampaignOrder", back_populates="creatives")


# ==============================================================================
# 5. PAYMENTS & TREASURY
# ==============================================================================

class Payment(Base):
    __tablename__ = "payments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("campaign_orders.id"), nullable=False)
    gateway = Column(String(32), nullable=False)  # "EPAYCO", "PAYPAL", "MERCADOPAGO", "CRYPTO"
    external_reference = Column(String(128), index=True, nullable=True)
    currency = Column(String(8), default="USD", nullable=False)
    amount_gross = Column(Numeric(12, 2), nullable=False)
    gateway_fee = Column(Numeric(12, 2), default=0.00, nullable=False)
    amount_net = Column(Numeric(12, 2), nullable=False)
    payment_status = Column(SAEnum(PaymentStatus), default=PaymentStatus.PENDING, nullable=False)
    raw_webhook_payload = Column(JSON, nullable=True)
    paid_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    order = relationship("CampaignOrder", back_populates="payments")


# ==============================================================================
# 6. AD DELIVERY & TELEMETRY
# ==============================================================================

class AdDecision(Base):
    __tablename__ = "ad_decisions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    placement_id = Column(UUID(as_uuid=True), ForeignKey("placements.id"), nullable=False)
    order_id = Column(UUID(as_uuid=True), ForeignKey("campaign_orders.id"), nullable=True)
    creative_id = Column(UUID(as_uuid=True), ForeignKey("creatives.id"), nullable=True)
    decision_time = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    client_ip = Column(String(64), nullable=True)
    ua_class = Column(String(32), default="mobile", nullable=False)
    is_fallback = Column(Boolean, default=False, nullable=False)

    delivery_events = relationship("DeliveryEvent", back_populates="decision")


class DeliveryEvent(Base):
    __tablename__ = "delivery_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    decision_id = Column(UUID(as_uuid=True), ForeignKey("ad_decisions.id"), nullable=True)
    order_id = Column(UUID(as_uuid=True), ForeignKey("campaign_orders.id"), nullable=True)
    event_type = Column(String(32), nullable=False)  # "ad_viewable", "ad_click", "ad_donation_click", "ad_shop_click"
    is_viewable = Column(Boolean, default=False, nullable=False)  # Estándar IAB (>=50% visible por >= 1s)
    viewable_duration_ms = Column(Integer, default=0, nullable=False)
    timestamp_utc = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    is_offline_sync = Column(Boolean, default=False, nullable=False)

    decision = relationship("AdDecision", back_populates="delivery_events")


# ==============================================================================
# 7. FULFILLMENT & COMPENSATIONS
# ==============================================================================

class FulfillmentReport(Base):
    __tablename__ = "fulfillment_reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("campaign_orders.id"), nullable=False)
    evaluation_date = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    contracted_quantity = Column(Integer, nullable=False)
    delivered_valid_quantity = Column(Integer, default=0, nullable=False)
    fulfillment_ratio = Column(Numeric(5, 4), default=0.0000, nullable=False)
    deficit = Column(Integer, default=0, nullable=False)
    compensation_suggested = Column(String(128), nullable=True)
    status = Column(String(32), default="CALCULATED", nullable=False)

    order = relationship("CampaignOrder", back_populates="fulfillment_reports")
    compensations = relationship("Compensation", back_populates="report")


class Compensation(Base):
    __tablename__ = "compensations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    fulfillment_id = Column(UUID(as_uuid=True), ForeignKey("fulfillment_reports.id"), nullable=False)
    compensation_type = Column(String(64), nullable=False)  # "EXTENSION", "EXTRA_SLOTS", "CREDIT", "REFUND"
    units = Column(Integer, default=0, nullable=False)
    economic_value = Column(Numeric(12, 2), default=0.00, nullable=False)
    reason = Column(Text, nullable=False)
    status = Column(String(32), default="PENDING_APPROVAL", nullable=False)
    approved_by = Column(UUID(as_uuid=True), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    report = relationship("FulfillmentReport", back_populates="compensations")


# ==============================================================================
# 8. AUDIT LOG (Inmutable Append-Only con Hash Encadenado)
# ==============================================================================

class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    actor_id = Column(UUID(as_uuid=True), nullable=True)
    actor_email = Column(String(255), nullable=True)
    action = Column(String(64), nullable=False)  # ej: "APPROVE_CAMPAIGN", "LOGIN_2FA"
    resource_type = Column(String(64), nullable=False)  # ej: "CampaignOrder", "Creative"
    resource_id = Column(String(64), nullable=False)
    previous_state = Column(JSON, nullable=True)
    new_state = Column(JSON, nullable=True)
    ip_address = Column(String(64), nullable=True)
    note = Column(Text, nullable=True)
    
    # Hash Encadenado (Tamper-evident)
    prev_hash = Column(String(64), nullable=True)
    event_hash = Column(String(64), nullable=False)
    
    timestamp_utc = Column(DateTime(timezone=True), default=utcnow, nullable=False)


# Índices estratégicos para alto rendimiento de Ad-Server
Index("idx_orders_placement_status", CampaignOrder.placement_id, CampaignOrder.status)
Index("idx_decisions_placement_time", AdDecision.placement_id, AdDecision.decision_time)
Index("idx_events_order_timestamp", DeliveryEvent.order_id, DeliveryEvent.timestamp_utc)
Index("idx_audit_resource", AuditEvent.resource_type, AuditEvent.resource_id)
