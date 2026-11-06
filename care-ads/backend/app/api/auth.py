from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel, EmailStr
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import timedelta
from app.core.database import get_db
from app.core.security import (
    verify_password, create_access_token, generate_totp_secret, 
    get_totp_uri, generate_qr_code_base64, verify_totp_code
)
from app.core.dependencies import get_current_user
from app.core.audit import record_audit_event
from app.models import User, UserRole

router = APIRouter(prefix="/auth", tags=["Autenticación & 2FA"])


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    totp_code: Optional[str] = None


class LoginResponse(BaseModel):
    access_token: Optional[str] = None
    token_type: str = "bearer"
    mfa_required: bool = False
    temp_token: Optional[str] = None
    user: Optional[dict] = None


class MFASetupResponse(BaseModel):
    secret: str
    otpauth_uri: str
    qr_code_base64: str


class MFAVerifyRequest(BaseModel):
    code: str


@router.post("/login", response_model=LoginResponse)
async def login(req: LoginRequest, request: Request, db: AsyncSession = Depends(get_db)):
    """
    Autentica un usuario con contraseña (Argon2id) y solicita código 2FA si está habilitado.
    """
    res = await db.execute(select(User).where(User.email == req.email.lower()))
    user = res.scalar_one_or_none()
    
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas (correo o contraseña no válidos)."
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="La cuenta de usuario está desactivada."
        )
    
    client_ip = request.client.host if request.client else "unknown"
    
    # Si tiene 2FA habilitado pero no envió el código totp
    if user.mfa_enabled:
        if not req.totp_code:
            # Emitir token temporal para el segundo factor (validez de 5 minutos)
            temp_token = create_access_token(
                data={"sub": str(user.id), "scope": "mfa_pending"},
                expires_delta=timedelta(minutes=5)
            )
            return LoginResponse(
                mfa_required=True,
                temp_token=temp_token
            )
        
        # Validar el código TOTP de 6 dígitos
        if not verify_totp_code(user.mfa_secret, req.totp_code):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Código de autenticación 2FA incorrecto o expirado."
            )
    
    # Credenciales válidas -> emitir token de sesión completo
    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role.value, "email": user.email}
    )
    
    await record_audit_event(
        db=db,
        action="USER_LOGIN_SUCCESS",
        resource_type="User",
        resource_id=str(user.id),
        actor_id=str(user.id),
        actor_email=user.email,
        ip_address=client_ip,
        note="Inicio de sesión exitoso" + (" con 2FA" if user.mfa_enabled else "")
    )
    await db.commit()
    
    return LoginResponse(
        access_token=access_token,
        mfa_required=False,
        user={
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role.value,
            "mfa_enabled": user.mfa_enabled
        }
    )


@router.post("/mfa/setup", response_model=MFASetupResponse)
async def setup_mfa(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Genera una nueva semilla TOTP y el código QR para enrolar la cuenta en Google Authenticator / Authy.
    """
    secret = generate_totp_secret()
    current_user.mfa_secret = secret
    await db.commit()
    
    uri = get_totp_uri(secret, current_user.email)
    qr_b64 = generate_qr_code_base64(uri)
    
    return MFASetupResponse(
        secret=secret,
        otpauth_uri=uri,
        qr_code_base64=qr_b64
    )


@router.post("/mfa/verify")
async def verify_and_enable_mfa(
    req: MFAVerifyRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Verifica un código de 6 dígitos para confirmar y activar definitivamente el 2FA en la cuenta.
    """
    if not current_user.mfa_secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Debe iniciar la configuración 2FA primero."
        )
    
    if not verify_totp_code(current_user.mfa_secret, req.code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Código de verificación 2FA no válido."
        )
    
    current_user.mfa_enabled = True
    
    await record_audit_event(
        db=db,
        action="MFA_ENABLED",
        resource_type="User",
        resource_id=str(current_user.id),
        actor_id=str(current_user.id),
        actor_email=current_user.email,
        note="Autenticación de Dos Factores (2FA) activada exitosamente."
    )
    await db.commit()
    
    return {"success": True, "message": "Autenticación de Dos Factores (2FA) activada con éxito."}
