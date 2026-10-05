import pg from 'pg';

const { Pool } = pg;
let pool;

export function databaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export function getPool() {
  if (!databaseConfigured()) return null;
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: Number(process.env.PG_POOL_MAX || 10),
      ssl: process.env.PG_SSL === 'disable' ? false : { rejectUnauthorized: false },
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
    pool.on('error', (err) => console.error('[db] idle client error', err.message));
  }
  return pool;
}

export async function query(text, params = []) {
  const p = getPool();
  if (!p) throw new Error('DATABASE_NOT_CONFIGURED');
  return p.query(text, params);
}

export async function transaction(fn) {
  const p = getPool();
  if (!p) throw new Error('DATABASE_NOT_CONFIGURED');
  const client = await p.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function migrate() {
  if (!databaseConfigured()) return { skipped: true };
  const p = getPool();
  await p.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      locale TEXT NOT NULL DEFAULT 'en',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS families (
      id UUID PRIMARY KEY,
      name TEXT NOT NULL,
      owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free','plus','pro')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS members (
      id UUID PRIMARY KEY,
      family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      display_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('parent','guardian','child')),
      avatar_key TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (family_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS devices (
      id UUID PRIMARY KEY,
      member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      device_uid TEXT NOT NULL UNIQUE,
      platform TEXT NOT NULL CHECK (platform IN ('ios','android','web','unknown')),
      device_name TEXT,
      token_version INTEGER NOT NULL DEFAULT 1,
      push_token TEXT,
      last_seen_at TIMESTAMPTZ,
      revoked_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS pairing_codes (
      id UUID PRIMARY KEY,
      family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
      created_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      code_hash TEXT NOT NULL UNIQUE,
      intended_role TEXT NOT NULL DEFAULT 'child' CHECK (intended_role IN ('child','guardian')),
      expires_at TIMESTAMPTZ NOT NULL,
      used_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS locations (
      id BIGSERIAL PRIMARY KEY,
      member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      latitude DOUBLE PRECISION NOT NULL CHECK (latitude BETWEEN -90 AND 90),
      longitude DOUBLE PRECISION NOT NULL CHECK (longitude BETWEEN -180 AND 180),
      accuracy_m DOUBLE PRECISION,
      altitude_m DOUBLE PRECISION,
      speed_mps DOUBLE PRECISION,
      battery_pct SMALLINT CHECK (battery_pct BETWEEN 0 AND 100),
      source TEXT NOT NULL DEFAULT 'device',
      recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS safe_places (
      id UUID PRIMARY KEY,
      family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      latitude DOUBLE PRECISION NOT NULL CHECK (latitude BETWEEN -90 AND 90),
      longitude DOUBLE PRECISION NOT NULL CHECK (longitude BETWEEN -180 AND 180),
      radius_m INTEGER NOT NULL DEFAULT 150 CHECK (radius_m BETWEEN 50 AND 5000),
      notify_arrival BOOLEAN NOT NULL DEFAULT TRUE,
      notify_departure BOOLEAN NOT NULL DEFAULT TRUE,
      created_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS sos_alerts (
      id UUID PRIMARY KEY,
      family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
      member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','resolved','cancelled')),
      latitude DOUBLE PRECISION,
      longitude DOUBLE PRECISION,
      battery_pct SMALLINT CHECK (battery_pct BETWEEN 0 AND 100),
      note TEXT,
      started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      resolved_at TIMESTAMPTZ,
      resolved_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS user_push_tokens (
      id UUID PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT NOT NULL UNIQUE,
      platform TEXT NOT NULL CHECK (platform IN ('ios','android','web','unknown')),
      enabled BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS audit_events (
      id BIGSERIAL PRIMARY KEY,
      family_id UUID REFERENCES families(id) ON DELETE CASCADE,
      actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      actor_member_id UUID REFERENCES members(id) ON DELETE SET NULL,
      event_type TEXT NOT NULL,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_members_family ON members(family_id);
    CREATE INDEX IF NOT EXISTS idx_devices_member ON devices(member_id);
    CREATE INDEX IF NOT EXISTS idx_locations_member_time ON locations(member_id, recorded_at DESC);
    CREATE INDEX IF NOT EXISTS idx_pairing_family_expiry ON pairing_codes(family_id, expires_at DESC);
    CREATE INDEX IF NOT EXISTS idx_places_family ON safe_places(family_id);
    CREATE INDEX IF NOT EXISTS idx_sos_family_status ON sos_alerts(family_id, status, started_at DESC);
    CREATE INDEX IF NOT EXISTS idx_audit_family_time ON audit_events(family_id, created_at DESC);
  `);
  return { skipped: false };
}

export async function pingDb() {
  if (!databaseConfigured()) return false;
  try {
    await query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}
