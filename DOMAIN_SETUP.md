# AgroBridge — Setup de domínio e email transacional

**Data de consolidação:** 2026-04-23
**Fonte de verdade:** `docs/supabase-email-templates/README.md` (escrito em 2026-04-22) + inspeção do código.

> **Transparência sobre memória:** não tenho transcript da sessão de 2026-04-22 no meu histórico (o último transcript antes foi de 21/04 21:02 BRT, o próximo foi 23/04 14:45). O contexto abaixo foi reconstruído a partir dos arquivos que ficaram no repo — não de memória da conversa. Se algum detalhe ficou só no papel/na cabeça e não virou arquivo, eu não sei.

---

## TL;DR do estado atual

| Item | Status | Observação |
|---|---|---|
| Domínio comprado | ✅ | `agrobridge.space` via **Vercel** em 2026-04-22 |
| Nameservers | ✅ (automático) | Domínio comprado na Vercel → já apontados |
| Provider email transacional | ✅ (escolhido) | **Resend** (já há `RESEND_API_KEY` no código) |
| Templates HTML de auth | ✅ (prontos) | `docs/supabase-email-templates/{confirm-signup,reset-password}.html` — 101 linhas cada |
| README de setup | ✅ | `docs/supabase-email-templates/README.md` — roteiro em 6 passos |
| Verificar domínio no Resend | ⏳ pendente | Subdomain sugerido: `mail.agrobridge.space` |
| Adicionar 3 DNS records na Vercel | ⏳ pendente | TXT DKIM + TXT SPF + MX — valores exatos o Resend fornece |
| Custom SMTP no Supabase | ⏳ pendente | Host `smtp.resend.com`, porta 465, sender `no-reply@mail.agrobridge.space` |
| Colar 2 templates HTML no Supabase | ⏳ pendente | Confirm signup + Reset password |
| Env vars no Vercel | ⏳ pendente | `RESEND_FROM_EMAIL`, `NEXT_PUBLIC_SITE_URL`, `LEAD_NOTIFICATION_EMAIL` |
| Redeploy após env vars | ⏳ pendente | Pegar as novas variáveis |
| Smoke test inbox (Gmail/Hotmail/Yahoo) | ⏳ pendente | Critério de aceite |
| **Inconsistência no código: `.app` vs `.space`** | 🔴 **corrigir** | Ver seção "Correção pendente" |

---

## 1. Domínio — o que foi comprado

Segundo `docs/supabase-email-templates/README.md:8`:

- **Domínio:** `agrobridge.space`
- **Registrador:** **Vercel** (domínio comprado direto pela plataforma, então nameservers já propagam automaticamente pra Vercel DNS)
- **Data:** 2026-04-22

O custo típico do `.space` via Vercel é ~US$ 2–3/ano (primeiro ano promocional), com renovação em torno de US$ 20/ano. O README não registra o preço.

**Por que `.space` e não `.com.br`/`.app`/outro:** o README não explica, mas provavelmente foi disponibilidade + preço. `.space` é um TLD legítimo da Radix (opera desde 2014) — Gmail/Outlook não marcam como spam pelo TLD. O que importa pra inbox é DKIM+SPF+DMARC corretos.

> **Motivação original (do pedido do Paulo):** lead não recebeu email de confirmação do cadastro porque o Supabase estava mandando de `noreply@mail.app.supabase.io`, que cai em spam. Comprar domínio próprio + custom SMTP resolve: emails passam a vir de `no-reply@mail.agrobridge.space` com DKIM autenticado.

---

## 2. Provedor de email transacional — Resend

**Escolha:** Resend.

**Evidência:**
- `RESEND_API_KEY` já é variável de ambiente documentada (`.env.example:37`).
- `lib/email/resend.ts` já implementa 6 tipos de email transacional (lead, dossiê, pagamento, lembrete docs, exclusão LGPD, exportação LGPD).
- `package.json` inclui `"resend": "^6.12.0"` como dependência.

**Plano:**
- **Free tier:** 100 emails/dia, 3.000/mês. Suficiente pra pré-launch e primeiras semanas.
- **Upgrade:** Pro ($20/mês) quando ultrapassar.
- O README NÃO diz se o plano Free já foi criado — assume que a API key foi obtida em algum momento. Confirmar no dashboard da Resend.

**Alternativas que foram descartadas** (implicitamente, porque o código já só suporta Resend): SendGrid, Postmark, AWS SES, Mailgun. Trocar agora exigiria reescrever `lib/email/resend.ts` — não compensa.

---

## 3. Integração com Supabase Auth — Custom SMTP

**Estratégia:** **Custom SMTP** apontando pro Resend (não API direta).

**Motivo:** Supabase Auth envia emails de confirmação de signup e reset de senha automaticamente (ele controla o token `ConfirmationURL`). A única forma de intercalar o Resend nesse fluxo é via SMTP — se fosse usar API do Resend, Paulo teria que reescrever todo o fluxo de auth do Supabase, o que é inviável.

**Config no Supabase Dashboard** (Authentication → SMTP Settings, quando for fazer):

| Campo | Valor |
|---|---|
| Host | `smtp.resend.com` |
| Port | `465` (SSL) |
| User | `resend` (string literal, não é email) |
| Pass | sua `RESEND_API_KEY` (`re_xxxxxxxxxxxxx`) |
| Sender email | `no-reply@mail.agrobridge.space` |
| Sender name | `AgroBridge` |

**Templates de auth** vão direto no Dashboard (Authentication → Email Templates). Os HTMLs já estão prontos em `docs/supabase-email-templates/confirm-signup.html` e `reset-password.html` — é só colar na UI.

**Templates "de código"** (6 tipos em `lib/email/resend.ts`) usam a **API do Resend direto** — passam fora do Supabase. Esses são enviados pelo código do app (ex: webhook de pagamento chama `enviarPagamentoConfirmado()`).

Resumindo:
- **Supabase Auth → Custom SMTP → Resend** → para signup confirmation + password reset.
- **Código do app → Resend API** → para notificações pós-pagamento, dossiê pronto, LGPD, etc.

---

## 4. DNS — os 3 records que vão na Vercel

**Não posso te dar os valores exatos aqui.** O Resend gera uma DKIM única por domínio, e ela só aparece DEPOIS que você clicar "Add Domain → mail.agrobridge.space" no dashboard do Resend. O README é explícito sobre isso (linha 33: "o Resend te dá os valores exatos").

**Formato genérico** (preencher no Vercel Dashboard → Projeto agrobridge → Settings → Domains → agrobridge.space → DNS Records):

| Tipo | Nome | Valor (template) | Priority |
|---|---|---|---|
| `TXT` | `resend._domainkey.mail` | `p=MIGfMA0G...` (a DKIM pública que o Resend gera) | — |
| `TXT` | `send.mail` | `v=spf1 include:amazonses.com ~all` | — |
| `MX` | `send.mail` | `feedback-smtp.us-east-1.amazonses.com` | `10` |

> Isso configura `mail.agrobridge.space` como subdomain isolado pra envio. Vantagem: se algum dia outro provider for adicionado (ex: newsletter), não brigam pelos mesmos records.

**Bonus recomendado — DMARC:** o README atual não inclui, mas é grátis e melhora deliverability:

| Tipo | Nome | Valor | Observação |
|---|---|---|---|
| `TXT` | `_dmarc.mail` | `v=DMARC1; p=none; rua=mailto:paulocosta.contato1@gmail.com` | Policy=none só observa, não bloqueia (seguro pra começar) |

Subir pra `p=quarantine` depois de 2 semanas sem incidente.

**Propagação:** 10 min a 24h. Normalmente < 1h na Vercel.

---

## 5. Env vars no Vercel — o que precisa adicionar

No Vercel Dashboard → Projeto agrobridge → Settings → Environment Variables, adicionar em **Production** e **Preview**:

```bash
RESEND_FROM_EMAIL="AgroBridge <no-reply@mail.agrobridge.space>"
LEAD_NOTIFICATION_EMAIL="paulocosta.contato1@gmail.com"
NEXT_PUBLIC_SITE_URL="https://agrobridge.space"
```

Se `RESEND_API_KEY` ainda não estiver lá (provável que já esteja, já que o código usa), adicionar também.

Depois: **Deployments → Redeploy** o último deploy de produção pra pegar as variáveis novas.

---

## 6. Correção pendente no código — `.app` vs `.space`

**Problema identificado na inspeção:** o repo está inconsistente. Metade do código usa `agrobridge.space`, metade usa `agrobridge.app`. Isso vai causar links quebrados em emails (URL do callback vai mandar pra `.app` inexistente).

### Arquivos que usam `agrobridge.space` (corretos, compatíveis com o domínio real)

- `lib/email/resend.ts` — 4 fallbacks (linhas 243, 283, 322, 368, 451)
- `docs/supabase-email-templates/README.md`

### Arquivos que usam `agrobridge.app` (PRECISAM TROCAR pra `.space`)

- `app/layout.tsx:18` — `metadataBase`
- `app/sitemap.ts:4` — URL base do sitemap
- `app/robots.ts:4` — URL base do robots
- `.env.example:22` — `NEXT_PUBLIC_SITE_URL`
- `.env.example:42` — `RESEND_FROM_EMAIL` comentado
- `.github/workflows/ci.yml:24, 25, 28` — envs do CI
- `app/error.tsx:54` — email de contato (`contato@agrobridge.app` vira `.space`)
- `app/api/debug/template/route.ts:76` — fallback site URL
- `app/api/conta/excluir/route.ts:51` — fallback `baseUrl()`
- `components/landing/hero.tsx:96` — badge visual "agrobridge.app · entrevista"
- `tests/e2e/seed.ts:14` e `tests/e2e/fixtures.ts:4` — email de teste (podem ficar como estão, são stubs)

**Decisão necessária do Paulo:**
- (a) Trocar tudo pra `.space` — caminho limpo, 1 commit.
- (b) Manter `.app` em metadados de site (SEO) e só usar `.space` pra emails — mais complicado, precisa comprar `.app` também, **NÃO recomendo** a menos que você já tenha.
- (c) Trocar `.app` pra `.space` só no código de produção (env vars + email + URLs) e deixar testes e2e como estão.

Como está, emails vão funcionar (`.space` no código `resend.ts`), mas links em OG tags do site vão apontar pra `agrobridge.app` inexistente. O SEO fica quebrado no launch.

---

## 7. Passo-a-passo pra executar hoje à noite

**Pré-requisito:** ter conta no Resend com `RESEND_API_KEY` ativa (confirmar em resend.com/api-keys).

### Parte 1 — Resend + DNS (20–30 min + espera de propagação)

1. Vercel Dashboard → Projeto agrobridge → Settings → Domains → confirmar que `agrobridge.space` aparece como `Active`.
2. Abrir [resend.com/domains](https://resend.com/domains) → **Add Domain**.
3. Digitar `mail.agrobridge.space` (subdomain isolado). Região **US East**.
4. Copiar os 3 DNS records que aparecem (TXT DKIM + TXT SPF + MX).
5. Voltar no Vercel Dashboard → Projeto agrobridge → Settings → Domains → `agrobridge.space` → **DNS Records** → **Add Record** para cada um dos 3.
6. **(Opcional mas recomendado)** Adicionar o TXT `_dmarc.mail` com `v=DMARC1; p=none; rua=mailto:paulocosta.contato1@gmail.com`.
7. Esperar propagação (~10-30 min). Checar em [mxtoolbox.com/SuperTool.aspx](https://mxtoolbox.com/SuperTool.aspx) com "MX Lookup: send.mail.agrobridge.space".
8. No Resend → página do domínio → **Verify DNS Records**. Tem que ficar tudo verde.

### Parte 2 — Supabase SMTP + Templates (10 min)

9. [supabase.com/dashboard](https://supabase.com/dashboard) → Projeto AgroBridge → Project Settings → **Authentication** → **SMTP Settings** → **Enable Custom SMTP**.
10. Preencher conforme tabela da seção 3 acima. Sender email: `no-reply@mail.agrobridge.space`.
11. Save.
12. Authentication → **Email Templates** → aba **Confirm signup** → colar conteúdo de `docs/supabase-email-templates/confirm-signup.html` → Subject: "Confirme seu e-mail — AgroBridge" → Save.
13. Aba **Reset password** → colar `docs/supabase-email-templates/reset-password.html` → Subject: "Redefina sua senha — AgroBridge" → Save.

### Parte 3 — Vercel env vars (5 min)

14. Vercel Dashboard → Projeto agrobridge → Settings → Environment Variables.
15. Adicionar para **Production** e **Preview**:
    - `RESEND_FROM_EMAIL` = `AgroBridge <no-reply@mail.agrobridge.space>`
    - `LEAD_NOTIFICATION_EMAIL` = `paulocosta.contato1@gmail.com`
    - `NEXT_PUBLIC_SITE_URL` = `https://agrobridge.space`
    - (se faltar) `RESEND_API_KEY` = sua API key do Resend
16. Deployments → último deploy de produção → **Redeploy** (clone original, NÃO use cache).

### Parte 4 — Corrigir inconsistência `.app` → `.space` no código (15 min)

17. Me pede (quando estiver conectado) pra fazer o PR trocando tudo em bloco. São ~10 linhas em 10 arquivos. Posso fazer agora se quiser.

### Parte 5 — Smoke test (10 min)

18. Criar 3 contas de teste:
    - Uma em Gmail (`+teste1`)
    - Uma em Outlook/Hotmail
    - Uma em Yahoo
19. Em cada uma, fazer signup em `https://agrobridge.space/cadastro`.
20. Checar em cada inbox:
    - ☐ Email chegou no **inbox** (NÃO na aba promoções/spam)
    - ☐ Remetente: `AgroBridge <no-reply@mail.agrobridge.space>`
    - ☐ Visual dark premium renderizou (sem fundo branco)
    - ☐ Botão "Confirmar e-mail" funciona
    - ☐ Após confirmar, redireciona pra `/auth/confirmado`
21. Se algum falhar: Resend Dashboard → **Logs** (mostra bounced/complained/delivered).

---

## Coisas que EU NÃO SEI (precisam de confirmação)

- Se `RESEND_API_KEY` já está configurada no Vercel ou só no `.env.local` local.
- O preço real que Paulo pagou no domínio (1º ano promocional vs renovação).
- Se a conta Resend está no Free tier ou Pro.
- Se o contato `contato@agrobridge.space` já foi criado como alias no Resend ou algum forwarder (o template de error.tsx menciona esse email — sem setup, mensagens vão bouncer).
- O motivo exato da escolha de `.space` sobre `.com.br` (o README não documenta).

Quando rodar os passos 1–21, se algo não bater com o esperado, me avisa em qual — o README + esse guia cobrem o caminho feliz.

---

## Referências

- `docs/supabase-email-templates/README.md` — fonte primária
- `docs/supabase-email-templates/confirm-signup.html` — template de signup (pronto)
- `docs/supabase-email-templates/reset-password.html` — template de reset (pronto)
- `lib/email/resend.ts` — 6 templates transacionais do código
- `resend.com/domains` — onde adicionar `mail.agrobridge.space`
- Vercel Dashboard → Domains → agrobridge.space → DNS Records
- Supabase Dashboard → Authentication → SMTP Settings / Email Templates
