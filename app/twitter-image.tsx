import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

// Twitter / X usa o mesmo layout do Open Graph. Conteúdo inline (não
// re-export nem import dinâmico) — Next 16 com edge runtime exige cada
// arquivo de imagem ser autônomo pra detectar metadata estática.

export const alt = 'AgroBridge — Crédito rural aprovado'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function TwitterImage() {
  const bg = await readFile(join(process.cwd(), 'public/landing/og-bg.jpg'))
  const bgData = `data:image/jpeg;base64,${bg.toString('base64')}`

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          background: '#0a0a0a',
          fontFamily:
            'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={bgData}
          alt=""
          width={1200}
          height={630}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />

        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            background:
              'linear-gradient(180deg, rgba(7,8,9,0.55) 0%, rgba(7,8,9,0.25) 35%, rgba(7,8,9,0.85) 78%, rgba(7,8,9,0.96) 100%)',
          }}
        />

        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            background:
              'linear-gradient(90deg, rgba(7,8,9,0.55) 0%, rgba(7,8,9,0.15) 40%, transparent 70%)',
          }}
        />

        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: 2,
            display: 'flex',
            background:
              'linear-gradient(90deg, transparent, #c9a86a 30%, #c9a86a 70%, transparent)',
            opacity: 0.6,
          }}
        />

        <div
          style={{
            position: 'absolute',
            top: 56,
            left: 64,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <svg
            width={42}
            height={42}
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M4 23 Q14 23 14 6"
              stroke="#ffffff"
              strokeWidth="1.9"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M24 23 Q14 23 14 6"
              stroke="#ffffff"
              strokeWidth="1.9"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M8.5 17 L19.5 17"
              stroke="#ffffff"
              strokeWidth="1.9"
              strokeLinecap="round"
            />
            <path
              d="M8.5 17 L14 9 M19.5 17 L14 9"
              stroke="#ffffff"
              strokeWidth="1.1"
              strokeLinecap="round"
              opacity="0.55"
            />
            <ellipse cx="14" cy="5.2" rx="1.6" ry="2.6" fill="#c9a86a" />
            <path
              d="M14 3 L14 7.4"
              stroke="#ffffff"
              strokeWidth="0.9"
              strokeLinecap="round"
              opacity="0.6"
            />
          </svg>
          <div
            style={{
              fontSize: 28,
              fontWeight: 500,
              letterSpacing: '-0.01em',
              color: '#ffffff',
              lineHeight: 1,
            }}
          >
            AgroBridge
          </div>
          <div
            style={{
              width: 1,
              height: 22,
              background: 'rgba(255,255,255,0.25)',
              marginLeft: 6,
              display: 'flex',
            }}
          />
          <div
            style={{
              fontSize: 13,
              fontWeight: 400,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.65)',
              fontFamily: '"JetBrains Mono", "SF Mono", ui-monospace, monospace',
            }}
          >
            Crédito Rural
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: 80,
            left: 64,
            display: 'flex',
            flexDirection: 'column',
            maxWidth: 920,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 22,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: '#c9a86a',
                display: 'flex',
              }}
            />
            <div
              style={{
                fontSize: 13,
                fontWeight: 400,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.7)',
                fontFamily:
                  '"JetBrains Mono", "SF Mono", ui-monospace, monospace',
              }}
            >
              Safra 25/26 · Aprovado pelo comitê
            </div>
          </div>

          <div
            style={{
              fontSize: 96,
              fontWeight: 500,
              letterSpacing: '-0.045em',
              color: '#ffffff',
              lineHeight: 0.95,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex' }}>Crédito rural</div>
            <div
              style={{
                display: 'flex',
                background:
                  'linear-gradient(90deg, #ffffff 0%, #c9a86a 70%, #c9a86a 100%)',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              aprovado.
            </div>
          </div>

          <div
            style={{
              fontSize: 22,
              fontWeight: 400,
              color: 'rgba(255,255,255,0.78)',
              letterSpacing: '-0.005em',
              marginTop: 24,
              maxWidth: 720,
              lineHeight: 1.4,
              display: 'flex',
            }}
          >
            Entrevista com IA · Checklist personalizado · Dossiê técnico pronto
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: 40,
            right: 56,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div
            style={{
              fontSize: 14,
              color: 'rgba(255,255,255,0.55)',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              fontFamily:
                '"JetBrains Mono", "SF Mono", ui-monospace, monospace',
            }}
          >
            agrobridge.space
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
