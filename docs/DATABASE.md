# Database Setup

This project uses libSQL (Turso). The `@libsql/client` **web** build (Workers runtime) supports: `libsql://`, `https://`, `http://`, `wss://`, `ws://`. It does **not** support `file:`.

## Options for Local Development

### 1. Docker (recommended, no Turso CLI)

```bash
docker compose up -d
```

Then in `.dev.vars`:
```
TURSO_DATABASE_URL=http://127.0.0.1:8080
TURSO_AUTH_TOKEN=
```

Run migrations:
```bash
npm run db:migrate
```

### Migration tracking

Migrations are tracked in `_schema_migrations`. Each run:
- Skips migrations already applied
- Detects modified migrations (checksum changed) and warns
- Ignores idempotent errors (duplicate column, table/index already exists) when bootstrapping or re-running

**Re-run a modified migration** (applies only the diff; existing schema is skipped):
```bash
npm run db:migrate -- --rerun 005
```

### 2. Turso CLI + `turso dev`

Install the CLI (not available via npm):

```bash
curl -sSfL https://get.tur.so/install.sh | bash
```

Start a local libSQL server:
```bash
turso dev --db-file local.db
```

Use `http://127.0.0.1:8080` in `.dev.vars`.

### 3. Turso Cloud (production)

```bash
turso db create shima-shop
turso db show shima-shop --url
turso db tokens create shima-shop
```

Use the `libsql://...` URL and token in `.dev.vars`.

## On-Premises / Self-Hosted

Yes. Run the libSQL server (sqld) on your own infrastructure:

```bash
docker run -d -p 8080:8080 \
  -v ./sqld-data:/var/lib/sqld \
  -e SQLD_NODE=primary \
  ghcr.io/tursodatabase/libsql-server:latest
```

Connect with `http://your-server:8080`. For production, add TLS and authentication (see [libSQL docs](https://docs.turso.tech/libsql)).
