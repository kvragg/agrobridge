import { describe, it, expect, vi, beforeEach } from "vitest";

// ============================================================
// [E5] Anti-enumeração no /api/auth/signup
// ============================================================
// VERMELHO (estado original): se o e-mail já está cadastrado, a rota
// devolvia 409 + { codigo: 'email_ja_cadastrado' }. Isso é um oráculo
// de enumeração: um atacante consegue extrair lista de e-mails
// cadastrados disparando POSTs em loop com e-mails de wordlist.
//
// VERDE (pós-fix E5 + Bug A 25/04):
//   1. Resposta indistinguível do caminho de sucesso (status 200, mesma
//      forma `{ ok: true, temSessao }`) — atacante sem oráculo.
//   2. Quando a senha BATE no e-mail já cadastrado (lead legítimo
//      tentando re-cadastrar com senha conhecida), faz login automático
//      e retorna `temSessao: true` + `jaExistia: true`. Sem isso o lead
//      ficava esperando email que nunca vinha (Supabase não reenvia
//      pra email confirmed).
//
// Compliance: OWASP API3:2023 (Broken Object Property Level
// Authorization → user enumeration) + LGPD art. 46 (segurança).
// ============================================================

const hoisted = vi.hoisted(() => ({
  signUp: vi.fn(),
  signInWithPassword: vi.fn(),
  enviarLeadNotification: vi.fn(async () => undefined),
  enviarBoasVindas: vi.fn(async () => ({ ok: true, resendId: null })),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      signUp: hoisted.signUp,
      signInWithPassword: hoisted.signInWithPassword,
    },
  }),
}));

vi.mock("@/lib/email/resend", () => ({
  enviarLeadNotification: hoisted.enviarLeadNotification,
  enviarBoasVindas: hoisted.enviarBoasVindas,
}));

const { POST } = await import("@/app/api/auth/signup/route");

const corpoValido = {
  nome: "João Silva",
  email: "joao@exemplo.com",
  senha: "SenhaForte1",
  whatsapp: "(67) 99999-9999",
  origin: "https://local.test",
};

function requisicao(body: object, ip = "10.0.0.1"): Request {
  return new Request("https://local.test/api/auth/signup", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": ip,
    },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  hoisted.signUp.mockReset();
  hoisted.signInWithPassword.mockReset();
  hoisted.enviarLeadNotification.mockClear();
  hoisted.enviarBoasVindas.mockClear();
  // Default: senha não bate (mantém anti-enumeração estrita)
  hoisted.signInWithPassword.mockResolvedValue({
    data: { session: null, user: null },
    error: { message: "Invalid login credentials" },
  });
});

describe("[E5] signup — anti-enumeração de e-mail", () => {
  it("e-mail novo (sucesso) e e-mail já cadastrado COM SENHA ERRADA retornam respostas indistinguíveis", async () => {
    // Cenário 1: e-mail novo — Supabase devolve user sem session (confirmação on)
    hoisted.signUp.mockResolvedValueOnce({
      data: { user: { id: "uid-novo" }, session: null },
      error: null,
    });
    const resNovo = await POST(
      requisicao({ ...corpoValido, email: "novo@exemplo.com" }, "10.0.0.10") as never,
    );
    const bodyNovo = await resNovo.json();

    // Cenário 2: e-mail já cadastrado, senha NÃO bate — anti-enumeração estrita
    hoisted.signUp.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: "User already registered" },
    });
    // signInWithPassword com senha errada (default do beforeEach)
    const resDup = await POST(
      requisicao({ ...corpoValido, email: "ja@exemplo.com" }, "10.0.0.11") as never,
    );
    const bodyDup = await resDup.json();

    // Auditoria: status idênticos
    expect(resDup.status).toBe(resNovo.status);
    expect(resNovo.status).toBe(200);

    // Auditoria: forma idêntica — sem campo `codigo` denunciando o caso
    expect(bodyDup).toEqual(bodyNovo);
    expect(bodyDup).not.toHaveProperty("codigo");
    expect(bodyDup).not.toHaveProperty("erro");
    expect(bodyDup).toHaveProperty("ok", true);
    // Quando senha errada, NÃO sinaliza jaExistia (preserva oráculo)
    expect(bodyDup).not.toHaveProperty("jaExistia");
  });

  it("e-mail já cadastrado COM SENHA CORRETA loga automático (Bug A — UX 25/04)", async () => {
    // E-mail existe + senha bate → faz login automático (lead legítimo
    // que tentou re-cadastrar). Atacante NÃO chega aqui porque não tem
    // a senha — diferenciação por POSSE de credencial, não por revelação.
    hoisted.signUp.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: "User already registered" },
    });
    hoisted.signInWithPassword.mockResolvedValueOnce({
      data: {
        session: { access_token: "tok", refresh_token: "ref" },
        user: { id: "uid-existente", email: "ja@exemplo.com" },
      },
      error: null,
    });

    const res = await POST(
      requisicao({ ...corpoValido, email: "ja@exemplo.com" }, "10.0.0.40") as never,
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toHaveProperty("ok", true);
    expect(body).toHaveProperty("temSessao", true);
    expect(body).toHaveProperty("jaExistia", true);
  });

  it("e-mail já cadastrado NÃO dispara notificação de lead (não vaza por canal lateral)", async () => {
    hoisted.signUp.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: "User already registered" },
    });
    // Senha errada (default beforeEach) — caminho anti-enumeração
    await POST(requisicao(corpoValido, "10.0.0.20") as never);
    expect(hoisted.enviarLeadNotification).not.toHaveBeenCalled();
    // Boas-vindas também NÃO dispara (não foi cadastro novo)
    expect(hoisted.enviarBoasVindas).not.toHaveBeenCalled();
  });

  it("erro genuíno do Supabase (não-duplicação) ainda devolve 400 com erro", async () => {
    hoisted.signUp.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: "Password too weak" },
    });
    const res = await POST(requisicao(corpoValido, "10.0.0.30") as never);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty("erro");
  });
});
