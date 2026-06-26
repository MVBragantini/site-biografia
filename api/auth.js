// Inicia o fluxo OAuth com o GitHub para o Decap CMS.
// Redireciona o browser para a tela de autorização do GitHub.
// O usuário aprova, GitHub redireciona de volta para /api/callback com ?code=...
//
// Vars de ambiente esperadas (configurar na Vercel):
//   OAUTH_GITHUB_CLIENT_ID
//   OAUTH_GITHUB_CLIENT_SECRET   (só usado em callback.js)

import crypto from 'node:crypto';

export default function handler(req, res) {
  const clientId = process.env.OAUTH_GITHUB_CLIENT_ID;
  if (!clientId) {
    res.status(500).send('OAUTH_GITHUB_CLIENT_ID não configurado.');
    return;
  }

  const host = req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const redirectUri = `${proto}://${host}/api/callback`;

  const state = crypto.randomBytes(16).toString('hex');

  res.setHeader(
    'Set-Cookie',
    `oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/api; Max-Age=600`,
  );

  const url = new URL('https://github.com/login/oauth/authorize');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('scope', 'repo,user');
  url.searchParams.set('state', state);

  res.writeHead(302, { Location: url.toString() });
  res.end();
}
