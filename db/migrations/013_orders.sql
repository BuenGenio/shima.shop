-- Orders: incomplete orders cloned from kits, upgraded to Consignment when shipping added
-- Full audit trail in order_events for compliance

CREATE TABLE IF NOT EXISTS orders (
  id              TEXT PRIMARY KEY,
  kit_id          TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'draft',
  currency        TEXT NOT NULL DEFAULT 'JPY',
  -- Shipping (to/from) - when set, status upgrades to consignment
  from_name       TEXT,
  from_address    TEXT,
  from_country    TEXT,
  from_tel        TEXT,
  from_email      TEXT,
  to_name         TEXT,
  to_address      TEXT,
  to_country      TEXT,
  to_tel          TEXT,
  to_email        TEXT,
  -- Consignment options (required before charge)
  carrier_name    TEXT,
  pickup_date     TEXT,
  pickup_time     TEXT,
  pickup_address  TEXT,
  pickup_notes    TEXT,
  service         TEXT,
  -- Metadata
  data            TEXT NOT NULL DEFAULT '{}',
  created_at      TEXT DEFAULT (datetime('now')),
  updated_at      TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (kit_id) REFERENCES kits(id)
);

CREATE TABLE IF NOT EXISTS order_items (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id    TEXT NOT NULL,
  product_id  TEXT NOT NULL,
  quantity    INTEGER NOT NULL DEFAULT 1,
  unit_price  REAL NOT NULL,
  data        TEXT NOT NULL DEFAULT '{}',
  created_at  TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS order_charges (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id      TEXT NOT NULL,
  description   TEXT NOT NULL,
  amount        REAL NOT NULL,
  currency      TEXT NOT NULL,
  quantity      INTEGER NOT NULL DEFAULT 1,
  data          TEXT NOT NULL DEFAULT '{}',
  created_at    TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Audit: every access/update to an order
CREATE TABLE IF NOT EXISTS order_events (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id      TEXT NOT NULL,
  activity      TEXT NOT NULL,
  user_id       TEXT,
  -- Origin / compliance
  origin_ip     TEXT,
  origin_country TEXT,
  user_agent    TEXT,
  technology    TEXT,
  method        TEXT,
  payload       TEXT DEFAULT '{}',
  created_at    TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_kit ON orders(kit_id);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_charges_order ON order_charges(order_id);
CREATE INDEX IF NOT EXISTS idx_order_events_order ON order_events(order_id);
CREATE INDEX IF NOT EXISTS idx_order_events_created ON order_events(created_at);
