# Tokens Visuais — AgroBridge (site dark premium)

Spec consolidado dos tokens reais usados em produção pela landing/dashboard
do AgroBridge. Fonte: `app/globals.css` (escopo `.landing-root`) +
`components/landing/primitives.tsx`.

Use isto como fonte da verdade para:
- Mockups Nano Banana (paleta, tipografia, hierarquia)
- Refactor dos PDFs (Bronze/Prata/Ouro) pós-mockups
- Qualquer novo componente visual no produto

---

## 1. Paleta — backgrounds (dark deep graphite)

```
--bg          #070809   /* base — near-black com undertone frio    */
--bg-1        #0b0d0f   /* nível um acima                          */
--bg-2        #111418   /* nível dois (cards profundos)            */
--surface     rgba(20, 24, 28, 0.55)  /* card translúcido          */
--surface-2   rgba(14, 17, 20, 0.72)  /* card translúcido + denso  */
```

## 2. Paleta — tipografia

```
--ink         #f3f4f2   /* texto primário                          */
--ink-2       #c9ccc8   /* texto secundário (corpo)                */
--muted       #7e8580   /* texto auxiliar, eyebrows                */
--faint       #4a4f4c   /* hints, marcadores                       */
```

## 3. Paleta — accents (moss-tech green + gold)

```
--green       #4ea884   /* verde principal — CTA, accent destacado */
--green-2     #2f7a5c   /* verde escuro — gradiente fim, ink       */
--green-dim   rgba(78, 168, 132, 0.22)  /* fundo hover sutil       */
--green-glow  rgba(78, 168, 132, 0.35)  /* glow ambient            */

--gold        #c9a86a   /* ouro principal — highlights, accent     */
--gold-dim    rgba(201, 168, 106, 0.22) /* fundo hover sutil       */

--danger      #d47158   /* warning/erro — único caso de avermelhado */
```

### Gradientes canônicos (do site real)

```
/* Botão accent (CTA primário verde) */
background: linear-gradient(180deg, #5cbd95 0%, #2f7a5c 100%);
color: #07120d;

/* Hero/título destacado (verde→ouro) — usado em "Escolha como chegar
   no banco." em /planos */
background: linear-gradient(90deg, #5cbd95, #c9a86a);
-webkit-background-clip: text;
background-clip: text;
color: transparent;

/* Botão primário (off-white sobre dark) */
background: linear-gradient(180deg, #f6f6f4 0%, #d9dbd6 100%);
color: #0b0d0f;

/* GlassCard fundo */
background: linear-gradient(180deg, rgba(22,26,30,0.72) 0%, rgba(12,15,18,0.82) 100%);
backdrop-filter: blur(18px) saturate(140%);
```

## 4. Hairlines — bordas e separadores

```
--line         rgba(255, 255, 255, 0.06)   /* bordas básicas       */
--line-2       rgba(255, 255, 255, 0.10)   /* bordas com mais peso */
--line-green   rgba(78, 168, 132, 0.18)    /* borda verde sutil    */
--line-gold    rgba(201, 168, 106, 0.18)   /* borda dourada sutil  */
```

## 5. Tipografia — fontes

| Token | Família CSS | Comentário |
|---|---|---|
| `--font-sans` | **Inter** (Geist como fallback) | corpo + títulos. `font-feature-settings: "ss01", "cv11"` ativa stylistic sets que melhoram sutilezas. |
| `--font-mono` (`--font-geist-mono`) | **Geist Mono** | eyebrows, números técnicos, badges. `font-feature-settings: "tnum"` ativa tabular figures. |
| `--font-heading` | mesma do sans | sem distinção entre heading e body — peso e tamanho fazem a hierarquia. |

**Letter-spacing global**: `-0.005em` no body. Display: até `-0.04em`.

## 6. Componentes — Eyebrow

Padrão visual mais distintivo do site. Usado em todo lugar pra rotular
seções, números, status.

```
font-family: mono (Geist Mono);
font-size: 11px;
letter-spacing: 0.18em;
text-transform: uppercase;
color: var(--muted);

dot opcional à esquerda:
  width: 6px; height: 6px;
  background: var(--gold);
  border-radius: 50%;
  box-shadow: 0 0 10px var(--gold);
gap: 10px (entre dot e texto)
```

## 7. Componentes — GlassCard

Card padrão (cresce sobre o dark com translúcido sutil + glow).

```
background:
  linear-gradient(180deg, rgba(22,26,30,0.72) 0%, rgba(12,15,18,0.82) 100%);
backdrop-filter: blur(18px) saturate(140%);
border: 1px solid <var(--line-green) | var(--line-gold) | var(--line-2)>;
border-radius: 20px;
padding: 28px;  /* default — pode ser 20, 32 também */
box-shadow:
  0 1px 0 rgba(255,255,255,0.04) inset,
  0 -1px 0 rgba(0,0,0,0.3) inset,
  0 20px 40px -20px rgba(0,0,0,0.7),
  0 40px 80px -40px <glowColor>;

glowColor por variant:
  green → rgba(78,168,132,0.12)
  gold  → rgba(201,168,106,0.12)
  none  → transparent

hover (quando ativado):
  transform: translateY(-3px);
  border-color: rgba(78,168,132,0.32) | rgba(201,168,106,0.32);
```

## 8. Componentes — Button (4 variantes)

```
Estilo base:
  display: inline-flex; align-items: center; justify-content: center;
  gap: 10px; font-weight: 500; letter-spacing: -0.005em;
  border-radius: 999px (pill);
  border: 1px solid transparent;
  transition: all .25s ease;

Tamanhos:
  sm  padding 9×16   font-size 13
  md  padding 12×22  font-size 14
  lg  padding 16×28  font-size 15

Variantes:
  primary  → linear-gradient(180deg, #f6f6f4 0%, #d9dbd6 100%) sobre ink #0b0d0f
            box-shadow inset glow + 8×20 -8 rgba(255,255,255,.2)
  accent   → linear-gradient(180deg, #5cbd95 0%, #2f7a5c 100%) sobre #07120d
            box-shadow inset borda + 10×30 -8 rgba(78,168,132,.5) + 0×0 0 3 rgba(78,168,132,.12)
  ghost    → bg rgba(255,255,255,0.03) sobre var(--ink), border rgba(255,255,255,0.12), backdrop-blur 12
  ghostAccent → bg rgba(78,168,132,0.08) sobre var(--green), border rgba(78,168,132,0.28)
```

## 9. Componentes — SectionLabel (rótulo de seção da landing)

```
display: flex; align-items: center; gap: 12px;
font: mono 11px / letter-spacing 0.18em uppercase;
color: var(--muted);
padding-bottom: 14px;
margin-bottom: 56px;
border-bottom: 1px solid var(--line);

Estrutura: [num em var(--gold)]  [linha 20×1px var(--line-2)]  [label]
```

## 10. Container responsivo

```
.landing-container {
  max-width: 1280px;  /* default desktop */
  width: 100%;
  margin-inline: auto;
  padding-inline: clamp(20px, 4vw, 56px);
}

Breakpoints:
  ≥ 1440px  → 1400px
  ≥ 1680px  → 1560px
  ≥ 1920px  → 1720px
  ≥ 2560px  → 1920px (cap)
```

## 11. Radius

```
--radius     0.625rem (~10px)  /* base shadcn */
--radius-sm  0.6×base   ≈ 6px
--radius-md  0.8×base   ≈ 8px
--radius-lg  1×base     ≈ 10px
--radius-xl  1.4×base   ≈ 14px
--radius-2xl 1.8×base   ≈ 18px
--radius-3xl 2.2×base   ≈ 22px
--radius-4xl 2.6×base   ≈ 26px

Cards GlassCard usam 20px (entre xl e 2xl).
Pills/buttons usam 999px (full).
```

## 12. Reveal animation

```
.reveal {
  opacity: 0;
  transform: translateY(24px);
}
.reveal.in animation:
  landing-revealIn 0.9s cubic-bezier(0.2, 0.7, 0.2, 1) forwards;

Delays escalonados:
  .reveal-d1.in → 0.06s
  .reveal-d2.in → 0.14s
  .reveal-d3.in → 0.22s
  .reveal-d4.in → 0.30s

@media (prefers-reduced-motion: reduce) → tudo a vista, sem animação.
```

## 13. Ambient noise starfield (fixed atrás de tudo)

```
.landing-root::before {
  position: fixed; inset: 0; pointer-events: none; z-index: 1;
  background-image:
    radial-gradient(1px 1px at 30% 20%, rgba(255,255,255,0.04), transparent 50%),
    radial-gradient(1px 1px at 70% 80%, rgba(255,255,255,0.03), transparent 50%),
    radial-gradient(1px 1px at 15% 75%, rgba(255,255,255,0.035), transparent 50%);
  background-size: 700px 700px, 900px 900px, 600px 600px;
  mix-blend-mode: screen;
  opacity: 0.6;
}
```

## 14. Scrollbar

```
::-webkit-scrollbar         { width: 10px; height: 10px; }
::-webkit-scrollbar-track   { background: #0a0c0e; }
::-webkit-scrollbar-thumb   { background: #1a1f23; border-radius: 10px; }
::-webkit-scrollbar-thumb:hover { background: #232a2f; }
```

## 15. Selection

```
::selection {
  background: var(--green-dim);
  color: #fff;
}
```

---

## 16. Mapeamento PDF (light) ← Site (dark)

A versão PDF inverte o esquema (light) mas mantém DNA. Esta é a tabela
de tradução que `lib/dossie/_theme.ts` aplica:

| Site (dark)         | PDF (light)         | Uso                    |
|---|---|---|
| `#070809` bg        | `#f7f5f0` bg        | fundo principal        |
| `#0b0d0f` bg-1      | `#fafaf7` bgSoft    | linha zebrada          |
| `surface-2 0.72`    | `#ffffff` bgCard    | card destacado         |
| `#f3f4f2` ink       | `#0a0a0a` ink       | texto primário         |
| `#c9ccc8` ink-2     | `#2a2a2a` ink2      | texto secundário       |
| `#7e8580` muted     | `#6b6b64` muted     | rótulos, eyebrows      |
| `#4ea884` green     | `#2f7a5c` green     | accent Prata           |
| `#2f7a5c` green-2   | `#0f3d2e` greenInk  | títulos verde profundo |
| `#c9a86a` gold      | `#a8893f` gold      | accent Ouro            |
| (gold escuro)       | `#5a4622` goldInk   | títulos ouro profundo  |
| `#d47158` danger    | `#b84a3a` danger    | erro/bloqueio          |
| `rgba(255,255,255,0.06)` | `#d6d1c3` line | hairlines              |
| Geist Mono          | Courier-Bold        | eyebrows mono (PDF usa font built-in) |
| Inter               | Helvetica           | sans body (PDF usa built-in) |
| (sem display)       | Times-Bold          | display capa (peso documental) |

**Por que invertemos pro light no PDF**: dark queima tinta na impressão.
Produtor leva pro banco. Light com identidade preservada = decisão de
produto, não acidente.

---

## 17. Anti-references (referências negativas)

Para evitar quando especificar visual em prompt ou code review:

- ❌ Cores chapadas, sem gradientes (perde camada de profundidade)
- ❌ Verde "agro genérico" (#4caf50 e similares) — usar nosso moss-tech
- ❌ Ouro "lojinha de joia" — usar nosso gold sofisticado #c9a86a
- ❌ Bordas grossas (≥ 2px) em qualquer lugar exceto fios accent específicos
- ❌ Border-radius pequeno (4-8px) em cards principais — usar 20px
- ❌ Texto justificado em UI (só em PDF longos)
- ❌ Tipografia em CAPS sem letter-spacing forte (mín 0.16em)
- ❌ Botões retangulares — sempre pill (radius 999px)
- ❌ Sombras duras / monochromatic — sempre composições com glow colorido sutil

## 18. Referências positivas

- ✅ Linear changelog (hierarquia tipográfica + glow sutil)
- ✅ Stripe Atlas / Tax (cards com translúcido + accent)
- ✅ Notion brand kit (mono labels + serif display)
- ✅ Tiffany brand (ouro nobre, contido)
- ✅ McKinsey/BCG reports (estrutura, hierarquia, white space)
- ✅ Goldman Sachs research notes (peso, sobriedade, accent)
