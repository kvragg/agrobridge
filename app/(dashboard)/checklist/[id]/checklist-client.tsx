'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Upload,
  FileCheck,
  Loader2,
  AlertTriangle,
  FileText,
  X,
  Paperclip,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { sanitizarNomeArquivo, slugDocumento } from '@/lib/validation'
import { linkOficialPara } from '@/lib/checklist/links-oficiais'
import UploadDocumento from '@/components/checklist/UploadDocumento'
import DossieCard from '@/components/checklist/DossieCard'
import { EntrevistaCTA } from '@/components/shell/EntrevistaCTA'

interface Arquivo {
  nome: string
  tamanho: number
  url?: string
  carregando?: boolean
}

interface ChecklistClientProps {
  processoId: string
  banco: string | null
  valor: number | null
  checklistMdInicial: string | null
  perfilDisponivel: boolean
}

export default function ChecklistClient({
  processoId,
  banco,
  valor,
  checklistMdInicial,
  perfilDisponivel,
}: ChecklistClientProps) {
  const [checklistMd, setChecklistMd] = useState<string | null>(checklistMdInicial)
  const [carregandoChecklist, setCarregandoChecklist] = useState(!checklistMdInicial)
  const [erroChecklist, setErroChecklist] = useState('')
  const [arquivos, setArquivos] = useState<Arquivo[]>([])
  const [carregandoArquivos, setCarregandoArquivos] = useState(true)
  const [enviandoArquivo, setEnviandoArquivo] = useState(false)
  const [erroUpload, setErroUpload] = useState('')
  const [secaoUploadAberta, setSecaoUploadAberta] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const supabase = createClient()

  // Gerar checklist se não tiver
  useEffect(() => {
    if (checklistMd || !perfilDisponivel) {
      setCarregandoChecklist(false)
      return
    }

    async function gerarChecklist() {
      try {
        const res = await fetch('/api/checklist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ processo_id: processoId }),
        })
        const payload = await res.json().catch(() => null)
        if (!res.ok) {
          console.error('[checklist] API falhou', res.status, payload)
          throw new Error(payload?.erro ?? 'Erro ao gerar checklist')
        }
        setChecklistMd(payload.checklist)
      } catch (err) {
        setErroChecklist(
          err instanceof Error && err.message
            ? err.message
            : 'Não foi possível gerar o checklist. Tente recarregar a página.'
        )
      } finally {
        setCarregandoChecklist(false)
      }
    }

    gerarChecklist()
  }, [checklistMd, perfilDisponivel, processoId])

  // Carregar arquivos "outros" (não associados a um documento específico)
  useEffect(() => {
    async function carregarArquivos() {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) {
        setCarregandoArquivos(false)
        return
      }

      const prefixo = `${user.user.id}/${processoId}/outros`
      const { data } = await supabase.storage.from('documentos').list(prefixo)

      if (data && data.length > 0) {
        const arqComUrl = await Promise.all(
          data.map(async (f) => {
            const { data: urlData } = await supabase.storage
              .from('documentos')
              .createSignedUrl(`${prefixo}/${f.name}`, 120)
            return {
              nome: f.name,
              tamanho: f.metadata?.size ?? 0,
              url: urlData?.signedUrl,
            }
          })
        )
        setArquivos(arqComUrl)
      }
      setCarregandoArquivos(false)
    }

    carregarArquivos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processoId])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setErroUpload('')

    const MAX_MB = 10
    if (file.size > MAX_MB * 1024 * 1024) {
      setErroUpload(`Arquivo muito grande. Máximo: ${MAX_MB}MB.`)
      return
    }

    const TIPOS_ACEITOS = ['application/pdf', 'image/jpeg', 'image/png']
    const EXT_ACEITAS = /\.(pdf|jpe?g|png)$/i
    if (!TIPOS_ACEITOS.includes(file.type) || !EXT_ACEITAS.test(file.name)) {
      setErroUpload('Tipo de arquivo não suportado. Use PDF, JPG ou PNG.')
      return
    }

    setEnviandoArquivo(true)
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      setErroUpload('Sessão expirada. Faça login novamente.')
      setEnviandoArquivo(false)
      return
    }

    const nomeSanitizado = sanitizarNomeArquivo(file.name)
    const storedName = `${Date.now()}_${nomeSanitizado}`
    const path = `${user.user.id}/${processoId}/outros/${storedName}`

    const { error } = await supabase.storage
      .from('documentos')
      .upload(path, file, { upsert: false })

    if (error) {
      setErroUpload('Erro ao enviar arquivo. Tente novamente.')
      setEnviandoArquivo(false)
      return
    }

    const { data: urlData } = await supabase.storage
      .from('documentos')
      .createSignedUrl(path, 120)

    setArquivos((prev) => [
      ...prev,
      {
        nome: storedName,
        tamanho: file.size,
        url: urlData?.signedUrl,
      },
    ])
    setEnviandoArquivo(false)

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleRemover(nome: string) {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) return

    const path = `${user.user.id}/${processoId}/outros/${nome}`
    await supabase.storage.from('documentos').remove([path])
    setArquivos((prev) => prev.filter((a) => a.nome !== nome))
  }

  // ── Render ───────────────────────────────────────────────────────

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-black text-gray-900 sm:text-2xl">
          Checklist de Documentos
        </h1>
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
          {banco && (
            <span className="flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 font-medium text-blue-700">
              {banco}
            </span>
          )}
          {valor && (
            <span>
              R$ {valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-gray-400">
          Envie cada documento clicando no botão correspondente no card.
        </p>
      </div>

      {/* Checklist Section */}
      <div className="rounded-2xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#166534]" />
            <h2 className="font-bold text-gray-900">Documentos necessários</h2>
          </div>
          <p className="mt-0.5 text-xs text-gray-400">
            Lista personalizada com passo a passo e upload individual de cada documento
          </p>
        </div>

        <div className="p-4 sm:p-6">
          {carregandoChecklist && (
            <div className="flex flex-col items-center gap-3 py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#166534]" />
              <p className="text-sm text-gray-500">
                A IA está gerando seu checklist personalizado...
              </p>
              <p className="text-xs text-gray-400">Isso pode levar até 60 segundos</p>
            </div>
          )}

          {erroChecklist && (
            <div className="flex items-start gap-3 rounded-xl bg-red-50 p-4">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-500" />
              <div>
                <p className="text-sm font-medium text-red-700">{erroChecklist}</p>
                <button
                  onClick={() => {
                    setErroChecklist('')
                    setCarregandoChecklist(true)
                    setChecklistMd(null)
                  }}
                  className="mt-1 text-xs text-red-600 underline"
                >
                  Tentar novamente
                </button>
              </div>
            </div>
          )}

          {!perfilDisponivel && !checklistMd && !carregandoChecklist && (
            <div className="rounded-xl bg-yellow-50 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 flex-shrink-0 text-yellow-600" />
                <p className="text-sm text-yellow-700">
                  A entrevista ainda não foi concluída. Volte para a entrevista para finalizar.
                </p>
              </div>
              <EntrevistaCTA iniciada />
            </div>
          )}

          {checklistMd && (
            <ChecklistMarkdown markdown={checklistMd} processoId={processoId} />
          )}
        </div>
      </div>

      {/* Dossiê / Cobrança */}
      <DossieCard
        processoId={processoId}
        perfilDisponivel={perfilDisponivel}
        checklistGerado={!!checklistMd}
      />

      {/* Outros documentos (upload não associado) */}
      <div className="rounded-2xl border border-gray-200 bg-white">
        <button
          onClick={() => setSecaoUploadAberta(!secaoUploadAberta)}
          className="flex min-h-[48px] w-full items-center justify-between border-b border-gray-100 px-4 py-4 sm:px-6"
        >
          <div className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-[#166534]" />
            <h2 className="font-bold text-gray-900">Outros documentos</h2>
            {arquivos.length > 0 && (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-[#166534]">
                {arquivos.length}
              </span>
            )}
          </div>
          {secaoUploadAberta ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </button>

        {secaoUploadAberta && (
          <div className="p-4 sm:p-6">
            <p className="mb-4 text-xs text-gray-500">
              Envie aqui arquivos adicionais que não correspondem a um documento específico da lista acima.
            </p>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 px-6 py-10 transition-colors hover:border-[#166534]/40 hover:bg-green-50"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
                <Upload className="h-5 w-5 text-[#166534]" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-700">
                  Clique para enviar um arquivo
                </p>
                <p className="mt-0.5 text-xs text-gray-400">
                  PDF, JPG, PNG ou WebP — máximo 100MB por arquivo
                </p>
              </div>
              {enviandoArquivo && (
                <div className="flex items-center gap-2 text-sm text-[#166534]">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando...
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              onChange={handleUpload}
              disabled={enviandoArquivo}
              className="hidden"
            />

            {erroUpload && (
              <p className="mt-3 flex items-center gap-1.5 text-sm text-red-600">
                <AlertTriangle className="h-4 w-4" />
                {erroUpload}
              </p>
            )}

            {carregandoArquivos && (
              <div className="mt-4 flex justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
              </div>
            )}

            {!carregandoArquivos && arquivos.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Arquivos enviados
                </p>
                {arquivos.map((arq) => (
                  <div
                    key={arq.nome}
                    className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
                  >
                    <FileCheck className="h-5 w-5 flex-shrink-0 text-[#16a34a]" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-800">
                        {arq.nome.replace(/^\d+_/, '')}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatarTamanho(arq.tamanho)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {arq.url && (
                        <a
                          href={arq.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Abrir documento"
                          className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                      <button
                        onClick={() => handleRemover(arq.nome)}
                        aria-label="Remover arquivo"
                        className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!carregandoArquivos && arquivos.length === 0 && (
              <p className="mt-4 text-center text-sm text-gray-400">
                Nenhum arquivo extra enviado.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Markdown Renderer ─────────────────────────────────────────────

function ChecklistMarkdown({
  markdown,
  processoId,
}: {
  markdown: string
  processoId: string
}) {
  const sections = parseChecklist(markdown)

  return (
    <div className="space-y-6">
      {sections.map((section, i) => (
        <ChecklistSection key={i} section={section} processoId={processoId} />
      ))}
    </div>
  )
}

interface Section {
  titulo: string
  emoji: string
  conteudo: string[]
}

function parseChecklist(markdown: string): Section[] {
  const lines = markdown.split('\n')
  const sections: Section[] = []
  let currentSection: Section | null = null

  for (const line of lines) {
    const h3Match = line.match(/^###\s+(.+)$/)
    if (h3Match) {
      if (currentSection) sections.push(currentSection)
      const titulo = h3Match[1]
      const emoji = titulo.match(/^\p{Emoji}/u)?.[0] ?? '📋'
      currentSection = {
        titulo: titulo.replace(/^\p{Emoji}\s*/u, '').trim(),
        emoji,
        conteudo: [],
      }
      continue
    }

    if (currentSection && line.trim()) {
      currentSection.conteudo.push(line)
    }
  }

  if (currentSection) sections.push(currentSection)
  return sections
}

function ChecklistSection({
  section,
  processoId,
}: {
  section: Section
  processoId: string
}) {
  const [aberta, setAberta] = useState(true)
  const isBlocker = section.titulo.toUpperCase().includes('REGULARIZAR')

  const bgColor = isBlocker
    ? 'bg-red-50 border-red-200'
    : 'bg-white border-gray-200'
  const headerColor = isBlocker ? 'text-red-700' : 'text-gray-800'

  return (
    <div className={`rounded-xl border ${bgColor} overflow-hidden`}>
      <button
        onClick={() => setAberta(!aberta)}
        className={`flex min-h-[48px] w-full items-center justify-between px-4 py-4 sm:px-5 ${isBlocker ? 'bg-red-50' : 'bg-gray-50/50'}`}
      >
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{section.emoji}</span>
          <h3 className={`font-bold text-sm ${headerColor}`}>
            {section.titulo}
          </h3>
        </div>
        {aberta ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>

      {aberta && (
        <div className="px-4 py-4 sm:px-5">
          <MarkdownContent lines={section.conteudo} processoId={processoId} />
        </div>
      )}
    </div>
  )
}

function MarkdownContent({
  lines,
  processoId,
}: {
  lines: string[]
  processoId: string
}) {
  const elementos: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Documento (bold title)
    if (line.match(/^\*\*[^*]+\*\*$/)) {
      const nome = line.replace(/^\*\*|\*\*$/g, '')
      const bloco: string[] = [line]
      i++
      while (i < lines.length && !lines[i].match(/^\*\*[^*]+\*\*$/) && lines[i].trim()) {
        bloco.push(lines[i])
        i++
      }
      elementos.push(
        <DocumentoItem
          key={i}
          nome={nome}
          detalhes={bloco.slice(1)}
          processoId={processoId}
        />
      )
      continue
    }

    // Já tem emoji de ✅
    if (line.startsWith('✅')) {
      elementos.push(
        <p key={i} className="flex items-start gap-2 text-sm text-green-700">
          <span>✅</span>
          <span>{line.slice(1).trim()}</span>
        </p>
      )
      i++
      continue
    }

    // Separador
    if (line.trim() === '---') {
      i++
      continue
    }

    // Linha com conteúdo
    if (line.trim()) {
      elementos.push(
        <p key={i} className="text-sm text-gray-600">
          <InlineMarkdown text={line} />
        </p>
      )
    }
    i++
  }

  return <div className="space-y-4">{elementos}</div>
}

function DocumentoItem({
  nome,
  detalhes,
  processoId,
}: {
  nome: string
  detalhes: string[]
  processoId: string
}) {
  const [expandido, setExpandido] = useState(false)
  const temDetalhes = detalhes.length > 0
  const docSlug = slugDocumento(nome)
  const linkOficial = linkOficialPara(nome)

  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50/50 overflow-hidden">
      <button
        onClick={() => setExpandido(!expandido)}
        disabled={!temDetalhes}
        className="flex min-h-[48px] w-full items-start gap-3 px-4 py-3 text-left"
      >
        <Paperclip className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#166534]" />
        <span className="flex-1 text-sm font-semibold text-gray-800">{nome}</span>
        {temDetalhes && (
          expandido ? (
            <ChevronUp className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
          ) : (
            <ChevronDown className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
          )
        )}
      </button>

      {linkOficial && (
        <div className="border-t border-gray-100 bg-white px-4 py-2">
          <a
            href={linkOficial.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-[#166534]/10 px-3 py-2 text-xs font-semibold text-[#166534] hover:bg-[#166534]/15"
          >
            {linkOficial.label}
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          {linkOficial.aviso && (
            <p className="mt-1.5 text-[11px] text-gray-500">{linkOficial.aviso}</p>
          )}
        </div>
      )}

      {expandido && detalhes.length > 0 && (
        <div className="border-t border-gray-100 px-4 py-3 space-y-1.5">
          {detalhes.map((d, i) => (
            <p key={i} className="text-xs leading-relaxed text-gray-600">
              <InlineMarkdown text={d} />
            </p>
          ))}
        </div>
      )}

      <UploadDocumento
        processoId={processoId}
        docSlug={docSlug}
        nomeDocumento={nome}
      />
    </div>
  )
}

function InlineMarkdown({ text }: { text: string }) {
  // Links: 🔗 [texto](url)
  const linkRegex = /🔗\s*\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g
  const parts: React.ReactNode[] = []
  let last = 0
  let match: RegExpExecArray | null

  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(renderBold(text.slice(last, match.index), `pre-${match.index}`))
    }
    parts.push(
      <a
        key={match.index}
        href={match[2]}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-[#166534] hover:underline"
      >
        🔗 {match[1]}
        <ExternalLink className="h-3 w-3" />
      </a>
    )
    last = match.index + match[0].length
  }

  if (last < text.length) {
    parts.push(renderBold(text.slice(last), `end`))
  }

  return <>{parts}</>
}

function renderBold(text: string, key: string): React.ReactNode {
  const boldRegex = /\*\*([^*]+)\*\*/g
  const parts: React.ReactNode[] = []
  let last = 0
  let match: RegExpExecArray | null

  while ((match = boldRegex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index))
    parts.push(<strong key={match.index}>{match[1]}</strong>)
    last = match.index + match[0].length
  }

  if (last < text.length) parts.push(text.slice(last))
  return <span key={key}>{parts}</span>
}

function formatarTamanho(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
