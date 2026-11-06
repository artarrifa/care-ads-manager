# Runbook de Operaciones & Despliegue — Care Ads Manager V1.0

## 1. Requisitos del Entorno de Ejecución
- **Sistema Operativo**: Linux (Ubuntu 22.04 LTS / Debian 12) o macOS.
- **Python**: 3.10 o superior (gestionado con `uv`).
- **PostgreSQL**: 15 o superior.
- **Reverse Proxy**: NGINX o Cloudflare con SSL/TLS (Let's Encrypt).

---

## 2. Variables de Entorno de Producción (`.env`)

```ini
APP_NAME="Care Ads Manager"
ENVIRONMENT="production"
PORT=8000
DATABASE_URL="postgresql+asyncpg://care_ads_user:SuperSecretPassword123@localhost:5432/care_ads_db"
JWT_SECRET_KEY="GENERAR_CADENA_HEX_64_CARACTERES_ALEATORIA"
JWT_ALGORITHM="HS256"
JWT_EXPIRE_MINUTES=60
CORS_ORIGINS=["https://caretechservices.com","https://games.caretechservices.com"]
CARE_ADMIN_API_KEY="CLAVE_SECRETA_ADMIN_BRIDGE_PHP"
```

---

## 3. Comandos de Operación Estándar

### 3.1. Inicialización de Base de Datos y Super Admin
```bash
cd care-ads/backend
uv run python app/init_db.py
```

### 3.2. Ejecución de Migraciones de Base de Datos
```bash
cd care-ads/backend
uv run alembic upgrade head
```

### 3.3. Puesta en Marcha del Servicio (Systemd Service)
Crear archivo `/etc/systemd/system/care-ads.service`:
```ini
[Unit]
Description=Care Ads Manager V1.0 API Service
After=network.target postgresql.service

[Service]
User=www-data
WorkingDirectory=/var/www/care-ads/backend
ExecStart=/root/.cargo/bin/uv run uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 4
Restart=always
RestartSec=5
EnvironmentFile=/var/www/care-ads/backend/.env

[Install]
WantedBy=multi-user.target
```

Habilitar e iniciar servicio:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now care-ads
sudo systemctl status care-ads
```

---

## 4. Política de Copias de Seguridad (Backups)

### 4.1. Backup Diario de PostgreSQL
```bash
pg_dump -U care_ads_user -h localhost -Fc care_ads_db > /backup/care_ads_db_$(date +%Y%m%d_%H%M%S).dump
```

### 4.2. Retención
- Retención horaria: 24 horas.
- Retención diaria: 30 días.
- Retención mensual: 12 meses (para auditoría tributaria y contractual).
