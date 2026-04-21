import crypto from "node:crypto";

// Assinador HMAC-SHA256 compatível com o formato do Pagar.me
// (`x-hub-signature: sha256=<hex>`). Usado pelos testes do Eixo 1 / A1
// para forjar requisições válidas ao webhook sem depender do provedor.
// Tem que bater com o verificador em app/api/pagamento/webhook/route.ts.
export function assinarPagarme(rawBody: string, secret: string): string {
  const hex = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex");
  return `sha256=${hex}`;
}
