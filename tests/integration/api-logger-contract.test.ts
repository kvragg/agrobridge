import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

// ============================================================
// [LC1] Contrato: nenhuma rota API usa console.* diretamente
// ============================================================
// Logger sanitizado (lib/logger.ts :: capturarErroProducao e
// logger.warn/info) é o ponto único de captura pra app/api/*
// e lib/anthropic/*. console.* direto contorna a lista
// CAMPOS_PROIBIDOS que redige PII (cpf, nome, email, token, etc).
//
// Regressão típica: copiar-colar `console.error` de algum exemplo
// externo ou stackoverflow. Este teste quebra build antes disso.
// ============================================================

const ROOT = process.cwd()
const DIRS_SCANEADOS = ['app/api', 'lib/anthropic']

// Padrão: console.log/error/warn/info/debug — qualquer nível
// Ignora comentários de uma linha (// ...) e blocos (/* ... */)
// Ignora dentro de template strings e logger internals (lib/logger.ts).
const CONSOLE_REGEX = /console\.(log|error|warn|info|debug)\s*\(/

const ARQUIVOS_PERMITIDOS = new Set<string>([
  // lib/logger.ts escreve via console por design — é o sink final.
  // Nenhum arquivo em app/api ou lib/anthropic tem exceção.
])

function listarArquivosTs(dir: string, acc: string[] = []): string[] {
  let entries: string[]
  try {
    entries = readdirSync(dir)
  } catch {
    return acc
  }
  for (const nome of entries) {
    const full = join(dir, nome)
    let st
    try {
      st = statSync(full)
    } catch {
      continue
    }
    if (st.isDirectory()) {
      listarArquivosTs(full, acc)
    } else if (/\.(ts|tsx)$/.test(nome) && !nome.endsWith('.test.ts')) {
      acc.push(full)
    }
  }
  return acc
}

/** Remove comments pra não gerar false positive quando alguém
 *  escreve `// console.error(...)` documentando um call antigo. */
function removerComentarios(src: string): string {
  return src
    // Blocos /* ... */
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // Linhas //... (cuidado: preserva quebras de linha pra
    // número de linha continuar coerente nos reports).
    .replace(/^[ \t]*\/\/.*$/gm, '')
}

describe('[LC1] contrato — rotas API usam logger sanitizado', () => {
  it('nenhum arquivo .ts em app/api ou lib/anthropic contém console.*', () => {
    const offenders: { arquivo: string; linha: number; trecho: string }[] = []

    for (const dirRelativo of DIRS_SCANEADOS) {
      const dirAbs = join(ROOT, dirRelativo)
      const arquivos = listarArquivosTs(dirAbs)

      for (const arq of arquivos) {
        const relPath = relative(ROOT, arq).replace(/\\/g, '/')
        if (ARQUIVOS_PERMITIDOS.has(relPath)) continue

        const src = readFileSync(arq, 'utf8')
        const limpo = removerComentarios(src)
        const linhas = limpo.split('\n')

        for (let i = 0; i < linhas.length; i++) {
          if (CONSOLE_REGEX.test(linhas[i])) {
            offenders.push({
              arquivo: relPath,
              linha: i + 1,
              trecho: linhas[i].trim().slice(0, 120),
            })
          }
        }
      }
    }

    if (offenders.length > 0) {
      const msg = offenders
        .map((o) => `  ${o.arquivo}:${o.linha}  ${o.trecho}`)
        .join('\n')
      throw new Error(
        `${offenders.length} chamada(s) direta(s) a console.* encontrada(s):\n${msg}\n\n` +
          'Substitua por capturarErroProducao() ou logger.warn/info de @/lib/logger.',
      )
    }

    expect(offenders).toEqual([])
  })

  it('lib/logger.ts é o único ponto com console.* permitido', () => {
    const loggerSrc = readFileSync(join(ROOT, 'lib/logger.ts'), 'utf8')
    // Sanity: o logger precisa MESMO conter console.log/error/warn
    // pra funcionar — se sumirem, algo quebrou muito.
    expect(CONSOLE_REGEX.test(loggerSrc)).toBe(true)
  })
})
