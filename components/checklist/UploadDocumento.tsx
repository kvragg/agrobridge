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
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { sanitizarNomeArquivo } from '@/lib/validation'

interface Arquivo {
  nome: string
  tamanho: number
  url?: string
}

interface UploadDocumentoProps {
  processoId: string
  docSlug: string
  nomeDocumento: string
}

const MAX_MB = 10
const TIPOS_ACEITOS = ['application/pdf', 'image/jpeg', 'image/png']
const EXT_ACEITAS = /\.(pdf|jpe?g|png)$/i

export default function UploadDocumento({
  processoId,
  docSlug,
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

      if (data && data.length > 0) {
        const lista = await Promise.all(
          data.map(async (f) => {
            const path = `${prefixo}/${f.name}`
            const { data: urlData } = await supabase.storage
              .from('documentos')
              .createSignedUrl(path, 3600)
            return {
              nome: f.name,
              tamanho: f.metadata?.size ?? 0,
              url: urlData?.signedUrl,
            }
          })
        )
        setArquivos(lista)
      }
      setCarregando(false)
    }
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processoId, docSlug])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setErro('')

    if (file.size > MAX_MB * 1024 * 1024) {
      setErro(`Arquivo muito grande. Máximo: ${MAX_MB}MB.`)
      return
    }
    if (!TIPOS_ACEITOS.includes(file.type) || !EXT_ACEITAS.test(file.name)) {
      setErro('Use PDF, JPG ou PNG.')
      return
    }

    setEnviando(true)
    const { data: userData } = await supabase.auth.getUser()
    const user = userData.user
    if (!user) {
      setErro('Sessão expirada. Faça login novamente.')
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
      setErro('Erro ao enviar. Tente novamente.')
      setEnviando(false)
      return
    }

    const { data: urlData } = await supabase.storage
      .from('documentos')
      .createSignedUrl(path, 3600)

    setArquivos((prev) => [
      ...prev,
      {
        nome: storedName,
        tamanho: file.size,
        url: urlData?.signedUrl,
      },
    ])
    setEnviando(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  async function handleRemover(nome: string) {
    const { data: userData } = await supabase.auth.getUser()
    const user = userData.user
    if (!user) return

    const path = `${user.id}/${processoId}/${docSlug}/${nome}`
    const { error: rmErr } = await supabase.storage
      .from('documentos')
      .remove([path])
    if (rmErr) {
      setErro('Não foi possível remover o arquivo.')
      return
    }
    setArquivos((prev) => prev.filter((a) => a.nome !== nome))
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
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:border-[#166534]/40 hover:bg-green-50 hover:text-[#166534] disabled:opacity-60"
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
              className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2"
            >
              <FileCheck className="h-4 w-4 flex-shrink-0 text-[#16a34a]" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-gray-800">
                  {nomeAmigavel(arq.nome)}
                </p>
                <p className="text-[10px] text-gray-500">
                  {formatarTamanho(arq.tamanho)}
                </p>
              </div>
              {arq.url && (
                <a
                  href={arq.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded p-1 text-gray-500 hover:bg-white hover:text-[#166534]"
                  title="Abrir"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
              <button
                type="button"
                onClick={() => handleRemover(arq.nome)}
                className="rounded p-1 text-gray-500 hover:bg-white hover:text-red-500"
                title="Remover"
              >
                <X className="h-3.5 w-3.5" />
              </button>
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

function nomeAmigavel(stored: string): string {
  // stored = "1712345678901_nome_do_arquivo.pdf"
  return stored.replace(/^\d+_/, '')
}

function formatarTamanho(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
