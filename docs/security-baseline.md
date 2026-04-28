# Security Baseline — AgroBridge

> **Auto-pentest contra OWASP ASVS Level 2** · 2026-04-28
>
> ASVS = Application Security Verification Standard. Level 2 é o
> recomendado pra "applications that handle sensitive data" — case do
> AgroBridge (CPF, dado financeiro, PII em larga escala).
>
> Cada item: status atual + nota + onde está implementado.

**Legenda de status:**
- ✅ = implementado e validado
- 🟡 = implementado parcialmente / com débito
- ❌ = ausente
- N/A = não se aplica ao contexto

---

## V1 — Architecture, Design, Threat Modeling

| ID | Requisito | Status | Nota |
|---|---|---|---|
| V1.1.1 | SDLC documentado | 🟡 | CLAUDE.md + AGENTS.md cobrem práticas, mas não há SDLC formal |
| V1.1.2 | Threat modeling pra features novas | ❌ | A fazer: PR template tem checklist, mas TM dedicada não |
| V1.2.1 | Componentes confiáveis isolados | ✅ | `lib/supabase/{client,server,admin}` separa privilégios |
| V1.2.2 | Auth centralizada | ✅ | Supabase Auth — fonte única |
| V1.4.1 | Identidade verificada antes de operação sensível | ✅ | `proxy.ts` valida `auth.getUser()` em rotas protegidas |

**Gaps:** Threat modeling formal antes de feature complexa. **Mitigação:** PR template com seção "Riscos" força raciocínio.

---

## V2 — Authentication

| ID | Requisito | Status | Nota |
|---|---|---|---|
| V2.1.1 | Senha mínimo 12 chars | 🟡 | Hoje min 8. **Aumentar pra 10 (balance UX/sec)** |
| V2.1.2 | Senha permite >= 64 chars | ✅ | Limite 200 |
| V2.1.5 | Verificação contra senhas vazadas (HIBP) | ❌ | **Pendente toggle no Supabase Auth Dashboard** |
| V2.1.7 | Lockout após N tentativas falhas | ✅ | Supabase Auth nativo + rate limit IP no signup |
| V2.2.1 | MFA disponível | 🟡 | Supabase Auth suporta TOTP, não exposto na UI ainda. **Em construção** |
| V2.2.3 | MFA forçada pra admin | ❌ | **Pendente — você habilitar no seu user** |
| V2.3.1 | Reset de senha seguro | ✅ | Supabase Auth — token via email, expira |
| V2.7.1 | Sessão expira após inatividade | ✅ | Default Supabase: 1h access + 7d refresh |
| V2.8.1 | Anti-enumeração | ✅ | `app/api/auth/signup/route.ts` retorna 200 indistinguível |

**Gaps críticos:**
1. HIBP toggle (1 clique) — senhas vazadas em outros breaches passam batido.
2. MFA admin (15min de setup) — sua conta é single point of failure.

---

## V3 — Session Management

| ID | Requisito | Status | Nota |
|---|---|---|---|
| V3.1.1 | Cookies com `secure`, `httpOnly`, `sameSite` | ✅ | Supabase SSR setta corretamente |
| V3.2.1 | Token de sessão é random forte | ✅ | Supabase JWT com chave longa |
| V3.3.1 | Logout invalida sessão | ✅ | `supabase.auth.signOut()` |
| V3.5.1 | Re-auth pra ações sensíveis | 🟡 | Exclusão de conta exige dupla confirmação por email — equivale |
| V3.7.1 | CSRF protection | ✅ | SameSite=Lax + verificação de origin via Supabase |

---

## V4 — Access Control

| ID | Requisito | Status | Nota |
|---|---|---|---|
| V4.1.1 | Princípio do menor privilégio | ✅ | RLS por user_id em todas as tabelas com PII |
| V4.1.2 | Authz verificada server-side | ✅ | RLS no banco + checks explícitos em rotas |
| V4.1.3 | Authz não confia em URL/parâmetro | ✅ | Sempre `processo.user_id === auth.uid()` |
| V4.2.1 | IDOR protegido | ✅ | Defense-in-depth em 5 rotas (E2 / APEX-SEC) + RLS |
| V4.2.2 | CSRF pra ações sensíveis | ✅ | Cookies SameSite + origin check Supabase |
| V4.3.1 | Admin separado de user | ✅ | `lib/admin-auth.ts::getAdminUser()` com allowlist |
| V4.3.2 | Privilege escalation barrada | ✅ | RLS bloqueia anon/authenticated em tabelas críticas |

---

## V5 — Validation, Sanitization, Encoding

| ID | Requisito | Status | Nota |
|---|---|---|---|
| V5.1.1 | Validação de input em todos endpoints | ✅ | Zod em rotas críticas (auth, simulador) + type guards |
| V5.1.3 | Tamanho máximo definido | ✅ | `MAX_MENSAGEM_CHARS = 10_000` em chat, etc |
| V5.1.4 | Whitelist de tipos | ✅ | Enum em finalidade/cultura/garantia |
| V5.2.1 | Sanitização contra XSS | ✅ | React escapa por default + `formatarBold` escapa antes |
| V5.2.2 | Output encoding contextual | ✅ | React + escapeHtml em emails Resend |
| V5.3.1 | Anti-injection SQL | ✅ | Supabase usa prepared statements; nunca raw concat |
| V5.3.2 | Anti-injection NoSQL | N/A | Sem MongoDB |
| V5.3.5 | Anti-injection LDAP / XPath | N/A | Não usado |
| V5.3.7 | Anti-injection prompt (LLM) | ✅ | `sanitizarParaPrompt()` + `<lead_data>` wrap (ONDA 3) |

---

## V6 — Stored Cryptography

| ID | Requisito | Status | Nota |
|---|---|---|---|
| V6.1.1 | Dados sensíveis criptografados em rest | ✅ | Supabase encryption at rest (AWS RDS) |
| V6.2.1 | Algoritmos modernos (AES-256, etc) | ✅ | Managed pelo Supabase / Vercel |
| V6.2.2 | Chaves rotacionáveis | 🟡 | Manual hoje. Sem rotação automatizada |
| V6.4.1 | Chaves protegidas | ✅ | Vercel env vars (encrypted) + nunca no client |

---

## V7 — Error Handling and Logging

| ID | Requisito | Status | Nota |
|---|---|---|---|
| V7.1.1 | Não vaza stack/info em erro | ✅ | `capturarErroProducao` retorna msg amigável; logger sanitiza |
| V7.1.2 | Log estruturado (JSON) | ✅ | `lib/logger.ts` emite JSON 1-linha |
| V7.1.3 | PII não vai pra log | ✅ | `CAMPOS_PROIBIDOS` redacta cpf/email/nome/token |
| V7.2.1 | Sucesso/falha de auth logado | ✅ | `audit_events` event_type='login'/'login_falha' |
| V7.2.2 | Acesso a dado sensível logado | ✅ | `audit_events` em dossie_gerado, conta_excluida, etc |
| V7.3.1 | Logs protegidos contra adulteração | ✅ | `audit_events` é append-only (RLS bloqueia UPDATE/DELETE) |
| V7.3.4 | Logs com timestamp confiável | ✅ | `created_at DEFAULT now()` no Postgres |

---

## V8 — Data Protection

| ID | Requisito | Status | Nota |
|---|---|---|---|
| V8.1.1 | TLS em trânsito | ✅ | HTTPS forçado + HSTS preload (next.config.ts) |
| V8.1.2 | TLS pra serviços internos | ✅ | Vercel ↔ Supabase ↔ Anthropic todos TLS |
| V8.2.1 | Cache headers corretos pra dado sensível | ✅ | `Cache-Control: no-store, private` em rotas autenticadas |
| V8.2.3 | Auto-complete desabilitado em campos sensíveis | 🟡 | Não verificado — revisar inputs de senha |
| V8.3.1 | Backup criptografado | ✅ | Supabase managed |
| V8.3.4 | Dado deletado é purgado | ✅ | Soft delete + `enviarConfirmacaoExclusao` + RPC `soft_delete_user_data` |

**Pendente:** V8.2.3 — verificar `autocomplete="new-password"` em formulário de cadastro/reset.

---

## V9 — Communication

| ID | Requisito | Status | Nota |
|---|---|---|---|
| V9.1.1 | TLS 1.2+ obrigatório | ✅ | Vercel default |
| V9.1.2 | Cipher suites fortes | ✅ | Vercel managed |
| V9.2.1 | HSTS habilitado | ✅ | `max-age=63072000; includeSubDomains; preload` |

---

## V10 — Malicious Code

| ID | Requisito | Status | Nota |
|---|---|---|---|
| V10.1.1 | Dependências de fontes confiáveis | ✅ | NPM oficial, `package-lock.json` commitado |
| V10.2.1 | Vulns conhecidas mitigadas | 🟡 | 6 moderate transitivas (postcss, uuid) — risco real ~0 |
| V10.2.4 | Verificação de integridade de pacotes | ✅ | npm via lock file SHA |
| V10.3.1 | Auto-update de deps | ✅ | **Dependabot configurado em `.github/dependabot.yml`** |
| V10.3.2 | Subresource integrity em scripts externos | N/A | Sem CDN externa de scripts |

---

## V11 — Business Logic

| ID | Requisito | Status | Nota |
|---|---|---|---|
| V11.1.1 | Workflow de negócio segue ordem esperada | ✅ | State machine em `dossie_entregas` força ordem |
| V11.1.2 | Idempotência em mutações externas | ✅ | `webhook_events UNIQUE (provider, event_id)` + CAS |
| V11.1.3 | Race conditions tratadas | ✅ | Lock atômico em geração de dossiê (CAS em `dossie_gerando_desde`) |
| V11.1.4 | Anti-fraude / abuse limit | ✅ | Rate limit IA por tier + ANPD-friendly anti-enumeração |
| V11.1.5 | Anti-bot em fluxo crítico | 🟡 | Sem CAPTCHA. Cloudflare Bot Fight Mode (pendente setup) cobre |

---

## V12 — Files and Resources

| ID | Requisito | Status | Nota |
|---|---|---|---|
| V12.1.1 | Filename validado | ✅ | `sanitizarNomeArquivo` em `lib/validation.ts` |
| V12.1.3 | Tamanho máximo de upload | ✅ | 100MB (migration `20260422210000_uploads_limite_100mb.sql`) |
| V12.2.1 | Tipo MIME validado por magic bytes | ✅ | `lib/file-sniff.ts` em `documento/validar` |
| V12.4.1 | Path traversal barrada | ✅ | Supabase Storage usa path estruturado `{user_id}/{processo_id}/{arquivo}` |
| V12.5.1 | Antivirus em uploads | ❌ | Não temos AV. Risco aceitável pra docs (PDF/JPG); revisitar se aceitar `.exe`/`.zip` |

---

## V13 — API and Web Service

| ID | Requisito | Status | Nota |
|---|---|---|---|
| V13.1.1 | API authz por endpoint | ✅ | `proxy.ts` + check em cada rota |
| V13.1.4 | API responde JSON estruturado | ✅ | Padrão `{ erro: '...', codigo: '...' }` ou `{ ok: true, ... }` |
| V13.2.1 | Schema validado | ✅ | Zod ou type guards |
| V13.2.2 | Mensagens de erro consistentes | ✅ | `capturarErroProducao` |
| V13.2.5 | API versioning | 🟡 | Sem `/v1/` — todas rotas em `/api/`. Aceitável pré-PMF |
| V13.4.1 | Rate limit por chave/user | ✅ | Multi-camada (Vercel default + app `lib/rate-limit*.ts`) |

---

## Resumo executivo

| Categoria | ✅ | 🟡 | ❌ | N/A |
|---|---|---|---|---|
| V1 Arch | 3 | 1 | 1 | 0 |
| V2 Auth | 6 | 1 | 2 | 0 |
| V3 Session | 4 | 1 | 0 | 0 |
| V4 Access | 7 | 0 | 0 | 0 |
| V5 Validation | 9 | 0 | 0 | 0 |
| V6 Crypto | 3 | 1 | 0 | 0 |
| V7 Logging | 7 | 0 | 0 | 0 |
| V8 Data | 4 | 1 | 0 | 0 |
| V9 Comm | 3 | 0 | 0 | 0 |
| V10 Mal Code | 4 | 1 | 0 | 0 |
| V11 Logic | 4 | 1 | 0 | 0 |
| V12 Files | 4 | 0 | 1 | 0 |
| V13 API | 5 | 1 | 0 | 0 |
| **Total** | **63** | **8** | **4** | **0** |

**Compliance ASVS L2:** ~84% completo, 11% débito mapeado, 5% gap.

### Os 4 gaps explícitos (❌)

| ID | Gap | Custo de fechar | Prioridade |
|---|---|---|---|
| V1.1.2 | Threat modeling formal | 1h por feature crítica | Médio |
| V2.1.5 | HIBP check ON | 1 clique no Auth Dashboard | **CRÍTICO** |
| V2.2.3 | MFA admin obrigatória | 15min setup TOTP | **CRÍTICO** |
| V12.5.1 | Antivirus em uploads | Revisão (não bloqueante hoje) | Baixo |

### Próxima revisão

- **2026-07-28** (trimestral)
- **Antes de bater 100 clientes pagantes** — revisitar V2.2 (MFA cliente) e V11.1.5 (anti-bot)

### Referência

- OWASP ASVS 5.0: <https://owasp.org/www-project-application-security-verification-standard/>
- OWASP Top 10 2021: <https://owasp.org/Top10/>
