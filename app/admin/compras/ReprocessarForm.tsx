'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Estado = 'idle' | 'enviando' | 'ok' | 'erro'

export function ReprocessarForm() {
  const router = useRouter()
  const [estado, setEstado] = useState<Estado>('idle')
  const [mensagem, setMensagem] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [tier, setTier] = useState<'diagnostico' | 'dossie' | 'mentoria'>(
    'diagnostico'
  )
  const [amount, setAmount] = useState('29.99')
  const [txId, setTxId] = useState('')

  async function submeter(e: React.FormEvent) {
    e.preventDefault()
    setEstado('enviando')
    setMensagem(null)

    const amountCents = Math.round(Number(amount.replace(',', '.')) * 100)
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      setEstado('erro')
      setMensagem('Valor inválido.')
      return
    }

    try {
      const res = await fetch('/api/admin/reprocessar-compra', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          tier,
          amount_cents: amountCents,
          transaction_id: txId.trim() || undefined,
        }),
      })
      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean
        motivo?: string
        erro?: string
      }
      if (!res.ok || !json.ok) {
        setEstado('erro')
        setMensagem(json?.erro ?? json?.motivo ?? 'Falha ao reprocessar.')
        return
      }
      setEstado('ok')
      setMensagem(
        `Tier ${tier} liberado para ${email}. Motivo RPC: ${
          json.motivo ?? 'ok'
        }`
      )
      router.refresh()
    } catch {
      setEstado('erro')
      setMensagem('Falha de rede.')
    }
  }

  return (
    <form onSubmit={submeter} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-semibold text-amber-900">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="exemplo@dominio.com"
            className="w-full rounded-md border border-amber-300 bg-white px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-semibold text-amber-900">Tier</span>
          <select
            value={tier}
            onChange={(e) =>
              setTier(e.target.value as 'diagnostico' | 'dossie' | 'mentoria')
            }
            className="w-full rounded-md border border-amber-300 bg-white px-3 py-2 text-sm"
          >
            <option value="diagnostico">Bronze (diagnóstico) — R$29,99</option>
            <option value="dossie">Prata (dossiê) — R$297,99</option>
            <option value="mentoria">Ouro (mentoria) — R$697,99</option>
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-semibold text-amber-900">
            Valor (R$)
          </span>
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-md border border-amber-300 bg-white px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-semibold text-amber-900">
            Transaction ID (opcional)
          </span>
          <input
            type="text"
            value={txId}
            onChange={(e) => setTxId(e.target.value)}
            placeholder="Cakto TX id — vazio = gerar manual_<timestamp>"
            className="w-full rounded-md border border-amber-300 bg-white px-3 py-2 text-sm font-mono"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={estado === 'enviando'}
        className="mt-2 inline-flex items-center gap-2 rounded-md bg-amber-700 px-4 py-2 text-sm font-bold text-white hover:bg-amber-800 disabled:bg-gray-400"
      >
        {estado === 'enviando' ? 'Processando…' : 'Reprocessar compra'}
      </button>

      {mensagem && (
        <div
          className={`mt-3 rounded-md p-3 text-sm ${
            estado === 'ok'
              ? 'bg-green-50 text-green-900'
              : 'bg-red-50 text-red-900'
          }`}
        >
          {mensagem}
        </div>
      )}
    </form>
  )
}
