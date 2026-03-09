const YAMATO_BASE = {
  sandbox:    'https://apitest.kuronekoyamato.co.jp',
  production: 'https://api.kuronekoyamato.co.jp',
};

const PRODUCT_TYPE_CODES = {
  '宅急便':           '0',
  '宅急便コンパクト':   '3',
  'ネコポス':          '7',
};

const TEMPERATURE_CODES = {
  '常温 (Normal)':       '0',
  '冷蔵 (Refrigerated)': '1',
  '冷凍 (Frozen)':       '2',
};

const PAYMENT_CODES = {
  '元払い (Prepaid)': '01',
  '着払い (Collect)': '02',
  'コレクト (COD)':   '03',
};

const HANDLING_CODES = {
  'なし (None)':         '00',
  'ワレモノ (Fragile)':   '01',
  '天地無用 (This Side Up)': '02',
  'ナマモノ (Perishable)':  '03',
};

const TIME_SLOT_CODES = {
  '指定なし (Any)': '0000',
  '午前中 (AM)':    '0812',
  '14:00-16:00':    '1416',
  '16:00-18:00':    '1618',
  '18:00-20:00':    '1820',
  '19:00-21:00':    '1921',
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

async function yamatoFetch(baseUrl, path, body, apiKey) {
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });
  return { status: res.status, data: await res.json().catch(() => ({})) };
}

async function handleTest({ customer_code, api_key, environment }) {
  const base = YAMATO_BASE[environment] || YAMATO_BASE.sandbox;
  try {
    const { status, data } = await yamatoFetch(base, '/api/v1/auth/login', {
      customer_code,
      password: api_key,
    }, api_key);

    if (status >= 200 && status < 300) {
      return { success: true, message: 'Authentication successful' };
    }
    return { success: false, error: data.error_message || data.message || `HTTP ${status}` };
  } catch (err) {
    return { success: false, error: `Cannot reach Yamato ${environment} API: ${err.message}` };
  }
}

async function handleCreateShipment({ customer_code, api_key, environment, shipment }) {
  const base = YAMATO_BASE[environment] || YAMATO_BASE.sandbox;
  const s = shipment || {};
  const shipper = s.shipper || {};
  const recipient = s.recipient || {};

  const payload = {
    customer_code,
    shipment_type: PRODUCT_TYPE_CODES[s.product_type] || '0',
    temperature_type: TEMPERATURE_CODES[s.temperature] || '0',
    payment_type: PAYMENT_CODES[s.payment] || '01',
    size: s.size_code || '80',
    time_slot: TIME_SLOT_CODES[s.time_slot] || '0000',
    handling: HANDLING_CODES[s.handling_info] || '00',
    goods_name: s.goods_name || '',
    remarks: s.remarks || '',
    shipper_company: shipper.company || '',
    shipper_name: shipper.name || '',
    shipper_name_kana: shipper.name_kana || '',
    shipper_postal_code: (shipper.postal || '').replace('-', ''),
    shipper_prefecture: shipper.prefecture || '',
    shipper_city: shipper.city || '',
    shipper_address: shipper.address || '',
    shipper_building: shipper.building || '',
    shipper_phone: shipper.phone || '',
    recipient_name: recipient.name || '',
    recipient_name_kana: recipient.name_kana || '',
    recipient_postal_code: (recipient.postal || '').replace('-', ''),
    recipient_prefecture: recipient.prefecture || '',
    recipient_city: recipient.city || '',
    recipient_address: recipient.address || '',
    recipient_building: recipient.building || '',
    recipient_phone: recipient.phone || '',
  };

  try {
    const { status, data } = await yamatoFetch(base, '/api/v1/shipments', payload, api_key);

    if (status >= 200 && status < 300) {
      return {
        success: true,
        tracking_number: data.tracking_number || data.slip_number,
        label_url: data.label_url || null,
        raw: data,
      };
    }
    return { success: false, error: data.error_message || data.message || `HTTP ${status}` };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function handleTrack({ customer_code, api_key, environment, tracking_number }) {
  const base = YAMATO_BASE[environment] || YAMATO_BASE.sandbox;

  try {
    const res = await fetch(`${base}/api/v1/tracking/${tracking_number}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${api_key}`,
        'X-Customer-Code': customer_code,
      },
    });
    const data = await res.json().catch(() => ({}));

    if (res.status >= 200 && res.status < 300) {
      return {
        success: true,
        status: data.status || data.delivery_status,
        events: data.events || data.tracking_events || [],
        estimated_delivery: data.estimated_delivery || null,
        raw: data,
      };
    }
    return { success: false, error: data.error_message || data.message || `HTTP ${res.status}` };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function onRequestPost(context) {
  const { request } = context;

  try {
    const body = await request.json();
    const { action } = body;

    let result;
    switch (action) {
      case 'test':
        result = await handleTest(body);
        break;
      case 'create-shipment':
        result = await handleCreateShipment(body);
        break;
      case 'track':
        result = await handleTrack(body);
        break;
      default:
        return Response.json(
          { error: `Unknown action: ${action}` },
          { status: 400, headers: corsHeaders },
        );
    }

    return Response.json(result, { headers: corsHeaders });
  } catch (err) {
    console.error('Yamato API error:', err);
    return Response.json(
      { error: 'Internal error processing Yamato request' },
      { status: 500, headers: corsHeaders },
    );
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}
