# Logging

Configurable application logging with level filtering and multiple drivers. Multiple targets work concurrently (e.g. console + db).

## Settings

Stored in `settings` table under key `app.settings`:

| Key | Values | Default |
|-----|--------|---------|
| `log-level` | `debug`, `info`, `warn`, `error` | `info` |
| `log-drivers` | `["console","db"]` — array, multiple enabled | `["console"]` |
| `log-verbosity` | `minimal`, `normal`, `verbose` | `normal` |

Legacy `log-driver` (single value) is still supported and normalized to an array.

### Configure via API

```bash
# Get current settings
curl /api/settings?key=app.settings

# Set log level and drivers (both console and db)
curl -X PUT /api/settings?key=app.settings \
  -H "Content-Type: application/json" \
  -d '{"log-level":"debug","log-drivers":["console","db"]}'
```

## Log Levels

- **debug** — All messages, including 2xx API responses
- **info** — info, warn, error (API: non-2xx responses)
- **warn** — warn, error (API: 4xx, 5xx)
- **error** — error only (API: 5xx, handler exceptions)

API request logging includes response status and body (for non-2xx). Severity is derived from status: 2xx→debug, 4xx→warn, 5xx→error.

## Drivers (multiple can be enabled)

### console

Writes to `console.debug`, `console.info`, `console.warn`, `console.error`.

### db

Writes to the `logs` table in the libSQL database. Use for production debugging and audit trails.

## Logs Table

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| severity | TEXT | debug, info, warn, error |
| type | TEXT | application, system, status, checkout, payments-sync, ... |
| message | TEXT | Log message |
| metadata | TEXT | JSON object (error details, context) |
| source | TEXT | Optional source identifier |
| created_at | TEXT | Timestamp |

## API

### List logs

```
GET /api/logs?severity=error&type=checkout&from=2024-01-01&to=2024-01-31&q=search&limit=100&offset=0
```

| Param | Description |
|-------|-------------|
| severity | Filter by severity |
| type | Filter by type |
| from | ISO date/datetime (inclusive) |
| to | ISO date/datetime (inclusive) |
| q | Search in message (LIKE) |
| limit | Max 500, default 100 |
| offset | Pagination |

Returns `{ logs: [...] }`.

### Purge logs

```
DELETE /api/logs?days=30
DELETE /api/logs?before=2024-01-01
```

| Param | Description |
|-------|-------------|
| days | Delete logs older than N days |
| before | Delete logs before ISO date |

Returns `{ ok: true, deleted: N }`.

## Usage in code

```javascript
import { log, createLogger } from '../lib/logger.js';

// One-off
await log({ db, env }, 'error', 'checkout', 'Payment failed', { orderId: 'x' });

// Or create a bound logger
const logger = createLogger({ db, env });
await logger.info('payments-sync', 'Sync started', { provider: 'stripe' });
await logger.error('checkout', 'Checkout failed', err);
```
