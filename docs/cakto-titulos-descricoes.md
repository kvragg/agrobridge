# Cakto — Títulos e descrições por produto (versão final)

Copy pronta pra colar no painel Cakto (https://app.cakto.com.br/produtos).
Cada produto tem 2 campos principais: **Nome do produto** · **Descrição**.

Diretrizes editoriais aplicadas:
- ✅ "Assessoria de Crédito Rural" / "Consultoria Especializada"
- ❌ "Mesa de Crédito" · "Despachante" · marca de banco/cooperativa
- ✅ Garantia 7 dias com lastro CDC art. 49 (proteção contra abuso)
- ✅ Pagamento único reforçado
- ✅ Emails corporativos (suporte@ e comercial@)
- ✅ Sem promessa de aprovação
- ✅ Valor exato no nome e na descrição

---

## 🥉 Bronze · R$ 79,99

### Nome do produto
```
Diagnóstico Rápido — Assessoria de Crédito Rural · R$ 79,99
```

### Descrição
```
Por R$ 79,99, antes de ir ao banco, entenda exatamente o que falar — e o que NÃO falar — ao gerente.

O Diagnóstico Rápido é a porta de entrada da assessoria de crédito rural AgroBridge. Você passa por uma entrevista técnica completa com IA estratégica calibrada pra crédito rural, recebe um diagnóstico tático em PDF com seu posicionamento bancário, roteiro do que dizer na agência, leitura crítica do perfil em linguagem de comitê e identificação preliminar da linha MCR mais aderente ao seu caso.

Ideal pra quem quer entender se vale ir ao banco agora ou ajustar pontos antes de protocolar.

Investimento: R$ 79,99 · pagamento único · sem mensalidade.

Garantia de 7 dias: se o serviço não atender suas expectativas, devolvemos 100% do valor. Pedidos de estorno após uso completo do produto (download do parecer técnico em PDF) são analisados individualmente conforme art. 49 do Código de Defesa do Consumidor.

Suporte: suporte@agrobridge.space
Comercial: comercial@agrobridge.space
```

---

## 🥈 Prata · R$ 397,00

### Nome do produto
```
Dossiê Bancário Completo — Consultoria Especializada · R$ 397,00
```

### Descrição
```
Por R$ 397,00, o pedido pronto pra entregar ao comitê de crédito — no formato que o analista do banco defende.

O Dossiê Bancário Completo é o entregável institucional da consultoria especializada de crédito rural AgroBridge. Inclui tudo do Diagnóstico Rápido + dossiê profissional em PDF de 6 páginas, sumário executivo, checklist 100% ordenado conforme o Manual de Crédito Rural (MCR/Bacen), validação por IA de cada documento anexado (CAR, CCIR, ITR, matrículas, CNDs e demais), defesa de crédito redigida em linguagem de comitê, capítulo de análise de garantias e roteiro de visita técnica do analista na fazenda.

Adicionais sob consulta (solicite após a compra por suporte@agrobridge.space):
• Revisão jurídica de matrícula: +R$ 150
• Análise de saldo de rebanho (Iagro/AgroDefesa): +R$ 200
• WhatsApp prioritário 30 dias: +R$ 99

Recomendado pra operações entre R$ 100 mil e R$ 3 milhões.

Investimento: R$ 397,00 · pagamento único · sem mensalidade.

Garantia de 7 dias: se o serviço não atender suas expectativas, devolvemos 100% do valor. Pedidos de estorno após uso completo do produto (download do dossiê institucional em PDF) são analisados individualmente conforme art. 49 do Código de Defesa do Consumidor.

Suporte: suporte@agrobridge.space
Comercial: comercial@agrobridge.space
```

---

## 🥇 Ouro · R$ 1.497,00

### Nome do produto
```
Assessoria Premium 1:1 — Acompanhamento com o Fundador · R$ 1.497,00
```

### Descrição
```
Por R$ 1.497,00, acompanhamento pessoal direto com quem geriu carteira Agro em banco privado por 14 anos.

A Assessoria Premium 1:1 inclui tudo do Dossiê Bancário Completo + sessão 1:1 de 45 minutos com o fundador (videoconferência ou WhatsApp), revisão cirúrgica pessoal do seu dossiê antes do protocolo, análise de gargalos ocultos que o comitê pesquisa em silêncio (risco reputacional, mídia, PEP, processos, embargos ambientais, classificação SCR/Bacen), parecer estratégico assinado anexo ao dossiê, roteiro de defesa oral em comitê personalizado e indicação pessoal de projetista CREA, agrônomo ou estudo de limites quando o caso exigir.

Apenas 6 vagas por mês — protege a qualidade do atendimento. Recomendado a partir de R$ 500 mil de operação pretendida.

Sessão agendada após 24h da confirmação do pagamento. Faltas sem aviso prévio de 24h serão cobradas normalmente.

Investimento: R$ 1.497,00 · pagamento único · sem mensalidade.

Garantia de 7 dias antes da sessão: se mudar de ideia antes de a sessão 1:1 acontecer, devolvemos 100% do valor. Após a sessão de mentoria realizada, o serviço de consultoria foi consumido — pedidos de estorno serão analisados individualmente conforme art. 49 do Código de Defesa do Consumidor.

Suporte: suporte@agrobridge.space
Comercial: comercial@agrobridge.space
```

---

## ⚙️ Configuração técnica do Cakto

Pra cada produto, garantir:

- ✅ **Preço**: R$ 79,99 / 397,00 / 1.497,00
- ✅ **Imagem**: upload do `*-600x500.png` correspondente (de `docs/cakto-images/`)
- ✅ **Pagamento único** ativado (não recorrente)
- ✅ **PIX, cartão à vista e parcelado** habilitados
- ✅ **Webhook URL**: `https://agrobridge.space/api/pagamento/webhook`
- ✅ **Política de reembolso**: 7 dias **mediante análise** (NÃO automático — Cakto envia email pra você aprovar)
- ✅ **URL de redirect pós-pagamento**: `https://agrobridge.space/dashboard?paid=1`

## 🛡️ Proteção contra ma-fé

Camadas ativas:

1. **Redação CDC art. 49** nas descrições (lastro jurídico)
2. **Política Cakto manual** (não-automática) pra reembolso
3. **Audit log** já registra IP + timestamp de cada geração/download (`audit_events` table)
4. **TODO próximo**: watermark dinâmico no PDF com nome+CPF+ID

Custo realista de chargeback abusivo: 1-3% — compensa folgado pela conversão extra que a garantia gera.

---

## 📞 Emails configurados

- `suporte@agrobridge.space` — LGPD, ajuda operacional, dúvidas técnicas
- `comercial@agrobridge.space` — vendas, pré-venda, lead notification

**Pra receber**: Cloudflare Email Routing (grátis) ou Google Workspace Business Starter (R$ 30/mês quando volume justificar).
