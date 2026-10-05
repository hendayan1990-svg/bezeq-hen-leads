import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-change-me';
const PAIRING_SECRET = process.env.PAIRING_SECRET || JWT_SECRET;

export function randomId() {
  return crypto.randomUUID();
}

export function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

export function issueUserToken({ userId, familyId, memberId, role = 'parent' }) {
  return jwt.sign(
    { sub: userId, familyId, memberId, role, kind: 'user' },
    JWT_SECRET,
    { issuer: 'agam-family-api', audience: 'agam-family-app', expiresIn: '30d' }
  );
}

export function issueDeviceToken({ deviceId, memberId, familyId, role, tokenVersion }) {
  return jwt.sign(
    { sub: deviceId, deviceId, memberId, familyId, role, tokenVersion, kind: 'device' },
    JWT_SECRET,
    { issuer: 'agam-family-api', audience: 'agam-family-app', expiresIn: '180d' }
  );
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET, {
    issuer: 'agam-family-api',
    audience: 'agam-family-app',
  });
}

export function hashPairCode(code) {
  return crypto
    .createHmac('sha256', PAIRING_SECRET)
    .update(String(code).replace(/\D/g, ''))
    .digest('hex');
}

export function createPairCode() {
  return String(crypto.randomInt(100000, 1000000));
}

export function requireProductionSecrets() {
  const errors = [];
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) errors.push('JWT_SECRET');
    if (!process.env.PAIRING_SECRET || process.env.PAIRING_SECRET.length < 32) errors.push('PAIRING_SECRET');
  }
  if (errors.length) throw new Error(`Missing/weak production secrets: ${errors.join(', ')}`);
}
