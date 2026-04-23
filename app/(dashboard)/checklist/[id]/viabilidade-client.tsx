'use client'

import { useState, useEffect } from 'react'
import {
  FileText,
  Loader2,
  AlertTriangle,
  Download,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react'
import { EntrevistaCTA } from '@/components/shell/EntrevistaCTA'

interface ViabilidadeClientProps {
  processoId: string
  parecerMdInicial: string | null
  perfilDisponivel: boolean
}

export default function ViabilidadeClient({
  processoId,
  parecerMdInicial,
  perfilDisponivel,
}: ViabilidadeClientProps) {
  const [parecerMd, setParecerMd] = useState<string | null>(parecerMdInicial)
  const [carregando, setCarregando] = useState(!parecerMdInicial && perfilDisponivel)
  const [erro, setErro] = useState('')
  const [urlPdf, setUrlPdf] = useState<string | null>(null)
  const [gerandoPdf, setGerandoPdf] = useState(false)

  useEffect(() => {
    if (parecerMd || !perfilDisponivel) {
      setCarregando(false)
      return
    }
    gerar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perfilDisponivel])

  async function gerar(forcar = false) {
    setErro('')
    setCarregando(true)
    setGerandoPdf(true)
    try {
      const res = await fetch('/api/viabilidade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ processo_id: processoId, forcar }),
      })
      const payload = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(payload?.erro ?? 'Erro ao gerar parecer')
      }
      setParecerMd(payload.parecer_md ?? null)
      setUrlPdf(payload.url ?? null)
    } catch (err) {
      setErro(
        err instanceof Error && err.message
          ? err.message
          : 'Não foi possível gerar o parecer. Tente novamente.'
      )
    } finally {
      setCarregando(false)
      setGerandoPdf(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <div className="flex flex-col gap-1">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-[#166534]">
          <Sparkles className="h-3 w-3" />
          Diagnóstico Rápido
        </span>
        <h1 className="text-xl font-black text-gray-900 sm:text-2xl">
          Seu Parecer de Viabilidade
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Leitura técnica do seu caso, no padrão de mesa de crédito. Curto, direto e útil.
        </p>
      </div>

      {!perfilDisponivel && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 text-yellow-600" />
            <p className="text-sm text-yellow-700">
              Conclua a entrevista para liberar seu parecer.
            </p>
          </div>
          <EntrevistaCTA iniciada={false} />
        </div>
      )}

      {carregando && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-gray-200 bg-white py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[#166534]" />
          <p className="text-sm text-gray-500">A IA está redigindo seu parecer técnico...</p>
          <p className="text-xs text-gray-400">Pode levar até 30 segundos</p>
        </div>
      )}

      {erro && !carregando && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-500" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-700">{erro}</p>
            <button
              onClick={() => gerar(true)}
              className="mt-1 text-xs text-red-600 underline"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      )}

      {parecerMd && !carregando && (
        <>
          <div className="rounded-2xl border border-gray-200 bg-white">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4 sm:px-6">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#166534]" />
                <h2 className="font-bold text-gray-900">Parecer de Viabilidade</h2>
              </div>
              {urlPdf ? (
                <a
                  href={urlPdf}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-[40px] items-center gap-1.5 rounded-lg bg-[#166534] px-3 text-sm font-semibold text-white hover:bg-[#14532d]"
                >
                  <Download className="h-4 w-4" />
                  Baixar PDF
                </a>
              ) : (
                <button
                  onClick={() => gerar(true)}
                  disabled={gerandoPdf}
                  className="flex min-h-[40px] items-center gap-1.5 rounded-lg border border-gray-300 px-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                >
                  {gerandoPdf ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Gerar PDF
                </button>
              )}
            </div>

            <article className="prose prose-sm max-w-none px-4 py-6 sm:px-6">
              <ParecerMarkdown markdown={parecerMd} />
            </article>
          </div>

          <UpgradeCard />
        </>
      )}
    </div>
  )
}

function ParecerMarkdown({ markdown }: { markdown: string }) {
  // Renderização leve — Headings, bullets, bold inline, hr.
  const linhas = markdown.split('\n')
  const blocos: React.ReactNode[] = []
  let listaBuffer: string[] = []
  let key = 0

  function flushLista() {
    if (listaBuffer.length === 0) return
    blocos.push(
      <ul key={key++} className="my-3 list-disc space-y-1 pl-5 text-gray-700">
        {listaBuffer.map((item, i) => (
          <li key={i}>{renderInline(item)}</li>
        ))}
      </ul>
    )
    listaBuffer = []
  }

  for (const bruta of linhas) {
    const l = bruta.trimEnd()
    if (!l.trim()) {
      flushLista()
      continue
    }
    if (l.startsWith('## ')) {
      flushLista()
      blocos.push(
        <h2 key={key++} className="mt-6 text-lg font-black text-[#166534]">
          {l.slice(3).trim()}
        </h2>
      )
      continue
    }
    if (l.startsWith('### ')) {
      flushLista()
      blocos.push(
        <h3 key={key++} className="mt-4 text-base font-bold text-gray-900">
          {l.slice(4).trim()}
        </h3>
      )
      continue
    }
    if (l.trim() === '---') {
      flushLista()
      blocos.push(<hr key={key++} className="my-4 border-gray-200" />)
      continue
    }
    if (/^\s*[-•]\s+/.test(l)) {
      listaBuffer.push(l.replace(/^\s*[-•]\s+/, ''))
      continue
    }
    if (/^\*[^*].*\*$/.test(l.trim())) {
      flushLista()
      const t = l.trim().replace(/^\*|\*$/g, '')
      blocos.push(
        <p key={key++} className="my-3 text-xs italic text-gray-500">
          {t}
        </p>
      )
      continue
    }
    flushLista()
    blocos.push(
      <p key={key++} className="my-2 text-gray-700">
        {renderInline(l)}
      </p>
    )
  }
  flushLista()
  return <>{blocos}</>
}

function renderInline(texto: string): React.ReactNode {
  const partes: React.ReactNode[] = []
  const re = /\*\*([^*]+)\*\*/g
  let last = 0
  let m: RegExpExecArray | null
  let i = 0
  while ((m = re.exec(texto)) !== null) {
    if (m.index > last) {
      partes.push(<span key={i++}>{texto.slice(last, m.index)}</span>)
    }
    partes.push(
      <strong key={i++} className="font-bold text-gray-900">
        {m[1]}
      </strong>
    )
    last = m.index + m[0].length
  }
  if (last < texto.length) {
    partes.push(<span key={i++}>{texto.slice(last)}</span>)
  }
  return partes.length > 0 ? partes : texto
}

function UpgradeCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#166534]/20 bg-gradient-to-br from-[#0f3d2e] to-[#14532d] p-6 text-white sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white/10">
          <FileText className="h-6 w-6 text-[#86efac]" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#86efac]">
            Próximo passo natural
          </p>
          <h3 className="mt-1 text-xl font-black leading-tight">
            Quer chegar no banco com o pedido pronto?
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-green-100">
            O <strong className="text-white">Dossiê Bancário Completo</strong> traz o checklist
            personalizado com passo a passo de cada documento, a defesa técnica de crédito redigida
            em linguagem de comitê e o PDF consolidado pronto pra entregar ao gerente.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href="/planos"
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#0f3d2e] transition-colors hover:bg-green-50"
            >
              Ver planos e fazer upgrade
              <ArrowUpRight className="h-4 w-4" />
            </a>
            <span className="text-xs text-green-200">Pagamento único, sem fidelidade</span>
          </div>
        </div>
      </div>
    </div>
  )
}
