#!/usr/bin/env tsx
/**
 * Gera imagens PNG dos 3 produtos Cakto em 2 formatos:
 *
 *   600×500  → banner principal do produto (proporção 6:5)
 *   300×250  → thumbnail medium rectangle
 *
 * Visual dark premium alinhado com o site AgroBridge: fundo #070809,
 * accent por tier (Bronze cinza-pedra · Prata verde #4ea884 · Ouro
 * #c9a86a), tipografia editorial.
 *
 * Uso:
 *   npx tsx scripts/gerar-imagens-cakto.ts
 *
 * Output: docs/cakto-images/{bronze,prata,ouro}-{600x500,300x250}.png
 *
 * Pra subir no Cakto:
 *   1. https://app.cakto.com.br/produtos
 *   2. Editar cada produto
 *   3. Aba "Imagem" → upload do PNG correspondente
 *   4. Banner = 600×500 · Thumb = 300×250
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import sharp from 'sharp'

interface ProdutoImg {
  id: 'bronze' | 'prata' | 'ouro'
  nomeComercial: 'Bronze' | 'Prata' | 'Ouro'
  produto: string
  produtoLinhas: [string, string]
  tagline: string
  preco: string
  accent: string
  accentSoft: string
  accentTextOnDark: string
}

const PRODUTOS: ProdutoImg[] = [
  {
    id: 'bronze',
    nomeComercial: 'Bronze',
    produto: 'Diagnóstico Rápido',
    produtoLinhas: ['Diagnóstico', 'Rápido'],
    tagline: 'Pra chegar na agência sabendo exatamente o que falar.',
    preco: '79,99',
    accent: '#8f8a7f',
    accentSoft: '#a5a098',
    accentTextOnDark: '#f3f4f2',
  },
  {
    id: 'prata',
    nomeComercial: 'Prata',
    produto: 'Dossiê Bancário Completo',
    produtoLinhas: ['Dossiê Bancário', 'Completo'],
    tagline: 'O pedido pronto pra entregar ao comitê de crédito.',
    preco: '397,00',
    accent: '#4ea884',
    accentSoft: '#5cbd95',
    accentTextOnDark: '#07120d',
  },
  {
    id: 'ouro',
    nomeComercial: 'Ouro',
    produto: 'Assessoria Premium 1:1',
    produtoLinhas: ['Assessoria', 'Premium 1:1'],
    tagline: 'Acompanhamento pessoal direto com o fundador.',
    preco: '1.497,00',
    accent: '#c9a86a',
    accentSoft: '#d8bd83',
    accentTextOnDark: '#1f1812',
  },
]

// ── BANNER 600×500 ──────────────────────────────────────────────
// Layout completo: logo + eyebrow + título 2-linhas + tagline + preço + selo

function svgBanner(p: ProdutoImg): string {
  const W = 1200
  const H = 1000
  const bg = '#070809'
  const bgSoft = '#0e1012'
  const ink = '#f3f4f2'
  const ink2 = '#c9ccc8'
  const muted = '#8f8f88'

  const taglineLines = wrapText(p.tagline, 36).slice(0, 2)

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${bg}" />
      <stop offset="100%" stop-color="${bgSoft}" />
    </linearGradient>
    <radialGradient id="ambient" cx="20%" cy="15%" r="80%">
      <stop offset="0%" stop-color="${p.accent}" stop-opacity="0.14" />
      <stop offset="60%" stop-color="${p.accent}" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${p.accentSoft}" />
      <stop offset="100%" stop-color="${p.accent}" />
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bgGrad)" />
  <rect width="${W}" height="${H}" fill="url(#ambient)" />

  <!-- Banda accent vertical -->
  <rect x="0" y="0" width="14" height="${H}" fill="url(#accentGrad)" />

  <!-- Logo top-left -->
  <g transform="translate(80, 80)">
    <rect x="0" y="0" width="48" height="48" rx="4" fill="${p.accent}" />
    <text x="24" y="35" font-family="Georgia, 'Times New Roman', serif"
          font-size="32" font-weight="bold" fill="${p.accentTextOnDark}"
          text-anchor="middle">A</text>
    <text x="64" y="33" font-family="Georgia, 'Times New Roman', serif"
          font-size="30" fill="${ink}" letter-spacing="-0.5">AgroBridge</text>
  </g>

  <!-- Selo garantia top-right -->
  <g transform="translate(${W - 280}, 80)">
    <rect x="0" y="0" width="200" height="60" rx="4"
          fill="none" stroke="${p.accent}" stroke-width="1.5" />
    <text x="100" y="26" font-family="'Courier New', monospace"
          font-size="13" font-weight="bold" fill="${p.accent}"
          text-anchor="middle" letter-spacing="3">
      GARANTIA
    </text>
    <text x="100" y="48" font-family="Georgia, 'Times New Roman', serif"
          font-size="20" font-weight="bold" fill="${ink}"
          text-anchor="middle">
      7 dias
    </text>
  </g>

  <!-- Eyebrow -->
  <text x="80" y="240" font-family="'Courier New', monospace"
        font-size="20" font-weight="bold" fill="${p.accent}"
        letter-spacing="6">
    ${p.nomeComercial.toUpperCase()} · ASSESSORIA DE CRÉDITO
  </text>

  <!-- Título 2 linhas -->
  <text x="80" y="335" font-family="Georgia, 'Times New Roman', serif"
        font-size="72" font-weight="bold" fill="${ink}"
        letter-spacing="-3">
    ${escapeXml(p.produtoLinhas[0])}
  </text>
  <text x="80" y="410" font-family="Georgia, 'Times New Roman', serif"
        font-size="72" font-weight="bold" fill="${ink}"
        letter-spacing="-3">
    ${escapeXml(p.produtoLinhas[1])}
  </text>

  <!-- Fio accent -->
  <rect x="80" y="450" width="80" height="3" fill="${p.accent}" />

  <!-- Tagline -->
  ${taglineLines
    .map(
      (line, i) => `
  <text x="80" y="${525 + i * 38}" font-family="Georgia, 'Times New Roman', serif"
        font-size="28" font-style="italic" fill="${ink2}">
    ${escapeXml(line)}
  </text>`,
    )
    .join('')}

  <!-- Preço bloco rodapé -->
  <g transform="translate(80, 760)">
    <text x="0" y="0" font-family="'Courier New', monospace"
          font-size="16" font-weight="bold" fill="${muted}"
          letter-spacing="4">
      INVESTIMENTO ÚNICO
    </text>
    <text x="0" y="100" font-family="Georgia, 'Times New Roman', serif"
          font-size="36" fill="${muted}" letter-spacing="-1">
      R$
    </text>
    <text x="68" y="110" font-family="Georgia, 'Times New Roman', serif"
          font-size="100" font-weight="bold" fill="${ink}"
          letter-spacing="-4">
      ${p.preco}
    </text>
    <text x="0" y="160" font-family="'Courier New', monospace"
          font-size="14" fill="${muted}" letter-spacing="3">
      PAGAMENTO ÚNICO · SEM MENSALIDADE
    </text>
  </g>

  <!-- Site -->
  <text x="${W - 80}" y="${H - 50}" font-family="'Courier New', monospace"
        font-size="14" fill="${muted}" letter-spacing="3"
        text-anchor="end">
    AGROBRIDGE.SPACE
  </text>
</svg>`
}

// ── THUMB 300×250 ────────────────────────────────────────────────
// Layout compacto: logo pequeno + nome + preço grande + selo discreto

function svgThumb(p: ProdutoImg): string {
  // Renderizo em 600×500 (2x) pra não pixelar quando reduzir pra 300×250
  const W = 600
  const H = 500
  const bg = '#070809'
  const bgSoft = '#0e1012'
  const ink = '#f3f4f2'
  const ink2 = '#c9ccc8'
  const muted = '#8f8f88'

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bgGradT" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${bg}" />
      <stop offset="100%" stop-color="${bgSoft}" />
    </linearGradient>
    <radialGradient id="ambientT" cx="20%" cy="15%" r="90%">
      <stop offset="0%" stop-color="${p.accent}" stop-opacity="0.14" />
      <stop offset="60%" stop-color="${p.accent}" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="accentGradT" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${p.accentSoft}" />
      <stop offset="100%" stop-color="${p.accent}" />
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bgGradT)" />
  <rect width="${W}" height="${H}" fill="url(#ambientT)" />
  <rect x="0" y="0" width="10" height="${H}" fill="url(#accentGradT)" />

  <!-- Logo top -->
  <g transform="translate(40, 50)">
    <rect x="0" y="0" width="34" height="34" rx="3" fill="${p.accent}" />
    <text x="17" y="25" font-family="Georgia, 'Times New Roman', serif"
          font-size="22" font-weight="bold" fill="${p.accentTextOnDark}"
          text-anchor="middle">A</text>
    <text x="46" y="24" font-family="Georgia, 'Times New Roman', serif"
          font-size="22" fill="${ink}" letter-spacing="-0.5">AgroBridge</text>
  </g>

  <!-- Eyebrow tier -->
  <text x="40" y="160" font-family="'Courier New', monospace"
        font-size="14" font-weight="bold" fill="${p.accent}"
        letter-spacing="4">
    ${p.nomeComercial.toUpperCase()} · ASSESSORIA DE CRÉDITO
  </text>

  <!-- Nome produto 2 linhas (font menor pra caber) -->
  <text x="40" y="215" font-family="Georgia, 'Times New Roman', serif"
        font-size="42" font-weight="bold" fill="${ink}"
        letter-spacing="-2">
    ${escapeXml(p.produtoLinhas[0])}
  </text>
  <text x="40" y="262" font-family="Georgia, 'Times New Roman', serif"
        font-size="42" font-weight="bold" fill="${ink}"
        letter-spacing="-2">
    ${escapeXml(p.produtoLinhas[1])}
  </text>

  <!-- Fio accent -->
  <rect x="40" y="290" width="50" height="2" fill="${p.accent}" />

  <!-- Preço grande -->
  <g transform="translate(40, 360)">
    <text x="0" y="0" font-family="Georgia, 'Times New Roman', serif"
          font-size="22" fill="${muted}" letter-spacing="-1">
      R$
    </text>
    <text x="40" y="6" font-family="Georgia, 'Times New Roman', serif"
          font-size="62" font-weight="bold" fill="${ink}"
          letter-spacing="-3">
      ${p.preco}
    </text>
  </g>

  <!-- Selo garantia bottom -->
  <text x="40" y="${H - 35}" font-family="'Courier New', monospace"
        font-size="11" font-weight="bold" fill="${p.accent}"
        letter-spacing="3">
    GARANTIA 7 DIAS · PAGAMENTO ÚNICO
  </text>

  <!-- Site -->
  <text x="${W - 40}" y="${H - 35}" font-family="'Courier New', monospace"
        font-size="10" fill="${muted}" letter-spacing="2"
        text-anchor="end">
    AGROBRIDGE.SPACE
  </text>
</svg>`
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let current = ''
  for (const w of words) {
    if ((current + ' ' + w).trim().length > maxChars && current) {
      lines.push(current.trim())
      current = w
    } else {
      current = current ? current + ' ' + w : w
    }
  }
  if (current) lines.push(current.trim())
  return lines
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

async function main(): Promise<void> {
  const outDir = resolve('docs/cakto-images')
  mkdirSync(outDir, { recursive: true })

  for (const p of PRODUTOS) {
    // BANNER 600×500 (renderizo em 1200×1000 e reduzo — antialias melhor)
    {
      const svg = svgBanner(p)
      writeFileSync(resolve(outDir, `${p.id}-600x500.svg`), svg, 'utf8')
      const out = resolve(outDir, `${p.id}-600x500.png`)
      await sharp(Buffer.from(svg))
        .resize(600, 500, { fit: 'fill' })
        .png({ compressionLevel: 9, quality: 95 })
        .toFile(out)
      const m = await sharp(out).metadata()
      console.log(
        `✓ ${p.nomeComercial.padEnd(7)} BANNER  ${out}  (${m.width}×${m.height}, ${(
          m.size! / 1024
        ).toFixed(1)} KB)`,
      )
    }

    // THUMB 300×250 (renderizo em 600×500 e reduzo)
    {
      const svg = svgThumb(p)
      writeFileSync(resolve(outDir, `${p.id}-300x250.svg`), svg, 'utf8')
      const out = resolve(outDir, `${p.id}-300x250.png`)
      await sharp(Buffer.from(svg))
        .resize(300, 250, { fit: 'fill' })
        .png({ compressionLevel: 9, quality: 95 })
        .toFile(out)
      const m = await sharp(out).metadata()
      console.log(
        `✓ ${p.nomeComercial.padEnd(7)} THUMB   ${out}  (${m.width}×${m.height}, ${(
          m.size! / 1024
        ).toFixed(1)} KB)`,
      )
    }
  }

  console.log(`\nPasta: ${outDir}`)
  console.log('\nPRÓXIMO PASSO:')
  console.log('  1. https://app.cakto.com.br/produtos')
  console.log('  2. Editar cada produto')
  console.log('  3. Banner produto: upload do *-600x500.png')
  console.log('  4. Thumb (se pedido): upload do *-300x250.png')
}

main().catch((err) => {
  console.error('ERR', err)
  process.exit(2)
})
