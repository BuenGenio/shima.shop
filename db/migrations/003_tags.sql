CREATE TABLE IF NOT EXISTS tags (
  id         TEXT PRIMARY KEY,
  data       TEXT NOT NULL DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tag_assignments (
  tag_id      TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id   TEXT NOT NULL,
  created_at  TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (tag_id, entity_type, entity_id),
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tag_assignments_entity ON tag_assignments(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_tag_assignments_tag ON tag_assignments(tag_id);
