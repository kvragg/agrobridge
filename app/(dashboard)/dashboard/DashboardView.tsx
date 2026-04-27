"use client"

import type { PerfilLead } from "@/types/perfil-lead"
import {
  Button,
  Eyebrow,
  GlassCard,
  Icon,
} from "@/components/landing/primitives"
import {
  DashboardPipeline,
  DocumentosStrip,
  ProdutorKPIs,
  ProximaAcao,
  type DocChip,
  type DocStatus,
  type Fase,
  type KPI,
} from "@/components/dashboard/DashboardBlocks"
import { JornadaFluxograma } from "@/components/dashboard/JornadaFluxograma"
import { EvolucaoScoreWidget } from "@/components/dashboard/EvolucaoScoreWidget"

interface ProcessoResumo {
  id: string
  perfil_json: Record<string, unknown> | null
  pagamento_confirmado: boolean
  created_at: string
}

// Lista curta dos docs mais comuns do MCR. Labels em PT-BR.
const DOCS_MCR: { slug: string; label: string }[] = [
  { slug: "car", label: "CAR" },
  { slug: "ccir", label: "CCIR" },
  { slug: "itr", label: "ITR" },
  { slug: "matricula", label: "Matrícula" },
  { slug: "projeto", label: "Projeto técnico" },
  { slug: "cnd_federal", label: "CND Federal" },
  { slug: "cnd_estadual", label: "CND Estadual" },
  { slug: "cnd_municipal", label: "CND Municipal" },
]

type ValidacaoEntry = { status?: DocStatus | string }

function extractDocChips(
  processo: ProcessoResumo | null,
): { docs: DocChip[]; total: number } {
  if (!processo) {
    return {
      docs: DOCS_MCR.map((d) => ({ ...d, status: "pendente" as DocStatus })),
      total: DOCS_MCR.length,
    }
  }
  const raw = (processo.perfil_json as Record<string, unknown> | null) ?? {}
  const validacoes = (raw._validacoes as Record<string, ValidacaoEntry> | undefined) ?? {}
  const docs: DocChip[] = DOCS_MCR.map((d) => {
    const v = validacoes[d.slug]
    let status: DocStatus = "pendente"
    if (v?.status === "ok") status = "ok"
    else if (v?.status === "enviando") status = "enviando"
    else if (v?.status === "rejeitado") status = "rejeitado"
    return { ...d, status }
  })
  return { docs, total: DOCS_MCR.length }
}

function formatArea(ha: number | null | undefined): string | null {
  if (!ha || ha <= 0) return null
  return `${ha.toLocaleString("pt-BR")} ha`
}

function formatValor(v: number | null | undefined): string | null {
  if (!v || v <= 0) return null
  if (v >= 1_000_000) {
    return `R$ ${(v / 1_000_000).toFixed(2).replace(".", ",")}M`
  }
  if (v >= 1_000) {
    return `R$ ${(v / 1_000).toFixed(0)} mil`
  }
  return `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
}

interface SimulacaoHistorico {
  score: number
  cultura: string
  valor_pretendido: number
  created_at: string
}

export function DashboardView({
  plano,
  perfil,
  processos,
  nomeCurto,
  historicoSimulacoes,
}: {
  plano: string
  perfil: PerfilLead | null
  processos: ProcessoResumo[]
  nomeCurto: string
  historicoSimulacoes?: SimulacaoHistorico[]
}) {
  const isFree = plano === "Free"
  const perguntas = perfil?.perguntas_respondidas_gratis ?? 0
  const miniPronta = !!perfil?.mini_analise_texto
  const processosPagos = processos.filter((p) => p.pagamento_confirmado)
  const ultimoProcesso = processosPagos[0] ?? null

  // ── Pipeline: calcula status das 4 fases ──
  const entrevistaDone = miniPronta || perguntas >= 5
  const entrevistaAtiva = !entrevistaDone && perguntas > 0
  const perfilJson = (ultimoProcesso?.perfil_json as Record<string, unknown> | null) ?? {}
  const checklistGerado = typeof perfilJson._checklist_md === "string"
  const dossieGerado = typeof perfilJson._dossie_gerado_em === "string"

  // Fase Documentos: calcula done_count/total
  const { docs, total: totalDocs } = extractDocChips(ultimoProcesso)
  const docsOk = docs.filter((d) => d.status === "ok").length

  const fases: Fase[] = [
    {
      nome: "Entrevista",
      status: entrevistaDone ? "concluida" : entrevistaAtiva ? "ativa" : "bloqueada",
      sub: entrevistaDone
        ? "concluída"
        : entrevistaAtiva
        ? `${perguntas}/5 perguntas`
        : "aguardando",
    },
    {
      nome: "Checklist",
      status: checklistGerado
        ? "concluida"
        : entrevistaDone && ultimoProcesso
        ? "ativa"
        : "bloqueada",
      sub: checklistGerado
        ? "gerado"
        : entrevistaDone && !ultimoProcesso
        ? "requer plano"
        : entrevistaDone
        ? "em curso"
        : "aguarda entrevista",
    },
    {
      nome: "Documentos",
      status: dossieGerado
        ? "concluida"
        : checklistGerado
        ? "ativa"
        : "bloqueada",
      sub: checklistGerado
        ? `${docsOk}/${totalDocs} docs`
        : "bloqueado",
    },
    {
      nome: "Dossiê",
      status: dossieGerado
        ? "concluida"
        : docsOk === totalDocs && totalDocs > 0
        ? "ativa"
        : "bloqueada",
      sub: dossieGerado ? "pronto pro banco" : "aguardando docs",
    },
  ]

  // ── Próxima ação contextual ──
  const proxima = calcularProximaAcao({
    isFree,
    perguntas,
    miniPronta,
    temProcessoPago: !!ultimoProcesso,
    checklistGerado,
    dossieGerado,
    docsOk,
    totalDocs,
    processoId: ultimoProcesso?.id ?? null,
  })

  // ── KPIs do produtor ──
  const area = formatArea(perfil?.fazenda_area_ha)
  const local =
    perfil?.municipio && perfil?.estado_uf
      ? `${perfil.municipio}, ${perfil.estado_uf}`
      : null
  const cultura = perfil?.cultura_principal ?? null
  const finalidade = perfil?.finalidade_credito ?? null
  const valor = formatValor(perfil?.valor_pretendido)

  const kpis: KPI[] = [
    {
      label: "Área da operação",
      valor: area,
      hint: local ?? undefined,
      icon: Icon.layout(14),
      accent: "green",
    },
    {
      label: "Cultura principal",
      valor: cultura,
      icon: Icon.check(14),
      accent: "green",
    },
    {
      label: "Finalidade",
      valor: finalidade,
      icon: Icon.doc(14),
      accent: "gold",
    },
    {
      label: "Valor pretendido",
      valor: valor,
      icon: Icon.bank(14),
      accent: "gold",
    },
  ]

  // v1.1 — Frente B: o "score" antes era 5º KPI; agora é widget próprio
  // EvolucaoScoreWidget renderizado separado abaixo, com sparkline e
  // delta. Aqui só mantemos os outros KPIs.

  const mostrarKPIs = kpis.some((k) => k.valor)
  const temHistorico = (historicoSimulacoes?.length ?? 0) > 0
  const jaInteragiu = perguntas > 0 || miniPronta || !!ultimoProcesso

  return (
    <div style={{ display: "grid", gap: 20 }}>
      {/* Header */}
      <header style={{ marginBottom: 4 }}>
        <Eyebrow>Plano atual · {plano}</Eyebrow>
        <h1
          style={{
            margin: "14px 0 0",
            fontSize: "clamp(28px, 3.6vw, 44px)",
            fontWeight: 500,
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
            color: "#fff",
          }}
        >
          Olá, {nomeCurto}.
        </h1>
      </header>

      {/* Próxima ação — sempre no topo */}
      <ProximaAcao
        variant={proxima.variant}
        titulo={proxima.titulo}
        descricao={proxima.descricao}
        cta={proxima.cta}
      />

      {/* Pipeline — só aparece se já houver interação */}
      {jaInteragiu && <DashboardPipeline fases={fases} />}

      {/* KPIs — só se tiver algum valor */}
      {mostrarKPIs && <ProdutorKPIs kpis={kpis} />}

      {/* v1.1 Frente B — Evolução do score (sparkline + delta).
          Renderiza só se houver pelo menos 1 simulação salva. */}
      {temHistorico && (
        <EvolucaoScoreWidget historico={historicoSimulacoes!} />
      )}

      {/* Documentos strip — só no tier pago com checklist */}
      {ultimoProcesso && checklistGerado && (
        <DocumentosStrip
          docs={docs}
          total={totalDocs}
          href={`/checklist/${ultimoProcesso.id}`}
        />
      )}

      {/* Mini-análise preview (free com gate atingido) */}
      {isFree && miniPronta && perfil?.mini_analise_texto && (
        <GlassCard glow="green" padding={28} hover={false}>
          <Eyebrow>Sua análise gratuita</Eyebrow>
          <div
            style={{
              whiteSpace: "pre-wrap",
              fontSize: 14,
              lineHeight: 1.65,
              color: "var(--ink-2)",
              marginTop: 14,
              maxHeight: 280,
              overflow: "hidden",
              position: "relative",
            }}
          >
            {perfil.mini_analise_texto}
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: 60,
                background:
                  "linear-gradient(180deg, transparent 0%, rgba(22,26,30,0.9) 100%)",
              }}
            />
          </div>
          <div style={{ marginTop: 16 }}>
            <Button variant="ghost" size="sm" href="/entrevista">
              Ver análise completa
            </Button>
          </div>
        </GlassCard>
      )}

      {/* Callout Plano Safra + MCR — Free-zero, cria urgência técnica */}
      {isFree && !jaInteragiu && (
        <GlassCard glow="gold" padding={24} hover={false}>
          <div className="mono" style={{
            fontSize: 10.5,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "var(--gold)",
            marginBottom: 8,
          }}>
            Plano Safra 2025/26 aberto
          </div>
          <div style={{ fontSize: 15, color: "var(--ink-2)", lineHeight: 1.6 }}>
            A IA é treinada no <strong style={{ color: "var(--ink)" }}>MCR</strong>{" "}
            (Manual de Crédito Rural do Bacen) — lê seu caso, aponta a linha
            provável e a faixa de taxa 2025/26. Enquadramento abre fila por
            ordem de chegada.
          </div>
        </GlassCard>
      )}

      {/* JornadaFluxograma — educativo, só Free-zero sem interação */}
      {isFree && !jaInteragiu && (
        <div style={{ marginTop: 16 }}>
          <JornadaFluxograma
            tierAtual="free"
            variant="compact"
            showPrices={false}
            linkToPlanos={false}
            heading={
              <>
                Como funciona a jornada —{" "}
                <span
                  style={{
                    color: "transparent",
                    background: "linear-gradient(90deg,#5cbd95,#c9a86a)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                  }}
                >
                  do Free ao Ouro
                </span>
              </>
            }
            sub={
              <>
                Você começa grátis com a IA. Cada plano é o próximo passo lógico:{" "}
                <strong style={{ color: "var(--ink)" }}>
                  entender → estruturar → protocolar → defender
                </strong>
                .
              </>
            }
          />
        </div>
      )}

      {/* Trust strip — só Free-zero */}
      {isFree && !jaInteragiu && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 12,
          }}
          className="dash-trust"
        >
          <TrustItem icon={Icon.lock(14)} label="Conformidade LGPD" />
          <TrustItem
            icon={Icon.check(14)}
            label="Dados criptografados (Supabase + RLS)"
          />
          <TrustItem
            icon={Icon.doc(14)}
            label="Você controla exportação e exclusão"
          />
          <style>{`
            @media (max-width: 820px){
              .dash-trust{ grid-template-columns: 1fr !important }
            }
          `}</style>
        </div>
      )}
    </div>
  )
}

function calcularProximaAcao(ctx: {
  isFree: boolean
  perguntas: number
  miniPronta: boolean
  temProcessoPago: boolean
  checklistGerado: boolean
  dossieGerado: boolean
  docsOk: number
  totalDocs: number
  processoId: string | null
}): {
  variant: "info" | "acao" | "urgente" | "success"
  titulo: string
  descricao?: string
  cta?: { label: string; href: string }
} {
  // Dossiê pronto — sucesso
  if (ctx.dossieGerado && ctx.processoId) {
    return {
      variant: "success",
      titulo: "Seu dossiê está pronto pra protocolar.",
      descricao: "Baixe o PDF e leve ao gerente.",
      cta: { label: "Baixar dossiê", href: `/checklist/${ctx.processoId}` },
    }
  }

  // Plano ativo mas docs faltando
  if (ctx.temProcessoPago && ctx.checklistGerado && ctx.processoId) {
    const faltam = ctx.totalDocs - ctx.docsOk
    if (faltam > 0) {
      return {
        variant: faltam <= 2 ? "acao" : "urgente",
        titulo: `Faltam ${faltam} documento${faltam === 1 ? "" : "s"} pro dossiê fechar.`,
        descricao:
          "A janela do Plano Safra não espera. Envie pelo checklist pra IA validar.",
        cta: {
          label: "Ver checklist",
          href: `/checklist/${ctx.processoId}`,
        },
      }
    }
  }

  // Plano ativo mas checklist ainda não gerado
  if (ctx.temProcessoPago && !ctx.checklistGerado && ctx.processoId) {
    return {
      variant: "acao",
      titulo: "Seu plano está ativo — continue a entrevista.",
      descricao:
        "A IA precisa terminar de mapear seu caso pra gerar o checklist e o dossiê.",
      cta: { label: "Continuar entrevista", href: "/entrevista" },
    }
  }

  // Free com mini-análise gerada — CTA pra comprar
  if (ctx.isFree && ctx.miniPronta) {
    return {
      variant: "acao",
      titulo: "Sua análise gratuita está pronta. Hora do dossiê.",
      descricao:
        "Escolha entre Diagnóstico Rápido (R$ 79,99), Dossiê Completo (R$ 397,00) ou Assessoria Premium 1:1 (R$ 1.497,00). Garantia incondicional de 7 dias.",
      cta: { label: "Ver planos", href: "/planos" },
    }
  }

  // Free com entrevista em andamento
  if (ctx.isFree && ctx.perguntas > 0 && ctx.perguntas < 5) {
    const restam = 5 - ctx.perguntas
    return {
      variant: "acao",
      titulo: `Falta${restam === 1 ? "" : "m"} ${restam} pergunta${restam === 1 ? "" : "s"} pra sua análise gratuita.`,
      descricao: "A IA vai mapear seu perfil e apontar a linha de crédito certa.",
      cta: { label: "Continuar entrevista", href: "/entrevista" },
    }
  }

  // Free-zero — começar
  return {
    variant: "acao",
    titulo: "Comece pela entrevista com a IA.",
    descricao:
      "Gratuita, ~10 min. Você entende seu caso em linguagem de comitê antes de falar com o banco.",
    cta: { label: "Falar com a IA agora", href: "/entrevista" },
  }
}

function TrustItem({
  icon,
  label,
}: {
  icon: React.ReactNode
  label: string
}) {
  return (
    <GlassCard glow="none" padding={14} hover={false}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ color: "var(--green)", display: "inline-flex" }}>
          {icon}
        </span>
        <span
          style={{
            fontSize: 13,
            color: "var(--ink-2)",
            lineHeight: 1.4,
          }}
        >
          {label}
        </span>
      </div>
    </GlassCard>
  )
}
