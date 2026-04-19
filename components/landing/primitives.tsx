import Link from "next/link"
import type { CSSProperties, ReactNode } from "react"

type ContainerProps = {
  children: ReactNode
  className?: string
  style?: CSSProperties
}

export const Container = ({ children, className = "", style }: ContainerProps) => (
  <div
    className={className}
    style={{ maxWidth: 1240, margin: "0 auto", padding: "0 32px", ...style }}
  >
    {children}
  </div>
)

export const Eyebrow = ({
  children,
  color = "var(--muted)",
}: {
  children: ReactNode
  color?: string
}) => (
  <div
    className="mono"
    style={{
      fontSize: 11,
      letterSpacing: "0.14em",
      textTransform: "uppercase",
      color,
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
    }}
  >
    <span
      style={{
        width: 6,
        height: 6,
        background: color === "var(--muted)" ? "var(--gold)" : color,
        borderRadius: "50%",
      }}
    />
    {children}
  </div>
)

type ButtonVariant = "primary" | "ghost" | "dark" | "onDark"
type ButtonSize = "sm" | "md" | "lg"

type ButtonProps = {
  children: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  href?: string
  onClick?: () => void
  style?: CSSProperties
  type?: "button" | "submit"
  external?: boolean
}

const buttonSizes: Record<ButtonSize, CSSProperties> = {
  sm: { padding: "9px 16px", fontSize: 13 },
  md: { padding: "13px 22px", fontSize: 14.5 },
  lg: { padding: "17px 28px", fontSize: 15.5 },
}

const buttonVariants: Record<ButtonVariant, CSSProperties> = {
  primary: {
    background: "var(--green)",
    color: "#fff",
    boxShadow: "0 1px 0 rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.08)",
  },
  ghost: {
    background: "transparent",
    color: "var(--ink)",
    border: "1px solid var(--line-2)",
  },
  dark: { background: "var(--ink)", color: "#fff" },
  onDark: { background: "#fff", color: "var(--green)" },
}

export const Button = ({
  children,
  variant = "primary",
  size = "md",
  href,
  onClick,
  style = {},
  type = "button",
  external = false,
}: ButtonProps) => {
  const baseStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    fontWeight: 500,
    letterSpacing: "-0.005em",
    borderRadius: 999,
    transition: "all .2s ease",
    cursor: "pointer",
    whiteSpace: "nowrap",
    ...buttonSizes[size],
    ...buttonVariants[variant],
    ...style,
  }

  if (href) {
    if (external || href.startsWith("#") || href.startsWith("http")) {
      return (
        <a href={href} onClick={onClick} style={baseStyle}>
          {children}
        </a>
      )
    }
    return (
      <Link href={href} onClick={onClick} style={baseStyle}>
        {children}
      </Link>
    )
  }
  return (
    <button type={type} onClick={onClick} style={baseStyle}>
      {children}
    </button>
  )
}

export const SectionLabel = ({ num, label }: { num: string; label: string }) => (
  <div
    className="mono"
    style={{
      fontSize: 11,
      letterSpacing: "0.14em",
      textTransform: "uppercase",
      color: "var(--muted)",
      display: "flex",
      alignItems: "center",
      gap: 10,
      paddingBottom: 12,
      borderBottom: "1px solid var(--line)",
      marginBottom: 48,
    }}
  >
    <span style={{ color: "var(--ink)" }}>{num}</span>
    <span style={{ width: 18, height: 1, background: "var(--line-2)" }} />
    <span>{label}</span>
  </div>
)

export const Icon = {
  arrow: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none">
      <path
        d="M3 8h10m-4-4 4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  check: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none">
      <path
        d="m3.5 8.5 3 3 6-7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  x: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none">
      <path
        d="m4 4 8 8M12 4l-8 8"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  ),
  plus: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none">
      <path
        d="M8 3v10M3 8h10"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  ),
  lock: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none">
      <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2"
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </svg>
  ),
  doc: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none">
      <path
        d="M4 2h5l3 3v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path d="M9 2v3h3" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  ),
  bank: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none">
      <path
        d="M2 6 8 2l6 4M3 6v7m10-7v7M6 7v5m4-5v5M2 14h12"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  ),
}

export const Logo = ({
  size = 20,
  color = "currentColor",
}: {
  size?: number
  color?: string
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-label="AgroBridge">
    <path
      d="M3 20 L12 4 L21 20"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M6.5 14.5 L17.5 14.5"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      opacity="0.55"
    />
    <circle cx="12" cy="4" r="1.6" fill={color} />
  </svg>
)
