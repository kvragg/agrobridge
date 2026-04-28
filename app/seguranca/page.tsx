import Link from "next/link"
import type { Metadata } from "next"
import { InstitutionalShell } from "@/components/shell/InstitutionalShell"

export const metadata: Metadata = {
  title: "Segurança e Disclosure Responsável — AgroBridge",
  description:
    "Como reportar uma vulnerabilidade no AgroBridge com segurança. Programa de disclosure responsável + safe harbor + reconhecimento público.",
  alternates: { canonical: "/seguranca" },
}

export default function SegurancaPage() {
  return (
    <InstitutionalShell maxWidth={820}>
      <article className="institutional">
        <header
          style={{
            marginBottom: 32,
            paddingBottom: 24,
            borderBottom: "1px solid var(--line)",
          }}
        >
          <h1>Segurança e Disclosure Responsável</h1>
          <p
            className="mono"
            style={{
              marginTop: 12,
              fontSize: 11,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--muted)",
            }}
          >
            Última atualização · 28 de abril de 2026
          </p>
          <p style={{ marginTop: 14 }}>
            Tratamos segurança como pilar do produto. Esta página é a porta
            oficial pra pesquisadores éticos, clientes e parceiros que
            identificarem qualquer falha de segurança em qualquer parte da
            plataforma reportarem com proteção legal e reconhecimento.
          </p>
        </header>

        <section>
          <h2>Como reportar</h2>
          <div className="callout">
            <p>
              <strong>Email primário:</strong>{" "}
              <a href="mailto:security@agrobridge.space">
                security@agrobridge.space
              </a>
            </p>
            <p>
              <strong>Tempo de resposta:</strong> em até 72 horas úteis
              confirmamos recebimento.
            </p>
            <p>
              <strong>Idioma:</strong> português ou inglês.
            </p>
          </div>
          <p>
            Se preferir comunicação criptografada, mande primeiro um email
            simples pedindo nossa chave PGP e te respondemos com a fingerprint.
          </p>
        </section>

        <section>
          <h2>O que queremos receber</h2>
          <ul>
            <li>
              Vulnerabilidades de injeção (SQL, NoSQL, comando, prompt
              injection contra a IA)
            </li>
            <li>
              Falhas de autenticação ou de Row Level Security (acesso a dados
              de outro usuário)
            </li>
            <li>
              IDOR (referência direta a objeto), CSRF, SSRF, XSS armazenado ou
              refletido
            </li>
            <li>
              Vazamento de dados pessoais (CPF, email, dados financeiros) ou de
              segredos do sistema (chaves de API, tokens de sessão)
            </li>
            <li>
              Falhas no fluxo de pagamento (forjar confirmação, replay de
              webhook)
            </li>
            <li>
              Falhas no fluxo LGPD (Art. 18 — exportação, exclusão, consulta)
            </li>
            <li>Configurações inseguras de cabeçalhos HTTP, CSP, HSTS, CORS</li>
            <li>
              Bypass do gate de tier (Bronze/Prata/Ouro) ou da janela CDC
              art. 49
            </li>
          </ul>
        </section>

        <section>
          <h2>O que NÃO queremos receber</h2>
          <ul>
            <li>
              Resultados brutos de scanner automático (Nessus, Acunetix, ZAP)
              sem análise de impacto real — relatório só fala alguma coisa
              quando vem com prova de exploração ou cenário concreto
            </li>
            <li>
              Bugs sem impacto de segurança (typo, layout quebrado, link
              quebrado) — esses vão pra <a href="mailto:suporte@agrobridge.space">suporte@</a>
            </li>
            <li>
              Brute force, password spraying ou DoS em produção — testar isso
              fica fora do safe harbor
            </li>
            <li>
              Engenharia social contra a equipe ou clientes
            </li>
            <li>
              Acesso físico a infraestrutura (Vercel, Supabase — não controlamos)
            </li>
            <li>
              Vulnerabilidades em fornecedores (Vercel, Supabase, Anthropic,
              Cakto, Resend) — reporta diretamente a eles e nos avisa pra
              acompanhar
            </li>
          </ul>
        </section>

        <section>
          <h2>Safe Harbor</h2>
          <p>
            Comprometemo-nos a <strong>não tomar ações legais</strong> contra
            pesquisador que respeite as regras desta página. Especificamente,
            você não viola nossos Termos de Uso enquanto:
          </p>
          <ul>
            <li>
              Reporta a falha primeiro pelo email acima e dá tempo razoável
              (mínimo 30 dias corridos) pra correção antes de divulgar
              publicamente
            </li>
            <li>
              Não acessa, modifica, divulga ou retém dados de outros usuários
              além do mínimo necessário pra demonstrar o impacto
            </li>
            <li>
              Não causa indisponibilidade do serviço, perda de dados ou degradação
              da experiência de usuários reais
            </li>
            <li>
              Não usa engenharia social, phishing ou ataque físico
            </li>
            <li>
              Para por completo se solicitarmos no decorrer da investigação
            </li>
          </ul>
        </section>

        <section>
          <h2>Reconhecimento</h2>
          <p>
            Não temos programa de bug bounty pago no momento, mas valorizamos
            quem nos ajuda a manter a plataforma segura. Para vulnerabilidades
            válidas oferecemos:
          </p>
          <ul>
            <li>
              <strong>Crédito público</strong> nesta página (com seu
              consentimento — nome, link de perfil, descrição da falha)
            </li>
            <li>
              <strong>Acesso vitalício ao plano Bronze</strong> da plataforma
              (Análise de Viabilidade) pra você ou alguém que indicar
            </li>
            <li>
              <strong>Carta de recomendação</strong> referenciando a descoberta
              e o impacto (útil pra portfólio profissional)
            </li>
          </ul>
          <p>
            Para vulnerabilidades de impacto crítico (RCE, vazamento de massa,
            bypass total de auth) avaliamos caso a caso recompensa monetária —
            mesmo sem programa formal, queremos honrar quem descobre algo
            desse nível.
          </p>
        </section>

        <section>
          <h2>Hall of Fame</h2>
          <p>
            Pesquisadores que contribuíram para a segurança do AgroBridge.
            Lista atualizada conforme reports válidos chegarem.
          </p>
          <div className="callout">
            <p style={{ color: "var(--muted)", fontStyle: "italic" }}>
              Aguardando primeiros reports. Você pode ser o primeiro nome aqui.
            </p>
          </div>
        </section>

        <section>
          <h2>Escopo</h2>
          <p>Está dentro do escopo:</p>
          <ul>
            <li>
              <code>agrobridge.space</code> e todos os subdomínios diretos
            </li>
            <li>
              APIs sob <code>/api/*</code> (rate limit aplicado — não force)
            </li>
            <li>
              Fluxo da plataforma autenticada (Auth, Entrevista IA, Checklist,
              Dossiê, Pagamento, LGPD)
            </li>
          </ul>
          <p>Está fora do escopo:</p>
          <ul>
            <li>
              Subdomínios de fornecedores (Vercel, Supabase, Anthropic, Cakto,
              Resend) — reporte ao fornecedor diretamente
            </li>
            <li>
              Sandboxes ou ambientes de preview com URL temporária
            </li>
            <li>
              Email institucional (<code>suporte@</code>, <code>comercial@</code>) —
              só repasse de mensagens via ImprovMX
            </li>
          </ul>
        </section>

        <section>
          <h2>Resposta esperada</h2>
          <p>Nosso compromisso de SLA com quem reporta:</p>
          <ul>
            <li>
              <strong>Em até 72h:</strong> confirmação de recebimento
            </li>
            <li>
              <strong>Em até 7 dias:</strong> análise inicial + classificação
              de severidade (informacional / baixo / médio / alto / crítico)
            </li>
            <li>
              <strong>Em até 30 dias (médio/alto/crítico):</strong> patch ou
              mitigação aplicada em produção, com confirmação ao reporter
            </li>
            <li>
              <strong>Em até 90 dias:</strong> autorização pra disclosure
              público (a menos que negociado outro prazo)
            </li>
          </ul>
        </section>

        <section style={{ marginTop: 40, paddingTop: 24, borderTop: "1px solid var(--line)" }}>
          <h2>Outras páginas relacionadas</h2>
          <ul>
            <li>
              <Link href="/privacidade">Política de Privacidade (LGPD)</Link>
            </li>
            <li>
              <Link href="/termos">Termos de Uso</Link>
            </li>
            <li>
              <Link href="/conta/dados">
                Seus dados na sua conta (exportar, excluir, consultar)
              </Link>
            </li>
          </ul>
          <p style={{ marginTop: 24, color: "var(--muted)", fontSize: 13 }}>
            Esta página segue o modelo da{" "}
            <a
              href="https://datatracker.ietf.org/doc/html/rfc9116"
              target="_blank"
              rel="noopener noreferrer"
            >
              RFC 9116
            </a>{" "}
            (security.txt) — também publicada em{" "}
            <a href="/.well-known/security.txt">/.well-known/security.txt</a>.
          </p>
        </section>
      </article>
    </InstitutionalShell>
  )
}
