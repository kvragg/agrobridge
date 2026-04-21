import 'server-only'
import { createClient } from '@supabase/supabase-js'

// Server-only — enforced at build-time por `server-only`.
// Qualquer import a partir de Client Component quebra o build.
// Usa SUPABASE_SERVICE_ROLE_KEY: exposição ao browser permite bypass total do RLS.
// Apenas em Server Actions e Route Handlers.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
