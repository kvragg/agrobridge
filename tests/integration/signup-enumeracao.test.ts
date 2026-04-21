import { describe, it, expect, vi, beforeEach } from "vitest";

// ============================================================
// [E5] Anti-enumeração no /api/auth/signup
// ============================================================
// VERMELHO (estado atual): se o e-mail já está cadastrado, a rota
// devolve 409 + { codigo: 'email_ja_cadastrado' }. Isso é um oráculo
// de enumeração: um atacante consegue extrair lista de e-mails
// cadastrados disparando POSTs em loop com e-mails de wordlist.
//
// VERDE (pós-fix): a resposta deve ser INDISTINGUÍVEL do caminho
// de sucesso (status 200, mesma forma `{ ok: true, temSessao }`).
// Compliance: OWASP API3:2023 (Broken Object Property Level
// Authorization → user enumeration) + LGPD art. 46 (segurança).
// ============================================================

const hoisted = vi.hoisted(() => ({
  signUp: vi.fn(),
  enviarLeadNotification: vi.fn(async () => undefined),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { signUp: hoisted.signUp },
  }),
}));

vi.mock("@/lib/email/resend", () => ({
  enviarLeadNotification: hoisted.enviarLeadNotification,
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
  hoisted.enviarLeadNotification.mockClear();
});

describe("[E5] signup — anti-enumeração de e-mail", () => {
  it("e-mail novo (sucesso) e e-mail já cadastrado retornam respostas indistinguíveis", async () => {
    // Cenário 1: e-mail novo — Supabase devolve user sem session (confirmação on)
    hoisted.signUp.mockResolvedValueOnce({
      data: { user: { id: "uid-novo" }, session: null },
      error: null,
    });
    const resNovo = await POST(
      requisicao({ ...corpoValido, email: "novo@exemplo.com" }, "10.0.0.10") as never,
    );
    const bodyNovo = await resNovo.json();

    // Cenário 2: e-mail já cadastrado — Supabase devolve erro
    hoisted.signUp.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: "User already registered" },
    });
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
  });

  it("e-mail já cadastrado NÃO dispara notificação de lead (não vaza por canal lateral)", async () => {
    hoisted.signUp.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: "User already registered" },
    });
    await POST(requisicao(corpoValido, "10.0.0.20") as never);
    expect(hoisted.enviarLeadNotification).not.toHaveBeenCalled();
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
