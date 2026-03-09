-- Settings scopes
INSERT OR IGNORE INTO tags (id, data) VALUES ('t-settings-mail',          '{"name":"Mail","slug":"mail","scope":"settings","color":"#6366f1","description":"Email / SMTP configuration"}');
INSERT OR IGNORE INTO tags (id, data) VALUES ('t-settings-notifications', '{"name":"Notifications","slug":"notifications","scope":"settings","color":"#8b5cf6","description":"Push, SMS & in-app notification settings"}');
INSERT OR IGNORE INTO tags (id, data) VALUES ('t-settings-jobs',          '{"name":"Scheduled Jobs","slug":"scheduled-jobs","scope":"settings","color":"#a855f7","description":"Cron tasks, background workers"}');
INSERT OR IGNORE INTO tags (id, data) VALUES ('t-settings-layout',        '{"name":"Layout","slug":"layout","scope":"settings","color":"#d946ef","description":"Theme, header, footer, navigation"}');
INSERT OR IGNORE INTO tags (id, data) VALUES ('t-settings-styles',        '{"name":"Styles","slug":"styles","scope":"settings","color":"#ec4899","description":"Colors, fonts, CSS custom properties"}');
INSERT OR IGNORE INTO tags (id, data) VALUES ('t-settings-seo',           '{"name":"SEO","slug":"seo","scope":"settings","color":"#f43f5e","description":"Meta tags, Open Graph, sitemap"}');
INSERT OR IGNORE INTO tags (id, data) VALUES ('t-settings-analytics',     '{"name":"Analytics","slug":"analytics","scope":"settings","color":"#ef4444","description":"Tracking, reporting, dashboards"}');
INSERT OR IGNORE INTO tags (id, data) VALUES ('t-settings-security',      '{"name":"Security","slug":"security","scope":"settings","color":"#f97316","description":"Auth, CORS, rate limiting, CSP"}');
INSERT OR IGNORE INTO tags (id, data) VALUES ('t-settings-integrations',  '{"name":"Integrations","slug":"integrations","scope":"settings","color":"#eab308","description":"Third-party APIs and webhooks"}');
INSERT OR IGNORE INTO tags (id, data) VALUES ('t-settings-localization',  '{"name":"Localization","slug":"localization","scope":"settings","color":"#84cc16","description":"Languages, date/time formats, regions"}');
INSERT OR IGNORE INTO tags (id, data) VALUES ('t-settings-media',         '{"name":"Media","slug":"media","scope":"settings","color":"#22c55e","description":"Image optimization, CDN, file uploads"}');

-- Product categories (replaces the static categories table)
INSERT OR IGNORE INTO tags (id, data) VALUES ('t-cat-cookies',    '{"name":"Cookies","slug":"cookies","scope":"category","color":"#8B5E3C","description":"Protein cookies — gluten-free, made in Japan"}');
INSERT OR IGNORE INTO tags (id, data) VALUES ('t-cat-sets',       '{"name":"Sets","slug":"sets","scope":"category","color":"#5b6eae","description":"Multi-pack cookie sets"}');
INSERT OR IGNORE INTO tags (id, data) VALUES ('t-cat-bulk',       '{"name":"Bulk","slug":"bulk","scope":"category","color":"#2c7a3e","description":"Bulk & business orders"}');
INSERT OR IGNORE INTO tags (id, data) VALUES ('t-cat-limited',    '{"name":"Limited Edition","slug":"limited-edition","scope":"category","color":"#c026d3","description":"Seasonal and limited-run products"}');

-- Product attributes / filters
INSERT OR IGNORE INTO tags (id, data) VALUES ('t-attr-gluten-free', '{"name":"Gluten-Free","slug":"gluten-free","scope":"attribute","color":"#16a34a","description":"Contains no gluten"}');
INSERT OR IGNORE INTO tags (id, data) VALUES ('t-attr-protein',    '{"name":"High Protein","slug":"high-protein","scope":"attribute","color":"#2563eb","description":"10g+ protein per serving"}');
INSERT OR IGNORE INTO tags (id, data) VALUES ('t-attr-vegan',      '{"name":"Vegan","slug":"vegan","scope":"attribute","color":"#65a30d","description":"No animal products"}');

-- Shipping classification
INSERT OR IGNORE INTO tags (id, data) VALUES ('t-ship-domestic',      '{"name":"Domestic","slug":"domestic","scope":"shipping","color":"#0891b2","description":"Japan domestic shipping"}');
INSERT OR IGNORE INTO tags (id, data) VALUES ('t-ship-international', '{"name":"International","slug":"international","scope":"shipping","color":"#0d9488","description":"Cross-border shipping"}');
INSERT OR IGNORE INTO tags (id, data) VALUES ('t-ship-express',       '{"name":"Express","slug":"express","scope":"shipping","color":"#059669","description":"Next-day / priority delivery"}');
INSERT OR IGNORE INTO tags (id, data) VALUES ('t-ship-economy',       '{"name":"Economy","slug":"economy","scope":"shipping","color":"#4ade80","description":"Standard / budget delivery"}');

-- Status flags (applicable to any entity)
INSERT OR IGNORE INTO tags (id, data) VALUES ('t-status-active',   '{"name":"Active","slug":"active","scope":"status","color":"#22c55e","description":"Live and visible"}');
INSERT OR IGNORE INTO tags (id, data) VALUES ('t-status-draft',    '{"name":"Draft","slug":"draft","scope":"status","color":"#a3a3a3","description":"Not yet published"}');
INSERT OR IGNORE INTO tags (id, data) VALUES ('t-status-featured', '{"name":"Featured","slug":"featured","scope":"status","color":"#f59e0b","description":"Highlighted / promoted"}');
INSERT OR IGNORE INTO tags (id, data) VALUES ('t-status-sale',     '{"name":"On Sale","slug":"on-sale","scope":"status","color":"#ef4444","description":"Discounted pricing active"}');
INSERT OR IGNORE INTO tags (id, data) VALUES ('t-status-archived', '{"name":"Archived","slug":"archived","scope":"status","color":"#737373","description":"Hidden, kept for records"}');

-- Assign category tags to existing products
INSERT OR IGNORE INTO tag_assignments (tag_id, entity_type, entity_id) VALUES ('t-cat-cookies', 'products', 'p1');
INSERT OR IGNORE INTO tag_assignments (tag_id, entity_type, entity_id) VALUES ('t-cat-cookies', 'products', 'p2');
INSERT OR IGNORE INTO tag_assignments (tag_id, entity_type, entity_id) VALUES ('t-cat-cookies', 'products', 'p3');
INSERT OR IGNORE INTO tag_assignments (tag_id, entity_type, entity_id) VALUES ('t-cat-cookies', 'products', 'p4');
INSERT OR IGNORE INTO tag_assignments (tag_id, entity_type, entity_id) VALUES ('t-cat-cookies', 'products', 'p5');
INSERT OR IGNORE INTO tag_assignments (tag_id, entity_type, entity_id) VALUES ('t-cat-cookies', 'products', 'p6');
INSERT OR IGNORE INTO tag_assignments (tag_id, entity_type, entity_id) VALUES ('t-cat-cookies', 'products', 'p7');
INSERT OR IGNORE INTO tag_assignments (tag_id, entity_type, entity_id) VALUES ('t-cat-cookies', 'products', 'p8');
INSERT OR IGNORE INTO tag_assignments (tag_id, entity_type, entity_id) VALUES ('t-cat-cookies', 'products', 'p9');
INSERT OR IGNORE INTO tag_assignments (tag_id, entity_type, entity_id) VALUES ('t-cat-cookies', 'products', 'p10');
INSERT OR IGNORE INTO tag_assignments (tag_id, entity_type, entity_id) VALUES ('t-cat-cookies', 'products', 'p11');
INSERT OR IGNORE INTO tag_assignments (tag_id, entity_type, entity_id) VALUES ('t-cat-cookies', 'products', 'p12');
INSERT OR IGNORE INTO tag_assignments (tag_id, entity_type, entity_id) VALUES ('t-cat-cookies', 'products', 'p13');
INSERT OR IGNORE INTO tag_assignments (tag_id, entity_type, entity_id) VALUES ('t-cat-cookies', 'products', 'p14');
INSERT OR IGNORE INTO tag_assignments (tag_id, entity_type, entity_id) VALUES ('t-cat-cookies', 'products', 'p15');
INSERT OR IGNORE INTO tag_assignments (tag_id, entity_type, entity_id) VALUES ('t-cat-cookies', 'products', 'p16');
INSERT OR IGNORE INTO tag_assignments (tag_id, entity_type, entity_id) VALUES ('t-cat-cookies', 'products', 'p17');
INSERT OR IGNORE INTO tag_assignments (tag_id, entity_type, entity_id) VALUES ('t-cat-cookies', 'products', 'p18');
INSERT OR IGNORE INTO tag_assignments (tag_id, entity_type, entity_id) VALUES ('t-cat-cookies', 'products', 'p19');
INSERT OR IGNORE INTO tag_assignments (tag_id, entity_type, entity_id) VALUES ('t-cat-cookies', 'products', 'p20');
INSERT OR IGNORE INTO tag_assignments (tag_id, entity_type, entity_id) VALUES ('t-cat-cookies', 'products', 'p21');
INSERT OR IGNORE INTO tag_assignments (tag_id, entity_type, entity_id) VALUES ('t-cat-cookies', 'products', 'p22');

INSERT OR IGNORE INTO tag_assignments (tag_id, entity_type, entity_id) VALUES ('t-cat-sets', 'products', 'p2');
INSERT OR IGNORE INTO tag_assignments (tag_id, entity_type, entity_id) VALUES ('t-cat-sets', 'products', 'p3');
INSERT OR IGNORE INTO tag_assignments (tag_id, entity_type, entity_id) VALUES ('t-cat-sets', 'products', 'p4');
INSERT OR IGNORE INTO tag_assignments (tag_id, entity_type, entity_id) VALUES ('t-cat-sets', 'products', 'p5');
INSERT OR IGNORE INTO tag_assignments (tag_id, entity_type, entity_id) VALUES ('t-cat-sets', 'products', 'p6');
INSERT OR IGNORE INTO tag_assignments (tag_id, entity_type, entity_id) VALUES ('t-cat-sets', 'products', 'p10');
INSERT OR IGNORE INTO tag_assignments (tag_id, entity_type, entity_id) VALUES ('t-cat-sets', 'products', 'p11');
INSERT OR IGNORE INTO tag_assignments (tag_id, entity_type, entity_id) VALUES ('t-cat-sets', 'products', 'p12');
INSERT OR IGNORE INTO tag_assignments (tag_id, entity_type, entity_id) VALUES ('t-cat-sets', 'products', 'p13');
INSERT OR IGNORE INTO tag_assignments (tag_id, entity_type, entity_id) VALUES ('t-cat-sets', 'products', 'p14');
INSERT OR IGNORE INTO tag_assignments (tag_id, entity_type, entity_id) VALUES ('t-cat-sets', 'products', 'p20');
INSERT OR IGNORE INTO tag_assignments (tag_id, entity_type, entity_id) VALUES ('t-cat-sets', 'products', 'p21');

INSERT OR IGNORE INTO tag_assignments (tag_id, entity_type, entity_id) VALUES ('t-cat-bulk', 'products', 'p11');
INSERT OR IGNORE INTO tag_assignments (tag_id, entity_type, entity_id) VALUES ('t-cat-bulk', 'products', 'p22');

INSERT OR IGNORE INTO tag_assignments (tag_id, entity_type, entity_id) VALUES ('t-cat-limited', 'products', 'p19');

-- Gluten-free attribute on all products
INSERT OR IGNORE INTO tag_assignments (tag_id, entity_type, entity_id) VALUES ('t-attr-gluten-free', 'products', 'p1');
INSERT OR IGNORE INTO tag_assignments (tag_id, entity_type, entity_id) VALUES ('t-attr-gluten-free', 'products', 'p2');
INSERT OR IGNORE INTO tag_assignments (tag_id, entity_type, entity_id) VALUES ('t-attr-gluten-free', 'products', 'p3');
INSERT OR IGNORE INTO tag_assignments (tag_id, entity_type, entity_id) VALUES ('t-attr-gluten-free', 'products', 'p4');
INSERT OR IGNORE INTO tag_assignments (tag_id, entity_type, entity_id) VALUES ('t-attr-gluten-free', 'products', 'p5');
INSERT OR IGNORE INTO tag_assignments (tag_id, entity_type, entity_id) VALUES ('t-attr-gluten-free', 'products', 'p6');
INSERT OR IGNORE INTO tag_assignments (tag_id, entity_type, entity_id) VALUES ('t-attr-gluten-free', 'products', 'p15');
INSERT OR IGNORE INTO tag_assignments (tag_id, entity_type, entity_id) VALUES ('t-attr-gluten-free', 'products', 'p16');
INSERT OR IGNORE INTO tag_assignments (tag_id, entity_type, entity_id) VALUES ('t-attr-gluten-free', 'products', 'p19');
INSERT OR IGNORE INTO tag_assignments (tag_id, entity_type, entity_id) VALUES ('t-attr-gluten-free', 'products', 'p22');

-- High protein on all products
INSERT OR IGNORE INTO tag_assignments (tag_id, entity_type, entity_id) VALUES ('t-attr-protein', 'products', 'p1');
INSERT OR IGNORE INTO tag_assignments (tag_id, entity_type, entity_id) VALUES ('t-attr-protein', 'products', 'p7');
INSERT OR IGNORE INTO tag_assignments (tag_id, entity_type, entity_id) VALUES ('t-attr-protein', 'products', 'p8');
INSERT OR IGNORE INTO tag_assignments (tag_id, entity_type, entity_id) VALUES ('t-attr-protein', 'products', 'p9');
INSERT OR IGNORE INTO tag_assignments (tag_id, entity_type, entity_id) VALUES ('t-attr-protein', 'products', 'p10');
INSERT OR IGNORE INTO tag_assignments (tag_id, entity_type, entity_id) VALUES ('t-attr-protein', 'products', 'p12');
INSERT OR IGNORE INTO tag_assignments (tag_id, entity_type, entity_id) VALUES ('t-attr-protein', 'products', 'p13');
INSERT OR IGNORE INTO tag_assignments (tag_id, entity_type, entity_id) VALUES ('t-attr-protein', 'products', 'p14');
INSERT OR IGNORE INTO tag_assignments (tag_id, entity_type, entity_id) VALUES ('t-attr-protein', 'products', 'p17');
INSERT OR IGNORE INTO tag_assignments (tag_id, entity_type, entity_id) VALUES ('t-attr-protein', 'products', 'p18');
INSERT OR IGNORE INTO tag_assignments (tag_id, entity_type, entity_id) VALUES ('t-attr-protein', 'products', 'p19');

-- Shipping classification
INSERT OR IGNORE INTO tag_assignments (tag_id, entity_type, entity_id) VALUES ('t-ship-domestic', 'shipping_methods', 's1');
INSERT OR IGNORE INTO tag_assignments (tag_id, entity_type, entity_id) VALUES ('t-ship-express',  'shipping_methods', 's1');
INSERT OR IGNORE INTO tag_assignments (tag_id, entity_type, entity_id) VALUES ('t-ship-international', 'shipping_methods', 's2');
INSERT OR IGNORE INTO tag_assignments (tag_id, entity_type, entity_id) VALUES ('t-ship-economy',       'shipping_methods', 's2');
INSERT OR IGNORE INTO tag_assignments (tag_id, entity_type, entity_id) VALUES ('t-ship-international', 'shipping_methods', 's3');
INSERT OR IGNORE INTO tag_assignments (tag_id, entity_type, entity_id) VALUES ('t-ship-express',       'shipping_methods', 's3');
INSERT OR IGNORE INTO tag_assignments (tag_id, entity_type, entity_id) VALUES ('t-ship-international', 'shipping_methods', 's4');
INSERT OR IGNORE INTO tag_assignments (tag_id, entity_type, entity_id) VALUES ('t-ship-express',       'shipping_methods', 's4');
INSERT OR IGNORE INTO tag_assignments (tag_id, entity_type, entity_id) VALUES ('t-ship-international', 'shipping_methods', 's5');

-- Settings classification
INSERT OR IGNORE INTO tag_assignments (tag_id, entity_type, entity_id) VALUES ('t-settings-mail',         'settings', 'mail');
INSERT OR IGNORE INTO tag_assignments (tag_id, entity_type, entity_id) VALUES ('t-settings-integrations', 'settings', 'payment_providers');

-- Active status on seeded entities
INSERT OR IGNORE INTO tag_assignments (tag_id, entity_type, entity_id) VALUES ('t-status-active', 'kits', 'k1');
