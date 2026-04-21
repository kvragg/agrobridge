import { describe, it, expect, vi, beforeEach } from "vitest";

// ============================================================
// [E2] IDOR — defesa em profundidade nas rotas API
// ============================================================
// Hoje as rotas /api/checklist, /api/dossie e /api/entrevista
// fazem `from('processos').select().eq('id', X).single()` SEM
// checar `processo.user_id === user.id`. A barreira fica 100%
// dependente de RLS — se uma policy for relaxada por engano OU
// se um dev usar `createAdminClient()` no caminho de leitura,
// um usuário consegue operar em processos alheios.
//
// VERDE (pós-fix): cada rota replica o padrão já existente em
// `documento/validar` e `pagamento/status`: select inclui
// `user_id`, e há check explícito que retorna 404 se mismatch.
// ============================================================

const hoisted = vi.hoisted(() => ({
  // Anthropic — não deve ser chamado em nenhum dos cenários (a request
  // tem que falhar ANTES de gastar tokens).
  gerarChecklist: vi.fn(async () => "## Checklist mockado"),
  gerarLaudo: vi.fn(async () => "## Laudo mockado"),
  montarDossiePDF: vi.fn(async () => Buffer.from("PDF", "utf8")),
  calcularCompletude: vi.fn(async () => ({
    total: 1,
    anexados: 1,
    pendentes: [],
    documentos: [],
  })),
  criarStreamEntrevista: vi.fn(),
  // Cliente supabase reconfigurado por teste.
  client: null as unknown,
}));

vi.mock("@/lib/anthropic/sonnet", () => ({
  gerarChecklist: hoisted.gerarChecklist,
  SONNET_MODEL: "test",
}));
vi.mock("@/lib/anthropic/haiku", () => ({
  criarStreamEntrevista: hoisted.criarStreamEntrevista,
  HAIKU_MODEL: "test",
}));
vi.mock("@/lib/anthropic/defesa", () => ({
  gerarLaudo: hoisted.gerarLaudo,
}));
vi.mock("@/lib/dossie/pdf", () => ({
  montarDossiePDF: hoisted.montarDossiePDF,
}));
vi.mock("@/lib/dossie/status", () => ({
  calcularCompletude: hoisted.calcularCompletude,
}));
vi.mock("@/lib/email/resend", () => ({
  enviarDossiePronto: vi.fn(),
  enviarPagamentoConfirmado: vi.fn(),
  enviarLeadNotification: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => hoisted.client,
}));

const { POST: postChecklist } = await import("@/app/api/checklist/route");
const { POST: postDossie } = await import("@/app/api/dossie/route");
const { POST: postEntrevista } = await import("@/app/api/entrevista/route");

const userA = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const userB = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const processoDeB = "11111111-1111-1111-1111-111111111111";

// Cliente supabase falsificado: simula o cenário em que RLS está fora /
// foi relaxada — o select ENTREGA o processo de outro user. O código
// correto deve detectar e abortar via check explícito.
function clienteRlsRelaxada() {
  const processo = {
    id: processoDeB,
    user_id: userB, // dono real
    perfil_json: {
      perfil: { nome: "B" },
      _checklist_md: "## checklist do B",
    },
    banco: null,
    valor: null,
    status: "documentos",
  };
  return {
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: { id: userA, email: "a@test" } },
        error: null,
      })),
    },
    from: (_tabela: string) => {
      const builder = {
        select: () => builder,
        eq: () => builder,
        single: async () => ({ data: processo, error: null }),
        update: () => ({
          eq: async () => ({ data: null, error: null }),
        }),
      };
      return builder;
    },
    rpc: vi.fn(async () => ({ data: null, error: null })),
    storage: {
      from: () => ({
        upload: vi.fn(),
        createSignedUrl: vi.fn(),
      }),
    },
  };
}

beforeEach(() => {
  hoisted.gerarChecklist.mockClear();
  hoisted.gerarLaudo.mockClear();
  hoisted.montarDossiePDF.mockClear();
  hoisted.criarStreamEntrevista.mockClear();
  hoisted.client = clienteRlsRelaxada();
});

describe("[E2] IDOR defense-in-depth", () => {
  it("/api/checklist nega 404 quando processo.user_id !== user.id (e não chama Anthropic)", async () => {
    const req = new Request("https://local.test/api/checklist", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ processo_id: processoDeB }),
    });
    const res = await postChecklist(req as never);
    expect(res.status).toBe(404);
    expect(hoisted.gerarChecklist).not.toHaveBeenCalled();
  });

  it("/api/dossie nega 404 quando processo.user_id !== user.id (e não chama Sonnet/PDF)", async () => {
    const req = new Request("https://local.test/api/dossie", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ processo_id: processoDeB }),
    });
    const res = await postDossie(req as never);
    expect(res.status).toBe(404);
    expect(hoisted.gerarLaudo).not.toHaveBeenCalled();
    expect(hoisted.montarDossiePDF).not.toHaveBeenCalled();
  });

  it("/api/entrevista nega 404 quando processo.user_id !== user.id (e não inicia stream Haiku)", async () => {
    const req = new Request("https://local.test/api/entrevista", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        processo_id: processoDeB,
        messages: [{ role: "user", content: "oi" }],
      }),
    });
    const res = await postEntrevista(req as never);
    expect(res.status).toBe(404);
    expect(hoisted.criarStreamEntrevista).not.toHaveBeenCalled();
  });
});
