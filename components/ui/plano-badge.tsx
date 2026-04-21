import type { PlanoComercial } from '@/lib/plano'

interface Props {
  plano: PlanoComercial
  size?: 'sm' | 'md'
  className?: string
}

const ESTILO: Record<PlanoComercial, string> = {
  Free: 'bg-gray-100 text-gray-600 border border-gray-200',
  Bronze: 'bg-gradient-to-r from-[#c48a4f] to-[#a86f3a] text-white border border-[#8d5a2a]',
  Prata: 'bg-gradient-to-r from-[#b7b9bd] to-[#8c8e93] text-white border border-[#6a6c70]',
  Ouro: 'bg-gradient-to-r from-[#d9b870] to-[#b8965a] text-white border border-[#8a6f3e]',
}

const LABEL: Record<PlanoComercial, string> = {
  Free: 'Free',
  Bronze: 'Bronze',
  Prata: 'Prata',
  Ouro: 'Ouro',
}

export function PlanoBadge({ plano, size = 'sm', className = '' }: Props) {
  const tamanho =
    size === 'md'
      ? 'px-3 py-1 text-xs'
      : 'px-2 py-0.5 text-[10px]'
  return (
    <span
      className={`inline-flex items-center rounded-full font-bold uppercase tracking-wide ${tamanho} ${ESTILO[plano]} ${className}`}
      aria-label={`Plano ${LABEL[plano]}`}
    >
      {LABEL[plano]}
    </span>
  )
}
