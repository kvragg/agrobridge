# Prompts pro Nano Banana — Mockups dos PDFs AgroBridge

Use estes prompts no Gemini 2.5 Flash Image (Nano Banana) pra gerar
mockups visuais das páginas dos 3 PDFs (Bronze · Prata · Ouro). Os
mockups servem de **referência visual** — depois converto pro código
em pdfkit.

**Workflow recomendado:**
1. Cole o **System Prompt** (contexto + identidade) numa primeira mensagem
2. Em seguida, cole UMA das variações (ex: "Capa Prata") por mensagem
3. Itere com refinamentos ("aumenta o contraste do título", "muda o accent
   pra mais sutil", etc) na mesma conversa
4. Salve as imagens aprovadas em `docs/design/mockups/`
5. Me passa as imagens — eu adapto o pdfkit pra reproduzir

**Output esperado em cada prompt:** imagem A4 portrait (1240×1754 px, 150dpi).

---

## SYSTEM PROMPT (cole primeiro, depois envie as variações)

```
Você é um designer sênior especializado em documentos corporativos premium.
Vai gerar mockups de PDF página por página pra AgroBridge — uma plataforma
SaaS brasileira de consultoria especializada em crédito rural, fundada por
um ex-bancário com 14 anos no Sistema Financeiro Nacional.

# IDENTIDADE VISUAL DO PRODUTO

Site referência: dark premium com glassmorphism, gradientes verde→ouro,
tipografia hierárquica forte. Os PDFs precisam ter o mesmo DNA mas em
versão LIGHT (fundo creme) — porque o produtor imprime e leva pro banco,
e dark queima tinta.

Inspirações de qualidade: faturas Stripe, Linear changelog PDFs,
Notion brand kit, relatórios McKinsey/BCG, certificados oficiais
(CAR, CCIR — limpos, hierarquia clara, tipografia documental).

NÃO inspirar em: PDFs de boleto, contratos de banco antigos, relatórios
governamentais brasileiros padrão (visualmente pobres).

# PALETA DE CORES (use estes hex exatos)

Fundo:
- bg principal: #f7f5f0 (creme suave, calor levemente quente)
- bg cards: #ffffff
- bg soft (zebra de tabelas): #fafaf7

Texto:
- ink primário: #0a0a0a (quase preto)
- ink secundário: #2a2a2a
- ink terciário: #4a4a4a
- muted: #6b6b64 (texto auxiliar, eyebrows)

Linhas e separadores:
- line: #d6d1c3 (linha padrão)
- line soft: #e8e4d8

Accents POR TIER (cada PDF tem o seu — vou indicar nas variações):
- Bronze (tier baixo, neutro/discreto):
  - accent: #6b6b64 (cinza-pedra, discreto)
  - accent soft: #8f8a7f
- Prata (tier médio, verde — escolha mais comum):
  - accent: #2f7a5c (verde escuro, ler bem no creme)
  - accent soft: #5cbd95 (verde brilhante pra gradientes)
  - accent ink: #0f3d2e (verde profundíssimo pra títulos)
- Ouro (tier topo, dourado — exclusividade):
  - accent: #a8893f (ouro escuro, premium)
  - accent soft: #c9a86a (ouro brilhante)
  - accent ink: #5a4622 (marrom ouro pra títulos)

Status semânticos:
- success (em dia): #2f7a5c
- warning (atenção): #c47a3f
- danger (bloqueio): #b84a3a

# TIPOGRAFIA

- Display (capa, números grandes): serif elegante (referência: Söhne,
  Tiempos, Times Bold profissional). Peso heavy. Letter-spacing apertado.
- Body: sans-serif geométrica humanista (referência: Inter, Söhne).
  Peso 400 regular, 600 semibold pra negritos.
- Eyebrow / labels: monospaced uppercase com letter-spacing forte
  (1.6px+). Tamanho 7-9pt. Cor accent ou muted.
- Hierarquia: nunca usar só tamanho — combinar peso + cor + spacing.

# REGRAS EDITORIAIS RÍGIDAS (NÃO QUEBRAR)

1. NUNCA mostre marca/logo de banco/cooperativa específica
   (BB, Sicredi, Sicoob, Caixa, Bradesco, Itaú, Santander, BNB, etc.).
   Use sempre "Banco" ou "Cooperativa" genérico.
2. Idioma: português brasileiro 100%.
3. Valores em R$ formatados pt-BR (R$ 1.250.000,00).
4. Datas no formato DD de [mês] de AAAA (ex: 23 de abril de 2026).
5. Sem emojis no documento (eyebrows e ícones são OK, emojis não).
6. Nada de "lorem ipsum" — use texto realista em PT-BR.

# LAYOUT BASE (todas as páginas seguem)

- Tamanho: A4 portrait (210×297mm = 1240×1754 px @ 150dpi).
- Margens: 54pt todos os lados (margens generosas dão ar premium).
- Fio fino #d6d1c3 no topo (logo abaixo do header chrome).
- Header chrome (toda página exceto capa cheia):
  - Eyebrow mono à esquerda: "AGROBRIDGE · DIAGNÓSTICO" / "DOSSIÊ BANCÁRIO" / "MESA DE CRÉDITO"
  - Nome do produtor à direita (sans 7.5pt muted)
  - Fio horizontal abaixo de ambos
- Footer chrome:
  - Eyebrow mono à esquerda: "AGROBRIDGE · [nome do produto]"
  - Paginação à direita: "PÁG. NN"
  - Fio horizontal acima de ambos
- Banda accent vertical fina (3-12pt dependendo do tier) na borda
  esquerda das capas — assinatura visual.

# QUALIDADE GERAL

- Espaçamento generoso (white space é qualidade).
- Tabelas: header em mono uppercase com fio accent grosso embaixo,
  linhas de grid 0.4pt em line soft, zebra striping opcional.
- Cards: bordas finas 0.5pt, padding 22pt, accent lateral 3pt à
  esquerda quando faz sentido.
- Hierarquia clara: H1 grande serif, H2 médio sans bold com fio accent
  curto embaixo (56pt), H3 menor sans bold ink, body sans regular.
- Texto justificado nos parágrafos longos (defesa técnica, parecer).

Quando eu pedir uma página específica, gere a imagem completa com
todos esses padrões aplicados.
```

---

## VARIAÇÃO 1 — CAPA BRONZE (Diagnóstico Rápido)

```
Gere a CAPA do PDF Bronze · Diagnóstico Rápido (R$ 29,99). Tier mais
acessível, accent muted/neutro (#6b6b64). NÃO usar verde nem ouro.

Layout:
- Banda lateral esquerda: 3pt #6b6b64
- Eyebrow superior (mono uppercase): "AGROBRIDGE · DIAGNÓSTICO"
  cor #6b6b64. Logo abaixo, em sans 8.5pt muted: "Emitido em 23 de
  abril de 2026"
- Display title (serif heavy 28pt, ink #0a0a0a):
  "Parecer de viabilidade de crédito rural"
- Subtítulo (italic 11.5pt muted):
  "Leitura preliminar baseada nos dados autodeclarados na entrevista.
   Sujeita a análise final do comitê do credor."
- Lista chave-valor (key 38% muted, value 62% ink, espaçamento 16pt):
  - Produtor: Joaquim Mendes Vieira
  - Localização: Cocalzinho de Goiás / GO
  - Propriedade: Fazenda Calado · 1.518 ha · pecuária de cria/recria
  - Operação pretendida: investimento · R$ 1.850.000,00
- Fio accent muted curto (36pt, 2pt grosso) abaixo da lista
- Header e footer chrome aplicados normalmente
- Bastante white space — não encher

Mood: sóbrio, contido, leve. Sensação de "documento técnico simples
mas bem feito". Comparável à primeira página de um relatório Stripe
Tax simples.
```

---

## VARIAÇÃO 2 — PÁGINA INTERNA BRONZE (Defesa + Upsell Prata)

```
Gere uma PÁGINA INTERNA do PDF Bronze. Estrutura típica:

- Header chrome aplicado (eyebrow "AGROBRIDGE · DIAGNÓSTICO" cor
  #6b6b64, nome do produtor à direita, fio fino)
- H2 (sans bold 15pt cor #0f3d2e — ainda usa verde escuro pra H2 do
  body markdown porque os parágrafos são neutros, mas H2 tem fio
  accent muted curto debaixo):
  "Linha MCR provável"
- Parágrafo justificado (sans 10.5pt ink2):
  "A linha compatível com o perfil apresentado, considerando faturamento
  médio anual na faixa de R$ 1M a R$ 5M e operação de investimento, é o
  Custeio de Mercado (Recursos Livres) com complemento via BNDES Inovagro
  / Moderfrota dependendo do destino do capital. Taxa estimada na faixa
  de 10,5% a 13% a.a. (sujeito às condições do credor vigentes em 2026)."
- Outro H2: "Comportamento típico do credor alvo"
- Parágrafo de 3-4 linhas
- Lista bullet com 3 itens curtos (cada um com bullet • + texto):
  - Atualizar a CND Municipal antes do protocolo
  - Anexar registrato do Banco Central com nota explicativa
  - Levantar contrato de seguro pecuário vigente
- Fio horizontal divisor
- Itálico em muted: "Este parecer é uma leitura preliminar..." (3 linhas)

Na BASE da página, o BLOCO DE UPSELL:
- Fio horizontal accent VERDE #2f7a5c grosso (0.8pt)
- Eyebrow mono uppercase verde #2f7a5c: "PRÓXIMO PASSO NATURAL · PRATA"
- Título sans bold 12pt ink: "Dossiê Bancário Completo — pronto pra
  mesa do comitê"
- Parágrafo justificado (3-4 linhas) explicando o Prata
- Footer chrome aplicado

Mood: documento sóbrio mas com ponta de cor verde no rodapé sinalizando
o próximo nível. Discreto upsell, não invasivo.
```

---

## VARIAÇÃO 3 — CAPA PRATA (Dossiê Bancário Completo)

```
Gere a CAPA do PDF Prata · Dossiê Bancário Completo (R$ 297,99). Tier
mais escolhido, accent verde. Layout MUITO mais impactante que o Bronze.

Layout:
- Banda lateral esquerda VERDE espessa: 6pt #2f7a5c (assinatura visual
  forte)
- Eyebrow superior (mono uppercase cor #2f7a5c):
  "AGROBRIDGE · DOSSIÊ BANCÁRIO"
- Logo abaixo em sans 8.5pt muted: "Emitido em 23 de abril de 2026"
- BLOCO DISPLAY GRANDE (300px abaixo do topo):
  Linha 1 (serif heavy 48pt cor verde profundo #0f3d2e):
    "Dossiê de crédito"
  Linha 2 (serif heavy 48pt cor preta #0a0a0a, line-height apertado):
    "rural"
  Logo abaixo, italic 11.5pt muted, com line-height confortável:
    "Laudo técnico de avaliação para apresentação ao credor."
- BLOCO IDENTIFICAÇÃO (card com fundo branco #ffffff, borda 0.5pt
  #d6d1c3, accent lateral verde 3pt #2f7a5c, padding 22pt, altura ~180pt):
  - Eyebrow mono verde #2f7a5c: "IDENTIFICAÇÃO DO REQUERENTE"
  - Sans bold 18pt ink: "Joaquim Mendes Vieira"
  - Body 10.5pt ink2:
    - CPF: 987.654.321-00
    - Cocalzinho de Goiás / GO
    - Atividade principal: pecuária de cria/recria
    - Propriedade: 1.518 ha · propria
    - Operação pretendida: investimento · R$ 1.850.000,00
- Rodapé da capa:
  - Mono 7pt muted: "PROCESSO Nº A3F5C1D2"
  - Italic 8.5pt muted: "AgroBridge — consultoria especializada em
    crédito rural · construído por quem viveu aprovações e recusas
    dentro do banco"

Mood: imponente, premium, profissional. Como capa de relatório executivo
McKinsey. O verde escuro tem que dar sensação de "instituição séria",
não verde "agro genérico".
```

---

## VARIAÇÃO 4 — PÁGINA INTERNA PRATA (Sumário Executivo + Status Documental)

```
Gere uma PÁGINA INTERNA do PDF Prata. Estrutura:

- Header chrome aplicado (eyebrow "AGROBRIDGE · DOSSIÊ BANCÁRIO"
  cor #2f7a5c, nome produtor à direita)
- ABERTURA DE SEÇÃO:
  - Mono uppercase verde #2f7a5c: "SEÇÃO I"
  - Sans bold 22pt ink: "Sumário executivo"
  - Fio accent verde curto (56pt × 2pt) abaixo
- BLOCO ACCENT (3pt verde lateral à esquerda, sem fundo, padding 14pt
  esquerda):
  Parágrafo justificado 11.5pt ink2:
  "Operação de investimento no valor pretendido de R$ 1.850.000,00,
  lastreada em propriedade própria de 1.518 hectares em Cocalzinho de
  Goiás/GO, dedicada a pecuária de cria/recria."
- Eyebrow mono muted: "STATUS GERAL"
- LINHA DE BADGES (pílulas mono uppercase, borda 0.6pt cor accent + texto
  na mesma cor, padding 5pt 12pt, border-radius 3pt):
  - "CAR OK" (verde #2f7a5c, fonte mono 7.5pt)
  - "CCIR OK" (verde)
  - "ITR OK" (verde)
  Inline, separados por 18pt
- Sub-bloco "Pontos fortes para o comitê" (sans bold verde #2f7a5c
  + lista com check ✓ verde + texto):
  ✓ Propriedade própria — base de garantia real disponível
  ✓ CAR ativo e regular
  ✓ CCIR quitado dentro do exercício
  ✓ Histórico bancário limpo, sem inadimplência
  ✓ 12 anos de atividade — tempo de mercado consolidado
- Sub-bloco "Pontos de atenção" (sans bold warning #c47a3f
  + lista com ! warning + texto):
  ! Crédito rural ativo coexistindo com nova operação — relação
    dívida total/faturamento em ~55%

DEPOIS, na mesma página ou próxima — TABELA DE STATUS DOCUMENTAL:
- Header (mono uppercase 10.5pt verde #2f7a5c) com fio embaixo grosso
  0.8pt verde:
  | DOCUMENTO                         | STATUS          |
- Linhas (sans 10.5pt ink2, padding 5pt 6pt, fio fino 0.4pt #e8e4d8
  abaixo de cada, zebra striping bg #fafaf7):
  - CAR (Cadastro Ambiental Rural)        | Em dia
  - CCIR (INCRA)                          | Em dia
  - ITR (Receita Federal)                  | Em dia
  - CND Federal (RFB/PGFN)                | Em dia
  - CND Estadual                          | Em dia
  - CND Municipal                          | Pendente
  - Licença Ambiental / Dispensa          | Em dia
- Footer chrome aplicado

Mood: estilo CCIR/CAR oficial mas com upgrade visual premium. Tabela
deve parecer documento corporativo de alta qualidade.
```

---

## VARIAÇÃO 5 — CAPA OURO (Mesa de Crédito · Mentoria)

```
Gere a CAPA do PDF Ouro · Mesa de Crédito (R$ 697,99). Topo de funil,
exclusivo, accent dourado. Visual MAIS premium e selado de todos.

Layout:
- DUAS bandas laterais esquerdas:
  - Banda 1: 12pt #a8893f (ouro escuro)
  - Banda 2 ao lado: 2pt #c9a86a (ouro brilhante soft)
  Total 14pt de banda visual — assinatura mais espessa que o Prata
- Eyebrow superior (mono uppercase ouro #a8893f):
  "AGROBRIDGE · MESA DE CRÉDITO"
- Logo abaixo em sans 8.5pt muted: "Emitido em 23 de abril de 2026"
- DISPLAY (300px do topo):
  Linha 1 (serif heavy 48pt marrom-ouro #5a4622):
    "Parecer"
  Linha 2 (serif heavy 48pt preta #0a0a0a):
    "estratégico de crédito."
  Italic 11.5pt muted:
    "Revisão cirúrgica conduzida pelo fundador. Documento exclusivo
     do plano Ouro."
- SELO DE VAGA (200pt × 56pt, borda 1pt ouro #a8893f, sem fundo):
  - Mono uppercase ouro 7.5pt: "VAGA OURO"
  - Serif heavy 22pt ink: "Nº 03/06"
  Posição: ~80pt abaixo do display, alinhado à esquerda
- BLOCO IDENTIFICAÇÃO (card branco, borda OURO #a8893f 0.5pt, accent
  lateral ouro 3pt, padding 22pt, altura ~150pt):
  - Eyebrow mono ouro: "PRODUTOR ATENDIDO"
  - Sans bold 18pt: "Joaquim Mendes Vieira"
  - Body 10.5pt ink2:
    - Cocalzinho de Goiás / GO · pecuária de cria/recria
    - Operação pretendida: R$ 1.850.000,00
- Rodapé:
  - Mono 7pt muted: "PROCESSO Nº A3F5C1D2"
  - Italic 8.5pt muted (texto mais elaborado):
    "AgroBridge — Mesa de Crédito · revisão cirúrgica conduzida pelo
     fundador. 14 anos no Sistema Financeiro Nacional gerindo carteira
     Agro em banco privado."

Mood: capa que comunica EXCLUSIVIDADE. Como primeira página de um
relatório McKinsey premium ou um certificado de credenciamento Wall
Street. Ouro escuro tem que parecer NOBRE, não cafona / lojinha.
Referências negativas: certificado de academia. Referências positivas:
relatório Goldman Sachs, certificado de auditoria Big Four, Tiffany
brand kit.
```

---

## VARIAÇÃO 6 — PÁGINA INTERNA OURO (Gargalos Ocultos + Parecer Fundador)

```
Gere uma PÁGINA INTERNA do PDF Ouro com a SEÇÃO EXCLUSIVA dos
"Gargalos ocultos identificados".

Estrutura:
- Header chrome aplicado (eyebrow OURO #a8893f, nome à direita)
- ABERTURA DE SEÇÃO:
  - Mono uppercase ouro #a8893f: "SEÇÃO VI"
  - Sans bold 22pt ink: "Gargalos ocultos identificados"
  - Fio accent ouro curto (56pt × 2pt) abaixo
- Itálico introdutório (sans italic 10.5pt muted, justificado):
  "O comitê do credor avalia além do que está no formulário. Esta
  seção antecipa pontos que historicamente derrubam pedidos sem que
  o produtor saiba que foram avaliados."

DEPOIS, 2 BLOCOS DE GARGALO. Cada bloco é um BLOCO ACCENT (linha
vertical lateral 2.5pt à esquerda + padding 14pt, sem fundo):

BLOCO 1 (accent vermelho #b84a3a — severidade alta):
  - Mono uppercase 8.5pt vermelho #b84a3a: "SEVERIDADE ALTA"
  - Sans bold 12pt ink: "Extrato SCR não anexado preventivamente"
  - Body 10.5pt ink2 justificado:
    "O comitê de crédito sempre puxa o registrato no Sistema de
    Informações de Crédito (SCR/Bacen) antes de decidir. Quando o
    produtor não anexa o extrato proativamente, qualquer surpresa
    nele (operação esquecida, rolagem, classificação degradada)
    gera desconfiança e atrasa a análise."
  - "Mitigação recomendada: " (sans bold) + "Emitir o registrato
    gratuitamente em registrato.bcb.gov.br antes do protocolo,
    anexar ao dossiê com nota explicativa de cada operação ativa."

BLOCO 2 (accent warning #c47a3f — severidade média):
  - Mono uppercase 8.5pt warning: "SEVERIDADE MÉDIA"
  - Sans bold 12pt ink: "Pesquisa de mídia e imagem do proponente"
  - Body 10.5pt ink2 justificado:
    "Bancos privados e cooperativas de porte médio fazem busca aberta
    no nome do proponente — Google, redes sociais, processos públicos.
    Resultados negativos (mesmo arquivados ou sem condenação) podem
    derrubar a operação no comitê de risco reputacional."
  - "Mitigação recomendada: " + texto

Espaçamento generoso entre blocos.

Mood: análise de risco séria, tipo relatório de due diligence.
Tipografia limpa, contraste claro entre severidades por cor.
```

---

## VARIAÇÃO 7 — PÁGINA INTERNA OURO (Parecer Estratégico do Fundador)

```
Gere PÁGINA INTERNA do PDF Ouro com a SEÇÃO "Parecer estratégico
do fundador" — esta página tem AR DE CARTA ASSINADA, mais íntima.

Estrutura:
- Header chrome aplicado
- ABERTURA DE SEÇÃO:
  - Mono uppercase ouro #a8893f: "SEÇÃO VII"
  - Sans bold 22pt ink: "Parecer estratégico do fundador"
  - Fio accent ouro curto abaixo
- BLOCO ACCENT OURO (lateral 3pt ouro, sem fundo):
  - Mono uppercase 8.5pt ouro #a8893f:
    "OBSERVAÇÕES DO FUNDADOR"
- Em seguida, 3 parágrafos numerados em negrito + texto, estilo
  "carta ao cliente":

  "1. A relação dívida total / faturamento de ~55% após a nova
   operação está no limite superior do confortável." (negrito ink)
   "Recomendo enfatizar no comitê o ciclo biológico do investimento
   (matrizes geram bezerros em 18-22 meses, retorno previsível) e
   oferecer cronograma de amortização que comprove queda da relação
   a partir do mês 24." (regular ink2)

  (parágrafo 2 e 3 similares — usar o mesmo padrão visual)

- Assinatura no rodapé do bloco, ALINHADA À DIREITA, em italic
  10pt muted:
  "— Paulo Costa, fundador AgroBridge · 14 anos no Sistema
   Financeiro Nacional"
- Footer chrome aplicado

Mood: carta de aconselhamento de mentor sênior. NÃO genérico.
Sensação de proximidade + autoridade. Comparar a uma carta de
um investidor renomado pra um portfólio company. Espaçamento
generoso, papel "respira", autoridade pelo silêncio visual.
```

---

## INSTRUÇÕES DE REFINAMENTO (use após receber a primeira imagem)

Depois de gerar cada mockup, peça refinamentos típicos:

```
Refine: aumenta o contraste do título display (peso da fonte mais
heavy, cor mais profunda).

Refine: o accent ouro está cafona — quero algo mais sóbrio, tipo
banca de investimento, não lojinha de joia. Reduz a saturação,
aumenta o cinza no ouro.

Refine: o badge "CAR OK" está parecendo ícone de app. Quero pílula
de status documental — mais sutil, fonte menor, padding maior.

Refine: o header chrome está muito escuro. Suaviza pra parecer
discreto, quase invisível, só de orientação.

Refine: o fio accent abaixo do H2 está muito grosso. Quero 1pt
no máximo, comprimento 56pt — discreto mas presente.

Refine: a tabela de status está parecendo planilha. Quero parecer
seção de relatório CCIR com upgrade premium — header mono uppercase,
linhas finíssimas, cor accent forte só no fio embaixo do header.
```

---

## CHECKLIST DE VALIDAÇÃO (antes de me passar)

Antes de me passar os mockups aprovados, confirme:
- [ ] Nenhuma marca de banco/cooperativa visível
- [ ] Idioma 100% PT-BR
- [ ] Cores hex casam com paleta acima (ferramenta: zoom no PDF e
      conta-gotas pra verificar)
- [ ] Hierarquia tipográfica: H1 ≫ H2 > H3 > body
- [ ] Eyebrow mono uppercase com letter-spacing nítido
- [ ] Banda accent lateral presente nas capas
- [ ] White space generoso (margens 54pt, parágrafos respirando)
- [ ] Tabelas com fio fino, header mono, accent só no fio do header
- [ ] Tom geral: documento corporativo premium, não decorativo

Quando aprovar, salva em `docs/design/mockups/[tier]-[seção].png` e
me avisa.
