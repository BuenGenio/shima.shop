-- Seed sample page views for demo (optional - only if table is empty)
INSERT OR IGNORE INTO page_views (path, referrer, user_agent, referrer_host, created_at)
SELECT '/', 'https://google.com/', 'Mozilla/5.0 Chrome/120.0', 'google.com', datetime('now', '-7 days')
WHERE (SELECT COUNT(*) FROM page_views) = 0;
