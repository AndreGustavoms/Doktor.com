import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const config = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      // A1: código de servidor (Octokit, vault, sessão) nunca pode ser
      // importado por componentes ou hooks do client — isso é como um
      // token vaza para o bundle sem ninguém perceber.
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/server/*", "@/server"],
              message:
                "src/server/** só pode ser importado por Route Handlers e Server Components. Ver regra de ouro da arquitetura em docs/ARCHITECTURE.md.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/components/**/*.{ts,tsx}", "src/hooks/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/server/*", "@/server", "**/server/*"],
              message:
                "src/components/** e src/hooks/** nunca importam de src/server/**. Isso é a regra de ouro da arquitetura — ver docs/ARCHITECTURE.md.",
            },
          ],
        },
      ],
    },
  },
  {
    // A7: console.log de objeto de request/response do Octokit vaza o
    // header Authorization. Só o módulo de log em si pode usar console.
    files: ["**/*.{ts,tsx}"],
    ignores: ["src/server/log.ts", "scripts/**", "tests/**", "*.config.{ts,mjs}"],
    rules: {
      "no-console": "error",
    },
  },
];

export default config;
