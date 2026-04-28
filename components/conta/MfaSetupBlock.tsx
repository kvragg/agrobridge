"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import QRCode from "qrcode"
import { createClient } from "@/lib/supabase/client"
import { Button, Eyebrow, GlassCard, Icon } from "@/components/landing/primitives"
import { Alert } from "@/components/shell/Alert"

// ============================================================
// MFA TOTP Setup — render inline (página /conta/seguranca)
// ============================================================
// Estados:
//   listing  — verificando se já tem 2FA ativo
//   active   — 2FA já ativada, mostra status + botão desativar
//   none     — sem 2FA, mostra botão "Ativar"
//   enrolling — chamou enroll(), aguardando resposta
//   qr_shown — QR visível, user escaneia + digita código
//   verifying — verificando código submetido
// ============================================================

type Phase =
  | "listing"
  | "active"
  | "none"
  | "enrolling"
  | "qr_shown"
  | "verifying"

interface Factor {
  id: string
  status: "verified" | "unverified"
  factor_type: string
  friendly_name?: string | null
}

export function MfaSetupBlock() {
  const supabase = createClient()
  const [phase, setPhase] = useState<Phase>("listing")
  const [factor, setFactor] = useState<Factor | null>(null)
  const [pendingFactorId, setPendingFactorId] = useState<string | null>(null)
  const [otpUri, setOtpUri] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [codigo, setCodigo] = useState("")
  const [erro, setErro] = useState("")
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const carregarFactors = useCallback(async () => {
    setErro("")
    const { data, error } = await supabase.auth.mfa.listFactors()
    if (error) {
      setErro("Não foi possível verificar 2FA. Tente recarregar a página.")
      setPhase("none")
      return
    }
    const totp = (data?.totp ?? []) as Factor[]
    const verified = totp.find((f) => f.status === "verified") ?? null
    setFactor(verified)
    setPhase(verified ? "active" : "none")
  }, [supabase])

  useEffect(() => {
    // Fetch inicial dos fatores TOTP. Padrão React de sync com sistema externo.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void carregarFactors()
  }, [carregarFactors])

  // Renderiza QR no canvas quando otpUri estiver pronto
  useEffect(() => {
    if (!otpUri || !canvasRef.current) return
    QRCode.toCanvas(canvasRef.current, otpUri, {
      width: 256,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#000000", light: "#ffffff" },
    }).catch(() => {
      // Falha silenciosa — usuário pode usar secret manual abaixo.
    })
  }, [otpUri])

  async function ativar() {
    setErro("")
    setPhase("enrolling")
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "AgroBridge TOTP",
    })
    if (error || !data) {
      setPhase("none")
      setErro(
        error?.message?.includes("already exists")
          ? "Você já tem um 2FA pendente. Recarregue a página e tente de novo."
          : "Não foi possível iniciar 2FA. Tente novamente.",
      )
      return
    }
    setPendingFactorId(data.id)
    setOtpUri(data.totp.uri)
    setSecret(data.totp.secret)
    setCodigo("")
    setPhase("qr_shown")
  }

  async function cancelarSetup() {
    if (pendingFactorId) {
      // Remove o factor pendente pra não acumular.
      await supabase.auth.mfa.unenroll({ factorId: pendingFactorId }).catch(() => {})
    }
    setPendingFactorId(null)
    setOtpUri(null)
    setSecret(null)
    setCodigo("")
    setErro("")
    void carregarFactors()
  }

  async function verificarCodigo(e: React.FormEvent) {
    e.preventDefault()
    if (!pendingFactorId || codigo.length !== 6) return
    setPhase("verifying")
    setErro("")

    const { data: chData, error: chErr } = await supabase.auth.mfa.challenge({
      factorId: pendingFactorId,
    })
    if (chErr || !chData) {
      setPhase("qr_shown")
      setErro("Falha ao gerar challenge. Tente outro código em alguns segundos.")
      return
    }

    const { error: vErr } = await supabase.auth.mfa.verify({
      factorId: pendingFactorId,
      challengeId: chData.id,
      code: codigo,
    })
    if (vErr) {
      setPhase("qr_shown")
      setErro(
        vErr.message?.includes("invalid")
          ? "Código incorreto. Confira no app e tente de novo (códigos rotacionam a cada 30s)."
          : "Não foi possível verificar. Tente novamente.",
      )
      setCodigo("")
      return
    }

    // Sucesso — limpa estados e recarrega
    setPendingFactorId(null)
    setOtpUri(null)
    setSecret(null)
    setCodigo("")
    await carregarFactors()
  }

  async function desativarMfa() {
    if (!factor) return
    if (!confirm("Tem certeza que quer desativar o 2FA? Sua conta fica menos protegida.")) return
    setErro("")
    const { error } = await supabase.auth.mfa.unenroll({ factorId: factor.id })
    if (error) {
      setErro("Falha ao desativar 2FA. Tente novamente.")
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
          fontSize: 22,
          fontWeight: 500,
          letterSpacing: "-0.018em",
          color: "#fff",
        }}
      >
        Proteja sua conta com app autenticador
      </h2>
      <p
        style={{
          margin: "0 0 18px",
          fontSize: 14,
          color: "var(--ink-2)",
          lineHeight: 1.6,
        }}
      >
        Compatível com Google Authenticator, Authy, Microsoft Authenticator,
        1Password, Bitwarden e qualquer app TOTP padrão.
      </p>

      {erro && (
        <div style={{ marginBottom: 14 }}>
          <Alert variant="error">{erro}</Alert>
        </div>
      )}

      {phase === "listing" && (
        <p style={{ fontSize: 13, color: "var(--muted)" }}>Verificando…</p>
      )}

      {phase === "none" && (
        <Button variant="accent" size="md" onClick={ativar}>
          Ativar 2FA agora {Icon.lock(14)}
        </Button>
      )}

      {phase === "enrolling" && (
        <p style={{ fontSize: 13, color: "var(--muted)" }}>
          Preparando QR Code…
        </p>
      )}

      {(phase === "qr_shown" || phase === "verifying") && (
        <SetupInline
          canvasRef={canvasRef}
          secret={secret}
          codigo={codigo}
          setCodigo={setCodigo}
          verificando={phase === "verifying"}
          onSubmit={verificarCodigo}
          onCancel={cancelarSetup}
        />
      )}

      {phase === "active" && factor && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            padding: "14px 16px",
            borderRadius: 10,
            background: "rgba(78,168,132,0.10)",
            border: "1px solid rgba(78,168,132,0.30)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span
              style={{ color: "var(--green)", display: "inline-flex" }}
              aria-hidden
            >
              {Icon.lock(20)}
            </span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 500, color: "#fff" }}>
                2FA ativada
              </div>
              <div style={{ fontSize: 12.5, color: "var(--muted)" }}>
                Sua conta está protegida com verificação em duas etapas.
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
    </GlassCard>
  )
}

// ─── Setup inline (não-modal) ────────────────────────────────

function SetupInline({
  canvasRef,
  secret,
  codigo,
  setCodigo,
  verificando,
  onSubmit,
  onCancel,
}: {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  secret: string | null
  codigo: string
  setCodigo: (v: string) => void
  verificando: boolean
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
}) {
  return (
    <div style={{ display: "grid", gap: 18 }}>
      <ol
        style={{
          margin: 0,
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
        <li>
          Escaneie o QR Code <strong>OU</strong> digite o código manual abaixo
        </li>
        <li>Digite o código de 6 dígitos que aparece no app</li>
      </ol>

      {/* QR via <canvas> nativo — desenhado pixel-a-pixel pela lib. */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 20,
          alignItems: "stretch",
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: 14,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <canvas
            ref={canvasRef}
            width={256}
            height={256}
            aria-label="QR Code para configurar 2FA"
            style={{ display: "block" }}
          />
        </div>

        {secret && (
          <div
            style={{
              flex: "1 1 240px",
              minWidth: 240,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <span
              className="mono"
              style={{
                fontSize: 10.5,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--gold)",
              }}
            >
              Não consegue escanear? Use o código manual
            </span>
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
                padding: "12px 14px",
                background: "rgba(0,0,0,0.45)",
                border: "1px solid rgba(201,168,106,0.30)",
                borderRadius: 10,
                fontFamily: "var(--font-mono, ui-monospace)",
                fontSize: 14,
                color: "var(--ink)",
                wordBreak: "break-all",
                letterSpacing: "0.05em",
                cursor: "text",
                userSelect: "all",
                lineHeight: 1.5,
              }}
            >
              {secret}
            </code>
            <p
              style={{
                margin: 0,
                fontSize: 12,
                color: "var(--muted)",
                lineHeight: 1.55,
              }}
            >
              No Google Authenticator: <strong>+ (adicionar)</strong> →{" "}
              <strong>&quot;Inserir uma chave de configuração&quot;</strong> →
              cole o código → tipo <strong>&quot;Baseado em tempo&quot;</strong>.
            </p>
          </div>
        )}
      </div>

      <form onSubmit={onSubmit}>
        <label
          className="mono"
          htmlFor="mfa-code-input"
          style={{
            display: "block",
            fontSize: 10.5,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "var(--muted)",
            marginBottom: 8,
          }}
        >
          Código de 6 dígitos do app
        </label>
        <input
          id="mfa-code-input"
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
          disabled={verificando}
          style={{
            width: "100%",
            padding: "14px 16px",
            fontSize: 24,
            letterSpacing: "0.5em",
            textAlign: "center",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid var(--line-2)",
            borderRadius: 10,
            color: "var(--ink)",
            fontFamily: "var(--font-mono, ui-monospace)",
            outline: "none",
            boxSizing: "border-box",
          }}
        />

        <div
          style={{
            display: "flex",
            gap: 10,
            marginTop: 16,
            justifyContent: "flex-end",
          }}
        >
          <Button variant="ghost" size="md" onClick={onCancel} type="button">
            Cancelar
          </Button>
          <Button
            variant="accent"
            size="md"
            type="submit"
            disabled={codigo.length !== 6 || verificando}
          >
            {verificando ? "Verificando…" : "Ativar 2FA"}
          </Button>
        </div>
      </form>
    </div>
  )
}
