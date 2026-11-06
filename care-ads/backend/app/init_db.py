import asyncio
import hashlib
from app.core.database import engine, Base, AsyncSessionLocal
from app.core.security import hash_password, generate_totp_secret
from app.models import User, UserRole, Placement, Contract
from sqlalchemy import select


async def init_database():
    print("🐘 [PostgreSQL] Creando tablas del esquema Care Ads Manager V1.0...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Tablas creadas exitosamente en PostgreSQL.")

    async with AsyncSessionLocal() as session:
        # 1. Crear Placements por defecto (Solitario Care Top & Bottom)
        res = await session.execute(select(Placement).where(Placement.code == "solitario_top"))
        placement_top = res.scalar_one_or_none()
        if not placement_top:
            placement_top = Placement(
                code="solitario_top",
                game_id="solitario",
                name="Solitario Care - Banner Superior",
                position="top",
                rotation_seconds=60,
                slots_per_hour=60,
                max_concurrent=1,
                is_active=True
            )
            session.add(placement_top)

        res = await session.execute(select(Placement).where(Placement.code == "solitario_bottom"))
        placement_bottom = res.scalar_one_or_none()
        if not placement_bottom:
            placement_bottom = Placement(
                code="solitario_bottom",
                game_id="solitario",
                name="Solitario Care - Banner Inferior",
                position="bottom",
                rotation_seconds=60,
                slots_per_hour=60,
                max_concurrent=1,
                is_active=True
            )
            session.add(placement_bottom)

        # 2. Crear Super Administrador inicial con 2FA habilitable
        admin_email = "admin@caretechservices.com"
        res = await session.execute(select(User).where(User.email == admin_email))
        admin_user = res.scalar_one_or_none()
        if not admin_user:
            admin_user = User(
                email=admin_email,
                password_hash=hash_password("CareTech2026!AdminSecured"),
                full_name="Alexis Tarrifa (Super Admin)",
                role=UserRole.SUPER_ADMIN,
                is_active=True,
                mfa_secret=generate_totp_secret(),
                mfa_enabled=False  # Se activará al enrolar 2FA
            )
            session.add(admin_user)
            print(f"👤 Super Admin inicial creado: {admin_email}")

        await session.commit()
    print("🚀 Base de datos inicializada y sembrada con éxito.")


if __name__ == "__main__":
    asyncio.run(init_database())
