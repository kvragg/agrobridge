import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getPlanoAtual } from "@/lib/plano"
import Link from "next/link"
import {
  Button,
  Eyebrow,
  GlassCard,
} from "@/components/landing/primitives"
import {
  JornadaFluxograma,
  type JornadaTierKey,
} from "@/components/dashboard/JornadaFluxograma"

export const dynamic = "force-dynamic"

function planoToTier(plano: string): JornadaTierKey {
  if (plano === "Bronze") return "Bronze"
  if (plano === "Prata") return "Prata"
  if (plano === "Ouro") return "Ouro"
  return "free"
}

export default async function ComoFuncionaPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login?next=/como-funciona")

  const plano = await getPlanoAtual()

  return (
    <div style={{ display: "grid", gap: 32 }}>
      <header style={{ maxWidth: 760 }}>
        <Eyebrow>Jornada AgroBridge</Eyebrow>
        <h1
          style={{
            margin: "14px 0 10px",
            fontSize: "clamp(32px, 4vw, 48px)",
            fontWeight: 500,
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
            color: "#fff",
          }}
        >
          Como o AgroBridge funciona de ponta a ponta.
        </h1>
        <p
          style={{
            margin: 0,
            fontSize: 15.5,
            color: "var(--ink-2)",
            lineHeight: 1.6,
          }}
        >
          Quatro fases sequenciais, do cadastro gratuito ao dossiê aprovado no
          comitê. Cada plano entrega o nível seguinte — você pode parar em
          qualquer um.
        </p>
      </header>

      <JornadaFluxograma
        tierAtual={planoToTier(plano.plano)}
        variant="full"
        linkToPlanos={false}
      />

      <section style={{ marginTop: 16 }}>
        <Eyebrow>Perguntas frequentes</Eyebrow>
        <h2
          style={{
            margin: "14px 0 20px",
            fontSize: 22,
            fontWeight: 500,
            letterSpacing: "-0.015em",
            color: "#fff",
          }}
        >
          Dúvidas antes de avançar
        </h2>

        <div style={{ display: "grid", gap: 12 }}>
          <FaqItem
            pergunta="Preciso pagar pra testar a IA?"
            resposta="Não. Você tem 5 perguntas com a IA gratuitas — o suficiente pra receber uma mini-análise técnica do seu caso. Só depois você decide avançar."
          />
          <FaqItem
            pergunta="Posso pular do Free direto pra Ouro?"
            resposta="Pode. O Ouro inclui tudo do Prata e do Bronze. A sequência Free → Bronze → Prata → Ouro é a progressão natural, mas não é obrigatória."
          />
          <FaqItem
            pergunta="O pagamento garante que o banco vai aprovar?"
            resposta="Não. O pagamento cobre a entrega técnica (dossiê, defesa de crédito, mentoria). A aprovação é decisão do comitê. O AgroBridge aumenta drasticamente a chance porque entrega o pedido no padrão que o analista defende internamente."
          />
          <FaqItem
            pergunta="Tem mensalidade?"
            resposta="Não. Todos os planos são pagamento único. Você paga, recebe a entrega e mantém acesso vitalício ao que comprou."
          />
          <FaqItem
            pergunta="E se o banco pedir ajuste depois de protocolar?"
            resposta="O dossiê inclui o checklist completo e a defesa técnica. Se o banco pedir ajuste pontual, você reenvia sem cobrança adicional dentro do mesmo pedido."
          />
        </div>
      </section>

      <GlassCard glow="green" padding={32} hover={false}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 24,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ flex: 1, minWidth: 260 }}>
            <Eyebrow>Pronto pra avançar?</Eyebrow>
            <h3
              style={{
                margin: "10px 0 6px",
                fontSize: 22,
                fontWeight: 500,
                letterSpacing: "-0.015em",
                color: "#fff",
              }}
            >
              Veja os 3 planos e escolha o seu nível.
            </h3>
            <p
              style={{
                margin: 0,
                fontSize: 14,
                color: "var(--ink-2)",
                lineHeight: 1.55,
              }}
            >
              Pagamento único · sem fidelidade · acesso imediato.
            </p>
          </div>
          <Button variant="accent" size="lg" href="/planos">
            Ver planos e preços{" "}
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path
                d="M3 8h10m-4-4 4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Button>
        </div>
      </GlassCard>

      <p
        style={{
          margin: 0,
          textAlign: "center",
          fontSize: 12,
          color: "var(--muted)",
        }}
      >
        Ainda com dúvida?{" "}
        <Link
          href="/entrevista"
          style={{ color: "var(--green)", textDecoration: "underline" }}
        >
          Fale com a IA
        </Link>{" "}
        ou acesse <Link href="/conta/dados" style={{ color: "var(--green)", textDecoration: "underline" }}>seus dados</Link>.
      </p>
    </div>
  )
}

function FaqItem({
  pergunta,
  resposta,
}: {
  pergunta: string
  resposta: string
}) {
  return (
    <GlassCard glow="none" padding={22} hover={false}>
      <div
        style={{
          fontSize: 15.5,
          fontWeight: 500,
          color: "#fff",
          letterSpacing: "-0.01em",
          lineHeight: 1.35,
        }}
      >
        {pergunta}
      </div>
      <p
        style={{
          margin: "10px 0 0",
          fontSize: 14,
          color: "var(--ink-2)",
          lineHeight: 1.6,
        }}
      >
        {resposta}
      </p>
    </GlassCard>
  )
}
