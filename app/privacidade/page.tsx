import Link from "next/link"
import type { Metadata } from "next"
import { InstitutionalShell } from "@/components/shell/InstitutionalShell"

export const metadata: Metadata = {
  title: "Política de Privacidade — AgroBridge",
  description:
    "Política de Privacidade e proteção de dados da plataforma AgroBridge (LGPD).",
}

export default function PrivacidadePage() {
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
          <h1>Política de Privacidade</h1>
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
            Última atualização · 21 de abril de 2026
          </p>
          <p style={{ marginTop: 14 }}>
            Esta Política descreve como o AgroBridge trata os dados pessoais
            de seus usuários em conformidade com a Lei 13.709/2018 (LGPD).
          </p>
        </header>

        <section>
          <h2>1. Controlador dos dados</h2>
          <div className="callout">
            <p>
              <strong>Responsável / Controlador:</strong> Paulo Costa
            </p>
            <p>
              <strong>Contato / Encarregado (DPO):</strong>{" "}
              <a href="mailto:suporte@agrobridge.space">
                suporte@agrobridge.space
              </a>
            </p>
          </div>
        </section>

        <section>
          <h2>2. Dados coletados</h2>
          <p>Coletamos os seguintes dados pessoais:</p>
          <ul>
            <li>
              <strong>Dados de cadastro:</strong> nome completo, e-mail,
              número de WhatsApp, senha (armazenada com hash).
            </li>
            <li>
              <strong>Dados da entrevista:</strong> respostas fornecidas ao
              assistente de IA sobre perfil rural, imóvel, produção,
              histórico bancário e necessidade de crédito.
            </li>
            <li>
              <strong>Documentos:</strong> arquivos (PDF/JPG/PNG) submetidos
              pelo Usuário — IR, CAR, CCIR, ITR, CNDs, matrícula, projeto,
              croqui, licenças ambientais e demais documentos de crédito rural.
            </li>
            <li>
              <strong>Dados técnicos:</strong> endereço IP, tipo de navegador,
              data e hora de acesso, cookies de sessão.
            </li>
          </ul>
        </section>

        <section>
          <h2>3. Finalidades do tratamento</h2>
          <p>Os dados são tratados exclusivamente para:</p>
          <ul>
            <li>Autenticar o Usuário e manter sua conta;</li>
            <li>
              Conduzir a entrevista estruturada via IA e gerar checklist
              personalizado de documentos;
            </li>
            <li>Armazenar e organizar os documentos do processo de crédito;</li>
            <li>Montar o dossiê de crédito a ser apresentado ao banco;</li>
            <li>Prevenir fraude e abuso da Plataforma;</li>
            <li>Cumprir obrigações legais e regulatórias aplicáveis.</li>
          </ul>
        </section>

        <section>
          <h2>4. Base legal (art. 7º da LGPD)</h2>
          <ul>
            <li>
              <strong>Execução de contrato</strong> (inciso V) — prestação do
              serviço contratado pelo Usuário;
            </li>
            <li>
              <strong>Consentimento</strong> (inciso I) — marcação da caixa
              &quot;Li e aceito os Termos&quot; no cadastro;
            </li>
            <li>
              <strong>Cumprimento de obrigação legal</strong> (inciso II) —
              guarda de registros fiscais e prevenção à fraude;
            </li>
            <li>
              <strong>Legítimo interesse</strong> (inciso IX) — segurança da
              Plataforma e prevenção a abuso.
            </li>
          </ul>
        </section>

        <section>
          <h2>5. Compartilhamento com operadores</h2>
          <p>
            Para executar o serviço, utilizamos os seguintes operadores, que
            tratam dados em nome do AgroBridge sob contrato de sigilo e
            conformidade LGPD:
          </p>
          <ul>
            <li>
              <strong>Supabase Inc.</strong> — banco de dados, autenticação e
              armazenamento de documentos (servidores com criptografia em
              repouso e em trânsito);
            </li>
            <li>
              <strong>Anthropic PBC</strong> — modelo de linguagem (Claude)
              utilizado para condução da entrevista e geração do checklist. Os
              dados não são usados para treinamento de modelos;
            </li>
            <li>
              <strong>Vercel Inc.</strong> — hospedagem da aplicação web;
            </li>
            <li>
              <strong>Resend</strong> — envio de e-mails transacionais
              (confirmação, recuperação de senha, notificações).
            </li>
            <li>
              <strong>Cakto Tecnologia Ltda.</strong> — processamento de
              pagamentos (PIX, cartão de crédito, parcelamento). O AgroBridge
              não armazena dados de cartão — o checkout é conduzido pela Cakto
              como controladora dos dados financeiros.
            </li>
          </ul>
          <p>
            Em nenhuma hipótese o AgroBridge vende, aluga ou comercializa
            dados pessoais a terceiros para fins publicitários.
          </p>
        </section>

        <section>
          <h2>6. Transferência internacional (art. 33 da LGPD)</h2>
          <p>
            Alguns operadores possuem infraestrutura fora do Brasil. As
            transferências ocorrem com base no art. 33, inciso II (cláusulas
            contratuais padrão e garantias contratuais específicas) e inciso
            VIII (necessidade à execução do contrato). Operadores e países
            envolvidos:
          </p>
          <div
            style={{
              marginTop: 14,
              overflow: "auto",
              border: "1px solid var(--line)",
              borderRadius: 12,
            }}
          >
            <table
              style={{
                minWidth: "100%",
                borderCollapse: "collapse",
                fontSize: 13.5,
                color: "var(--ink-2)",
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    borderBottom: "1px solid var(--line)",
                  }}
                >
                  <th
                    className="mono"
                    style={{
                      padding: "12px 16px",
                      textAlign: "left",
                      fontSize: 10.5,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: "var(--muted)",
                      fontWeight: 500,
                    }}
                  >
                    Operador
                  </th>
                  <th
                    className="mono"
                    style={{
                      padding: "12px 16px",
                      textAlign: "left",
                      fontSize: 10.5,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: "var(--muted)",
                      fontWeight: 500,
                    }}
                  >
                    Local
                  </th>
                  <th
                    className="mono"
                    style={{
                      padding: "12px 16px",
                      textAlign: "left",
                      fontSize: 10.5,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: "var(--muted)",
                      fontWeight: 500,
                    }}
                  >
                    Dados transferidos
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Supabase Inc.", "EUA (Ohio)", "Cadastro, entrevista, documentos"],
                  ["Anthropic PBC", "EUA", "Texto da entrevista e prompts (sem uso para treino)"],
                  ["Vercel Inc.", "EUA (edge global)", "Tráfego HTTP, logs operacionais"],
                  ["Resend", "EUA", "E-mail e conteúdo da mensagem"],
                  ["Cakto", "Brasil", "Nome, e-mail, dados de pagamento"],
                ].map(([op, local, dados], i) => (
                  <tr
                    key={op}
                    style={{
                      borderTop:
                        i === 0 ? "none" : "1px solid var(--line)",
                    }}
                  >
                    <td
                      style={{
                        padding: "12px 16px",
                        fontWeight: 500,
                        color: "var(--ink)",
                      }}
                    >
                      {op}
                    </td>
                    <td style={{ padding: "12px 16px" }}>{local}</td>
                    <td style={{ padding: "12px 16px" }}>{dados}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            O AgroBridge mantém registros internos com o histórico dessas
            transferências e pode disponibilizá-los ao titular mediante
            solicitação.
          </p>
        </section>

        <section>
          <h2>7. Retenção</h2>
          <p>
            Os dados são retidos enquanto a conta estiver ativa e por até 5
            (cinco) anos após o encerramento, para cumprimento de obrigações
            fiscais, trabalhistas e de prevenção à fraude. Após esse prazo,
            os dados são anonimizados ou excluídos.
          </p>
        </section>

        <section>
          <h2>8. Direitos do titular (art. 18 da LGPD)</h2>
          <p>O Usuário pode, a qualquer momento, solicitar:</p>
          <ul>
            <li>Confirmação da existência de tratamento;</li>
            <li>Acesso aos dados;</li>
            <li>Correção de dados incompletos, inexatos ou desatualizados;</li>
            <li>Anonimização, bloqueio ou eliminação de dados desnecessários;</li>
            <li>Portabilidade a outro fornecedor;</li>
            <li>Eliminação dos dados tratados com base no consentimento;</li>
            <li>
              Informação sobre entidades públicas e privadas com as quais
              houve compartilhamento;
            </li>
            <li>Revogação do consentimento.</li>
          </ul>
          <p>
            As solicitações devem ser enviadas para{" "}
            <a href="mailto:suporte@agrobridge.space">
              suporte@agrobridge.space
            </a>{" "}
            e serão respondidas em até 15 (quinze) dias.
          </p>
          <div className="callout">
            <p>
              <strong>Autoatendimento disponível:</strong>
            </p>
            <ul>
              <li>
                <strong>Exportar meus dados</strong> — gere e baixe um JSON
                com todos os seus dados em{" "}
                <Link href="/conta/dados">/conta/dados</Link>.
              </li>
              <li>
                <strong>Excluir minha conta</strong> — solicite exclusão com
                confirmação por e-mail em{" "}
                <Link href="/conta/dados">/conta/dados</Link>. A exclusão
                observa o prazo de retenção fiscal (seção 7).
              </li>
            </ul>
          </div>
        </section>

        <section>
          <h2>9. Segurança</h2>
          <p>
            Adotamos medidas técnicas e administrativas razoáveis para
            proteger os dados contra acesso não autorizado, incluindo:
          </p>
          <ul>
            <li>Criptografia em trânsito (HTTPS/TLS);</li>
            <li>
              Row Level Security (RLS) no banco de dados — cada usuário só
              acessa seus próprios dados;
            </li>
            <li>
              Armazenamento de documentos em buckets privados com políticas
              de acesso por usuário;
            </li>
            <li>
              Hash de senhas (bcrypt/argon2) — nunca armazenadas em texto;
            </li>
            <li>Rate limiting em endpoints sensíveis;</li>
            <li>
              Segregação de ambientes (desenvolvimento/produção) e controle
              de chaves de API.
            </li>
          </ul>
        </section>

        <section>
          <h2>10. Cookies</h2>
          <p>
            Utilizamos apenas cookies estritamente necessários para
            funcionamento da autenticação e da sessão do Usuário. Não
            empregamos cookies de publicidade ou rastreamento comportamental
            de terceiros.
          </p>
        </section>

        <section>
          <h2>11. Incidentes de segurança</h2>
          <p>
            Em caso de incidente que possa acarretar risco ou dano relevante
            aos titulares, comunicaremos a Autoridade Nacional de Proteção de
            Dados (ANPD) e os titulares afetados em prazo razoável, conforme
            art. 48 da LGPD.
          </p>
        </section>

        <section>
          <h2>12. Alterações desta Política</h2>
          <p>
            Esta Política pode ser atualizada. As alterações serão informadas
            por e-mail e/ou aviso na Plataforma.
          </p>
        </section>

        <section>
          <h2>13. Foro</h2>
          <p>
            Fica eleito o foro da{" "}
            <strong>Comarca de Anápolis, Estado de Goiás</strong>, para
            dirimir quaisquer questões decorrentes desta Política.
          </p>
        </section>

        <section
          style={{
            marginTop: 48,
            background: "rgba(78,168,132,0.06)",
            border: "1px solid rgba(78,168,132,0.22)",
            borderRadius: 14,
            padding: "22px 24px",
          }}
        >
          <h2 style={{ marginTop: 0, color: "var(--green)" }}>Fale conosco</h2>
          <p>
            Dúvidas, solicitações ou reclamações sobre privacidade:
            <br />
            <strong>Paulo Costa</strong>
            <br />
            <a href="mailto:suporte@agrobridge.space">
              suporte@agrobridge.space
            </a>
          </p>
        </section>
      </article>
    </InstitutionalShell>
  )
}
