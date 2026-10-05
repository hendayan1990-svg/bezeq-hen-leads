import { query } from './db.js';

export async function familyUserPushTokens(familyId) {
  const result = await query(
    `SELECT DISTINCT p.token
       FROM user_push_tokens p
       JOIN members m ON m.user_id = p.user_id
      WHERE m.family_id = $1
        AND m.role IN ('parent','guardian')
        AND p.enabled = TRUE`,
    [familyId]
  );
  return result.rows.map((r) => r.token).filter(Boolean);
}

function isExpoPushToken(value) {
  return typeof value === 'string' &&
    (value.startsWith('ExponentPushToken[') || value.startsWith('ExpoPushToken['));
}

export async function sendExpoPush(tokens, { title, body, data = {}, sound = 'default', priority = 'high' }) {
  const clean = [...new Set(tokens.filter(isExpoPushToken))];
  if (!clean.length) return { sent: 0, skipped: true };

  const messages = clean.map((to) => ({
    to,
    title,
    body,
    data,
    sound,
    priority,
    channelId: 'agam-safety',
  }));

  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json',
      'accept-encoding': 'gzip, deflate',
    },
    body: JSON.stringify(messages),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`EXPO_PUSH_${response.status}: ${text.slice(0, 300)}`);
  }
  const json = await response.json();
  return { sent: clean.length, response: json };
}
