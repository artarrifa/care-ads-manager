# Esquema de Base de Datos PostgreSQL — Care Ads Manager V1.0

## 1. Configuración de Base de Datos
- **Motor**: PostgreSQL 15+
- **Nombre de Base de Datos**: `care_ads_db`
- **Extensión**: `uuid-ossp` o generación nativa de UUID v4.
- **Herramienta de Migración**: Alembic con versionamiento secuencial (`migrations/versions/`).

---

## 2. Diagrama Entidad-Relación (12 Tablas Normalizadas)

```mermaid
erDiagram
    users ||--o{ advertisers : operates
    users ||--o{ audit_events : triggers
    advertisers ||--o{ contracts : accepts
    advertisers ||--o{ campaign_orders : places
    placements ||--o{ campaign_orders : hosts
    campaign_orders ||--o{ creatives : contains
    campaign_orders ||--o{ payments : generates
    campaign_orders ||--o{ ad_decisions : serves
    campaign_orders ||--o{ fulfillment_reports : tracks
    campaign_orders ||--o{ compensations : compensates
    ad_decisions ||--o{ delivery_events : records

    users {
        UUID id PK
        VARCHAR email UK
        VARCHAR hashed_password
        VARCHAR role
        BOOLEAN mfa_enabled
        VARCHAR mfa_secret
        BOOLEAN is_active
        TIMESTAMP created_at
    }

    advertisers {
        UUID id PK
        UUID user_id FK
        VARCHAR company_name
        VARCHAR tax_id
        VARCHAR billing_email
        VARCHAR contact_name
        VARCHAR contact_phone
        TIMESTAMP created_at
    }

    contracts {
        UUID id PK
        UUID advertiser_id FK
        VARCHAR contract_version
        VARCHAR contract_hash
        TEXT terms_text
        TIMESTAMP accepted_at
        VARCHAR signer_ip
    }

    placements {
        UUID id PK
        VARCHAR code UK
        VARCHAR name
        VARCHAR game_id
        VARCHAR position
        INTEGER slots_per_hour
        BOOLEAN is_active
    }

    campaign_orders {
        UUID id PK
        VARCHAR order_code UK
        UUID advertiser_id FK
        UUID placement_id FK
        VARCHAR status
        VARCHAR pricing_model
        TIMESTAMP flight_start
        TIMESTAMP flight_end
        NUMERIC gross_amount_usd
        NUMERIC net_amount_usd
        VARCHAR contract_hash
    }

    creatives {
        UUID id PK
        UUID campaign_order_id FK
        VARCHAR title
        VARCHAR description
        VARCHAR cta_text
        VARCHAR target_url
        VARCHAR logo_url
        VARCHAR status
    }

    payments {
        UUID id PK
        UUID campaign_order_id FK
        VARCHAR reference_code UK
        VARCHAR gateway
        NUMERIC amount_usd
        VARCHAR status
        VARCHAR gateway_tx_id
        JSON raw_webhook_payload
    }

    ad_decisions {
        UUID id PK
        UUID campaign_order_id FK
        UUID placement_id FK
        VARCHAR game_id
        VARCHAR assigned_slot
        TIMESTAMP decided_at
    }

    delivery_events {
        UUID id PK
        UUID decision_id FK
        VARCHAR event_type
        INTEGER viewable_percent
        INTEGER duration_seconds
        TIMESTAMP created_at
    }

    audit_events {
        UUID id PK
        UUID actor_id FK
        VARCHAR action
        VARCHAR resource_type
        UUID resource_id
        JSON previous_state
        JSON new_state
        VARCHAR record_hash
        VARCHAR prev_hash
        TIMESTAMP created_at
    }
```

---

## 3. Índices de Alto Rendimiento
1. `idx_orders_status_flight`: Búsqueda de campañas activas en ventana de emisión actual:
   `CREATE INDEX idx_orders_status_flight ON campaign_orders(status, flight_start, flight_end);`
2. `idx_decisions_placement_time`: Agregación de turnos y telemetría por ubicación:
   `CREATE INDEX idx_decisions_placement_time ON ad_decisions(placement_id, decided_at);`
3. `idx_audit_prev_hash`: Verificación secuencial de la cadena de bloques interna:
   `CREATE INDEX idx_audit_prev_hash ON audit_events(prev_hash);`
