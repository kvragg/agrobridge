import { vi } from "vitest";

// ============================================================
// tests/helpers/supabase-stub.ts
// Fake cliente Supabase com semântica RMW realista.
//
// Objetivo: reproduzir o comportamento que permite as falhas do Eixo 1 —
// reads concorrentes enxergam o MESMO snapshot antes do write do outro
// "competidor". O stub abraça isso em vez de esconder, para que os
// testes de concorrência FALHEM no código atual e passem após a RPC
// atômica ser introduzida.
//
// Escopo do Passo 0: APENAS a estrutura base — factory + Map por tabela,
// .from().select/update, .auth, .storage, .rpc. Comportamentos
// específicos dos testes A1..A5 são montados sobre essa base nos
// próximos passos. Nenhum teste real depende desta superfície hoje; o
// smoke test abaixo só valida o export.
// ============================================================

export type TabelaFake = Record<string, Record<string, unknown>[]>;

export type StubOptions = {
  tabelas?: TabelaFake;
  rpcs?: Record<string, (args: Record<string, unknown>) => Promise<unknown>>;
  // Liga/desliga a simulação de race window. Quando true, chamadas a
  // .select() dentro da janela devolvem o mesmo snapshot mesmo se outra
  // transação já tiver escrito. Default: false (comportamento normal).
  raceWindow?: boolean;
};

export type SupabaseStub = {
  from: ReturnType<typeof criarFromBuilder>;
  rpc: (
    nome: string,
    args?: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: null | { message: string } }>;
  auth: {
    getUser: ReturnType<typeof vi.fn>;
    admin: {
      getUserById: ReturnType<typeof vi.fn>;
    };
  };
  storage: {
    from: (bucket: string) => {
      upload: ReturnType<typeof vi.fn>;
      createSignedUrl: ReturnType<typeof vi.fn>;
    };
  };
  __dump: () => TabelaFake;
  __setRaceWindow: (ligado: boolean) => void;
};

function criarFromBuilder(
  tabelas: TabelaFake,
  raceRef: { ligado: boolean; snapshots: Map<string, unknown[]> },
) {
  return function from(nome: string) {
    const obter = (): Record<string, unknown>[] => {
      if (raceRef.ligado && raceRef.snapshots.has(nome)) {
        return raceRef.snapshots.get(nome) as Record<string, unknown>[];
      }
      const atual = tabelas[nome] ?? [];
      if (raceRef.ligado && !raceRef.snapshots.has(nome)) {
        raceRef.snapshots.set(nome, atual.map((l) => ({ ...l })));
        return raceRef.snapshots.get(nome) as Record<string, unknown>[];
      }
      return atual;
    };

    const filtros: Array<(l: Record<string, unknown>) => boolean> = [];

    const builder = {
      select: (_cols?: string) => builder,
      eq: (col: string, val: unknown) => {
        filtros.push((l) => l[col] === val);
        return builder;
      },
      single: async () => {
        const linhas = obter().filter((l) => filtros.every((f) => f(l)));
        if (linhas.length === 0) {
          return { data: null, error: { code: "PGRST116", message: "no rows" } };
        }
        return { data: linhas[0], error: null };
      },
      maybeSingle: async () => {
        const linhas = obter().filter((l) => filtros.every((f) => f(l)));
        return { data: linhas[0] ?? null, error: null };
      },
      update: (patch: Record<string, unknown>) => ({
        eq: async (col: string, val: unknown) => {
          // Write sempre vai pra tabela canônica (não ao snapshot do
          // race window). Isso é proposital: simula que o commit real
          // no Postgres ignora snapshots de readers concorrentes.
          const canonica = (tabelas[nome] ??= []);
          let afetadas = 0;
          for (const linha of canonica) {
            if (linha[col] === val) {
              Object.assign(linha, patch);
              afetadas++;
            }
          }
          return { data: null, error: null, count: afetadas };
        },
      }),
      insert: async (linhas: Record<string, unknown> | Record<string, unknown>[]) => {
        const canonica = (tabelas[nome] ??= []);
        const arr = Array.isArray(linhas) ? linhas : [linhas];
        canonica.push(...arr);
        return { data: arr, error: null };
      },
    };

    return builder;
  };
}

export function criarSupabaseStub(opts: StubOptions = {}): SupabaseStub {
  const tabelas: TabelaFake = opts.tabelas ?? {};
  const rpcs = opts.rpcs ?? {};
  const raceRef = {
    ligado: opts.raceWindow ?? false,
    snapshots: new Map<string, unknown[]>(),
  };

  return {
    from: criarFromBuilder(tabelas, raceRef),
    rpc: async (nome, args = {}) => {
      const handler = rpcs[nome];
      if (!handler) {
        return {
          data: null,
          error: { message: `rpc '${nome}' não registrada no stub` },
        };
      }
      const data = await handler(args);
      return { data, error: null };
    },
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: null },
        error: null,
      })),
      admin: {
        getUserById: vi.fn(async () => ({
          data: { user: null },
          error: null,
        })),
      },
    },
    storage: {
      from: (_bucket: string) => ({
        upload: vi.fn(async () => ({ data: { path: "" }, error: null })),
        createSignedUrl: vi.fn(async () => ({
          data: { signedUrl: "https://fake.local/signed" },
          error: null,
        })),
      }),
    },
    __dump: () => tabelas,
    __setRaceWindow: (ligado) => {
      raceRef.ligado = ligado;
      if (!ligado) raceRef.snapshots.clear();
    },
  };
}
