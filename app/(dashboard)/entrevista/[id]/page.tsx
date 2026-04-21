import { redirect } from 'next/navigation'

// Rota legada (processo-especifica). No novo modelo da Onda 2 a entrevista
// e unica por user. Processos-especificos que ainda queiram abrir chat
// sao redirecionados para /entrevista.
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await params // consome o segmento
  redirect('/entrevista')
}
