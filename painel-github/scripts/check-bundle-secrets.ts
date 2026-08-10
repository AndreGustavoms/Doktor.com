/*
 * A1 — Vazamento para o bundle do navegador.
 * Roda depois de `next build` (ver package.json → "build"). Se qualquer
 * padrão de token do GitHub aparecer em código destinado ao browser, o
 * build falha. Isso é a defesa que pega o erro que passou despercebido
 * por code review — prefixo NEXT_PUBLIC_ esquecido, objeto do Octokit
 * serializado numa prop, etc.
 *
 * Varre .next/static/ (bundle do painel) e out/portfolio/ (exportação
 * estática do portfólio, se existir) — os dois caminhos onde código
 * chega ao browser sem passar por um Route Handler.
 */
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

const TOKEN_PATTERNS: { name: string; regex: RegExp }[] = [
  { name: "github-fine-grained-pat", regex: /github_pat_[A-Za-z0-9_]{22,}/g },
  { name: "github-classic-pat", regex: /ghp_[A-Za-z0-9]{36}/g },
  { name: "github-oauth-token", regex: /gho_[A-Za-z0-9]{36}/g },
  { name: "github-app-server-token", regex: /ghs_[A-Za-z0-9]{36}/g },
  { name: "github-app-user-token", regex: /ghu_[A-Za-z0-9]{36}/g },
];

const SCAN_EXTENSIONS = new Set([".js", ".mjs", ".cjs", ".html", ".json", ".txt", ".map"]);

interface Finding {
  file: string;
  pattern: string;
  match: string;
}

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walk(full, out);
    } else {
      out.push(full);
    }
  }
  return out;
}

function scanFile(path: string): Finding[] {
  const ext = path.slice(path.lastIndexOf("."));
  if (!SCAN_EXTENSIONS.has(ext)) return [];

  const content = readFileSync(path, "utf-8");
  const findings: Finding[] = [];

  for (const { name, regex } of TOKEN_PATTERNS) {
    const matches = content.match(regex);
    if (matches) {
      for (const match of matches) {
        // Redigimos o próprio achado no output — não faz sentido imprimir
        // o token real na tela que reporta o vazamento do token.
        findings.push({ file: path, pattern: name, match: `${match.slice(0, 8)}…[REDACTED]` });
      }
    }
  }

  return findings;
}

function scanDirectory(dir: string, label: string): Finding[] {
  if (!existsSync(dir)) {
    console.log(`[check-bundle-secrets] ${label}: diretório não existe, pulando (${dir})`);
    return [];
  }

  const files = walk(dir);
  const findings = files.flatMap(scanFile);
  console.log(`[check-bundle-secrets] ${label}: ${files.length} arquivos verificados`);
  return findings;
}

function main() {
  const allFindings = [
    ...scanDirectory(join(process.cwd(), ".next", "static"), ".next/static"),
    ...scanDirectory(join(process.cwd(), "out", "portfolio"), "out/portfolio"),
  ];

  if (allFindings.length > 0) {
    console.error("\n[check-bundle-secrets] FALHA — segredo encontrado no bundle do navegador:\n");
    for (const f of allFindings) {
      console.error(`  ${f.file}\n    padrão: ${f.pattern}  valor: ${f.match}`);
    }
    console.error(
      "\nUm token neste bundle é um token público — qualquer um com devtools o lê. " +
        "Revogue o token em github.com/settings/tokens IMEDIATAMENTE, então corrija a " +
        "fonte do vazamento antes de tentar o build de novo. Ver docs/SECURITY.md — ameaça A1.",
    );
    process.exit(1);
  }

  console.log("[check-bundle-secrets] OK — nenhum padrão de token encontrado no bundle.");
}

main();
