// Callback do OAuth. GitHub redireciona para cá com ?code=...&state=...
// Trocamos o code por um access_token e devolvemos via handshake postMessage
// para a janela do Decap CMS (aberta em /admin).
//
// Protocolo do Decap CMS (netlify-auth-js):
//   1. popup → admin: "authorizing:github"
//   2. admin → popup: "authorizing:github"   (confirmação)
//   3. popup → admin: "authorization:github:success:<json>"

export default async function handler(req, res) {
  const { code, state } = req.query;
  const cookies = parseCookies(req.headers.cookie || '');
  const expected = cookies.oauth_state;

  const fail = (msg) => sendPostMessage(res, 'error', msg);

  if (!code) return fail('Sem code na resposta do GitHub.');
  if (!expected) return fail('Cookie oauth_state ausente. Verifique cookies de terceiros.');
  if (expected !== state) return fail('State inválido — possível CSRF ou cookie perdido.');

  const clientId = process.env.OAUTH_GITHUB_CLIENT_ID;
  const clientSecret = process.env.OAUTH_GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) return fail('Vars OAUTH_GITHUB_* ausentes na Vercel.');

  try {
    const r = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
    });
    const data = await r.json();
    if (data.error) return fail(`${data.error}: ${data.error_description ?? ''}`);
    const token = data.access_token;
    if (!token) return fail('Sem access_token na resposta do GitHub.');

    sendPostMessage(res, 'success', { token, provider: 'github' });
  } catch (err) {
    fail(err?.message || 'Erro inesperado.');
  }
}

function parseCookies(str) {
  return Object.fromEntries(
    str
      .split(';')
      .map((p) => p.trim().split('='))
      .filter((p) => p.length === 2)
      .map(([k, v]) => [k, decodeURIComponent(v)]),
  );
}

function sendPostMessage(res, status, payload) {
  const isSuccess = status === 'success';
  const finalMessage = isSuccess
    ? `authorization:github:success:${JSON.stringify(payload)}`
    : `authorization:github:error:${JSON.stringify({ message: payload })}`;

  const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8" /><title>Autorização</title>
<style>
  body { font-family: system-ui, -apple-system, sans-serif; padding: 2rem; background: #f5f3ee; color: #1c1c20; text-align: center; }
  .ok { color: #4d8b3a; }
  .fail { color: #c0392b; }
  pre { background: #fff; padding: 1rem; border-radius: 6px; border: 1px solid #d9d6cc; white-space: pre-wrap; word-break: break-all; font-size: 12px; text-align: left; }
  button { margin-top: 1rem; padding: .6rem 1rem; background: #1c1c20; color: #fff; border: 0; border-radius: 6px; cursor: pointer; }
</style>
</head><body>
<h2 class="${isSuccess ? 'ok' : 'fail'}">${isSuccess ? 'Autorização concluída' : 'Autorização falhou'}</h2>
${isSuccess ? '<p>Pode fechar esta janela.</p>' : `<p>Motivo:</p><pre>${escapeHtml(typeof payload === 'string' ? payload : JSON.stringify(payload))}</pre><button onclick="window.close()">Fechar</button>`}
<script>
(function(){
  var finalMsg = ${JSON.stringify(finalMessage)};
  var handshakeMsg = 'authorizing:github';
  var done = false;
  function post(msg){
    try {
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(msg, '*');
      }
    } catch(e) {}
  }
  // 1) inicia handshake — repete até o opener responder
  post(handshakeMsg);
  var iv = setInterval(function(){
    if (done) { clearInterval(iv); return; }
    post(handshakeMsg);
  }, 200);
  // fallback 5s
  setTimeout(function(){
    if (!done) {
      done = true;
      clearInterval(iv);
      post(finalMsg);
      ${isSuccess ? "setTimeout(function(){ try { window.close(); } catch(e){} }, 600);" : ''}
    }
  }, 5000);
  // 2) opener respondeu → envia mensagem final
  window.addEventListener('message', function(e){
    if (e.data === handshakeMsg && !done) {
      done = true;
      clearInterval(iv);
      post(finalMsg);
      ${isSuccess ? "setTimeout(function(){ try { window.close(); } catch(e){} }, 600);" : ''}
    }
  }, false);
})();
</script>
</body></html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader(
    'Set-Cookie',
    'oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/api; Max-Age=0',
  );
  res.status(200).send(html);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
