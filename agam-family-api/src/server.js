import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import bcrypt from 'bcryptjs';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { migrate, pingDb, query, transaction, databaseConfigured } from './db.js';
import { authenticate, parentOnly } from './auth.js';
import {
  createPairCode,
  hashPairCode,
  issueDeviceToken,
  issueUserToken,
  normalizeEmail,
  randomId,
  requireProductionSecrets,
} from './security.js';
import { familyUserPushTokens, sendExpoPush } from './notifications.js';

const app = express();
const PORT = Number(process.env.PORT || 10000);
const API_VERSION = '0.1.0';

requireProductionSecrets();

const allowedOrigins = String(process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((x) => x.trim())
  .filter(Boolean);

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin(origin, callback) {
    if (!origin || !allowedOrigins.length || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('CORS_NOT_ALLOWED'));
  },
  credentials: false,
}));
app.use(express.json({ limit: '64kb' }));

const publicLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 80,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
});

function validate(schema, source = 'body') {
  return (req, res, next) => {
    const parsed = schema.safeParse(req[source]);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        fields: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      });
    }
    req.validated = parsed.data;
    next();
  };
}

function asyncRoute(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

async function audit({ familyId, userId = null, memberId = null, eventType, metadata = {} }, client = null) {
  const q = client ? client.query.bind(client) : query;
  await q(
    `INSERT INTO audit_events (family_id, actor_user_id, actor_member_id, event_type, metadata)
     VALUES ($1,$2,$3,$4,$5::jsonb)`,
    [familyId, userId, memberId, eventType, JSON.stringify(metadata)]
  );
}

function familyAccess(req, memberId) {
  return query('SELECT id FROM members WHERE id = $1 AND family_id = $2', [memberId, req.auth.familyId]);
}

app.get('/health', asyncRoute(async (_req, res) => {
  const db = await pingDb();
  res.status(db || !databaseConfigured() ? 200 : 503).json({
    ok: true,
    version: API_VERSION,
    databaseConfigured: databaseConfigured(),
    databaseReady: db,
    time: new Date().toISOString(),
  });
}));

const registerSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(10).max(128),
  displayName: z.string().trim().min(2).max(60),
  familyName: z.string().trim().min(2).max(80).optional(),
  locale: z.string().trim().min(2).max(12).default('en'),
});

app.post('/v1/auth/register-parent', authLimiter, validate(registerSchema), asyncRoute(async (req, res) => {
  if (!databaseConfigured()) return res.status(503).json({ error: 'DATABASE_NOT_CONFIGURED' });
  const { email, password, displayName, familyName, locale } = req.validated;
  const normalized = normalizeEmail(email);
  const existing = await query('SELECT id FROM users WHERE email = $1', [normalized]);
  if (existing.rowCount) return res.status(409).json({ error: 'EMAIL_IN_USE' });

  const passwordHash = await bcrypt.hash(password, 12);
  const userId = randomId();
  const familyId = randomId();
  const memberId = randomId();

  await transaction(async (client) => {
    await client.query(
      `INSERT INTO users (id,email,password_hash,display_name,locale)
       VALUES ($1,$2,$3,$4,$5)`,
      [userId, normalized, passwordHash, displayName, locale]
    );
    await client.query(
      `INSERT INTO families (id,name,owner_user_id) VALUES ($1,$2,$3)`,
      [familyId, familyName || `${displayName}'s Family`, userId]
    );
    await client.query(
      `INSERT INTO members (id,family_id,user_id,display_name,role)
       VALUES ($1,$2,$3,$4,'parent')`,
      [memberId, familyId, userId, displayName]
    );
    await audit({ familyId, userId, memberId, eventType: 'family_created' }, client);
  });

  const token = issueUserToken({ userId, familyId, memberId, role: 'parent' });
  res.status(201).json({
    token,
    user: { id: userId, email: normalized, displayName, locale },
    family: { id: familyId, name: familyName || `${displayName}'s Family`, plan: 'free' },
    member: { id: memberId, role: 'parent', displayName },
  });
}));

const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(128),
});

app.post('/v1/auth/login', authLimiter, validate(loginSchema), asyncRoute(async (req, res) => {
  if (!databaseConfigured()) return res.status(503).json({ error: 'DATABASE_NOT_CONFIGURED' });
  const email = normalizeEmail(req.validated.email);
  const result = await query(
    `SELECT u.id AS user_id, u.email, u.password_hash, u.display_name, u.locale,
            m.id AS member_id, m.family_id, m.role, f.name AS family_name, f.plan
       FROM users u
       JOIN members m ON m.user_id = u.id
       JOIN families f ON f.id = m.family_id
      WHERE u.email = $1
      ORDER BY m.created_at ASC
      LIMIT 1`,
    [email]
  );
  const row = result.rows[0];
  const ok = row ? await bcrypt.compare(req.validated.password, row.password_hash) : false;
  if (!ok) return res.status(401).json({ error: 'INVALID_CREDENTIALS' });

  const token = issueUserToken({
    userId: row.user_id,
    familyId: row.family_id,
    memberId: row.member_id,
    role: row.role,
  });
  await audit({ familyId: row.family_id, userId: row.user_id, memberId: row.member_id, eventType: 'login' });
  res.json({
    token,
    user: { id: row.user_id, email: row.email, displayName: row.display_name, locale: row.locale },
    family: { id: row.family_id, name: row.family_name, plan: row.plan },
    member: { id: row.member_id, role: row.role, displayName: row.display_name },
  });
}));

const pairCreateSchema = z.object({
  role: z.enum(['child']).default('child'),
});

app.post('/v1/pairing/create', authenticate, parentOnly, validate(pairCreateSchema), asyncRoute(async (req, res) => {
  const familyId = req.auth.familyId;
  let code;
  let codeHash;
  for (let i = 0; i < 5; i++) {
    code = createPairCode();
    codeHash = hashPairCode(code);
    const exists = await query('SELECT 1 FROM pairing_codes WHERE code_hash = $1 AND used_at IS NULL AND expires_at > NOW()', [codeHash]);
    if (!exists.rowCount) break;
  }
  const id = randomId();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await query(
    `INSERT INTO pairing_codes (id,family_id,created_by_user_id,code_hash,intended_role,expires_at)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [id, familyId, req.auth.userId, codeHash, req.validated.role, expiresAt]
  );
  await audit({ familyId, userId: req.auth.userId, memberId: req.auth.memberId, eventType: 'pairing_code_created' });
  res.status(201).json({ code, expiresAt: expiresAt.toISOString() });
}));

const pairJoinSchema = z.object({
  code: z.string().regex(/^\d{6}$/),
  displayName: z.string().trim().min(1).max(60),
  deviceUid: z.string().trim().min(8).max(160),
  platform: z.enum(['ios', 'android', 'web', 'unknown']).default('unknown'),
  deviceName: z.string().trim().max(100).optional(),
});

app.post('/v1/pairing/join', publicLimiter, validate(pairJoinSchema), asyncRoute(async (req, res) => {
  if (!databaseConfigured()) return res.status(503).json({ error: 'DATABASE_NOT_CONFIGURED' });
  const { code, displayName, deviceUid, platform, deviceName } = req.validated;
  const codeHash = hashPairCode(code);
  const existingDevice = await query('SELECT id FROM devices WHERE device_uid = $1 AND revoked_at IS NULL', [deviceUid]);
  if (existingDevice.rowCount) return res.status(409).json({ error: 'DEVICE_ALREADY_PAIRED' });

  const memberId = randomId();
  const deviceId = randomId();
  const result = await transaction(async (client) => {
    const pair = await client.query(
      `SELECT p.id, p.family_id, p.intended_role, f.name AS family_name
         FROM pairing_codes p
         JOIN families f ON f.id = p.family_id
        WHERE p.code_hash = $1 AND p.used_at IS NULL AND p.expires_at > NOW()
        FOR UPDATE OF p`,
      [codeHash]
    );
    const row = pair.rows[0];
    if (!row) {
      const err = new Error('INVALID_OR_EXPIRED_PAIRING_CODE');
      err.status = 404;
      throw err;
    }
    await client.query(
      `INSERT INTO members (id,family_id,display_name,role)
       VALUES ($1,$2,$3,$4)`,
      [memberId, row.family_id, displayName, row.intended_role]
    );
    await client.query(
      `INSERT INTO devices (id,member_id,device_uid,platform,device_name,last_seen_at)
       VALUES ($1,$2,$3,$4,$5,NOW())`,
      [deviceId, memberId, deviceUid, platform, deviceName || null]
    );
    await client.query('UPDATE pairing_codes SET used_at = NOW() WHERE id = $1', [row.id]);
    await audit({ familyId: row.family_id, memberId, eventType: 'member_paired', metadata: { platform, deviceName } }, client);
    return row;
  });

  const token = issueDeviceToken({
    deviceId,
    memberId,
    familyId: result.family_id,
    role: result.intended_role,
    tokenVersion: 1,
  });
  res.status(201).json({
    token,
    family: { id: result.family_id, name: result.family_name },
    member: { id: memberId, displayName, role: result.intended_role },
    device: { id: deviceId, platform, deviceName: deviceName || null },
  });
}));

app.get('/v1/me', authenticate, asyncRoute(async (req, res) => {
  res.json({ auth: req.auth });
}));

app.get('/v1/family', authenticate, asyncRoute(async (req, res) => {
  const familyResult = await query('SELECT id,name,plan,created_at FROM families WHERE id = $1', [req.auth.familyId]);
  if (!familyResult.rowCount) return res.status(404).json({ error: 'FAMILY_NOT_FOUND' });

  const members = await query(
    `SELECT m.id, m.display_name, m.role, m.avatar_key,
            d.id AS device_id, d.platform, d.device_name, d.last_seen_at, d.revoked_at,
            l.latitude, l.longitude, l.accuracy_m, l.battery_pct, l.recorded_at
       FROM members m
       LEFT JOIN LATERAL (
         SELECT id, platform, device_name, last_seen_at, revoked_at
           FROM devices
          WHERE member_id = m.id AND revoked_at IS NULL
          ORDER BY updated_at DESC LIMIT 1
       ) d ON TRUE
       LEFT JOIN LATERAL (
         SELECT latitude, longitude, accuracy_m, battery_pct, recorded_at
           FROM locations
          WHERE member_id = m.id
          ORDER BY recorded_at DESC LIMIT 1
       ) l ON TRUE
      WHERE m.family_id = $1
      ORDER BY CASE m.role WHEN 'parent' THEN 0 WHEN 'guardian' THEN 1 ELSE 2 END, m.created_at ASC`,
    [req.auth.familyId]
  );
  const places = await query(
    `SELECT id,name,latitude,longitude,radius_m,notify_arrival,notify_departure
       FROM safe_places WHERE family_id = $1 ORDER BY created_at ASC`,
    [req.auth.familyId]
  );
  const activeSos = await query(
    `SELECT s.id,s.member_id,s.latitude,s.longitude,s.battery_pct,s.note,s.started_at,m.display_name
       FROM sos_alerts s JOIN members m ON m.id=s.member_id
      WHERE s.family_id=$1 AND s.status='active'
      ORDER BY s.started_at DESC`,
    [req.auth.familyId]
  );
  res.json({ family: familyResult.rows[0], members: members.rows, safePlaces: places.rows, activeSos: activeSos.rows });
}));

const locationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracyM: z.number().min(0).max(100000).optional(),
  altitudeM: z.number().min(-1000).max(20000).optional(),
  speedMps: z.number().min(0).max(500).optional(),
  batteryPct: z.number().int().min(0).max(100).optional(),
  recordedAt: z.string().datetime().optional(),
  source: z.enum(['device', 'manual', 'geofence']).default('device'),
});

app.post('/v1/location', authenticate, validate(locationSchema), asyncRoute(async (req, res) => {
  const b = req.validated;
  const recordedAt = b.recordedAt ? new Date(b.recordedAt) : new Date();
  if (Math.abs(Date.now() - recordedAt.getTime()) > 24 * 60 * 60 * 1000) {
    return res.status(400).json({ error: 'RECORDED_AT_OUT_OF_RANGE' });
  }
  await query(
    `INSERT INTO locations
      (member_id,latitude,longitude,accuracy_m,altitude_m,speed_mps,battery_pct,source,recorded_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [req.auth.memberId, b.latitude, b.longitude, b.accuracyM ?? null, b.altitudeM ?? null,
      b.speedMps ?? null, b.batteryPct ?? null, b.source, recordedAt]
  );
  await audit({
    familyId: req.auth.familyId,
    userId: req.auth.userId || null,
    memberId: req.auth.memberId,
    eventType: 'location_updated',
    metadata: { accuracyM: b.accuracyM ?? null, source: b.source },
  });
  res.status(202).json({ accepted: true, recordedAt: recordedAt.toISOString() });
}));

const historyQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(1000).default(250),
});

app.get('/v1/members/:memberId/locations', authenticate, parentOnly, validate(historyQuerySchema, 'query'), asyncRoute(async (req, res) => {
  const access = await familyAccess(req, req.params.memberId);
  if (!access.rowCount) return res.status(404).json({ error: 'MEMBER_NOT_FOUND' });
  const { from, to, limit } = req.validated;
  const result = await query(
    `SELECT latitude,longitude,accuracy_m,altitude_m,speed_mps,battery_pct,source,recorded_at
       FROM locations
      WHERE member_id=$1
        AND ($2::timestamptz IS NULL OR recorded_at >= $2)
        AND ($3::timestamptz IS NULL OR recorded_at <= $3)
      ORDER BY recorded_at DESC
      LIMIT $4`,
    [req.params.memberId, from || null, to || null, limit]
  );
  res.json({ locations: result.rows });
}));

const safePlaceSchema = z.object({
  name: z.string().trim().min(1).max(80),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radiusM: z.number().int().min(50).max(5000).default(150),
  notifyArrival: z.boolean().default(true),
  notifyDeparture: z.boolean().default(true),
});

app.get('/v1/safe-places', authenticate, asyncRoute(async (req, res) => {
  const result = await query(
    `SELECT id,name,latitude,longitude,radius_m,notify_arrival,notify_departure,created_at,updated_at
       FROM safe_places WHERE family_id=$1 ORDER BY created_at ASC`,
    [req.auth.familyId]
  );
  res.json({ safePlaces: result.rows });
}));

app.post('/v1/safe-places', authenticate, parentOnly, validate(safePlaceSchema), asyncRoute(async (req, res) => {
  const b = req.validated;
  const id = randomId();
  await query(
    `INSERT INTO safe_places
      (id,family_id,name,latitude,longitude,radius_m,notify_arrival,notify_departure,created_by_user_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [id, req.auth.familyId, b.name, b.latitude, b.longitude, b.radiusM, b.notifyArrival, b.notifyDeparture, req.auth.userId]
  );
  await audit({ familyId: req.auth.familyId, userId: req.auth.userId, memberId: req.auth.memberId, eventType: 'safe_place_created', metadata: { id, name: b.name } });
  res.status(201).json({ id, ...b });
}));

app.delete('/v1/safe-places/:id', authenticate, parentOnly, asyncRoute(async (req, res) => {
  const result = await query('DELETE FROM safe_places WHERE id=$1 AND family_id=$2 RETURNING id,name', [req.params.id, req.auth.familyId]);
  if (!result.rowCount) return res.status(404).json({ error: 'SAFE_PLACE_NOT_FOUND' });
  await audit({ familyId: req.auth.familyId, userId: req.auth.userId, memberId: req.auth.memberId, eventType: 'safe_place_deleted', metadata: result.rows[0] });
  res.status(204).end();
}));

const pushTokenSchema = z.object({
  token: z.string().trim().min(16).max(512),
  platform: z.enum(['ios','android','web','unknown']).default('unknown'),
});

app.post('/v1/push-token', authenticate, validate(pushTokenSchema), asyncRoute(async (req, res) => {
  const { token, platform } = req.validated;
  if (req.auth.kind === 'device') {
    await query('UPDATE devices SET push_token=$1, platform=$2, updated_at=NOW() WHERE id=$3', [token, platform, req.auth.deviceId]);
  } else {
    const existing = await query('SELECT id FROM user_push_tokens WHERE token=$1', [token]);
    if (existing.rowCount) {
      await query('UPDATE user_push_tokens SET user_id=$1,platform=$2,enabled=TRUE,updated_at=NOW() WHERE token=$3', [req.auth.userId, platform, token]);
    } else {
      await query(
        `INSERT INTO user_push_tokens (id,user_id,token,platform) VALUES ($1,$2,$3,$4)`,
        [randomId(), req.auth.userId, token, platform]
      );
    }
  }
  res.status(204).end();
}));

const sosSchema = z.object({
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  batteryPct: z.number().int().min(0).max(100).optional(),
  note: z.string().trim().max(240).optional(),
});

app.post('/v1/sos', authenticate, validate(sosSchema), asyncRoute(async (req, res) => {
  const id = randomId();
  const b = req.validated;
  await query(
    `INSERT INTO sos_alerts (id,family_id,member_id,latitude,longitude,battery_pct,note)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [id, req.auth.familyId, req.auth.memberId, b.latitude ?? null, b.longitude ?? null, b.batteryPct ?? null, b.note || null]
  );
  await audit({ familyId: req.auth.familyId, userId: req.auth.userId || null, memberId: req.auth.memberId, eventType: 'sos_started', metadata: { id } });

  let push = { sent: 0 };
  try {
    const tokens = await familyUserPushTokens(req.auth.familyId);
    push = await sendExpoPush(tokens, {
      title: 'AGAM Family — SOS',
      body: `${req.auth.displayName || 'Family member'} sent an emergency SOS.`,
      data: { type: 'sos', sosId: id, memberId: req.auth.memberId, url: '/sos' },
      sound: 'default',
      priority: 'high',
    });
  } catch (err) {
    console.error('[push] sos send failed', err.message);
  }
  res.status(201).json({ id, status: 'active', push });
}));

app.get('/v1/sos/active', authenticate, asyncRoute(async (req, res) => {
  const result = await query(
    `SELECT s.id,s.member_id,s.status,s.latitude,s.longitude,s.battery_pct,s.note,s.started_at,
            m.display_name
       FROM sos_alerts s JOIN members m ON m.id=s.member_id
      WHERE s.family_id=$1 AND s.status='active'
      ORDER BY s.started_at DESC`,
    [req.auth.familyId]
  );
  res.json({ alerts: result.rows });
}));

app.post('/v1/sos/:id/resolve', authenticate, parentOnly, asyncRoute(async (req, res) => {
  const result = await query(
    `UPDATE sos_alerts SET status='resolved',resolved_at=NOW(),resolved_by_user_id=$1
      WHERE id=$2 AND family_id=$3 AND status='active'
      RETURNING id,member_id,resolved_at`,
    [req.auth.userId, req.params.id, req.auth.familyId]
  );
  if (!result.rowCount) return res.status(404).json({ error: 'ACTIVE_SOS_NOT_FOUND' });
  await audit({ familyId: req.auth.familyId, userId: req.auth.userId, memberId: req.auth.memberId, eventType: 'sos_resolved', metadata: { sosId: req.params.id } });
  res.json({ resolved: true, ...result.rows[0] });
}));

const eventSchema = z.object({
  type: z.enum(['geofence_enter','geofence_exit','check_in','permission_changed','audio_requested','audio_started','audio_ended']),
  metadata: z.record(z.string(), z.any()).default({}),
});

app.post('/v1/events', authenticate, validate(eventSchema), asyncRoute(async (req, res) => {
  await audit({
    familyId: req.auth.familyId,
    userId: req.auth.userId || null,
    memberId: req.auth.memberId,
    eventType: req.validated.type,
    metadata: req.validated.metadata,
  });
  res.status(202).json({ accepted: true });
}));

app.get('/v1/privacy-log', authenticate, parentOnly, asyncRoute(async (req, res) => {
  const result = await query(
    `SELECT a.id,a.event_type,a.metadata,a.created_at,
            u.display_name AS actor_user_name,
            m.display_name AS actor_member_name
       FROM audit_events a
       LEFT JOIN users u ON u.id=a.actor_user_id
       LEFT JOIN members m ON m.id=a.actor_member_id
      WHERE a.family_id=$1
      ORDER BY a.created_at DESC
      LIMIT 200`,
    [req.auth.familyId]
  );
  res.json({ events: result.rows });
}));

app.use((req, res) => res.status(404).json({ error: 'NOT_FOUND', path: req.path }));

app.use((err, _req, res, _next) => {
  console.error('[api]', err);
  if (err?.message === 'CORS_NOT_ALLOWED') return res.status(403).json({ error: 'CORS_NOT_ALLOWED' });
  if (err?.message === 'DATABASE_NOT_CONFIGURED') return res.status(503).json({ error: 'DATABASE_NOT_CONFIGURED' });
  if (err?.message === 'INVALID_OR_EXPIRED_PAIRING_CODE') return res.status(err.status || 404).json({ error: err.message });
  if (err?.code === '23505') return res.status(409).json({ error: 'CONFLICT' });
  res.status(err?.status || 500).json({ error: 'INTERNAL_ERROR' });
});

async function boot() {
  const migration = await migrate();
  console.log(`[agam-api] migrations ${migration.skipped ? 'skipped (no DATABASE_URL)' : 'ready'}`);
  app.listen(PORT, () => console.log(`[agam-api] listening on ${PORT}`));
}

boot().catch((err) => {
  console.error('[agam-api] boot failed', err);
  process.exit(1);
});
