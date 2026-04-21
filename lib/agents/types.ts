import "server-only";
import { z } from "zod";

// ============================================================
// AgroBridge MAS — types.ts
// Fundação tipada do contrato Multi-Agent System.
// Zero Trust: tudo que um agente emite atravessa estes schemas
// antes de chegar ao Orquestrador. Parse falho = descarte.
// ============================================================

// ------------------------------------------------------------
// Fases do processo — fonte da verdade: CHECK em `processos.fase`
// (migration 20260419000000_fluxo_completo.sql).
// Qualquer alteração aqui exige migration correspondente.
// ------------------------------------------------------------
export const ProcessoFaseSchema = z.enum([
  "qualificacao",
  "pagamento",
  "coleta",
  "checklist",
  "concluido",
]);
export type ProcessoFase = z.infer<typeof ProcessoFaseSchema>;

// ------------------------------------------------------------
// Inventário de agentes. Orquestrador é código puro (não LLM)
// e por isso não entra aqui. Auditor é transversal e também não
// emite Intents — apenas verdicts.
// ------------------------------------------------------------
export const AgenteNomeSchema = z.enum([
  "entrevistador",
  "checklister",
  "validador",
  "redator",
]);
export type AgenteNome = z.infer<typeof AgenteNomeSchema>;

// ------------------------------------------------------------
// Envelope Intent<T> — toda mutação proposta por um agente vive
// aqui. O agente NÃO executa nada; devolve um Intent e o
// Orquestrador decide persistir (pós-Auditor).
// O campo `name` é literal para permitir discriminated unions.
// ------------------------------------------------------------
export const IntentEnvelope = <N extends string, S extends z.ZodTypeAny>(
  name: N,
  payload: S,
) =>
  z.object({
    kind: z.literal("intent"),
    name: z.literal(name),
    emittedBy: AgenteNomeSchema,
    processoId: z.string().uuid(),
    payload,
  });

// ------------------------------------------------------------
// Intents do Entrevistador (fase: qualificacao)
// ------------------------------------------------------------
export const AnotarRespostaPayload = z.object({
  campo: z.string().min(1).max(64),
  valor: z.union([z.string(), z.number(), z.boolean(), z.null()]),
});
export const AnotarRespostaIntent = IntentEnvelope(
  "entrevistador.anotarResposta",
  AnotarRespostaPayload,
);
export type AnotarRespostaIntent = z.infer<typeof AnotarRespostaIntent>;

export const PerfilProdutorSchema = z
  .object({
    tipoPessoa: z.enum(["PF", "PJ"]),
    tipoCredito: z.string().min(1),
    finalidade: z.string().min(1),
    uf: z.string().length(2),
    atividade: z.string().min(1),
  })
  .passthrough();
export type PerfilProdutor = z.infer<typeof PerfilProdutorSchema>;

export const FinalizarEntrevistaPayload = z.object({
  perfil: PerfilProdutorSchema,
});
export const FinalizarEntrevistaIntent = IntentEnvelope(
  "entrevistador.finalizarEntrevista",
  FinalizarEntrevistaPayload,
);
export type FinalizarEntrevistaIntent = z.infer<
  typeof FinalizarEntrevistaIntent
>;

// ------------------------------------------------------------
// Intents do Checklister (fase: coleta)
// ------------------------------------------------------------
export const ChecklistItemSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(48)
    .regex(/^[a-z][a-z0-9_]*$/, "slug deve ser snake_case minúsculo"),
  nome: z.string().min(1).max(120),
  obrigatorio: z.boolean(),
  // regra: motivo regulamentar/MCR que justifica a exigência.
  // O Validador depende dele (lerRegraChecklist) para auditar documentos.
  regra: z.string().min(1),
});
export type ChecklistItem = z.infer<typeof ChecklistItemSchema>;

export const GerarChecklistPayload = z.object({
  items: z.array(ChecklistItemSchema).min(1).max(60),
});
export const GerarChecklistIntent = IntentEnvelope(
  "checklister.gerarChecklist",
  GerarChecklistPayload,
);
export type GerarChecklistIntent = z.infer<typeof GerarChecklistIntent>;

// ------------------------------------------------------------
// Intents do Validador (fase: checklist — uploads chegando)
// ------------------------------------------------------------
export const ValidacaoResultadoSchema = z.enum([
  "aprovado",
  "ressalva",
  "reprovado",
]);
export type ValidacaoResultado = z.infer<typeof ValidacaoResultadoSchema>;

export const RegistrarValidacaoPayload = z.object({
  slug: z.string().min(2).max(48),
  uploadId: z.string().uuid(),
  resultado: ValidacaoResultadoSchema,
  mensagem: z.string().min(1).max(2000),
  camposExtraidos: z.record(z.string(), z.unknown()).optional(),
});
export const RegistrarValidacaoIntent = IntentEnvelope(
  "validador.registrarValidacao",
  RegistrarValidacaoPayload,
);
export type RegistrarValidacaoIntent = z.infer<typeof RegistrarValidacaoIntent>;

// ------------------------------------------------------------
// Intents do Redator (fase: concluido)
// ------------------------------------------------------------
export const SalvarLaudoPayload = z.object({
  markdown: z.string().min(200).max(120_000),
  resumoExecutivo: z.string().min(1).max(2000),
});
export const SalvarLaudoIntent = IntentEnvelope(
  "redator.salvarLaudo",
  SalvarLaudoPayload,
);
export type SalvarLaudoIntent = z.infer<typeof SalvarLaudoIntent>;

// ------------------------------------------------------------
// União discriminada de todas as Intents reconhecidas.
// Qualquer Intent fora dessa união é rejeitada pelo Orquestrador.
// ------------------------------------------------------------
export const AnyIntentSchema = z.discriminatedUnion("name", [
  AnotarRespostaIntent,
  FinalizarEntrevistaIntent,
  GerarChecklistIntent,
  RegistrarValidacaoIntent,
  SalvarLaudoIntent,
]);
export type AnyIntent = z.infer<typeof AnyIntentSchema>;

// ------------------------------------------------------------
// Auditor — verdict de compliance. Nunca persiste nada; apenas
// autoriza ou barra o Orquestrador.
// ------------------------------------------------------------
export const AuditCorrecaoSchema = z.object({
  campo: z.string().min(1),
  problema: z.string().min(1),
  sugestao: z.string().min(1),
});
export type AuditCorrecao = z.infer<typeof AuditCorrecaoSchema>;

export const AuditVerdictSchema = z.discriminatedUnion("decisao", [
  z.object({
    decisao: z.literal("aprovado"),
    razao: z.string().min(1),
  }),
  z.object({
    decisao: z.literal("vetado"),
    razao: z.string().min(1),
    correcoes: z.array(AuditCorrecaoSchema).min(1),
  }),
]);
export type AuditVerdict = z.infer<typeof AuditVerdictSchema>;

// ------------------------------------------------------------
// AgentResult — wrapper comum do que um agente devolve ao
// Orquestrador. Ou uma Intent, ou texto livre (ex.: próxima
// pergunta da entrevista), ou erro controlado.
// ------------------------------------------------------------
export const AgentResultSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("intent"),
    intent: AnyIntentSchema,
  }),
  z.object({
    kind: z.literal("text"),
    emittedBy: AgenteNomeSchema,
    processoId: z.string().uuid(),
    text: z.string().min(1),
  }),
  z.object({
    kind: z.literal("error"),
    emittedBy: AgenteNomeSchema,
    processoId: z.string().uuid(),
    code: z.enum([
      "timeout",
      "provider_error",
      "invalid_output",
      "policy_violation",
      "not_implemented",
    ]),
    message: z.string().min(1),
  }),
]);
export type AgentResult = z.infer<typeof AgentResultSchema>;

// ------------------------------------------------------------
// Entrada do Orquestrador. `input.kind` determina se é início
// de turno do usuário (chat) ou evento de sistema (upload novo,
// webhook de pagamento etc).
// ------------------------------------------------------------
export const OrchestratorInputSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("user_message"),
    processoId: z.string().uuid(),
    userId: z.string().uuid(),
    text: z.string().min(1).max(8000),
  }),
  z.object({
    kind: z.literal("system_event"),
    processoId: z.string().uuid(),
    userId: z.string().uuid(),
    event: z.enum([
      "pagamento_confirmado",
      "upload_recebido",
      "checklist_completo",
      "usuario_solicitou_dossie",
    ]),
    ref: z.string().optional(),
  }),
]);
export type OrchestratorInput = z.infer<typeof OrchestratorInputSchema>;

// ------------------------------------------------------------
// Telemetria — linha da tabela `agent_events` (migration futura).
// Mantido aqui para o Orquestrador emitir eventos tipados.
// ------------------------------------------------------------
export const TelemetryEventTypeSchema = z.enum([
  "llm_call",
  "tool_call",
  "intent",
  "audit_verdict",
  "persisted",
  "fase_transicao",
  "error",
]);
export type TelemetryEventType = z.infer<typeof TelemetryEventTypeSchema>;

export const TelemetryEventSchema = z.object({
  processoId: z.string().uuid(),
  agente: AgenteNomeSchema.nullable(),
  tipo: TelemetryEventTypeSchema,
  payload: z.record(z.string(), z.unknown()),
});
export type TelemetryEvent = z.infer<typeof TelemetryEventSchema>;
