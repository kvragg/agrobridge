# Relatório de Auditoria — Iteração 1

**Data:** 2026-04-21 00:15
**Branch:** `audit-2026-04-20`
**Base commit:** `440250b` (feat: APEX-SEC hardening + Cakto integration + viabilidade PDF)

## Sumário Executivo

Estado de partida muito mais maduro que a OS presume. Trabalhos APEX-SEC (2026-04-20) e migração Cakto fecharam a maioria dos riscos críticos de segurança e pagamento. Overnight foca no **delta restante**: LGPD Art. 18 (exportar/excluir conta), observabilidade (Sentry), rate-limit distribuído (Upstash), tabela `compras` dedicada + limite mensal Mentoria, middleware global, e documentação DX.

### Total auditado: 12 blocos da OS
- ✅ Fechados (pré-auditoria): **7 blocos** — A (inventário parcial), C (APIs existentes com auth/rate-limit/magic-bytes), D (CSP/HSTS/XFO/cookies Supabase), E (prompts XML tags + max_tokens), F (RLS + idempotência + audit), G (storage per-user + 10MB + magic bytes), H1-H2 (Cakto webhook + /planos)
- ⚠️ Parciais: **3 blocos** — B (UI não varrida página por página), J (LGPD — privacidade precisa de Art. 33 + Art. 18 endpoints), K (performance/SEO/a11y não medidos)
- 🔴 Faltantes: **2 blocos** — L (Sentry não instalado), e subpartes H4/H5 (limite Ouro + mapping produto→tier)

### Breakdown de issues
- 🔴 **Críticos (bloqueia venda):** 4
- 🔴 **Altos (bloqueia escala confiável):** 6
- ⚠️ **Médios:** 8
- 🟢 **Baixos (cosmético/DX):** 7

### Top 5 riscos remanescentes
1. **LGPD — ausência de endpoints Art. 18** — `/api/conta/exportar` e `/api/conta/excluir` não existem. Violação direta do direito do titular. Venda sem isso é risco jurídico alto.
2. **Observabilidade zero** — erro silencioso em produção é cego para webhook falhando, API Anthropic down, erros 500. Sentry crítico para ops.
3. **Rate limit não sobrevive cold start** — cada instância Vercel tem seu próprio `Map`. Atacante pode paralelizar via múltiplas regiões.
4. **Middleware global ausente** — sem validação sistêmica de `?next=` (open redirect). Login flow vulnerável.
5. **Sem registro durável de compras** — `processos.perfil_json._tier` é fonte única. Sem tabela `compras`, impossível implementar limite 6/mês Mentoria ou reconciliar chargebacks.

### Próximo batch: Wave 1 — Middleware + CSP refinements + secrets check script

---

## 5.2. Tabela Detalhada de Itens

| ID  | Item                                                    | Status | Arquivo:linha                                            | Descrição                                                                    | Severidade | Ação                           |
|-----|---------------------------------------------------------|--------|----------------------------------------------------------|------------------------------------------------------------------------------|------------|--------------------------------|
| A-1 | Árvore `app/`, `components/`, `lib/`, `supabase/`       | ✅     | —                                                        | Listada em snapshot Fase 1                                                   | baixa      | —                              |
| A-2 | Rotas mapeadas                                          | ✅     | —                                                        | 12 páginas + 13 rotas API confirmadas                                        | baixa      | —                              |
| A-3 | `.env.example`                                          | 🔴     | raiz (não existe)                                        | Onboarding dev sem mapa de env vars                                          | alta       | Criar (B19)                    |
| A-4 | `npm audit`                                             | ⏭️     | —                                                        | Será executado no batch de deps                                              | média      | Executar                       |
| A-5 | `CLAUDE.md` reflete estado real                         | ⚠️     | `CLAUDE.md:1` (só `@AGENTS.md`)                          | Não documenta stack/módulos                                                  | média      | Expandir (B20)                 |
| A-6 | Build + typecheck                                       | ✅     | —                                                        | Zero erros no base commit                                                    | baixa      | Revalidar a cada batch         |
| B-1 | `/` landing                                             | 📋     | `app/page.tsx`                                           | Requer varredura manual UI                                                   | média      | Wave 6                         |
| B-7 | `/privacidade` LGPD Art. 33                             | 🔴     | `app/privacidade/page.tsx`                               | Sem cláusula de transferência internacional                                  | crítica    | Wave 3 B9                      |
| B-10| Links oficiais do checklist                             | ⏭️     | `app/(dashboard)/checklist/[id]/page.tsx`                | Links do gov.br precisam ser testados um a um                                | alta       | Wave 6 B18                     |
| B-13| `/planos`                                               | ✅     | `app/planos/page.tsx`                                    | Existe com 3 cards Cakto                                                     | baixa      | Adicionar contador vagas Ouro  |
| C-* | Rotas API com auth + rate-limit + magic-bytes           | ✅     | `app/api/**/route.ts`                                    | Auditado em APEX-SEC                                                         | baixa      | —                              |
| D-1 | CSP                                                     | ⚠️     | `next.config.ts:5-17`                                    | Funcional, mas sem `frame-ancestors` explícito                               | média      | Wave 1 B3                      |
| D-7 | Rate limit distribuído                                  | 🔴     | `lib/rate-limit.ts:2`                                    | In-memory não sobrevive serverless multi-região                              | alta       | Wave 5 B15                     |
| D-8 | CSRF em rotas mutativas                                 | ⚠️     | —                                                        | SameSite=Lax dos cookies Supabase protege; revalidar form submissions        | média      | Verificar em Wave 1            |
| E-* | Prompts + max_tokens                                    | ✅     | `prompts/*.md`                                           | Delimitadores OK, caps definidos                                             | baixa      | —                              |
| F-* | RLS + audit                                             | ✅     | `supabase/migrations/*`                                  | Hardening APEX-SEC completo                                                  | baixa      | —                              |
| F-6 | Tabela `compras`                                        | 🔴     | `supabase/migrations/` (não existe)                      | Sem tabela dedicada, sem limite mensal Mentoria                              | alta       | Wave 2 B4                      |
| F-7 | View `vagas_ouro_mes_corrente`                          | 🔴     | (não existe)                                             | Sem contagem de vagas                                                        | alta       | Wave 2 B5                      |
| F-8 | Soft delete `deleted_at` em PII                         | ⚠️     | `supabase/migrations/` (ausente na maioria)              | Exclusão de conta precisa                                                    | alta       | Wave 3 B12                     |
| G-* | Storage                                                 | ✅     | `supabase/migrations/20260419010000_rls_uploads_hardening.sql` | Per-user path + RLS transitiva + 10MB + magic bytes                  | baixa      | —                              |
| H-1 | Webhook Cakto HMAC + idempotência                       | ✅     | `app/api/pagamento/webhook/route.ts:1-328`               | Consolidado (não precisa rota nova)                                          | baixa      | —                              |
| H-4 | Limite 6/mês Mentoria                                   | 🔴     | —                                                        | Não implementado                                                             | crítica    | Wave 2 B7                      |
| H-6 | Propagação `user_id` para Cakto                         | ⚠️     | `components/planos/PlanosClient.tsx:14-25`               | Usar `?ref={user_id}` ou reconciliar por email                               | média      | Verificar em Wave 2            |
| I-* | Email/Resend                                            | ⏭️     | `lib/email/`                                             | Templates existem; verificar DKIM/SPF via `/termos` domínio                  | média      | Wave 6                         |
| J-1 | LGPD `/privacidade` transferências                      | 🔴     | `app/privacidade/page.tsx`                               | Ausente                                                                      | crítica    | Wave 3 B9                      |
| J-4 | `/api/conta/excluir`                                    | 🔴     | (não existe)                                             | Violação LGPD Art. 18                                                        | crítica    | Wave 3 B11                     |
| J-5 | `/api/conta/exportar`                                   | 🔴     | (não existe)                                             | Violação LGPD Art. 18                                                        | crítica    | Wave 3 B10                     |
| J-7 | DPO / canal LGPD                                        | 🔴     | `app/privacidade/page.tsx`                               | Não declarado                                                                | alta       | Wave 3 B9                      |
| K-5 | Sitemap + robots.txt                                    | ⏭️     | `public/`                                                | Verificar no Wave 6                                                          | média      | Wave 6                         |
| K-7 | `<html lang="pt-BR">`                                   | ⏭️     | `app/layout.tsx`                                         | Verificar                                                                    | baixa      | Wave 6                         |
| L-1 | Sentry                                                  | 🔴     | (não instalado)                                          | Sem observabilidade de erros                                                 | alta       | Wave 4 B13                     |
| L-4 | `.env.example`                                          | 🔴     | (não existe)                                             | Duplica A-3                                                                  | alta       | Wave 7 B19                     |
| SEC-1| Middleware global para `?next=` + `no-store`           | 🔴     | `middleware.ts` (não existe)                             | Open redirect vulnerável                                                     | alta       | Wave 1 B1                      |
| SEC-2| Script check-secrets pré-commit                         | ⚠️     | `scripts/` (não existe)                                  | Prevenção de leak                                                            | média      | Wave 1 B2                      |

---

## 5.3. Plano de Ataque da Iteração 1

Sequência já definida em `.claude/plans/auditoria-brutal-peaceful-clarke.md`. Ordem de ataque (prioridade → baixa):

**Crítico primeiro:**
1. Wave 3 B9 (LGPD privacidade) — abrange 3 itens críticos (J-1, J-7, B-7)
2. Wave 3 B10 + B11 (exportar + excluir) — 2 críticos (J-4, J-5)
3. Wave 2 B7 (limite 6/mês Mentoria) — 1 crítico (H-4)

**Alto depois (infra):**
4. Wave 1 B1 (middleware) — SEC-1
5. Wave 2 B4 + B5 (compras + view) — F-6 + F-7
6. Wave 5 B15 (Upstash adapter) — D-7
7. Wave 4 B13 (Sentry) — L-1

**Médio/baixo ao fim:**
8. Wave 1 B3 (CSP refinements) — D-1
9. Wave 3 B12 (soft delete) — F-8
10. Wave 6 — testes + UI sweep + links oficiais
11. Wave 7 — docs e DX

Ordem dos commits sequencial dentro de cada Wave; entre Waves, cada Wave é independente.

---

## 5.4. Itens Pulados

Nenhum até agora. Itens que esperam decisão humana (fila de perguntas) não são "pulados" — receberam default aplicado e seguem.
