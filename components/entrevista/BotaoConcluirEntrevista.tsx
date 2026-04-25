"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button, Icon } from "@/components/landing/primitives"

interface Props {
  /** Variante visual — pílula compacta no widget, botão maior na tela. */
  variante?: "compacto" | "default"
  /** Callback opcional após concluir, ANTES do redirect. */
  onConcluir?: () => void
}

/**
 * Botão "Concluir entrevista e ver checklist" — único ponto de fim
 * explícito da conversa com a IA. Aparece tanto no ChatClient (tela
 * dedicada /entrevista) quanto no WidgetIA (chat flutuante) depois
 * que o lead já deu informação suficiente (heurística do parent).
 *
 * Chama POST /api/entrevista/concluir → backend monta perfil_json a
 * partir de perfis_lead (campos diretos + memoria_ia), cria/atualiza
 * processo, retorna processo_id pra redirect.
 *
 * Tratamento de erro:
 *  - 422 perfil_insuficiente: alerta amigável + foca no input pra
 *    continuar conversando
 *  - outros: alert + log
 */
export function BotaoConcluirEntrevista({
  variante = "default",
  onConcluir,
}: Props) {
  const router = useRouter()
  const [enviando, setEnviando] = useState(false)
  const [erroAmigavel, setErroAmigavel] = useState<string | null>(null)

  async function concluir() {
    setEnviando(true)
    setErroAmigavel(null)
    try {
      const res = await fetch("/api/entrevista/concluir", { method: "POST" })
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean
        processo_id?: string
        redirect_para?: string
        erro?: string
        codigo?: string
      }

      if (!res.ok) {
        setErroAmigavel(
          data?.erro ??
            "Não consegui concluir agora. Continue conversando ou tente de novo.",
        )
        return
      }

      onConcluir?.()
      const dest = data.redirect_para ?? "/checklist"
      router.push(dest)
      router.refresh()
    } catch {
      setErroAmigavel(
        "Falha de conexão. Verifique sua internet e tente de novo.",
      )
    } finally {
      setEnviando(false)
    }
  }

  if (variante === "compacto") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <button
          type="button"
          onClick={concluir}
          disabled={enviando}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            padding: "9px 14px",
            borderRadius: 999,
            background:
              "linear-gradient(180deg, rgba(201,168,106,0.95) 0%, rgba(168,138,82,1) 100%)",
            color: "#1a140a",
            border: "1px solid rgba(201,168,106,0.6)",
            fontSize: 12.5,
            fontWeight: 500,
            letterSpacing: "-0.005em",
            fontFamily: "inherit",
            cursor: enviando ? "wait" : "pointer",
            opacity: enviando ? 0.7 : 1,
            boxShadow:
              "0 0 0 1px rgba(255,255,255,0.18) inset, 0 6px 14px -4px rgba(201,168,106,0.4)",
          }}
        >
          {enviando ? Icon.spinner(13) : Icon.check(13)}
          {enviando ? "Concluindo…" : "Concluir e ver checklist"}
        </button>
        {erroAmigavel && (
          <div
            role="alert"
            style={{
              fontSize: 11.5,
              color: "var(--danger)",
              lineHeight: 1.45,
              padding: "6px 8px",
              background: "rgba(212,113,88,0.08)",
              border: "1px solid rgba(212,113,88,0.25)",
              borderRadius: 6,
            }}
          >
            {erroAmigavel}
          </div>
        )}
      </div>
    )
  }

  // Variante default — botão grande, pra tela dedicada
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <Button
        variant="accent"
        size="md"
        onClick={concluir}
        disabled={enviando}
      >
        {enviando ? (
          <>
            {Icon.spinner(15)} Montando seu checklist…
          </>
        ) : (
          <>
            {Icon.check(15)} Concluir entrevista e ver meu checklist{" "}
            {Icon.arrow(13)}
          </>
        )}
      </Button>
      {erroAmigavel && (
        <div
          role="alert"
          style={{
            fontSize: 12.5,
            color: "var(--danger)",
            lineHeight: 1.5,
            padding: "8px 12px",
            background: "rgba(212,113,88,0.08)",
            border: "1px solid rgba(212,113,88,0.25)",
            borderRadius: 8,
          }}
        >
          {erroAmigavel}
        </div>
      )}
    </div>
  )
}
