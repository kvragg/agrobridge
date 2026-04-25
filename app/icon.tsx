import { ImageResponse } from 'next/og'

// Favicon dinâmico 32×32 — logo AgroBridge (mark v2: arch + wheat keystone)
// renderizada via SVG inline. Preto sobre branco. Edge runtime.

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'
export const runtime = 'edge'

export default function Icon() {
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
        }}
      >
        <svg
          width={26}
          height={26}
          viewBox="0 0 28 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4 23 Q14 23 14 6"
            stroke="#0a0a0a"
            strokeWidth="2.4"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M24 23 Q14 23 14 6"
            stroke="#0a0a0a"
            strokeWidth="2.4"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M8.5 17 L19.5 17"
            stroke="#0a0a0a"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <ellipse cx="14" cy="5.2" rx="1.7" ry="2.7" fill="#0a0a0a" />
        </svg>
      </div>
    ),
    { ...size },
  )
}
