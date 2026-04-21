@AGENTS.md

# CLAUDE.md — AgroBridge (mapa de arquitetura real)

Mapa para Claude Code navegar o repo sem grep às cegas. Atualizar quando
módulo novo for adicionado ou arquitetura mudar de forma não-trivial.

## Stack efetivo (2026-04-21)

- **Next.js 16.2.4** — App Router. `proxy.ts` (não `middleware.ts`, que
  foi renomeado). Ler `node_modules/next/dist/docs/` antes de palpitar.
- **TypeScript** — `tsconfig.json` com strict.
- **Supabase** — Postgres + RLS + Storage + Auth. Migrations em
  `supabase/migrations/` (SQL puro, padrão `NNNNNN_titulo.sql`).
  RPCs `SECURITY DEFINER` são a forma canônica de mutação privilegiada.
- **Anthropic SDK** — `claude-sonnet-4-6` (checklist/dossiê), haiku
  (entrevista). Encapsulado em `lib/anthropic/*`.
- **Cakto** — pagamento (checkout externo + webhook). Pagar.me banido
  2026-04-20, não recriar.
- **Resend** — email transacional.
- **Upstash Redis REST** (opcional) — rate limit distribuído.
- **Vitest 4** (rolldown) — testes integração em `tests/integration/`.

## Módulos

1. **Auth** — `app/(auth)/{login,cadastro,resetar-senha}`, callbacks em
   `app/auth/{callback,confirmado}`. Supabase Auth + anti-enumeração
   (200 indistinguível, `lib/auth/anti-enumeracao.ts`).
2. **Entrevista IA** — `app/(dashboard)/entrevista/*`,
   `app/api/entrevista` (haiku). Retorna perfil estruturado.
3. **Checklist** — `app/(dashboard)/checklist/[id]`,
   `app/api/checklist` (sonnet). Gera lista personalizada com links
   oficiais (B10 — CAR/CCIR/ITR/CNDs/Matrícula/Licença).
4. **Upload + Validação** — `components/checklist/DossieCard.tsx`,
   `app/api/documento/validar`. Magic bytes em `lib/file-sniff.ts`.
5. **Dossiê** — `app/api/dossie` (sonnet + defesa), `lib/dossie/pdf.ts`.
6. **Viabilidade** — `app/api/viabilidade` (sonnet) + PDF.
7. **Pagamento** — `/planos` (gated) → Cakto external. Webhook
   `app/api/pagamento/webhook` (HMAC + idempotência via
   `webhook_events` UNIQUE (provider, event_id) + RPC
   `confirmar_pagamento_v2` grava em `compras` + atualiza
   `perfil_json._tier`). Gate mensal 6/mês Mentoria via view
   `vagas_mentoria_mes_corrente`.
8. **LGPD (Art. 18)** — `/conta/dados` (UI), `/api/conta/exportar`
   (JSON + signed URLs), `/api/conta/excluir` (dupla confirmação → RPC
   `soft_delete_user_data`). Página `/privacidade`.

## Convenções críticas (não quebrar)

- **Tier interno vs comercial**: código usa `diagnostico/dossie/mentoria`.
  UI pública usa Bronze/Prata/Ouro. Tabelas, RPCs e `_tier` são
  internos. **Não renomear**.
- **Nunca citar banco/cooperativa específicos** em UI, copy, PDFs,
  emails. Sempre "Banco" ou "Cooperativa" genérico. MCR é OK.
- **Server-only**: `lib/supabase/admin.ts` é `import 'server-only'`.
  `service_role` NUNCA vai para client. `lib/logger.ts` idem.
- **Idempotência**: todo webhook/mutação externa usa UNIQUE + CAS.
  Padrão `webhook_events` UNIQUE (provider, event_id).
- **Audit**: ações sensíveis gravam em `audit_events` via
  `lib/audit.ts :: registrarEventoAuditoria()`. Append-only por RLS.
- **Rate limit**: in-memory default (`lib/rate-limit.ts`). Para rotas
  LGPD (consistência multi-instância crítica) use
  `rateLimitRemoto` de `lib/rate-limit-upstash.ts`.
- **Redirects**: todo redirect/`router.push` com input externo precisa
  passar por `sanitizarCaminhoInterno` (`lib/safe-redirect.ts`).
- **Errors em rota de API**: usar `capturarErroProducao(err, ctx)` de
  `lib/logger.ts`. Ponto único — Sentry é plugável ali.
- **RLS**: todas as tabelas com PII têm RLS. Policies filtram
  `deleted_at IS NULL` (soft delete). Uploads têm ownership
  transitiva via `processos.user_id`.

## Limites absolutos (agente autônomo)

- Nunca `git push` em `main`/`master` sem confirmação humana.
- Nunca `vercel --prod` nem aplicar migration em prod (Paulo roda no
  SQL Editor manualmente pela manhã).
- Nunca commitar secret. Rodar `scripts/check-secrets.sh` antes.
- Nunca tocar em `.env.local`, `.env.production`, Vercel env vars.
- Migrations são aditivas (sem DROP destrutivo) — `CREATE OR REPLACE`,
  `ADD COLUMN IF NOT EXISTS`, `CREATE POLICY IF NOT EXISTS`.

## Comandos frequentes

```bash
npm run dev                     # Next.js dev server
npm run build                   # Build prod
npx tsc --noEmit                # Typecheck (sem emit)
npm run lint                    # ESLint
npm test                        # Vitest (quebra no Win por WDAC — CI)
bash scripts/check-secrets.sh   # Pré-commit secrets scan
```

## Arquivos de topo que Claude deve conhecer

- `proxy.ts` — middleware Next 16 (no-store em rotas autenticadas,
  auth guard, headers).
- `next.config.ts` — CSP, HSTS, X-Frame-Options:DENY, image domains.
- `app/layout.tsx` — `<html lang="pt-BR">`, metadata global.
- `lib/supabase/{client,server,admin}.ts` — três modos de client.
- `lib/tier.ts` — hierarquia e gate de acesso por tier.
- `lib/audit.ts` — append-only audit trail.
- `lib/rate-limit{,-upstash}.ts` — rate limit dual (memory/redis).
- `lib/logger.ts` — log estruturado JSON com auto-redação de PII.
- `lib/safe-redirect.ts` — defense-in-depth open redirect.

## Dívida conhecida (não mexer sem motivo)

- `tests/smoke.test.ts` e `tests/setup.ts` ainda referenciam
  `PAGARME_WEBHOOK_SECRET`. Legacy — Pagar.me foi removido do produto.
  Migrar para CAKTO quando oportuno.
- `lib/anthropic/*` duplica padrão de leitura de API key — refactor
  para helper central não é prioridade.
