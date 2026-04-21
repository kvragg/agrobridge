import { DebugEmailForm } from './DebugEmailForm'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function AdminDebugPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-black text-gray-900">Debug · Admin</h1>
        <p className="mt-1 text-sm text-gray-500">
          Ferramentas de diagnóstico. Nada aqui muda estado de produção além
          do envio de email de teste.
        </p>
      </header>

      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-bold text-gray-900">Teste de envio Resend</h2>
        <p className="mt-1 text-sm text-gray-500">
          Valida API key + domínio + quota. O destinatário padrão é o próprio
          admin logado.
        </p>
        <DebugEmailForm />
      </section>
    </div>
  )
}
