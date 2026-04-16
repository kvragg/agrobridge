import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface DocumentoCardProps {
  nome: string
  urgencia: 'BLOQUEADOR' | 'ALTA' | 'NORMAL' | 'NA_HORA'
  status: 'pendente' | 'em_andamento' | 'enviado' | 'aprovado'
  dadosJson?: Record<string, unknown>
}

const urgenciaCor: Record<DocumentoCardProps['urgencia'], string> = {
  BLOQUEADOR: 'destructive',
  ALTA: 'secondary',
  NORMAL: 'outline',
  NA_HORA: 'outline',
}

export function DocumentoCard({ nome, urgencia, status, dadosJson }: DocumentoCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{nome}</CardTitle>
          <Badge variant={urgenciaCor[urgencia] as 'destructive' | 'secondary' | 'outline'}>
            {urgencia}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Status: {status}</p>
        {dadosJson && (
          <p className="mt-1 text-sm text-muted-foreground">
            {String((dadosJson as { por_que_o_banco_pede?: string }).por_que_o_banco_pede ?? '')}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
