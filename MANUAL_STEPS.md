# AgroBridge — Migração `agrobridge.space`: estado final

**Última atualização:** 2026-04-23 — noite. Merge do PR #8 feito, prod em deploy.

---

## 📍 Tudo que foi automatizado (CC com tokens do Paulo)

| Item | Status |
|---|---|
| Domínio `agrobridge.space` comprado Vercel, nameservers ok | ✅ |
| Domínio vinculado ao projeto, apex primary, www 307 → apex | ✅ |
| Resend: conta + domínio verified (DKIM/SPF/MX) | ✅ |
| Smoke test Resend via API direta (inbox Gmail confirmado) | ✅ |
| Vercel — 5 env vars (RESEND_API_KEY, EMAIL_FROM, EMAIL_FROM_NAME, LEAD_NOTIFICATION_EMAIL, NEXT_PUBLIC_SITE_URL) | ✅ via Vercel Management API |
| Supabase — Site URL + Redirect URLs (4 padrões com `/**`) | ✅ via Supabase Management API |
| Supabase — Custom SMTP (smtp.resend.com:465, resend, contato@agrobridge.space) | ✅ via Supabase Management API |
| Supabase — Templates Confirm signup + Reset password | ✅ via Supabase Management API |
| Merge PR #8 → main (squash + delete branch) | ✅ via `gh pr merge` |
| Deploy prod (commit `8150399`) | ⏳ building / ver abaixo |
| Tag `v1.0.0-launch` | ⏳ CC cria quando deploy estiver READY |

---

## ⏳ Últimos 2 passos humanos

### 1. Smoke test em PRODUÇÃO (5 min)

Quando eu te avisar que prod está READY:

1. Janela anônima: **https://agrobridge.space/cadastro**
2. Cria conta com `paulocosta.contato1+launch@gmail.com` (ou outro alias pra não conflitar)
3. Cheque no Gmail:
   - ☐ Email chegou no **inbox** (não spam/promoções)
   - ☐ Remetente: `AgroBridge <contato@agrobridge.space>`
   - ☐ Visual dark premium OK
   - ☐ Clicar "Confirmar e-mail" leva pra `/auth/confirmado`
4. **Me avisa** "smoke prod ok" ou "falhou X"

Se falhar: Resend Dashboard → Logs te mostra DKIM/SPF/bounce em tempo real.

### 2. Rotação da `RESEND_API_KEY` (pós smoke test OK)

A key atual (`re_98ts...`) transitou em chat. Depois do smoke test em prod funcionando:

1. Resend → API Keys → Create: `agrobridge-prod-v2`, Full access. Copia nova.
2. Me avisa a nova key (eu atualizo via API Vercel + Supabase + `~/.bashrc` + `~/.claude/settings.json`).
3. Eu disparo redeploy.
4. Teste rápido de 1 signup em prod.
5. Se OK → revoga a antiga no Resend.

---

## 🗝️ Tokens enraizados no Claude Code (autonomia total)

Persistem em qualquer projeto/sessão:
- `~/.claude/settings.json` → campo `env` (lido por toda tool call)
- `~/.bashrc` + `~/.bash_profile` → shell login
- `~/.config/gh/hosts.yml` → gh CLI authenticated

Vars disponíveis sempre:
- `VERCEL_TOKEN` · `SUPABASE_ACCESS_TOKEN` · `RESEND_API_KEY` · `GITHUB_TOKEN` · `GH_TOKEN`

Quando criar tokens novos (Sentry, Upstash, Cakto), só me passa os valores e eu atualizo os 2 arquivos.

---

## Referências

- PR #8 (merged): https://github.com/kvragg/agrobridge/pull/8
- Commit merge: `8150399`
- Vercel: https://vercel.com/kvraggs-projects/agrobridge
- Supabase: https://supabase.com/dashboard/project/vemjvsrxwgpvezczpuip
- Resend logs: https://resend.com/emails
- Produção: https://agrobridge.space
