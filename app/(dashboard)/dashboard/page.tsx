import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ClipboardList, Plus } from 'lucide-react'

const STATUS_LABEL: Record<string, string> = {
  entrevista: 'Entrevista',
  checklist: 'Checklist',
  documentos: 'Documentos',
  concluido: 'Concluído',
}

const STATUS_COLOR: Record<string, string> = {
  entrevista: 'bg-blue-50 text-blue-700',
  checklist: 'bg-yellow-50 text-yellow-700',
  documentos: 'bg-orange-50 text-orange-700',
  concluido: 'bg-green-50 text-[#166534]',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: processos } = await supabase
    .from('processos')
    .select('id, status, banco, valor, created_at')
    .order('created_at', { ascending: false })

  const nome = (user?.user_metadata?.nome as string | undefined)?.split(' ')[0] ?? 'Produtor'

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-500">Bem-vindo de volta</p>
          <h1 className="text-2xl font-bold text-gray-900">Olá, {nome}!</h1>
        </div>
        <Link
          href="/entrevista/nova"
          className="inline-flex items-center gap-2 rounded-xl bg-[#166534] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#14532d]"
        >
          <Plus className="h-4 w-4" />
          Iniciar novo processo
        </Link>
      </div>

      {/* Processos */}
      <div>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
          Meus processos
        </h2>

        {!processos?.length ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 py-20 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
              <ClipboardList className="h-7 w-7 text-[#166534]" />
            </div>
            <p className="text-base font-semibold text-gray-700">Nenhum processo ainda</p>
            <p className="mt-1 text-sm text-gray-400">
              Inicie uma entrevista para gerar seu primeiro dossiê de crédito.
            </p>
            <Link
              href="/entrevista/nova"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#166534] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#14532d]"
            >
              <Plus className="h-4 w-4" />
              Iniciar agora
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {processos.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/checklist/${p.id}`}
                  className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:border-[#166534]/30 hover:bg-gray-50"
                >
                  <div>
                    <p className="font-semibold text-gray-900">{p.banco ?? 'Banco não definido'}</p>
                    <p className="mt-0.5 text-sm text-gray-400">
                      {p.valor ? `R$ ${p.valor.toLocaleString('pt-BR')}` : 'Valor não informado'} —{' '}
                      {new Date(p.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLOR[p.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {STATUS_LABEL[p.status] ?? p.status}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
