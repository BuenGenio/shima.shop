-- Default app.settings for logging (log-drivers: multiple targets work concurrently)
INSERT OR IGNORE INTO settings (key, value) VALUES ('app.settings', '{"log-level":"info","log-drivers":["console"]}');
