-- Soft delete support for payment_gateways
ALTER TABLE payment_gateways ADD COLUMN deleted_at TEXT;

CREATE INDEX IF NOT EXISTS idx_payment_gateways_deleted ON payment_gateways(deleted_at);
