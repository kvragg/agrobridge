# Incident Response Plan — AgroBridge

> **Versão 1.0 · 2026-04-28** · Owner: Paulo Costa (controller + DPO)
>
> Playbook de 1 página pra agir sob pressão. Quando o D-Day chegar, abra
> aqui antes de fazer qualquer coisa. Decisão sob pânico erra.

---

## 1. Detecção (como fica sabendo?)

| Sinal | Onde aparece | Quem alerta |
|---|---|---|
| Erro novo em prod | Sentry → email Paulo | Sentry rule `16975163` (cap 30min) |
| Regressão (resolved → unresolved) | Sentry → email | Rule `16975204` |
| Site fora do ar | UptimeRobot → email/SMS | apontando `/api/health` |
| Cron parou (lembretes) | Sentry → "missed check-in" | monitor `cron-lembretes` |
| Disclosure responsável | Email <security@agrobridge.space> | Pesquisador externo |
| Suporte cliente reportando | Email <suporte@agrobridge.space> | Cliente |
| Alerta de billing anômalo | Email Anthropic / Vercel / Supabase | Provedor |
| Login admin não-reconhecido | Email Supabase Auth | Supabase |

**Triagem em 10 min:** identifique tipo, severidade preliminar e se há vazamento de dado pessoal.

| Severidade | Critério | SLA de resposta |
|---|---|---|
| **P0 Crítico** | Dado pessoal vazado, RCE, auth bypass total, fundos roubados | Imediato — para tudo |
| **P1 Alto** | Falha de auth/RLS específica, prompt injection ativo, DDoS visível | 1h |
| **P2 Médio** | Bug com impacto de segurança limitado, info disclosure baixo | 24h |
| **P3 Baixo** | Hardening, melhoria de processo, false positive | 7 dias |

---

## 2. Contenção (primeiros 60 min em P0/P1)

**Objetivo: parar o sangramento sem fazer dano colateral. Não corrija ainda — contém.**

1. **Avalie escopo** — quantos usuários afetados? CPF/email/dado financeiro envolvido?
2. **Snapshot do estado** antes de mexer:
   - `git log -10 --oneline > snapshot-commits.txt`
   - Supabase: query nas tabelas `audit_events`, `webhook_events`, `mensagens` filtrando janela suspeita
   - Sentry: link permanente do issue + URL do replay (se houver)
   - Vercel: log do deploy ativo
3. **Ações de contenção por tipo:**

| Tipo | Ação imediata |
|---|---|
| Conta admin comprometida | Supabase Auth → reset senha + invalidate all sessions; rotacionar `SUPABASE_SERVICE_ROLE_KEY` (Vercel env) |
| Vazamento via rota API | Vercel → revert deploy (`vercel rollback`) ou `git revert` + push (auto-deploy) |
| RLS quebrada | Aplicar migration `REVOKE ALL ON <tabela> FROM authenticated;` via Supabase MCP, pensar fix depois |
| Webhook Cakto sendo abusado | Rotacionar `CAKTO_WEBHOOK_SECRET` no Vercel + Cakto dashboard simultaneamente |
| Saldo Anthropic esgotando | Anthropic Console → desligar API key temporariamente; rate limit Upstash pra zero |
| Storage com arquivo malicioso | Supabase Storage → mover bucket pra modo private + revogar signed URLs |
| Phishing imitando AgroBridge | Reportar domínio falso: phish@phishtank.com, abuse do registrador |

4. **Comunicar internamente** (você é solo, mas registre):
   - Crie issue privado no GitHub com tag `incident-YYYYMMDD-NN`
   - Timeline: o que aconteceu, quando descobriu, ações até agora

---

## 3. Comunicação (P0 com vazamento de dado pessoal — 72h ANPD)

**LGPD Art. 48 obriga comunicar à ANPD em prazo razoável (ANPD interpreta como ~72h).**

### 3.1. Comunicar ANPD

**Canal:** [https://www.gov.br/anpd/pt-br/canais_atendimento/agente-de-tratamento](https://www.gov.br/anpd/pt-br/canais_atendimento/agente-de-tratamento)

**Conteúdo mínimo (modelo):**

```
Razão social: [seu CNPJ ou CPF se ainda PF]
Encarregado (DPO): Paulo Costa — security@agrobridge.space
Data do incidente: YYYY-MM-DD HH:MM (BRT)
Data da descoberta: YYYY-MM-DD HH:MM
Natureza: [tipo — vazamento, modificação, indisponibilidade]
Categorias afetadas: [CPF, email, dado financeiro, etc]
Volume estimado: [N titulares]
Causa raiz inicial: [breve]
Medidas de contenção tomadas: [lista]
Próximos passos: [investigação, comunicação titular, hardening]
```

### 3.2. Comunicar titulares afetados

Email transparente em até 72h após confirmação. Template em `lib/email/resend.ts` — criar `enviarComunicadoIncidente` se ainda não existir.

**Tom:**
- Honesto sobre o que aconteceu (sem maquiar)
- Concreto sobre o impacto pra ele (que dado dele especificamente)
- Ações que tomamos
- O que ele pode/deve fazer (resetar senha, monitorar conta bancária se aplicável)
- Canal de contato pra dúvidas

**Não use:**
- Linguagem jurídica defensiva
- "De acordo com nossas políticas"
- Subject ambíguo ("Atualização importante") — diga **"Comunicado de incidente de segurança"**

### 3.3. Comunicar publicamente (se aplicável)

Página `/seguranca/incidentes/YYYY-MM-DD.md` com:
- Resumo factual
- Timeline
- Impacto
- Correções aplicadas
- Lições aprendidas

Vale fazer se afetou >100 titulares ou se virou notícia. Senão, comunicação privada já basta.

---

## 4. Erradicação + recuperação

1. **Identifique a causa raiz** — não a sintomática. Pergunte "por quê?" 5 vezes.
2. **Patch em ambiente de preview primeiro** (Vercel auto-cria branch preview).
3. **Teste:** rode `vitest run` + `tsc --noEmit` + `npm run build` no patch.
4. **Smoke test em preview** com URL real antes de mergear.
5. **Merge + deploy prod.**
6. **Validação pós-deploy:**
   - Sentry: issue caiu pra zero?
   - Supabase advisor: alguma regressão?
   - Funcionalidade afetada: tem cobertura de teste? Se não, escrever agora.

---

## 5. Post-mortem (em até 7 dias após contenção)

Crie `docs/post-mortems/YYYY-MM-DD-<slug>.md` com estrutura:

```markdown
# Post-mortem: <título curto>

**Data do incidente:** YYYY-MM-DD HH:MM BRT
**Duração:** Xh
**Severidade:** P0/P1/P2
**Status:** Resolvido / Mitigado / Aberto

## Resumo
1 parágrafo executivo.

## Impacto
- Usuários afetados: N
- Dados afetados: tipos
- Receita perdida: R$ X (downtime ou cliente perdido)

## Timeline
- HH:MM — primeiro sinal
- HH:MM — alertado
- HH:MM — começou contenção
- HH:MM — mitigado
- HH:MM — corrigido

## Causa raiz
Diagnóstico técnico final. Não escreva "erro humano" — vá além.

## Por que as defesas existentes não pegaram?
RLS? Rate limit? Logger? Audit? Monitoramento? Onde falhou.

## Ações
- [ ] Curto prazo (próxima semana): X
- [ ] Médio prazo (próximo mês): Y
- [ ] Longo prazo (próximo trimestre): Z

## O que funcionou bem
Honesto. Sentry alertou? Backup salvou? Resposta foi rápida?
```

---

## 6. Contatos de emergência

| Contato | Quando | Como |
|---|---|---|
| ANPD | Vazamento de dado pessoal | <https://www.gov.br/anpd> formulário |
| Supabase Support | Banco fora do ar / suspeita comprometimento | <support@supabase.io> + dashboard ticket |
| Vercel Support | Plataforma fora do ar / abuso | dashboard ticket (Pro/Enterprise) |
| Anthropic Support | API key vazada / abuso | <support@anthropic.com> |
| Cakto Support | Webhook abuso / fraude | dashboard ticket |
| Receita Federal (CSIRT) | Vazamento massivo de CPF | <ciberseguranca@receita.fazenda.gov.br> |
| CERT.br | Crime cibernético | <cert@cert.br> |

---

## 7. Política de retenção de evidência

Evidência de incidente fica **arquivada por mínimo 5 anos** (CTN art. 174 + LGPD compliance). Pasta isolada: `docs/incidents/<YYYY-MM-DD-slug>/` com:
- Snapshots de logs (sanitizados de PII alheio)
- Screenshots de dashboards
- Comunicados enviados
- Post-mortem
- Comprovante ANPD (se aplicável)

---

**Última revisão:** 2026-04-28 — Paulo Costa
**Próxima revisão:** quando: (a) houver primeiro incidente real, (b) base passar de 100 clientes pagos, (c) a cada 6 meses sem mexer.
