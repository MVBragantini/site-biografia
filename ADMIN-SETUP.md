# Painel /admin — setup do OAuth com GitHub

O painel visual em `/admin` (Decap CMS) precisa de uma **OAuth App do GitHub** para autenticar logins. Isso é configurado **uma única vez**, depois que o site estiver na Vercel.

## 1. Criar a OAuth App no GitHub

1. Acesse https://github.com/settings/developers → **OAuth Apps** → **New OAuth App**
2. Preencha:

   | Campo                       | Valor                                       |
   | --------------------------- | ------------------------------------------- |
   | Application name            | `bragantini.com.br admin`                   |
   | Homepage URL                | `https://bragantini.com.br`                 |
   | Authorization callback URL  | `https://bragantini.com.br/api/callback`    |

3. Clique em **Register application**
4. Guarde o **Client ID** que aparece
5. Clique em **Generate a new client secret** e guarde o **Client Secret** (só aparece uma vez)

## 2. Configurar as variáveis na Vercel

No projeto da Vercel: **Settings → Environment Variables**, adicione:

| Nome                          | Valor                       |
| ----------------------------- | --------------------------- |
| `OAUTH_GITHUB_CLIENT_ID`      | (o Client ID do passo 1)    |
| `OAUTH_GITHUB_CLIENT_SECRET`  | (o Client Secret do passo 1) |

Marque **Production**, **Preview** e **Development**. Salve.

## 3. Fazer um novo deploy

Na Vercel → **Deployments → Redeploy** para que as variáveis sejam aplicadas.

## 4. Pronto

Acesse `https://bragantini.com.br/admin`, clique em **Login with GitHub**, autorize, e o painel abre.

A partir daí você adiciona manuais e fotos pelo navegador. Cada salvamento gera um commit no repositório e a Vercel rebuilda o site em ~30s.

---

## Estrutura editável pelo painel

| Coleção          | Onde grava                                 | Mídia em                          |
| ---------------- | ------------------------------------------ | --------------------------------- |
| **Manuais**      | `src/content/manuais/*.md`                 | `public/becape/manuais/`          |
| **Fotos**        | `src/content/fotos/*.md`                   | `public/becape/fotos/`            |
| **Configurações** | `src/content/_config/contato.json`        | `public/img/`                     |

Em **Configurações** dá pra trocar nome, role, bio, telefone e a foto do hero sem mexer em código.
