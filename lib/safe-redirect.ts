const FALLBACK_PADRAO = '/dashboard'

export function sanitizarCaminhoInterno(raw: string | null | undefined, fallback: string = FALLBACK_PADRAO): string {
  if (!raw) return fallback
  if (typeof raw !== 'string') return fallback
  if (!raw.startsWith('/')) return fallback
  if (raw.startsWith('//')) return fallback
  if (raw.startsWith('/\\')) return fallback
  if (raw.includes('\r') || raw.includes('\n')) return fallback
  return raw
}
