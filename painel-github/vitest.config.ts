import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts", "tests/security/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
      // Ver tests/mocks/server-only.ts — o pacote real lança fora do
      // bundler do Next, o que quebraria todo teste unitário de módulos
      // de servidor sem este alias.
      "server-only": path.resolve(import.meta.dirname, "./tests/mocks/server-only.ts"),
    },
  },
});
