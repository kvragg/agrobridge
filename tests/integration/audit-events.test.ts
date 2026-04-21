import { describe, it, expect, vi, beforeEach } from "vitest";

// ============================================================
// [E4] Audit trail — `audit_events`
// ============================================================
// Garante que o helper `logAuditEvent` é invocado nas rotas
// sensíveis. Não cobre todos endpoints — o helper é o mesmo
// em todos os hooks; cobrir 1 ponto comprova a integração.
// ============================================================

const hoisted = vi.hoisted(() => ({
  insert: vi.fn(async () => ({ data: null, error: null })),
  serverClient: null as unknown,
}));

// Admin client retorna um stub mínimo para audit_events.insert.
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({ insert: hoisted.insert }),
  }),
}));

// Server client (autenticado) retorna user X e cria o processo.
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => hoisted.serverClient,
}));

const { POST } = await import("@/app/api/processos/route");

const userId = "uuuuuuuu-uuuu-uuuu-uuuu-uuuuuuuuuuuu";
const novoProcessoId = "pppppppp-pppp-pppp-pppp-pppppppppppp";

beforeEach(() => {
  hoisted.insert.mockClear();

  hoisted.serverClient = {
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: { id: userId, email: "x@test.local" } },
        error: null,
      })),
    },
    from: (_t: string) => {
      const builder = {
        insert: (_row: Record<string, unknown>) => builder,
        select: (_c?: string) => builder,
        single: async () => ({
          data: { id: novoProcessoId },
          error: null,
        }),
      };
      return builder;
    },
  };
});

describe("[E4] audit trail", () => {
  it("/api/processos POST grava evento `processo_criado` com user_id e target_id", async () => {
    const req = new Request("https://local.test/api/processos", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": "203.0.113.42",
        "user-agent": "vitest/1.0",
      },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(200);

    // O helper é fire-and-forget; o request retorna sem await. Damos uma
    // microtask para o insert acontecer.
    await new Promise((r) => setImmediate(r));

    expect(hoisted.insert).toHaveBeenCalledTimes(1);
    const arg = hoisted.insert.mock.calls[0][0] as Record<string, unknown>;
    expect(arg.event_type).toBe("processo_criado");
    expect(arg.user_id).toBe(userId);
    expect(arg.target_id).toBe(novoProcessoId);
    expect(arg.ip).toBe("203.0.113.42");
    expect(arg.user_agent).toBe("vitest/1.0");
  });
});
