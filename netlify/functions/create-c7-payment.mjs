import { c7Fetch, json } from './_c7.mjs';

export default async (req) => {
  if (req.method !== 'POST') return json(405, { ok: false, error: 'method_not_allowed' });
  try {
    const body = JSON.parse(req.body || '{}');
    const amount = Number(body.amount);
    const externalId = String(body.externalId || '').trim();
    if (!amount || amount <= 0 || !externalId) {
      return json(400, { ok: false, error: 'invalid_payload' });
    }

    const origin = req.headers.origin || req.headers['x-forwarded-proto'] && req.headers.host ? `${req.headers['x-forwarded-proto']}://${req.headers.host}` : '';
    const callbackUrl = process.env.C7_WEBHOOK_URL || (origin ? `${origin}/.netlify/functions/c7-webhook` : undefined);

    const data = await c7Fetch({
      path: '/payment/create',
      method: 'POST',
      body: {
        amount,
        externalId,
        callbackUrl,
      },
    });

    return json(200, data);
  } catch (error) {
    return json(500, { ok: false, error: error.message || 'payment_create_failed' });
  }
};
