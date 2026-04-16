import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: processos } = await supabase
    .from('processos')
    .select('id, status, banco, valor, created_at')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Meus processos</h1>
        <a
          href="/entrevista/nova"
          className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          + Nova entrevista
        </a>
      </div>

      {!processos?.length && (
        <p className="text-muted-foreground">Nenhum processo ainda. Inicie uma entrevista.</p>
      )}

      <ul className="space-y-2">
        {processos?.map((p) => (
          <li key={p.id} className="rounded border p-4">
            <p className="font-medium">{p.banco ?? 'Banco não definido'}</p>
            <p className="text-sm text-muted-foreground">
              Status: {p.status} — Valor: {p.valor ? `R$ ${p.valor.toLocaleString('pt-BR')}` : '—'}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}
