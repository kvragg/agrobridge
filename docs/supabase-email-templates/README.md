# Email — configuração de produção

Guia pra fazer os emails do AgroBridge chegarem no inbox do cliente (não no spam)
com o visual dark premium da landing.

## Estado atual

- **Domínio:** `agrobridge.space` (Vercel, registrado 2026-04-22)
- **Provedor SMTP:** Resend (API key já configurada em `RESEND_API_KEY`)
- **Templates em código:** `lib/email/resend.ts` — 6 tipos (lead, dossiê, pagamento, lembrete docs, exclusão LGPD, exportação LGPD)
- **Templates em Supabase Dashboard:** 2 (confirmação de e-mail + reset de senha) — HTML nesta pasta

## Roteiro em 5 passos

### 1. Nameservers da Vercel (já feito automaticamente)

O domínio foi comprado via Vercel, então os nameservers já apontam pra Vercel.
Confira em: Vercel Dashboard → Projeto agrobridge → Settings → Domains.

Status esperado: `Active` (leva até 60 min pra propagar depois da compra).

### 2. Verificar o domínio no Resend

1. Abre [resend.com/domains](https://resend.com/domains) → **Add Domain**
2. Digite: `mail.agrobridge.space` (subdomain isolado — recomendado)
3. Região: US East (default, mais barato)
4. O Resend vai mostrar 3 registros DNS pra adicionar

### 3. Adicionar os 3 registros DNS na Vercel

Vai em: Vercel Dashboard → Projeto agrobridge → Settings → Domains → agrobridge.space → **DNS Records**.

Clica **Add Record** pra cada um dos 3 que o Resend te deu. Formato genérico
(o Resend te dá os valores exatos):

| Tipo | Nome | Valor | Priority |
|---|---|---|---|
| TXT | `resend._domainkey.mail` | `p=MIGf...` (valor grande que o Resend te deu) | — |
| TXT | `send.mail` | `v=spf1 include:amazonses.com ~all` | — |
| MX | `send.mail` | `feedback-smtp.us-east-1.amazonses.com` | 10 |

Salva cada um. **Propagação:** 10 min a 24 h.

Volta no Resend → página do domínio → **Verify DNS Records**. Os 3 indicadores
viram verdes quando o DNS propagar.

### 4. Configurar SMTP custom no Supabase

1. [Supabase Dashboard](https://supabase.com/dashboard) → Projeto AgroBridge
2. **Project Settings** → **Authentication** → **SMTP Settings**
3. Marca **Enable Custom SMTP**:

| Campo | Valor |
|---|---|
| Host | `smtp.resend.com` |
| Port | `465` |
| User | `resend` |
| Pass | sua API key do Resend (`re_...`) |
| Sender email | `no-reply@mail.agrobridge.space` |
| Sender name | `AgroBridge` |

4. Salva

### 5. Colar os 2 templates no Supabase Dashboard

Ainda no Supabase → **Authentication** → **Email Templates**.

**Template 1 — Confirm signup:**
1. Aba **Confirm signup**
2. Subject: `Confirme seu e-mail — AgroBridge`
3. Apaga o HTML default, cola o conteúdo de [`confirm-signup.html`](./confirm-signup.html)
4. Save changes

**Template 2 — Reset password:**
1. Aba **Reset password**
2. Subject: `Redefina sua senha — AgroBridge`
3. Apaga o HTML default, cola o conteúdo de [`reset-password.html`](./reset-password.html)
4. Save changes

### 6. Configurar env vars na Vercel (para emails em código)

Vercel Dashboard → Projeto agrobridge → Settings → Environment Variables.

Adiciona pras environments `Production` e `Preview`:

```
RESEND_FROM_EMAIL = AgroBridge <no-reply@mail.agrobridge.space>
LEAD_NOTIFICATION_EMAIL = paulocosta.contato1@gmail.com
NEXT_PUBLIC_SITE_URL = https://agrobridge.space
```

Depois: Deployments → **Redeploy** o último deploy de produção pra pegar
as novas variáveis.

## Teste final — 3 provedores

Quando tudo acima estiver configurado:

1. Cria uma conta de teste com cada: **Gmail, Hotmail/Outlook, Yahoo**
2. Abre o e-mail em cada um
3. Confere que:
   - ☐ Chegou no **inbox** (não no spam)
   - ☐ Remetente é `AgroBridge <no-reply@mail.agrobridge.space>`
   - ☐ Visual dark premium apareceu corretamente (sem fundo branco)
   - ☐ Botão "Confirmar e-mail" funciona (leva pra `/auth/callback`)
   - ☐ Após confirmar, redireciona pra `/auth/confirmado`

Se algum falhar: ver logs no Resend Dashboard → **Logs** (mostra entregas,
bounces, reclamações de spam). Normalmente é DKIM/SPF propagando.

## Mapa dos templates

| Evento no produto | Quem envia | Template |
|---|---|---|
| Cliente cria conta | Supabase Auth | `confirm-signup.html` (cola no Dashboard) |
| Cliente pede reset de senha | Supabase Auth | `reset-password.html` (cola no Dashboard) |
| Novo signup | Código (Resend API) | `enviarLeadNotification()` em `lib/email/resend.ts` |
| Cakto confirma pagamento | Código (webhook) | `enviarPagamentoConfirmado()` |
| Dossiê PDF pronto | Código | `enviarDossiePronto()` |
| Docs do checklist pendentes | Código | `enviarLembreteDocumentos()` |
| Pedido de exclusão de conta (LGPD) | Código | `enviarConfirmacaoExclusao()` |
| Exportação de dados concluída (LGPD) | Código | `enviarExportacaoPronta()` |

Todos os templates em código usam o `wrap()` de `lib/email/resend.ts` pra
manter o visual uniforme.

## Alterar templates futuramente

- **Em código (`lib/email/resend.ts`):** editar direto, subir PR. Templates
  compartilham o `wrap()` e os helpers (`eyebrow`, `h1`, `p`, `button`, etc) —
  basta mudar em um lugar pra refletir em todos.
- **No Supabase Dashboard:** reeditar o HTML nos painéis Confirm/Reset. Se quiser
  versionar, sempre volta aqui e atualiza os `.html` também.

## Troubleshooting

**Email não chega:**
1. Resend Dashboard → **Logs** → confere status (`delivered`, `bounced`, `complained`)
2. Se `bounced`: email do destinatário inválido
3. Se `complained`: Gmail/provider marcou como spam → ajustar copy/frequência
4. Se nenhum log aparece: `RESEND_API_KEY` errada na Vercel, ou domínio não verificado

**Visual quebrado em algum cliente:**
- Outlook Desktop (Windows): limitações conhecidas com `linear-gradient` — o template usa fallback sólido
- Dark-mode-invertido (alguns Yahoo/AOL): o `meta name="color-scheme" content="dark"` força o modo certo. Se ainda inverter, adicionar `!important` nas cores críticas

**Rate limit do Resend:**
- Free tier: 100 emails/dia, 3.000/mês
- Upgrade pra Pro ($20/mês) quando ultrapassar

## Regras de copy (nunca esquecer)

- **Nunca** citar marca de banco específica: sempre "Banco" ou "Cooperativa"
- **Nunca** prometer contato por WhatsApp ou telefone — só IA + plano Ouro
- **Nunca** "custo zero" / "R$ 0" / "grátis se não aprovar" — sempre pagamento único
- **Nunca** "despachante" — sempre "consultoria sênior"
- **Nunca** "decidia crédito" — ele viveu aprovações e recusas
- Fundador: 14 anos no SFN · Gestor de carteira Agro · Ex-banco privado · FBB-420/CPA-20/Rehagro
