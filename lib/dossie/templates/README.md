# Templates HTML para PDFs (v12+)

Esta pasta guarda templates HTML/CSS de alta fidelidade renderizados via
headless Chrome. Estratégia diferente do `pdfkit` programático usado em
`lib/dossie/pdf.ts`, `pdf-mentoria.ts`, `pdf-viabilidade.ts`.

## Arquivos

- **`v12-base.html`** — template oficial 2026. "Memorando de Análise de
  Crédito Rural" formato A4, 8 páginas base. Tipografia Source Serif 4 +
  Inter + JetBrains Mono. Paleta Oxford Blue (#0A1628) + Burgundy +
  Gold (#B08A3E). Identidade premium institucional.

  Placeholders (a substituir em runtime):
  - `[Nome do produtor]` — perfil.nome
  - `[Nome]` — abreviado
  - `[Paulo Sobrenome]` — analista responsável (estável: "Paulo A. Costa")
  - `[R$ valor]` — valor pretendido (formato BRL)
  - `[a calcular]` — TIR (futuro: motor financeiro)
  - `[× a confirmar]` — lastro G/O
  - `[anos]` — anos de atividade do produtor

  Numerais MAC 2026/001 e processo `MAC-2026-001-CALADO` são exemplo
  do mockup — em runtime virão de `processos.id` truncado e ano corrente.

## Por que HTML→PDF (não pdfkit)

O v12 usa recursos que pdfkit não suporta nativamente:

- Fontes Google (Source Serif 4, Inter, JetBrains Mono) com pesos múltiplos
- CSS Grid em layouts complexos (cover, kpi-row, attach-list)
- `font-variant-numeric: tabular-nums` precisa
- `text-wrap: pretty` + `hyphens: auto` para justificação editorial
- Watermark com `transform: rotate(-32deg)` posicionado absolutamente
- SVG inline (logo, QR code) com `<use>` references

Reescrever isso em pdfkit é alto custo + baixa fidelidade. A solução
é renderizar o HTML em headless Chrome → exportar PDF.

## Stack pra produção (próxima implementação)

### Dependências

```bash
npm install puppeteer-core @sparticuz/chromium-min
```

`@sparticuz/chromium-min` é a build minimal do Chromium otimizada pra
serverless (Vercel functions). `puppeteer-core` é o driver sem o
Chromium bundled.

### Renderização

```typescript
// lib/dossie/pdf-v12.ts (a criar)
import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium-min'
import fs from 'fs'
import path from 'path'

export async function gerarPdfV12(
  perfil: PerfilEntrevista,
  tier: 'diagnostico' | 'dossie' | 'mentoria',
): Promise<Buffer> {
  // 1) Carregar template
  const templatePath = path.join(
    process.cwd(),
    'lib/dossie/templates/v12-base.html',
  )
  let html = fs.readFileSync(templatePath, 'utf-8')

  // 2) Substituir placeholders pelo dado real
  html = preencherPlaceholders(html, perfil, tier)

  // 3) Renderizar via headless Chrome
  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(
      'https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar',
    ),
    headless: true,
  })
  const page = await browser.newPage()
  await page.setContent(html, { waitUntil: 'networkidle0' })
  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  })
  await browser.close()
  return pdf
}
```

### Considerações de produção

- **Cold start:** primeira execução baixa o Chromium (~50MB). Vercel
  functions têm 250MB limit no Hobby plan, 1024MB no Pro. Usar `min`
  build (~30MB) com download por URL ajuda a caber.
- **Timeout:** rendering pode levar 3-8s. Configurar
  `maxDuration: 30` na rota /api/dossie.
- **Fontes Google:** o template usa `<link href="fonts.googleapis.com">`.
  Em headless precisamos de `networkidle0` pra esperar download. Pode
  alternativamente self-hostear as fontes (cópia .woff2 em /public).
- **Watermark personalizado:** o template atual tem `[Nome]` placeholder.
  Manter a watermark de rastreabilidade já implementada
  (`mascararCpf`, `processo_id` curto, data) — copiar lógica de
  `_primitives.ts:finalizePageChrome`.

### Diferenciação por tier

O v12-base é único — diferenciação por tier vem de:
- **Bronze (diagnóstico):** apenas P1 (capa) + P6 (parecer) — 2 páginas
- **Prata (dossiê):** P1 a P6 — 6 páginas (sem extras Ouro)
- **Ouro (mentoria):** P1 a P6 + 3 extras (gargalos ocultos, parecer
  fundador, roteiro de comitê) — 9 páginas

Implementar via classes CSS condicionais (`.tier-bronze .ouro-only { display: none }`)
ou via remoção de seções pelo template engine antes do `setContent`.

## Plano de migração — STATUS

### Fase 1 — Foundation (✅ 2026-04-26)
- [x] Copiar v12-base.html pro repo
- [x] Documentar integração

### Fase 2 — Implementação (✅ 2026-04-26)
- [x] Adicionar puppeteer-core + @sparticuz/chromium-min
- [x] Criar `lib/dossie/pdf-v12.ts` com template engine TypeScript
  (não usa o HTML cru — emite HTML programaticamente lendo perfil
  + laudo, com CSS extraído do v12-base)
- [x] Diferenciação por tier (Bronze 2-3 pgs, Prata 4-5 pgs, Ouro 5-6 pgs)
- [x] Watermark personalizada (nome + CPF mascarado + processo + data)
- [x] Detecção automática de ambiente (chromium-min em Vercel,
  system Chrome em dev local Windows/Mac)
- [x] Script local `scripts/gerar-pdf-v12-exemplo.ts` validado

### Fase 3 — Cutover gradual (próxima validação)

**Feature flag em produção:** `PDF_ENGINE=v12` ativa o novo render.
Default é `undefined` → continua usando pdfkit antigo (zero risco).

Cutover pode ser gradual:

1. **Validação local** (✅ feito)
   ```bash
   npx tsx scripts/gerar-pdf-v12-exemplo.ts
   # 3 PDFs gerados em docs/examples/v12/
   ```
2. **Validação em preview Vercel:**
   - Push pra branch
   - Vercel cria preview deployment
   - Setar `PDF_ENGINE=v12` em "Preview Environment Variables"
   - Smoke test gerando dossiê com lead real

3. **Cutover prod:**
   - Setar `PDF_ENGINE=v12` em "Production Environment Variables"
   - Trigger redeploy (sem mudança de código)
   - Monitorar logs por 24h

4. **Rollback rápido:**
   - Remover `PDF_ENGINE` env var → next request volta pra pdfkit

5. **Cleanup (após 1 semana estável):**
   - Deletar `pdf.ts`, `pdf-mentoria.ts`, `pdf-viabilidade.ts`, `pdf-v06.ts`
   - Remover feature flag das rotas
   - Tornar `pdf-v12.ts` o único pipeline

### Considerações Vercel pré-cutover

- **Função size:** chromium-min é ~30MB (não-comprimido); cabe em Hobby
  (50MB) e Pro (250MB). Tarball baixado on-demand via URL pinada
  (v131.0.1) cached em /tmp.
- **Cold start:** ~3-5s adicionais na primeira chamada (download +
  extração). Subsequentes ~0.5-1s adicionais (chromium ready).
- **maxDuration:** rotas /api/dossie já têm 90s, /api/viabilidade
  precisa subir pra 30-60s antes do cutover.
- **Fontes Google:** atualmente carregadas via CDN com `networkidle0`.
  Em prod, considerar self-host em `/public/fonts/` pra independência
  de rede (latência consistente + privacidade).

### Snapshot tests

`tests/integration/pdfs-snapshot.test.ts` testa pdfs antigos. Quando
v12 virar default, atualizar esse teste (chumbar v12 + manter um teste
de retrocompat dos antigos enquanto coexistirem).

## Histórico de iterações visuais

- v01–v05: explorações iniciais (preto, cream, swiss, dossiê, mono)
- v06: "Verde Agro Premium" (em `lib/dossie/pdf-v06.ts`)
- v07–v10: explorações alternativas (Oxford Blue, Brutalist, Terracota,
  Comitê)
- v11: produção candidata anterior
- **v12: oficial 2026** ← este template
