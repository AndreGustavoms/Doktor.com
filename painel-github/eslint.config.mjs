import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const config = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    // A1: código de servidor (Octokit, vault, sessão) nunca pode ser
    // importado por componentes ou hooks do client — isso é como um
    // token vaza para o bundle sem ninguém perceber. Restrito a
    // components/hooks (não a todo o projeto): Route Handlers,
    // page.tsx de Server Component e testes unitários PRECISAM
    // importar de src/server/** — essa é a fronteira certa, não uma
    // proibição geral.
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
  {
    // A5: dangerouslySetInnerHTML com HTML que não passou por
    // src/server/markdown.ts (renderMarkdown) é o vetor central de XSS
    // via conteúdo do GitHub. Único arquivo autorizado é MarkdownView —
    // ver docs/SECURITY.md e o comentário no topo desse componente.
    files: ["**/*.{ts,tsx}"],
    ignores: ["src/components/markdown/MarkdownView.tsx"],
    rules: {
      "react/no-danger": "error",
    },
  },
];

export default config;
