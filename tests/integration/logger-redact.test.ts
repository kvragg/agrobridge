import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { logger, capturarErroProducao } from '@/lib/logger'

// ============================================================
// [L1] Logger estruturado — redação de PII
// ============================================================
// O logger é ponto único de logs server-only. Precisa GARANTIR
// que campos de PII reconhecidos nunca apareçam em texto claro
// em `extra`, mesmo que o autor do call-site esqueça.
// ============================================================

describe('logger.info/warn/error — redação de PII', () => {
  let capturas: string[] = []
  let logSpy: ReturnType<typeof vi.spyOn>
  let warnSpy: ReturnType<typeof vi.spyOn>
  let errorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    capturas = []
    logSpy = vi.spyOn(console, 'log').mockImplementation((msg: string) => {
      capturas.push(msg)
    })
    warnSpy = vi.spyOn(console, 'warn').mockImplementation((msg: string) => {
      capturas.push(msg)
    })
    errorSpy = vi.spyOn(console, 'error').mockImplementation((msg: string) => {
      capturas.push(msg)
    })
  })

  afterEach(() => {
    logSpy.mockRestore()
    warnSpy.mockRestore()
    errorSpy.mockRestore()
  })

  it('redacta campos proibidos (email, senha, nome, cpf, cnpj, token)', () => {
    logger.info({
      msg: 'teste',
      modulo: 'x',
      extra: {
        email: 'joao@exemplo.com',
        senha: 'supersegredo',
        nome: 'João Silva',
        cpf: '123.456.789-00',
        cnpj: '12.345.678/0001-90',
        token: 'abc123',
        api_key: 'sk-123',
        ok: 'valor-normal',
      },
    })

    expect(capturas.length).toBe(1)
    const parsed = JSON.parse(capturas[0])

    expect(parsed.extra.email).toBe('[redacted]')
    expect(parsed.extra.senha).toBe('[redacted]')
    expect(parsed.extra.nome).toBe('[redacted]')
    expect(parsed.extra.cpf).toBe('[redacted]')
    expect(parsed.extra.cnpj).toBe('[redacted]')
    expect(parsed.extra.token).toBe('[redacted]')
    expect(parsed.extra.api_key).toBe('[redacted]')
    expect(parsed.extra.ok).toBe('valor-normal')
  })

  it('trunca strings gigantes em `extra` (evita log stuffing)', () => {
    const gigante = 'x'.repeat(2000)
    logger.info({
      msg: 'ok',
      extra: { texto_grande: gigante },
    })
    const parsed = JSON.parse(capturas[0])
    expect(parsed.extra.texto_grande.length).toBeLessThanOrEqual(1001)
    expect(parsed.extra.texto_grande.endsWith('…')).toBe(true)
  })

  it('emite JSON válido em uma linha com ts e nível', () => {
    logger.warn({ msg: 'alerta', modulo: 'x' })
    expect(capturas.length).toBe(1)
    const parsed = JSON.parse(capturas[0])
    expect(parsed.nivel).toBe('warn')
    expect(parsed.modulo).toBe('x')
    expect(typeof parsed.ts).toBe('string')
    expect(new Date(parsed.ts).toString()).not.toBe('Invalid Date')
  })

  it('capturarErroProducao inclui stack truncado e campo de módulo', () => {
    const err = new Error('falha teste')
    capturarErroProducao(err, { modulo: 'api/teste', userId: 'uid-1' })

    expect(capturas.length).toBe(1)
    const parsed = JSON.parse(capturas[0])
    expect(parsed.nivel).toBe('error')
    expect(parsed.modulo).toBe('api/teste')
    expect(parsed.userId).toBe('uid-1')
    expect(typeof parsed.extra.stack).toBe('string')
  })

  it('capturarErroProducao aceita string como erro', () => {
    capturarErroProducao('string simples', { modulo: 'x' })
    const parsed = JSON.parse(capturas[0])
    expect(parsed.msg).toBe('string simples')
  })
})
