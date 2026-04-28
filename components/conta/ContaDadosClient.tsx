"use client"

import { useState } from "react"
import Link from "next/link"
import type { PlanoComercial } from "@/lib/plano"
import type { TipoDominio } from "@/lib/email/dominios-corporativos"
import { DashboardShell } from "@/components/shell/DashboardShell"
import { Alert } from "@/components/shell/Alert"
import {
  Button,
  Eyebrow,
  GlassCard,
  Icon,
} from "@/components/landing/primitives"
import { MfaSetupBlock } from "@/components/conta/MfaSetupBlock"

function tierToTopbar(
  plano: PlanoComercial,
): "free" | "Bronze" | "Prata" | "Ouro" {
  if (plano === "Bronze") return "Bronze"
  if (plano === "Prata") return "Prata"
  if (plano === "Ouro") return "Ouro"
  return "free"
}

export default function ContaDadosClient({
  nome,
  email,
  plano,
  userId,
  emailAlternativo,
  tipoEmailPrincipal,
}: {
  nome: string
  email: string
  plano: PlanoComercial
  userId?: string | null
  emailAlternativo?: string | null
  tipoEmailPrincipal?: TipoDominio
}) {
  return (
    <DashboardShell
      nome={nome}
      email={email}
      tier={tierToTopbar(plano)}
      containerStyle={{ maxWidth: 820 }}
      userId={userId}
    >
      <div style={{ marginBottom: 40 }}>
        <Eyebrow>LGPD · Art. 18</Eyebrow>
        <h1
          style={{
            margin: "14px 0 8px",
            fontSize: "clamp(32px, 4vw, 44px)",
            fontWeight: 500,
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
            color: "#fff",
          }}
        >
          Meus dados
        </h1>
        <p
          style={{
            margin: 0,
            fontSize: 15.5,
            color: "var(--ink-2)",
            lineHeight: 1.6,
          }}
        >
          Olá, {nome}. Você pode exportar tudo que está na plataforma ou
          solicitar a exclusão da sua conta a qualquer momento.
        </p>
      </div>

      <div style={{ display: "grid", gap: 20 }}>
        <MfaSetupBlock />
        <EmailAlternativoBlock
          emailPrincipal={email}
          emailAlternativoInicial={emailAlternativo ?? null}
          tipoEmailPrincipal={tipoEmailPrincipal ?? "outro"}
        />
        <ExportarBlock />
        <SimulacoesBlock />
        <ExcluirBlock email={email} />
      </div>

      <p
        style={{
          marginTop: 32,
          fontSize: 12,
          color: "var(--muted)",
          lineHeight: 1.6,
        }}
      >
        Dúvidas sobre privacidade? Leia a{" "}
        <Link
          href="/privacidade"
          style={{ color: "var(--green)", textDecoration: "underline" }}
        >
          Política de Privacidade
        </Link>{" "}
        ou fale com{" "}
        <a
          href="mailto:suporte@agrobridge.space"
          style={{ color: "var(--green)", textDecoration: "underline" }}
        >
          suporte@agrobridge.space
        </a>
        .
      </p>
    </DashboardShell>
  )
}

function ExportarBlock() {
  const [estado, setEstado] = useState<"idle" | "baixando" | "ok" | "erro">(
    "idle",
  )
  const [mensagem, setMensagem] = useState<string | null>(null)

  async function baixar() {
    setEstado("baixando")
    setMensagem(null)
    try {
      const res = await fetch("/api/conta/exportar")
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setEstado("erro")
        setMensagem(json?.erro ?? "Não foi possível gerar a exportação.")
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      const filename =
        res.headers
          .get("content-disposition")
          ?.match(/filename="([^"]+)"/)?.[1] ??
        `agrobridge-meus-dados-${new Date().toISOString().slice(0, 10)}.json`
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      setEstado("ok")
      setMensagem(
        "Arquivo baixado. Os links dos documentos expiram em 15 minutos.",
      )
    } catch {
      setEstado("erro")
      setMensagem("Falha de rede. Tente novamente.")
    }
  }

  return (
    <GlassCard glow="green" padding={28} hover={false}>
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: "rgba(78,168,132,0.12)",
            border: "1px solid rgba(78,168,132,0.25)",
            color: "var(--green)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {Icon.doc(20)}
        </div>
        <div style={{ flex: 1 }}>
          <h2
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 500,
              letterSpacing: "-0.015em",
              color: "#fff",
            }}
          >
            Exportar meus dados
          </h2>
          <p
            style={{
              margin: "8px 0 0",
              fontSize: 14,
              lineHeight: 1.6,
              color: "var(--ink-2)",
            }}
          >
            Baixe um JSON com todo seu histórico: cadastro, perfil de lead,
            entrevistas e mensagens, checklist, uploads (com links temporários)
            e compras. Limite: 1 exportação por dia.
          </p>

          {mensagem && (
            <Alert variant={estado === "ok" ? "success" : "error"}>
              {mensagem}
            </Alert>
          )}

          <div style={{ marginTop: 16 }}>
            <Button
              variant="accent"
              size="md"
              onClick={baixar}
              style={{
                opacity: estado === "baixando" ? 0.6 : 1,
                cursor: estado === "baixando" ? "not-allowed" : "pointer",
              }}
            >
              {estado === "baixando" ? (
                <>
                  {Icon.spinner(14)} Gerando JSON…
                </>
              ) : (
                <>
                  Baixar JSON {Icon.arrow(14)}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </GlassCard>
  )
}

function SimulacoesBlock() {
  const [estado, setEstado] = useState<"idle" | "limpando" | "ok" | "erro">(
    "idle",
  )
  const [mensagem, setMensagem] = useState<string | null>(null)

  async function limpar() {
    if (
      !confirm(
        "Excluir TODO o histórico de simulações? Essa ação não pode ser desfeita.",
      )
    ) {
      return
    }
    setEstado("limpando")
    setMensagem(null)
    try {
      const res = await fetch("/api/simulador/historico", { method: "DELETE" })
      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean
        removidas?: number
        erro?: string
      }
      if (res.ok) {
        setEstado("ok")
        setMensagem(
          `${json.removidas ?? 0} simulação${(json.removidas ?? 0) === 1 ? "" : "ões"} excluída${(json.removidas ?? 0) === 1 ? "" : "s"}.`,
        )
      } else {
        setEstado("erro")
        setMensagem(json.erro ?? "Falha ao excluir.")
      }
    } catch {
      setEstado("erro")
      setMensagem("Falha de rede.")
    }
  }

  return (
    <GlassCard glow="green" padding={28} hover={false}>
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: "rgba(78,168,132,0.12)",
            border: "1px solid rgba(78,168,132,0.25)",
            color: "var(--green)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {Icon.spark(20)}
        </div>
        <div style={{ flex: 1 }}>
          <h2
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 500,
              letterSpacing: "-0.015em",
              color: "#fff",
            }}
          >
            Histórico de simulações
          </h2>
          <p
            style={{
              margin: "8px 0 0",
              fontSize: 14,
              lineHeight: 1.6,
              color: "var(--ink-2)",
            }}
          >
            Limpa todas as simulações que você salvou no Simulador. Não
            afeta entrevistas, checklist ou dossiê.
          </p>

          {mensagem && (
            <Alert variant={estado === "ok" ? "success" : "error"}>
              {mensagem}
            </Alert>
          )}

          <div style={{ marginTop: 16 }}>
            <Button
              variant="ghost"
              size="md"
              onClick={limpar}
              disabled={estado === "limpando"}
            >
              {estado === "limpando"
                ? "Limpando…"
                : "Limpar histórico de simulações"}
            </Button>
          </div>
        </div>
      </div>
    </GlassCard>
  )
}

function ExcluirBlock({ email }: { email: string }) {
  const [estado, setEstado] = useState<
    "idle" | "enviando" | "enviado" | "erro"
  >("idle")
  const [mensagem, setMensagem] = useState<string | null>(null)
  const [confirmado, setConfirmado] = useState(false)

  async function solicitar() {
    setEstado("enviando")
    setMensagem(null)
    try {
      const res = await fetch("/api/conta/excluir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean
        email_enviado?: boolean
        mensagem?: string
        erro?: string
      }
      if (res.ok && json.email_enviado) {
        setEstado("enviado")
        setMensagem(
          json.mensagem ??
            "E-mail enviado. Clique no link para concluir a exclusão.",
        )
        return
      }
      setEstado("erro")
      setMensagem(
        json?.mensagem ??
          json?.erro ??
          "Não foi possível enviar o e-mail. Tente novamente.",
      )
      setConfirmado(true)
    } catch {
      setEstado("erro")
      setMensagem("Falha de rede. Tente novamente.")
    }
  }

  return (
    <GlassCard glow="gold" padding={28} hover={false}>
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: "rgba(212,113,88,0.12)",
            border: "1px solid rgba(212,113,88,0.28)",
            color: "var(--danger)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {Icon.x(20)}
        </div>
        <div style={{ flex: 1 }}>
          <h2
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 500,
              letterSpacing: "-0.015em",
              color: "#fff",
            }}
          >
            Excluir minha conta
          </h2>
          <p
            style={{
              margin: "8px 0 0",
              fontSize: 14,
              lineHeight: 1.6,
              color: "var(--ink-2)",
            }}
          >
            Perfil, entrevistas, checklist e uploads ficam invisíveis e
            inacessíveis. O acesso à plataforma é encerrado imediatamente após
            confirmação por e-mail.
          </p>

          <Alert variant="gold">
            <strong>Obrigação fiscal:</strong> registros financeiros (compras,
            notas, webhooks de pagamento) ficam arquivados por até{" "}
            <strong>5 anos</strong> para cumprir a legislação tributária
            brasileira (Lei 5.172/66 — CTN, art. 174). Esses dados saem do
            app, mas permanecem na base fiscal arquivada. Detalhes na seção 7
            da{" "}
            <Link
              href="/privacidade"
              style={{
                color: "var(--gold)",
                textDecoration: "underline",
                fontWeight: 500,
              }}
            >
              Política de Privacidade
            </Link>
            .
          </Alert>

          <p
            style={{
              margin: "14px 0 0",
              fontSize: 13,
              color: "var(--muted)",
              lineHeight: 1.55,
            }}
          >
            A confirmação é enviada para{" "}
            <strong style={{ color: "var(--ink)" }}>{email}</strong>. O link
            expira em 30 minutos.
          </p>

          <label
            style={{
              marginTop: 16,
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              padding: "12px 14px",
              background: "rgba(212,113,88,0.08)",
              border: "1px solid rgba(212,113,88,0.25)",
              borderRadius: 12,
              fontSize: 13.5,
              color: "var(--ink-2)",
              cursor: "pointer",
              lineHeight: 1.5,
            }}
          >
            <input
              type="checkbox"
              checked={confirmado}
              onChange={(e) => setConfirmado(e.target.checked)}
              style={{
                marginTop: 3,
                width: 16,
                height: 16,
                accentColor: "var(--danger)",
                flexShrink: 0,
                cursor: "pointer",
              }}
            />
            <span>
              Entendo que a exclusão é <strong>definitiva</strong> e que meus
              dados pessoais serão removidos do app.
            </span>
          </label>

          {mensagem && (
            <Alert variant={estado === "enviado" ? "success" : "error"}>
              {mensagem}
            </Alert>
          )}

          <div style={{ marginTop: 16 }}>
            <Button
              variant="ghost"
              size="md"
              onClick={solicitar}
              disabled={
                !confirmado || estado === "enviando" || estado === "enviado"
              }
              style={{
                color:
                  estado === "enviado" ? "var(--green)" : "var(--danger)",
                borderColor:
                  estado === "enviado"
                    ? "rgba(78,168,132,0.28)"
                    : "rgba(212,113,88,0.32)",
                background:
                  estado === "enviado"
                    ? "rgba(78,168,132,0.08)"
                    : "rgba(212,113,88,0.08)",
              }}
            >
              {estado === "enviando"
                ? "Enviando e-mail…"
                : estado === "enviado"
                ? "E-mail enviado"
                : estado === "erro"
                ? "Tentar novamente"
                : "Solicitar exclusão"}
            </Button>
          </div>
        </div>
      </div>
    </GlassCard>
  )
}

// ─── Email alternativo (entrega duplicada pra emails corporativos) ──
function EmailAlternativoBlock({
  emailPrincipal,
  emailAlternativoInicial,
  tipoEmailPrincipal,
}: {
  emailPrincipal: string
  emailAlternativoInicial: string | null
  tipoEmailPrincipal: TipoDominio
}) {
  const [email, setEmail] = useState(emailAlternativoInicial ?? "")
  const [salvo, setSalvo] = useState<string | null>(emailAlternativoInicial)
  const [estado, setEstado] = useState<"idle" | "salvando" | "ok" | "erro" | "removendo">(
    "idle",
  )
  const [mensagem, setMensagem] = useState<string | null>(null)

  const isCorporativo =
    tipoEmailPrincipal === "corporativo_banco" ||
    tipoEmailPrincipal === "corporativo_gov" ||
    tipoEmailPrincipal === "corporativo_agro"

  const labelDominio = {
    corporativo_banco: "banco/cooperativa",
    corporativo_gov: "instituição pública",
    corporativo_agro: "integradora/cooperativa agro",
    pessoal_alta_entrega: "pessoal",
    outro: "domínio próprio",
  }[tipoEmailPrincipal]

  async function salvar() {
    if (!email.trim()) {
      setEstado("erro")
      setMensagem("Informe um email válido.")
      return
    }
    setEstado("salvando")
    setMensagem(null)
    try {
      const res = await fetch("/api/conta/email-alternativo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setEstado("erro")
        setMensagem(data?.erro ?? "Falha ao salvar.")
        return
      }
      setSalvo(data.email_alternativo ?? email.trim())
      setEstado("ok")
      setMensagem("Email alternativo salvo. Vamos enviar cópias dos emails importantes pra ele também.")
    } catch {
      setEstado("erro")
      setMensagem("Falha de rede. Tente de novo.")
    }
  }

  async function remover() {
    setEstado("removendo")
    setMensagem(null)
    try {
      const res = await fetch("/api/conta/email-alternativo", { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setEstado("erro")
        setMensagem(data?.erro ?? "Falha ao remover.")
        return
      }
      setSalvo(null)
      setEmail("")
      setEstado("idle")
      setMensagem("Email alternativo removido.")
    } catch {
      setEstado("erro")
      setMensagem("Falha de rede. Tente de novo.")
    }
  }

  return (
    <GlassCard
      glow={isCorporativo && !salvo ? "gold" : "green"}
      padding={28}
      hover={false}
    >
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: isCorporativo && !salvo
              ? "rgba(201,168,106,0.14)"
              : "rgba(78,168,132,0.12)",
            border: isCorporativo && !salvo
              ? "1px solid rgba(201,168,106,0.30)"
              : "1px solid rgba(78,168,132,0.25)",
            color: isCorporativo && !salvo ? "var(--gold)" : "var(--green)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {Icon.mail(20)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3
            style={{
              margin: "0 0 6px",
              fontSize: 18,
              fontWeight: 500,
              letterSpacing: "-0.018em",
              color: "#fff",
            }}
          >
            Email alternativo {salvo ? "(ativo)" : "(opcional)"}
          </h3>
          <p
            style={{
              margin: "0 0 14px",
              fontSize: 13.5,
              color: "var(--ink-2)",
              lineHeight: 1.6,
            }}
          >
            {isCorporativo && !salvo ? (
              <>
                Seu email principal é <strong style={{ color: "var(--gold)" }}>{labelDominio}</strong> (@{emailPrincipal.split("@")[1]}).
                Esse tipo de domínio costuma bloquear emails externos no firewall —
                você pode <strong style={{ color: "#fff" }}>perder pagamento confirmado, dossiê pronto ou lembretes importantes</strong>.
                Cadastre um email pessoal (gmail/outlook) abaixo pra receber cópias.
              </>
            ) : isCorporativo && salvo ? (
              <>
                Vamos enviar cópias dos emails importantes (boas-vindas, pagamento confirmado,
                dossiê pronto, lembretes) tanto pro seu <strong style={{ color: "#fff" }}>{emailPrincipal}</strong> quanto
                pro alternativo <strong style={{ color: "var(--green)" }}>{salvo}</strong>.
              </>
            ) : (
              <>
                Recebe cópias dos emails importantes em um segundo endereço. Útil se você
                quer que cônjuge, contador ou sócio também acompanhe.
              </>
            )}
          </p>

          {salvo && estado !== "salvando" && estado !== "removendo" ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px",
                background: "rgba(78,168,132,0.08)",
                border: "1px solid rgba(78,168,132,0.25)",
                borderRadius: 10,
                marginBottom: 12,
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "var(--green)",
                  boxShadow: "0 0 8px var(--green)",
                  flexShrink: 0,
                }}
              />
              <span style={{ flex: 1, fontSize: 14, color: "var(--ink)", letterSpacing: "-0.005em" }}>
                {salvo}
              </span>
              <button
                type="button"
                onClick={remover}
                style={{
                  background: "transparent",
                  border: 0,
                  color: "var(--muted)",
                  cursor: "pointer",
                  fontSize: 12.5,
                  padding: 4,
                }}
              >
                Remover
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu-email-pessoal@gmail.com"
                disabled={estado === "salvando"}
                style={{
                  flex: 1,
                  minWidth: 220,
                  padding: "10px 12px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid var(--line-2)",
                  borderRadius: 8,
                  color: "var(--ink)",
                  fontSize: 14,
                  fontFamily: "inherit",
                  outline: "none",
                }}
              />
              <Button
                variant="accent"
                size="md"
                onClick={salvar}
                disabled={estado === "salvando" || !email.trim()}
              >
                {estado === "salvando" ? "Salvando…" : salvo ? "Atualizar" : "Salvar"}
              </Button>
            </div>
          )}

          {mensagem && (
            <div
              style={{
                marginTop: 10,
                fontSize: 12.5,
                color: estado === "erro" ? "var(--danger)" : "var(--green)",
                lineHeight: 1.5,
              }}
            >
              {mensagem}
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  )
}
