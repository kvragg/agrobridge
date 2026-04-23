# AgroBridge — Migração `agrobridge.space`: estado + passos restantes

**Última atualização:** 2026-04-23 — noite (configs Vercel + Supabase automatizadas via API).

---

## 📍 Estado atual — quase tudo feito

| Item | Status | Como |
|---|---|---|
| Domínio `agrobridge.space` comprado Vercel, nameservers ok | ✅ | Paulo, 22/04 |
| Domínio vinculado ao projeto, apex primary, www 307 → apex | ✅ | Paulo, 23/04 |
| Resend conta + domínio verified (DKIM/SPF/MX) | ✅ | Paulo, 23/04 |
| Smoke test Resend via API direta | ✅ | CC, `message_id=89f96666-...` |
| Vercel — 5 env vars criadas (RESEND_API_KEY, EMAIL_FROM, EMAIL_FROM_NAME, LEAD_NOTIFICATION_EMAIL, NEXT_PUBLIC_SITE_URL) | ✅ | CC via Vercel Management API |
| Supabase — Site URL + Redirect URLs (4 padrões com `/**`) | ✅ | CC via Supabase Management API |
| Supabase — Custom SMTP (smtp.resend.com:465, user=resend, sender=contato@agrobridge.space) | ✅ | CC via Supabase Management API |
| Supabase — Templates Confirm signup + Reset password | ✅ | CC via Supabase Management API |

---

## ⏳ Restam 4 passos humanos

### 1. Revogar o token Supabase (1 min) — FAZER AGORA

Abre: https://supabase.com/dashboard/account/tokens

Acha o token `cc-session-smtp` na lista → clica **Revoke** (ou ícone de lixeira).

Confirma que sumiu. Isso mata a `sbp_...` que transitou por aqui.

### 2. Smoke test ponta-a-ponta no preview (5 min)

O preview do branch já tem o código novo, mas precisa de um **redeploy** pra pegar as 5 env vars que acabei de criar na Vercel.

1. https://vercel.com/kvraggs-projects/agrobridge/deployments
2. Filtra por branch `feature/simulador-leitura` → último deploy → `...` → **Redeploy** → **DESMARCA** "Use existing Build Cache" → Redeploy.
3. Aguarda state `READY` (~2 min).
4. Abre janela anônima: `https://agrobridge-git-feature-simulador-leitura-kvraggs-projects.vercel.app/cadastro`
5. Cria conta com seu Gmail principal (pode ser `paulocosta.contato1+teste1@gmail.com` pra não conflitar).
6. Cheque:
   - ☐ Email chegou no **inbox** (não spam/promoções)
   - ☐ Remetente: `AgroBridge <contato@agrobridge.space>`
   - ☐ Visual dark premium OK
   - ☐ Clicando "Confirmar e-mail" → redireciona pra `/auth/confirmado`
7. Se cair em spam → Resend Dashboard → Logs te mostra DKIM/SPF/status.

### 3. Merge PR #8 → main (1 min)

https://github.com/kvragg/agrobridge/pull/8 → **Merge pull request** (Squash).

Vercel dispara deploy de produção. Aguarda READY.

### 4. Tag de release + rotação da key (5 min)

```bash
git checkout main && git pull origin main
git tag -a v1.0.0-launch -m "Launch: agrobridge.space + email transacional"
git push origin v1.0.0-launch
```

Depois do smoke test em produção funcionando (1 signup real com `@agrobridge.space`):

**Rotação da `RESEND_API_KEY`** (a atual queimou em chat):
1. Resend → API Keys → Create: `agrobridge-prod-v2`
2. Copia a nova.
3. Vercel → Environment Variables → edita `RESEND_API_KEY` → cola nova → Save.
4. Supabase Dashboard → Authentication → SMTP Settings → Password → cola nova → Save.
5. Redeploy prod.
6. Testa 1 signup.
7. Se OK: volta no Resend → revoga a antiga (`re_98ts...`).

---

## Checklist pra marcar e seguir

- [x] Domínio vinculado, apex primary
- [x] Resend verified + smoke test direto
- [x] Vercel env vars
- [x] Supabase Site URL + Redirects
- [x] Supabase Custom SMTP
- [x] Supabase Templates (Confirm signup, Reset password)
- [ ] **Revogar token Supabase `sbp_1c4daff...`**
- [ ] **Smoke test no preview (Gmail + Outlook + Yahoo se der)**
- [ ] **Merge PR #8 → main**
- [ ] **Tag `v1.0.0-launch`**
- [ ] **Rotacionar `RESEND_API_KEY` pós-launch**

---

## Referências

- PR #8: https://github.com/kvragg/agrobridge/pull/8
- Vercel: https://vercel.com/kvraggs-projects/agrobridge
- Supabase: https://supabase.com/dashboard/project/vemjvsrxwgpvezczpuip
- Resend: https://resend.com/emails (logs)
- Preview do branch: https://agrobridge-git-feature-simulador-leitura-kvraggs-projects.vercel.app
