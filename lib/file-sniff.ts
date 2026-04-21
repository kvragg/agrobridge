// Identifica tipo real do arquivo pelos primeiros bytes ("magic bytes").
// Não confia em Content-Type vindo do browser nem em extensão do nome —
// ambos podem ser forjados (ex.: `.exe` renomeado para `.pdf`). Necessário
// porque a IA validadora consome este input downstream.

export type DetectedType = 'pdf' | 'jpeg' | 'png' | 'unknown'

export function sniff(buffer: Buffer): DetectedType {
  if (buffer.length < 8) return 'unknown'
  if (buffer.slice(0, 4).toString('ascii') === '%PDF') return 'pdf'
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'jpeg'
  }
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return 'png'
  }
  return 'unknown'
}

const MIME: Record<DetectedType, string> = {
  pdf: 'application/pdf',
  jpeg: 'image/jpeg',
  png: 'image/png',
  unknown: 'application/octet-stream',
}

export function realMimeType(buffer: Buffer): string {
  return MIME[sniff(buffer)]
}
