"use client"

import Link from "next/link"
import { Icon } from "@/components/landing/primitives"

/**
 * CTA reutilizável pra levar o usuário à entrevista quando ela ainda
 * não foi concluída (/checklist/[id] tier diagnostico ou dossie).
 */
export function EntrevistaCTA({
  iniciada = false,
  fullWidthOnMobile = true,
}: {
  /** True = "Continuar entrevista", false = "Iniciar entrevista". */
  iniciada?: boolean
  fullWidthOnMobile?: boolean
}) {
  const label = iniciada ? "Continuar entrevista" : "Iniciar entrevista"
  return (
    <Link
      href="/entrevista"
      className="entrevista-cta"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        padding: "14px 24px",
        borderRadius: 999,
        background: "linear-gradient(180deg,#5cbd95 0%,#2f7a5c 100%)",
        color: "#07120d",
        fontSize: 14.5,
        fontWeight: 500,
        letterSpacing: "-0.005em",
        textDecoration: "none",
        boxShadow:
          "0 0 0 1px rgba(255,255,255,0.15) inset," +
          "0 10px 30px -8px rgba(78,168,132,0.5)," +
          "0 0 0 3px rgba(78,168,132,0.12)",
        transition: "transform .15s ease, box-shadow .2s",
        marginTop: 12,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-1px)"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "none"
      }}
    >
      {Icon.chat(16)}
      {label}
      {Icon.arrow(14)}
      {fullWidthOnMobile && (
        <style>{`
          @media (max-width: 520px) {
            .entrevista-cta { width: 100% !important }
          }
        `}</style>
      )}
    </Link>
  )
}
