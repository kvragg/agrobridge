"use client"

import { useEffect, useRef, useState, type CSSProperties } from "react"

type Props = {
  /** Caminho relativo a /public — ex: "/landing/cta-loop.mp4" */
  src: string
  /** Poster JPEG/WebP exibido antes do vídeo carregar. */
  poster: string
  /** Estilos do <video>. Default cobre 100% do parent com object-fit:cover. */
  style?: CSSProperties
  className?: string
  /** Margem de pré-carga via IntersectionObserver. Default "240px". */
  rootMargin?: string
}

/**
 * Vídeo de fundo lazy-loaded — só anexa o src ao entrar na viewport,
 * dispara play() quando carrega, pausa ao sair (poupa GPU/CPU/data).
 *
 * Funciona como decorativo: muted, loop, playsInline, no controls. Em
 * dispositivos com reduced-motion ou conexão lenta, mantém só o poster.
 *
 * Por que não <video src> direto: vídeo de 800KB-1.2MB acima do fold
 * compete por banda com fonts/CSS no LCP. Lazy via IO mantém só o
 * poster (87KB) no first paint, vídeo entra quando a seção aparece.
 */
export function VideoBg({
  src,
  poster,
  style,
  className,
  rootMargin = "240px",
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [shouldLoad, setShouldLoad] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    // Reduced motion: fica só no poster, sem carregar vídeo
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    // Save-data: respeitar Data Saver do usuário
    const conn = (
      navigator as Navigator & {
        connection?: { saveData?: boolean; effectiveType?: string }
      }
    ).connection
    if (conn?.saveData) return
    if (
      conn?.effectiveType &&
      ["slow-2g", "2g", "3g"].includes(conn.effectiveType)
    ) {
      return
    }

    const el = videoRef.current
    if (!el) return

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldLoad(true)
            io.disconnect()
          }
        })
      },
      { rootMargin },
    )
    io.observe(el)

    return () => io.disconnect()
  }, [rootMargin])

  // Pause quando totalmente fora da viewport (economiza GPU)
  useEffect(() => {
    if (!shouldLoad) return
    const el = videoRef.current
    if (!el) return

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.play().catch(() => {})
          } else {
            el.pause()
          }
        })
      },
      { threshold: 0.01 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [shouldLoad])

  return (
    <video
      ref={videoRef}
      poster={poster}
      muted
      loop
      playsInline
      autoPlay
      preload="none"
      aria-hidden="true"
      tabIndex={-1}
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        ...style,
      }}
      // O src só aparece quando shouldLoad — IO triggera depois do paint
      src={shouldLoad ? src : undefined}
    />
  )
}
