import hashlib
import json
from datetime import datetime, timezone
from typing import Optional, Any, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.models import AuditEvent


async def record_audit_event(
    db: AsyncSession,
    action: str,
    resource_type: str,
    resource_id: str,
    actor_id: Optional[str] = None,
    actor_email: Optional[str] = None,
    previous_state: Optional[Dict[str, Any]] = None,
    new_state: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None,
    note: Optional[str] = None
) -> AuditEvent:
    """
    Registra un evento de auditoría append-only con encadenamiento criptográfico (SHA-256 hash chaining).
    """
    # Obtener el hash del último evento registrado
    res = await db.execute(
        select(AuditEvent.event_hash).order_by(desc(AuditEvent.timestamp_utc)).limit(1)
    )
    last_hash = res.scalar_one_or_none() or "GENESIS_HASH_CARE_ADS_2026"
    
    timestamp = datetime.now(timezone.utc)
    
    # Construir cadena canónica para el hash
    raw_payload = (
        f"{last_hash}|"
        f"{timestamp.isoformat()}|"
        f"{actor_id or 'SYSTEM'}|"
        f"{action}|"
        f"{resource_type}|"
        f"{resource_id}|"
        f"{note or ''}|"
        f"{json.dumps(previous_state, sort_keys=True, default=str) if previous_state else ''}|"
        f"{json.dumps(new_state, sort_keys=True, default=str) if new_state else ''}"
    )
    
    current_hash = hashlib.sha256(raw_payload.encode("utf-8")).hexdigest()
    
    event = AuditEvent(
        actor_id=actor_id,
        actor_email=actor_email,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        previous_state=previous_state,
        new_state=new_state,
        ip_address=ip_address,
        note=note,
        prev_hash=last_hash,
        event_hash=current_hash,
        timestamp_utc=timestamp
    )
    
    db.add(event)
    await db.flush()
    return event
