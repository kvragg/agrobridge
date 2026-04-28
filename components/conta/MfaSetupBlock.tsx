"use client"

import { useCallback, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button, Eyebrow, GlassCard, Icon } from "@/components/landing/primitives"
import { Alert } from "@/components/shell/Alert"

// ============================================================
// MFA TOTP Setup — fluxo completo via Supabase Auth
// ============================================================
// Fluxo:
//   1. Carrega lista de factors do user (auth.mfa.listFactors)
//   2. Se já tem TOTP verificado → mostra status verde + botão desativar
//   3. Se não → botão "Ativar 2FA" abre modal:
//      a. enroll('totp') → retorna factorId + QR SVG + secret
//      b. user escaneia QR no app autenticador (Google Auth, Authy, 1Password)
//      c. challenge(factorId) → retorna challengeId
//      d. user digita código de 6 dígitos
//      e. verify(factorId, challengeId, code) → marca factor como verified
//      f. fecha modal, atualiza status
// ============================================================

type FactorStatus = "loading" | "none" | "active" | "error"

interface Factor {
  id: string
  status: "verified" | "unverified"
  factor_type: string
  friendly_name?: string | null
}

export function MfaSetupBlock() {
  const supabase = createClient()
  const [status, setStatus] = useState<FactorStatus>("loading")
  const [factor, setFactor] = useState<Factor | null>(null)
  const [showSetup, setShowSetup] = useState(false)
  const [erroGeral, setErroGeral] = useState("")

  const carregarFactors = useCallback(async () => {
    setErroGeral("")
    const { data, error } = await supabase.auth.mfa.listFactors()
    if (error) {
      setStatus("error")
      setErroGeral("Não foi possível verificar 2FA. Tente recarregar a página.")
      return
    }
    const totp = (data?.totp ?? []) as Factor[]
    const verified = totp.find((f) => f.status === "verified") ?? null
    setFactor(verified)
    setStatus(verified ? "active" : "none")
  }, [supabase])

  useEffect(() => {
    // Fetch inicial dos fatores TOTP. setState pós-fetch é o padrão React
    // pra sincronizar estado externo (Supabase Auth) com o estado local.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void carregarFactors()
  }, [carregarFactors])

  async function desativarMfa() {
    if (!factor) return
    if (!confirm("Tem certeza que quer desativar o 2FA? Sua conta fica menos protegida.")) return
    setErroGeral("")
    const { error } = await supabase.auth.mfa.unenroll({ factorId: factor.id })
    if (error) {
      setErroGeral("Falha ao desativar 2FA. Tente novamente.")
      return
    }
    await carregarFactors()
  }

  return (
    <GlassCard padding={26} hover={false} glow="green">
      <Eyebrow color="var(--green)">Verificação em duas etapas (2FA)</Eyebrow>
      <h2
        style={{
          margin: "12px 0 8px",
          fontSize: 20,
          fontWeight: 500,
          letterSpacing: "-0.018em",
          color: "#fff",
        }}
      >
        Proteja sua conta com app autenticador
      </h2>
      <p
        style={{
          margin: "0 0 16px",
          fontSize: 14,
          color: "var(--ink-2)",
          lineHeight: 1.6,
        }}
      >
        Mesmo se alguém descobrir sua senha, sem o código do app autenticador
        não consegue entrar. Compatível com Google Authenticator, Authy,
        Microsoft Authenticator, 1Password e qualquer app TOTP padrão.
      </p>

      {erroGeral && (
        <div style={{ marginBottom: 14 }}>
          <Alert variant="error">{erroGeral}</Alert>
        </div>
      )}

      {status === "loading" && (
        <p style={{ fontSize: 13, color: "var(--muted)" }}>Verificando…</p>
      )}

      {status === "none" && (
        <Button variant="accent" size="md" onClick={() => setShowSetup(true)}>
          Ativar 2FA agora {Icon.lock(14)}
        </Button>
      )}

      {status === "active" && factor && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            padding: "12px 14px",
            borderRadius: 10,
            background: "rgba(78,168,132,0.08)",
            border: "1px solid rgba(78,168,132,0.30)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span
              style={{
                color: "var(--green)",
                display: "inline-flex",
              }}
              aria-hidden
            >
              {Icon.lock(18)}
            </span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "#fff" }}>
                2FA ativada
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>
                Sua conta está protegida.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={desativarMfa}
            style={{
              fontSize: 12,
              color: "var(--danger)",
              background: "transparent",
              border: 0,
              cursor: "pointer",
              fontFamily: "inherit",
              textDecoration: "underline",
            }}
          >
            Desativar
          </button>
        </div>
      )}

      {showSetup && (
        <SetupModal
          onClose={() => setShowSetup(false)}
          onSuccess={async () => {
            setShowSetup(false)
            await carregarFactors()
          }}
        />
      )}
    </GlassCard>
  )
}

// ─── Modal de setup ──────────────────────────────────────────

type SetupStep = "enrolling" | "qr_shown" | "verifying" | "error"

function SetupModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: () => void | Promise<void>
}) {
  const supabase = createClient()
  const [step, setStep] = useState<SetupStep>("enrolling")
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [factorId, setFactorId] = useState<string | null>(null)
  const [codigo, setCodigo] = useState("")
  const [erro, setErro] = useState("")

  const iniciarEnroll = useCallback(async () => {
    setErro("")
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "AgroBridge TOTP",
    })
    if (error || !data) {
      setStep("error")
      setErro(
        error?.message?.includes("already exists")
          ? "Você já tem um 2FA pendente. Recarregue a página e tente de novo."
          : "Não foi possível iniciar 2FA. Tente novamente.",
      )
      return
    }
    setFactorId(data.id)
    setQrCode(data.totp.qr_code)
    setSecret(data.totp.secret)
    setStep("qr_shown")
  }, [supabase])

  useEffect(() => {
    // Inicia enroll TOTP no Supabase ao abrir modal. setState pós-fetch
    // é o padrão React pra sincronizar com sistema externo (Auth).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void iniciarEnroll()
  }, [iniciarEnroll])

  async function verificarCodigo(e: React.FormEvent) {
    e.preventDefault()
    if (!factorId || codigo.length !== 6) return
    setStep("verifying")
    setErro("")

    const { data: chData, error: chErr } = await supabase.auth.mfa.challenge({
      factorId,
    })
    if (chErr || !chData) {
      setStep("qr_shown")
      setErro("Falha ao gerar challenge. Tente outro código em alguns segundos.")
      return
    }

    const { error: vErr } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: chData.id,
      code: codigo,
    })
    if (vErr) {
      setStep("qr_shown")
      setErro(
        vErr.message?.includes("invalid")
          ? "Código incorreto. Confira no app e tente de novo (códigos rotacionam a cada 30s)."
          : "Não foi possível verificar. Tente novamente.",
      )
      setCodigo("")
      return
    }

    await onSuccess()
  }

  return (
    <>
      <div
        onClick={onClose}
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.65)",
          backdropFilter: "blur(4px)",
          zIndex: 90,
        }}
      />
      <div
        role="dialog"
        aria-label="Ativar 2FA"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 95,
          width: "min(540px, 92vw)",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: 28,
          borderRadius: 18,
          background:
            "linear-gradient(180deg, rgba(22,26,30,0.98) 0%, rgba(12,15,18,0.99) 100%)",
          border: "1px solid var(--line-2)",
          boxShadow: "0 30px 60px -20px rgba(0,0,0,0.85)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
          }}
        >
          <Eyebrow>Configurar 2FA</Eyebrow>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            style={{
              background: "transparent",
              border: 0,
              color: "var(--muted)",
              cursor: "pointer",
            }}
          >
            {Icon.x(16)}
          </button>
        </div>

        <h2
          style={{
            margin: "0 0 18px",
            fontSize: 20,
            fontWeight: 500,
            letterSpacing: "-0.018em",
            color: "#fff",
          }}
        >
          Ative em 30 segundos
        </h2>

        {step === "enrolling" && (
          <p style={{ color: "var(--muted)", fontSize: 14 }}>
            Preparando QR Code…
          </p>
        )}

        {step === "error" && (
          <Alert variant="error">{erro}</Alert>
        )}

        {(step === "qr_shown" || step === "verifying") && qrCode && (
          <>
            <ol
              style={{
                margin: "0 0 18px",
                paddingLeft: 22,
                fontSize: 13.5,
                color: "var(--ink-2)",
                lineHeight: 1.7,
              }}
            >
              <li>
                Abra seu app autenticador (Google Authenticator, Authy,
                Microsoft Authenticator, 1Password ou similar)
              </li>
              <li>Escaneie o QR Code abaixo</li>
              <li>Digite o código de 6 dígitos que aparece no app</li>
            </ol>

            {/* Wrapper do QR — slot fixo 280×280 centralizado, com CSS
                local forçando o <svg> filho a respeitar o slot. Supabase
                retorna SVG cru via dangerouslySetInnerHTML; sem isso, o
                width/height/viewBox que o Supabase manda pode estourar
                o modal ou aparecer cortado em alguns browsers. */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                margin: "0 0 16px",
              }}
            >
              <div
                className="mfa-qr-slot"
                style={{
                  width: 280,
                  height: 280,
                  padding: 16,
                  background: "#fff",
                  borderRadius: 12,
                  boxSizing: "border-box",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                dangerouslySetInnerHTML={{ __html: qrCode }}
              />
            </div>
            <style>{`
              .mfa-qr-slot svg {
                width: 100% !important;
                height: 100% !important;
                display: block;
                max-width: 100%;
                max-height: 100%;
                shape-rendering: crispEdges;
              }
              .mfa-qr-slot img {
                width: 100% !important;
                height: 100% !important;
                display: block;
                image-rendering: pixelated;
              }
            `}</style>

            {/* Fallback manual — fica VISÍVEL por default (não escondido em
                <details>) porque o QR pode falhar em alguns casos
                (zoom do browser, render SVG, dark mode app). Esse path
                sempre funciona: digitar o secret direto no app. */}
            {secret && (
              <div
                style={{
                  marginBottom: 16,
                  padding: "12px 14px",
                  background: "rgba(201,168,106,0.08)",
                  border: "1px solid rgba(201,168,106,0.30)",
                  borderRadius: 10,
                }}
              >
                <p
                  className="mono"
                  style={{
                    margin: "0 0 8px",
                    fontSize: 10.5,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "var(--gold)",
                  }}
                >
                  QR não funcionou? Digite o código manualmente
                </p>
                <code
                  onClick={(e) => {
                    const range = document.createRange()
                    range.selectNode(e.currentTarget)
                    const sel = window.getSelection()
                    sel?.removeAllRanges()
                    sel?.addRange(range)
                  }}
                  style={{
                    display: "block",
                    padding: "10px 12px",
                    background: "rgba(0,0,0,0.35)",
                    border: "1px solid var(--line-2)",
                    borderRadius: 8,
                    fontFamily: "var(--font-mono, ui-monospace)",
                    fontSize: 13,
                    color: "var(--ink)",
                    wordBreak: "break-all",
                    letterSpacing: "0.05em",
                    cursor: "text",
                    userSelect: "all",
                  }}
                >
                  {secret}
                </code>
                <p
                  style={{
                    margin: "8px 0 0",
                    fontSize: 11,
                    color: "var(--muted)",
                    lineHeight: 1.5,
                  }}
                >
                  No Google Authenticator: + (adicionar) → &quot;Inserir uma
                  chave de configuração&quot; → cole o código acima → tipo
                  &quot;Baseado em tempo&quot;.
                </p>
              </div>
            )}

            <form onSubmit={verificarCodigo}>
              <label
                className="mono"
                style={{
                  display: "block",
                  fontSize: 10.5,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "var(--muted)",
                  marginBottom: 8,
                }}
              >
                Código do app autenticador
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                placeholder="000000"
                value={codigo}
                onChange={(e) =>
                  setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                autoComplete="one-time-code"
                autoFocus
                disabled={step === "verifying"}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  fontSize: 22,
                  letterSpacing: "0.5em",
                  textAlign: "center",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid var(--line-2)",
                  borderRadius: 10,
                  color: "var(--ink)",
                  fontFamily: "var(--font-mono, ui-monospace)",
                  outline: "none",
                }}
              />

              {erro && (
                <div style={{ marginTop: 12 }}>
                  <Alert variant="error">{erro}</Alert>
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  marginTop: 18,
                  justifyContent: "flex-end",
                }}
              >
                <Button
                  variant="ghost"
                  size="md"
                  onClick={onClose}
                  type="button"
                >
                  Cancelar
                </Button>
                <Button
                  variant="accent"
                  size="md"
                  type="submit"
                  disabled={codigo.length !== 6 || step === "verifying"}
                >
                  {step === "verifying" ? "Verificando…" : "Ativar 2FA"}
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </>
  )
}
