-- Payment provider external ID mappings (for product/subscription sync)
CREATE TABLE IF NOT EXISTS product_external_ids (
  product_id   TEXT NOT NULL,
  provider     TEXT NOT NULL,
  external_id  TEXT NOT NULL,
  external_data TEXT DEFAULT '{}',
  created_at   TEXT DEFAULT (datetime('now')),
  updated_at   TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (product_id, provider),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS subscription_external_ids (
  subscription_id TEXT NOT NULL,
  provider        TEXT NOT NULL,
  external_id     TEXT NOT NULL,
  external_data   TEXT DEFAULT '{}',
  created_at      TEXT DEFAULT (datetime('now')),
  updated_at      TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (subscription_id, provider),
  FOREIGN KEY (subscription_id) REFERENCES subscriptions(id)
);

CREATE INDEX IF NOT EXISTS idx_product_external_provider ON product_external_ids(provider);
CREATE INDEX IF NOT EXISTS idx_subscription_external_provider ON subscription_external_ids(provider);
