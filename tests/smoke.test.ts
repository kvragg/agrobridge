import { describe, it, expect } from "vitest";
import { assinarPagarme } from "./helpers/hmac";
import { criarSupabaseStub } from "./helpers/supabase-stub";

// Smoke test da fundação (Passo 0). Não toca em nenhuma rota. Garante
// apenas que o ambiente Vitest + alias "@/" + setup files carrega
// limpo. Testes reais do Eixo 1 (A1..A5) entram nos próximos passos.

describe("fundação de teste — smoke", () => {
  it("runtime Node disponível", () => {
    expect(typeof process.versions.node).toBe("string");
  });

  it('alias "@/" resolve código do projeto (lib/agents/types)', async () => {
    const mod = await import("@/lib/agents/types");
    expect(mod.ProcessoFaseSchema.safeParse("qualificacao").success).toBe(true);
    expect(mod.ProcessoFaseSchema.safeParse("inexistente").success).toBe(false);
  });

  it("assinador HMAC do Pagar.me produz header válido", () => {
    const sig = assinarPagarme('{"ping":1}', "dev_secret");
    expect(sig).toMatch(/^sha256=[0-9a-f]{64}$/);
  });

  it("supabase-stub expõe from/rpc/auth/storage", async () => {
    const sb = criarSupabaseStub({ tabelas: { processos: [{ id: "p1", fase: "qualificacao" }] } });
    const { data } = await sb.from("processos").select().eq("id", "p1").single();
    expect((data as { fase: string }).fase).toBe("qualificacao");
    expect(typeof sb.rpc).toBe("function");
    expect(typeof sb.storage.from).toBe("function");
  });

  it("env vars de teste foram aplicadas pelo setup", () => {
    expect(process.env.PAGARME_WEBHOOK_SECRET).toBeTruthy();
    expect(process.env.SUPABASE_SERVICE_ROLE_KEY).toBeTruthy();
  });
});
