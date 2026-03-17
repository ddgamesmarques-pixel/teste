import { c7Fetch, json } from './_c7.mjs';

export default async (req) => {
  if (req.method !== 'GET') return json(405, { ok: false, error: 'method_not_allowed' });
  try {
    const paymentId = String(req.queryStringParameters?.paymentId || '').trim();
    if (!paymentId) return json(400, { ok: false, error: 'payment_id_required' });
    const data = await c7Fetch({ path: `/payment/${encodeURIComponent(paymentId)}/status` });
    return json(200, data);
  } catch (error) {
    return json(500, { ok: false, error: error.message || 'payment_status_failed' });
  }
};
