import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Termos de Uso — AgroBridge',
  description: 'Termos de Uso da plataforma AgroBridge.',
}

export default function TermosPage() {
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
            <h1 className="text-3xl font-black text-gray-900">Termos de Uso</h1>
            <p className="mt-2 text-sm text-gray-500">
              Última atualização: 18 de abril de 2026
            </p>
          </header>

          <div className="space-y-8 text-[15px] leading-relaxed text-gray-700">
            <section>
              <h2 className="mb-3 text-xl font-bold text-gray-900">1. Objeto</h2>
              <p>
                A plataforma AgroBridge (&quot;Plataforma&quot;) é um serviço digital
                que auxilia o produtor rural (&quot;Usuário&quot;) na organização,
                validação e montagem de documentação necessária para pleitear crédito
                rural junto a instituições financeiras brasileiras, utilizando
                inteligência artificial para estruturar a entrevista, gerar
                checklist personalizado e montar dossiê de crédito.
              </p>
              <p className="mt-3">
                O AgroBridge <strong>não é instituição financeira</strong>, não
                concede crédito, não intermedia a decisão do banco e não garante
                aprovação de operação de crédito. O serviço prestado tem natureza
                exclusivamente de apoio documental e consultivo informatizado.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-bold text-gray-900">
                2. Cadastro e conta
              </h2>
              <p>
                Para utilizar a Plataforma, o Usuário deve preencher cadastro com
                dados verdadeiros, completos e atualizados. O Usuário é o único
                responsável pela guarda de sua senha e por todas as atividades
                realizadas em sua conta.
              </p>
              <p className="mt-3">
                O cadastro é pessoal e intransferível. A criação de contas em
                nome de terceiros sem autorização expressa configura violação
                destes Termos e pode ensejar responsabilidade civil e criminal.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-bold text-gray-900">
                3. Uso permitido
              </h2>
              <p>O Usuário se compromete a:</p>
              <ul className="mt-2 list-disc space-y-1.5 pl-6">
                <li>Utilizar a Plataforma apenas para fins lícitos;</li>
                <li>
                  Fornecer documentos e informações de sua titularidade ou para
                  os quais tenha autorização legítima de uso;
                </li>
                <li>
                  Não tentar contornar controles de segurança, engenharia reversa
                  ou extração automatizada de dados;
                </li>
                <li>
                  Não utilizar a Plataforma para qualquer atividade fraudulenta,
                  incluindo, sem limitação, falsidade ideológica,
                  estelionato, lavagem de dinheiro ou tentativa de obtenção
                  indevida de crédito.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-bold text-gray-900">
                4. Pagamento e serviço
              </h2>
              <p>
                O serviço é prestado mediante pagamento único nas modalidades
                informadas na Plataforma. Os valores, formas de pagamento e
                escopo de cada plano são divulgados antes da contratação.
              </p>
              <p className="mt-3">
                <strong>
                  O pagamento do serviço AgroBridge é independente da aprovação
                  do crédito junto ao banco.
                </strong>{' '}
                O valor refere-se ao trabalho de organização documental e não
                constitui contingenciamento de êxito.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-bold text-gray-900">
                5. Responsabilidades
              </h2>
              <p>
                O Usuário é o único responsável pela veracidade das informações
                prestadas durante a entrevista e pela autenticidade dos documentos
                submetidos à Plataforma.
              </p>
              <p className="mt-3">
                O AgroBridge emprega diligência razoável para validar a forma
                e a completude dos documentos, mas não se responsabiliza por:
              </p>
              <ul className="mt-2 list-disc space-y-1.5 pl-6">
                <li>Decisões de aprovação ou negativa de crédito pelos bancos;</li>
                <li>Prazos de análise praticados pelas instituições financeiras;</li>
                <li>
                  Alterações regulamentares no Manual de Crédito Rural (MCR) do
                  Banco Central do Brasil após a geração do dossiê;
                </li>
                <li>
                  Informações inverídicas fornecidas pelo Usuário que resultem
                  em indeferimento.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-bold text-gray-900">
                6. Propriedade intelectual
              </h2>
              <p>
                Todo o conteúdo, código-fonte, marca, layout, prompts e lógica da
                Plataforma são de propriedade exclusiva do AgroBridge e estão
                protegidos pela legislação de propriedade intelectual vigente
                (Lei 9.279/96 e Lei 9.610/98). É vedada sua reprodução total ou
                parcial sem autorização prévia por escrito.
              </p>
              <p className="mt-3">
                Os documentos e dados inseridos pelo Usuário permanecem de sua
                titularidade.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-bold text-gray-900">
                7. Limitação de responsabilidade
              </h2>
              <p>
                Nos limites permitidos pela legislação aplicável, a
                responsabilidade do AgroBridge por eventuais danos fica limitada
                ao valor efetivamente pago pelo Usuário nos 12 (doze) meses
                anteriores ao evento que deu causa ao dano, sendo expressamente
                excluídos danos indiretos, lucros cessantes e perda de chance.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-bold text-gray-900">8. Rescisão</h2>
              <p>
                O Usuário pode encerrar sua conta a qualquer momento, mediante
                solicitação pelos canais oficiais. O AgroBridge pode suspender
                ou encerrar o acesso do Usuário em caso de violação destes
                Termos, com notificação prévia sempre que viável.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-bold text-gray-900">
                9. Proteção de dados (LGPD)
              </h2>
              <p>
                O tratamento de dados pessoais realizado pela Plataforma observa
                a Lei 13.709/2018 (LGPD) e está detalhado na{' '}
                <Link
                  href="/privacidade"
                  className="font-medium text-[#166534] hover:underline"
                >
                  Política de Privacidade
                </Link>
                , que integra estes Termos.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-bold text-gray-900">
                10. Alterações
              </h2>
              <p>
                Estes Termos podem ser atualizados a qualquer momento. As
                alterações serão comunicadas por e-mail e/ou aviso na Plataforma,
                entrando em vigor após a data de publicação.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-bold text-gray-900">
                11. Foro
              </h2>
              <p>
                Fica eleito o foro da <strong>Comarca de Anápolis, Estado de
                Goiás</strong>, para dirimir quaisquer controvérsias
                decorrentes destes Termos, com renúncia expressa de qualquer
                outro, por mais privilegiado que seja.
              </p>
            </section>

            <section className="rounded-xl bg-green-50 p-5">
              <h2 className="mb-2 text-lg font-bold text-[#166534]">
                Contato
              </h2>
              <p className="text-sm">
                <strong>Responsável:</strong> Paulo Costa
                <br />
                <strong>E-mail:</strong>{' '}
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
