export type RemotePayment = {
  id: string;
  externalId: string;
  amount: string;
  status: string;
  pixCopiaECola?: string;
  qrCodeBase64?: string;
  expiresAt?: string;
  payer?: {
    name?: string;
    document?: string;
  };
  updatedAt?: string;
};

const parseJson = async (response: Response) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.ok === false) {
    throw new Error(data?.error || data?.message || 'Erro no pagamento');
  }
  return data;
};

export const createRemotePayment = async (payload: { amount: number; externalId: string }) => {
  const response = await fetch('/.netlify/functions/create-c7-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await parseJson(response);
  return data.payment as RemotePayment;
};

export const checkRemotePayment = async (paymentId: string) => {
  const response = await fetch(`/.netlify/functions/check-c7-payment?paymentId=${encodeURIComponent(paymentId)}`);
  const data = await parseJson(response);
  return data.payment as RemotePayment;
};
