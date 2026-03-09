-- Extend page_views for analytics dashboards
ALTER TABLE page_views ADD COLUMN user_agent TEXT DEFAULT '';
ALTER TABLE page_views ADD COLUMN referrer_host TEXT DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_page_views_referrer ON page_views(referrer);
CREATE INDEX IF NOT EXISTS idx_page_views_referrer_host ON page_views(referrer_host);
