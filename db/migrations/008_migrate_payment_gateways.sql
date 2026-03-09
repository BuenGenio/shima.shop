-- Migrate payment config from settings.payment_providers to payment_gateways
-- Handles both nested (test/production) and legacy flat config
INSERT OR IGNORE INTO payment_gateways (provider, environment, config, enabled, updated_at)
SELECT 
  j.key,
  'production',
  COALESCE(
    json_extract(j.value, '$.config.production'),
    json_extract(j.value, '$.config'),
    '{}'
  ),
  CASE WHEN json_extract(j.value, '$.enabled') = 1 THEN 1 ELSE 0 END,
  datetime('now')
FROM settings s
CROSS JOIN json_each(json_extract(s.value, '$.providers')) j
WHERE s.key = 'payment_providers';

INSERT OR IGNORE INTO payment_gateways (provider, environment, config, enabled, updated_at)
SELECT 
  j.key,
  'sandbox',
  COALESCE(
    json_extract(j.value, '$.config.test'),
    json_extract(j.value, '$.config'),
    '{}'
  ),
  CASE WHEN json_extract(j.value, '$.enabled') = 1 THEN 1 ELSE 0 END,
  datetime('now')
FROM settings s
CROSS JOIN json_each(json_extract(s.value, '$.providers')) j
WHERE s.key = 'payment_providers';

-- Ensure payment_mode exists (default production)
INSERT OR IGNORE INTO settings (key, value) VALUES ('payment_mode', '"production"');
