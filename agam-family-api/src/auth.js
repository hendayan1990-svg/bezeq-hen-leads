import { query } from './db.js';
import { verifyToken } from './security.js';

function bearer(req) {
  const raw = req.headers.authorization || '';
  const [scheme, token] = raw.split(' ');
  return scheme?.toLowerCase() === 'bearer' && token ? token : null;
}

export async function authenticate(req, res, next) {
  try {
    const token = bearer(req);
    if (!token) return res.status(401).json({ error: 'UNAUTHORIZED' });
    const claims = verifyToken(token);

    if (claims.kind === 'device') {
      const result = await query(
        `SELECT d.id, d.member_id, d.token_version, d.revoked_at,
                m.family_id, m.role, m.display_name
           FROM devices d
           JOIN members m ON m.id = d.member_id
          WHERE d.id = $1`,
        [claims.deviceId]
      );
      const device = result.rows[0];
      if (!device || device.revoked_at || Number(device.token_version) !== Number(claims.tokenVersion)) {
        return res.status(401).json({ error: 'DEVICE_REVOKED' });
      }
      req.auth = {
        kind: 'device',
        deviceId: device.id,
        memberId: device.member_id,
        familyId: device.family_id,
        role: device.role,
        displayName: device.display_name,
      };
      await query('UPDATE devices SET last_seen_at = NOW(), updated_at = NOW() WHERE id = $1', [device.id]);
      return next();
    }

    if (claims.kind === 'user') {
      const result = await query(
        `SELECT u.id AS user_id, u.display_name, m.id AS member_id, m.family_id, m.role
           FROM users u
           JOIN members m ON m.user_id = u.id
          WHERE u.id = $1 AND m.family_id = $2`,
        [claims.sub, claims.familyId]
      );
      const row = result.rows[0];
      if (!row) return res.status(401).json({ error: 'USER_ACCESS_REVOKED' });
      req.auth = {
        kind: 'user',
        userId: row.user_id,
        memberId: row.member_id,
        familyId: row.family_id,
        role: row.role,
        displayName: row.display_name,
      };
      return next();
    }

    return res.status(401).json({ error: 'UNAUTHORIZED' });
  } catch (err) {
    if (String(err?.message).includes('DATABASE_NOT_CONFIGURED')) {
      return res.status(503).json({ error: 'DATABASE_NOT_CONFIGURED' });
    }
    return res.status(401).json({ error: 'UNAUTHORIZED' });
  }
}

export function parentOnly(req, res, next) {
  if (req.auth?.kind !== 'user' || !['parent', 'guardian'].includes(req.auth?.role)) {
    return res.status(403).json({ error: 'PARENT_OR_GUARDIAN_REQUIRED' });
  }
  next();
}

export function ownerParentOnly(req, res, next) {
  if (req.auth?.kind !== 'user' || req.auth?.role !== 'parent') {
    return res.status(403).json({ error: 'PARENT_REQUIRED' });
  }
  next();
}
