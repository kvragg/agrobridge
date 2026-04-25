'use client'

import { useMemo, useState } from 'react'
import {
  Container,
  SectionLabel,
  GlassCard,
  Icon,
  useReveal,
} from './primitives'
import {
  GLOSSARIO,
  CATEGORIA_LABEL,
  CATEGORIA_COR,
  type TermoGlossario,
} from '@/data/glossario'
import { useRotator } from '@/hooks/use-rotator'

const INTERVALO_MS = 7000 // 7s — meio do range pedido (6-8s)

/**
 * Embaralha o array com seed determinística por dia. Server e client
 * usam a mesma seed (Math.floor de UTC dividido por dia inteiro),
 * então a ordem casa entre SSR e CSR — sem hydration mismatch dentro
 * do mesmo dia. A ordem muda 1× por 24h.
 */
function embaralhar<T>(arr: T[], seed: number): T[] {
  const out = [...arr]
  let s = seed
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280
    const j = Math.floor((s / 233280) * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

function seedDoDia(): number {
  // Date.now() em SSR e CSR cai no mesmo dia UTC na esmagadora maioria
  // dos pageviews. Aceitamos a possibilidade microscópica de cair na
  // fronteira do dia (próxima rota de cache invalida).
  return Math.floor(Date.now() / (1000 * 60 * 60 * 24))
}

export function Glossario() {
  useReveal()

  // Lazy init — não dispara cascading render (regra react-hooks/purity).
  const [items] = useState<TermoGlossario[]>(() =>
    embaralhar(GLOSSARIO, seedDoDia()),
  )

  const { index, isPaused, progress, next, prev, toggle, setHoverPaused } =
    useRotator(items.length, { intervalMs: INTERVALO_MS })

  const termo = items[index] ?? items[0]
  const categoriaCor = CATEGORIA_COR[termo.categoria]

  const estado = useMemo<string>(() => {
    if (isPaused) return 'pausado'
    return 'em rotação'
  }, [isPaused])

  return (
    <section id="glossario" style={{ padding: '140px 0', position: 'relative' }}>
      <div
        className="ambient"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          background:
            'radial-gradient(50% 50% at 30% 50%, rgba(78,168,132,0.08), transparent 60%)',
        }}
      />
      <Container style={{ position: 'relative' }}>
        <SectionLabel num="07" label="Decodificador do MCR" />

        <div
          className="glossario-head"
          style={{
            display: 'grid',
            gridTemplateColumns: '1.4fr 1fr',
            gap: 72,
            alignItems: 'flex-end',
            marginBottom: 56,
          }}
        >
          <div className="reveal">
            <h2
              style={{
                fontSize: 'clamp(36px, 4.8vw, 60px)',
                lineHeight: 1.0,
                letterSpacing: '-0.035em',
                fontWeight: 500,
                margin: 0,
                textWrap: 'balance',
                color: '#fff',
              }}
            >
              Cada sigla do crédito rural,
              <br />
              <span style={{ color: 'var(--muted)' }}>decodificada.</span>
            </h2>
          </div>
          <div className="reveal reveal-d1">
            <p
              style={{
                fontSize: 17,
                lineHeight: 1.6,
                color: 'var(--ink-2)',
                margin: 0,
                maxWidth: 460,
              }}
            >
              {GLOSSARIO.length} termos técnicos do Manual de Crédito Rural,
              da burocracia ambiental à estrutura de garantia. O glossário
              que abre o caminho do dossiê.
            </p>
          </div>
        </div>

        <GlassCard
          glow="green"
          padding={0}
          hover={false}
          className="reveal reveal-d1"
          style={{ overflow: 'hidden' }}
        >
          {/* Header com categoria + contador */}
          <div
            style={{
              padding: '16px 22px',
              borderBottom: '1px solid var(--line)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(0,0,0,0.2)',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: categoriaCor,
                  boxShadow: `0 0 10px ${categoriaCor}80`,
                  display: 'inline-block',
                  transition: 'background 0.4s, box-shadow 0.4s',
                }}
              />
              <span
                className="mono"
                style={{
                  fontSize: 11,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: categoriaCor,
                  transition: 'color 0.4s',
                }}
              >
                {CATEGORIA_LABEL[termo.categoria]}
              </span>
            </div>
            <div
              className="mono"
              style={{
                fontSize: 11,
                color: 'var(--muted)',
                letterSpacing: '0.14em',
                fontVariantNumeric: 'tabular-nums',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span>
                {String(index + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
              </span>
              <span style={{ color: 'var(--faint)' }}>·</span>
              <span style={{ textTransform: 'lowercase' }}>{estado}</span>
            </div>
          </div>

          {/* Conteúdo do termo — área live */}
          <div
            onMouseEnter={() => setHoverPaused(true)}
            onMouseLeave={() => setHoverPaused(false)}
            onFocus={() => setHoverPaused(true)}
            onBlur={() => setHoverPaused(false)}
            aria-live="polite"
            aria-atomic="true"
            style={{
              padding: '40px 28px 32px',
              minHeight: 280,
              display: 'flex',
              flexDirection: 'column',
              gap: 24,
              cursor: 'default',
            }}
          >
            <div key={termo.sigla} className="termo-fade">
              {/* Sigla XL display */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 18,
                  flexWrap: 'wrap',
                  marginBottom: 14,
                }}
              >
                <div
                  style={{
                    fontFamily: "'Geist', 'Inter', sans-serif",
                    fontSize: 'clamp(48px, 7vw, 80px)',
                    fontWeight: 500,
                    letterSpacing: '-0.04em',
                    lineHeight: 1,
                    color: '#fff',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {termo.sigla}
                </div>
                <div
                  style={{
                    fontSize: 17,
                    color: 'var(--ink-2)',
                    fontWeight: 400,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {termo.nome}
                </div>
              </div>

              {/* Definição */}
              <p
                style={{
                  fontSize: 16.5,
                  lineHeight: 1.65,
                  color: 'var(--ink-2)',
                  margin: 0,
                  maxWidth: 760,
                  textWrap: 'pretty',
                }}
              >
                {termo.definicao}
              </p>
            </div>
          </div>

          {/* Footer com controles + barra de progresso */}
          <div
            style={{
              borderTop: '1px solid var(--line)',
              background: 'rgba(0,0,0,0.2)',
            }}
          >
            {/* Barra de progresso */}
            <div
              role="progressbar"
              aria-label="Progresso do termo atual"
              aria-valuenow={Math.round(progress * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              style={{
                height: 2,
                background: 'rgba(255,255,255,0.04)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${progress * 100}%`,
                  background:
                    'linear-gradient(90deg, var(--green), var(--green-2))',
                  transition: progress === 0 ? 'none' : 'width 0.05s linear',
                }}
              />
            </div>

            <div
              style={{
                padding: '14px 22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <div
                className="mono"
                style={{
                  fontSize: 10.5,
                  color: 'var(--muted)',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                }}
              >
                Glossário · v1.0 · abril 2026
              </div>

              <div
                style={{ display: 'inline-flex', gap: 6 }}
                role="group"
                aria-label="Controles da rotação do glossário"
              >
                <ControlButton
                  ariaLabel="Termo anterior"
                  onClick={prev}
                  icon={iconChevron('left')}
                />
                <ControlButton
                  ariaLabel={isPaused ? 'Retomar rotação' : 'Pausar rotação'}
                  onClick={toggle}
                  icon={isPaused ? iconPlay() : iconPause()}
                />
                <ControlButton
                  ariaLabel="Próximo termo"
                  onClick={next}
                  icon={iconChevron('right')}
                />
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Microcopy abaixo do card */}
        <p
          className="reveal reveal-d2"
          style={{
            marginTop: 22,
            fontSize: 13,
            lineHeight: 1.6,
            color: 'var(--muted)',
            maxWidth: 560,
          }}
        >
          Não é preciso decorar nada — cada termo aparece no seu dossiê
          com a explicação contextual. O AgroBridge fala a língua do
          comitê de crédito.
        </p>
      </Container>

      <style>{`
        @media (max-width: 900px){
          .glossario-head{ grid-template-columns: 1fr !important; gap: 28px !important; align-items: flex-start !important }
        }
        .termo-fade{
          animation: termoFadeIn 0.45s cubic-bezier(.2,.7,.2,1);
        }
        @keyframes termoFadeIn{
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: none; }
        }
        @media (prefers-reduced-motion: reduce){
          .termo-fade{ animation: none !important; }
        }
      `}</style>
    </section>
  )
}

interface ControlBtnProps {
  ariaLabel: string
  onClick: () => void
  icon: React.ReactNode
}

function ControlButton({ ariaLabel, onClick, icon }: ControlBtnProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      style={{
        width: 34,
        height: 34,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid var(--line-2)',
        borderRadius: 8,
        color: 'var(--ink-2)',
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(78,168,132,0.10)'
        e.currentTarget.style.borderColor = 'rgba(78,168,132,0.32)'
        e.currentTarget.style.color = 'var(--ink)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
        e.currentTarget.style.borderColor = 'var(--line-2)'
        e.currentTarget.style.color = 'var(--ink-2)'
      }}
    >
      {icon}
    </button>
  )
}

// Ícones inline (mesmo estilo dos do `Icon` em primitives — stroke 1.4)

function iconChevron(dir: 'left' | 'right'): React.ReactNode {
  const path =
    dir === 'left' ? 'M10 4 L6 8 L10 12' : 'M6 4 L10 8 L6 12'
  return (
    <svg width={14} height={14} viewBox="0 0 16 16" fill="none">
      <path
        d={path}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function iconPlay(): React.ReactNode {
  return Icon.play(13)
}

function iconPause(): React.ReactNode {
  return (
    <svg width={13} height={13} viewBox="0 0 16 16" fill="none">
      <rect
        x="4.5"
        y="3.5"
        width="2.5"
        height="9"
        rx="0.6"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <rect
        x="9"
        y="3.5"
        width="2.5"
        height="9"
        rx="0.6"
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </svg>
  )
}
