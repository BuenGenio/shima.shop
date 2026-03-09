/**
 * Migration runner with tracking.
 * - Tracks applied migrations in _schema_migrations
 * - Skips migrations that have already run
 * - Detects modified migrations (checksum changed) and warns
 * - Ignores idempotent errors (duplicate column, table/index already exists) when re-running
 *
 * Usage:
 *   npm run db:migrate          # Run pending migrations
 *   npm run db:migrate -- --rerun 005  # Re-run a specific migration (applies diff via error handling)
 */
import { createClient } from '@libsql/client'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'

function loadEnv(file) {
  try {
    for (const line of readFileSync(file, 'utf-8').split('\n')) {
      const eq = line.indexOf('=')
      if (eq > 0) {
        const key = line.slice(0, eq).trim()
        const val = line.slice(eq + 1).trim()
        if (key && !process.env[key]) process.env[key] = val
      }
    }
  } catch {}
}
loadEnv('.dev.vars')
loadEnv('.env')

const url = process.env.TURSO_DATABASE_URL || 'file:local.db'
const authToken = process.env.TURSO_AUTH_TOKEN || undefined

const db = createClient({ url, authToken })

const IGNORABLE_ERRORS = [
  'duplicate column name',
  'table .* already exists',
  'index .* already exists',
  'UNIQUE constraint failed',
  'column .* already exists',
]

function isIgnorableError(err) {
  const msg = (err?.message || err?.cause?.message || String(err)).toLowerCase()
  return IGNORABLE_ERRORS.some(pattern => {
    const re = new RegExp(pattern.replace(/\s+/g, '\\s+').replace(/\*/g, '.*'), 'i')
    return re.test(msg)
  })
}

function sha256(content) {
  return createHash('sha256').update(content).digest('hex').slice(0, 16)
}

async function ensureMigrationsTable() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS _schema_migrations (
      filename TEXT PRIMARY KEY,
      checksum TEXT NOT NULL,
      applied_at TEXT DEFAULT (datetime('now'))
    )
  `)
}

async function getAppliedMigrations() {
  const r = await db.execute('SELECT filename, checksum FROM _schema_migrations')
  return Object.fromEntries(r.rows.map(row => [row.filename, row.checksum]))
}

async function recordMigration(filename, checksum) {
  await db.execute({
    sql: `INSERT INTO _schema_migrations (filename, checksum) VALUES (?, ?)
          ON CONFLICT(filename) DO UPDATE SET checksum = excluded.checksum, applied_at = datetime('now')`,
    args: [filename, checksum],
  })
}

async function runStatement(stmt, opts = {}) {
  try {
    await db.execute(stmt)
    return { ok: true }
  } catch (err) {
    if (opts.ignoreErrors && isIgnorableError(err)) {
      return { ok: false, ignored: true, message: err.message }
    }
    throw err
  }
}

async function main() {
  const args = process.argv.slice(2)
  const rerunFile = args.includes('--rerun') ? args[args.indexOf('--rerun') + 1] : null

  await ensureMigrationsTable()
  const applied = await getAppliedMigrations()

  const migrationsDir = join(import.meta.dirname, 'migrations')
  const files = (await readdir(migrationsDir))
    .filter(f => f.endsWith('.sql'))
    .sort()

  let ran = 0
  for (const file of files) {
    const content = await readFile(join(migrationsDir, file), 'utf-8')
    const checksum = sha256(content)
    const alreadyApplied = file in applied
    const checksumChanged = alreadyApplied && applied[file] !== checksum

    const isRerunTarget = rerunFile && (file.startsWith(rerunFile) || file === rerunFile || file === `${rerunFile}.sql`)
    const shouldRun = isRerunTarget || !alreadyApplied || checksumChanged

    if (!shouldRun) continue

    if (checksumChanged && !isRerunTarget) {
      console.warn(`⚠ ${file}: checksum changed. Run: npm run db:migrate -- --rerun ${file.replace(/\.sql$/, '')}`)
      continue
    }

    const statements = content
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0)

    const bootstrap = Object.keys(applied).length === 0
    const ignoreErrors = bootstrap || !!alreadyApplied || !!rerunFile || checksumChanged

    for (const stmt of statements) {
      const result = await runStatement(stmt, { ignoreErrors })
      if (result.ignored) {
        console.log(`  (skipped: ${result.message?.slice(0, 50)}...)`)
      }
    }

    await recordMigration(file, checksum)
    console.log(`Applied: ${file}`)
    ran++
  }

  if (ran === 0 && !rerunFile) {
    console.log('No pending migrations.')
  } else {
    console.log(`Done. ${ran} migration(s) applied.`)
  }
  db.close()
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
