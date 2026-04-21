'use client'

import { useEffect, useState } from 'react'

type Estado = 'idle' | 'enviando' | 'ok' | 'erro'

interface ResultadoRaw {
  ok?: boolean
  status?: number
  resendId?: string | null
  error?: string | null
  from?: string
  to?: string
  has_key?: boolean
}

interface ResultadoTemplate {
  ok?: boolean
  template?: string
  to?: string
  tentativas?: number
  resendId?: string | null
  status?: number | null
  error?: string | null
}

type TemplateId =
  | 'alerta_admin_novo_signup'
  | 'dossie_pronto'
  | 'boas_vindas_apos_compra'
  | 'confirmar_exclusao_lgpd'

const TEMPLATES: { id: TemplateId; label: string; descricao: string }[] = [
  {
    id: 'alerta_admin_novo_signup',
    label: 'alerta_admin_novo_signup',
    descricao: 'Alerta interno quando lead cria conta.',
  },
  {
    id: 'dossie_pronto',
    label: 'dossie_pronto',
    descricao: 'Avisa o produtor que o PDF está pronto.',
  },
  {
    id: 'boas_vindas_apos_compra',
    label: 'boas_vindas_apos_compra',
    descricao: 'Pagamento confirmado + onboarding tier-específico.',
  },
  {
    id: 'confirmar_exclusao_lgpd',
    label: 'confirmar_exclusao_lgpd',
    descricao: 'Dupla confirmação do pedido de exclusão (Art. 18).',
  },
]

export function DebugEmailForm() {
  const [estado, setEstado] = useState<Estado>('idle')
  const [to, setTo] = useState('')
  const [subject, setSubject] = useState('AgroBridge · Teste Resend')
  const [resultado, setResultado] = useState<ResultadoRaw | null>(null)

  const [estadoTpl, setEstadoTpl] = useState<Estado>('idle')
  const [toTpl, setToTpl] = useState('')
  const [templateSel, setTemplateSel] = useState<TemplateId>('dossie_pronto')
  const [resultadoTpl, setResultadoTpl] = useState<ResultadoTemplate | null>(
    null
  )

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
      const json = (await res.json().catch(() => ({}))) as ResultadoRaw
      setResultado(json)
      setEstado(json.ok ? 'ok' : 'erro')
    } catch {
      setResultado({ ok: false, error: 'Falha de rede' })
      setEstado('erro')
    }
  }

  async function submeterTemplate(e: React.FormEvent) {
    e.preventDefault()
    setEstadoTpl('enviando')
    setResultadoTpl(null)
    try {
      const res = await fetch('/api/debug/template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template: templateSel,
          to: toTpl.trim() || undefined,
        }),
      })
      const json = (await res.json().catch(() => ({}))) as ResultadoTemplate
      setResultadoTpl(json)
      setEstadoTpl(json.ok ? 'ok' : 'erro')
    } catch {
      setResultadoTpl({ ok: false, error: 'Falha de rede' })
      setEstadoTpl('erro')
    }
  }

  return (
    <div className="mt-4 space-y-8">
      {/* ── Raw Resend test ── */}
      <form onSubmit={submeter} className="space-y-3">
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
          {estado === 'enviando' ? 'Enviando…' : 'Enviar email raw'}
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

      {/* ── Templates reais ── */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-base font-bold text-gray-900">
          Testar templates reais
        </h3>
        <p className="mt-1 text-xs text-gray-500">
          Renderiza um dos 4 templates de produção com dados sintéticos
          ([TESTE]), tenta até 3 vezes em caso de 429/5xx e grava o envio em{' '}
          <code>audit_events</code>.
        </p>

        <form onSubmit={submeterTemplate} className="mt-4 space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block font-semibold">Template</span>
            <select
              value={templateSel}
              onChange={(e) => setTemplateSel(e.target.value as TemplateId)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              {TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-xs text-gray-500">
              {TEMPLATES.find((t) => t.id === templateSel)?.descricao}
            </span>
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-semibold">Para (opcional)</span>
            <input
              type="email"
              placeholder="(vazio = seu email admin)"
              value={toTpl}
              onChange={(e) => setToTpl(e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            />
          </label>

          <button
            type="submit"
            disabled={estadoTpl === 'enviando'}
            className="inline-flex items-center gap-2 rounded-md bg-[#0f3d2e] px-4 py-2 text-sm font-bold text-white hover:bg-[#166534] disabled:bg-gray-400"
          >
            {estadoTpl === 'enviando' ? 'Enviando…' : 'Enviar template'}
          </button>

          {resultadoTpl && estadoTpl !== 'idle' && (
            <pre
              className={`mt-4 overflow-x-auto rounded-md p-3 text-xs ${
                resultadoTpl.ok
                  ? 'bg-green-50 text-green-900'
                  : 'bg-red-50 text-red-900'
              }`}
            >
              {JSON.stringify(resultadoTpl, null, 2)}
            </pre>
          )}
        </form>
      </div>
    </div>
  )
}
