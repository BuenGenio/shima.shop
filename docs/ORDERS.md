# Orders & Kits (Bundles)

Kits group arbitrary product combinations as collections. When a user clones a configured collection, an **initially incomplete order** is created with full audit compliance.

## Order Lifecycle

| Status | Description |
|--------|-------------|
| **draft** | Order created from kit; items added. Incomplete. |
| **consignment** | Shipping details (to/from) added. Ready for carrier options. |
| **ready** | Carrier, pickup, service selected. Charges can be added. |

## Status Transitions

1. **draft → consignment**: When shipping details are complete:
   - `to_name`, `to_address`, `to_country`, and (`to_tel` OR `to_email`)

2. **consignment → ready**: When consignment options are complete:
   - `carrier_name`, `pickup_date`, `pickup_time`, `pickup_address`, `service`

## API

### Create order from kit (clone)

```
POST /api/orders
Content-Type: application/json

{
  "kitId": "k1",
  "selectedItems": ["p1", "p2", "p3"]
}

→ 201 { "orderId": "ord_xxx", "status": "draft" }
```

### Get order

```
GET /api/orders/:id

→ 200 { id, kit_id, status, items, charges, from_*, to_*, carrier_*, ... }
```

### Update order (shipping, consignment options)

```
PATCH /api/orders/:id
Content-Type: application/json

{
  "to_name": "Jane Doe",
  "to_address": "123 Main St",
  "to_country": "US",
  "to_tel": "+1234567890",
  "to_email": "jane@example.com",
  "from_name": "Shop",
  "from_address": "456 Warehouse Rd",
  "from_country": "JP",
  "from_tel": "+819012345678",
  "from_email": "ship@shop.com"
}

// When consignment:
{
  "carrier_name": "Yamato",
  "pickup_date": "2025-03-15",
  "pickup_time": "14:00",
  "pickup_address": "456 Warehouse Rd",
  "pickup_notes": "Gate B",
  "service": "express"
}
```

### Add charge items (when status = ready)

```
PATCH /api/orders/:id
Content-Type: application/json

{
  "charges": [
    {
      "description": "Bundle (Complete)",
      "amount": 78800,
      "currency": "JPY",
      "quantity": 1,
      "data": { "line_type": "bundle" }
    }
  ]
}
```

## Audit (order_events)

Every create, read, update, and access is logged with:

- **user_id** – authenticated user (if any)
- **activity** – e.g. `order_created`, `order_updated`, `order_accessed`, `charges_added`
- **created_at** – timestamp
- **origin_ip** – client IP (CF-Connecting-IP, X-Forwarded-For)
- **origin_country** – CF-IPCountry
- **user_agent** – User-Agent
- **technology** – Sec-CH-UA
- **method** – HTTP method
- **payload** – JSON of changes / context

## Database Schema

- **orders** – main record (status, shipping, consignment fields)
- **order_items** – products from kit
- **order_charges** – line items for final charge
- **order_events** – audit trail
