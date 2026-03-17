import crypto from 'node:crypto';

export const json = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
  },
  body: JSON.stringify(body),
});

export const requiredEnv = () => {
  const apiKey = process.env.C7_API_KEY;
  const apiSecret = process.env.C7_API_SECRET || process.env.C7_INTERNAL_TOKEN;
  const baseUrl = process.env.C7_BASE_URL || 'https://api.carteirado7.com/v2';
  if (!apiKey || !apiSecret) {
    throw new Error('C7_API_KEY ou C7_API_SECRET ausente');
  }
  return { apiKey, apiSecret, baseUrl };
};

export const signBody = (apiSecret, bodyText) => {
  const ts = Math.floor(Date.now() / 1000).toString();
  const sig = crypto.createHmac('sha256', apiSecret).update(`${ts}.${bodyText}`).digest('hex');
  return { ts, sig };
};

export const verifyWebhook = (apiSecret, timestamp, rawBody, signature) => {
  if (!timestamp || !signature) return false;
  const now = Math.floor(Date.now() / 1000);
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(now - ts) > 300) return false;
  const expected = crypto.createHmac('sha256', apiSecret).update(`${timestamp}.${rawBody}`).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
};

export const c7Fetch = async ({ path, method = 'GET', body }) => {
  const { apiKey, apiSecret, baseUrl } = requiredEnv();
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  let bodyText;
  if (body !== undefined) {
    bodyText = JSON.stringify(body);
    const { ts, sig } = signBody(apiSecret, bodyText);
    headers['X-C7-Timestamp'] = ts;
    headers['X-C7-Signature'] = sig;
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: bodyText,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error || data?.message || `C7 ${response.status}`);
  }
  return data;
};
