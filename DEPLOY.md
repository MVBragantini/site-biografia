# Deploy — bragantini.com.br

Status:

- ✅ Site no ar (preview): https://bragantini.vercel.app
- ✅ Repo conectado ao GitHub: cada push para `main` faz redeploy automático
- ⏳ Domínio `bragantini.com.br` registrado na Vercel, aguardando DNS apontar
- ⏳ Painel `/admin` aguardando OAuth do GitHub

## 1. Apontar o DNS `bragantini.com.br` da Hostinger para a Vercel

Você comprou o domínio na Hostinger. A Vercel precisa que o DNS aponte para os servidores dela. Acesse o **hPanel da Hostinger → Domínios → bragantini.com.br → DNS / Nameservers** e faça uma de duas opções:

### Opção A (recomendada): trocar só os registros A e CNAME

Mantém os nameservers da Hostinger e adiciona estes registros DNS:

| Tipo  | Nome   | Valor              | TTL   |
| ----- | ------ | ------------------ | ----- |
| A     | `@`    | `76.76.21.21`      | 14400 |
| CNAME | `www`  | `cname.vercel-dns.com.` | 14400 |

**Apague** os registros A/AAAA/CNAME antigos do Hostinger que estiverem em `@` e `www` (que apontam para a hospedagem antiga). Mantenha registros MX (email) se houver.

### Opção B: mudar nameservers para a Vercel

Troque os nameservers do domínio na Hostinger para:

```
ns1.vercel-dns.com
ns2.vercel-dns.com
```

A Vercel passa a cuidar de todo o DNS. Mais simples, mas se você tiver email no domínio, precisa migrar os MX para lá também.

**Propagação:** de 10 min a algumas horas. Verifique em https://dnschecker.org/#A/bragantini.com.br.

Depois que propagar, a Vercel emite o SSL automaticamente. O site fica em `https://bragantini.com.br`.

## 2. Criar OAuth App no GitHub (para o painel `/admin`)

1. Acesse https://github.com/settings/developers → **OAuth Apps** → **New OAuth App**
2. Preencha:

   | Campo                       | Valor                                       |
   | --------------------------- | ------------------------------------------- |
   | Application name            | `bragantini.com.br admin`                   |
   | Homepage URL                | `https://bragantini.com.br`                 |
   | Authorization callback URL  | `https://bragantini.com.br/api/callback`    |

3. **Register application** → guarde o **Client ID**
4. **Generate a new client secret** → guarde o **Client Secret** (só aparece uma vez)

## 3. Configurar variáveis de ambiente na Vercel

Em https://vercel.com/marcus-projects-032a47c8/bragantini → **Settings → Environment Variables**:

| Nome                          | Valor                       | Ambiente                       |
| ----------------------------- | --------------------------- | ------------------------------ |
| `OAUTH_GITHUB_CLIENT_ID`      | (Client ID do passo 2)      | Production, Preview, Development |
| `OAUTH_GITHUB_CLIENT_SECRET`  | (Client Secret do passo 2)  | Production, Preview, Development |

Salve. Depois vá em **Deployments → último → ⋯ → Redeploy** para que as variáveis sejam aplicadas.

## 4. Pronto — testar `/admin`

Acesse `https://bragantini.com.br/admin`, clique **Login with GitHub**, autorize.

Você verá 3 coleções:

- **Manuais** — para adicionar PDFs (CFW09, IHMs, etc.)
- **Fotos** — para o álbum de campo
- **Configurações** — para trocar nome, contatos e a foto do hero

Cada vez que você salvar algo no painel, o CMS faz um commit no GitHub. A Vercel detecta e rebuilda em ~30s. Suas mudanças vão ao ar automaticamente.

---

## Comandos úteis

```bash
# ver status do deploy
vercel inspect

# fazer deploy manual (só se quiser pular o git push)
vercel deploy --prod

# logs em tempo real
vercel logs

# listar domínios do projeto
vercel domains ls
```
