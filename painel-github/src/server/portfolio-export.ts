import "server-only";
import { existsSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { getPortfolioConfig, listPortfolioItems } from "./portfolio";
import { listRepos } from "./github/repos";
import { logAction } from "./activity-log";
import { logError } from "./log";
import type { RepoDTO } from "./github/dto";

/*
 * Exportação estática do portfólio — prompt original §7.8: "HTML, CSS e
 * JS puros, sem nenhuma chamada de API em runtime, sem nenhum token
 * embutido. Os dados são congelados no momento da exportação." Este
 * módulo é o único lugar do painel que escreve fora de data/ — a saída
 * em out/portfolio/ é, por definição, um artefato que sai do controle do
 * painel (o usuário publica esse diretório em qualquer host estático).
 *
 * Regra dura: NENHUM valor que passe por aqui pode ser o token do
 * GitHub, o hash de sessão, ou qualquer campo do vault. Só usamos
 * getRepo() (que já passa pelo DTO allowlist de src/server/github/dto.ts)
 * e os campos que o próprio usuário digitou no editor do portfólio
 * (headline/bio/socials/customTitle/customBlurb). scripts/check-bundle-secrets.ts
 * varre out/portfolio/ depois do build como defesa em profundidade — ver
 * docs/SECURITY.md, ameaça A1.
 */

const OUT_DIR = join(process.cwd(), "out", "portfolio");

export interface PortfolioExportResult {
  outDir: string;
  itemCount: number;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("pt-BR", { year: "numeric", month: "short" });
}

interface ExportItem {
  repo: RepoDTO;
  title: string;
  blurb: string;
}

function renderSocials(socials: { platform: string; url: string }[]): string {
  if (socials.length === 0) return "";
  const links = socials
    .map(
      (s) =>
        `<a class="social" href="${escapeHtml(s.url)}" rel="noopener noreferrer nofollow" target="_blank">${escapeHtml(s.platform)}</a>`,
    )
    .join("\n      ");
  return `<nav class="socials">\n      ${links}\n    </nav>`;
}

function renderCard(item: ExportItem): string {
  const { repo, title, blurb } = item;
  const language = repo.language
    ? `<span class="pill">${escapeHtml(repo.language)}</span>`
    : "";
  const topics = repo.topics
    .slice(0, 6)
    .map((t) => `<span class="topic">${escapeHtml(t)}</span>`)
    .join("");

  return `<article class="card">
      <header class="card-head">
        <h2><a href="${escapeHtml(repo.htmlUrl)}" rel="noopener noreferrer nofollow" target="_blank">${escapeHtml(title)}</a></h2>
        ${language}
      </header>
      <p class="blurb">${escapeHtml(blurb)}</p>
      ${topics ? `<div class="topics">${topics}</div>` : ""}
      <footer class="card-foot">
        <span>★ ${repo.stars}</span>
        <span>${escapeHtml(formatDate(repo.pushedAt))}</span>
      </footer>
    </article>`;
}

const STYLE = `
:root {
  --ink-900: #0A1220;
  --ink-800: #101B2D;
  --ink-700: #1A2942;
  --ink-600: #26385A;
  --chalk: #E6EDF6;
  --chalk-dim: #8FA3BF;
  --blueprint: #4CC9F0;
  --amber: #F2A65A;
  --jade: #57D9A3;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  background: var(--ink-900);
  color: var(--chalk);
  font-family: "Public Sans", "Segoe UI", sans-serif;
  font-size: 14px;
  line-height: 1.6;
}
main { max-width: 960px; margin: 0 auto; padding: 48px 24px 96px; }
header.hero { margin-bottom: 48px; }
h1 { font-size: 32px; font-weight: 700; margin: 0 0 8px; letter-spacing: -0.01em; }
.bio { color: var(--chalk-dim); max-width: 620px; white-space: pre-wrap; }
.socials { display: flex; gap: 16px; margin-top: 16px; flex-wrap: wrap; }
.social {
  color: var(--blueprint);
  text-decoration: none;
  font-family: monospace;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  border: 1px solid var(--ink-600);
  border-radius: 4px;
  padding: 6px 10px;
}
.social:hover { border-color: var(--blueprint); }
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}
.card {
  border: 1px solid var(--ink-700);
  background: var(--ink-800);
  border-radius: 4px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.card-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.card-head h2 { font-size: 16px; margin: 0; }
.card-head a { color: var(--chalk); text-decoration: none; }
.card-head a:hover { color: var(--blueprint); }
.pill {
  font-family: monospace;
  font-size: 11px;
  color: var(--chalk-dim);
  border: 1px solid var(--ink-600);
  border-radius: 4px;
  padding: 2px 6px;
  white-space: nowrap;
}
.blurb { color: var(--chalk-dim); margin: 0; flex-grow: 1; }
.topics { display: flex; flex-wrap: wrap; gap: 6px; }
.topic {
  font-family: monospace;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--blueprint);
  background: rgba(76, 201, 240, 0.08);
  border-radius: 4px;
  padding: 2px 6px;
}
.card-foot {
  display: flex;
  justify-content: space-between;
  font-family: monospace;
  font-size: 11px;
  color: var(--chalk-dim);
  border-top: 1px solid var(--ink-700);
  padding-top: 10px;
}
footer.site-foot {
  max-width: 960px;
  margin: 48px auto 0;
  padding: 24px;
  color: var(--chalk-dim);
  font-family: monospace;
  font-size: 11px;
  text-align: center;
}
`.trim();

function renderPage(config: { headline: string; bio: string; socials: { platform: string; url: string }[] }, items: ExportItem[]): string {
  const cards = items.map(renderCard).join("\n    ");
  const generatedAt = new Date().toISOString().slice(0, 10);

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(config.headline)}</title>
<style>${STYLE}</style>
</head>
<body>
<main>
  <header class="hero">
    <h1>${escapeHtml(config.headline)}</h1>
    ${config.bio ? `<p class="bio">${escapeHtml(config.bio)}</p>` : ""}
    ${renderSocials(config.socials)}
  </header>
  <section class="grid">
    ${cards || '<p class="bio">Nenhum repositório selecionado ainda.</p>'}
  </section>
</main>
<footer class="site-foot">Gerado em ${generatedAt} — site estático, sem chamadas de rede em runtime.</footer>
</body>
</html>`;
}

/**
 * Congela a seleção atual do portfólio em out/portfolio/index.html.
 *
 * portfolioItems.repoId (schema) guarda só o ID numérico do GitHub, sem
 * owner/name — resolvemos isso puxando listRepos() (mesma listagem
 * cacheada da Fase 2, até 100 repos por página) e casando por ID em
 * memória, em vez de guardar um segundo índice redundante no banco. Para
 * o volume de repositórios pessoais a que este painel se destina (ver
 * prompt original §1, "não é um SaaS"), isso é uma chamada a mais, bem
 * dentro do orçamento de rate limit — não N chamadas por item.
 *
 * O resultado nunca inclui o token: RepoDTO é, por construção
 * (src/server/github/dto.ts), uma allowlist de campos públicos.
 */
export async function exportPortfolio(): Promise<PortfolioExportResult> {
  const config = getPortfolioConfig();
  const dbItems = listPortfolioItems().filter((item) => item.visible);

  const { repos: allRepos } = await listRepos({ page: 1, perPage: 100 });
  const byId = new Map(allRepos.map((repo) => [repo.id, repo]));

  const items: ExportItem[] = [];
  for (const dbItem of dbItems) {
    const repo = byId.get(dbItem.repoId);
    if (!repo) {
      logError("portfolio_export_item_not_found", { repoId: dbItem.repoId });
      continue;
    }
    items.push({
      repo,
      title: dbItem.customTitle?.trim() || repo.name,
      blurb: dbItem.customBlurb?.trim() || repo.description || "",
    });
  }

  if (existsSync(OUT_DIR)) {
    rmSync(OUT_DIR, { recursive: true, force: true });
  }
  mkdirSync(OUT_DIR, { recursive: true });

  const html = renderPage(config, items);
  writeFileSync(join(OUT_DIR, "index.html"), html, "utf-8");

  logAction({
    action: "portfolio.export",
    target: "out/portfolio",
    payload: { itemCount: items.length },
    result: "success",
  });

  return { outDir: OUT_DIR, itemCount: items.length };
}
