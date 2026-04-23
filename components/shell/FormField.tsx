"use client"

import type { CSSProperties, InputHTMLAttributes, ReactNode } from "react"
import { forwardRef, useState } from "react"
import { Icon } from "@/components/landing/primitives"

type FormFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "style"> & {
  label: string
  error?: string
  hint?: ReactNode
  /** Ícone lateral (ex: seta, cadeado). Inserido à direita dentro do input. */
  trailing?: ReactNode
  /** Para campos de senha com toggle olho (auto-gerencia type). */
  passwordToggle?: boolean
  inputStyle?: CSSProperties
}

/**
 * Input padrão dark premium — altura 48, focus verde, erro vermelho.
 * Usa style inline (não classes) pra não depender de ordem de CSS cascade.
 */
export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  function FormField(
    {
      label,
      error,
      hint,
      trailing,
      passwordToggle = false,
      type = "text",
      inputStyle,
      ...inputProps
    },
    ref,
  ) {
    const [showPassword, setShowPassword] = useState(false)
    const resolvedType =
      passwordToggle && showPassword ? "text" : passwordToggle ? "password" : type

    const borderColor = error ? "var(--danger)" : "var(--line-2)"
    const focusShadow = error
      ? "0 0 0 3px rgba(212,113,88,0.12)"
      : "0 0 0 3px rgba(78,168,132,0.15)"
    const focusBorder = error ? "var(--danger)" : "var(--green)"

    return (
      <label style={{ display: "block", marginBottom: 18 }}>
        <div
          className="mono"
          style={{
            fontSize: 10.5,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: error ? "var(--danger)" : "var(--muted)",
            marginBottom: 10,
          }}
        >
          {label}
        </div>
        <div style={{ position: "relative" }}>
          <input
            ref={ref}
            type={resolvedType}
            style={{
              width: "100%",
              height: 48,
              padding:
                passwordToggle || trailing ? "14px 48px 14px 16px" : "14px 16px",
              background: "rgba(255,255,255,0.03)",
              border: `1px solid ${borderColor}`,
              borderRadius: 12,
              color: "var(--ink)",
              fontSize: 14.5,
              fontFamily: "inherit",
              outline: "none",
              transition: "border-color .2s, box-shadow .2s",
              ...inputStyle,
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = focusBorder
              e.currentTarget.style.boxShadow = focusShadow
              inputProps.onFocus?.(e)
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = borderColor
              e.currentTarget.style.boxShadow = "none"
              inputProps.onBlur?.(e)
            }}
            {...inputProps}
          />

          {passwordToggle && (
            <button
              type="button"
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              onClick={() => setShowPassword((s) => !s)}
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: 0,
                color: "var(--muted)",
                cursor: "pointer",
                padding: 4,
                display: "flex",
                alignItems: "center",
              }}
            >
              {showPassword ? Icon.eyeOff(18) : Icon.eye(18)}
            </button>
          )}

          {!passwordToggle && trailing && (
            <div
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--muted)",
              }}
            >
              {trailing}
            </div>
          )}
        </div>

        {error && (
          <div
            style={{
              marginTop: 8,
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 13,
              color: "var(--danger)",
            }}
          >
            <span
              style={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                background: "rgba(212,113,88,0.15)",
                color: "var(--danger)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {Icon.x(10)}
            </span>
            {error}
          </div>
        )}

        {!error && hint && (
          <div
            style={{
              marginTop: 8,
              fontSize: 13,
              color: "var(--muted)",
            }}
          >
            {hint}
          </div>
        )}
      </label>
    )
  },
)
