'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Download, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react'

export default function ContaDadosClient({
  nome,
  email,
}: {
  nome: string
  email: string
}) {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#f0fdf4] to-[#f9fafb] px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-[#166534] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para o painel
        </Link>

        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#166534]">
            Conta · LGPD Art. 18
          </p>
          <h1 className="mt-1 text-3xl font-black text-gray-900">
            Meus dados
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Olá, {nome}. Você tem direito de acessar, portar ou excluir seus
            dados a qualquer momento. As solicitações abaixo são atendidas de
            forma automática.
          </p>
        </header>

        <div className="space-y-5">
          <CardExportar />
          <CardExcluir email={email} />
        </div>

        <p className="mt-10 text-xs text-gray-500">
          Dúvidas sobre privacidade? Leia a{' '}
          <Link href="/privacidade" className="font-medium text-[#166534] hover:underline">
            Política de Privacidade
          </Link>{' '}
          ou fale com{' '}
          <a
            href="mailto:paulocosta.contato1@gmail.com"
            className="font-medium text-[#166534] hover:underline"
          >
            paulocosta.contato1@gmail.com
          </a>
          .
        </p>
      </div>
    </main>
  )
}

function CardExportar() {
  const [estado, setEstado] = useState<'idle' | 'baixando' | 'ok' | 'erro'>('idle')
  const [mensagem, setMensagem] = useState<string | null>(null)

  async function baixar() {
    setEstado('baixando')
    setMensagem(null)
    try {
      const res = await fetch('/api/conta/exportar')
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setEstado('erro')
        setMensagem(json?.erro ?? 'Não foi possível gerar a exportação.')
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const filename =
        res.headers
          .get('content-disposition')
          ?.match(/filename="([^"]+)"/)?.[1] ??
        `agrobridge-meus-dados-${new Date().toISOString().slice(0, 10)}.json`
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      setEstado('ok')
      setMensagem('Arquivo baixado. Os links dos documentos expiram em 15 minutos.')
    } catch {
      setEstado('erro')
      setMensagem('Falha de rede. Tente novamente.')
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-green-50 text-[#166534]">
          <Download className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-gray-900">Exportar meus dados</h2>
          <p className="mt-1 text-sm text-gray-600">
            Você recebe um arquivo JSON com cadastro, entrevista, checklist,
            uploads (links temporários) e histórico de compras. Limite: 1
            exportação por dia.
          </p>
          <button
            onClick={baixar}
            disabled={estado === 'baixando'}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#166534] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#14532d] disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {estado === 'baixando' ? 'Gerando exportação…' : 'Gerar e baixar JSON'}
          </button>
          {mensagem && (
            <div
              className={`mt-3 flex items-start gap-2 rounded-lg p-3 text-sm ${
                estado === 'ok'
                  ? 'bg-green-50 text-green-900'
                  : 'bg-red-50 text-red-900'
              }`}
            >
              {estado === 'ok' ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
              ) : (
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              )}
              <p>{mensagem}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function CardExcluir({ email }: { email: string }) {
  const [estado, setEstado] = useState<'idle' | 'enviando' | 'enviado' | 'erro'>('idle')
  const [mensagem, setMensagem] = useState<string | null>(null)
  const [confirmado, setConfirmado] = useState(false)

  async function solicitar() {
    setEstado('enviando')
    setMensagem(null)
    try {
      const res = await fetch('/api/conta/excluir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setEstado('erro')
        setMensagem(json?.erro ?? 'Não foi possível enviar o pedido.')
        return
      }
      setEstado('enviado')
      setMensagem(
        json?.mensagem ??
          'E-mail de confirmação enviado. Clique no link para concluir a exclusão.'
      )
    } catch {
      setEstado('erro')
      setMensagem('Falha de rede. Tente novamente.')
    }
  }

  return (
    <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-700">
          <Trash2 className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-gray-900">Excluir minha conta</h2>
          <p className="mt-1 text-sm text-gray-600">
            Sua conta, processos, entrevistas, checklist e uploads ficam
            invisíveis e inacessíveis. Registros financeiros são arquivados
            conforme obrigação fiscal (5 anos, seção 7 da Política).
          </p>
          <p className="mt-2 text-sm text-gray-600">
            A confirmação é enviada para <strong>{email}</strong>. O link expira
            em 30 minutos.
          </p>

          <div className="mt-4 rounded-lg border border-red-100 bg-red-50 p-3">
            <label className="flex items-start gap-2 text-sm text-red-900">
              <input
                type="checkbox"
                checked={confirmado}
                onChange={(e) => setConfirmado(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-red-300 text-red-700 focus:ring-red-500"
              />
              <span>
                Eu entendo que esta ação é <strong>irreversível</strong> e que
                meus dados pessoais serão removidos do app.
              </span>
            </label>
          </div>

          <button
            onClick={solicitar}
            disabled={!confirmado || estado === 'enviando' || estado === 'enviado'}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {estado === 'enviando'
              ? 'Enviando e-mail…'
              : estado === 'enviado'
                ? 'E-mail enviado'
                : 'Solicitar exclusão'}
          </button>

          {mensagem && (
            <div
              className={`mt-3 flex items-start gap-2 rounded-lg p-3 text-sm ${
                estado === 'enviado'
                  ? 'bg-green-50 text-green-900'
                  : 'bg-red-50 text-red-900'
              }`}
            >
              {estado === 'enviado' ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
              ) : (
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              )}
              <p>{mensagem}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
