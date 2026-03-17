# Click Vape Pro com Pix automático (C7)

Este projeto já está preparado para rodar no Netlify com:
- checkout profissional
- login de cliente
- login do admin
- geração automática de cobrança Pix via Carteira do 7
- QR Code real e Pix copia e cola
- consulta automática de status do pagamento

## Variáveis do Netlify
Configure estas variáveis em **Site configuration > Environment variables**:

- `VITE_STORE_NAME`
- `VITE_WHATSAPP_NUMBER`
- `VITE_PIX_KEY`
- `VITE_PIX_KEY_TYPE`
- `VITE_PIX_CITY`
- `VITE_FIXED_SHIPPING`
- `VITE_ADMIN_PASSWORD`
- `C7_API_KEY`
- `C7_API_SECRET`
- `C7_WEBHOOK_URL` (opcional)

Use o `Token Interno` como `C7_API_SECRET` se ele for o segredo HMAC da conta.

## Deploy no Netlify
Como esse fluxo usa **Netlify Functions**, não basta subir só a pasta `dist`.

Faça o deploy do **projeto inteiro**:
1. Suba este projeto para GitHub
2. No Netlify, clique em **Add new project**
3. Importe o repositório
4. O Netlify vai usar automaticamente:
   - build command: `npm run build`
   - publish directory: `dist`
   - functions directory: `netlify/functions`

O arquivo `netlify.toml` já está pronto.

## Rotas principais
- `/` loja
- `/login` login/cadastro do cliente
- `/conta` pedidos do cliente
- `/admin` painel admin

## Observação importante
A geração e a confirmação do pagamento são reais pela API C7.
Os dados de conta do cliente e a lista de pedidos continuam salvos no navegador (`localStorage`).
Para operação multi-dispositivo e persistência real de pedidos, o próximo passo ideal é integrar um banco como Supabase.
