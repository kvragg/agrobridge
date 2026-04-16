import { DocumentoCard } from './DocumentoCard'

interface Item {
  id: string
  nome: string
  urgencia: 'BLOQUEADOR' | 'ALTA' | 'NORMAL' | 'NA_HORA'
  status: 'pendente' | 'em_andamento' | 'enviado' | 'aprovado'
  dados_json?: Record<string, unknown>
}

interface BlocoChecklistProps {
  titulo: string
  itens: Item[]
}

export function BlocoChecklist({ titulo, itens }: BlocoChecklistProps) {
  if (!itens.length) return null

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">{titulo}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {itens.map((item) => (
          <DocumentoCard
            key={item.id}
            nome={item.nome}
            urgencia={item.urgencia}
            status={item.status}
            dadosJson={item.dados_json}
          />
        ))}
      </div>
    </section>
  )
}
