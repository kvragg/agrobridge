"use client"

// Carrossel educativo "Como o mercado de crédito rural está olhando
// operações em 2026". É a primeira coisa que o lead vê na aba de
// entrevista — antes de a IA pedir qualquer coisa, o produtor sai do
// vácuo informacional.
//
// Premissa: produtor não sabe o que comitê de crédito pesa em 2026.
// Saber isso ANTES da entrevista melhora a conversa (ele dá os dados
// certos) e o resultado (escolhe garantia certa, alinha cadastro).
//
// Conteúdo é estrutural — vem da nossa base de mercado (ver memória
// de projeto). Nunca cita marca de banco/cooperativa.
//
// Dismissível: depois que o lead lê, salva flag em localStorage e o
// carrossel some. Pode reabrir via botão "ver de novo".

import { useEffect, useState } from "react"
import { Eyebrow, Icon } from "@/components/landing/primitives"

const STORAGE_KEY = "ab.entrevista.carrossel.mercado.v1"

interface Slide {
  numero: string
  kicker: string
  titulo: string
  subtitulo?: string
  conteudo: React.ReactNode
}

const SLIDES: Slide[] = [
  {
    numero: "01",
    kicker: "Cenário 2026",
    titulo: "Por que a régua mudou",
    subtitulo: "Selic alta, margem apertada, onda de recuperações judiciais.",
    conteudo: (
      <>
        <p>
          Comitês de crédito mudaram o que aceitam em 2026. Selic em
          patamar elevado, margem de aprovação apertada e aumento expressivo
          de recuperações judiciais deixaram a régua mais conservadora.
        </p>
        <p>
          O que passava com naturalidade em 2022/2023 hoje pede defesa
          técnica. O caminho não fechou — ficou mais estreito. Dossiê bem
          montado é o que separa lead aprovado do que entra na fila do
          "vamos analisar mais".
        </p>
        <p>
          Os próximos 3 cards mostram exatamente <b>onde</b> o comitê está
          olhando primeiro. Conhecer isso antes de protocolar é o que vira
          o jogo.
        </p>
      </>
    ),
  },
  {
    numero: "02",
    kicker: "Hierarquia de garantias",
    titulo: "As 3 que o mercado prefere hoje",
    subtitulo: "Liquidez + execução rápida = comitê tranquilo.",
    conteudo: (
      <>
        <p style={{ marginBottom: 14 }}>
          Toda garantia tem um <b>peso</b> implícito que o comitê dá. Em
          2026 três tipos saíram disparados na frente das demais:
        </p>
        <PreferidaItem
          ordem="1"
          nome="Alienação fiduciária guarda-chuva"
          descricao="Cobre vários imóveis (urbanos + rurais) sob uma única estrutura. O banco fica com a propriedade resolutiva — em caso de inadimplência, retoma sem leilão judicial."
          score="10/10"
        />
        <PreferidaItem
          ordem="2"
          nome="Alienação fiduciária simples"
          descricao="Mesma lógica de execução rápida, sobre 1 imóvel (rural ou urbano). Procedimento extrajudicial torna a recuperação previsível pro banco."
          score="10/10"
        />
        <PreferidaItem
          ordem="3"
          nome="Investimento dado em garantia"
          descricao="CDB, LCA ou poupança do próprio banco vinculados como colateral. É praticamente caixa — o comitê adora porque elimina risco de execução."
          score="10/10"
        />
        <div
          style={{
            marginTop: 18,
            padding: "12px 14px",
            background: "rgba(176,138,62,0.08)",
            border: "1px solid rgba(176,138,62,0.25)",
            borderRadius: 10,
            fontSize: 12.5,
            color: "var(--ink-2)",
            lineHeight: 1.55,
          }}
        >
          <b style={{ color: "var(--gold)" }}>E o resto?</b> Hipoteca 1º
          grau ainda passa (7/10), CPR-F registrada (6/10), penhor da
          safra com seguro (5/10). Aval puro sem respaldo está em 0/10
          — o comitê barra logo na entrada. Não impossível, só muito
          mais difícil. Caminho: defesa técnica reforçada + cadastro
          impecável.
        </div>
      </>
    ),
  },
  {
    numero: "03",
    kicker: "Alavancagem patrimonial",
    titulo: "Quanto do seu patrimônio o banco aceita comprometido",
    subtitulo: "A pergunta que pega muito produtor de surpresa.",
    conteudo: (
      <>
        <p>
          O comitê não olha só renda — olha <b>quanto do seu patrimônio
          real</b> já está comprometido em crédito no mercado. Em 2026, com
          a onda de RJs no agro, virou critério decisivo de entrada.
        </p>
        <p style={{ marginBottom: 14 }}>
          A régua que vejo na prática:
        </p>
        <FaixaPatrimonio
          intervalo="Até 50%"
          status="ok"
          texto="Comitê vê com bons olhos. Folga patrimonial confortável — entra na rota normal de análise."
        />
        <FaixaPatrimonio
          intervalo="51% a 70%"
          status="warn"
          texto="Atende com ressalvas. Comitê vai pedir defesa do fluxo de caixa e estresse na garantia. Operação ainda passa, mas exige preparação."
        />
        <FaixaPatrimonio
          intervalo="71% a 85%"
          status="alert"
          texto="Zona de alerta. Cenário econômico + onda de RJ deixa o comitê desconfiado. Precisa de defesa robusta — caminho estreito."
        />
        <FaixaPatrimonio
          intervalo="Acima de 85%"
          status="critical"
          texto="Alavancagem crítica. Operação muito improvável sem reestruturação prévia da dívida atual."
        />
        <p style={{ marginTop: 16, fontSize: 12.5, color: "var(--muted)", lineHeight: 1.6 }}>
          <b style={{ color: "var(--ink-2)" }}>Por que isso importa pra você:</b>{" "}
          se você está nas duas faixas de cima, foque em garantia
          forte e cadastro. Se está nas duas de baixo, vamos pensar em
          rolagem ou redução do pleito antes de protocolar.
        </p>
      </>
    ),
  },
  {
    numero: "04",
    kicker: "O gargalo silencioso",
    titulo: "Cadastro bancário é a alma do negócio",
    subtitulo: "Maior motivo de reprovação em 2026 — e quase ninguém fala.",
    conteudo: (
      <>
        <p>
          O comitê reprova <b>antes mesmo</b> de chegar nos papéis quando
          olha o cadastro do produtor no banco e vê:
        </p>
        <ul style={{ margin: "12px 0", paddingLeft: 0, listStyle: "none" }}>
          <ListaItem>
            <b>Renda declarada que não bate com a produção atual.</b>{" "}
            Banco trabalha com renda menor → teto da operação cai.
          </ListaItem>
          <ListaItem>
            <b>Patrimônio em valor histórico</b> (do IR ou da matrícula)
            em vez de valor de mercado. Banco subavalia → operação cai.
          </ListaItem>
          <ListaItem>
            <b>Conta parada nos últimos 90 dias.</b> Sem reciprocidade,
            comitê pesa risco mais alto.
          </ListaItem>
        </ul>
        <p style={{ marginTop: 14 }}>
          Antes de protocolar qualquer crédito, pergunta direta pro seu
          gerente:
        </p>
        <div
          style={{
            marginTop: 12,
            padding: "14px 16px",
            background: "rgba(78,168,132,0.08)",
            border: "1px solid rgba(78,168,132,0.28)",
            borderRadius: 10,
            fontSize: 13.5,
            fontStyle: "italic",
            color: "var(--ink)",
            lineHeight: 1.55,
          }}
        >
          "Meu cadastro está com renda real e patrimônio em valor de
          mercado, ou ainda usa valor do IR e da matrícula?"
        </div>
        <p style={{ marginTop: 14, fontSize: 12.5, color: "var(--muted)", lineHeight: 1.6 }}>
          Se for a segunda — atualize <b style={{ color: "var(--ink-2)" }}>antes</b>{" "}
          de a operação ser submetida. Documento certo + cadastro errado
          = reprovação. Por isso esse é o item Nº 1 da nossa consultoria
          em qualquer plano.
        </p>
      </>
    ),
  },
]

export function CarrosselMercado() {
  const [montado, setMontado] = useState(false)
  const [aberto, setAberto] = useState(true)
  const [indice, setIndice] = useState(0)

  useEffect(() => {
    setMontado(true)
    if (typeof window === "undefined") return
    const dismissed = window.localStorage.getItem(STORAGE_KEY) === "1"
    if (dismissed) setAberto(false)
  }, [])

  const reabrir = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY)
    }
    setIndice(0)
    setAberto(true)
  }

  const fechar = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, "1")
    }
    setAberto(false)
  }

  // Evita flash do conteúdo antes de checar localStorage
  if (!montado) return null

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={reabrir}
        className="mono"
        style={{
          alignSelf: "flex-start",
          padding: "8px 14px",
          fontSize: 11,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          background: "rgba(176,138,62,0.08)",
          border: "1px solid rgba(176,138,62,0.28)",
          borderRadius: 999,
          color: "var(--gold)",
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        Ver briefing do mercado 2026 ↑
      </button>
    )
  }

  const slide = SLIDES[indice]
  const total = SLIDES.length
  const ehUltimo = indice === total - 1

  return (
    <div
      style={{
        position: "relative",
        padding: "22px 24px 18px",
        borderRadius: 16,
        background:
          "linear-gradient(180deg, rgba(10,22,40,0.55) 0%, rgba(10,22,40,0.35) 100%)",
        border: "1px solid rgba(176,138,62,0.32)",
        boxShadow:
          "0 18px 60px -28px rgba(176,138,62,0.18), 0 0 0 1px rgba(255,255,255,0.02) inset",
        overflow: "hidden",
      }}
    >
      {/* Linha decorativa no topo */}
      <div
        style={{
          position: "absolute",
          inset: "0 0 auto 0",
          height: 2,
          background:
            "linear-gradient(90deg, transparent, rgba(176,138,62,0.55), transparent)",
        }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <span
            className="mono"
            style={{
              fontSize: 11,
              letterSpacing: "0.16em",
              color: "var(--gold)",
              fontWeight: 500,
            }}
          >
            {slide.numero}
          </span>
          <Eyebrow color="var(--gold)" dot="var(--gold)">
            {slide.kicker}
          </Eyebrow>
        </div>
        <button
          type="button"
          onClick={fechar}
          aria-label="Fechar briefing"
          style={{
            background: "transparent",
            border: 0,
            color: "var(--muted)",
            cursor: "pointer",
            padding: 4,
            display: "flex",
            alignItems: "center",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--ink-2)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
        >
          {Icon.x(14)}
        </button>
      </div>

      <h2
        style={{
          margin: "10px 0 4px",
          fontSize: 22,
          fontWeight: 500,
          letterSpacing: "-0.02em",
          color: "var(--ink)",
          lineHeight: 1.2,
        }}
      >
        {slide.titulo}
      </h2>
      {slide.subtitulo && (
        <p
          style={{
            margin: "0 0 16px",
            fontSize: 13.5,
            color: "var(--muted)",
            fontStyle: "italic",
            lineHeight: 1.55,
          }}
        >
          {slide.subtitulo}
        </p>
      )}

      <div
        style={{
          fontSize: 13.5,
          color: "var(--ink-2)",
          lineHeight: 1.65,
        }}
      >
        {slide.conteudo}
      </div>

      {/* Navegação */}
      <div
        style={{
          marginTop: 20,
          paddingTop: 16,
          borderTop: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", gap: 6 }}>
          {SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndice(i)}
              aria-label={`Ir para card ${i + 1}`}
              aria-current={i === indice}
              style={{
                width: i === indice ? 26 : 8,
                height: 8,
                borderRadius: 4,
                background:
                  i === indice
                    ? "var(--gold)"
                    : i < indice
                      ? "rgba(176,138,62,0.45)"
                      : "rgba(255,255,255,0.12)",
                border: 0,
                cursor: "pointer",
                transition: "all .2s",
                padding: 0,
              }}
            />
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={() => setIndice((i) => Math.max(0, i - 1))}
            disabled={indice === 0}
            className="mono"
            style={{
              padding: "7px 12px",
              fontSize: 11,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              background: "transparent",
              border: "1px solid var(--line-2)",
              borderRadius: 999,
              color: indice === 0 ? "var(--muted)" : "var(--ink-2)",
              cursor: indice === 0 ? "not-allowed" : "pointer",
              opacity: indice === 0 ? 0.4 : 1,
              fontFamily: "inherit",
            }}
          >
            ← Anterior
          </button>
          {ehUltimo ? (
            <button
              type="button"
              onClick={fechar}
              className="mono"
              style={{
                padding: "7px 14px",
                fontSize: 11,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                background: "linear-gradient(180deg, var(--gold), #8a6e2e)",
                border: 0,
                borderRadius: 999,
                color: "#0a1628",
                cursor: "pointer",
                fontWeight: 500,
                fontFamily: "inherit",
                boxShadow: "0 8px 24px -10px rgba(176,138,62,0.5)",
              }}
            >
              Pronto, vamos começar →
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIndice((i) => Math.min(total - 1, i + 1))}
              className="mono"
              style={{
                padding: "7px 14px",
                fontSize: 11,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                background: "rgba(176,138,62,0.18)",
                border: "1px solid rgba(176,138,62,0.4)",
                borderRadius: 999,
                color: "var(--gold)",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Próximo →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Sub-componentes ───────────────────────────────────────────────

function PreferidaItem({
  ordem,
  nome,
  descricao,
  score,
}: {
  ordem: string
  nome: string
  descricao: string
  score: string
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 14,
        padding: "12px 0",
        borderTop: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div
        className="mono"
        style={{
          width: 28,
          flexShrink: 0,
          paddingTop: 4,
          fontSize: 11,
          color: "var(--gold)",
          letterSpacing: "0.1em",
        }}
      >
        {ordem}
      </div>
      <div style={{ flex: 1 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            gap: 12,
            marginBottom: 4,
          }}
        >
          <strong
            style={{
              fontSize: 14,
              color: "var(--ink)",
              fontWeight: 500,
              letterSpacing: "-0.005em",
            }}
          >
            {nome}
          </strong>
          <span
            className="mono"
            style={{
              fontSize: 10.5,
              letterSpacing: "0.14em",
              color: "var(--green)",
              padding: "3px 8px",
              background: "rgba(78,168,132,0.12)",
              border: "1px solid rgba(78,168,132,0.3)",
              borderRadius: 999,
              flexShrink: 0,
            }}
          >
            {score}
          </span>
        </div>
        <p
          style={{
            margin: 0,
            fontSize: 12.5,
            color: "var(--muted)",
            lineHeight: 1.55,
          }}
        >
          {descricao}
        </p>
      </div>
    </div>
  )
}

function FaixaPatrimonio({
  intervalo,
  status,
  texto,
}: {
  intervalo: string
  status: "ok" | "warn" | "alert" | "critical"
  texto: string
}) {
  const cor = {
    ok: "var(--green)",
    warn: "var(--gold)",
    alert: "#d97a4f",
    critical: "var(--danger)",
  }[status]
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "92px 1fr",
        gap: 14,
        padding: "10px 0",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        alignItems: "baseline",
      }}
    >
      <div
        className="mono"
        style={{
          fontSize: 11.5,
          letterSpacing: "0.06em",
          color: cor,
          fontWeight: 500,
        }}
      >
        {intervalo}
      </div>
      <div
        style={{
          fontSize: 13,
          color: "var(--ink-2)",
          lineHeight: 1.55,
        }}
      >
        {texto}
      </div>
    </div>
  )
}

function ListaItem({ children }: { children: React.ReactNode }) {
  return (
    <li
      style={{
        position: "relative",
        paddingLeft: 18,
        marginBottom: 10,
        fontSize: 13.5,
        color: "var(--ink-2)",
        lineHeight: 1.6,
      }}
    >
      <span
        aria-hidden
        style={{
          position: "absolute",
          left: 0,
          top: 9,
          width: 8,
          height: 1,
          background: "var(--gold)",
        }}
      />
      {children}
    </li>
  )
}
