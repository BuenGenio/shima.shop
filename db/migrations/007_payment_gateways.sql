-- Dedicated payment_gateways table for configured payment methods.
-- Each row = one provider + one environment (production, sandbox, test, etc.)
CREATE TABLE IF NOT EXISTS payment_gateways (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  provider    TEXT NOT NULL,
  environment TEXT NOT NULL DEFAULT 'production',
  config      TEXT NOT NULL DEFAULT '{}',
  enabled     INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT DEFAULT (datetime('now')),
  updated_at  TEXT DEFAULT (datetime('now')),
  UNIQUE(provider, environment)
);

CREATE INDEX IF NOT EXISTS idx_payment_gateways_provider ON payment_gateways(provider);
CREATE INDEX IF NOT EXISTS idx_payment_gateways_enabled ON payment_gateways(enabled);
