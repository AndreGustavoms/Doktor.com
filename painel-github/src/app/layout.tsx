import type { Metadata } from "next";
import { headers } from "next/headers";
import { archivoExpanded, publicSans, jetbrainsMono } from "./fonts";
import { QueryProvider } from "@/components/QueryProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Painel GitHub",
  description: "Painel local de gestão dos meus repositórios GitHub",
};

/*
 * Aplica o tema salvo ANTES da primeira pintura. Sem isto, toda página
 * abriria no claro e piscaria para o escuro assim que o React hidratasse
 * — o flash branco é justamente o que mais incomoda em quem escolheu
 * tema escuro.
 *
 * "system" não grava atributo nenhum: a ausência é o estado em que
 * prefers-color-scheme decide sozinho (ver globals.css).
 */
const SCRIPT_TEMA = `
(function(){try{
  var t = localStorage.getItem("painel-tema");
  if (t === "light" || t === "dark") document.documentElement.setAttribute("data-theme", t);
}catch(e){}})();
`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  /*
   * O nonce vem do middleware (ver src/middleware.ts): a CSP proíbe
   * script inline sem ele, então este script precisa carregá-lo
   * explicitamente — o Next só injeta nonce automaticamente nos scripts
   * que ele mesmo gera.
   */
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html
      lang="pt-BR"
      className={`${archivoExpanded.variable} ${publicSans.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/*
         * Script inline via children do <script>, não por
         * dangerouslySetInnerHTML: a regra react/no-danger é `error` em
         * todo o projeto (só MarkdownView é exceção, ver
         * eslint.config.mjs) e abrir uma segunda exceção numa regra de
         * segurança para um script de tema não se justifica. O conteúdo
         * aqui é uma constante do próprio código — nada vindo de fora.
         */}
        <script nonce={nonce}>{SCRIPT_TEMA}</script>
      </head>
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
