"use client"

import { useState } from "react"
import {
  GlassCard,
  Icon,
} from "@/components/landing/primitives"

interface Props {
  /** Tier do user — Ouro ganha bloco "posso te ajudar pessoalmente". */
  tier?: "free" | "Bronze" | "Prata" | "Ouro"
}

/**
 * Bloco "ALMA DO NEGÓCIO" — destaca que ANTES de juntar documento
 * (CAR, CCIR, ITR, matrícula, etc), o CADASTRO do produtor no
 * banco/cooperativa precisa estar 100% atualizado:
 *  - Renda real (não a do IR antigo)
 *  - Patrimônio em VALOR DE MERCADO (não valor histórico/IR/matrícula)
 *
 * Esse é o maior motivo de reprovação de crédito que a fundação do
 * produto vê em 14 anos no SFN. Sem cadastro correto, dossiê perfeito
 * é reprovado mesmo assim.
 *
 * Visual: dourado forte no topo do checklist, expansível, com 4
 * checagens críticas + aviso explícito.
 */
export function CadastroBancarioBlock({ tier = "free" }: Props) {
  const [aberto, setAberto] = useState(true) // Aberto por default — é prioridade
  const isOuro = tier === "Ouro"

  return (
    <GlassCard
      glow="gold"
      padding={0}
      hover={false}
      style={{
        marginBottom: 28,
        overflow: "hidden",
        borderColor: "rgba(201,168,106,0.45)",
        boxShadow:
          "0 0 0 1px rgba(201,168,106,0.18) inset, 0 18px 40px -16px rgba(201,168,106,0.25)",
      }}
    >
      {/* Header destacado */}
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        style={{
          width: "100%",
          textAlign: "left",
          padding: "20px 24px",
          background:
            "linear-gradient(180deg, rgba(201,168,106,0.10) 0%, rgba(201,168,106,0.04) 100%)",
          border: 0,
          color: "inherit",
          cursor: "pointer",
          display: "flex",
          alignItems: "flex-start",
          gap: 16,
        }}
      >
        <div
          aria-hidden
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: "rgba(201,168,106,0.16)",
            border: "1px solid rgba(201,168,106,0.40)",
            color: "var(--gold)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {Icon.bank(22)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            className="mono"
            style={{
              fontSize: 10.5,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "var(--gold)",
              fontWeight: 500,
              marginBottom: 6,
            }}
          >
            Passo zero — antes de qualquer documento
          </div>
          <h3
            style={{
              margin: 0,
              fontSize: "clamp(18px, 2.4vw, 22px)",
              fontWeight: 500,
              letterSpacing: "-0.018em",
              lineHeight: 1.25,
              color: "#fff",
            }}
          >
            Seu cadastro no banco precisa estar{" "}
            <span style={{ color: "var(--gold)" }}>100% atualizado</span>.
          </h3>
          <p
            style={{
              margin: "8px 0 0",
              fontSize: 13.5,
              color: "var(--ink-2)",
              lineHeight: 1.55,
            }}
          >
            Esse é o <strong style={{ color: "#fff" }}>maior motivo de reprovação de crédito rural hoje</strong> —
            mais que documento faltando. Cadastro desatualizado faz o banco usar
            valor errado de patrimônio (do IR ou da matrícula), e a operação
            cai antes mesmo de chegar no comitê.
          </p>
        </div>
        <span
          aria-hidden
          style={{
            color: "var(--muted)",
            transform: aberto ? "rotate(180deg)" : "none",
            transition: "transform .2s",
            flexShrink: 0,
            marginTop: 4,
          }}
        >
          {Icon.chevron(18)}
        </span>
      </button>

      {aberto && (
        <div
          style={{
            padding: "0 24px 24px",
            borderTop: "1px solid rgba(201,168,106,0.18)",
          }}
        >
          {/* 6 checagens críticas */}
          <div style={{ paddingTop: 18 }}>
            <div
              className="mono"
              style={{
                fontSize: 10.5,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "var(--gold)",
                marginBottom: 10,
              }}
            >
              6 itens que decidem a aprovação
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <ItemCadastro
                titulo="Renda real declarada (não a do IR antigo)"
                descricao="Se você produz mais hoje do que declarou no último IR, o banco trabalha com a renda menor — e isso reduz seu teto de crédito. Atualize a renda atual no formulário do banco antes de pedir, com NF de venda da safra atual, contratos de comercialização, relatórios da integradora."
              />
              <ItemCadastro
                titulo="Patrimônio COMPLETO listado (não só os imóveis)"
                destacar
                descricao={
                  <>
                    <strong style={{ color: "#fff" }}>Não esqueça nada:</strong> casas,
                    lotes, máquinas, carros, empresas (participações), fazendas,
                    investimentos (CDB, ações, fundos), semoventes (gado),
                    implementos agrícolas, recebíveis. O comitê olha o conjunto.
                    Faltou item = patrimônio menor = crédito menor.
                  </>
                }
              />
              <ItemCadastro
                titulo="Patrimônio em valor de mercado (não valor da matrícula)"
                destacar
                descricao={
                  <>
                    <strong style={{ color: "#fff" }}>Cuidado:</strong> a matrícula traz o valor
                    histórico (geralmente bem abaixo do real). O banco pode usar esse valor
                    automaticamente — e seu patrimônio aparece muito menor do que é. Resultado:
                    crédito menor ou reprovação direta. <strong style={{ color: "var(--gold)" }}>
                    Peça reavaliação do imóvel</strong> com laudo recente, ou apresente avaliação
                    de mercado de corretor habilitado (CRECI).
                  </>
                }
              />
              <ItemCadastro
                titulo="Patrimônio em valor de mercado (não valor do IR)"
                destacar
                descricao={
                  <>
                    Mesma armadilha do IR: o valor declarado lá é histórico, atualizado por
                    índice oficial — quase sempre fica MUITO abaixo do mercado. Antes de
                    qualquer pedido, faça <strong style={{ color: "#fff" }}>atualização patrimonial</strong>:
                    bens, máquinas, semoventes (gado), tudo a valor de mercado.
                  </>
                }
              />
              <ItemCadastro
                titulo="Confira o cadastro DEPOIS — gerente e analista podem errar"
                destacar
                descricao={
                  <>
                    O gerente pode esquecer item, o analista de cadastro pode usar valor
                    automático do IR/matrícula. <strong style={{ color: "#fff" }}>Quem perde
                    é você</strong>, então é sua obrigação conferir <em>depois</em> que o
                    cadastro foi feito — peça pra ver a tela do cadastro com o gerente,
                    confira renda, patrimônio item por item, e cobre correção se faltar
                    qualquer coisa. Não confie só na palavra: <strong
                    style={{ color: "var(--gold)" }}>peça pra ver a tela</strong>.
                  </>
                }
              />
              <ItemCadastro
                titulo="Reciprocidade bancária ativa (movimentação dos últimos 90 dias)"
                descricao="Conta parada ou só recebimento esporádico não conta como reciprocidade. Banco quer ver fluxo: movimentação mensal, aplicações, contratos vinculados. Quanto maior a reciprocidade, mais força no comitê."
              />
            </div>

            {/* Aviso de banco */}
            <div
              style={{
                marginTop: 18,
                padding: "14px 16px",
                background: "rgba(212,113,88,0.08)",
                border: "1px solid rgba(212,113,88,0.32)",
                borderLeft: "3px solid var(--danger)",
                borderRadius: 8,
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
              }}
            >
              <span
                aria-hidden
                style={{ color: "var(--danger)", flexShrink: 0, marginTop: 1 }}
              >
                {Icon.spark(15)}
              </span>
              <div
                style={{
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: "var(--ink-2)",
                  letterSpacing: "-0.005em",
                }}
              >
                <strong style={{ color: "var(--danger)", fontWeight: 500 }}>
                  Pergunta direta pro seu gerente antes de protocolar:
                </strong>{" "}
                <span style={{ color: "#fff" }}>
                  &ldquo;Meu cadastro está atualizado com renda real e patrimônio em
                  valor de mercado, ou está usando valor do IR e matrícula?&rdquo;
                </span>{" "}
                Se a resposta for a segunda — pare e atualize antes de juntar
                qualquer documento. Documento perfeito sobre cadastro errado = reprovação.
              </div>
            </div>

            {/* Bloco diferenciação Ouro */}
            {isOuro && (
              <div
                style={{
                  marginTop: 18,
                  padding: "16px 18px",
                  background:
                    "linear-gradient(135deg, rgba(78,168,132,0.14) 0%, rgba(201,168,106,0.10) 100%)",
                  border: "1px solid rgba(78,168,132,0.32)",
                  borderRadius: 10,
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                }}
              >
                <div
                  aria-hidden
                  style={{
                    color: "var(--green)",
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                >
                  {Icon.user(18)}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 13.5,
                      fontWeight: 500,
                      color: "#fff",
                      marginBottom: 4,
                      letterSpacing: "-0.005em",
                    }}
                  >
                    Você é Ouro — posso te ajudar pessoalmente nessa etapa.
                  </div>
                  <div
                    style={{
                      fontSize: 12.5,
                      color: "var(--ink-2)",
                      lineHeight: 1.55,
                    }}
                  >
                    Reuniões 1:1 com o fundador (14 anos SFN) cobrem
                    revisão do seu cadastro junto ao banco, redação da
                    solicitação de reavaliação patrimonial, e roteiro
                    pra conversa com o gerente. Agende em{" "}
                    <a
                      href="mailto:comercial@agrobridge.space"
                      style={{ color: "var(--green)", textDecoration: "none" }}
                    >
                      comercial@agrobridge.space
                    </a>
                    .
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </GlassCard>
  )
}

function ItemCadastro({
  titulo,
  descricao,
  destacar = false,
}: {
  titulo: string
  descricao: React.ReactNode
  destacar?: boolean
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
        padding: destacar ? "12px 14px" : "10px 0",
        background: destacar ? "rgba(201,168,106,0.06)" : "transparent",
        border: destacar ? "1px solid rgba(201,168,106,0.22)" : "0",
        borderRadius: destacar ? 8 : 0,
      }}
    >
      <span
        aria-hidden
        style={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: destacar
            ? "rgba(201,168,106,0.20)"
            : "rgba(78,168,132,0.14)",
          color: destacar ? "var(--gold)" : "var(--green)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          marginTop: 2,
        }}
      >
        {Icon.check(13)}
      </span>
      <div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: "#fff",
            letterSpacing: "-0.005em",
            marginBottom: 4,
            lineHeight: 1.4,
          }}
        >
          {titulo}
        </div>
        <div
          style={{
            fontSize: 13,
            color: "var(--ink-2)",
            lineHeight: 1.6,
            letterSpacing: "-0.003em",
          }}
        >
          {descricao}
        </div>
      </div>
    </div>
  )
}
