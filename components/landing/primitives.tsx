"use client"

import Link from "next/link"
import { useEffect, type CSSProperties, type ReactNode } from "react"

type ContainerProps = {
  children: ReactNode
  className?: string
  style?: CSSProperties
}

export const Container = ({ children, className = "", style }: ContainerProps) => (
  <div
    className={`landing-container ${className}`}
    style={{
      width: "100%",
      marginInline: "auto",
      paddingInline: "clamp(20px, 4vw, 56px)",
      ...style,
    }}
  >
    {children}
  </div>
)

// ─── Reveal-on-scroll singleton ───
// Boota um único IntersectionObserver no mount e marca .reveal → .in.
// Usa MutationObserver pra capturar nodes que sobem depois (sections lazy).
let revealBooted = false
export const useReveal = () => {
  useEffect(() => {
    if (typeof window === "undefined" || revealBooted) return
    revealBooted = true

    const markAll = () =>
      document.querySelectorAll(".reveal").forEach((el) => el.classList.add("in"))

    if (!("IntersectionObserver" in window)) {
      markAll()
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in")
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.05, rootMargin: "0px 0px -40px 0px" },
    )

    const observeAll = () =>
      document
        .querySelectorAll(".reveal:not(.in)")
        .forEach((el) => io.observe(el))
    observeAll()

    const mo = new MutationObserver(() => observeAll())
    mo.observe(document.body, { subtree: true, childList: true })

    const failsafe = setTimeout(markAll, 3000)

    return () => {
      io.disconnect()
      mo.disconnect()
      clearTimeout(failsafe)
    }
  }, [])
}

type EyebrowProps = {
  children: ReactNode
  color?: string
  dot?: string
}

export const Eyebrow = ({
  children,
  color = "var(--muted)",
  dot = "var(--gold)",
}: EyebrowProps) => (
  <div
    className="mono"
    style={{
      fontSize: 11,
      letterSpacing: "0.18em",
      textTransform: "uppercase",
      color,
      display: "inline-flex",
      alignItems: "center",
      gap: 10,
    }}
  >
    <span
      style={{
        width: 6,
        height: 6,
        background: dot,
        borderRadius: "50%",
        boxShadow: `0 0 10px ${dot}`,
      }}
    />
    {children}
  </div>
)

type GlassGlow = "green" | "gold" | "none"

type GlassCardProps = {
  children: ReactNode
  className?: string
  style?: CSSProperties
  glow?: GlassGlow
  hover?: boolean
  padding?: number | string
}

export const GlassCard = ({
  children,
  className = "",
  style = {},
  glow = "green",
  hover = true,
  padding = 28,
}: GlassCardProps) => {
  const glowColor =
    glow === "gold"
      ? "rgba(201,168,106,0.12)"
      : glow === "none"
      ? "transparent"
      : "rgba(78,168,132,0.12)"
  const borderColor =
    glow === "gold"
      ? "var(--line-gold)"
      : glow === "none"
      ? "var(--line-2)"
      : "var(--line-green)"
  const hoverBorder =
    glow === "gold"
      ? "rgba(201,168,106,0.32)"
      : "rgba(78,168,132,0.32)"

  return (
    <div
      className={className}
      style={{
        position: "relative",
        background:
          "linear-gradient(180deg, rgba(22,26,30,0.72) 0%, rgba(12,15,18,0.82) 100%)",
        backdropFilter: "blur(18px) saturate(140%)",
        WebkitBackdropFilter: "blur(18px) saturate(140%)",
        border: `1px solid ${borderColor}`,
        borderRadius: 20,
        padding,
        boxShadow:
          "0 1px 0 rgba(255,255,255,0.04) inset," +
          "0 -1px 0 rgba(0,0,0,0.3) inset," +
          "0 20px 40px -20px rgba(0,0,0,0.7)," +
          `0 40px 80px -40px ${glowColor}`,
        transition:
          "transform .35s cubic-bezier(.2,.7,.2,1), border-color .35s, box-shadow .35s",
        ...style,
      }}
      onMouseEnter={
        hover
          ? (e) => {
              e.currentTarget.style.transform = "translateY(-3px)"
              e.currentTarget.style.borderColor = hoverBorder
            }
          : undefined
      }
      onMouseLeave={
        hover
          ? (e) => {
              e.currentTarget.style.transform = "none"
              e.currentTarget.style.borderColor = borderColor
            }
          : undefined
      }
    >
      {children}
    </div>
  )
}

type ButtonVariant = "primary" | "accent" | "ghost" | "ghostAccent"
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
  md: { padding: "12px 22px", fontSize: 14 },
  lg: { padding: "16px 28px", fontSize: 15 },
}

const buttonVariants: Record<ButtonVariant, CSSProperties> = {
  primary: {
    background: "linear-gradient(180deg, #f6f6f4 0%, #d9dbd6 100%)",
    color: "#0b0d0f",
    boxShadow:
      "0 0 0 1px rgba(255,255,255,0.12) inset," +
      "0 8px 20px -8px rgba(255,255,255,0.2)," +
      "0 1px 0 rgba(255,255,255,0.5) inset",
  },
  accent: {
    background: "linear-gradient(180deg, #5cbd95 0%, #2f7a5c 100%)",
    color: "#07120d",
    boxShadow:
      "0 0 0 1px rgba(255,255,255,0.15) inset," +
      "0 10px 30px -8px rgba(78,168,132,0.5)," +
      "0 0 0 3px rgba(78,168,132,0.12)",
  },
  ghost: {
    background: "rgba(255,255,255,0.03)",
    color: "var(--ink)",
    border: "1px solid rgba(255,255,255,0.12)",
    backdropFilter: "blur(12px)",
  },
  ghostAccent: {
    background: "rgba(78,168,132,0.08)",
    color: "var(--green)",
    border: "1px solid rgba(78,168,132,0.28)",
  },
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
    transition: "all .25s ease",
    cursor: "pointer",
    whiteSpace: "nowrap",
    border: "1px solid transparent",
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
    className="mono reveal"
    style={{
      fontSize: 11,
      letterSpacing: "0.18em",
      textTransform: "uppercase",
      color: "var(--muted)",
      display: "flex",
      alignItems: "center",
      gap: 12,
      paddingBottom: 14,
      marginBottom: 56,
      borderBottom: "1px solid var(--line)",
    }}
  >
    <span style={{ color: "var(--gold)" }}>{num}</span>
    <span style={{ width: 20, height: 1, background: "var(--line-2)" }} />
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
  dot: (s = 8) => (
    <svg width={s} height={s} viewBox="0 0 8 8">
      <circle cx="4" cy="4" r="3" fill="currentColor" />
    </svg>
  ),
  lock: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none">
      <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" stroke="currentColor" strokeWidth="1.4" />
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
  spark: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none">
      <path
        d="M8 1.5v4M8 10.5v4M1.5 8h4M10.5 8h4"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="m3.8 3.8 2.4 2.4m3.6 3.6 2.4 2.4M3.8 12.2l2.4-2.4m3.6-3.6 2.4-2.4"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity=".6"
      />
    </svg>
  ),
  play: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none">
      <path
        d="M5 3.5v9l7-4.5-7-4.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  ),
  eye: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none">
      <path
        d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5Z"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <circle cx="8" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  ),
  eyeOff: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none">
      <path
        d="M2 2l12 12M6.5 6.5a2 2 0 002.8 2.8M4 4C2.5 5.2 1 8 1 8s2.5 5 7 5c1.4 0 2.7-.4 3.7-1M9 3.1c4.2.4 6 4.9 6 4.9s-.8 1.5-2 2.8"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  ),
  mail: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none">
      <rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="m2 5 6 4 6-4" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  ),
  user: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="6" r="3" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2 14c1-3 3.5-4 6-4s5 1 6 4" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  ),
  chevron: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none">
      <path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  spinner: (s = 16) => (
    <svg
      width={s}
      height={s}
      viewBox="0 0 16 16"
      fill="none"
      style={{ animation: "landing-spin 0.8s linear infinite" }}
    >
      <circle
        cx="8"
        cy="8"
        r="6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeDasharray="28"
        strokeDashoffset="10"
      />
    </svg>
  ),
}

// AgroBridge mark v2 — arch + wheat keystone
export const Logo = ({
  size = 22,
  color = "currentColor",
  accent = "var(--gold)",
}: {
  size?: number
  color?: string
  accent?: string
}) => (
  <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-label="AgroBridge">
    <path
      d="M4 23 Q14 23 14 6"
      stroke={color}
      strokeWidth="1.9"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M24 23 Q14 23 14 6"
      stroke={color}
      strokeWidth="1.9"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M8.5 17 L19.5 17"
      stroke={color}
      strokeWidth="1.9"
      strokeLinecap="round"
    />
    <path
      d="M8.5 17 L14 9 M19.5 17 L14 9"
      stroke={color}
      strokeWidth="1.1"
      strokeLinecap="round"
      opacity="0.55"
    />
    <ellipse cx="14" cy="5.2" rx="1.6" ry="2.6" fill={accent} />
    <path
      d="M14 3 L14 7.4"
      stroke={color}
      strokeWidth="0.9"
      strokeLinecap="round"
      opacity="0.6"
    />
  </svg>
)

// Subtle grid overlay used as ambience behind sections
export const GridLayer = ({
  size = 72,
  opacity = 0.04,
  mask = "ellipse at 50% 30%",
}: {
  size?: number
  opacity?: number
  mask?: string
}) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      pointerEvents: "none",
      zIndex: 0,
      backgroundImage:
        `linear-gradient(rgba(255,255,255,${opacity}) 1px, transparent 1px),` +
        `linear-gradient(90deg, rgba(255,255,255,${opacity}) 1px, transparent 1px)`,
      backgroundSize: `${size}px ${size}px`,
      maskImage: `radial-gradient(${mask}, black 20%, transparent 70%)`,
      WebkitMaskImage: `radial-gradient(${mask}, black 20%, transparent 70%)`,
    }}
  />
)
