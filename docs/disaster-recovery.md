# Disaster Recovery — AgroBridge

> **Versão 1.0 · 2026-04-28**
>
> Plano de recuperação. Quem você é nesse documento: o Paulo do D-Day, com
> nervo, sob pressão. O Paulo de hoje preparou tudo pro Paulo do futuro.

---

## RTO / RPO atuais (target)

| Métrica | Target | Realidade hoje |
|---|---|---|
| **RTO** (Recovery Time Objective — quanto tempo até voltar) | 4h | Estimado 2-6h (managed) |
| **RPO** (Recovery Point Objective — quanto dado posso perder) | 24h | Supabase Free: 24h. Pro: PITR 7 dias |
| Backup frequency | Diária | Supabase managed |
| Retention | 7 dias (Free) / 30 dias (Pro) | Free atual |
| Restore tested? | Sim, trimestral | **Não testado** ❌ — fazer pela 1ª vez |

> **Pendente prioritário:** primeiro restore test antes de bater 100 clientes.
> Sem isso, o RTO/RPO acima são teóricos.

---

## Cenários e respostas

### Cenário A — Supabase fora do ar (incidente do provedor)

**Probabilidade:** baixa (uptime histórico Supabase >99.9%) · **Impacto:** total

**O que fazer:**
1. Confirmar em <https://status.supabase.com>
2. Se confirmado, página de "manutenção" via Vercel:
   ```ts
   // Em proxy.ts, retornar 503 com retry-after pra todas rotas que tocam DB
   ```
3. Comunicar UptimeRobot status / suporte clientes via email broadcast
4. Aguardar restauração (não há fallback — Supabase é fundação)

**Mitigação futura:** Read replica em outra região (Supabase Pro $25/mo).

---

### Cenário B — Dados corrompidos (DELETE em massa, migration ruim)

**Probabilidade:** média · **Impacto:** dependendo do escopo, alto

**Recovery via Supabase managed backup:**

```bash
# 1. Confirmar quando aconteceu (check audit_events / Sentry timeline)
# 2. Acessar Supabase Dashboard → Database → Backups
# 3. Selecionar backup ANTES do incidente
# 4. Restaurar pra database isolado (NÃO em prod direto):
```

**Pelo dashboard:**
1. Settings → Database → "Restore" (Pro plan tem PITR — point in time recovery)
2. **Free plan:** pede ao suporte do Supabase via dashboard ticket (eles processam em ~24h)

**Pra bases pequenas (<1k linhas afetadas):**
- Reconstrução manual a partir do `audit_events`:
  ```sql
  -- Reconstruir simulacoes deletada por engano:
  SELECT user_id, payload->'input', payload->'output'
  FROM audit_events
  WHERE event_type = 'simulacao_criada'
    AND created_at > '2026-04-28T10:00:00Z'
    AND created_at < '2026-04-28T12:00:00Z';
  ```

---

### Cenário C — Vercel fora / domain comprometido

**Probabilidade:** baixa · **Impacto:** total

**O que fazer:**
1. Confirmar em <https://www.vercel-status.com>
2. Verificar DNS no registrar (Cloudflare ou Namecheap) — alguém mudou?
3. Se DNS comprometido: rotacionar credenciais do registrar + reaplicar DNS
4. Se Vercel: aguardar (deploy é managed). Worst case, vendor lock-in cobra preço — mas Next.js exporta self-host.

**Recovery alternativo (pesadelo):** rodar `next build` + `vercel deploy` em outra conta, OU `next start` em VPS Hetzner R$ 30/mês.

---

### Cenário D — Vazamento de chaves de API

**Probabilidade:** média (em equipe solo, copy/paste acidental ou vazamento via logs) · **Impacto:** alto

**Detecção:**
- Sentry alerta uso anômalo
- Anthropic / Supabase / Vercel mandam email
- GitHub Secret Scanning (habilitado)

**Resposta imediata (rotação em ordem):**

```bash
# 1. ANTHROPIC_API_KEY vazada
#    - console.anthropic.com → API Keys → Revoke
#    - Criar nova
#    - Vercel: vercel env rm ANTHROPIC_API_KEY production && vercel env add ANTHROPIC_API_KEY production
#    - Redeploy: vercel --prod

# 2. SUPABASE_SERVICE_ROLE_KEY vazada (CATASTRÓFICO — bypassa RLS)
#    - Supabase dashboard → Project Settings → API → Generate new service_role key
#    - Atualizar Vercel env imediato + redeploy
#    - Auditar audit_events: SELECT * FROM audit_events WHERE created_at > <data_vazamento> ORDER BY created_at DESC LIMIT 1000
#    - Considerar incident response se há sinal de uso indevido

# 3. RESEND_API_KEY vazada
#    - resend.com/api-keys → revoke
#    - Criar nova + atualizar Vercel + redeploy

# 4. CAKTO_WEBHOOK_SECRET vazado
#    - Cakto dashboard → Webhooks → rotate secret
#    - Vercel env update SIMULTANEAMENTE (entre rotação e update, webhooks falham)
#    - Cakto reenvia eventos perdidos automaticamente após retry

# 5. UPSTASH_REDIS_REST_TOKEN vazado
#    - upstash.com → DB → reset token
#    - Vercel env update
```

---

### Cenário E — Storage com arquivos maliciosos

**Probabilidade:** baixa (magic bytes + ownership transitiva protegem) · **Impacto:** médio

**Resposta:**
1. Identificar arquivo via Supabase Storage explorer
2. Verificar quem fez upload via `audit_events` (event_type='documento_validado' por user_id)
3. Mover arquivo pra bucket isolado `quarantine`
4. Banir conta do uploader (se confirmado abuso)
5. Hardening adicional: revisar `lib/file-sniff.ts` — extensão validada bate com magic bytes?

---

### Cenário F — Prompt injection ativo na IA do chat

**Probabilidade:** baixa (mitigação ONDA 3 fechou) · **Impacto:** médio

**Sinal:** mensagens da IA fugindo do system prompt (revelando regras, mudando de papel, fingindo ser outro modelo).

**Resposta:**
1. Capturar `mensagens` do user que dispararam o desvio:
   ```sql
   SELECT user_id, content, created_at
   FROM mensagens
   WHERE role = 'user'
     AND created_at > '<janela>'
     AND (content ~* 'ignore|disregard|jailbreak|developer mode|override');
   ```
2. Re-revisar `lib/ai/system-prompt.ts::sanitizarParaPrompt()` — token novo descoberto que defang não cobre?
3. Adicionar regra defensiva nova + teste em `tests/integration/ia-prompt-injection.test.ts`
4. Hotfix + deploy

---

## Procedimento de RESTORE TEST (fazer 1ª vez!)

> Ainda não foi feito. Roda essa primeira vez antes de bater 100 clientes.

### Setup (uma vez, 30 min)

1. Criar projeto Supabase Free **separado** chamado `agrobridge-restore-test`
2. Anotar URL + anon key + service_role key (não vai pra Vercel — só local)
3. `.env.dr-test` com essas credenciais (gitignored)

### Execução do teste (1h por execução, trimestral)

```bash
# 1. No Supabase prod, confirmar último backup disponível
#    Dashboard → Database → Backups → ver data mais recente

# 2. No projeto agrobridge-restore-test:
#    - Database → Backups → "Restore from another project"
#    - Escolher snapshot do prod
#    - Aguardar conclusão (5-30 min dependendo do tamanho)

# 3. Sanity checks no DB restaurado:
psql $RESTORE_TEST_URL -c "SELECT count(*) FROM processos;"
psql $RESTORE_TEST_URL -c "SELECT count(*) FROM compras WHERE status='paid';"
psql $RESTORE_TEST_URL -c "SELECT max(created_at) FROM audit_events;"

# Comparar com snapshots do prod (deve estar dentro da janela RPO)

# 4. Smoke test:
#    - Rodar projeto local com .env.dr-test apontando pro restored
#    - npm run dev
#    - Login com user de teste
#    - Verificar que tudo carrega: dashboard, checklist, simulador

# 5. Documentar no log:
#    docs/dr-test-runs/YYYY-MM-DD.md
#    - timestamp do snapshot escolhido
#    - tempo total do restore
#    - row counts validados
#    - issues encontrados
```

### Critério de sucesso

- ✅ Restore concluiu sem erro
- ✅ Row counts batem (margem de 5% pra timestamp diff)
- ✅ App roda contra DB restaurado
- ✅ RTO real medido < 4h target

---

## Política de cleanup pós-DR

Depois do teste:
1. Deletar projeto `agrobridge-restore-test` se Free tier ficar lotado
2. Manter docs do log de execução
3. Se algo deu errado, **incident response** apenas pra documentar — não conta como incidente real

---

## Calendário

- [ ] **2026-05 (próxima semana):** primeiro restore test
- [ ] **2026-08:** segundo (Q3)
- [ ] **2026-11:** terceiro (Q4)
- [ ] Trimestral daí em diante

Adicionar ao Google Calendar com lembrete 1 dia antes.
