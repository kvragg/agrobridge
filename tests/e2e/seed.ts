// Seed do E2E Playwright. Cria/normaliza um usuário de teste via Supabase
// admin API para que os specs rodem com sessão consistente. Idempotente —
// pode rodar N vezes sem duplicar nada.
//
// Uso:
//   node --loader tsx tests/e2e/seed.ts
// ou:
//   npx tsx tests/e2e/seed.ts

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY
const EMAIL = process.env.E2E_TEST_EMAIL ?? 'e2e-teste@agrobridge.app'
const PASSWORD = process.env.E2E_TEST_PASSWORD ?? 'Senh@E2E-Teste-2026'

async function main() {
  if (!SUPABASE_URL || !SERVICE_ROLE) {
    console.error(
      '[seed] NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY obrigatórios.'
    )
    process.exit(1)
  }
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // 1. Garantir usuário (cria ou mantém). `email_confirm: true` pula o
  //    fluxo de verificação e já deixa logável.
  const { data: list, error: listErr } =
    await admin.auth.admin.listUsers({ perPage: 200 })
  if (listErr) throw listErr
  const existente = list.users.find((u) => u.email === EMAIL)

  let userId: string
  if (existente) {
    userId = existente.id
    console.log(`[seed] usuário já existe: ${EMAIL} (id=${userId})`)
    // Reset de senha pra valor conhecido — idempotente.
    await admin.auth.admin.updateUserById(userId, { password: PASSWORD })
  } else {
    const { data: novo, error: createErr } = await admin.auth.admin.createUser({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { nome: 'Produtor E2E', origem: 'playwright-seed' },
    })
    if (createErr || !novo.user) throw createErr
    userId = novo.user.id
    console.log(`[seed] usuário criado: ${EMAIL} (id=${userId})`)
  }

  // 2. Garantir que não tem processo residual impedindo novo fluxo —
  //    o E2E cria processo próprio.
  await admin
    .from('processos')
    .update({ deleted_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('deleted_at', null)

  console.log('[seed] ok.')
  console.log(`E2E_TEST_EMAIL=${EMAIL}`)
  console.log(`E2E_TEST_USER_ID=${userId}`)
}

main().catch((err) => {
  console.error('[seed] falhou:', err)
  process.exit(1)
})
