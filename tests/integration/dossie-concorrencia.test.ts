import { describe, it, expect, vi, beforeEach } from "vitest";
import { criarSupabaseStub, type TabelaFake } from "../helpers/supabase-stub";

// ============================================================
// [A2] Dossiê — concorrência e DoS econômico
// ============================================================
// VERMELHO (código atual): 10 POST /api/dossie simultâneos levam
//   - 10 chamadas a `gerarLaudo` (custo Anthropic multiplicado)
//   - 10 uploads concorrentes no Storage (upsert:true)
//   - 10 emails "dossiê pronto" porque `_dossie_gerado_em` é lido
//     pre-mutation em todas as threads.
//
// VERDE (pós-fix): RPC `iniciar_geracao_dossie` faz CAS em
// processos.dossie_gerando_desde. Só UMA request adquire o lock;
// as 9 restantes recebem 409 imediato. Ao final, RPC
// `finalizar_geracao_dossie` zera o lock e persiste laudo/timestamp
// atomicamente, retornando `was_first_generation` para decidir o
// envio do email.
// ============================================================

const hoisted = vi.hoisted(() => ({
  gerarLaudo: vi.fn(async () => "# Laudo de teste\n\nCorpo."),
  montarDossiePDF: vi.fn(async () => Buffer.from("PDF-FAKE", "utf8")),
  calcularCompletude: vi.fn(async () => ({
    total: 5,
    anexados: 5,
    pendentes: [],
    documentos: [
      {
        categoria: "IR",
        nome_esperado: "Declaração IR 2025",
        doc_slug: "ir_2025",
        enviado: true,
      },
    ],
  })),
  enviarDossiePronto: vi.fn(async () => ({ id: "email-id" })),
  stubRef: { current: null as unknown },
}));

vi.mock("@/lib/anthropic/defesa", () => ({
  gerarLaudo: hoisted.gerarLaudo,
}));

vi.mock("@/lib/dossie/pdf", () => ({
  montarDossiePDF: hoisted.montarDossiePDF,
}));

// Mock do template Ouro também — endpoint escolhe por tier (Prata/Ouro).
// Como o seed usa _tier='dossie', roda o mock de pdf.ts, mas mockamos os
// dois pra garantir que trocas de tier no seed não quebrem o teste.
vi.mock("@/lib/dossie/pdf-mentoria", () => ({
  montarMentoriaPDF: hoisted.montarDossiePDF,
}));

vi.mock("@/lib/dossie/status", () => ({
  calcularCompletude: hoisted.calcularCompletude,
}));

vi.mock("@/lib/email/resend", () => ({
  enviarDossiePronto: hoisted.enviarDossiePronto,
  enviarPagamentoConfirmado: vi.fn(),
}));

// Rate-limit interfere com teste de concorrência: a 6ª request seria 429
// antes de exercitar o lock CAS. Como o objetivo aqui é o lock, deixamos
// OK (rate-limit é coberto por rate-limit-upstash.test.ts).
vi.mock("@/lib/rate-limit-upstash", () => ({
  rateLimitRemoto: async () => ({ ok: true, retryAfterSeconds: 0, remaining: 999 }),
  rateLimitIARemoto: async () => ({
    ok: true,
    retryAfterSeconds: 0,
    remaining: 999,
    limite: 999,
    tier: 'teste',
  }),
}));

// Logger redacted — evita ruído nos logs de teste.
vi.mock("@/lib/logger", () => ({
  capturarErroProducao: vi.fn(),
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => hoisted.stubRef.current,
}));

const { POST } = await import("@/app/api/dossie/route");

const processoId = "11111111-2222-3333-4444-555555555555";
const userId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
const emailProdutor = "produtor@teste.local";

function reqDossie(): Request {
  return new Request("https://local.test/api/dossie", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ processo_id: processoId }),
  });
}

function seed(): TabelaFake {
  return {
    processos: [
      {
        id: processoId,
        user_id: userId,
        banco: null,
        valor: 150000,
        status: "documentos",
        fase: "coleta",
        pagamento_confirmado: true,
        dossie_gerando_desde: null,
        perfil_json: {
          perfil: { nome: "Zé Teste", cpf: "000.000.000-00" },
          _checklist_md: "## Checklist\n- IR 2025",
          _pagamento: { status: "paid" },
          // Pós-redesign dos PDFs por tier: endpoint escolhe template
          // baseado em perfil_json._tier. Sem isso, gate temAcesso falha.
          _tier: "dossie",
        },
      },
    ],
  };
}

beforeEach(() => {
  hoisted.gerarLaudo.mockClear();
  hoisted.montarDossiePDF.mockClear();
  hoisted.calcularCompletude.mockClear();
  hoisted.enviarDossiePronto.mockClear();

  const tabelas = seed();

  // Estado interno do lock — simula a CAS atômica do Postgres.
  let lockAdquirido = false;

  const stub = criarSupabaseStub({
    tabelas,
    rpcs: {
      iniciar_geracao_dossie: async () => {
        // JS é single-threaded entre await points → esta secção é
        // efetivamente atômica; replica a semântica do UPDATE ... CAS.
        if (lockAdquirido) {
          return [{ acquired: false, motivo: "already_generating" }];
        }
        lockAdquirido = true;
        const linha = (tabelas.processos as Array<Record<string, unknown>>)[0];
        linha.dossie_gerando_desde = new Date().toISOString();
        return [{ acquired: true, motivo: "acquired" }];
      },
      finalizar_geracao_dossie: async (args) => {
        const linha = (tabelas.processos as Array<Record<string, unknown>>)[0];
        const perfil = (linha.perfil_json as Record<string, unknown>) ?? {};
        const wasFirst = !perfil._dossie_gerado_em;
        linha.perfil_json = {
          ...perfil,
          _laudo_md: String(args.p_laudo_md),
          _dossie_gerado_em: new Date().toISOString(),
        };
        linha.status = "concluido";
        linha.dossie_gerando_desde = null;
        lockAdquirido = false;
        return [
          {
            was_first_generation: wasFirst,
            gerado_em: new Date().toISOString(),
          },
        ];
      },
      abortar_geracao_dossie: async () => {
        const linha = (tabelas.processos as Array<Record<string, unknown>>)[0];
        linha.dossie_gerando_desde = null;
        lockAdquirido = false;
        return null;
      },
    },
  });

  // Sessão autenticada do produtor dono do processo.
  stub.auth.getUser = vi.fn(async () => ({
    data: { user: { id: userId, email: emailProdutor } },
    error: null,
  })) as unknown as typeof stub.auth.getUser;

  // Storage stub: contabilizar uploads para as asserções.
  const uploadFn = vi.fn(async () => ({ data: { path: "ok" }, error: null }));
  const signedFn = vi.fn(async () => ({
    data: { signedUrl: "https://fake.local/pdf-signed" },
    error: null,
  }));
  stub.storage.from = () => ({
    upload: uploadFn,
    createSignedUrl: signedFn,
  });
  // expose for assertions
  (stub as unknown as { __upload: typeof uploadFn }).__upload = uploadFn;

  hoisted.stubRef.current = stub;
});

describe("[A2] dossiê — concorrência / DoS econômico", () => {
  it("10 requisições simultâneas → 1 Laudo, 1 upload, 1 email, 9 respostas 409", async () => {
    const respostas = await Promise.all(
      Array.from({ length: 10 }, () => POST(reqDossie() as never)),
    );

    const ok = respostas.filter((r) => r.status === 200);
    const conflito = respostas.filter((r) => r.status === 409);

    expect(ok).toHaveLength(1);
    expect(conflito).toHaveLength(9);

    // Custo Anthropic: invocado uma única vez.
    expect(hoisted.gerarLaudo).toHaveBeenCalledTimes(1);
    // PDF montado uma única vez.
    expect(hoisted.montarDossiePDF).toHaveBeenCalledTimes(1);
    // Email primeiro-dossiê enviado uma única vez.
    expect(hoisted.enviarDossiePronto).toHaveBeenCalledTimes(1);

    // Upload único no Storage.
    const stub = hoisted.stubRef.current as {
      __upload: ReturnType<typeof vi.fn>;
    };
    expect(stub.__upload).toHaveBeenCalledTimes(1);
  });

  it("concorrentes recebem motivo 'em_geracao'", async () => {
    const respostas = await Promise.all(
      Array.from({ length: 5 }, () => POST(reqDossie() as never)),
    );
    const conflitos = await Promise.all(
      respostas
        .filter((r) => r.status === 409)
        .map((r) => r.json() as Promise<{ motivo?: string; erro?: string }>),
    );
    expect(conflitos.length).toBe(4);
    for (const c of conflitos) {
      expect(c.motivo).toBe("em_geracao");
    }
  });
});
