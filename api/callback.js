// Callback do OAuth. GitHub redireciona para cá com ?code=...&state=...
// Trocamos o code por um access_token e devolvemos via window.postMessage
// para a janela do Decap CMS (aberta em /admin), que está aguardando.

export default async function handler(req, res) {
  const { code, state } = req.query;
  const cookies = parseCookies(req.headers.cookie || '');
  const expected = cookies.oauth_state;

  const fail = (msg) => sendPostMessage(res, 'error', msg);

  if (!code) return fail('Sem code na resposta do GitHub.');
  if (!expected) return fail('Cookie oauth_state ausente (talvez bloqueado pelo navegador). Verifique cookies de terceiros.');
  if (expected !== state) return fail(`State inválido. Esperado: ${expected.slice(0, 6)}... Recebido: ${String(state).slice(0, 6)}...`);

  const clientId = process.env.OAUTH_GITHUB_CLIENT_ID;
  const clientSecret = process.env.OAUTH_GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) return fail('Vars de ambiente OAUTH_GITHUB_* ausentes na Vercel.');

  try {
    const r = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });
    const data = await r.json();
    if (data.error) return fail(`${data.error}: ${data.error_description ?? ''}`);
    const token = data.access_token;
    if (!token) return fail('Sem access_token na resposta.');

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
  const message = isSuccess
    ? `authorization:github:success:${JSON.stringify(payload)}`
    : `authorization:github:error:${JSON.stringify({ message: payload })}`;

  // HTML que:
  // 1. Envia postMessage imediatamente (caso o opener já esteja escutando)
  // 2. Re-envia quando receber "authorizing:github" do opener (padrão Decap)
  // 3. Re-envia mais 3x a cada 200ms (defensivo)
  // 4. Se sucesso, fecha em 800ms. Se erro, fica aberto e mostra mensagem.
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
${isSuccess ? '<p>Token recebido. Se a janela do admin não atualizar sozinha, abra o Console (F12) e me avise.</p><pre id="debug-info" style="margin-top:1rem">aguardando…</pre><button onclick="window.close()">Fechar manualmente</button>' : `<p>Motivo:</p><pre>${escapeHtml(typeof payload === 'string' ? payload : JSON.stringify(payload))}</pre><button onclick="window.close()">Fechar</button>`}
<script>
(function(){
  var msg = ${JSON.stringify(message)};
  var sent = 0;
  var debugEl = document.getElementById('debug-info');
  function log(s){
    console.log('[OAuth callback]', s);
    if (debugEl) debugEl.textContent = s;
  }
  function send(){
    try {
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(msg, '*');
        sent++;
        log('postMessage enviada ('+sent+'x) — opener: ' + window.opener.location.origin);
      } else {
        log('window.opener é null ou fechado — popup sem opener!');
      }
    } catch(e) {
      log('Erro ao postar: ' + e.message);
    }
  }
  window.addEventListener('message', function(e){
    log('recebeu mensagem: ' + JSON.stringify({origin: e.origin, data: e.data}).slice(0, 200));
    if (e.data === 'authorizing:github') send();
  }, false);
  send();
  var t = 0;
  var iv = setInterval(function(){
    t++;
    send();
    if (t >= 5) clearInterval(iv);
  }, 300);
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
