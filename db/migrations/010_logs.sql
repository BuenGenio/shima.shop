-- Application logs table for db log driver
CREATE TABLE IF NOT EXISTS logs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  severity    TEXT NOT NULL DEFAULT 'info',
  type        TEXT NOT NULL DEFAULT 'application',
  message     TEXT NOT NULL,
  metadata    TEXT DEFAULT '{}',
  source      TEXT,
  created_at  TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_logs_severity ON logs(severity);
CREATE INDEX IF NOT EXISTS idx_logs_type ON logs(type);
CREATE INDEX IF NOT EXISTS idx_logs_created ON logs(created_at);
