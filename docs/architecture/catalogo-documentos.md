# Catálogo de Documentos — Crédito Rural

Referência estrutural dos documentos oficiais que o produtor rural precisa
apresentar num pedido de crédito. Esse catálogo alimenta os prompts da IA
(entrevista/checklist/dossiê) e os templates de PDF — não é conteúdo para UI
pública.

Baseado em amostras reais anonimizadas aqui pra referência. Nenhum dado
pessoal de produtor aparece neste documento.

## Legenda

- **Criticidade**: ⭐⭐⭐ bloqueante / ⭐⭐ importante / ⭐ complementar
- **Emissor**: quem expede oficialmente
- **Validade**: tempo padrão antes de precisar reemitir
- **Campos-chave**: os dados que a IA precisa extrair/validar
- **Regras operacionais**: comportamentos que a IA precisa conhecer

---

## 1. CAR — Cadastro Ambiental Rural · ⭐⭐⭐

- **Emissor**: SICAR (federal) via órgão ambiental estadual (cada UF tem seu
  sistema — GO: SEMAD; MT: SEMA; MS: IMASUL; etc).
- **Validade**: sem data formal, mas pode ser **suspenso/cancelado** por
  notificação não respondida. Bancos exigem atualizado nos últimos 12 meses.
- **Layout típico**: 3 páginas — identificação, representação gráfica (imagem
  satelital com polígono em amarelo), áreas declaradas e matrículas anexas.

### Campos-chave

- Registro CAR: formato `UF-CCCCCCC-HASH32` (ex: `GO-5205513-...`)
- Código do protocolo (distinto do registro)
- Nome do imóvel (descritivo, múltiplas fazendas podem compor um único CAR)
- Município + UF
- Coordenadas geográficas do centroide (lat/long graus-minutos-segundos)
- Área total (ha) + Módulos fiscais
- CPF/CNPJ + nome do proprietário/possuidor
- Áreas declaradas: Total · Líquida · Servidão · Consolidada · Remanescente
  de Vegetação Nativa · Reserva Legal · APP · Uso Restrito
- Lista de matrículas que compõem o imóvel CAR

### Regras operacionais (ensinar à IA)

- **CAR e matrícula podem ter áreas diferentes** — ex: matrícula soma 1503,85 ha,
  CAR declara 1501,43 ha. Diferença vem da representação gráfica georreferenciada
  vs área cartorial. **Até ~0,5% é normal**, acima disso pede investigação.
  A IA deve tranquilizar o produtor quando a diferença for pequena, não alarmar.
- **Um CAR pode englobar múltiplas matrículas** (grupo rural consolidado) —
  não confundir com matrícula única.
- **Data de cadastro antiga** (pré-2015) geralmente é **positivo** — mostra
  que o produtor é diligente. Data recente + sem averbação de reserva legal
  = ponto de atenção.
- **Status de validação**: cadastrado ≠ analisado ≠ validado. Banco raramente
  pede validação final (processo lento); cadastrado já atende.

---

## 2. CCIR — Certificado de Cadastro de Imóvel Rural · ⭐⭐⭐

- **Emissor**: INCRA (MDA — Ministério do Desenvolvimento Agrário).
- **Validade**: exercício anual. A taxa precisa estar **quitada** — sem
  quitação, CCIR não vale.
- **Layout**: 1 página densa com várias tabelas.

### Campos-chave

- Código do imóvel rural (formato: `XXX.XXX.XXX.XXX-X`)
- Denominação do imóvel
- Área total (ha) + Área certificada (ha — só se georreferenciado SIGEF)
- Classificação fundiária: **critério crucial pra crédito** (ver abaixo)
- Indicações de localização (estrada/referência)
- Município sede + UF
- Módulo rural (ha) / Nº módulos rurais / Módulo fiscal (ha) / Nº módulos
  fiscais / Fração mínima de parcelamento
- Situação jurídica: tabela com matrículas registradas (cartório, data,
  matrícula, registro, livro, área)
- Dados do declarante (nome, CPF/CNPJ, nacionalidade)
- Dados dos titulares (CPF, nome, condição — Proprietário/Posseiro/etc,
  detenção %)
- Taxa de serviços cadastrais (débitos, valor, multa, juros, status)
- Número de autenticidade (rodapé)

### Classificação fundiária × linha MCR disponível

| Classificação | Módulos fiscais | Linhas MCR típicas |
|---|---|---|
| **Minifúndio** | < 1 | Pronaf (subgrupos A/B/C conforme renda) |
| **Pequena Propriedade** | 1 a 4 | Pronaf + Pronamp entrando |
| **Média Propriedade** | 4 a 15 | Pronamp (teto R$ 2,1M) |
| **Grande Propriedade** | > 15 | Mercado Livre (recursos livres) ou BNDES |

**Produtiva vs Improdutiva**: o rótulo "Improdutiva" aparece quando o imóvel
não atinge índices da Lei 8.629/93. Produtor com imóvel improdutivo tem
**risco de desapropriação** pra reforma agrária — é tabu pro comitê de
crédito. A IA precisa tratar esse campo com cuidado.

### Regras operacionais

- **CCIR não legitima domínio** — é apenas cadastral. Domínio vem da matrícula.
- Taxa não paga = CCIR **inválido**, precisa reemitir (só no Banco do Brasil).
- Número de autenticidade no rodapé permite validação online no SNCR.

---

## 3. Matrícula de Imóvel (c.i.t. — Certidão de Inteiro Teor) · ⭐⭐⭐

- **Emissor**: Cartório de Registro de Imóveis da comarca.
- **Validade**: bancos pedem emitida nos **últimos 90 dias** pra operações
  com garantia hipotecária.
- **Layout**: variável por cartório, mas sempre cronológico.

### Campos-chave

- Número da matrícula + livro + folha + ficha (se houver)
- Data de abertura
- Descrição do imóvel: denominação, localização, confrontações, área
- Proprietário atual + CPF/CNPJ + estado civil + regime de bens
- Histórico de registros (R-1, R-2, R-3...) — ordem cronológica de:
  - Transmissões (compra e venda, doação, herança, permuta)
  - Ônus reais (hipoteca, penhor, alienação fiduciária, usufruto)
  - Averbações (reserva legal, retificações, gravames)
- Averbações (AV-1, AV-2...) — alterações não-dominiais (CAR, demarcação,
  regularização, etc.)
- Certidão de inteiro teor (c.i.t.) = cópia integral com todos os registros
  e averbações desde a abertura.

### Regras operacionais

- **"Matrícula positiva"** = tem ônus (hipoteca, penhora, usufruto, etc.) →
  explica pro banco por quê.
- **Reserva legal averbada na matrícula** é ponto forte no dossiê. Se estiver
  só no CAR (não averbada), banco pode exigir a averbação como condicionante.
- **Regime de bens do proprietário importa pra garantia**: comunhão parcial
  exige anuência do cônjuge; separação total não; união estável é caso a caso.
- **Fracionamento < FMP** (fração mínima de parcelamento) é nulo por lei
  5.868/72 — pode indicar risco documental.

### Múltiplas matrículas (caso comum)

Propriedade rural grande frequentemente é composta por várias matrículas
(ex: 5 matrículas somando 1.518 ha em Cocalzinho/GO). Banco precisa receber:
- Uma c.i.t. por matrícula
- A lista consolidada no CCIR
- O conjunto vinculado ao CAR
A IA precisa **detectar esse caso** e pedir todas as matrículas, não apenas
a principal.

---

## 4. CIB Federal — Certidão Negativa RFB/PGFN de Imóvel Rural · ⭐⭐⭐

- **Emissor**: Receita Federal (RFB) + Procuradoria-Geral da Fazenda Nacional
  (PGFN) — certidão conjunta.
- **Validade**: **6 meses** a partir da emissão.
- **Layout**: 1 página.

### Campos-chave

- CIB (Cadastro de Imóvel na Base — 8 dígitos, ex: `4.833.321-2`)
- Nome do imóvel
- Município + UF
- Área total (ha) — deve bater com CCIR
- Contribuinte + CPF
- Status: **Negativa** (sem pendências) · **Positiva** (com pendências) ·
  **Positiva com efeito de negativa** (pendências em parcelamento ativo)
- Código de controle (verificação online em rfb.gov.br / pgfn.gov.br)
- Hora/data de emissão + validade

### Regras operacionais

- **CIB Federal ≠ CIB Estadual** (são documentos diferentes — confusão comum!).
  CIB Federal prova regularidade RFB/PGFN. CIB Estadual (quando existe) é
  certidão municipal/estadual sobre ITR/IPTU.
- Certidão **Positiva bloqueia operação de crédito** até saneamento.
  Positiva-com-efeito-de-negativa é aceita se o parcelamento está em dia.

---

## 5. Sistema de Controle de Animais (Saldo da Exploração) · ⭐⭐ pecuária

- **Emissor**: órgão estadual de defesa agropecuária (INDEA/MT, IAGRO/MS,
  AGRODEFESA/GO, INDEA/AP, IDARON/RO, AGED/MA, etc.).
- **Validade**: data-corte declarada (usar a mais recente disponível).
- **Layout**: 1-2 páginas. Estratificação × sexo × idade.

### Campos-chave

- Código da exploração + código PGA + status (ATIVO / SUSPENSO)
- Propriedade + município + situação fundiária (Proprietário/Arrendatário)
- CPF + nome do(s) produtor(es)
- Tabela SALDO NORMAL: espécie × estratificação × sexo × quantidade
  - Bovino estratificado: 00-04 · 05-12 · 13-24 · 25-36 · >36 meses × M/F
  - Outros: ovino, suíno, equino (tabelas similares)
- Total por espécie + total geral
- Histórico de vacinas/comunicações: etapa, data, origem
  (Aftosa, Brucelose B19/RB51, Raiva, Newcastle conforme espécie)
- Histórico de estoque (comunicações obrigatórias — maio/novembro)

### Regras operacionais

- **Relevante apenas pra crédito pecuário** (Moderfrota, Inovagro, custeio
  pecuário, Prodecoop pecuária). Crédito de lavoura ignora.
- **Perfil do rebanho conta**: rebanho com >40% em fêmeas >36 meses + cria
  jovem abundante = **cria/recria** (perfil clássico). Rebanho com machos
  13-24 meses massivo = **engorda/confinamento**.
- **Vacinas em atraso** (ex: Aftosa há >2 anos em UF sem status OIE livre
  sem vacinação) = risco sanitário alto, banco rejeita.
- **Cadastro suspenso** = bloqueio imediato.

---

## 6. Declaração de Dados Cadastrais (Pessoa Física) · ⭐⭐

- **Emissor**: Receita Federal (extrato do CPF) ou sistema interno de
  verificação cadastral (algumas cooperativas geram próprio).
- **Validade**: 30 dias é o conservador.
- **Layout**: variável.

### Campos-chave

- Nome completo + CPF
- Data de nascimento
- Nome da mãe
- Título de eleitor
- Endereço cadastrado
- Situação cadastral (Regular / Suspensa / Cancelada / Nula / Pendente)
- Data de inscrição
- Digito verificador

### Regras operacionais

- Banco sempre confere **situação cadastral** antes de aprovar. Qualquer
  status diferente de **Regular** trava a operação.
- Nome e data de nascimento precisam casar com matrícula e outros docs —
  divergência gera exigência.

---

## 7. ITR — Comprovante de Pagamento · ⭐⭐⭐

- **Emissor**: Receita Federal (DARF quitado) + DITR (declaração).
- **Validade**: exercício anual. Banco exige os **últimos 5 exercícios**.

### Campos-chave

- CIB do imóvel (vincula ao CCIR)
- Exercício
- Valor VTN (valor da terra nua) declarado
- Área tributável
- Grau de utilização (GU) + Grau de eficiência na exploração (GEE) —
  define alíquota (0,03% a 20%)
- Valor do imposto + valor pago + data de pagamento

### Regras operacionais

- GU baixo (<30%) + área grande = **alíquota alta + risco de "improdutiva"**
  no CCIR. Produtor com esse perfil precisa ser orientado antes do pedido.
- Parcelamento ativo conta como regular se em dia.

---

## 8. IR Pessoa Física (últimas 2 declarações) · ⭐⭐⭐

- **Emissor**: Receita Federal (recibo + declaração completa).
- **Validade**: anual (abril do ano-calendário seguinte).

### Campos-chave extraídos (pra IA processar)

- Rendimentos tributáveis · isentos · exclusivos
- Receita bruta de atividade rural (Anexo Atividade Rural)
- Patrimônio declarado: imóveis, veículos, investimentos, participações
- Dívidas e ônus
- Relação de imóveis rurais (deve bater com CCIR)

### Regras operacionais

- **Receita bruta anual rural define enquadramento**:
  - Até R$ 360k → Pronaf (se módulos < 4)
  - Até R$ 3M → Pronamp
  - Acima → Mercado Livre ou BNDES
- Patrimônio declarado × dívidas = base pra comitê avaliar endividamento.
  Relação dívida/patrimônio > 50% acende alerta.

---

## 9. CNDs — Certidões Negativas · ⭐⭐⭐

Três certidões distintas (todas obrigatórias pra dossiê completo):

| Certidão | Emissor | Validade | Portal |
|---|---|---|---|
| **CND Federal PF** | RFB/PGFN | 180 dias | regularize.pgfn.gov.br |
| **CND Estadual** | Sefaz UF do produtor | 30-180 dias (varia) | portal Sefaz local |
| **CND Municipal** | Prefeitura do município do imóvel e do produtor | 30 dias típico | portal prefeitura |

### Regras operacionais

- Certidão **Positiva** em qualquer esfera **bloqueia** a operação.
- **Positiva-com-efeito-negativa** (parcelamento ativo) aceita.
- CND Federal PF **é diferente** do CIB Federal (item 4) — a PF cobre o
  CPF do produtor; o CIB cobre o imóvel.

---

## 10. Licença / Outorga Ambiental · ⭐⭐ (quando aplicável)

- **Emissor**: órgão ambiental estadual.
- **Quando exige**: irrigação, barragem, desmatamento autorizado, atividade
  poluidora (confinamento >500 animais, granjas, abatedouro, piscicultura).
- **Tipos**: LP (Prévia) · LI (Instalação) · LO (Operação) · Outorga de
  uso da água (ANA/estadual).

### Regras operacionais

- Operação agrícola simples (lavoura de sequeiro) geralmente **dispensa**.
- Pedido de crédito pra investimento em irrigação **exige outorga prévia**.
- LO vencida ou ausente em operação que exigia = **exigência crítica**.

---

## 11. Projeto Técnico + Croqui + ART · ⭐⭐⭐ (operações > R$ 1M)

- **Emissor**: agrônomo/eng. agrônomo habilitado CREA.
- **Conteúdo**: descrição da lavoura/pecuária projetada, cronograma físico-
  financeiro, orçamento detalhado, croqui de implantação, análise de solo,
  ART (anotação de responsabilidade técnica) no CREA.

### Regras operacionais

- Exigido formalmente em **linhas de investimento** (Moderfrota, Inovagro,
  Prodecoop).
- No **custeio** acima de R$ 1M, comitê pede mesmo sem exigência formal.
- Assinatura digital ICP-Brasil é aceita (CFC/CREA reconhecem desde 2020).

---

## 12. Registrato / Extrato SCR · ⭐⭐⭐

- **Emissor**: Banco Central (sistema de Registrato — registrato.bcb.gov.br).
- **Gratuito**, emitido pelo próprio produtor com conta gov.br.
- **Conteúdo**: todo endividamento bancário consolidado — operações ativas,
  vencimentos, responsabilidade solidária, classificação de risco.

### Regras operacionais

- **Produtor que leva o registrato junto do dossiê antecipa** a pergunta do
  comitê — transmite organização. A IA deve sempre orientar a puxar.
- Endividamento > 50% da receita bruta anual acende alerta. Acima de 80%
  geralmente trava operação nova sem reestruturação prévia.

---

## 13. Certidões de Protesto / Cartório Distribuidor · ⭐⭐

- **Emissor**: cartórios de protesto + distribuidor cível/criminal da
  comarca do produtor e da comarca do imóvel.
- **Validade**: 30 dias típico.

### Campos-chave

- Certidão de protestos (indica títulos protestados)
- Certidão de distribuição cível (ações em curso)
- Certidão de distribuição trabalhista (TRT local)
- Certidão criminal (bancos premium pedem — lavagem/PEP/mídia negativa)

### Regras operacionais

- Protestos ativos = **trava operação**. Pagar + certidão de baixa = regulariza.
- Ações trabalhistas em andamento com valor > patrimônio = alerta.

---

## 14. Contrato Social / Balanço (PJ — quando o crédito é em CNPJ)

- Contrato Social + última alteração consolidada
- Certidão da Junta Comercial (simplificada)
- Balanço + DRE dos últimos 2 exercícios
- Faturamento dos últimos 12 meses (assinado pelo contador)
- CND Federal PJ (RFB/PGFN + INSS + FGTS)

---

## Documentos anexos complementares (conforme perfil)

- **Seguro agrícola** (apólice PROAGRO ou privado vigente)
- **TAC** (termo de ajuste de conduta ambiental)
- **PRAD** (programa de recuperação de área degradada)
- **CND IBAMA** (quando há histórico de embargo)
- **Escritura de compra e venda** (prova de dominialidade histórica)
- **Certidão de casamento** (regime de bens afeta garantia)
- **Comprovante de residência** (padrão)

---

## Matriz de criticidade por linha de crédito

| Documento | Pronaf | Pronamp | Mercado | BNDES Invest. | Custeio Pecuário |
|---|---|---|---|---|---|
| CAR | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| CCIR | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| Matrícula c.i.t. | ⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| CIB Federal | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| Saldo animais | — | — | — | — | ⭐⭐⭐ |
| ITR (5 exerc.) | ⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| IR PF (2 exerc.) | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| CNDs (Fed/Est/Mun) | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| Licença/Outorga | — | — | ⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| Projeto + ART | — | ⭐ (> R$ 500k) | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| Registrato | ⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| Protestos/Distr. | ⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |

---

## Observações pra prompt da IA

1. Quando o produtor diz "a fazenda tem 500 ha", perguntar **se é uma matrícula
   ou várias**. Muitas operações grandes são compostas por múltiplas matrículas.

2. Operação **multi-estado** (produtor com imóveis em GO + MT, por exemplo)
   exige CCIR, CAR, CNDs e ITR **por imóvel, por UF**. Não unificar.

3. **Diferença CAR × matrícula** até 0,5% é normal — tranquilizar o produtor.
   Acima disso, investigar (retificação de área, georreferenciamento pendente).

4. Classificação **"Grande Propriedade Improdutiva"** é sinal de alerta alto —
   fora de qualquer risco de desapropriação na prática, mas no comitê pega mal.
   Orientar sobre melhora de GU/GEE via ITR antes de protocolar.

5. Banco médio/cooperativa regional pede **registrato** mesmo em custeio pequeno
   — é grátis, 5 minutos, rende credibilidade ao dossiê. Sempre empurrar.

6. **Certidões em dia × safra**: antes de comprar a operação de custeio,
   produtor deve emitir o **pacote de certidões novas** (30 dias antes).
   Emitir cedo = vencer antes do comitê = exigência.
