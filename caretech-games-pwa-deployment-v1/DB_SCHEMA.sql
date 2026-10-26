-- ==============================================================================
-- CareTech Games & Ads Platform - Database Schema (V2)
-- Compatible with SQLite, PostgreSQL, MySQL / MariaDB
-- ==============================================================================

-- 1. Tabla de Campañas Publicitarias
CREATE TABLE IF NOT EXISTS ad_campaigns (
  id VARCHAR(64) PRIMARY KEY,
  advertiser_email VARCHAR(128) NOT NULL,
  advertiser_phone VARCHAR(32),
  brand_name VARCHAR(128) NOT NULL,
  headline VARCHAR(120) NOT NULL,
  description VARCHAR(250) NOT NULL,
  logo_url TEXT,
  web_url TEXT NOT NULL,
  donation_url TEXT,
  shop_url TEXT,
  game_id VARCHAR(32) NOT NULL DEFAULT 'solitario',
  placement VARCHAR(16) NOT NULL DEFAULT 'top', -- 'top' o 'bottom'
  plan_id VARCHAR(32) NOT NULL, -- 'entrada', 'presencia', 'diario', 'frecuente', 'intensivo', 'maximo'
  has_priority BOOLEAN DEFAULT FALSE,
  status VARCHAR(32) NOT NULL DEFAULT 'PENDING_PAYMENT', 
  -- Statuses: PENDING_PAYMENT, PAID, PENDING_REVIEW, AUTHORIZED, WAITLISTED, SCHEDULED, ACTIVE, PAUSED, EXPIRED, REVOKED
  assigned_slot_minute INT, -- 0 a 59
  starts_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Órdenes y Pagos
CREATE TABLE IF NOT EXISTS ad_orders (
  id VARCHAR(64) PRIMARY KEY,
  campaign_id VARCHAR(64) NOT NULL,
  payment_method VARCHAR(32) NOT NULL, -- 'PAYPAL', 'BINANCE_PAY', 'CRYPTO'
  amount_usd DECIMAL(10,2) NOT NULL,
  amount_cop DECIMAL(14,2),
  currency VARCHAR(8) NOT NULL,
  payment_gateway_ref VARCHAR(128),
  payment_status VARCHAR(32) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'DECLINED', 'VOIDED'
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES ad_campaigns(id)
);

-- 3. Tabla de Analítica Agregada Diaria (Por Juego, País y Evento)
CREATE TABLE IF NOT EXISTS game_analytics_daily (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  game_id VARCHAR(32) NOT NULL,
  country_code VARCHAR(8) NOT NULL DEFAULT 'XX', -- 'CO', 'ES', 'US', etc.
  new_activations INT DEFAULT 0,
  pwa_installs INT DEFAULT 0,
  ad_impressions INT DEFAULT 0,
  ad_clicks INT DEFAULT 0,
  ad_donation_clicks INT DEFAULT 0,
  ad_shop_clicks INT DEFAULT 0,
  total_revenue_usd DECIMAL(10,2) DEFAULT 0.00,
  UNIQUE(date, game_id, country_code)
);

-- 4. Índices de Búsqueda Rápida para el Scheduler
CREATE INDEX IF NOT EXISTS idx_campaigns_scheduler ON ad_campaigns(game_id, placement, status, assigned_slot_minute);
CREATE INDEX IF NOT EXISTS idx_analytics_query ON game_analytics_daily(game_id, date, country_code);
