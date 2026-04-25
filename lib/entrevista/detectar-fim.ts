// Detecção de intent de "concluir entrevista" — usada nos clients
// (ChatClient + WidgetIA) pra disparar auto-conclusão sem o user
// precisar clicar no botão. Background: 25/04 reportou que ao pedir
// "rever tudo e concluir", a IA só FALAVA "tem o botão dourado abaixo"
// em vez de FAZER. Resolvemos detectando intent client-side e
// chamando /api/entrevista/concluir programaticamente.
//
// Função pura — sem fetch, sem efeitos. Recebe os 2 últimos turnos
// (msg do user + resposta da IA) e devolve se rola disparar conclusão.
//
// Triggers conservadores: precisamos de pedido CLARO. Frases ambíguas
// ("vamos ver isso", "depois") não disparam. Backend protege duplo via
// leadTemPerfilMinimo().

const KEYWORDS_USER = [
  // Pedido direto
  'concluir entrevista',
  'concluir a entrevista',
  'fim da entrevista',
  'finalizar entrevista',
  'finalizar a entrevista',
  'encerrar entrevista',
  'encerrar a entrevista',
  // Pedido pelo destino
  'quero o checklist',
  'quero ver o checklist',
  'quero ver meu checklist',
  'ver meu checklist',
  'ir pro checklist',
  'ir para o checklist',
  'liberar o checklist',
  'liberar checklist',
  'liberar o check list',
  'liberar check list',
  'me leva pro checklist',
  'me leve pro checklist',
  'me leva para o checklist',
  // Pedido de conclusão indireto
  'rever tudo',
  'reveja tudo',
  'já tem tudo',
  'ja tem tudo',
  'tem tudo aqui',
  'tem todas as informações',
  'tem todas informacoes',
  'todas as informações no chat',
  'todas informacoes no chat',
  'pode concluir',
  'pode finalizar',
  'pode encerrar',
  'vamos concluir',
  'vamos finalizar',
  'vamos encerrar',
  'pode fechar',
  'já dá pra concluir',
  'ja da pra concluir',
  'próximo passo',
  'proximo passo',
]

const KEYWORDS_IA = [
  // Sinais de fim natural
  'perfil completo',
  'já tenho o suficiente',
  'ja tenho o suficiente',
  'tenho informação suficiente',
  'tenho informacao suficiente',
  'tem o botão dourado',
  'tem o botao dourado',
  'botão concluir',
  'botao concluir',
  'concluir entrevista',
  'concluir a entrevista',
  'vou montar seu checklist',
  'monto seu checklist',
  'montar seu checklist personalizado',
  'checklist personalizado',
  'já dá pra eu montar',
  'ja da pra eu montar',
]

function normalizar(texto: string): string {
  return (texto ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove acentos
}

function contemAlguma(texto: string, lista: string[]): boolean {
  const t = normalizar(texto)
  return lista.some((kw) => t.includes(normalizar(kw)))
}

/**
 * @param ultimaUser  Última mensagem do user (string).
 * @param respostaIA  Resposta completa da IA logo após (string).
 * @returns true se algum dos dois sinaliza fim claro de entrevista.
 *
 * Estratégia: SE o user pediu OU a IA está oferecendo conclusão,
 * disparamos. Se só a IA disse mas user não pediu, ainda assim vale
 * (UX: IA detectou perfil completo, podemos avançar sozinhos).
 */
export function deveAutoConcluir(
  ultimaUser: string | null,
  respostaIA: string | null,
): boolean {
  if (ultimaUser && contemAlguma(ultimaUser, KEYWORDS_USER)) return true
  if (respostaIA && contemAlguma(respostaIA, KEYWORDS_IA)) return true
  return false
}
