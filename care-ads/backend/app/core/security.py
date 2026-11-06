from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
import pyotp
import qrcode
import io
import base64
from app.core.config import settings

ph = PasswordHasher()


def hash_password(password: str) -> str:
    """Hashea una contraseña usando Argon2id."""
    return ph.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica si una contraseña en texto plano coincide con el hash Argon2id."""
    try:
        return ph.verify(hashed_password, plain_password)
    except VerifyMismatchError:
        return False


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Genera un token JWT firmado con expiración segura."""
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "iat": now})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decodifica y valida un token JWT."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None


# ==========================================
# 2FA (Two-Factor Authentication / TOTP)
# ==========================================

def generate_totp_secret() -> str:
    """Genera una clave secreta base32 para TOTP (Google Authenticator / Authy)."""
    return pyotp.random_base32()


def get_totp_uri(secret: str, user_email: str) -> str:
    """Genera la URI otpauth:// para escanear en apps autenticadoras."""
    return pyotp.totp.TOTP(secret).provisioning_uri(
        name=user_email,
        issuer_name=settings.MFA_ISSUER
    )


def generate_qr_code_base64(otpauth_uri: str) -> str:
    """Genera un código QR en imagen PNG Base64 para mostrar al usuario."""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=8,
        border=3,
    )
    qr.add_data(otpauth_uri)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return f"data:image/png;base64,{base64.b64encode(buf.getvalue()).decode()}"


def verify_totp_code(secret: str, code: str) -> bool:
    """Verifica si el código de 6 dígitos ingresado por el usuario es válido."""
    totp = pyotp.TOTP(secret)
    # Permite ventana de tolerancia de 1 intervalo (30s) para mitigar desfase horario
    return totp.verify(code.strip(), valid_window=1)
