import { describe, it, expect } from 'vitest'
import { sanitizarCaminhoInterno } from '@/lib/safe-redirect'

// ============================================================
// [A1-def] Open-redirect defense-in-depth
// ============================================================
// `sanitizarCaminhoInterno` é a barreira do client/SSR — o proxy
// edge também valida, mas qualquer chamada a `router.push(raw)`
// ou `redirect(raw)` em server components precisa passar por
// esta função antes.
// ============================================================

describe('sanitizarCaminhoInterno', () => {
  it('aceita caminhos internos válidos', () => {
    expect(sanitizarCaminhoInterno('/dashboard')).toBe('/dashboard')
    expect(sanitizarCaminhoInterno('/entrevista/abc-123')).toBe('/entrevista/abc-123')
    expect(sanitizarCaminhoInterno('/checklist/x?foo=bar')).toBe('/checklist/x?foo=bar')
  })

  it('recusa URLs absolutas externas', () => {
    expect(sanitizarCaminhoInterno('https://evil.com/x')).toBe('/dashboard')
    expect(sanitizarCaminhoInterno('http://phish.net')).toBe('/dashboard')
  })

  it('recusa protocolos perigosos (data:, javascript:)', () => {
    expect(sanitizarCaminhoInterno('javascript:alert(1)')).toBe('/dashboard')
    expect(sanitizarCaminhoInterno('data:text/html,foo')).toBe('/dashboard')
  })

  it('recusa double-slash (// → protocol-relative URL)', () => {
    expect(sanitizarCaminhoInterno('//evil.com/path')).toBe('/dashboard')
  })

  it('recusa backslash após barra (/\\)', () => {
    expect(sanitizarCaminhoInterno('/\\evil.com')).toBe('/dashboard')
  })

  it('recusa header injection via CRLF', () => {
    expect(sanitizarCaminhoInterno('/dashboard\r\nLocation: https://evil.com')).toBe('/dashboard')
    expect(sanitizarCaminhoInterno('/dashboard\nSet-Cookie: foo=bar')).toBe('/dashboard')
  })

  it('trata null/undefined/string vazia com fallback customizado', () => {
    expect(sanitizarCaminhoInterno(null)).toBe('/dashboard')
    expect(sanitizarCaminhoInterno(undefined)).toBe('/dashboard')
    expect(sanitizarCaminhoInterno('')).toBe('/dashboard')
    expect(sanitizarCaminhoInterno(null, '/custom')).toBe('/custom')
  })
})
