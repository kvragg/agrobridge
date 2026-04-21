'use client'

import { useEffect, useState } from 'react'

type Estado = 'idle' | 'enviando' | 'ok' | 'erro'

interface Resultado {
  ok?: boolean
  status?: number
  resendId?: string | null
  error?: string | null
  from?: string
  to?: string
  has_key?: boolean
}

export function DebugEmailForm() {
  const [estado, setEstado] = useState<Estado>('idle')
  const [to, setTo] = useState('')
  const [subject, setSubject] = useState('AgroBridge · Teste Resend')
  const [resultado, setResultado] = useState<Resultado | null>(null)

  // Busca config no mount (has_key + from)
  useEffect(() => {
    fetch('/api/debug/test-email')
      .then((r) => r.json())
      .then((j) => setResultado(j))
      .catch(() => {})
  }, [])

  async function submeter(e: React.FormEvent) {
    e.preventDefault()
    setEstado('enviando')
    setResultado(null)
    try {
      const res = await fetch('/api/debug/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: to.trim() || undefined,
          subject,
        }),
      })
      const json = (await res.json().catch(() => ({}))) as Resultado
      setResultado(json)
      setEstado(json.ok ? 'ok' : 'erro')
    } catch {
      setResultado({ ok: false, error: 'Falha de rede' })
      setEstado('erro')
    }
  }

  return (
    <form onSubmit={submeter} className="mt-4 space-y-3">
      <div className="rounded-md bg-gray-50 p-3 text-xs text-gray-600">
        <p>
          <strong>From:</strong>{' '}
          <code>{resultado?.from ?? '(carregando)'}</code>
        </p>
        <p>
          <strong>API key:</strong>{' '}
          {resultado?.has_key == null
            ? '...'
            : resultado.has_key
              ? '✓ presente'
              : '✗ ausente'}
        </p>
      </div>

      <label className="block text-sm">
        <span className="mb-1 block font-semibold">Para (opcional)</span>
        <input
          type="email"
          placeholder="(vazio = seu email admin)"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-semibold">Assunto</span>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
        />
      </label>

      <button
        type="submit"
        disabled={estado === 'enviando'}
        className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-bold text-white hover:bg-gray-700 disabled:bg-gray-400"
      >
        {estado === 'enviando' ? 'Enviando…' : 'Enviar teste'}
      </button>

      {resultado && estado !== 'idle' && (
        <pre
          className={`mt-4 overflow-x-auto rounded-md p-3 text-xs ${
            resultado.ok
              ? 'bg-green-50 text-green-900'
              : 'bg-red-50 text-red-900'
          }`}
        >
          {JSON.stringify(resultado, null, 2)}
        </pre>
      )}
    </form>
  )
}
