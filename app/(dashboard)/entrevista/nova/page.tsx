import { redirect } from 'next/navigation'

// Rota legada. Onda 2 trocou a entrevista por processo pelo chat unico /entrevista.
export default function Page() {
  redirect('/entrevista')
}
