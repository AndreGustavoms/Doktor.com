/*
 * ÚNICO componente autorizado a usar dangerouslySetInnerHTML no
 * projeto — ver docs/SECURITY.md, ameaça A5. `html` PRECISA já ter
 * passado por src/server/markdown.ts (renderMarkdown). Este componente
 * não sanitiza nada por conta própria; ele confia que o chamador
 * cumpriu esse contrato, então é Server Component (não Client) — não há
 * caminho para HTML não sanitizado chegar aqui vindo do client.
 */
export function MarkdownView({ html }: { html: string }) {
  return (
    <div className="prose-panel" dangerouslySetInnerHTML={{ __html: html }} />
  );
}
