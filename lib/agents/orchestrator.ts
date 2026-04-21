import "server-only";
import {
  AgentResult,
  AnyIntent,
  AuditVerdict,
  OrchestratorInput,
  OrchestratorInputSchema,
  ProcessoFase,
  ProcessoFaseSchema,
} from "./types";

// ============================================================
// AgroBridge MAS — orchestrator.ts
// Máquina de estados determinística. NÃO é LLM.
// Único componente do sistema autorizado a:
//   - ler `processos.fase`
//   - chamar `.update()` / `.insert()` em tabelas de estado
//   - transicionar `processos.fase`
//   - executar a Intent depois do verdict do Auditor
// Agentes são desacoplados: recebem contexto e devolvem
// Intent/texto; o Orquestrador faz todo o resto.
// ============================================================

// Esqueleto cru: sem integração real com Supabase nem agentes
// até a Fase 2 (porta da /api/entrevista). Qualquer ramo que
// exija comportamento real retorna um AgentResult 'error' com
// code 'not_implemented' em vez de lançar — assim a fronteira
// de transporte (rota API) pode responder com 501 controlado.

export type OrchestratorDeps = {
  lerFase: (processoId: string) => Promise<ProcessoFase>;
  persistirFase: (processoId: string, proxima: ProcessoFase) => Promise<void>;
  persistirIntent: (intent: AnyIntent) => Promise<void>;
  registrarTelemetria: (evento: {
    processoId: string;
    tipo: string;
    payload: Record<string, unknown>;
  }) => Promise<void>;
  auditar: (intent: AnyIntent) => Promise<AuditVerdict>;
};

type AgenteRunner = (ctx: {
  processoId: string;
  userId: string;
  input: OrchestratorInput;
}) => Promise<AgentResult>;

// Registro de agentes por fase. Preenchido pela Fase 2+ do
// Strangler Fig (entrevista → validador → checklister → redator).
// Fase 'pagamento' e 'concluido' não têm agente interativo:
// são gates de sistema observados via `system_event`.
const runnersPorFase: Partial<Record<ProcessoFase, AgenteRunner>> = {};

export function registerAgenteRunner(
  fase: ProcessoFase,
  runner: AgenteRunner,
): void {
  runnersPorFase[fase] = runner;
}

// ------------------------------------------------------------
// Transições permitidas. Grafo explícito; qualquer transição
// fora daqui é bloqueada — inclusive se um agente tentar
// induzir via Intent.
// ------------------------------------------------------------
const transicoesPermitidas: Record<ProcessoFase, ProcessoFase[]> = {
  qualificacao: ["pagamento"],
  pagamento: ["coleta"],
  coleta: ["checklist"],
  checklist: ["concluido"],
  concluido: [],
};

export function podeTransicionar(
  atual: ProcessoFase,
  proxima: ProcessoFase,
): boolean {
  return transicoesPermitidas[atual]?.includes(proxima) ?? false;
}

// ------------------------------------------------------------
// Entry point único.
// ------------------------------------------------------------
export async function despachar(
  rawInput: unknown,
  deps: OrchestratorDeps,
): Promise<AgentResult> {
  const input = OrchestratorInputSchema.parse(rawInput);
  const fase = ProcessoFaseSchema.parse(await deps.lerFase(input.processoId));

  await deps.registrarTelemetria({
    processoId: input.processoId,
    tipo: "llm_call",
    payload: { fase, inputKind: input.kind },
  });

  switch (fase) {
    case "qualificacao":
      return await rodarAgente(fase, input, deps);

    case "pagamento":
      // Gate de sistema. Nenhum agente atua; Orquestrador só
      // reage a `system_event: pagamento_confirmado` vindo do
      // webhook Cakto e avança para 'coleta'.
      if (
        input.kind === "system_event" &&
        input.event === "pagamento_confirmado"
      ) {
        return await transicionar(input.processoId, "pagamento", "coleta", deps);
      }
      return notImplemented(input, "aguardando pagamento_confirmado");

    case "coleta":
      return await rodarAgente(fase, input, deps);

    case "checklist":
      return await rodarAgente(fase, input, deps);

    case "concluido":
      return await rodarAgente(fase, input, deps);

    default: {
      const _exhaustive: never = fase;
      throw new Error(`fase não exaustiva: ${String(_exhaustive)}`);
    }
  }
}

// ------------------------------------------------------------
// Helpers internos. Apenas o Orquestrador invoca.
// ------------------------------------------------------------
async function rodarAgente(
  fase: ProcessoFase,
  input: OrchestratorInput,
  deps: OrchestratorDeps,
): Promise<AgentResult> {
  const runner = runnersPorFase[fase];
  if (!runner) return notImplemented(input, `agente da fase '${fase}' ainda não registrado`);

  const result = await runner({
    processoId: input.processoId,
    userId: input.userId,
    input,
  });

  if (result.kind !== "intent") return result;

  const verdict = await deps.auditar(result.intent);
  await deps.registrarTelemetria({
    processoId: input.processoId,
    tipo: "audit_verdict",
    payload: { decisao: verdict.decisao, razao: verdict.razao },
  });

  if (verdict.decisao === "vetado") {
    return {
      kind: "error",
      emittedBy: result.intent.emittedBy,
      processoId: input.processoId,
      code: "policy_violation",
      message: verdict.razao,
    };
  }

  await deps.persistirIntent(result.intent);
  await deps.registrarTelemetria({
    processoId: input.processoId,
    tipo: "persisted",
    payload: { intent: result.intent.name },
  });

  // Transições automáticas encadeadas a intents específicas
  // ficam aqui quando migrarmos cada agente (Fase 2+).
  void fase;
  return result;
}

async function transicionar(
  processoId: string,
  atual: ProcessoFase,
  proxima: ProcessoFase,
  deps: OrchestratorDeps,
): Promise<AgentResult> {
  if (!podeTransicionar(atual, proxima)) {
    return {
      kind: "error",
      emittedBy: "entrevistador",
      processoId,
      code: "policy_violation",
      message: `transição ${atual} → ${proxima} não permitida`,
    };
  }
  await deps.persistirFase(processoId, proxima);
  await deps.registrarTelemetria({
    processoId,
    tipo: "fase_transicao",
    payload: { de: atual, para: proxima },
  });
  return {
    kind: "text",
    emittedBy: "entrevistador",
    processoId,
    text: `fase transicionada: ${atual} → ${proxima}`,
  };
}

function notImplemented(
  input: OrchestratorInput,
  motivo: string,
): AgentResult {
  return {
    kind: "error",
    emittedBy: "entrevistador",
    processoId: input.processoId,
    code: "not_implemented",
    message: motivo,
  };
}
