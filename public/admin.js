/* ── Storage helpers ──────────────────────────────────────── */

const Store = {
  get(key) {
    try { return JSON.parse(localStorage.getItem(`admin_${key}`)) || []; }
    catch { return []; }
  },
  set(key, data) {
    localStorage.setItem(`admin_${key}`, JSON.stringify(data));
  },
  getObj(key) {
    try { return JSON.parse(localStorage.getItem(`admin_${key}`)) || {}; }
    catch { return {}; }
  },
  setObj(key, data) {
    localStorage.setItem(`admin_${key}`, JSON.stringify(data));
  },
};

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/* ── Yamato reference data ────────────────────────────────── */

const JP_PREFECTURES = [
  '北海道','青森県','岩手県','宮城県','秋田県','山形県','福島県',
  '茨城県','栃木県','群馬県','埼玉県','千葉県','東京都','神奈川県',
  '新潟県','富山県','石川県','福井県','山梨県','長野県','岐阜県',
  '静岡県','愛知県','三重県','滋賀県','京都府','大阪府','兵庫県',
  '奈良県','和歌山県','鳥取県','島根県','岡山県','広島県','山口県',
  '徳島県','香川県','愛媛県','高知県','福岡県','佐賀県','長崎県',
  '熊本県','大分県','宮崎県','鹿児島県','沖縄県',
];

/* ── Section Configs ─────────────────────────────────────── */

const SECTIONS = {
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

      // Yamato API Connection
      { key: 'yamato_customer_code', label: 'Customer Code (顧客コード)', type: 'text',     group: 'Yamato API Connection', showWhen: 'yamato', required: true },
      { key: 'yamato_api_key',       label: 'API Key / Password',         type: 'password',  group: 'Yamato API Connection', showWhen: 'yamato' },
      { key: 'yamato_environment',   label: 'Environment',                type: 'select',    group: 'Yamato API Connection', showWhen: 'yamato', options: ['sandbox','production'] },

      // Yamato Shipper
      { key: 'yamato_shipper_company',    label: 'Company (会社名)',       type: 'text', group: 'Shipper Info (荷送人)', showWhen: 'yamato' },
      { key: 'yamato_shipper_name',       label: 'Contact Name (担当者名)', type: 'text', group: 'Shipper Info (荷送人)', showWhen: 'yamato' },
      { key: 'yamato_shipper_name_kana',  label: 'Name Kana (カナ)',       type: 'text', group: 'Shipper Info (荷送人)', showWhen: 'yamato' },
      { key: 'yamato_shipper_postal',     label: 'Postal Code (郵便番号)',  type: 'text', group: 'Shipper Info (荷送人)', showWhen: 'yamato' },
      { key: 'yamato_shipper_prefecture', label: 'Prefecture (都道府県)',   type: 'select', group: 'Shipper Info (荷送人)', showWhen: 'yamato', options: JP_PREFECTURES },
      { key: 'yamato_shipper_city',       label: 'City (市区町村)',         type: 'text', group: 'Shipper Info (荷送人)', showWhen: 'yamato' },
      { key: 'yamato_shipper_address',    label: 'Address (町域・番地)',     type: 'text', group: 'Shipper Info (荷送人)', showWhen: 'yamato', full: true },
      { key: 'yamato_shipper_building',   label: 'Building (建物名)',       type: 'text', group: 'Shipper Info (荷送人)', showWhen: 'yamato' },
      { key: 'yamato_shipper_phone',      label: 'Phone (電話番号)',        type: 'text', group: 'Shipper Info (荷送人)', showWhen: 'yamato' },

      // Yamato Shipping Defaults
      { key: 'yamato_product_type', label: 'Product Type (商品タイプ)',  type: 'select', group: 'Shipping Defaults (配送設定)', showWhen: 'yamato', options: ['宅急便','宅急便コンパクト','ネコポス'] },
      { key: 'yamato_size_code',    label: 'Max Size (サイズ)',          type: 'select', group: 'Shipping Defaults (配送設定)', showWhen: 'yamato', options: ['60','80','100','120','140','160'] },
      { key: 'yamato_temperature',  label: 'Temperature (温度区分)',     type: 'select', group: 'Shipping Defaults (配送設定)', showWhen: 'yamato', options: ['常温 (Normal)','冷蔵 (Refrigerated)','冷凍 (Frozen)'] },
      { key: 'yamato_payment',      label: 'Payment (運賃区分)',         type: 'select', group: 'Shipping Defaults (配送設定)', showWhen: 'yamato', options: ['元払い (Prepaid)','着払い (Collect)','コレクト (COD)'] },
      { key: 'yamato_time_slot',    label: 'Default Time Slot (時間帯)', type: 'select', group: 'Shipping Defaults (配送設定)', showWhen: 'yamato', options: ['指定なし (Any)','午前中 (AM)','14:00-16:00','16:00-18:00','18:00-20:00','19:00-21:00'] },

      // Yamato Label / Invoice
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
};

/* ── Default seed data ───────────────────────────────────── */

const SEED = {
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
};

function seedIfEmpty() {
  for (const key of Object.keys(SECTIONS)) {
    const stored = localStorage.getItem(`admin_${key}`);
    if (!stored && SEED[key]) {
      Store.set(key, SEED[key]);
    }
  }
  if (!localStorage.getItem('admin_mail') && SEED.mail) {
    Store.setObj('mail', SEED.mail);
  }
}

/* ── Render list/table ───────────────────────────────────── */

function renderSection(sectionKey) {
  const cfg = SECTIONS[sectionKey];
  if (!cfg) return;

  const listEl = document.getElementById(`list-${sectionKey}`);
  if (!listEl) return;

  const items = Store.get(cfg.storeKey);

  if (items.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <p>No ${cfg.label.toLowerCase()}s yet.</p>
        <button class="btn-add" data-section="${sectionKey}">+ Add ${cfg.label}</button>
      </div>`;
    bindAddButtons();
    return;
  }

  const ths = cfg.columns.map(c => `<th>${c.label}</th>`).join('') + '<th></th>';
  const rows = items.map(item => {
    const tds = cfg.columns.map(c => {
      const val = item[c.key] ?? '';
      if (c.color && val) {
        return `<td><span class="color-swatch" style="background:${val}"></span>${val}</td>`;
      }
      if (c.mono) return `<td style="font-family:var(--mono)">${val}</td>`;
      return `<td>${val}</td>`;
    }).join('');
    return `<tr>
      ${tds}
      <td class="td-actions">
        <button class="btn-edit" data-section="${sectionKey}" data-id="${item.id}">Edit</button>
        <button class="btn-delete" data-section="${sectionKey}" data-id="${item.id}">Delete</button>
      </td>
    </tr>`;
  }).join('');

  listEl.innerHTML = `
    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead><tr>${ths}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;

  listEl.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', () => openModal(btn.dataset.section, btn.dataset.id));
  });

  listEl.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', () => deleteItem(btn.dataset.section, btn.dataset.id));
  });
}

/* ── Modal ────────────────────────────────────────────────── */

const backdrop = document.getElementById('modalBackdrop');
const modalTitle = document.getElementById('modalTitle');
const modalForm = document.getElementById('modalForm');

let currentModal = { section: null, id: null };

function renderFieldHtml(f, existing) {
  const val = existing[f.key] ?? '';
  const req = f.required ? 'required' : '';
  const cls = f.full ? 'field full-width' : 'field';

  if (f.type === 'textarea') {
    return `<label class="${cls}"><span class="field-label">${f.label}</span>
      <textarea name="${f.key}" ${req}>${val}</textarea></label>`;
  }
  if (f.type === 'select') {
    const opts = (f.options || []).map(o =>
      `<option value="${o}" ${val === o ? 'selected' : ''}>${o}</option>`
    ).join('');
    return `<label class="${cls}"><span class="field-label">${f.label}</span>
      <select name="${f.key}" ${req}>${opts}</select></label>`;
  }
  const inputType = f.type === 'password' ? 'password' : f.type;
  return `<label class="${cls}"><span class="field-label">${f.label}</span>
    <input type="${inputType}" name="${f.key}" value="${val}" ${req} autocomplete="off"></label>`;
}

function openModal(sectionKey, itemId) {
  const cfg = SECTIONS[sectionKey];
  if (!cfg) return;

  currentModal = { section: sectionKey, id: itemId || null };

  const isEdit = !!itemId;
  modalTitle.textContent = isEdit ? `Edit ${cfg.label}` : `Add ${cfg.label}`;

  let existing = {};
  if (isEdit) {
    const items = Store.get(cfg.storeKey);
    existing = items.find(i => i.id === itemId) || {};
  }

  const ungrouped = cfg.fields.filter(f => !f.group);
  const groupMap = {};
  const groupOrder = [];
  for (const f of cfg.fields) {
    if (f.group) {
      if (!groupMap[f.group]) {
        groupMap[f.group] = { fields: [], showWhen: f.showWhen };
        groupOrder.push(f.group);
      }
      groupMap[f.group].fields.push(f);
    }
  }

  const ungroupedHtml = ungrouped.map(f => renderFieldHtml(f, existing)).join('');

  let groupsHtml = '';
  for (const gName of groupOrder) {
    const g = groupMap[gName];
    const carrierVal = existing.carrier || '';
    const visible = !g.showWhen || g.showWhen === carrierVal;
    const fieldsStr = g.fields.map(f => renderFieldHtml(f, existing)).join('');

    const isApiGroup = gName.toLowerCase().includes('api') && g.showWhen === 'yamato';
    const testBtn = isApiGroup
      ? `<div class="form-group-action"><button type="button" class="btn-test" id="btnTestYamato">Test Connection</button><span class="test-status" id="testStatus"></span></div>`
      : '';

    groupsHtml += `
      <div class="form-group" data-show-when="${g.showWhen || ''}" ${visible ? '' : 'style="display:none"'}>
        <h4 class="form-group-title">${gName}</h4>
        <div class="form-grid">${fieldsStr}</div>
        ${testBtn}
      </div>`;
  }

  modalForm.innerHTML = `
    <div class="form-grid">${ungroupedHtml}</div>
    ${groupsHtml}
    <div class="form-actions">
      <button type="button" class="btn-cancel" id="btnModalCancel">Cancel</button>
      <button type="submit" class="btn-save">${isEdit ? 'Update' : 'Create'}</button>
    </div>`;

  backdrop.hidden = false;
  modalForm.querySelector('input, select, textarea')?.focus();

  document.getElementById('btnModalCancel').addEventListener('click', closeModal);

  const carrierSelect = modalForm.querySelector('[name="carrier"]');
  if (carrierSelect) {
    carrierSelect.addEventListener('change', () => updateGroupVisibility(carrierSelect.value));
  }

  document.getElementById('btnTestYamato')?.addEventListener('click', testYamatoConnection);
}

function closeModal() {
  backdrop.hidden = true;
  currentModal = { section: null, id: null };
}

function handleModalSubmit(e) {
  e.preventDefault();
  const { section, id } = currentModal;
  const cfg = SECTIONS[section];
  if (!cfg) return;

  const fd = new FormData(modalForm);
  const data = {};
  for (const f of cfg.fields) {
    let val = fd.get(f.key) ?? '';
    if (f.type === 'number' && val !== '') val = Number(val);
    data[f.key] = val;
  }

  const items = Store.get(cfg.storeKey);

  if (id) {
    const idx = items.findIndex(i => i.id === id);
    if (idx >= 0) items[idx] = { ...items[idx], ...data };
  } else {
    data.id = uid();
    items.push(data);
  }

  Store.set(cfg.storeKey, items);
  renderSection(section);
  closeModal();
  toast(id ? `${cfg.label} updated` : `${cfg.label} created`);
}

function deleteItem(sectionKey, itemId) {
  const cfg = SECTIONS[sectionKey];
  if (!cfg) return;
  if (!confirm(`Delete this ${cfg.label.toLowerCase()}?`)) return;

  const items = Store.get(cfg.storeKey).filter(i => i.id !== itemId);
  Store.set(cfg.storeKey, items);
  renderSection(sectionKey);
  toast(`${cfg.label} deleted`);
}

/* ── Carrier-specific field visibility ────────────────────── */

function updateGroupVisibility(carrier) {
  modalForm.querySelectorAll('.form-group[data-show-when]').forEach(g => {
    const sw = g.dataset.showWhen;
    g.style.display = (!sw || sw === carrier) ? '' : 'none';
  });
}

/* ── Yamato API integration ──────────────────────────────── */

const YAMATO_ENDPOINTS = {
  sandbox:    'https://apitest.kuronekoyamato.co.jp',
  production: 'https://api.kuronekoyamato.co.jp',
};

async function testYamatoConnection() {
  const btn = document.getElementById('btnTestYamato');
  const status = document.getElementById('testStatus');
  if (!btn) return;

  const code = modalForm.querySelector('[name="yamato_customer_code"]')?.value?.trim();
  const key  = modalForm.querySelector('[name="yamato_api_key"]')?.value?.trim();
  const env  = modalForm.querySelector('[name="yamato_environment"]')?.value || 'sandbox';

  if (!code || !key) {
    status.textContent = 'Enter customer code & API key first';
    status.className = 'test-status error';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Testing…';
  status.textContent = '';
  status.className = 'test-status';

  try {
    const res = await fetch('/api/yamato', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'test',
        customer_code: code,
        api_key: key,
        environment: env,
      }),
    });
    const data = await res.json();
    if (data.success) {
      status.textContent = '✓ Connected successfully';
      status.className = 'test-status success';
    } else {
      status.textContent = data.error || 'Connection failed';
      status.className = 'test-status error';
    }
  } catch (err) {
    status.textContent = 'Network error — is the API proxy running?';
    status.className = 'test-status error';
  }

  btn.disabled = false;
  btn.textContent = 'Test Connection';
}

async function yamatoCreateShipment(shippingMethod, order) {
  const env = shippingMethod.yamato_environment || 'sandbox';
  const res = await fetch('/api/yamato', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'create-shipment',
      customer_code: shippingMethod.yamato_customer_code,
      api_key: shippingMethod.yamato_api_key,
      environment: env,
      shipment: {
        product_type:  shippingMethod.yamato_product_type,
        size_code:     shippingMethod.yamato_size_code,
        temperature:   shippingMethod.yamato_temperature,
        payment:       shippingMethod.yamato_payment,
        time_slot:     shippingMethod.yamato_time_slot,
        goods_name:    shippingMethod.yamato_goods_name,
        handling_info: shippingMethod.yamato_handling_info,
        remarks:       shippingMethod.yamato_remarks,
        shipper: {
          company:    shippingMethod.yamato_shipper_company,
          name:       shippingMethod.yamato_shipper_name,
          name_kana:  shippingMethod.yamato_shipper_name_kana,
          postal:     shippingMethod.yamato_shipper_postal,
          prefecture: shippingMethod.yamato_shipper_prefecture,
          city:       shippingMethod.yamato_shipper_city,
          address:    shippingMethod.yamato_shipper_address,
          building:   shippingMethod.yamato_shipper_building,
          phone:      shippingMethod.yamato_shipper_phone,
        },
        recipient: order.recipient,
      },
    }),
  });
  return res.json();
}

async function yamatoTrack(shippingMethod, trackingNumber) {
  const res = await fetch('/api/yamato', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'track',
      customer_code: shippingMethod.yamato_customer_code,
      api_key: shippingMethod.yamato_api_key,
      environment: shippingMethod.yamato_environment || 'sandbox',
      tracking_number: trackingNumber,
    }),
  });
  return res.json();
}

/* ── Mail form ───────────────────────────────────────────── */

function loadMailSettings() {
  const data = Store.getObj('mail');
  const form = document.getElementById('form-mail');
  if (!form) return;

  for (const [key, val] of Object.entries(data)) {
    const el = form.elements[key];
    if (el) el.value = val;
  }
}

function handleMailSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const data = {};
  const fields = ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_encryption', 'from_name', 'from_email'];
  for (const f of fields) {
    data[f] = form.elements[f]?.value ?? '';
  }
  if (data.smtp_port) data.smtp_port = Number(data.smtp_port);
  Store.setObj('mail', data);
  toast('Mail settings saved');
}

/* ── Tabs ─────────────────────────────────────────────────── */

function switchTab(tabKey) {
  document.querySelectorAll('.tab-pill').forEach(p => {
    const isActive = p.dataset.tab === tabKey;
    p.classList.toggle('active', isActive);
    p.setAttribute('aria-selected', isActive);
  });

  document.querySelectorAll('.tab-panel').forEach(p => {
    const isActive = p.id === `panel-${tabKey}`;
    p.classList.toggle('active', isActive);
    p.hidden = !isActive;
  });
}

/* ── Toast ────────────────────────────────────────────────── */

function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}

/* ── Bind add buttons (used after re-render) ─────────────── */

function bindAddButtons() {
  document.querySelectorAll('.btn-add').forEach(btn => {
    btn.onclick = () => openModal(btn.dataset.section);
  });
}

/* ── Theme switcher (reused from main site) ──────────────── */

(function initTheme() {
  const THEME_KEY = 'adhd_theme';
  const root = document.documentElement;
  const mql = window.matchMedia?.('(prefers-color-scheme: dark)') ?? null;

  function systemTheme() { return mql?.matches ? 'dark' : 'light'; }

  function applyAttrs(theme) {
    root.setAttribute('data-theme', theme);
    root.setAttribute('data-system', systemTheme());
    const lbl = document.getElementById('themeLabel');
    const ico = document.getElementById('themeIcon');
    const btn = document.getElementById('btnTheme');
    const label = theme[0].toUpperCase() + theme.slice(1);
    if (lbl) lbl.textContent = label;
    if (ico) ico.textContent = theme === 'auto' ? '◐' : theme === 'dark' ? '☾' : '☼';
    if (btn) btn.setAttribute('aria-label', `Switch colour theme, currently ${label}`);
  }

  function getTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    return ['auto', 'dark', 'light'].includes(saved) ? saved : 'auto';
  }

  function setTheme(t) { localStorage.setItem(THEME_KEY, t); applyAttrs(t); }

  applyAttrs(getTheme());

  if (mql) {
    mql.addEventListener('change', () => {
      root.setAttribute('data-system', systemTheme());
      if (getTheme() === 'auto') applyAttrs('auto');
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('btnTheme');
    if (btn) btn.addEventListener('click', () => {
      const cur = getTheme();
      setTheme(cur === 'auto' ? 'dark' : cur === 'dark' ? 'light' : 'auto');
    });
  });
})();

/* ── Init ─────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  seedIfEmpty();

  for (const key of Object.keys(SECTIONS)) {
    renderSection(key);
  }

  loadMailSettings();

  document.querySelectorAll('.tab-pill').forEach(pill => {
    pill.addEventListener('click', () => switchTab(pill.dataset.tab));
  });

  bindAddButtons();

  modalForm.addEventListener('submit', handleModalSubmit);

  backdrop.addEventListener('click', e => {
    if (e.target === backdrop) closeModal();
  });

  document.querySelector('.modal-close')?.addEventListener('click', closeModal);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !backdrop.hidden) closeModal();
  });

  document.getElementById('form-mail')?.addEventListener('submit', handleMailSubmit);
});
