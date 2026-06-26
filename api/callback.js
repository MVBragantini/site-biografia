// Callback do OAuth. GitHub redireciona para cá com ?code=...&state=...
// Trocamos o code por um access_token e, via handshake postMessage,
// devolvemos para a janela do Decap CMS (aberta em /admin).
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

  // Implementa o protocolo handshake do Decap CMS:
  // 1. Popup envia 'authorizing:github'
  // 2. Admin responde 'authorizing:github'
  // 3. Popup envia 'authorization:github:success:<json>' (a mensagem final)
  const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8" /><title>Autorização</title>
<style>
  body { font-family: system-ui, -apple-system, sans-serif; padding: 2rem; background: #f5f3ee; color: #1c1c20; }
  .ok { color: #4d8b3a; }
  .fail { color: #c0392b; }
  pre { background: #fff; padding: 1rem; border-radius: 6px; border: 1px solid #d9d6cc; white-space: pre-wrap; word-break: break-all; font-size: 12px; }
  button { margin-top: 1rem; padding: .6rem 1rem; background: #1c1c20; color: #fff; border: 0; border-radius: 6px; cursor: pointer; }
</style>
</head><body>
<h2 class="${isSuccess ? 'ok' : 'fail'}">${isSuccess ? 'Autorização concluída' : 'Autorização falhou'}</h2>
${isSuccess ? '<p>Esta janela fecha em instantes…</p>' : `<p>Motivo:</p><pre>${escapeHtml(typeof payload === 'string' ? payload : JSON.stringify(payload))}</pre><button onclick="window.close()">Fechar</button>`}
<script>
(function(){
  var finalMsg = ${JSON.stringify(finalMessage)};
  var handshakeMsg = 'authorizing:github';
  var handshakeDone = false;
  function post(msg){
    try {
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(msg, '*');
      }
    } catch(e) {}
  }
  // 1) inicia handshake — repete a cada 200ms até o opener responder
  function startHandshake(){
    post(handshakeMsg);
    var iv = setInterval(function(){
      if (handshakeDone) { clearInterval(iv); return; }
      post(handshakeMsg);
    }, 200);
    // se o opener não responder em 5s, manda o final mesmo assim como fallback
    setTimeout(function(){
      if (!handshakeDone) {
        clearInterval(iv);
        post(finalMsg);
        ${isSuccess ? "setTimeout(function(){ try { window.close(); } catch(e){} }, 800);" : ''}
      }
    }, 5000);
  }
  // 2) quando o opener responder 'authorizing:github', enviar a mensagem final
  window.addEventListener('message', function(e){
    if (e.data === handshakeMsg && !handshakeDone) {
      handshakeDone = true;
      post(finalMsg);
      ${isSuccess ? "setTimeout(function(){ try { window.close(); } catch(e){} }, 800);" : ''}
    }
  }, false);
  startHandshake();
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
