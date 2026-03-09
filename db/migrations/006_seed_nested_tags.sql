-- Product attribute parent groups (children of the top-level "attribute" tags)
INSERT OR IGNORE INTO tags (id, data, parent_id) VALUES ('t-attr-color',  '{"name":"Color","slug":"color","scope":"attribute","color":"#f472b6","description":"Product color variants"}',  NULL);
INSERT OR IGNORE INTO tags (id, data, parent_id) VALUES ('t-attr-size',   '{"name":"Size","slug":"size","scope":"attribute","color":"#38bdf8","description":"Product size variants"}',   NULL);
INSERT OR IGNORE INTO tags (id, data, parent_id) VALUES ('t-attr-weight', '{"name":"Weight","slug":"weight","scope":"attribute","color":"#a78bfa","description":"Product weight classes"}', NULL);
INSERT OR IGNORE INTO tags (id, data, parent_id) VALUES ('t-attr-diet',   '{"name":"Dietary","slug":"dietary","scope":"attribute","color":"#34d399","description":"Dietary classifications"}', NULL);

-- Color children
INSERT OR IGNORE INTO tags (id, data, parent_id) VALUES ('t-attr-color-brown',     '{"name":"Brown","slug":"brown","scope":"attribute","color":"#92400e","description":""}',       't-attr-color');
INSERT OR IGNORE INTO tags (id, data, parent_id) VALUES ('t-attr-color-dark',      '{"name":"Dark","slug":"dark","scope":"attribute","color":"#44403c","description":""}',         't-attr-color');
INSERT OR IGNORE INTO tags (id, data, parent_id) VALUES ('t-attr-color-green',     '{"name":"Green","slug":"green","scope":"attribute","color":"#16a34a","description":""}',       't-attr-color');
INSERT OR IGNORE INTO tags (id, data, parent_id) VALUES ('t-attr-color-golden',    '{"name":"Golden","slug":"golden","scope":"attribute","color":"#ca8a04","description":""}',     't-attr-color');

-- Size children
INSERT OR IGNORE INTO tags (id, data, parent_id) VALUES ('t-attr-size-6',   '{"name":"6 Pack","slug":"6-pack","scope":"attribute","color":"#38bdf8","description":""}',   't-attr-size');
INSERT OR IGNORE INTO tags (id, data, parent_id) VALUES ('t-attr-size-12',  '{"name":"12 Pack","slug":"12-pack","scope":"attribute","color":"#38bdf8","description":""}', 't-attr-size');
INSERT OR IGNORE INTO tags (id, data, parent_id) VALUES ('t-attr-size-24',  '{"name":"24 Pack","slug":"24-pack","scope":"attribute","color":"#38bdf8","description":""}', 't-attr-size');
INSERT OR IGNORE INTO tags (id, data, parent_id) VALUES ('t-attr-size-48',  '{"name":"48 Pack","slug":"48-pack","scope":"attribute","color":"#38bdf8","description":""}', 't-attr-size');

-- Weight children
INSERT OR IGNORE INTO tags (id, data, parent_id) VALUES ('t-attr-weight-light',  '{"name":"Light (< 500g)","slug":"light","scope":"attribute","color":"#a78bfa","description":""}',   't-attr-weight');
INSERT OR IGNORE INTO tags (id, data, parent_id) VALUES ('t-attr-weight-medium', '{"name":"Medium (500g–1kg)","slug":"medium","scope":"attribute","color":"#a78bfa","description":""}', 't-attr-weight');
INSERT OR IGNORE INTO tags (id, data, parent_id) VALUES ('t-attr-weight-heavy',  '{"name":"Heavy (> 1kg)","slug":"heavy","scope":"attribute","color":"#a78bfa","description":""}',    't-attr-weight');

-- Dietary children (nesting under the dietary parent)
INSERT OR IGNORE INTO tags (id, data, parent_id) VALUES ('t-attr-diet-gf',    '{"name":"Gluten-Free","slug":"gluten-free-diet","scope":"attribute","color":"#34d399","description":""}', 't-attr-diet');
INSERT OR IGNORE INTO tags (id, data, parent_id) VALUES ('t-attr-diet-vegan', '{"name":"Vegan","slug":"vegan-diet","scope":"attribute","color":"#34d399","description":""}',             't-attr-diet');
INSERT OR IGNORE INTO tags (id, data, parent_id) VALUES ('t-attr-diet-keto',  '{"name":"Keto","slug":"keto","scope":"attribute","color":"#34d399","description":""}',                    't-attr-diet');
INSERT OR IGNORE INTO tags (id, data, parent_id) VALUES ('t-attr-diet-low-sugar', '{"name":"Low Sugar","slug":"low-sugar","scope":"attribute","color":"#34d399","description":""}',      't-attr-diet');

-- Settings sub-sections (nesting under existing settings tags)
INSERT OR IGNORE INTO tags (id, data, parent_id) VALUES ('t-settings-mail-smtp',  '{"name":"SMTP Config","slug":"smtp-config","scope":"settings","color":"#818cf8","description":"SMTP server connection"}',  't-settings-mail');
INSERT OR IGNORE INTO tags (id, data, parent_id) VALUES ('t-settings-mail-templ', '{"name":"Email Templates","slug":"email-templates","scope":"settings","color":"#818cf8","description":"Transactional email templates"}', 't-settings-mail');

INSERT OR IGNORE INTO tags (id, data, parent_id) VALUES ('t-settings-notif-push',  '{"name":"Push Notifications","slug":"push-notifications","scope":"settings","color":"#c084fc","description":""}',   't-settings-notifications');
INSERT OR IGNORE INTO tags (id, data, parent_id) VALUES ('t-settings-notif-email', '{"name":"Email Notifications","slug":"email-notifications","scope":"settings","color":"#c084fc","description":""}', 't-settings-notifications');
INSERT OR IGNORE INTO tags (id, data, parent_id) VALUES ('t-settings-notif-sms',   '{"name":"SMS Notifications","slug":"sms-notifications","scope":"settings","color":"#c084fc","description":""}',     't-settings-notifications');
