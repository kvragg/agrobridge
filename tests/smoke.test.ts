import { describe, it, expect } from "vitest";
import { criarSupabaseStub } from "./helpers/supabase-stub";

// Smoke test da fundação. Não toca em nenhuma rota. Garante apenas que
// o ambiente Vitest + alias "@/" + setup files carrega limpo.

describe("fundação de teste — smoke", () => {
  it("runtime Node disponível", () => {
    expect(typeof process.versions.node).toBe("string");
  });

  it('alias "@/" resolve código do projeto (lib/agents/types)', async () => {
    const mod = await import("@/lib/agents/types");
    expect(mod.ProcessoFaseSchema.safeParse("qualificacao").success).toBe(true);
    expect(mod.ProcessoFaseSchema.safeParse("inexistente").success).toBe(false);
  });

  it("supabase-stub expõe from/rpc/auth/storage", async () => {
    const sb = criarSupabaseStub({ tabelas: { processos: [{ id: "p1", fase: "qualificacao" }] } });
    const { data } = await sb.from("processos").select().eq("id", "p1").single();
    expect((data as { fase: string }).fase).toBe("qualificacao");
    expect(typeof sb.rpc).toBe("function");
    expect(typeof sb.storage.from).toBe("function");
  });

  it("env vars de teste foram aplicadas pelo setup", () => {
    expect(process.env.CAKTO_WEBHOOK_SECRET).toBeTruthy();
    expect(process.env.SUPABASE_SERVICE_ROLE_KEY).toBeTruthy();
  });
});
