import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react'

type Variante = 'sucesso' | 'erro' | 'aviso' | 'info'

const estilos: Record<Variante, { wrap: string; icon: React.ComponentType<{ className?: string }> }> = {
  sucesso: {
    wrap: 'bg-green-50 text-green-700 border-green-200',
    icon: CheckCircle2,
  },
  erro: {
    wrap: 'bg-red-50 text-red-700 border-red-200',
    icon: XCircle,
  },
  aviso: {
    wrap: 'bg-amber-50 text-amber-800 border-amber-200',
    icon: AlertTriangle,
  },
  info: {
    wrap: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: Info,
  },
}

export interface AlertProps {
  variante: Variante
  children: React.ReactNode
  className?: string
}

export function Alert({ variante, children, className = '' }: AlertProps) {
  const { wrap, icon: Icon } = estilos[variante]
  return (
    <div
      role={variante === 'erro' ? 'alert' : 'status'}
      className={`flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm ${wrap} ${className}`}
    >
      <Icon className="mt-0.5 h-4 w-4 flex-shrink-0" />
      <div className="flex-1 leading-relaxed">{children}</div>
    </div>
  )
}
