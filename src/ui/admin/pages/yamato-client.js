export const YAMATO_ENDPOINTS = {
  sandbox:    'https://apitest.kuronekoyamato.co.jp',
  production: 'https://api.kuronekoyamato.co.jp',
}

export async function testYamatoConnection(modalForm) {
  const btn = document.getElementById('btnTestYamato')
  const status = document.getElementById('testStatus')
  if (!btn) return

  const code = modalForm.querySelector('[name="yamato_customer_code"]')?.value?.trim()
  const key  = modalForm.querySelector('[name="yamato_api_key"]')?.value?.trim()
  const env  = modalForm.querySelector('[name="yamato_environment"]')?.value || 'sandbox'

  if (!code || !key) {
    status.textContent = 'Enter customer code & API key first'
    status.className = 'test-status error'
    return
  }

  btn.disabled = true
  btn.textContent = 'Testing…'
  status.textContent = ''
  status.className = 'test-status'

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
    })
    const data = await res.json()
    if (data.success) {
      status.textContent = '✓ Connected successfully'
      status.className = 'test-status success'
    } else {
      status.textContent = data.error || 'Connection failed'
      status.className = 'test-status error'
    }
  } catch {
    status.textContent = 'Network error — is the API proxy running?'
    status.className = 'test-status error'
  }

  btn.disabled = false
  btn.textContent = 'Test Connection'
}

export async function yamatoCreateShipment(shippingMethod, order) {
  const env = shippingMethod.yamato_environment || 'sandbox'
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
  })
  return res.json()
}

export async function yamatoTrack(shippingMethod, trackingNumber) {
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
  })
  return res.json()
}
