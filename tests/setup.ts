import { vi } from "vitest";

// `server-only` é um módulo que a Next injeta para travar imports do lado
// cliente. Em Vitest (Node puro), importá-lo de dentro de módulos reais
// (`lib/supabase/admin.ts`, `lib/agents/*`) não quebra — mas manter o
// mock vazio deixa explícito que a fronteira está stubada no teste.
vi.mock("server-only", () => ({}));

// Env vars que várias rotas leem no topo do arquivo. Valores fake — testes
// que precisam de comportamento real sobrescrevem via `vi.stubEnv`.
process.env.NEXT_PUBLIC_SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://test.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? "test-service-role";
process.env.PAGARME_WEBHOOK_SECRET =
  process.env.PAGARME_WEBHOOK_SECRET ?? "test-pagarme-secret";
process.env.ANTHROPIC_API_KEY =
  process.env.ANTHROPIC_API_KEY ?? "sk-ant-test";
