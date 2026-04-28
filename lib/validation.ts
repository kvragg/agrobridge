export type ResultadoValidacao = { ok: true } | { ok: false; erro: string }

// Mantém alinhado com Supabase Auth Dashboard:
//   Authentication -> Attack Protection -> Email provider:
//     - Minimum password length: 10
//     - Password requirements: Lowercase + Uppercase + Digits
// Sem alinhamento, server rejeita após o user já ter clicado submit
// (UX ruim). Aqui rejeitamos antes de bater na rede.
//
// HIBP (HaveIBeenPwned) é Pro plan only do Supabase — quando virar Pro,
// também ativa lá pra cobrir senhas vazadas em outros breaches.
export function validarSenha(senha: string): ResultadoValidacao {
  if (typeof senha !== 'string') return { ok: false, erro: 'Senha inválida.' }
  if (senha.length < 10) {
    return { ok: false, erro: 'A senha deve ter ao menos 10 caracteres.' }
  }
  if (senha.length > 200) {
    return { ok: false, erro: 'Senha muito longa.' }
  }
  if (!/[a-z]/.test(senha)) {
    return { ok: false, erro: 'A senha deve conter ao menos 1 letra minúscula.' }
  }
  if (!/[A-Z]/.test(senha)) {
    return { ok: false, erro: 'A senha deve conter ao menos 1 letra maiúscula.' }
  }
  if (!/[0-9]/.test(senha)) {
    return { ok: false, erro: 'A senha deve conter ao menos 1 número.' }
  }
  return { ok: true }
}

export function validarEmail(email: string): ResultadoValidacao {
  if (typeof email !== 'string') return { ok: false, erro: 'E-mail inválido.' }
  const limpo = email.trim().toLowerCase()
  if (limpo.length > 320) return { ok: false, erro: 'E-mail muito longo.' }
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
  if (!re.test(limpo)) return { ok: false, erro: 'E-mail inválido.' }
  return { ok: true }
}

export function validarNome(nome: string): ResultadoValidacao {
  if (typeof nome !== 'string') return { ok: false, erro: 'Nome inválido.' }
  const limpo = nome.trim()
  if (limpo.length < 3 || limpo.length > 100) {
    return { ok: false, erro: 'Informe seu nome completo.' }
  }
  if (!/^[A-Za-zÀ-ÖØ-öø-ÿ'\s.-]+$/.test(limpo)) {
    return { ok: false, erro: 'Nome contém caracteres inválidos.' }
  }
  if (!limpo.includes(' ')) {
    return { ok: false, erro: 'Informe nome e sobrenome.' }
  }
  return { ok: true }
}

export function validarWhatsApp(whatsapp: string): ResultadoValidacao {
  if (typeof whatsapp !== 'string') {
    return { ok: false, erro: 'WhatsApp inválido.' }
  }
  const digitos = whatsapp.replace(/\D/g, '')
  if (digitos.length < 10 || digitos.length > 13) {
    return { ok: false, erro: 'Informe um WhatsApp válido com DDD.' }
  }
  return { ok: true }
}

export function sanitizarTexto(texto: unknown, limite = 1000): string {
  if (typeof texto !== 'string') return ''
  return texto
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .replace(/<[^>]*>/g, '')
    .trim()
    .slice(0, limite)
}

export function normalizarEmail(email: string): string {
  return String(email ?? '').trim().toLowerCase()
}

export function sanitizarNomeArquivo(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w.-]+/g, '_')
    .replace(/_{2,}/g, '_')
    .slice(0, 150)
}

export function slugDocumento(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

export function extrairIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  const xri = req.headers.get('x-real-ip')
  if (xri) return xri.trim()
  return 'anon'
}
