// Callback do OAuth. GitHub redireciona para cá com ?code=...&state=...
// Trocamos o code por um access_token e devolvemos via window.postMessage
// para a janela do Decap CMS (aberta em /admin), que está aguardando.

export default async function handler(req, res) {
  const { code, state } = req.query;
  const cookies = parseCookies(req.headers.cookie || '');
  const expected = cookies.oauth_state;

  const fail = (msg) => sendPostMessage(res, 'error', msg);

  if (!code) return fail('Sem code na resposta do GitHub.');
  if (!expected || expected !== state) return fail('State inválido.');

  const clientId = process.env.OAUTH_GITHUB_CLIENT_ID;
  const clientSecret = process.env.OAUTH_GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) return fail('Vars de ambiente ausentes.');

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
  const message =
    status === 'success'
      ? `authorization:github:success:${JSON.stringify(payload)}`
      : `authorization:github:error:${JSON.stringify({ message: payload })}`;

  const html = `<!doctype html><html><body><script>
(function(){
  function send(){ window.opener && window.opener.postMessage(${JSON.stringify(message)}, '*'); }
  window.addEventListener('message', function once(e){
    if (e.data === 'authorizing:github') { send(); window.removeEventListener('message', once); }
  }, false);
  send();
  setTimeout(function(){ window.close(); }, 1500);
})();
</script><p style="font-family:system-ui;padding:2rem">Autorização ${status === 'success' ? 'concluída' : 'falhou'}. Esta aba se fecha em instantes.</p></body></html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader(
    'Set-Cookie',
    'oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/api; Max-Age=0',
  );
  res.status(200).send(html);
}
