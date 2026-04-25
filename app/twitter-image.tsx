import { ImageResponse } from 'next/og'

// Twitter / X usa o mesmo layout do Open Graph. Conteúdo inline (não
// re-export nem import dinâmico) — Next 16 com edge runtime exige cada
// arquivo de imagem ser autônomo pra detectar metadata estática.

export const alt = 'AgroBridge — Crédito rural aprovado'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const runtime = 'edge'

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 96,
          fontFamily:
            'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            marginBottom: 64,
          }}
        >
          <svg
            width={96}
            height={96}
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M4 23 Q14 23 14 6"
              stroke="#0a0a0a"
              strokeWidth="1.9"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M24 23 Q14 23 14 6"
              stroke="#0a0a0a"
              strokeWidth="1.9"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M8.5 17 L19.5 17"
              stroke="#0a0a0a"
              strokeWidth="1.9"
              strokeLinecap="round"
            />
            <path
              d="M8.5 17 L14 9 M19.5 17 L14 9"
              stroke="#0a0a0a"
              strokeWidth="1.1"
              strokeLinecap="round"
              opacity="0.55"
            />
            <ellipse cx="14" cy="5.2" rx="1.6" ry="2.6" fill="#0a0a0a" />
            <path
              d="M14 3 L14 7.4"
              stroke="#0a0a0a"
              strokeWidth="0.9"
              strokeLinecap="round"
              opacity="0.6"
            />
          </svg>
          <div
            style={{
              fontSize: 88,
              fontWeight: 500,
              letterSpacing: '-0.04em',
              color: '#0a0a0a',
              lineHeight: 1,
            }}
          >
            AgroBridge
          </div>
        </div>

        <div
          style={{
            fontSize: 64,
            fontWeight: 500,
            letterSpacing: '-0.025em',
            color: '#0a0a0a',
            textAlign: 'center',
            lineHeight: 1.05,
            marginBottom: 28,
            maxWidth: 920,
          }}
        >
          Crédito rural aprovado
        </div>

        <div
          style={{
            fontSize: 28,
            fontWeight: 400,
            color: '#5a5a5a',
            textAlign: 'center',
            letterSpacing: '-0.005em',
            maxWidth: 980,
            lineHeight: 1.4,
          }}
        >
          Entrevista com IA · Checklist personalizado · Dossiê técnico pronto
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: 48,
            fontSize: 18,
            color: '#9a9a9a',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            fontFamily:
              '"JetBrains Mono", "SF Mono", ui-monospace, monospace',
          }}
        >
          agrobridge.space
        </div>
      </div>
    ),
    { ...size },
  )
}
