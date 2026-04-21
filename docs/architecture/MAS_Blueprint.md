# AgroBridge — Multi-Agent System Blueprint

## Contexto

Evolução do AgroBridge para MAS sobre o pipeline existente (Entrevista → Checklist → Validação → Dossiê). Escopo do código atual é travado: funil `/planos`, 4 rotas IA em `@anthropic-ai/sdk` direto, RLS por `auth.uid()`, service role só no webhook de pagamento. Nada disso será reescrito — adoto Strangler Fig: nova camada `lib/agents/*` sob Vercel AI SDK absorve responsabilidades por rota, uma de cada vez.

## Princípios travados

1. **Zero Trust por capability** — nenhum agente recebe Supabase client. Cada um vê apenas um set fixo de tools.
2. **Intent pattern** — toda tool mutadora é `*Intent`: devolve payload ao Orquestrador, não escreve. Orquestrador só persiste após Auditor aprovar.
3. **State Machine determinística** — transição de `processos.fase` é switch/case no backend. Agentes nunca decidem fluxo.
4. **Auditor transversal em texto livre** — roda em toda saída com linguagem natural (dossiê, validação narrativa, próxima pergunta). Pula intents puramente estruturais.
5. **Migração incremental (Strangler)** — orquestrador + agentes novos; rotas atuais são absorvidas uma a uma, começando pela entrevista.

## Arquitetura

```
ORQUESTRADOR (código, não LLM)
  lê processos.fase  →  switch/case
  dispara agente     →  recebe Intent
  chama Auditor      →  aprova/veta
  se aprovado        →  persiste (único com .update)
  transiciona fase   →  único autorizado

  ├─ Entrevistador (Haiku, stream)  fase: qualificacao
  ├─ Checklister   (Sonnet)         fase: checklist
  ├─ Validador     (Sonnet vision)  fase: documentos
  └─ Redator       (Sonnet)         fase: dossie
           │
           ▼
   AUDITOR COMPLIANCE (Sonnet, read-only)
     aprovar(razao) | vetar(razao, correcoes)
```

## Mapa de tools (Zero Trust estrito)

### Orquestrador
- Código, não LLM. Sem tools.
- Único com `.update()` em Supabase e transição de `processos.fase`.

### Entrevistador (Haiku, streaming)
- `anotarRespostaIntent(campo, valor)` — intent
- `finalizarEntrevistaIntent(perfil_json)` — intent final

### Checklister (Sonnet)
- `lerPerfil(processo_id)` — read-only
- `gerarChecklistIntent(items[])` — intent

### Validador (Sonnet vision)
- `lerDocumento(storage_path)` — binário
- `lerContextoDoc(slug)` — nome esperado
- `lerRegraChecklist(slug)` — read-only, regra que originou a exigência
- `registrarValidacaoIntent(slug, resultado)` — intent

### Redator do Dossiê (Sonnet)
- `lerPerfil` / `lerChecklist` / `lerValidacoes` — read-only
- `listarDocsAnexados()` — metadados
- `salvarLaudoIntent(markdown)` — intent

### Auditor Compliance (Sonnet, read-only)
- `lerIntent(agente, processo_id)`
- `verificarMencaoBancos(texto)` — regex hard-coded (BB, Sicredi, Sicoob, Caixa, BNB, Bradesco, Itaú, Santander)
- `verificarLGPD(texto)` — PII fora de contexto
- `verificarAlucinacao(texto, fontes)`
- `aprovar(razao)` | `vetar(razao, correcoes)`
- Nunca persiste — Orquestrador age na decisão.

## Layout de arquivos (novos)

```
lib/agents/
  orchestrator.ts        # state machine, dispatch, persistência
  auditor.ts             # compliance gate
  types.ts               # Intent<T>, AgentResult, AuditVerdict
  agents/
    entrevistador.ts
    checklister.ts
    validador.ts
    redator.ts
  tools/
    perfil.ts            # lerPerfil (read-only)
    checklist.ts         # lerChecklist, lerRegraChecklist
    validacoes.ts        # lerValidacoes
    documentos.ts        # lerDocumento, listarDocsAnexados
    intents.ts           # *Intent (empacotadores sem I/O)
  telemetry/
    events.ts            # agent_events (nova tabela)

docs/architecture/
  MAS_Blueprint.md       # este blueprint
```

## Ordem de migração (Strangler Fig)

1. **Fundação** — `types.ts`, `orchestrator.ts` (stub), `auditor.ts`, migration `agent_events` (RLS por `auth.uid()`).
2. **Entrevista** — porta `POST /api/entrevista` para rodar sob o orquestrador. SSE intacto. Prompt atual vira system do agente.
3. **Validador** — migra `POST /api/documento/validar`. Auditor entra no gate.
4. **Checklister** — migra `POST /api/checklist`.
5. **Redator** — migra `POST /api/dossie` (maior ganho em compliance).

Cada porta: rota velha fica como fallback atrás de feature flag até validação; depois remove.

## Observabilidade

- Tabela `agent_events` (`processo_id`, `agente`, `tipo: 'llm_call'|'tool_call'|'intent'|'audit_verdict'|'persisted'`, `payload jsonb`, `ts`). RLS por user.
- `console.log` estruturado (Vercel logs).
- Sem vendor externo no MVP.

## Anti-objetivos

- Não reescrever as 4 rotas IA existentes fora da migração planejada.
- Nenhuma tool de write direto em agente — tudo é Intent.
- LLM nunca decide fase do processo.
- Service role inacessível a qualquer agente — fica restrito ao Orquestrador/webhook.
- Sem vendor de observabilidade externa no MVP.

## Verificação

1. `npx tsc --noEmit` após fundação — sem erros.
2. Entrevista pós-migração: SSE intacto, registros em `agent_events`.
3. Teste negativo — forçar LLM a chamar write direto: confirmar que tool não existe no contrato.
4. Teste Auditor — injetar menção a banco no laudo: confirmar veto e payload de correção.
