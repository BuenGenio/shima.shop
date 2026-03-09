import { SECTIONS } from './sections.js'

export const SEED = {
  products: [
    { id: 'p1',  name: 'Protein Cookie Variety 6-Pack',  flavor: '',                            pack_size: '',              price: 2000, currency: 'JPY', comment: 'Gluten-Free | 10g Protein in each cookie' },
    { id: 'p2',  name: 'Protein Cookie',                 flavor: 'Cinnamon & Almond',           pack_size: '12 Cookie Set', price: 3360, currency: 'JPY', comment: 'Gluten-Free & Free Shipping' },
    { id: 'p3',  name: 'Protein Cookie',                 flavor: 'Double Chocolate',            pack_size: '12 Cookie Set', price: 3360, currency: 'JPY', comment: 'Gluten-Free & Free Shipping' },
    { id: 'p4',  name: 'Protein Cookie',                 flavor: 'Chunk Chocolate & Walnut',    pack_size: '12 Cookie Set', price: 3360, currency: 'JPY', comment: 'Gluten-Free & Free Shipping' },
    { id: 'p5',  name: 'Protein Cookie Set',             flavor: 'Chocolate',                   pack_size: '',              price: 3000, currency: 'JPY', comment: 'Gluten-Free | 10g Protein | Free Shipping Nationwide' },
    { id: 'p6',  name: 'Protein Cookie',                 flavor: 'Breakfast Granola',            pack_size: '12 Cookie Set', price: 3360, currency: 'JPY', comment: 'Gluten-Free & Free Shipping' },
    { id: 'p7',  name: 'Protein Cookie',                 flavor: 'Double Chocolate',            pack_size: '6 Cookies',     price: 1980, currency: 'JPY', comment: '10g Protein | Made in Japan | Free Shipping in Japan' },
    { id: 'p8',  name: 'Protein Cookie',                 flavor: 'Breakfast Granola',            pack_size: '6 Cookies',     price: 1980, currency: 'JPY', comment: '10g Protein | Made in Japan | Free Shipping in Japan' },
    { id: 'p9',  name: 'Protein Cookie',                 flavor: 'Matcha & Macadamia',          pack_size: '6 Cookies',     price: 1980, currency: 'JPY', comment: '10g Protein | Made in Japan' },
    { id: 'p10', name: 'Protein Cookies Mix Set',        flavor: 'Mixed',                       pack_size: '12 Cookies',    price: 3000, currency: 'JPY', comment: '3 Varieties x 4 Cookies Each | Made in Japan | Free Shipping' },
    { id: 'p11', name: 'Protein Cookies Bulk Mix Set',   flavor: 'Mixed',                       pack_size: '8 Cookies',     price: 5700, currency: 'JPY', comment: '3 Varieties x 8 Cookies Each | Made in Japan | Free Shipping' },
    { id: 'p12', name: 'Protein Cookie',                 flavor: 'Double Chocolate',            pack_size: '24 Cookies',    price: 6420, currency: 'JPY', comment: '10g Protein | Made in Japan | Free Shipping in Japan' },
    { id: 'p13', name: 'Protein Cookie',                 flavor: 'Breakfast Granola',            pack_size: '24 Cookies',    price: 6420, currency: 'JPY', comment: '10g Protein | Made in Japan | Free Shipping' },
    { id: 'p14', name: 'Protein Cookie',                 flavor: 'Matcha & Macadamia',          pack_size: '24 Cookies',    price: 6420, currency: 'JPY', comment: '10g Protein | Made in Japan | Free Shipping' },
    { id: 'p15', name: 'Protein Cookies',                flavor: 'Cinnamon & Almond',           pack_size: '6 Cookies',     price: 1980, currency: 'JPY', comment: 'Gluten-Free | Free Shipping Nationwide' },
    { id: 'p16', name: 'Protein Cookie',                 flavor: 'Chunky Choc & Walnut',        pack_size: '6 pieces',      price: 1980, currency: 'JPY', comment: 'Gluten Free | Free Shipping Nationwide' },
    { id: 'p17', name: 'Protein Cookie',                 flavor: 'Salted Caramel & Chocolate',  pack_size: '',              price: 1980, currency: 'JPY', comment: '10g Protein | Made in Japan | Free Shipping' },
    { id: 'p18', name: 'Protein Cookie Trial Set',       flavor: 'Mixed',                       pack_size: '6 Cookies',     price: 2100, currency: 'JPY', comment: '10g Protein | Made in Japan | Free Shipping' },
    { id: 'p19', name: 'White Day Limited Edition',      flavor: 'Matcha & White Choc + more',  pack_size: '6 Cookies',     price: 2100, currency: 'JPY', comment: 'Gluten-Free | 10g Protein Per Cookie' },
    { id: 'p20', name: 'Protein Cookie',                 flavor: 'Salted Caramel & Chocolate',  pack_size: '12 Cookie Set', price: 3360, currency: 'JPY', comment: 'Gluten-Free & Free Shipping' },
    { id: 'p21', name: 'Protein Cookie',                 flavor: 'Matcha & Macadamia',          pack_size: '12 Cookie Set', price: 3360, currency: 'JPY', comment: 'Gluten-Free & Free Shipping' },
    { id: 'p22', name: '業務用クッキー',                    flavor: '',                            pack_size: '48枚',          price: 9600, currency: 'JPY', comment: 'グルテンフリー48枚 (1枚10gプロテイン配合) | 6フレーバー指定可' },
  ],
  categories: [
    { id: 'c1', name: 'Cookies',  description: 'Protein cookies — gluten-free, made in Japan', color: '#8B5E3C' },
    { id: 'c2', name: 'Sets',     description: 'Multi-pack cookie sets',                       color: '#5b6eae' },
    { id: 'c3', name: 'Bulk',     description: 'Bulk & business orders',                       color: '#2c7a3e' },
  ],
  kits: [
    { id: 'k1', name: 'Cookies', tagline: 'Protein · Gluten-Free · Made in Japan', bundle_price: 78800, currency: 'JPY', color: '#8B5E3C' },
  ],
  subscriptions: [],
  shipping: [
    { id: 's1', name: 'Yamato Transport',    carrier: 'yamato', regions: 'Japan (nationwide)', base_cost: 0,    currency: 'JPY', free_above: 1980, estimated_days: '1-2', yamato_environment: 'sandbox', yamato_product_type: '宅急便', yamato_size_code: '80', yamato_temperature: '常温 (Normal)', yamato_payment: '元払い (Prepaid)', yamato_time_slot: '指定なし (Any)', yamato_handling_info: 'ワレモノ (Fragile)', yamato_goods_name: 'プロテインクッキー', yamato_auto_print: 'no' },
    { id: 's2', name: 'DPD',                 carrier: 'dpd',    regions: 'Europe',             base_cost: 1500, currency: 'JPY', free_above: 6000, estimated_days: '5-10' },
    { id: 's3', name: 'DHL Express',         carrier: 'dhl',    regions: 'Worldwide',          base_cost: 2500, currency: 'JPY', free_above: 8000, estimated_days: '3-5' },
    { id: 's4', name: 'FedEx International', carrier: 'fedex',  regions: 'Worldwide',          base_cost: 2800, currency: 'JPY', free_above: 8000, estimated_days: '3-6' },
    { id: 's5', name: 'UPS Worldwide',       carrier: 'ups',    regions: 'Worldwide',          base_cost: 2600, currency: 'JPY', free_above: 8000, estimated_days: '4-7' },
  ],
  currencies: [
    { id: 'cur1', code: 'JPY', symbol: '¥',  name: 'Japanese Yen' },
    { id: 'cur2', code: 'USD', symbol: '$',  name: 'US Dollar' },
    { id: 'cur3', code: 'EUR', symbol: '€',  name: 'Euro' },
  ],
  mail: {
    smtp_host: '',
    smtp_port: 587,
    smtp_user: '',
    smtp_pass: '',
    smtp_encryption: 'tls',
    from_name: 'shima.shop',
    from_email: '',
  },
}

export function seedIfEmpty(Store) {
  for (const key of Object.keys(SECTIONS)) {
    const stored = localStorage.getItem(`admin_${key}`)
    if (!stored && SEED[key]) {
      Store.set(key, SEED[key])
    }
  }
  if (!localStorage.getItem('admin_mail') && SEED.mail) {
    Store.setObj('mail', SEED.mail)
  }
}
