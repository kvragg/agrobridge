import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidade — AgroBridge',
  description: 'Política de Privacidade e proteção de dados da plataforma AgroBridge (LGPD).',
}

export default function PrivacidadePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#f0fdf4] to-[#f9fafb] px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-[#166534] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao início
        </Link>

        <article className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm sm:p-10">
          <header className="mb-8 border-b border-gray-100 pb-6">
            <h1 className="text-3xl font-black text-gray-900">
              Política de Privacidade
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Última atualização: 21 de abril de 2026
            </p>
            <p className="mt-3 text-sm text-gray-600">
              Esta Política descreve como o AgroBridge trata os dados pessoais
              de seus usuários em conformidade com a Lei 13.709/2018 (LGPD).
            </p>
          </header>

          <div className="space-y-8 text-[15px] leading-relaxed text-gray-700">
            <section>
              <h2 className="mb-3 text-xl font-bold text-gray-900">
                1. Controlador dos dados
              </h2>
              <div className="rounded-lg bg-gray-50 p-4 text-sm">
                <p>
                  <strong>Responsável / Controlador:</strong> Paulo Costa
                </p>
                <p>
                  <strong>Contato / Encarregado (DPO):</strong>{' '}
                  <a
                    href="mailto:paulocosta.contato1@gmail.com"
                    className="text-[#166534] hover:underline"
                  >
                    paulocosta.contato1@gmail.com
                  </a>
                </p>
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-bold text-gray-900">
                2. Dados coletados
              </h2>
              <p>Coletamos os seguintes dados pessoais:</p>
              <ul className="mt-2 list-disc space-y-1.5 pl-6">
                <li>
                  <strong>Dados de cadastro:</strong> nome completo, e-mail,
                  número de WhatsApp, senha (armazenada com hash).
                </li>
                <li>
                  <strong>Dados da entrevista:</strong> respostas fornecidas ao
                  assistente de IA sobre perfil rural, imóvel, produção, histórico
                  bancário e necessidade de crédito.
                </li>
                <li>
                  <strong>Documentos:</strong> arquivos (PDF/JPG/PNG) submetidos
                  pelo Usuário — IR, CAR, CCIR, ITR, CNDs, matrícula, projeto,
                  croqui, licenças ambientais e demais documentos de crédito rural.
                </li>
                <li>
                  <strong>Dados técnicos:</strong> endereço IP, tipo de
                  navegador, data e hora de acesso, cookies de sessão.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-bold text-gray-900">
                3. Finalidades do tratamento
              </h2>
              <p>Os dados são tratados exclusivamente para:</p>
              <ul className="mt-2 list-disc space-y-1.5 pl-6">
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
              <h2 className="mb-3 text-xl font-bold text-gray-900">
                4. Base legal (art. 7º da LGPD)
              </h2>
              <ul className="list-disc space-y-1.5 pl-6">
                <li>
                  <strong>Execução de contrato</strong> (inciso V) — prestação
                  do serviço contratado pelo Usuário;
                </li>
                <li>
                  <strong>Consentimento</strong> (inciso I) — marcação da
                  caixa &quot;Li e aceito os Termos&quot; no cadastro;
                </li>
                <li>
                  <strong>Cumprimento de obrigação legal</strong> (inciso II) —
                  guarda de registros fiscais e prevenção à fraude;
                </li>
                <li>
                  <strong>Legítimo interesse</strong> (inciso IX) — segurança
                  da Plataforma e prevenção a abuso.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-bold text-gray-900">
                5. Compartilhamento com operadores
              </h2>
              <p>
                Para executar o serviço, utilizamos os seguintes operadores, que
                tratam dados em nome do AgroBridge sob contrato de sigilo e
                conformidade LGPD:
              </p>
              <ul className="mt-2 list-disc space-y-1.5 pl-6">
                <li>
                  <strong>Supabase Inc.</strong> — banco de dados, autenticação
                  e armazenamento de documentos (servidores com criptografia em
                  repouso e em trânsito);
                </li>
                <li>
                  <strong>Anthropic PBC</strong> — modelo de linguagem (Claude)
                  utilizado para condução da entrevista e geração do checklist.
                  Os dados não são usados para treinamento de modelos;
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
                  pagamentos (PIX, cartão de crédito, parcelamento). O
                  AgroBridge não armazena dados de cartão — o checkout é
                  conduzido pela Cakto como controladora dos dados financeiros.
                </li>
              </ul>
              <p className="mt-3">
                Em nenhuma hipótese o AgroBridge vende, aluga ou comercializa
                dados pessoais a terceiros para fins publicitários.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-bold text-gray-900">
                6. Transferência internacional (art. 33 da LGPD)
              </h2>
              <p>
                Alguns operadores possuem infraestrutura fora do Brasil. As
                transferências ocorrem com base no art. 33, inciso II (cláusulas
                contratuais padrão e garantias contratuais específicas)
                e inciso VIII (necessidade à execução do contrato).
                Operadores e países envolvidos:
              </p>
              <div className="mt-3 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                    <tr>
                      <th className="py-2 pr-4">Operador</th>
                      <th className="py-2 pr-4">Local</th>
                      <th className="py-2">Dados transferidos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr>
                      <td className="py-2 pr-4 font-medium">Supabase Inc.</td>
                      <td className="py-2 pr-4">EUA (Ohio)</td>
                      <td className="py-2">Cadastro, entrevista, documentos</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4 font-medium">Anthropic PBC</td>
                      <td className="py-2 pr-4">EUA</td>
                      <td className="py-2">
                        Texto da entrevista e prompts (sem uso para treino)
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4 font-medium">Vercel Inc.</td>
                      <td className="py-2 pr-4">EUA (edge global)</td>
                      <td className="py-2">Tráfego HTTP, logs operacionais</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4 font-medium">Resend</td>
                      <td className="py-2 pr-4">EUA</td>
                      <td className="py-2">E-mail e conteúdo da mensagem</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4 font-medium">Cakto</td>
                      <td className="py-2 pr-4">Brasil</td>
                      <td className="py-2">Nome, e-mail, dados de pagamento</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-3">
                O AgroBridge mantém registros internos com o histórico dessas
                transferências e pode disponibilizá-los ao titular mediante
                solicitação.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-bold text-gray-900">
                7. Retenção
              </h2>
              <p>
                Os dados são retidos enquanto a conta estiver ativa e por até 5
                (cinco) anos após o encerramento, para cumprimento de obrigações
                fiscais, trabalhistas e de prevenção à fraude. Após esse prazo,
                os dados são anonimizados ou excluídos.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-bold text-gray-900">
                8. Direitos do titular (art. 18 da LGPD)
              </h2>
              <p>O Usuário pode, a qualquer momento, solicitar:</p>
              <ul className="mt-2 list-disc space-y-1.5 pl-6">
                <li>Confirmação da existência de tratamento;</li>
                <li>Acesso aos dados;</li>
                <li>Correção de dados incompletos, inexatos ou desatualizados;</li>
                <li>
                  Anonimização, bloqueio ou eliminação de dados desnecessários;
                </li>
                <li>Portabilidade a outro fornecedor;</li>
                <li>
                  Eliminação dos dados tratados com base no consentimento;
                </li>
                <li>
                  Informação sobre entidades públicas e privadas com as quais
                  houve compartilhamento;
                </li>
                <li>Revogação do consentimento.</li>
              </ul>
              <p className="mt-3">
                As solicitações devem ser enviadas para{' '}
                <a
                  href="mailto:paulocosta.contato1@gmail.com"
                  className="font-medium text-[#166534] hover:underline"
                >
                  paulocosta.contato1@gmail.com
                </a>{' '}
                e serão respondidas em até 15 (quinze) dias.
              </p>
              <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm">
                <p className="font-semibold text-gray-900">
                  Autoatendimento disponível:
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>
                    <strong>Exportar meus dados</strong> — gere e baixe um
                    arquivo JSON com todos os seus dados em{' '}
                    <Link
                      href="/conta/dados"
                      className="font-medium text-[#166534] hover:underline"
                    >
                      /conta/dados
                    </Link>
                    .
                  </li>
                  <li>
                    <strong>Excluir minha conta</strong> — solicite exclusão
                    com confirmação por e-mail em{' '}
                    <Link
                      href="/conta/dados"
                      className="font-medium text-[#166534] hover:underline"
                    >
                      /conta/dados
                    </Link>
                    . A exclusão observa o prazo de retenção fiscal (seção 7).
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-bold text-gray-900">
                9. Segurança
              </h2>
              <p>
                Adotamos medidas técnicas e administrativas razoáveis para
                proteger os dados contra acesso não autorizado, incluindo:
              </p>
              <ul className="mt-2 list-disc space-y-1.5 pl-6">
                <li>Criptografia em trânsito (HTTPS/TLS);</li>
                <li>
                  Row Level Security (RLS) no banco de dados — cada usuário só
                  acessa seus próprios dados;
                </li>
                <li>
                  Armazenamento de documentos em buckets privados com políticas
                  de acesso por usuário;
                </li>
                <li>Hash de senhas (bcrypt/argon2) — nunca armazenadas em texto;</li>
                <li>Rate limiting em endpoints sensíveis;</li>
                <li>
                  Segregação de ambientes (desenvolvimento/produção) e controle
                  de chaves de API.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-bold text-gray-900">
                10. Cookies
              </h2>
              <p>
                Utilizamos apenas cookies estritamente necessários para
                funcionamento da autenticação e da sessão do Usuário. Não
                empregamos cookies de publicidade ou rastreamento comportamental
                de terceiros.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-bold text-gray-900">
                11. Incidentes de segurança
              </h2>
              <p>
                Em caso de incidente que possa acarretar risco ou dano relevante
                aos titulares, comunicaremos a Autoridade Nacional de Proteção
                de Dados (ANPD) e os titulares afetados em prazo razoável,
                conforme art. 48 da LGPD.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-bold text-gray-900">
                12. Alterações desta Política
              </h2>
              <p>
                Esta Política pode ser atualizada. As alterações serão informadas
                por e-mail e/ou aviso na Plataforma.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-bold text-gray-900">13. Foro</h2>
              <p>
                Fica eleito o foro da <strong>Comarca de Anápolis, Estado de
                Goiás</strong>, para dirimir quaisquer questões decorrentes
                desta Política.
              </p>
            </section>

            <section className="rounded-xl bg-green-50 p-5">
              <h2 className="mb-2 text-lg font-bold text-[#166534]">
                Fale conosco
              </h2>
              <p className="text-sm">
                Dúvidas, solicitações ou reclamações sobre privacidade:
                <br />
                <strong>Paulo Costa</strong>
                <br />
                <a
                  href="mailto:paulocosta.contato1@gmail.com"
                  className="text-[#166534] hover:underline"
                >
                  paulocosta.contato1@gmail.com
                </a>
              </p>
            </section>
          </div>
        </article>
      </div>
    </main>
  )
}
