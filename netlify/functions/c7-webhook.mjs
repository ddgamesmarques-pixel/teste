import { json, requiredEnv, verifyWebhook } from './_c7.mjs';

export default async (req) => {
  if (req.method !== 'POST') return json(405, { ok: false, error: 'method_not_allowed' });
  try {
    const { apiSecret } = requiredEnv();
    const signature = req.headers['x-c7-signature'];
    const timestamp = req.headers['x-c7-timestamp'];
    const rawBody = req.body || '{}';
    const valid = verifyWebhook(apiSecret, timestamp, rawBody, signature);
    if (!valid) return json(401, { ok: false, error: 'invalid_signature' });

    const payload = JSON.parse(rawBody || '{}');
    return json(200, {
      ok: true,
      received: true,
      event: payload?.event || req.headers['x-c7-event'] || 'unknown',
      correlationID: payload?.data?.correlationID || null,
    });
  } catch (error) {
    return json(500, { ok: false, error: error.message || 'webhook_failed' });
  }
};
