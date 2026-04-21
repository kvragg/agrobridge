# Audit Log — Auditoria Noturna AgroBridge

Log contínuo, append-only. Cada entrada: `[timestamp] Iteração N — Batch X — título`.

## [2026-04-21 00:00] Iteração 1 — Setup
**Ação:** Branch `audit-2026-04-20` criada a partir de `main @ 440250b`.
**Stash:** `.claude/settings.local.json` salvo em stash (mudança local não relacionada).
**Estrutura:** `audit/` + `audit/scratch/` criados. `audit/scratch/` adicionado ao `.gitignore`.
**Estado inicial:** 17 testes integration passing, build limpo, zero typecheck errors.

## [2026-04-21 00:40] Iteração 1 — Batch 1 (Wave 1)
**Ação:** Open redirect defense-in-depth + cache no-store para rotas autenticadas.
**Arquivos:**
- `lib/safe-redirect.ts` (novo) — `sanitizarCaminhoInterno()` reutilizável
- `app/auth/callback/route.ts` — usa helper compartilhado (remove duplicação)
- `app/(auth)/login/page.tsx:30` — sanitiza `?next=` antes de `router.push`
- `proxy.ts` — rotas `/planos` e `/conta` adicionadas a `ROTAS_PROTEGIDAS_WEB`; `Cache-Control` reforçado com `no-cache, must-revalidate, private` + `Pragma: no-cache`; comentário Pagar.me → Cakto
- `scripts/check-secrets.sh` (novo) — grep pré-commit para sk-ant, service role, Cakto secret, etc.
- `tests/integration/audit-events.test.ts:75` — fix typecheck `Tuple type '[]'`
- `components/ui/dashboard-shell.tsx:22-26` — `useEffect(setOpen(false))` → padrão sem cascading render (ESLint error)

**Build:** ✅ (proxy detectado)
**Typecheck:** ✅ zero erros
**Lint:** ✅ zero errors (11 warnings pré-existentes, não regressão)
**Tests:** ⚠️ bloqueados por WDAC no rolldown-binding — documentado na fila (#9)

Commit: wave 1 — defense in depth open redirect + no-store + check-secrets
