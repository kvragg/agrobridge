# AgroBridge

Plataforma SaaS de consultoria em crédito rural. Guia o produtor rural
pelo processo de documentação para crédito em bancos e cooperativas
usando IA (entrevista estruturada → checklist personalizado → validação
de documentos → dossiê de crédito com defesa).

## Stack

Next.js 16 (App Router) · TypeScript · Supabase (Postgres/RLS/Storage/Auth)
· Anthropic Claude (Sonnet 4.6 + Haiku) · Cakto (pagamento) · Resend
(email) · Vercel (hosting).

## Setup local

Pré-requisitos: Node.js 20+, conta Supabase, API key Anthropic.

```bash
# 1. Clonar
git clone <repo> agrobridge && cd agrobridge

# 2. Dependências
npm install

# 3. Env vars
cp .env.example .env.local
# Edite .env.local com seus valores. Ver seção "Variáveis" abaixo.

# 4. Supabase local (opcional — pode apontar pra projeto cloud)
# Se usar CLI local:
#   npx supabase start
# Se usar projeto cloud, rode as migrations manualmente no SQL Editor
# na ordem cronológica de supabase/migrations/.

# 5. Dev server
npm run dev
# → http://localhost:3000
```

## Variáveis de ambiente

`.env.example` documenta todas. Obrigatórias para rodar:

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- `NEXT_PUBLIC_SITE_URL` / `NEXT_PUBLIC_APP_URL`

Opcionais (fallbacks sensatos):

- `RESEND_API_KEY` — sem ela, emails transacionais não saem (no-op)
- `CAKTO_WEBHOOK_SECRET` + `CAKTO_PRODUTO_*` — só necessário em produção
- `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` — sem elas,
  rate limit é in-memory (ok em dev)

## Comandos

```bash
npm run dev                     # Dev server
npm run build                   # Build de produção
npm start                       # Serve build
npx tsc --noEmit                # Typecheck
npm run lint                    # ESLint
npm test                        # Vitest (integração)
bash scripts/check-secrets.sh   # Scan pré-commit de secrets
```

## Arquitetura

Ver `CLAUDE.md` para o mapa completo de módulos, convenções e arquivos
críticos. TL;DR:

```
app/
  (auth)/           Login, cadastro, reset
  (dashboard)/      Entrevista, checklist, dossiê (protegido)
  api/              Rotas REST (Anthropic, pagamento, LGPD, etc.)
  auth/             Callbacks OAuth
  conta/            Autoatendimento LGPD (exportar, excluir)
  planos/           Paywall (Bronze/Prata/Ouro → Cakto external)
  privacidade/      Política LGPD completa
lib/
  supabase/         Três clients (client, server, admin)
  anthropic/        Wrappers do SDK por modelo/função
  audit.ts          Trilha de auditoria append-only
  rate-limit*.ts    Rate limit dual (memory + Upstash)
  logger.ts         Log estruturado com auto-redação PII
  safe-redirect.ts  Defense-in-depth open redirect
supabase/migrations/  SQL migrations (aditivas, não destrutivas)
tests/integration/    Vitest — webhook, idempotência, IDOR, audit, etc.
proxy.ts              Middleware Next 16 (auth + headers + no-store)
```

## Fluxo principal

1. Produtor cadastra em `/cadastro` → confirma email.
2. `/entrevista/nova` → Haiku coleta perfil estruturado.
3. `/planos` → escolhe Bronze (R$ 79,99) / Prata (R$ 397,00) / Ouro
   (R$ 1.497,00) → Cakto checkout → webhook confirma pagamento.
   Todos com garantia incondicional de 7 dias.
4. `/checklist/[id]` → Sonnet gera lista personalizada com links
   oficiais (CAR, CCIR, ITR, CNDs, etc.).
5. Upload de documentos → validação IA (magic bytes + Sonnet).
6. Geração de dossiê PDF com defesa de crédito (Sonnet).
7. Produtor leva ao Banco/Cooperativa.

## Segurança & LGPD

- RLS em todas as tabelas com PII. Ownership transitiva nos uploads.
- Audit append-only (`audit_events`) em fluxos sensíveis.
- Soft delete global (`deleted_at`) — RLS filtra automaticamente.
- Art. 18: `/api/conta/exportar` (JSON + signed URLs 15min) e
  `/api/conta/excluir` (dupla confirmação via token + anonimização).
- CSP + HSTS + X-Frame-Options:DENY em `next.config.ts`.
- Rate limit: 5-60/hora por rota (ver `lib/rate-limit.ts`).
- Logger estruturado com auto-redação de PII em `extra`.

## Deploy

Vercel com env vars configuradas no dashboard (nunca comitadas).
Migrations aplicadas manualmente no SQL Editor do Supabase na ordem
cronológica de `supabase/migrations/`.

## Licença

Proprietary. © 2026 AgroBridge.
