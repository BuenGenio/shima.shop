-- Products
INSERT OR IGNORE INTO products (id, data) VALUES ('p1',  '{"name":"Protein Cookie Variety 6-Pack","flavor":"","pack_size":"","price":2000,"currency":"JPY","comment":"Gluten-Free | 10g Protein in each cookie"}');
INSERT OR IGNORE INTO products (id, data) VALUES ('p2',  '{"name":"Protein Cookie","flavor":"Cinnamon & Almond","pack_size":"12 Cookie Set","price":3360,"currency":"JPY","comment":"Gluten-Free & Free Shipping"}');
INSERT OR IGNORE INTO products (id, data) VALUES ('p3',  '{"name":"Protein Cookie","flavor":"Double Chocolate","pack_size":"12 Cookie Set","price":3360,"currency":"JPY","comment":"Gluten-Free & Free Shipping"}');
INSERT OR IGNORE INTO products (id, data) VALUES ('p4',  '{"name":"Protein Cookie","flavor":"Chunk Chocolate & Walnut","pack_size":"12 Cookie Set","price":3360,"currency":"JPY","comment":"Gluten-Free & Free Shipping"}');
INSERT OR IGNORE INTO products (id, data) VALUES ('p5',  '{"name":"Protein Cookie Set","flavor":"Chocolate","pack_size":"","price":3000,"currency":"JPY","comment":"Gluten-Free | 10g Protein | Free Shipping Nationwide"}');
INSERT OR IGNORE INTO products (id, data) VALUES ('p6',  '{"name":"Protein Cookie","flavor":"Breakfast Granola","pack_size":"12 Cookie Set","price":3360,"currency":"JPY","comment":"Gluten-Free & Free Shipping"}');
INSERT OR IGNORE INTO products (id, data) VALUES ('p7',  '{"name":"Protein Cookie","flavor":"Double Chocolate","pack_size":"6 Cookies","price":1980,"currency":"JPY","comment":"10g Protein | Made in Japan | Free Shipping in Japan"}');
INSERT OR IGNORE INTO products (id, data) VALUES ('p8',  '{"name":"Protein Cookie","flavor":"Breakfast Granola","pack_size":"6 Cookies","price":1980,"currency":"JPY","comment":"10g Protein | Made in Japan | Free Shipping in Japan"}');
INSERT OR IGNORE INTO products (id, data) VALUES ('p9',  '{"name":"Protein Cookie","flavor":"Matcha & Macadamia","pack_size":"6 Cookies","price":1980,"currency":"JPY","comment":"10g Protein | Made in Japan"}');
INSERT OR IGNORE INTO products (id, data) VALUES ('p10', '{"name":"Protein Cookies Mix Set","flavor":"Mixed","pack_size":"12 Cookies","price":3000,"currency":"JPY","comment":"3 Varieties x 4 Cookies Each | Made in Japan | Free Shipping"}');
INSERT OR IGNORE INTO products (id, data) VALUES ('p11', '{"name":"Protein Cookies Bulk Mix Set","flavor":"Mixed","pack_size":"8 Cookies","price":5700,"currency":"JPY","comment":"3 Varieties x 8 Cookies Each | Made in Japan | Free Shipping"}');
INSERT OR IGNORE INTO products (id, data) VALUES ('p12', '{"name":"Protein Cookie","flavor":"Double Chocolate","pack_size":"24 Cookies","price":6420,"currency":"JPY","comment":"10g Protein | Made in Japan | Free Shipping in Japan"}');
INSERT OR IGNORE INTO products (id, data) VALUES ('p13', '{"name":"Protein Cookie","flavor":"Breakfast Granola","pack_size":"24 Cookies","price":6420,"currency":"JPY","comment":"10g Protein | Made in Japan | Free Shipping"}');
INSERT OR IGNORE INTO products (id, data) VALUES ('p14', '{"name":"Protein Cookie","flavor":"Matcha & Macadamia","pack_size":"24 Cookies","price":6420,"currency":"JPY","comment":"10g Protein | Made in Japan | Free Shipping"}');
INSERT OR IGNORE INTO products (id, data) VALUES ('p15', '{"name":"Protein Cookies","flavor":"Cinnamon & Almond","pack_size":"6 Cookies","price":1980,"currency":"JPY","comment":"Gluten-Free | Free Shipping Nationwide"}');
INSERT OR IGNORE INTO products (id, data) VALUES ('p16', '{"name":"Protein Cookie","flavor":"Chunky Choc & Walnut","pack_size":"6 pieces","price":1980,"currency":"JPY","comment":"Gluten Free | Free Shipping Nationwide"}');
INSERT OR IGNORE INTO products (id, data) VALUES ('p17', '{"name":"Protein Cookie","flavor":"Salted Caramel & Chocolate","pack_size":"","price":1980,"currency":"JPY","comment":"10g Protein | Made in Japan | Free Shipping"}');
INSERT OR IGNORE INTO products (id, data) VALUES ('p18', '{"name":"Protein Cookie Trial Set","flavor":"Mixed","pack_size":"6 Cookies","price":2100,"currency":"JPY","comment":"10g Protein | Made in Japan | Free Shipping"}');
INSERT OR IGNORE INTO products (id, data) VALUES ('p19', '{"name":"White Day Limited Edition","flavor":"Matcha & White Choc + more","pack_size":"6 Cookies","price":2100,"currency":"JPY","comment":"Gluten-Free | 10g Protein Per Cookie"}');
INSERT OR IGNORE INTO products (id, data) VALUES ('p20', '{"name":"Protein Cookie","flavor":"Salted Caramel & Chocolate","pack_size":"12 Cookie Set","price":3360,"currency":"JPY","comment":"Gluten-Free & Free Shipping"}');
INSERT OR IGNORE INTO products (id, data) VALUES ('p21', '{"name":"Protein Cookie","flavor":"Matcha & Macadamia","pack_size":"12 Cookie Set","price":3360,"currency":"JPY","comment":"Gluten-Free & Free Shipping"}');
INSERT OR IGNORE INTO products (id, data) VALUES ('p22', '{"name":"業務用クッキー","flavor":"","pack_size":"48枚","price":9600,"currency":"JPY","comment":"グルテンフリー48枚 (1枚10gプロテイン配合) | 6フレーバー指定可"}');

-- Categories
INSERT OR IGNORE INTO categories (id, data) VALUES ('c1', '{"name":"Cookies","description":"Protein cookies — gluten-free, made in Japan","color":"#8B5E3C"}');
INSERT OR IGNORE INTO categories (id, data) VALUES ('c2', '{"name":"Sets","description":"Multi-pack cookie sets","color":"#5b6eae"}');
INSERT OR IGNORE INTO categories (id, data) VALUES ('c3', '{"name":"Bulk","description":"Bulk & business orders","color":"#2c7a3e"}');

-- Kits (product_ids references the product rows above)
INSERT OR IGNORE INTO kits (id, data) VALUES ('k1', '{"name":"Cookies","tagline":"Protein · Gluten-Free · Made in Japan","bundle_price":78800,"currency":"JPY","color":"#8B5E3C","accent":"#8B5E3C","accentLight":"#faf3ed","product_ids":["p1","p2","p3","p4","p5","p6","p7","p8","p9","p10","p11","p12","p13","p14","p15","p16","p17","p18","p19","p20","p21","p22"]}');

-- Shipping Methods
INSERT OR IGNORE INTO shipping_methods (id, data) VALUES ('s1', '{"name":"Yamato Transport","carrier":"yamato","regions":"Japan (nationwide)","base_cost":0,"currency":"JPY","free_above":1980,"estimated_days":"1-2","yamato_environment":"sandbox","yamato_product_type":"宅急便","yamato_size_code":"80","yamato_temperature":"常温 (Normal)","yamato_payment":"元払い (Prepaid)","yamato_time_slot":"指定なし (Any)","yamato_handling_info":"ワレモノ (Fragile)","yamato_goods_name":"プロテインクッキー","yamato_auto_print":"no"}');
INSERT OR IGNORE INTO shipping_methods (id, data) VALUES ('s2', '{"name":"DPD","carrier":"dpd","regions":"Europe","base_cost":1500,"currency":"JPY","free_above":6000,"estimated_days":"5-10"}');
INSERT OR IGNORE INTO shipping_methods (id, data) VALUES ('s3', '{"name":"DHL Express","carrier":"dhl","regions":"Worldwide","base_cost":2500,"currency":"JPY","free_above":8000,"estimated_days":"3-5"}');
INSERT OR IGNORE INTO shipping_methods (id, data) VALUES ('s4', '{"name":"FedEx International","carrier":"fedex","regions":"Worldwide","base_cost":2800,"currency":"JPY","free_above":8000,"estimated_days":"3-6"}');
INSERT OR IGNORE INTO shipping_methods (id, data) VALUES ('s5', '{"name":"UPS Worldwide","carrier":"ups","regions":"Worldwide","base_cost":2600,"currency":"JPY","free_above":8000,"estimated_days":"4-7"}');

-- Currencies
INSERT OR IGNORE INTO currencies (id, data) VALUES ('cur1', '{"code":"JPY","symbol":"¥","name":"Japanese Yen"}');
INSERT OR IGNORE INTO currencies (id, data) VALUES ('cur2', '{"code":"USD","symbol":"$","name":"US Dollar"}');
INSERT OR IGNORE INTO currencies (id, data) VALUES ('cur3', '{"code":"EUR","symbol":"€","name":"Euro"}');

-- Settings
INSERT OR IGNORE INTO settings (key, value) VALUES ('mail', '{"smtp_host":"","smtp_port":587,"smtp_user":"","smtp_pass":"","smtp_encryption":"tls","from_name":"shima.shop","from_email":""}');
INSERT OR IGNORE INTO settings (key, value) VALUES ('payment_providers', '{"providers":{"stripe":{"enabled":false,"config":{}},"adyen":{"enabled":false,"config":{}},"paypal":{"enabled":false,"config":{}},"airwallex":{"enabled":false,"config":{}},"paydollar":{"enabled":false,"config":{}},"paymehsbc":{"enabled":false,"config":{}},"alipayhk":{"enabled":false,"config":{}},"octopus":{"enabled":false,"config":{}},"twocheckout":{"enabled":false,"config":{}},"verifone":{"enabled":false,"config":{}},"monobank":{"enabled":false,"config":{}}}}');
