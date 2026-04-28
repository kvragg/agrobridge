<!--
PR Template AgroBridge — preencher antes de marcar pronto pra merge.
Item ignorado por descuido custa horas depois.
-->

## O que mudou

<!-- 1-3 linhas. Foco no PORQUÊ, não só no QUE. -->

## Tipo

- [ ] feat — nova funcionalidade
- [ ] fix — correção de bug
- [ ] perf — performance
- [ ] refactor — sem mudança funcional
- [ ] docs — só documentação
- [ ] sec — fix de segurança
- [ ] chore — deps, build, infra

---

## Checklist de segurança (obrigatório)

> Marque com `x` o que aplica. Se um item NÃO aplica, marque também e
> escreva "n/a" do lado. Branco = não foi pensado, e isso é red flag.

### Auth & autorização
- [ ] Rota nova ou modificada **exige `auth.getUser()`** (ou está em `PUBLIC_API_PREFIXES` no `proxy.ts` por motivo declarado)
- [ ] Acesso a tabela com PII passa por **RLS validada** OU usa `createAdminClient()` com motivo justificado
- [ ] Mutação que toca processo/dossiê/compras valida **ownership** (`processo.user_id === auth.uid()`) explicitamente — defense-in-depth

### Input
- [ ] Payload de API validado com **Zod** (ou type guard rigoroso) antes de tocar engine/DB
- [ ] Tamanho máximo de string respeitado (`slice` ou Zod `.max()`)
- [ ] Enum/union types validados — não confiar em `string` direto

### Output
- [ ] Erro pra usuário **não vaza** `err.message`/stack — usa `capturarErroProducao(err, ctx)` do `lib/logger`
- [ ] PII (email, CPF, nome, token) **nunca** vai pra `console.*` direto — sempre via `logger` que sanitiza `CAMPOS_PROIBIDOS`
- [ ] Resposta JSON não inclui campo "extra" do DB que não deveria sair (especialmente `service_role` nunca, `password_hash` nunca)

### Rate limit & abuso
- [ ] Rota nova tem **rate limit** se for: auth, IA (Anthropic), pagamento, exportação LGPD, exclusão LGPD
- [ ] Operações caras (geração de PDF, chamada Sonnet) tem cap por user/hora

### Audit & rastreabilidade
- [ ] Ação sensível registra em `audit_events` via `lib/audit.ts::registrarEventoAuditoria()`
- [ ] Campos PII NÃO vão pro payload do audit (chave, não valor)

### Migrations
- [ ] Migration é **aditiva** (`ADD COLUMN IF NOT EXISTS`, `CREATE POLICY IF NOT EXISTS`, `CREATE OR REPLACE`) — nunca `DROP` destrutivo
- [ ] Função `SECURITY DEFINER` nova tem `REVOKE ALL FROM PUBLIC` + `GRANT EXECUTE TO authenticated, service_role` (ou só service_role) explícitos
- [ ] RLS habilitada na tabela (`ENABLE ROW LEVEL SECURITY`) + policies apropriadas
- [ ] `search_path` setado pra `public, pg_temp` em funções

### IA / prompt
- [ ] Campo do `perfis_lead` interpolado no system prompt passa por `sanitizarParaPrompt()` (`lib/ai/system-prompt.ts`)
- [ ] Mensagem do user sanitizada pra Anthropic SDK shape antes de mandar (sem campos extra)
- [ ] System prompt tem instrução explícita pro modelo distinguir dado de instrução

### Frontend
- [ ] Sem `dangerouslySetInnerHTML` com input de user (a menos que escapado primeiro como `formatarBold`)
- [ ] Redirect com input externo passa por `sanitizarCaminhoInterno` (`lib/safe-redirect.ts`)
- [ ] Form que faz mutação tem CSRF protection implícita (POST + same-site cookie + origin check)

### LGPD / compliance
- [ ] Se feature coleta dado pessoal novo: documentado em `/privacidade` + base legal identificada
- [ ] Se feature deleta dado: respeita soft-delete + audit
- [ ] Se feature exporta dado: respeita anti-enumeração + rate limit

---

## Testes

- [ ] Tests unitários cobrem o caminho feliz **e** ao menos 1 caminho de falha
- [ ] Se mexeu em IA/auth/RLS/pagamento: tem teste de regressão em `tests/integration/`
- [ ] `npx tsc --noEmit` ✅
- [ ] `npx vitest run` ✅
- [ ] `npm run lint` ✅
- [ ] `npm run build` ✅

## Verificação manual (pra PR de UI/UX)

- [ ] Testado em browser (Chrome/Safari) — feature funciona
- [ ] Testado mobile (Chrome devtools 360px ou device real) — não quebra
- [ ] Modo escuro (default da plataforma) — sem texto invisível
- [ ] Mensagem de erro do user é amigável e em PT-BR

## Riscos e rollback

- **Risco:** <!-- o que pode dar errado em produção? -->
- **Rollback plan:** <!-- `git revert <hash>` + push? Migration reversível? Tem flag pra desligar? -->

## Migration / env vars

- [ ] Migration nova? Aplicada em prod via Supabase MCP **antes** do merge?
- [ ] Env var nova? Setada em **Production + Preview** no Vercel antes do deploy?

---

🤖 Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com> *(remover linha se PR não foi assistido)*
