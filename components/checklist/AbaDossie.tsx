"use client"

import { Button, GlassCard, Icon } from "@/components/landing/primitives"

interface Props {
  isFree: boolean
  fezEntrevista: boolean
  /** Tem processo pago? Se sim, dossiê pode ser gerado quando docs estiverem prontos. */
  temProcessoPago: boolean
  /** ID do processo, se houver — usado pra link "ver dossiê". */
  processoId: string | null
  /** Documentos obrigatórios marcados / total — define se IA pode gerar agora. */
  obrigPronto: number
  obrigTotal: number
}

/**
 * Aba 3 — Dossiê.
 *
 * Estado único, derivado do contexto. Sem checklist aqui — só uma promessa
 * a cumprir, com o caminho mais curto pra cumprir agora.
 */
export function AbaDossie({
  isFree,
  fezEntrevista,
  temProcessoPago,
  processoId,
  obrigPronto,
  obrigTotal,
}: Props) {
  const tudoPronto = obrigTotal > 0 && obrigPronto === obrigTotal

  // ─── Roteamento de estado ───────────────────────────────────────────
  if (!fezEntrevista) {
    return (
      <Estado
        glow="gold"
        eyebrow="Etapa 1 — Entrevista"
        titulo="Antes do dossiê, conta seu caso pra IA"
        descricao="A entrevista (10 min, gratuita) gera uma mini-análise e a base do seu dossiê. Sem ela, a IA não tem o que defender no comitê."
        cta={{ label: "Iniciar entrevista", href: "/entrevista/nova", variant: "accent" }}
      />
    )
  }

  if (isFree) {
    return (
      <Estado
        glow="gold"
        eyebrow="Próximo passo"
        titulo="Sua mini-análise está no chat — pra dossiê completo, escolha um plano"
        descricao="O Bronze entrega a viabilidade rápida. Prata entrega o PDF de defesa pronto pro banco. Ouro adiciona acompanhamento 1:1 do fundador. Garantia de 7 dias em todos."
        cta={{ label: "Ver planos", href: "/planos", variant: "accent" }}
        secundario={{ label: "Voltar pro chat", href: "/entrevista" }}
      />
    )
  }

  // Pago, sem processo confirmado ainda (deveria ser raro — webhook cria
  // o processo, mas se chegou aqui sem processo, oriente)
  if (!temProcessoPago) {
    return (
      <Estado
        glow="gold"
        eyebrow="Pagamento confirmado"
        titulo="Estamos preparando seu dossiê"
        descricao="O processo está sendo criado — pode levar até 1 minuto após o pagamento. Atualiza a página se não aparecer logo. Se passou de 10 min, fala com o suporte."
        cta={{ label: "Atualizar página", onReload: true, variant: "ghost" }}
      />
    )
  }

  // Pago + processo: mostra progresso e roteia pra checklist personalizado
  if (!tudoPronto) {
    const faltam = obrigTotal - obrigPronto
    return (
      <Estado
        glow="gold"
        eyebrow={`Faltam ${faltam} documento${faltam === 1 ? "" : "s"}`}
        titulo={
          obrigPronto === 0
            ? "Comece marcando os documentos que você já tem"
            : `Você está em ${Math.round((obrigPronto / obrigTotal) * 100)}% — falta pouco`
        }
        descricao="Quando todos os documentos obrigatórios estiverem marcados como prontos, a IA gera seu dossiê com a defesa de crédito em linguagem de comitê. Sem dossiê pronto, sua proposta é só mais uma na fila do gerente."
        cta={
          processoId
            ? {
                label: "Abrir checklist personalizado",
                href: `/checklist/${processoId}`,
                variant: "accent",
              }
            : { label: "Voltar pro Cadastro", aba: "cadastro", variant: "accent" }
        }
        progresso={{ pronto: obrigPronto, total: obrigTotal }}
      />
    )
  }

  // Tudo pronto — dossiê pronto pra gerar/baixar
  return (
    <Estado
      glow="green"
      eyebrow="✓ Tudo pronto"
      titulo="Sua análise está pronta — baixe e leve ao banco"
      descricao="A IA da AgroBridge analisou seu cenário e gerou o PDF de defesa em formato de comitê: argumentação sobre garantia, capacidade de pagamento, viabilidade da safra e mitigação de risco. Pronto pra protocolar."
      cta={
        processoId
          ? {
              label: "Baixar dossiê em PDF",
              href: `/checklist/${processoId}`,
              variant: "accent",
            }
          : { label: "Ir pro dashboard", href: "/dashboard", variant: "accent" }
      }
    />
  )
}

// ─── Componente único de estado ───────────────────────────────────────

type CTAAccion =
  | { label: string; href: string; variant?: "accent" | "ghost" }
  | { label: string; onReload: true; variant?: "accent" | "ghost" }
  | { label: string; aba: "cadastro" | "credito"; variant?: "accent" | "ghost" }

function Estado({
  glow,
  eyebrow,
  titulo,
  descricao,
  cta,
  secundario,
  progresso,
}: {
  glow: "gold" | "green"
  eyebrow: string
  titulo: string
  descricao: string
  cta: CTAAccion
  secundario?: { label: string; href: string }
  progresso?: { pronto: number; total: number }
}) {
  return (
    <GlassCard glow={glow} padding={28} hover={false}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 720 }}>
        <div
          className="mono"
          style={{
            fontSize: 11,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: glow === "green" ? "var(--green)" : "var(--gold)",
          }}
        >
          {eyebrow}
        </div>
        <h2
          style={{
            margin: 0,
            fontSize: "clamp(20px, 2.6vw, 28px)",
            fontWeight: 500,
            color: "var(--ink)",
            letterSpacing: "-0.02em",
            lineHeight: 1.2,
          }}
        >
          {titulo}
        </h2>
        <p
          style={{
            margin: 0,
            fontSize: 14.5,
            color: "var(--ink-2)",
            lineHeight: 1.6,
          }}
        >
          {descricao}
        </p>

        {progresso && (
          <div style={{ marginTop: 4 }}>
            <div
              role="progressbar"
              aria-valuenow={Math.round((progresso.pronto / progresso.total) * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Progresso dos documentos obrigatórios"
              style={{
                height: 10,
                borderRadius: 999,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid var(--line)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${Math.round((progresso.pronto / progresso.total) * 100)}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, #c9a86a 0%, #5cbd95 100%)",
                  transition: "width .6s cubic-bezier(.2,.7,.2,1)",
                }}
              />
            </div>
            <div
              style={{
                marginTop: 6,
                fontSize: 12,
                color: "var(--muted)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {progresso.pronto} de {progresso.total} obrigatórios marcados
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginTop: 6 }}>
          <CTABotao acao={cta} />
          {secundario && (
            <Button variant="ghost" size="md" href={secundario.href}>
              {secundario.label}
            </Button>
          )}
        </div>
      </div>
    </GlassCard>
  )
}

function CTABotao({ acao }: { acao: CTAAccion }) {
  const variant = acao.variant ?? "accent"
  if ("onReload" in acao) {
    return (
      <Button variant={variant} size="md" onClick={() => location.reload()}>
        {acao.label} {Icon.arrow(13)}
      </Button>
    )
  }
  if ("aba" in acao) {
    return (
      <Button
        variant={variant}
        size="md"
        onClick={() => {
          // Comunica via custom event — orquestrador ouve e troca aba.
          window.dispatchEvent(
            new CustomEvent("agro:trocar-aba", { detail: { aba: acao.aba } }),
          )
        }}
      >
        {acao.label} {Icon.arrow(13)}
      </Button>
    )
  }
  return (
    <Button variant={variant} size="md" href={acao.href}>
      {acao.label} {Icon.arrow(13)}
    </Button>
  )
}
