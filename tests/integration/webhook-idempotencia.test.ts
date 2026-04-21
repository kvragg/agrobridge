import { describe, it, expect, vi, beforeEach } from "vitest";
import { assinarPagarme } from "../helpers/hmac";
import { criarSupabaseStub, type TabelaFake } from "../helpers/supabase-stub";

// ============================================================
// [A1] Webhook Pagar.me — idempotência e anti lost update
// ============================================================
// VERMELHO: no código atual, 5 retries do mesmo evento disparam
// 5 emails e NÃO atualizam `processos.pagamento_confirmado`
// nem transicionam `processos.fase` de 'pagamento' → 'coleta'.
//
// VERDE (pós-fix): a rota usa RPC `confirmar_pagamento` que tem
// idempotência em DUAS camadas:
//   (1) ON CONFLICT em webhook_events(provider, event_id)
//   (2) CAS em processos.pagamento_confirmado=false
// Só o primeiro vencedor dispara email e transiciona fase.
// ============================================================

const hoisted = vi.hoisted(() => ({
  enviarPagamentoConfirmado: vi.fn(async () => ({ id: "fake-email-id" })),
  stubRef: { current: null as unknown },
}));

vi.mock("@/lib/email/resend", () => ({
  enviarPagamentoConfirmado: hoisted.enviarPagamentoConfirmado,
  enviarDossiePronto: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => hoisted.stubRef.current,
}));

// Import da rota APÓS os mocks (vi.mock é hoisted, o import não).
const { POST } = await import("@/app/api/pagamento/webhook/route");

const SECRET = process.env.PAGARME_WEBHOOK_SECRET!;
const processoId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
const userId = "uuuuuuuu-aaaa-bbbb-cccc-dddddddddddd";
const emailProdutor = "ze@roca.test";

function requisicaoPagarme(body: string, sig?: string): Request {
  return new Request("https://local.test/api/pagamento/webhook", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-hub-signature": sig ?? assinarPagarme(body, SECRET),
    },
    body,
  });
}

function corpoChargePaid(opts: {
  eventId: string;
  type?: "charge.paid" | "order.paid";
  chargeId?: string;
}) {
  return JSON.stringify({
    id: opts.eventId,
    type: opts.type ?? "charge.paid",
    data: {
      id: opts.chargeId ?? "ch_test_1",
      status: "paid",
      paid_at: "2026-04-20T12:00:00Z",
      metadata: { processo_id: processoId },
    },
  });
}

function seed(): TabelaFake {
  return {
    processos: [
      {
        id: processoId,
        user_id: userId,
        fase: "pagamento",
        pagamento_confirmado: false,
        perfil_json: {
          perfil: { nome: "Zé da Roça" },
          _pagamento: {
            charge_id: "ch_test_1",
            status: "pending",
            valor_centavos: 29700,
          },
        },
      },
    ],
    webhook_events: [],
  };
}

beforeEach(() => {
  hoisted.enviarPagamentoConfirmado.mockClear();

  const tabelas = seed();
  // Conjunto do stub da RPC — simula ambas as camadas de dedup do Postgres.
  const eventIdsJaVistos = new Set<string>();

  const stub = criarSupabaseStub({
    tabelas,
    rpcs: {
      confirmar_pagamento: async (args) => {
        const p_event_id = String(args.p_event_id);
        const p_processo_id = String(args.p_processo_id);
        const p_evento = String(args.p_evento);

        // Camada 1: dedup por event_id (equivale ao ON CONFLICT).
        if (eventIdsJaVistos.has(p_event_id)) {
          return [
            {
              first_time: false,
              motivo: "event_replay",
              email: null,
              fase_antes: null,
              fase_depois: null,
            },
          ];
        }
        eventIdsJaVistos.add(p_event_id);
        (tabelas.webhook_events as Record<string, unknown>[]).push({
          provider: "pagarme",
          event_id: p_event_id,
        });

        const linha = (tabelas.processos as Array<Record<string, unknown>>).find(
          (p) => p.id === p_processo_id,
        );
        if (!linha) {
          return [
            {
              first_time: false,
              motivo: "processo_not_found",
              email: null,
              fase_antes: null,
              fase_depois: null,
            },
          ];
        }

        // Camada 2: CAS em pagamento_confirmado=false.
        if (linha.pagamento_confirmado === true) {
          return [
            {
              first_time: false,
              motivo: "already_confirmed",
              email: emailProdutor,
              fase_antes: linha.fase,
              fase_depois: linha.fase,
            },
          ];
        }

        const faseAntes = linha.fase;
        linha.pagamento_confirmado = true;
        linha.fase = linha.fase === "pagamento" ? "coleta" : linha.fase;
        const perfilAtual =
          (linha.perfil_json as Record<string, unknown> | null) ?? {};
        const pagAtual =
          (perfilAtual._pagamento as Record<string, unknown>) ?? {};
        linha.perfil_json = {
          ...perfilAtual,
          _pagamento: {
            ...pagAtual,
            status: "paid",
            evento: p_evento,
            event_id: p_event_id,
          },
        };
        return [
          {
            first_time: true,
            motivo: "ok",
            email: emailProdutor,
            fase_antes: faseAntes,
            fase_depois: linha.fase,
          },
        ];
      },
    },
  });

  // Para o código ANTIGO (vermelho) funcionar parcialmente, getUserById
  // devolve o email do produtor. Pós-fix, a rota nem chama mais.
  stub.auth.admin.getUserById = vi.fn(async () => ({
    data: { user: { id: userId, email: emailProdutor } },
    error: null,
  })) as unknown as typeof stub.auth.admin.getUserById;

  hoisted.stubRef.current = stub;
});

describe("[A1] webhook — idempotência e lost update", () => {
  it("5 retries do MESMO event_id → email enviado 1×, fase transicionada", async () => {
    const body = corpoChargePaid({ eventId: "evt_replay_xyz" });
    const reqs = Array.from({ length: 5 }, () => requisicaoPagarme(body));

    const respostas = await Promise.all(reqs.map((r) => POST(r as never)));
    for (const r of respostas) {
      expect(r.status).toBe(200);
    }

    expect(hoisted.enviarPagamentoConfirmado).toHaveBeenCalledTimes(1);

    const stub = hoisted.stubRef.current as ReturnType<typeof criarSupabaseStub>;
    const dump = stub.__dump();
    const proc = (dump.processos as Array<Record<string, unknown>>)[0];
    expect(proc.pagamento_confirmado).toBe(true);
    expect(proc.fase).toBe("coleta");
  });

  it("charge.paid + order.paid simultâneos (event_ids distintos) → 1 email só, fase consistente", async () => {
    const bodyCharge = corpoChargePaid({
      eventId: "evt_charge_1",
      type: "charge.paid",
    });
    const bodyOrder = corpoChargePaid({
      eventId: "evt_order_1",
      type: "order.paid",
    });

    await Promise.all([
      POST(requisicaoPagarme(bodyCharge) as never),
      POST(requisicaoPagarme(bodyOrder) as never),
    ]);

    expect(hoisted.enviarPagamentoConfirmado).toHaveBeenCalledTimes(1);
    const stub = hoisted.stubRef.current as ReturnType<typeof criarSupabaseStub>;
    const proc = (stub.__dump().processos as Array<Record<string, unknown>>)[0];
    expect(proc.fase).toBe("coleta");
    expect(proc.pagamento_confirmado).toBe(true);
  });

  it("HMAC inválido → 401 e nada é mutado", async () => {
    const body = corpoChargePaid({ eventId: "evt_bad_sig" });
    const res = await POST(requisicaoPagarme(body, "sha256=deadbeef") as never);
    expect(res.status).toBe(401);
    expect(hoisted.enviarPagamentoConfirmado).not.toHaveBeenCalled();
    const stub = hoisted.stubRef.current as ReturnType<typeof criarSupabaseStub>;
    const proc = (stub.__dump().processos as Array<Record<string, unknown>>)[0];
    expect(proc.pagamento_confirmado).toBe(false);
    expect(proc.fase).toBe("pagamento");
  });
});
