import "server-only";
import {
  AnyIntent,
  AuditVerdict,
  AuditVerdictSchema,
} from "./types";

// ============================================================
// AgroBridge MAS — auditor.ts
// Gate de compliance transversal. Roda sobre toda Intent que
// contém texto livre destinado ao usuário final (dossiê, laudo,
// mensagens). É read-only por contrato: NUNCA persiste, nunca
// modifica estado. Apenas devolve AuditVerdict.
// ============================================================

// Regex hard-coded de marcas proibidas. Mantido no código
// (não em config) justamente porque é invariante de produto:
// em qualquer saída de IA para o usuário, cita-se "Banco" ou
// "Cooperativa" de forma genérica.
const MARCAS_BANCOS = [
  /\bBanco do Brasil\b/i,
  /\bBB\b/,
  /\bCaixa( Econ[oô]mica)?( Federal)?\b/i,
  /\bSicredi\b/i,
  /\bSicoob\b/i,
  /\bBradesco\b/i,
  /\bIta[uú]\b/i,
  /\bSantander\b/i,
  /\bBNB\b/,
  /\bBanco do Nordeste\b/i,
  /\bBasa\b/i,
  /\bBanco da Amaz[oô]nia\b/i,
];

export type VerificacaoResultado = {
  ok: boolean;
  trechos: string[];
};

export function verificarMencaoBancos(texto: string): VerificacaoResultado {
  const trechos: string[] = [];
  for (const re of MARCAS_BANCOS) {
    const m = texto.match(re);
    if (m) trechos.push(m[0]);
  }
  return { ok: trechos.length === 0, trechos };
}

// Stubs declarados para fechar o contrato. Implementação real
// vem junto da Fase 3 (Validador) e Fase 5 (Redator) da migração.
export function verificarLGPD(_texto: string): VerificacaoResultado {
  // TODO(Fase 3): detectar CPF/RG/cartão/saldo bancário em
  // contextos onde não foram pedidos pelo pipeline.
  return { ok: true, trechos: [] };
}

export function verificarAlucinacao(
  _texto: string,
  _fontes: ReadonlyArray<string>,
): VerificacaoResultado {
  // TODO(Fase 5): verificar se claims numéricos do laudo
  // correspondem a valores presentes nas fontes (perfil,
  // validações, metadados de uploads).
  return { ok: true, trechos: [] };
}

// ------------------------------------------------------------
// Entry point. O Orquestrador chama exclusivamente `auditar`.
// O próprio Auditor decide quais verificações rodar em função
// da Intent: intents estruturais (anotarResposta, gerarChecklist)
// podem pular checagens de texto livre; intents com markdown
// destinado ao usuário (salvarLaudo) rodam o pacote completo.
// ------------------------------------------------------------
export async function auditar(intent: AnyIntent): Promise<AuditVerdict> {
  const textosLivres = extrairTextoLivre(intent);

  if (textosLivres.length === 0) {
    return AuditVerdictSchema.parse({
      decisao: "aprovado",
      razao: "intent estrutural sem texto livre auditável",
    });
  }

  for (const texto of textosLivres) {
    const bancos = verificarMencaoBancos(texto);
    if (!bancos.ok) {
      return AuditVerdictSchema.parse({
        decisao: "vetado",
        razao: "menção a marca de instituição financeira específica",
        correcoes: bancos.trechos.map((t) => ({
          campo: "texto",
          problema: `marca proibida: ${t}`,
          sugestao: "substituir por 'Banco' ou 'Cooperativa' genérico",
        })),
      });
    }
  }

  return AuditVerdictSchema.parse({
    decisao: "aprovado",
    razao: "sem menções a marcas proibidas",
  });
}

// Extrai trechos de texto livre auditável por tipo de Intent.
// Mantido como switch para que novas Intents forcem atualização
// explícita (never-exhaustiveness check).
function extrairTextoLivre(intent: AnyIntent): string[] {
  switch (intent.name) {
    case "entrevistador.anotarResposta":
      return [];
    case "entrevistador.finalizarEntrevista":
      return [];
    case "checklister.gerarChecklist":
      return intent.payload.items.map(
        (i) => `${i.nome}. ${i.regra}`,
      );
    case "validador.registrarValidacao":
      return [intent.payload.mensagem];
    case "redator.salvarLaudo":
      return [intent.payload.markdown, intent.payload.resumoExecutivo];
    default: {
      const _exhaustive: never = intent;
      throw new Error(
        `Auditor não sabe extrair texto de: ${JSON.stringify(_exhaustive)}`,
      );
    }
  }
}
