# AgroBridge — Migração de domínio `agrobridge.space`: passos manuais

**Última atualização:** 2026-04-23 (noite). Inclui smoke test Resend bem-sucedido.

---

## 📍 Estado atual

| Item | Status |
|---|---|
| Domínio `agrobridge.space` comprado na Vercel | ✅ |
| Nameservers `ns1/ns2.vercel-dns.com` | ✅ |
| Domínio **vinculado** ao projeto Vercel `agrobridge` | ✅ (conferido via MCP agora) |
| Apex primary, `www` redirect 307 → apex | ✅ |
| Resend — conta criada + domínio `agrobridge.space` verified | ✅ (Paulo validou ~18:26 BRT) |
| Resend DNS records (DKIM + SPF + MX) propagados | ✅ |
| Resend API key ativa (autorizada pelo Paulo em chat) | ✅ — ⚠️ **rotacionar pós-launch** (queimada no transcript) |
| Smoke test Resend (envio direto via API) | ✅ `message_id=89f96666-783c-4619-90e7-8a25d528cb43` enviado pra `paulocosta.contato1@gmail.com` |
| Vercel env vars (5 vars) | ⏳ manual — **Passo 1** |
| Supabase Auth URL config (Site URL + Redirect URLs) | ⏳ manual — **Passo 2** |
| Supabase Custom SMTP apontando pro Resend | ⏳ manual — **Passo 3** |
| Supabase Email Templates (2 HTMLs) | ⏳ manual — **Passo 4** |
| Smoke test fluxo signup ponta-a-ponta no preview | ⏳ manual — **Passo 5** |
| Merge PR #8 → `main` | ⏳ manual — **Passo 6** |
| Tag de release | ⏳ manual — **Passo 7** |

> **Por que tudo isso é manual?** Os MCPs conectados (Vercel + Supabase) não expõem CRUD de env vars, Auth config, ou SMTP config. São APIs do painel, não publicadas no MCP. Paulo precisa fazer nos dashboards. Valores já resolvidos abaixo.

---

## Passo 1 · Vercel — adicionar 5 env vars (5 min)

Dashboard → Projeto `agrobridge` → **Settings** → **Environment Variables**.

Pra cada linha abaixo: clica **Add New**, preenche, marca **Production + Preview + Development**, **Save**.

| Nome | Valor | Sensitive |
|---|---|---|
| `RESEND_API_KEY` | a key que você autorizou (começa com `re_98ts...`) | ✅ sim (marcar "Sensitive") |
| `EMAIL_FROM` | `contato@agrobridge.space` | não |
| `EMAIL_FROM_NAME` | `AgroBridge` | não |
| `LEAD_NOTIFICATION_EMAIL` | `paulocosta.contato1@gmail.com` | não |
| `NEXT_PUBLIC_SITE_URL` | `https://agrobridge.space` | não |

**Checar se `RESEND_API_KEY` já existe antes:** talvez você já tenha adicionado em algum momento. Se sim e for a mesma, deixa. Se for outra (antiga/diferente), atualiza.

**Não dispara redeploy agora** — vai fazer isso automático no Passo 6 (merge do PR).

---

## Passo 2 · Supabase — Site URL + Redirect URLs (3 min)

Dashboard → Projeto **agrobridge** → **Authentication** → **URL Configuration**.

**Site URL:**
```
https://agrobridge.space
```

**Redirect URLs** (adiciona cada uma, separadas por linha ou vírgula conforme a UI pedir):
```
https://agrobridge.space/**
https://agrobridge-self.vercel.app/**
https://agrobridge-git-feature-simulador-leitura-kvraggs-projects.vercel.app/**
http://localhost:3000/**
```

**Save**.

---

## Passo 3 · Supabase — Custom SMTP via Resend (3 min)

Mesma tela de **Authentication** → **SMTP Settings** (pode estar em **Auth → Providers → Email** em versões novas).

Marca **Enable Custom SMTP** e preenche:

| Campo | Valor |
|---|---|
| Sender name | `AgroBridge` |
| Sender email | `contato@agrobridge.space` |
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | **a mesma `RESEND_API_KEY` do Passo 1** |

**Save**.

Supabase vai testar a conexão. Se der "Connection successful", está 100%. Se der erro: confere se o username é literalmente `resend` (string), não email.

---

## Passo 4 · Supabase — colar 2 templates HTML (5 min)

Authentication → **Email Templates**.

**Template 1 — Confirm signup:**
1. Aba **Confirm signup**
2. Subject: `Confirme seu e-mail — AgroBridge`
3. Apaga o HTML default.
4. Abre `docs/supabase-email-templates/confirm-signup.html` no VS Code → Ctrl+A → Ctrl+C → cola no campo.
5. **Save changes**.

**Template 2 — Reset password:**
1. Aba **Reset password**
2. Subject: `Redefina sua senha — AgroBridge`
3. Mesma coisa com `docs/supabase-email-templates/reset-password.html`.
4. **Save changes**.

**Templates Change email e Magic link:** não aplicável. O app não usa esses fluxos hoje. Deixa o default do Supabase.

---

## Passo 5 · Smoke test no preview do branch (10 min)

O preview do branch `feature/simulador-leitura` está em:

https://agrobridge-git-feature-simulador-leitura-kvraggs-projects.vercel.app

1. **Force-redeploy o último commit do branch pra pegar as envs novas:**
   Vercel → Deployments → filtra por branch `feature/simulador-leitura` → último → `...` → **Redeploy** → **desmarca** "Use existing Build Cache".
2. Quando estiver `READY`, abre anônima `/cadastro` no preview URL.
3. Cria conta com seu Gmail principal.
4. Cheque:
   - ☐ Email chegou no **inbox** (não Promoções, não spam).
   - ☐ Remetente: `AgroBridge <contato@agrobridge.space>`.
   - ☐ Visual dark premium OK (fundo escuro).
   - ☐ Botão "Confirmar e-mail" leva pra `/auth/confirmado`.
5. Repete Outlook e Yahoo (opcional mas recomendado).

**Se cair em spam em Gmail:** provavelmente falta DMARC. Bonus no Passo 1 original: adicionar TXT `_dmarc` = `v=DMARC1; p=none; rua=mailto:paulocosta.contato1@gmail.com` no DNS da Vercel.

**Se não chegar:** Resend Dashboard → **Logs** te dá o status real (`delivered`, `bounced`, `complained`). Normalmente é DKIM/SPF propagando — espera 30 min e testa de novo.

---

## Passo 6 · Merge PR #8 → main (2 min)

1. [github.com/kvragg/agrobridge/pull/8](https://github.com/kvragg/agrobridge/pull/8)
2. Se checks do CI (`.github/workflows/ci.yml`) estão verdes → **Merge pull request** (escolhe **Squash and merge**).
3. Delete branch `feature/simulador-leitura`.

Vercel dispara deploy de produção automaticamente.

---

## Passo 7 · Verificar prod + tag de release (5 min)

1. Vercel → Deployments → target `production` → aguarda state `READY` (~2-3 min).
2. Abre `https://agrobridge.space` — landing tem que carregar.
3. Cria conta nova de teste em `https://agrobridge.space/cadastro` → confirma email chegou com `agrobridge.space`.
4. Tag:
   ```bash
   git checkout main && git pull origin main
   git tag -a v1.0.0-launch -m "Launch: agrobridge.space + Simulador + Email produção"
   git push origin v1.0.0-launch
   ```

---

## ⚠️ Pós-launch: rotacionar a API key do Resend

A key `re_98ts...` transitou pelo chat. Depois do smoke test em produção funcionando:

1. Resend Dashboard → API Keys.
2. Cria **nova** key `agrobridge-prod-v2`, mesmo perfil Full access.
3. Vercel → Settings → Environment Variables → edita `RESEND_API_KEY` → cola a nova.
4. Supabase → Authentication → SMTP Settings → edita Password com a nova.
5. Redeploy prod.
6. Testa 1 signup em produção.
7. **Se tudo OK:** volta no Resend e **revoga** a key antiga `re_98ts...`.

---

## Checklist resumido (pra imprimir e riscar)

- [x] **0.** Domínio `agrobridge.space` vinculado ao projeto Vercel (apex primary)
- [x] **Resend** conta criada + domínio verified + smoke test via API OK
- [ ] **1.** Vercel: 5 env vars em Production + Preview + Development
- [ ] **2.** Supabase Auth URL Config
- [ ] **3.** Supabase Custom SMTP (Resend)
- [ ] **4.** Supabase Email Templates (2 HTMLs)
- [ ] **5.** Smoke test ponta-a-ponta no preview
- [ ] **6.** Merge PR #8 → main
- [ ] **7.** Verificar prod + tag `v1.0.0-launch`
- [ ] **Pós-launch:** rotacionar RESEND_API_KEY

---

## O que continua não automatizável via MCP

| Config | Motivo |
|---|---|
| Vercel env vars (Passo 1) | MCP Vercel não expõe `env_var_create/update` |
| Supabase Auth URL config (Passo 2) | Management API, não SQL — sem tool MCP |
| Supabase SMTP (Passo 3) | Mesmo motivo |
| Supabase Email Templates (Passo 4) | Templates Auth vivem em API privada |
| Merge do PR (Passo 6) | Requer confirmação humana |
| Validação em Gmail/Outlook (Passos 5, 7) | Precisa de caixa de email real |

---

## Referências

- `DOMAIN_SETUP.md` — contexto consolidado
- `docs/supabase-email-templates/README.md` — roteiro original de 22/04
- `docs/supabase-email-templates/confirm-signup.html` + `reset-password.html` — templates prontos
- PR #8: https://github.com/kvragg/agrobridge/pull/8
- Vercel: https://vercel.com/kvraggs-projects/agrobridge
- Resend: https://resend.com/emails (logs)
