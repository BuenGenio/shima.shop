export const JP_PREFECTURES = [
  '北海道','青森県','岩手県','宮城県','秋田県','山形県','福島県',
  '茨城県','栃木県','群馬県','埼玉県','千葉県','東京都','神奈川県',
  '新潟県','富山県','石川県','福井県','山梨県','長野県','岐阜県',
  '静岡県','愛知県','三重県','滋賀県','京都府','大阪府','兵庫県',
  '奈良県','和歌山県','鳥取県','島根県','岡山県','広島県','山口県',
  '徳島県','香川県','愛媛県','高知県','福岡県','佐賀県','長崎県',
  '熊本県','大分県','宮崎県','鹿児島県','沖縄県',
]

export const SECTIONS = {
  products: {
    label: 'Product',
    storeKey: 'products',
    columns: [
      { key: 'name',      label: 'Name' },
      { key: 'flavor',    label: 'Flavor' },
      { key: 'pack_size', label: 'Pack Size' },
      { key: 'price',     label: 'Price',    mono: true },
      { key: 'currency',  label: 'Currency' },
    ],
    fields: [
      { key: 'name',      label: 'Name',      type: 'text',     required: true },
      { key: 'flavor',    label: 'Flavor',     type: 'text' },
      { key: 'pack_size', label: 'Pack Size',  type: 'text' },
      { key: 'price',     label: 'Price',      type: 'number',   required: true },
      { key: 'currency',  label: 'Currency',   type: 'text',     required: true },
      { key: 'comment',   label: 'Comment',    type: 'textarea', full: true },
    ],
  },
  categories: {
    label: 'Category',
    storeKey: 'categories',
    columns: [
      { key: 'name',        label: 'Name' },
      { key: 'description', label: 'Description' },
      { key: 'color',       label: 'Color', color: true },
    ],
    fields: [
      { key: 'name',        label: 'Name',        type: 'text',  required: true },
      { key: 'description', label: 'Description',  type: 'textarea', full: true },
      { key: 'color',       label: 'Accent Color', type: 'color' },
    ],
  },
  kits: {
    label: 'Kit',
    storeKey: 'kits',
    columns: [
      { key: 'name',         label: 'Name' },
      { key: 'tagline',      label: 'Tagline' },
      { key: 'bundle_price', label: 'Bundle Price', mono: true },
      { key: 'currency',     label: 'Currency' },
      { key: 'color',        label: 'Color', color: true },
    ],
    fields: [
      { key: 'name',         label: 'Name',         type: 'text',   required: true },
      { key: 'tagline',      label: 'Tagline',       type: 'text' },
      { key: 'bundle_price', label: 'Bundle Price',  type: 'number' },
      { key: 'currency',     label: 'Currency',      type: 'text' },
      { key: 'color',        label: 'Accent Color',  type: 'color' },
    ],
  },
  subscriptions: {
    label: 'Subscription',
    storeKey: 'subscriptions',
    columns: [
      { key: 'name',     label: 'Name' },
      { key: 'interval', label: 'Interval' },
      { key: 'discount', label: 'Discount %', mono: true },
    ],
    fields: [
      { key: 'name',     label: 'Name',       type: 'text',   required: true },
      { key: 'interval', label: 'Interval',    type: 'select', options: ['weekly','biweekly','monthly','quarterly','yearly'] },
      { key: 'discount', label: 'Discount %',  type: 'number' },
      { key: 'description', label: 'Description', type: 'textarea', full: true },
    ],
  },
  shipping: {
    label: 'Shipping Method',
    storeKey: 'shipping',
    columns: [
      { key: 'name',           label: 'Name' },
      { key: 'carrier',        label: 'Carrier' },
      { key: 'regions',        label: 'Regions' },
      { key: 'base_cost',      label: 'Base Cost', mono: true },
      { key: 'estimated_days', label: 'Est. Days' },
    ],
    fields: [
      { key: 'name',           label: 'Name',            type: 'text',   required: true },
      { key: 'carrier',        label: 'Carrier Integration', type: 'select', options: ['none','yamato','dpd','dhl','fedex','ups'] },
      { key: 'regions',        label: 'Regions',          type: 'text',   full: true },
      { key: 'base_cost',      label: 'Base Cost',        type: 'number' },
      { key: 'currency',       label: 'Currency',         type: 'text' },
      { key: 'free_above',     label: 'Free Above',       type: 'number' },
      { key: 'estimated_days', label: 'Estimated Days',   type: 'text' },

      { key: 'yamato_customer_code', label: 'Customer Code (顧客コード)', type: 'text',     group: 'Yamato API Connection', showWhen: 'yamato', required: true },
      { key: 'yamato_api_key',       label: 'API Key / Password',         type: 'password',  group: 'Yamato API Connection', showWhen: 'yamato' },
      { key: 'yamato_environment',   label: 'Environment',                type: 'select',    group: 'Yamato API Connection', showWhen: 'yamato', options: ['sandbox','production'] },

      { key: 'yamato_shipper_company',    label: 'Company (会社名)',       type: 'text', group: 'Shipper Info (荷送人)', showWhen: 'yamato' },
      { key: 'yamato_shipper_name',       label: 'Contact Name (担当者名)', type: 'text', group: 'Shipper Info (荷送人)', showWhen: 'yamato' },
      { key: 'yamato_shipper_name_kana',  label: 'Name Kana (カナ)',       type: 'text', group: 'Shipper Info (荷送人)', showWhen: 'yamato' },
      { key: 'yamato_shipper_postal',     label: 'Postal Code (郵便番号)',  type: 'text', group: 'Shipper Info (荷送人)', showWhen: 'yamato' },
      { key: 'yamato_shipper_prefecture', label: 'Prefecture (都道府県)',   type: 'select', group: 'Shipper Info (荷送人)', showWhen: 'yamato', options: JP_PREFECTURES },
      { key: 'yamato_shipper_city',       label: 'City (市区町村)',         type: 'text', group: 'Shipper Info (荷送人)', showWhen: 'yamato' },
      { key: 'yamato_shipper_address',    label: 'Address (町域・番地)',     type: 'text', group: 'Shipper Info (荷送人)', showWhen: 'yamato', full: true },
      { key: 'yamato_shipper_building',   label: 'Building (建物名)',       type: 'text', group: 'Shipper Info (荷送人)', showWhen: 'yamato' },
      { key: 'yamato_shipper_phone',      label: 'Phone (電話番号)',        type: 'text', group: 'Shipper Info (荷送人)', showWhen: 'yamato' },

      { key: 'yamato_product_type', label: 'Product Type (商品タイプ)',  type: 'select', group: 'Shipping Defaults (配送設定)', showWhen: 'yamato', options: ['宅急便','宅急便コンパクト','ネコポス'] },
      { key: 'yamato_size_code',    label: 'Max Size (サイズ)',          type: 'select', group: 'Shipping Defaults (配送設定)', showWhen: 'yamato', options: ['60','80','100','120','140','160'] },
      { key: 'yamato_temperature',  label: 'Temperature (温度区分)',     type: 'select', group: 'Shipping Defaults (配送設定)', showWhen: 'yamato', options: ['常温 (Normal)','冷蔵 (Refrigerated)','冷凍 (Frozen)'] },
      { key: 'yamato_payment',      label: 'Payment (運賃区分)',         type: 'select', group: 'Shipping Defaults (配送設定)', showWhen: 'yamato', options: ['元払い (Prepaid)','着払い (Collect)','コレクト (COD)'] },
      { key: 'yamato_time_slot',    label: 'Default Time Slot (時間帯)', type: 'select', group: 'Shipping Defaults (配送設定)', showWhen: 'yamato', options: ['指定なし (Any)','午前中 (AM)','14:00-16:00','16:00-18:00','18:00-20:00','19:00-21:00'] },

      { key: 'yamato_remarks',       label: 'Default Remarks (備考)',       type: 'text',     group: 'Label & Invoice (伝票)', showWhen: 'yamato', full: true },
      { key: 'yamato_goods_name',    label: 'Goods Description (品名)',     type: 'text',     group: 'Label & Invoice (伝票)', showWhen: 'yamato' },
      { key: 'yamato_handling_info', label: 'Handling Info (取扱注意)',      type: 'select',   group: 'Label & Invoice (伝票)', showWhen: 'yamato', options: ['なし (None)','ワレモノ (Fragile)','天地無用 (This Side Up)','ナマモノ (Perishable)'] },
      { key: 'yamato_auto_print',    label: 'Auto-print Labels',           type: 'select',   group: 'Label & Invoice (伝票)', showWhen: 'yamato', options: ['no','yes'] },
    ],
  },
  currencies: {
    label: 'Currency',
    storeKey: 'currencies',
    columns: [
      { key: 'code',   label: 'Code' },
      { key: 'symbol', label: 'Symbol' },
      { key: 'name',   label: 'Name' },
    ],
    fields: [
      { key: 'code',   label: 'Code',   type: 'text', required: true },
      { key: 'symbol', label: 'Symbol', type: 'text', required: true },
      { key: 'name',   label: 'Name',   type: 'text', required: true },
    ],
  },
}
