import { defineConfig } from "vitest/config";
import path from "node:path";

// Projeto é CJS (sem "type":"module" no package.json). Vitest lê este
// arquivo via esbuild, então TS/ESM aqui é OK. Alias `@/*` espelha o
// tsconfig.json (paths: "@/*": ["./*"]) para que os testes importem
// exatamente como o runtime Next 16.

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
    },
  },
  test: {
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts"],
    globals: false,
    // Passo 0: sem nenhum teste de API ainda — só smoke. Mantém o runner
    // honesto: se ninguém escrever teste, CI ainda trava.
    passWithNoTests: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: [
        "app/api/**/*.ts",
        "lib/**/*.ts",
      ],
    },
    // Testes de concorrência do Eixo 1 precisam de Promise.all determinístico;
    // serial por default evita contaminação cruzada via spies globais.
    fileParallelism: false,
  },
});
