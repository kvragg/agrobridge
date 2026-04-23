# AgroBridge — Migração de domínio `agrobridge.space`: passos manuais

**Contexto:** commit `7847777` (find/replace `.app` → `.space`) já está empurrado. Commit `cccccc` (este, adiciona `MANUAL_STEPS.md`) também. Abaixo, **tudo que exige mão humana**, na ordem certa, com valores já resolvidos.

**Estado real verificado via MCP (2026-04-23):**

- ✅ Domínio `agrobridge.space` **existe** (nameservers `ns1.vercel-dns.com`, `ns2.vercel-dns.com` — confirmado via DNS público).
- ✅ Vercel project `agrobridge` existe (id `prj_E0tpSRqesRftIGAm0YdD5HSzLzpx`, team `kvraggs-projects`).
- ❌ **Domínio NÃO está vinculado ao projeto.** Os domains atuais do projeto são só os `*.vercel.app` automáticos. → **Passo 0 abaixo.**
- ❌ Nenhuma env var pode ser atualizada via MCP — todas viraram passo manual (Passo 4).
- ❌ Supabase Auth config (Site URL, Redirect URLs, SMTP, templates) não tem SQL path público — tudo pelo Dashboard (Passo 5–7).
- ❌ Branch `feature/simulador-leitura` (PR #8) **ainda não foi mergeado pra `main`** (último prod deploy é `62f902d`, o merge da IA flutuante). Isso quer dizer: **NÃO disparamos redeploy de prod ainda.** O preview do branch (`dpl_4Jqd6kormvBNZ6WCMBWD6PAo4XTA`) está disponível pra testar isoladamente.

---

## Passo 0 · Vincular `agrobridge.space` ao projeto Vercel

Confirmei que o domínio existe no seu DNS Vercel, mas ele **não está anexado ao projeto `agrobridge`**. Sem isso, mesmo fazendo tudo o resto, `https://agrobridge.space` não vai servir conteúdo do app.

1. Vercel Dashboard → Projeto `agrobridge` → **Settings** → **Domains**.
2. Clicar **Add Domain** (botão no topo direito).
3. Digitar: `agrobridge.space` → **Add**.
4. Vercel vai perguntar se quer redirecionar `www.agrobridge.space` → `agrobridge.space` (ou o inverso). Recomendo: **apex principal** (`agrobridge.space` como canonical, `www` redirect pra apex).
5. **Esperado:** como os nameservers já estão em `vercel-dns.com`, o status vai pra `Valid Configuration` em segundos.

**Se der errado:** se a Vercel disser "domain already in use elsewhere", você tem o mesmo domínio em outro projeto/team. Remova de lá primeiro.

---

## Passo 1 · Resend — signup, add domain, copiar os 3 DNS records

1. Se ainda não tem conta: [resend.com/signup](https://resend.com/signup). Plano **Free** (100 emails/dia) cobre pré-launch.
2. Dashboard → **API Keys** → criar uma com nome `agrobridge-prod` e permissão "Full access". **Copie a API key** (`re_...`) — vai aparecer uma vez só, guarde agora.
3. Dashboard → **Domains** → **Add Domain**.
4. Digite: `agrobridge.space` (raiz — simples e funciona).
   - **Alternativa recomendada no `DOMAIN_SETUP.md`:** usar `mail.agrobridge.space` como subdomain isolado. Mais segura, mas exige que você reflita isso no sender email do Supabase mais tarde. Para pré-launch de 1 produto, **`agrobridge.space` raiz serve**.
5. Região: **US East**.
6. O Resend vai mostrar **3 DNS records**. Deixe essa aba aberta — você vai copiar no Passo 2.

**Valor esperado dos 3 records (template):**

| Tipo | Nome | Valor | Priority |
|---|---|---|---|
| `TXT` | `resend._domainkey` (raiz) ou `resend._domainkey.mail` (subdomain) | `p=MIGfMA0GCSqGSIb3DQEBAQUAA...` (DKIM pública única do Resend pra você) | — |
| `TXT` | `_spf` ou `send` (o nome exato vai variar) | `v=spf1 include:amazonses.com ~all` | — |
| `MX` | raiz ou `send` | `feedback-smtp.us-east-1.amazonses.com` | `10` |

**Não invento os valores exatos** — só aparecem na sua tela do Resend depois do "Add Domain".

**Bonus — DMARC** (não é obrigatório, mas aumenta deliverability em Gmail/Outlook):

| Tipo | Nome | Valor |
|---|---|---|
| `TXT` | `_dmarc` | `v=DMARC1; p=none; rua=mailto:paulocosta.contato1@gmail.com` |

Subir pra `p=quarantine` depois de 2 semanas sem spam complaints.

---

## Passo 2 · Vercel DNS — colar os 3 records

1. Vercel Dashboard → **Domains** (menu lateral, não dentro do projeto).
2. Clicar em `agrobridge.space` → aba **DNS Records**.
3. Para cada um dos 3 records do Resend: **Add Record**.
   - Tipo: escolha o do Resend (`TXT` ou `MX`).
   - Name: copiar exato do Resend (se for `resend._domainkey`, digita isso — sem adicionar `.agrobridge.space` no fim; a Vercel concatena).
   - Value: copiar exato (especialmente a DKIM — é uma string longa, cole inteira).
   - TTL: deixe 60 (default).
   - Priority (só pra MX): `10`.
   - **Save**.
4. Repita até os 3 estarem criados.
5. (Opcional) Adicione também o `_dmarc` TXT.
6. Aguarde **10 min – 1 h** (DNS Vercel costuma ser rápido). Checar propagação:
   ```
   nslookup -type=TXT resend._domainkey.agrobridge.space 8.8.8.8
   nslookup -type=MX agrobridge.space 8.8.8.8
   ```
7. Volte no Resend → página do domínio → **Verify DNS Records**. Os 3 indicadores viram verdes. **Até todos estarem verdes, emails não funcionam.**

**Se travar em pending:** provavelmente faltou o ponto/underscore no nome, ou a DKIM foi colada com quebra de linha. Apague e refaça.

---

## Passo 3 · Supabase Auth — Site URL + Redirect URLs

Sem isso, o link de confirmação dentro do email vai mandar o usuário pro lugar errado.

1. Supabase Dashboard → Projeto **agrobridge** → **Project Settings** → **Authentication** → **URL Configuration**.
2. **Site URL:** `https://agrobridge.space`
3. **Redirect URLs** (precisa cobrir todos os ambientes que devem funcionar):
   - `https://agrobridge.space/**`
   - `https://agrobridge-self.vercel.app/**` (mantém pra fallback atual)
   - `https://agrobridge-git-feature-simulador-leitura-kvraggs-projects.vercel.app/**` (preview do branch com o fix — útil pra testar antes do merge)
   - `http://localhost:3000/**` (dev local)
4. **Save**.

---

## Passo 4 · Supabase SMTP — apontar pra Resend

1. Ainda em Supabase → **Project Settings** → **Authentication** → **SMTP Settings**.
2. Marcar **Enable Custom SMTP**.
3. Preencher:

| Campo | Valor |
|---|---|
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | sua `RESEND_API_KEY` (a `re_...` que copiou no Passo 1) |
| Sender email | `no-reply@agrobridge.space` *(ou `no-reply@mail.agrobridge.space` se optou pelo subdomínio no Passo 1)* |
| Sender name | `AgroBridge` |

4. **Save**.

**⚠️ Importante:** esse sender email tem que bater com o domínio que você verificou no Resend. Se Resend só tem `agrobridge.space` verificado e você colocar `no-reply@mail.agrobridge.space`, vai dar erro de "unauthorized sender".

---

## Passo 5 · Supabase — colar os 2 templates HTML

1. Supabase → **Authentication** → **Email Templates**.
2. Aba **Confirm signup**:
   - Subject: `Confirme seu e-mail — AgroBridge`
   - Apagar HTML default.
   - Colar o conteúdo inteiro de `docs/supabase-email-templates/confirm-signup.html` (101 linhas — abre no VS Code, Ctrl+A, Ctrl+C).
   - **Save changes**.
3. Aba **Reset password**:
   - Subject: `Redefina sua senha — AgroBridge`
   - Apagar HTML default.
   - Colar `docs/supabase-email-templates/reset-password.html`.
   - **Save changes**.

---

## Passo 6 · Vercel — atualizar as env vars de Production e Preview

Sem isso, mesmo com o commit no código, o app em produção vai rodar com os valores antigos até receber um redeploy com as variáveis novas.

1. Vercel Dashboard → Projeto `agrobridge` → **Settings** → **Environment Variables**.
2. Para cada uma das variáveis abaixo, verificar se já existe. Se sim → edit, cola valor novo, marca Production + Preview, save. Se não → Add.

| Variável | Valor | Ambientes |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://agrobridge.space` | Production, Preview |
| `NEXT_PUBLIC_APP_URL` | `https://agrobridge.space` | Production, Preview |
| `RESEND_API_KEY` | `re_...` (a do Passo 1) | Production, Preview |
| `RESEND_FROM_EMAIL` | `AgroBridge <no-reply@agrobridge.space>` | Production, Preview |
| `LEAD_NOTIFICATION_EMAIL` | `paulocosta.contato1@gmail.com` | Production, Preview |

**Atenção:** mantenha qualquer valor de desenvolvimento separado em "Development" se for diferente.

3. **NÃO dispare redeploy agora** — ainda depende do merge (Passo 8).

---

## Passo 7 · Smoke test — antes do merge, no preview do branch

O preview do branch `feature/simulador-leitura` tem URL:
`https://agrobridge-git-feature-simulador-leitura-kvraggs-projects.vercel.app`

⚠️ Mas esse preview **ainda usa os valores de env var que você acabou de atualizar** (Vercel aplica envs preview mesmo em PRs abertos). Então:

1. **Force-redeploy o último commit do preview pra pegar as envs novas:**
   - Vercel Dashboard → Deployments → filtrar por branch `feature/simulador-leitura` → último deploy (commit `7847777`) → `...` → **Redeploy** → **desmarque** "Use existing Build Cache".
2. Após o redeploy ficar `READY`, abra `https://agrobridge-git-feature-simulador-leitura-kvraggs-projects.vercel.app/cadastro`.
3. Crie uma conta com seu Gmail principal.
4. Cheque:
   - ☐ Email chegou no **inbox** (não na aba Promoções, não no spam).
   - ☐ Remetente: `AgroBridge <no-reply@agrobridge.space>`.
   - ☐ Visual dark premium OK (fundo escuro, sem fundo branco esquisito).
   - ☐ Botão "Confirmar e-mail" leva pra `/auth/callback?code=...` e depois redireciona pra `/auth/confirmado`.
5. Repita com Outlook/Hotmail e Yahoo. Se algum cair em spam: Resend Dashboard → **Logs** te dá o motivo (`complained`, `bounced` etc.).

**Se algum teste falhar**, pare antes do Passo 8 e manda o erro — provavelmente é SPF/DKIM ainda propagando ou sender email errado.

---

## Passo 8 · Merge do PR #8 pra `main`

PR #8 = `feature/simulador-leitura` → `main`. Inclui Simulador + integrações Dashboard/Widget + CI + Sentry placeholder + domínio unificado.

1. GitHub → [github.com/kvragg/agrobridge/pull/8](https://github.com/kvragg/agrobridge/pull/8).
2. Se os checks do CI (GitHub Actions `.github/workflows/ci.yml`) estiverem verdes, clicar **Merge pull request**.
3. Escolher **Squash and merge** (mantém o log do main limpo; os commits individuais ficam no histórico do PR).
4. **Confirm squash and merge**.
5. Deletar o branch `feature/simulador-leitura` (botão Delete branch).

Vercel detecta o merge e dispara deploy de produção automaticamente do commit novo no `main`.

---

## Passo 9 · Confirmar prod funcionando + tag de release

1. Aguardar o deploy de produção no Vercel (~2–3 min). Dashboard → Deployments → target `production` → state `READY`.
2. Abrir `https://agrobridge.space` → ver a landing.
3. Checar OG preview no Twitter Card Validator ou WhatsApp (cola o link): deveria mostrar metadata certa (`metadataBase: https://agrobridge.space`).
4. Smoke test final em prod: criar conta de teste → confirmar email → logar.
5. Criar tag no repo:
   ```bash
   git checkout main && git pull origin main
   git tag -a v1.0.0-launch -m "Launch: domínio agrobridge.space + Simulador + Sentry ready"
   git push origin v1.0.0-launch
   ```
6. (Opcional) Anúncio: LinkedIn, Twitter, etc. — aqui entra seu funil de marketing.

---

## Checklist resumido (pra imprimir e riscar)

- [ ] **0.** Vincular `agrobridge.space` ao projeto Vercel
- [ ] **1.** Resend: criar API key + add domain + copiar 3 DNS records
- [ ] **2.** Vercel DNS: colar os 3 records + (opcional) DMARC
- [ ] **3.** Supabase Auth URL Config: Site URL + Redirect URLs
- [ ] **4.** Supabase SMTP: Host/Port/User/Pass/Sender
- [ ] **5.** Supabase Templates: colar confirm-signup.html + reset-password.html
- [ ] **6.** Vercel env vars: 5 vars atualizadas em Production + Preview
- [ ] **7.** Redeploy preview + smoke test Gmail/Outlook/Yahoo
- [ ] **8.** Merge PR #8 → main (squash)
- [ ] **9.** Verificar prod + criar tag `v1.0.0-launch`

---

## O que não deu pra automatizar e por quê

| Passo | Motivo |
|---|---|
| Vincular domínio ao projeto (0) | MCP Vercel não expõe `domain attach` — só list/get |
| Atualizar env vars (6) | MCP Vercel não expõe CRUD de environment variables |
| Auth URL config / SMTP / templates (3–5) | Supabase Auth config vive em API privada do dashboard; não há SQL público pra `auth.config` |
| DNS records (2) | Depende dos valores específicos que só aparecem no painel Resend depois de "Add Domain" — não invento |
| Resend signup + API key (1) | Precisa de conta humana + captcha |
| Smoke test (7, 9) | Precisa de caixas de email reais pra ler |
| Merge do PR (8) | Requer confirmação humana + review |

---

## Referências

- `DOMAIN_SETUP.md` — contexto consolidado (setup original)
- `docs/supabase-email-templates/README.md` — guia de 6 passos (fonte primária do plano)
- `docs/supabase-email-templates/confirm-signup.html` — template HTML auth signup
- `docs/supabase-email-templates/reset-password.html` — template HTML reset password
- `lib/email/resend.ts` — 6 templates transacionais de código
- PR #8: https://github.com/kvragg/agrobridge/pull/8
- Vercel project: https://vercel.com/kvraggs-projects/agrobridge
- Preview do branch: https://agrobridge-git-feature-simulador-leitura-kvraggs-projects.vercel.app
