import "server-only";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema, type Options as SanitizeSchema } from "rehype-sanitize";
import rehypeHighlight from "rehype-highlight";
import rehypeStringify from "rehype-stringify";
import { visit } from "unist-util-visit";
import type { Root, Element } from "hast";

/*
 * A5 — XSS via conteúdo do GitHub. READMEs, títulos de issues,
 * descrições e corpos de PR são conteúdo controlado por terceiros
 * (qualquer colaborador do repo, não só o dono). Renderizar HTML cru
 * dali executa script no painel autenticado, que tem acesso de escrita
 * aos repositórios. Ver docs/SECURITY.md, ameaça A5, e prompt original
 * §4.7.
 *
 * Schema restritivo baseado no defaultSchema (hast-util-sanitize, que já
 * segue o padrão do próprio GitHub) — mas cortado para a lista exata
 * pedida: cabeçalhos, parágrafos, listas, links, imagens, code,
 * blockquote, tabelas (GFM), hr, strong, em, del. O defaultSchema já não
 * inclui <script>/<style>/<iframe>/<object>/<embed>/<form> nem atributos
 * on* (allowlist, não denylist) — a restrição abaixo é ADICIONAL, não
 * uma correção de um schema permissivo.
 */
const ALLOWED_TAGS = [
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "p",
  "ul",
  "ol",
  "li",
  "a",
  "img",
  "code",
  "pre",
  "blockquote",
  "table",
  "thead",
  "tbody",
  "tfoot",
  "tr",
  "th",
  "td",
  "hr",
  "strong",
  "em",
  "del",
  "br",
  "span", // usado pelo rehype-highlight para tokens de sintaxe
];

const sanitizeSchema: SanitizeSchema = {
  ...defaultSchema,
  tagNames: ALLOWED_TAGS,
  attributes: {
    ...defaultSchema.attributes,
    img: ["src", "alt", "title", "longDesc"],
    a: ["href", "title"],
    code: [["className", /^language-./], ["className", /^hljs.*/]],
    span: [["className", /^hljs.*/]], // tokens de syntax highlight
  },
  /*
   * protocols é validado por NOME de propriedade (não por combinação
   * tag+atributo) — data: em `src` vale para qualquer tag com atributo
   * `src` na allowlist de tagNames acima. Como `img` é a única tag
   * permitida com `src` (picture/source foram excluídas de propósito),
   * isso restringe data: a img.src na prática. `href` continua restrito
   * a http/https/mailto — data: nunca é aceito ali, o que stripDataUriFromLinks()
   * abaixo reforça como defesa em profundidade.
   */
  protocols: {
    ...defaultSchema.protocols,
    href: ["http", "https", "mailto"],
    src: ["http", "https", "data"],
  },
};

/*
 * Defesa em profundidade: mesmo que uma mudança futura no schema acima
 * (ex: alguém adiciona "source" de volta a ALLOWED_TAGS sem notar a
 * implicação de protocols.src) introduza um vetor data: em atributo que
 * não seja img.src, este transform garante que href="data:..." nunca
 * sobrevive especificamente em links — que é o vetor de risco mais
 * comum (link disfarçado abrindo HTML/JS embutido).
 */
function stripDataUriFromLinks() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (node.tagName === "a" && typeof node.properties.href === "string") {
        if (node.properties.href.startsWith("data:")) {
          delete node.properties.href;
        }
      }
    });
  };
}

/*
 * Links externos recebem rel="noopener noreferrer nofollow" e
 * target="_blank" — ver prompt original §4.7. "Externo" aqui significa
 * qualquer link http(s) (o painel não gera links internos em markdown
 * renderizado; âncoras de heading não existem neste schema restrito).
 */
function externalLinkAttributes() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (node.tagName === "a" && typeof node.properties.href === "string") {
        node.properties.rel = ["noopener", "noreferrer", "nofollow"];
        node.properties.target = "_blank";
      }
    });
  };
}

export interface RenderMarkdownResult {
  html: string;
}

/**
 * Pipeline completo: markdown → HTML sanitizado e pronto para
 * dangerouslySetInnerHTML. NUNCA chame dangerouslySetInnerHTML com
 * qualquer string que não tenha passado por esta função — ver
 * src/components/markdown/MarkdownView.tsx, o único lugar autorizado a
 * usá-la.
 */
export async function renderMarkdown(source: string): Promise<RenderMarkdownResult> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSanitize, sanitizeSchema)
    .use(stripDataUriFromLinks)
    .use(externalLinkAttributes)
    .use(rehypeHighlight)
    .use(rehypeStringify)
    .process(source);

  return { html: String(file) };
}
