'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Download,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react'
import { PlanoBadge } from '@/components/ui/plano-badge'
import type { PlanoComercial } from '@/lib/plano'

export default function ContaDadosClient({
  nome,
  email,
  plano,
}: {
  nome: string
  email: string
  plano: PlanoComercial
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

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          {/* Header do card — identidade + plano */}
          <header className="border-b border-gray-100 px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#166534]">
              Conta · LGPD Art. 18
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-black text-gray-900">Meus dados</h1>
              <PlanoBadge plano={plano} size="md" />
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Olá, {nome}. Conta: <strong>{email}</strong>
            </p>
          </header>

          {/* Exportar — discreto com tooltip */}
          <section className="border-b border-gray-100 px-6 py-5">
            <ExportarBlock />
          </section>

          {/* Excluir — proeminente com disclaimer fiscal */}
          <section className="px-6 py-5">
            <ExcluirBlock email={email} />
          </section>
        </div>

        <p className="mt-8 text-xs text-gray-500">
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

function ExportarBlock() {
  const [estado, setEstado] = useState<'idle' | 'baixando' | 'ok' | 'erro'>('idle')
  const [mensagem, setMensagem] = useState<string | null>(null)
  const [mostrarTooltip, setMostrarTooltip] = useState(false)

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
    <div>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-1.5">
            <h2 className="text-sm font-semibold text-gray-900">Exportar meus dados</h2>
            <div
              className="relative"
              onMouseEnter={() => setMostrarTooltip(true)}
              onMouseLeave={() => setMostrarTooltip(false)}
              onFocus={() => setMostrarTooltip(true)}
              onBlur={() => setMostrarTooltip(false)}
            >
              <button
                type="button"
                aria-label="O que vai no arquivo"
                className="flex h-5 w-5 items-center justify-center rounded-full text-gray-400 hover:text-gray-600"
              >
                <HelpCircle className="h-4 w-4" />
              </button>
              {mostrarTooltip && (
                <div
                  role="tooltip"
                  className="absolute left-1/2 z-10 mt-1 w-64 -translate-x-1/2 rounded-lg border border-gray-200 bg-white p-3 text-xs text-gray-700 shadow-lg"
                >
                  <p className="font-semibold text-gray-900">O que vai no JSON:</p>
                  <ul className="mt-1 space-y-0.5 leading-relaxed text-gray-600">
                    <li>• Cadastro e perfil de lead</li>
                    <li>• Entrevista e mensagens</li>
                    <li>• Checklist e uploads (links temporários 15min)</li>
                    <li>• Compras e pagamentos</li>
                  </ul>
                  <p className="mt-1.5 text-[11px] text-gray-500">
                    Limite: 1 exportação por dia.
                  </p>
                </div>
              )}
            </div>
          </div>
          <p className="mt-0.5 text-xs text-gray-500">
            Arquivo JSON com todo seu histórico na plataforma.
          </p>
        </div>
        <button
          onClick={baixar}
          disabled={estado === 'baixando'}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:border-[#166534] hover:text-[#166534] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Download className="h-3.5 w-3.5" />
          {estado === 'baixando' ? 'Gerando…' : 'Baixar JSON'}
        </button>
      </div>
      {mensagem && (
        <div
          className={`mt-3 flex items-start gap-2 rounded-lg p-2.5 text-xs ${
            estado === 'ok' ? 'bg-green-50 text-green-900' : 'bg-red-50 text-red-900'
          }`}
        >
          {estado === 'ok' ? (
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
          ) : (
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
          )}
          <p>{mensagem}</p>
        </div>
      )}
    </div>
  )
}

function ExcluirBlock({ email }: { email: string }) {
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
      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean
        email_enviado?: boolean
        mensagem?: string
        erro?: string
      }
      if (res.ok && json.email_enviado) {
        setEstado('enviado')
        setMensagem(
          json.mensagem ?? 'E-mail enviado. Clique no link para concluir a exclusão.'
        )
        return
      }
      setEstado('erro')
      setMensagem(
        json?.mensagem ?? json?.erro ?? 'Não foi possível enviar o e-mail. Tente novamente.'
      )
      setConfirmado(true)
    } catch {
      setEstado('erro')
      setMensagem('Falha de rede. Tente novamente.')
    }
  }

  return (
    <div>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-700">
          <Trash2 className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-gray-900">Excluir minha conta</h2>
          <p className="mt-1 text-sm text-gray-600">
            Sua conta, entrevistas, checklist e uploads ficam invisíveis e
            inacessíveis. O acesso à plataforma é encerrado imediatamente após
            a confirmação por e-mail.
          </p>

          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            <p className="flex items-start gap-1.5">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
              <span>
                <strong>Obrigação fiscal:</strong> registros financeiros
                (compras, notas, webhooks de pagamento) ficam arquivados por
                até <strong>5 anos</strong> para cumprir a legislação
                tributária brasileira (Lei 5.172/66 — CTN, art. 174). Esses
                dados saem do app, mas permanecem na base fiscal arquivada.
                Detalhes na seção 7 da{' '}
                <Link
                  href="/privacidade"
                  className="font-semibold underline hover:text-amber-950"
                >
                  Política de Privacidade
                </Link>
                .
              </span>
            </p>
          </div>

          <p className="mt-3 text-xs text-gray-500">
            A confirmação é enviada para <strong>{email}</strong>. O link
            expira em 30 minutos.
          </p>

          <div className="mt-3 rounded-lg border border-red-100 bg-red-50 p-3">
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
            className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-red-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {estado === 'enviando'
              ? 'Enviando e-mail…'
              : estado === 'enviado'
                ? 'E-mail enviado'
                : estado === 'erro'
                  ? 'Tentar novamente'
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
