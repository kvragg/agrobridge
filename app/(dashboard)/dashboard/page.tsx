import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getPlanoAtual } from "@/lib/plano"
import Link from "next/link"
import { redirect } from "next/navigation"
import type { PerfilLead } from "@/types/perfil-lead"
import {
  Button,
  Eyebrow,
  GlassCard,
  Icon,
} from "@/components/landing/primitives"

export const dynamic = "force-dynamic"

interface ProcessoResumo {
  id: string
  perfil_json: Record<string, unknown> | null
  pagamento_confirmado: boolean
  created_at: string
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login?next=/dashboard")

  const admin = createAdminClient()

  const [{ data: perfilRaw }, plano, { data: processosRaw }] = await Promise.all([
    admin.from("perfis_lead").select("*").eq("user_id", user.id).maybeSingle(),
    getPlanoAtual(),
    admin
      .from("processos")
      .select("id, perfil_json, pagamento_confirmado, created_at")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
  ])

  const perfil = (perfilRaw ?? null) as PerfilLead | null
  const processos = (processosRaw ?? []) as ProcessoResumo[]
  const nomeCurto =
    perfil?.nome?.split(" ")[0] ??
    (user.user_metadata?.nome as string | undefined)?.split(" ")[0] ??
    "produtor"

  return (
    <div>
      <header style={{ marginBottom: 36 }}>
        <Eyebrow>Plano atual · {plano.plano}</Eyebrow>
        <h1
          style={{
            margin: "14px 0 0",
            fontSize: "clamp(32px, 4vw, 48px)",
            fontWeight: 500,
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
            color: "#fff",
          }}
        >
          Olá, {nomeCurto}.
        </h1>
      </header>

      <CardEstado plano={plano.plano} perfil={perfil} processos={processos} />
    </div>
  )
}

function CardEstado({
  plano,
  perfil,
  processos,
}: {
  plano: string
  perfil: PerfilLead | null
  processos: ProcessoResumo[]
}) {
  const isFree = plano === "Free"
  const perguntas = perfil?.perguntas_respondidas_gratis ?? 0
  const miniPronta = !!perfil?.mini_analise_texto

  // 1) Free sem interagir — dor + autoridade + urgência
  if (isFree && perguntas === 0) {
    return (
      <div style={{ display: "grid", gap: 24 }}>
        <GlassCard glow="green" padding={40} hover={false}>
          <Eyebrow>Análise gratuita · sem cartão</Eyebrow>
          <h2
            style={{
              margin: "14px 0 12px",
              fontSize: "clamp(24px, 3vw, 32px)",
              lineHeight: 1.2,
              letterSpacing: "-0.02em",
              fontWeight: 500,
              color: "#fff",
            }}
          >
            Você já levou NÃO do banco por &ldquo;faltar um papel&rdquo;?
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: 15.5,
              lineHeight: 1.65,
              color: "var(--ink-2)",
              maxWidth: 640,
            }}
          >
            90% dos pedidos de crédito rural voltam por documento fora do
            padrão MCR — matrícula desatualizada, CCIR vencido, CAR embargado,
            CND com pendência. Cada devolução é um mês a menos de safra.
          </p>

          <div
            style={{
              marginTop: 20,
              background: "rgba(201,168,106,0.08)",
              border: "1px solid rgba(201,168,106,0.25)",
              borderRadius: 12,
              padding: "16px 18px",
            }}
          >
            <div
              className="mono"
              style={{
                fontSize: 10.5,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "var(--gold)",
                marginBottom: 6,
              }}
            >
              Plano Safra 2025/26 aberto
            </div>
            <p
              style={{
                margin: 0,
                fontSize: 14,
                color: "var(--ink-2)",
                lineHeight: 1.55,
              }}
            >
              Enquadramento abre fila por ordem de chegada. Chegar pronto no
              gerente é a diferença entre assinar o contrato agora ou esperar
              o próximo ciclo.
            </p>
          </div>

          <div
            style={{
              marginTop: 24,
              display: "grid",
              gap: 12,
              fontSize: 14,
              color: "var(--ink-2)",
              lineHeight: 1.55,
            }}
          >
            <BulletCheck>
              <strong style={{ color: "var(--ink)" }}>IA treinada no MCR</strong>{" "}
              (Manual de Crédito Rural do Bacen) — lê sua situação e aponta a
              linha mais provável e a faixa de taxa 2025/26.
            </BulletCheck>
            <BulletCheck>
              <strong style={{ color: "var(--ink)" }}>Checklist 100% enquadrado no MCR</strong>
              , com links oficiais (INCRA, SICAR, Receita, Fazenda,
              Prefeitura) — sem chute.
            </BulletCheck>
            <BulletCheck>
              <strong style={{ color: "var(--ink)" }}>Defesa técnica</strong>{" "}
              construída por quem viveu aprovações e recusas por dentro do
              banco — a mesma estrutura que o comitê espera ler.
            </BulletCheck>
          </div>

          <div style={{ marginTop: 28 }}>
            <Button variant="accent" size="lg" href="/entrevista">
              Falar com a IA AgroBridge agora {Icon.arrow(15)}
            </Button>
          </div>
          <p
            style={{
              marginTop: 12,
              fontSize: 12,
              color: "var(--muted)",
              lineHeight: 1.55,
            }}
          >
            5 perguntas · resposta em menos de 2 minutos · nenhum dado
            compartilhado com banco.
          </p>
        </GlassCard>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16,
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
        </div>

        <style>{`
          @media (max-width: 820px){
            .dash-trust{ grid-template-columns: 1fr !important }
          }
        `}</style>
      </div>
    )
  }

  // 2) Free com entrevista em andamento
  if (isFree && perguntas > 0 && perguntas < 5 && !miniPronta) {
    const restam = 5 - perguntas
    const pct = Math.round((perguntas / 5) * 100)
    return (
      <GlassCard glow="gold" padding={32} hover={false}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              width: 32,
              height: 32,
              borderRadius: 9,
              background: "rgba(201,168,106,0.12)",
              border: "1px solid rgba(201,168,106,0.3)",
              color: "var(--gold)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {Icon.doc(14)}
          </span>
          <span
            className="mono"
            style={{
              fontSize: 11,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--gold)",
            }}
          >
            Entrevista em andamento
          </span>
        </div>
        <h2
          style={{
            margin: "14px 0 6px",
            fontSize: 22,
            fontWeight: 500,
            color: "#fff",
            letterSpacing: "-0.015em",
          }}
        >
          {perguntas}/5 perguntas respondidas
        </h2>
        <div
          style={{
            marginTop: 14,
            height: 6,
            background: "rgba(255,255,255,0.08)",
            borderRadius: 999,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${pct}%`,
              height: "100%",
              background: "linear-gradient(90deg,#5cbd95,#c9a86a)",
              transition: "width .5s ease",
            }}
          />
        </div>
        <p
          style={{
            margin: "16px 0 0",
            fontSize: 14.5,
            color: "var(--ink-2)",
            lineHeight: 1.55,
          }}
        >
          Falta{restam === 1 ? "" : "m"} {restam} pergunta
          {restam === 1 ? "" : "s"} pra você receber sua análise gratuita.
        </p>
        <div style={{ marginTop: 20 }}>
          <Button variant="accent" size="md" href="/entrevista">
            Continuar entrevista {Icon.arrow(14)}
          </Button>
        </div>
      </GlassCard>
    )
  }

  // 3) Free com mini-análise gerada
  if (isFree && miniPronta) {
    const previewMax = 260
    const preview = (perfil?.mini_analise_texto ?? "").slice(0, previewMax)
    const temMais = (perfil?.mini_analise_texto?.length ?? 0) > previewMax
    return (
      <GlassCard glow="green" padding={40} hover={false}>
        <Eyebrow>Sua análise gratuita está pronta</Eyebrow>
        <h2
          style={{
            margin: "14px 0 16px",
            fontSize: 26,
            fontWeight: 500,
            color: "#fff",
            letterSpacing: "-0.02em",
          }}
        >
          Chegou a hora do dossiê completo.
        </h2>
        <div
          style={{
            whiteSpace: "pre-wrap",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid var(--line-2)",
            borderRadius: 12,
            padding: "16px 18px",
            fontSize: 14,
            lineHeight: 1.65,
            color: "var(--ink-2)",
          }}
        >
          {preview}
          {temMais ? "…" : ""}
        </div>
        <div
          style={{
            marginTop: 24,
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <Button variant="accent" size="md" href="/planos">
            Quero meu dossiê completo {Icon.arrow(14)}
          </Button>
          <Button variant="ghost" size="md" href="/entrevista">
            Ver análise completa
          </Button>
        </div>
      </GlassCard>
    )
  }

  // 4) Pago mas sem processo
  const processosPagos = processos.filter((p) => p.pagamento_confirmado)
  const ultimoProcesso = processosPagos[0] ?? null

  if (!ultimoProcesso) {
    return (
      <GlassCard glow="green" padding={32} hover={false}>
        <Eyebrow>Plano {plano} ativo</Eyebrow>
        <h2
          style={{
            margin: "14px 0 8px",
            fontSize: 22,
            fontWeight: 500,
            color: "#fff",
            letterSpacing: "-0.015em",
          }}
        >
          Continue a entrevista com a IA.
        </h2>
        <p
          style={{
            margin: 0,
            fontSize: 14.5,
            color: "var(--ink-2)",
            lineHeight: 1.6,
          }}
        >
          Com o plano ativado, sua entrevista agora é ilimitada. Siga até a IA
          ter tudo que precisa pra montar seu dossiê.
        </p>
        <div style={{ marginTop: 20 }}>
          <Button variant="accent" size="md" href="/entrevista">
            Continuar entrevista {Icon.arrow(14)}
          </Button>
        </div>
      </GlassCard>
    )
  }

  const dossieGerado =
    typeof (
      ultimoProcesso.perfil_json as { _dossie_gerado_em?: string } | null
    )?._dossie_gerado_em === "string"

  if (dossieGerado) {
    return (
      <GlassCard glow="green" padding={32} hover={false}>
        <Eyebrow>Dossiê pronto</Eyebrow>
        <h2
          style={{
            margin: "14px 0 8px",
            fontSize: 22,
            fontWeight: 500,
            color: "#fff",
            letterSpacing: "-0.015em",
          }}
        >
          Seu dossiê bancário está disponível.
        </h2>
        <p
          style={{
            margin: 0,
            fontSize: 14.5,
            color: "var(--ink-2)",
            lineHeight: 1.6,
          }}
        >
          O PDF com a defesa técnica e o checklist completo foi gerado. Baixe,
          leve ao gerente e a gente acompanha o próximo passo.
        </p>
        <div style={{ marginTop: 20 }}>
          <Button
            variant="accent"
            size="md"
            href={`/checklist/${ultimoProcesso.id}`}
          >
            {Icon.doc(14)} Baixar dossiê
          </Button>
        </div>
      </GlassCard>
    )
  }

  // Pago mas dossiê ainda não gerado — checklist pendente
  return (
    <GlassCard glow="gold" padding={32} hover={false}>
      <Eyebrow>Checklist pendente</Eyebrow>
      <h2
        style={{
          margin: "14px 0 8px",
          fontSize: 22,
          fontWeight: 500,
          color: "#fff",
          letterSpacing: "-0.015em",
        }}
      >
        Envie os documentos do seu checklist.
      </h2>
      <p
        style={{
          margin: 0,
          fontSize: 14.5,
          color: "var(--ink-2)",
          lineHeight: 1.6,
        }}
      >
        Com todos os documentos enviados, a IA gera o dossiê completo com a
        defesa técnica do seu crédito.
      </p>
      <div style={{ marginTop: 20 }}>
        <Link
          href={`/checklist/${ultimoProcesso.id}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 22px",
            borderRadius: 999,
            fontSize: 14,
            fontWeight: 500,
            letterSpacing: "-0.005em",
            background: "rgba(78,168,132,0.08)",
            color: "var(--green)",
            border: "1px solid rgba(78,168,132,0.28)",
            textDecoration: "none",
          }}
        >
          Ver checklist {Icon.arrow(14)}
        </Link>
      </div>
    </GlassCard>
  )
}

function BulletCheck({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
      <span
        style={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "rgba(78,168,132,0.15)",
          color: "var(--green)",
          flexShrink: 0,
          marginTop: 2,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {Icon.check(12)}
      </span>
      <span>{children}</span>
    </div>
  )
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
