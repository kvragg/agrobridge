'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Upload,
  Loader2,
  AlertTriangle,
  FileCheck,
  ExternalLink,
  X,
  Plus,
  CheckCircle2,
  ShieldAlert,
  ShieldX,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { sanitizarNomeArquivo } from '@/lib/validation'

type ValidacaoStatus = 'ok' | 'atencao' | 'invalido'

interface Validacao {
  status: ValidacaoStatus
  tipo_detectado?: string
  resumo?: string
  pendencias?: string[]
  observacao_banco?: string
  validado_em?: string
}

interface Arquivo {
  nome: string
  tamanho: number
  storagePath: string
  url?: string
  validando?: boolean
  validacao?: Validacao
  erroValidacao?: string
}

interface UploadDocumentoProps {
  processoId: string
  docSlug: string
  nomeDocumento: string
}

const MAX_MB = 100
const TIPOS_ACEITOS = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]
const EXT_ACEITAS = /\.(pdf|jpe?g|png|webp)$/i

export default function UploadDocumento({
  processoId,
  docSlug,
  nomeDocumento,
}: UploadDocumentoProps) {
  const [arquivos, setArquivos] = useState<Arquivo[]>([])
  const [carregando, setCarregando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => {
    async function carregar() {
      const { data: userData } = await supabase.auth.getUser()
      const user = userData.user
      if (!user) {
        setCarregando(false)
        return
      }

      const prefixo = `${user.id}/${processoId}/${docSlug}`
      const { data } = await supabase.storage.from('documentos').list(prefixo)

      // Carregar validações persistidas do processo
      const { data: procRow } = await supabase
        .from('processos')
        .select('perfil_json')
        .eq('id', processoId)
        .single()
      const perfilJson =
        (procRow?.perfil_json as Record<string, unknown> | null) ?? {}
      const validacoesMap =
        (perfilJson._validacoes as Record<string, Validacao[]> | undefined) ?? {}
      const validacoesDoc = validacoesMap[docSlug] ?? []

      if (data && data.length > 0) {
        const lista = await Promise.all(
          data.map(async (f) => {
            const path = `${prefixo}/${f.name}`
            const { data: urlData } = await supabase.storage
              .from('documentos')
              .createSignedUrl(path, 120)
            // Match a validação mais recente para esse storage_path
            const v = validacoesDoc.find(
              (x) => (x as Validacao & { storage_path?: string }).storage_path === path
            )
            return {
              nome: f.name,
              tamanho: f.metadata?.size ?? 0,
              storagePath: path,
              url: urlData?.signedUrl,
              validacao: v,
            } as Arquivo
          })
        )
        setArquivos(lista)
      }
      setCarregando(false)
    }
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processoId, docSlug])

  async function validarArquivo(path: string) {
    setArquivos((prev) =>
      prev.map((a) =>
        a.storagePath === path ? { ...a, validando: true, erroValidacao: undefined } : a
      )
    )
    try {
      const res = await fetch('/api/documento/validar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          processo_id: processoId,
          doc_slug: docSlug,
          nome_documento: nomeDocumento,
          storage_path: path,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data?.erro ?? 'Falha na validação')
      }
      setArquivos((prev) =>
        prev.map((a) =>
          a.storagePath === path
            ? { ...a, validando: false, validacao: data.resultado, erroValidacao: undefined }
            : a
        )
      )
    } catch (err) {
      setArquivos((prev) =>
        prev.map((a) =>
          a.storagePath === path
            ? {
                ...a,
                validando: false,
                erroValidacao:
                  err instanceof Error ? err.message : 'Erro ao validar',
              }
            : a
        )
      )
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setErro('')

    if (file.size > MAX_MB * 1024 * 1024) {
      setErro(`Arquivo passou de ${MAX_MB}MB. Comprima o PDF ou envie uma página por vez.`)
      return
    }
    if (!TIPOS_ACEITOS.includes(file.type) || !EXT_ACEITAS.test(file.name)) {
      setErro('Só aceita PDF, JPG ou PNG aqui.')
      return
    }

    setEnviando(true)
    const { data: userData } = await supabase.auth.getUser()
    const user = userData.user
    if (!user) {
      setErro('Sua sessão expirou. Entre de novo pra continuar.')
      setEnviando(false)
      return
    }

    const nomeSanitizado = sanitizarNomeArquivo(file.name)
    const storedName = `${Date.now()}_${nomeSanitizado}`
    const path = `${user.id}/${processoId}/${docSlug}/${storedName}`

    const { error: upErr } = await supabase.storage
      .from('documentos')
      .upload(path, file, { upsert: false })

    if (upErr) {
      setErro('Não deu pra enviar. Confira sua conexão e tente de novo.')
      setEnviando(false)
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
        storagePath: path,
        url: urlData?.signedUrl,
      },
    ])
    setEnviando(false)
    if (inputRef.current) inputRef.current.value = ''

    // Dispara validação em background
    validarArquivo(path)
  }

  async function handleRemover(arq: Arquivo) {
    const { data: userData } = await supabase.auth.getUser()
    const user = userData.user
    if (!user) return

    const { error: rmErr } = await supabase.storage
      .from('documentos')
      .remove([arq.storagePath])
    if (rmErr) {
      setErro('Não deu pra remover o arquivo. Tente de novo em alguns segundos.')
      return
    }
    setArquivos((prev) => prev.filter((a) => a.nome !== arq.nome))
  }

  const temArquivos = arquivos.length > 0

  return (
    <div className="mt-2 border-t border-gray-100 bg-white px-4 py-3">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
        onChange={handleUpload}
        disabled={enviando}
        className="hidden"
      />

      {carregando ? (
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Verificando documentos...
        </div>
      ) : !temArquivos ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={enviando}
          className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-3 text-sm font-medium text-gray-600 transition-colors hover:border-[#166534]/40 hover:bg-green-50 hover:text-[#166534] disabled:opacity-60"
        >
          {enviando ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Enviar documento
            </>
          )}
        </button>
      ) : (
        <div className="space-y-2">
          {arquivos.map((arq) => (
            <div
              key={arq.nome}
              className={`rounded-lg border px-3 py-2 ${corDoCard(arq)}`}
            >
              <div className="flex items-center gap-2">
                <IconeStatus arq={arq} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-gray-800">
                    {nomeAmigavel(arq.nome)}
                  </p>
                  <p className="text-[10px] text-gray-500">
                    {formatarTamanho(arq.tamanho)}
                    {arq.validando && ' · validando com IA...'}
                    {arq.validacao && ` · ${rotuloStatus(arq.validacao.status)}`}
                  </p>
                </div>
                {arq.url && (
                  <a
                    href={arq.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded text-gray-500 hover:bg-white hover:text-[#166534]"
                    title="Abrir"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => handleRemover(arq)}
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded text-gray-500 hover:bg-white hover:text-red-500"
                  title="Remover"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {arq.validacao && (
                <div className="mt-2 space-y-1 border-t border-black/5 pt-2 text-[11px]">
                  {arq.validacao.resumo && (
                    <p className="text-gray-700">{arq.validacao.resumo}</p>
                  )}
                  {arq.validacao.pendencias && arq.validacao.pendencias.length > 0 && (
                    <ul className="list-disc space-y-0.5 pl-4 text-gray-600">
                      {arq.validacao.pendencias.map((p, i) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  )}
                  {arq.validacao.observacao_banco && (
                    <p className="text-amber-700">
                      ⚠ {arq.validacao.observacao_banco}
                    </p>
                  )}
                </div>
              )}

              {arq.erroValidacao && (
                <div className="mt-2 flex items-center gap-1.5 border-t border-black/5 pt-2 text-[11px] text-gray-500">
                  <AlertTriangle className="h-3 w-3" />
                  {arq.erroValidacao}
                  <button
                    type="button"
                    onClick={() => validarArquivo(arq.storagePath)}
                    className="ml-auto text-[#166534] hover:underline"
                  >
                    Tentar novamente
                  </button>
                </div>
              )}

              {!arq.validacao && !arq.validando && !arq.erroValidacao && (
                <button
                  type="button"
                  onClick={() => validarArquivo(arq.storagePath)}
                  className="mt-1.5 text-[10px] font-medium text-[#166534] hover:underline"
                >
                  Checar antes do banco ver
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={enviando}
            className="flex items-center gap-1.5 text-xs font-medium text-[#166534] hover:underline disabled:opacity-60"
          >
            {enviando ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Plus className="h-3.5 w-3.5" />
                Enviar outro
              </>
            )}
          </button>
        </div>
      )}

      {erro && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-red-600">
          <AlertTriangle className="h-3 w-3" />
          {erro}
        </p>
      )}
    </div>
  )
}

function corDoCard(arq: Arquivo): string {
  if (arq.validacao?.status === 'ok') return 'border-green-200 bg-green-50'
  if (arq.validacao?.status === 'atencao') return 'border-amber-200 bg-amber-50'
  if (arq.validacao?.status === 'invalido') return 'border-red-200 bg-red-50'
  return 'border-gray-200 bg-gray-50'
}

function IconeStatus({ arq }: { arq: Arquivo }) {
  if (arq.validando) {
    return <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin text-gray-400" />
  }
  if (arq.validacao?.status === 'ok') {
    return <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-[#16a34a]" />
  }
  if (arq.validacao?.status === 'atencao') {
    return <ShieldAlert className="h-4 w-4 flex-shrink-0 text-amber-600" />
  }
  if (arq.validacao?.status === 'invalido') {
    return <ShieldX className="h-4 w-4 flex-shrink-0 text-red-600" />
  }
  return <FileCheck className="h-4 w-4 flex-shrink-0 text-gray-500" />
}

function rotuloStatus(s: ValidacaoStatus): string {
  if (s === 'ok') return 'validado'
  if (s === 'atencao') return 'atenção'
  return 'inválido'
}

function nomeAmigavel(stored: string): string {
  return stored.replace(/^\d+_/, '')
}

function formatarTamanho(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
