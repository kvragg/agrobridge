'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  FileText,
  Loader2,
  AlertTriangle,
  Download,
  CheckCircle2,
  Copy,
  QrCode,
  Clock,
} from 'lucide-react'

interface DossieCardProps {
  processoId: string
  perfilDisponivel: boolean
  checklistGerado: boolean
}

interface PagamentoState {
  status?: string
  qr_code?: string
  qr_code_url?: string
  expires_at?: string | null
  valor_centavos?: number
  pago_em?: string
}

export default function DossieCard({
  processoId,
  perfilDisponivel,
  checklistGerado,
}: DossieCardProps) {
  const [pagamento, setPagamento] = useState<PagamentoState | null>(null)
  const [carregandoStatus, setCarregandoStatus] = useState(true)
  const [criandoCobranca, setCriandoCobranca] = useState(false)
  const [gerandoDossie, setGerandoDossie] = useState(false)
  const [urlDossie, setUrlDossie] = useState<string | null>(null)
  const [erro, setErro] = useState('')
  const [pendentes, setPendentes] = useState<
    { categoria: string; nome: string }[] | null
  >(null)
  const [copiado, setCopiado] = useState(false)

  const pronto = perfilDisponivel && checklistGerado

  const carregarStatus = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/pagamento/status?processo_id=${processoId}`,
        { cache: 'no-store' }
      )
      if (!res.ok) {
        setCarregandoStatus(false)
        return
      }
      const data = (await res.json()) as PagamentoState & { status?: string }
      if (data.status && data.status !== 'none') {
        setPagamento(data)
      }
    } finally {
      setCarregandoStatus(false)
    }
  }, [processoId])

  useEffect(() => {
    carregarStatus()
  }, [carregarStatus])

  // Polling se pending
  useEffect(() => {
    if (pagamento?.status !== 'pending') return
    const t = setInterval(carregarStatus, 5000)
    return () => clearInterval(t)
  }, [pagamento?.status, carregarStatus])

  async function criarCobranca() {
    setErro('')
    setCriandoCobranca(true)
    try {
      const res = await fetch('/api/pagamento/criar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ processo_id: processoId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data?.erro ?? 'Falha ao criar cobrança')
      }
      setPagamento(data)
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao criar cobrança')
    } finally {
      setCriandoCobranca(false)
    }
  }

  async function gerarDossie() {
    setErro('')
    setPendentes(null)
    setGerandoDossie(true)
    try {
      const res = await fetch('/api/dossie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ processo_id: processoId }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.status === 409 && Array.isArray(data?.pendentes)) {
        setPendentes(data.pendentes as { categoria: string; nome: string }[])
        setErro(data.erro ?? 'Dossiê bloqueado: há documentos pendentes.')
        return
      }
      if (!res.ok) {
        throw new Error(data?.erro ?? 'Falha ao gerar dossiê')
      }
      setUrlDossie(data.url)
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao gerar dossiê')
    } finally {
      setGerandoDossie(false)
    }
  }

  function copiarPix() {
    if (!pagamento?.qr_code) return
    navigator.clipboard.writeText(pagamento.qr_code)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  const valorBRL = `R$ ${((pagamento?.valor_centavos ?? 29700) / 100).toLocaleString(
    'pt-BR',
    { minimumFractionDigits: 2 }
  )}`

  // ── Render ───────────────────────────────────────────────────────

  return (
    <div className="rounded-2xl border border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-[#166534]" />
          <h2 className="font-bold text-gray-900">Dossiê final de crédito</h2>
        </div>
        <p className="mt-0.5 text-xs text-gray-400">
          PDF com defesa técnica, checklist e documentos anexados — pronto para entregar ao banco
        </p>
      </div>

      <div className="p-4 sm:p-6">
        {!pronto && (
          <div className="flex items-start gap-3 rounded-xl bg-yellow-50 p-4">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 text-yellow-600" />
            <p className="text-sm text-yellow-700">
              {!perfilDisponivel
                ? 'Conclua a entrevista antes de gerar o dossiê.'
                : 'O checklist precisa ser gerado antes do dossiê.'}
            </p>
          </div>
        )}

        {carregandoStatus && pronto && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
          </div>
        )}

        {pronto && !carregandoStatus && pagamento?.status === 'paid' && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-green-800">
                  Pagamento confirmado
                </p>
                <p className="mt-0.5 text-xs text-green-700">
                  Seu dossiê final está liberado para download.
                </p>
              </div>
            </div>

            {!urlDossie && (
              <button
                onClick={gerarDossie}
                disabled={gerandoDossie}
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#166534] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#14532d] disabled:opacity-60"
              >
                {gerandoDossie ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Montando PDF... (pode levar 1 minuto)
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4" />
                    Gerar e baixar dossiê final
                  </>
                )}
              </button>
            )}

            {urlDossie && (
              <a
                href={urlDossie}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#166534] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#14532d]"
              >
                <Download className="h-4 w-4" />
                Baixar dossiê.pdf
              </a>
            )}
          </div>
        )}

        {pronto && !carregandoStatus && pagamento?.status === 'pending' && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <Clock className="h-5 w-5 flex-shrink-0 text-amber-600" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-800">
                  Aguardando pagamento via PIX
                </p>
                <p className="mt-0.5 text-xs text-amber-700">
                  Valor: <strong>{valorBRL}</strong>. Assim que confirmado, o dossiê é liberado automaticamente.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex flex-col items-center gap-3">
                {pagamento.qr_code_url ? (
                  <img
                    src={pagamento.qr_code_url}
                    alt="QR Code PIX"
                    className="h-48 w-48 rounded-lg border border-gray-200 bg-white p-2"
                  />
                ) : (
                  <div className="flex h-48 w-48 items-center justify-center rounded-lg border border-gray-200 bg-white">
                    <QrCode className="h-12 w-12 text-gray-300" />
                  </div>
                )}
                <p className="text-xs text-gray-500">
                  Escaneie com o app do seu banco ou copie o código abaixo
                </p>
              </div>

              <div className="mt-4">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  PIX Copia e Cola
                </label>
                <div className="mt-1 flex flex-col items-stretch gap-2 sm:flex-row">
                  <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap rounded-lg bg-white px-3 py-2 text-xs text-gray-700">
                    {pagamento.qr_code}
                  </code>
                  <button
                    onClick={copiarPix}
                    className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg bg-[#166534] px-4 text-sm font-semibold text-white hover:bg-[#14532d] sm:text-xs"
                  >
                    <Copy className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                    {copiado ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                <Loader2 className="h-3 w-3 animate-spin" />
                Verificando pagamento a cada 5s...
              </div>
            </div>
          </div>
        )}

        {pronto && !carregandoStatus && (!pagamento || pagamento.status === 'failed') && (
          <div className="space-y-3">
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <div className="flex items-baseline justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Dossiê final
                  </p>
                  <p className="mt-1 text-2xl font-black text-gray-900">R$ 297,00</p>
                </div>
                <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-[#166534]">
                  PIX
                </span>
              </div>
              <ul className="mt-3 space-y-1.5 text-xs text-gray-600">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="mt-0.5 h-3 w-3 flex-shrink-0 text-[#16a34a]" />
                  Defesa técnica pró-aprovação redigida pela IA
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="mt-0.5 h-3 w-3 flex-shrink-0 text-[#16a34a]" />
                  Checklist personalizado por perfil e banco
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="mt-0.5 h-3 w-3 flex-shrink-0 text-[#16a34a]" />
                  PDF consolidado com seus documentos anexados
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="mt-0.5 h-3 w-3 flex-shrink-0 text-[#16a34a]" />
                  Pronto para entregar ao gerente do banco
                </li>
              </ul>
            </div>

            <button
              onClick={criarCobranca}
              disabled={criandoCobranca}
              className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#166534] px-4 py-4 text-base font-semibold text-white shadow-sm transition-colors hover:bg-[#14532d] disabled:opacity-60"
            >
              {criandoCobranca ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Gerando PIX...
                </>
              ) : (
                <>
                  <QrCode className="h-5 w-5" />
                  Pagar R$ 297 via PIX
                </>
              )}
            </button>

            <p className="text-center text-xs text-gray-400">
              Cobrança única. O pagamento é independente da aprovação bancária.
            </p>
          </div>
        )}

        {erro && (
          <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <div className="flex-1">
              <p>{erro}</p>
              {pendentes && pendentes.length > 0 && (
                <div className="mt-2">
                  <p className="font-semibold">Documentos faltantes:</p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs">
                    {pendentes.map((p, i) => (
                      <li key={i}>
                        <span className="text-red-600/70">{p.categoria}:</span>{' '}
                        {p.nome}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
