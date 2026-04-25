import { ImageResponse } from 'next/og'

// Apple touch icon 180×180 — logo AgroBridge com padding generoso (~20%).
// Preto sobre branco, bordas arredondadas pelo iOS automaticamente.

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'
export const runtime = 'edge'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          // Padding ~20% deixa o ícone respirado quando iOS aplica máscara/grid
          padding: '36px',
        }}
      >
        <svg
          width={108}
          height={108}
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
      </div>
    ),
    { ...size },
  )
}
