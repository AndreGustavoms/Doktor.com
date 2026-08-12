import "server-only";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { vaultExists } from "./vault/store";

/*
 * Auditoria de segurança sob demanda — prompt original §7.9 ("executar a
 * auditoria de segurança sob demanda, com resultado por item") e §7.1
 * passo 4 (checklist ao vivo do wizard de setup). Este módulo reusa a
 * mesma lista de checagens em ambos os lugares: aqui, e no wizard.
 *
 * Deliberadamente NÃO inclui `npm audit` nem `gitleaks detect` como
 * checagens ao vivo — os dois disparam um processo filho que pode levar
 * vários segundos (gitleaks varre o working tree inteiro) e essa rota
 * roda dentro do orçamento normal de uma requisição HTTP síncrona da UI.
 * Esses dois continuam cobertos por `npm run check`/`npm run audit`
 * (CLI, sem limite de tempo de request) e pelos hooks do lefthook — ver
 * package.json e docs/SECURITY.md, ameaça A2/A10.
 *
 * As chamadas de fs abaixo levam a anotacao turbopackIgnore porque
 * leem caminhos montados em runtime (process.cwd() + nome). Sem a
 * anotação, a análise estática do Turbopack conclui que o projeto
 * inteiro pode ser lido e passa a incluir todos os arquivos-fonte no
 * output do servidor — inclusive a pasta public. Aqui a leitura é
 * deliberada e local: a auditoria precisa inspecionar .gitignore,
 * lefthook.yml, next.config.ts e o vault no disco de verdade.
 */

export type AuditStatus = "pass" | "fail" | "warn";

export interface AuditItem {
  id: string;
  label: string;
  status: AuditStatus;
  detail: string;
}

function checkLoopbackBind(): AuditItem {
  const host = process.env.HOST;
  const loopbackHosts = new Set(["127.0.0.1", "localhost", "::1"]);
  const ok = !host || loopbackHosts.has(host);
  return {
    id: "loopback-bind",
    label: "Bind em loopback",
    status: ok ? "pass" : "fail",
    detail: ok
      ? `HOST=${host ?? "(padrão 127.0.0.1)"} — o painel só escuta na própria máquina.`
      : `HOST="${host}" não é loopback — next.config.ts deveria ter abortado o boot (ver ameaça A4).`,
  };
}

function checkVaultEncrypted(): AuditItem {
  const exists = vaultExists();
  if (!exists) {
    return {
      id: "vault-encrypted",
      label: "Vault cifrado",
      status: "warn",
      detail: "Nenhum vault encontrado ainda — rode o wizard de setup.",
    };
  }

  try {
    const dataDir = process.env.PAINEL_DATA_DIR ?? join(process.cwd(), "data");
    const raw = readFileSync(/* turbopackIgnore: true */ join(dataDir, "vault.enc"), "utf8");
    const parsed = JSON.parse(raw);
    const looksEncrypted =
      typeof parsed.salt === "string" &&
      typeof parsed.payload?.iv === "string" &&
      typeof parsed.payload?.authTag === "string" &&
      typeof parsed.payload?.ciphertext === "string";

    return {
      id: "vault-encrypted",
      label: "Vault cifrado",
      status: looksEncrypted ? "pass" : "fail",
      detail: looksEncrypted
        ? "data/vault.enc contém salt + IV + authTag + ciphertext — nenhum token em texto plano no arquivo."
        : "data/vault.enc existe mas não tem o formato esperado (salt/IV/authTag/ciphertext).",
    };
  } catch {
    return {
      id: "vault-encrypted",
      label: "Vault cifrado",
      status: "fail",
      detail: "data/vault.enc existe mas não pôde ser lido como JSON válido.",
    };
  }
}

function checkGitignore(): AuditItem {
  const REQUIRED_PATTERNS = [".env", "data/", "*.db", "vault.enc"];
  const path = join(process.cwd(), ".gitignore");

  if (!existsSync(/* turbopackIgnore: true */ path)) {
    return {
      id: "gitignore",
      label: ".gitignore correto",
      status: "fail",
      detail: ".gitignore não encontrado em painel-github/.",
    };
  }

  const content = readFileSync(/* turbopackIgnore: true */ path, "utf8");
  const missing = REQUIRED_PATTERNS.filter((pattern) => !content.includes(pattern));

  return {
    id: "gitignore",
    label: ".gitignore correto",
    status: missing.length === 0 ? "pass" : "fail",
    detail:
      missing.length === 0
        ? "Padrões críticos presentes: .env, data/, *.db, vault.enc."
        : `Padrões faltando: ${missing.join(", ")}.`,
  };
}

function checkGitleaksHooks(): AuditItem {
  const localConfigPath = join(process.cwd(), "lefthook.yml");
  const rootConfigPath = join(process.cwd(), "..", "lefthook.yml");

  const localExists = existsSync(/* turbopackIgnore: true */ localConfigPath);
  const rootExists = existsSync(/* turbopackIgnore: true */ rootConfigPath);

  if (!localExists) {
    return {
      id: "gitleaks-hooks",
      label: "Hooks do gitleaks instalados",
      status: "fail",
      detail: "painel-github/lefthook.yml não encontrado.",
    };
  }

  const content = readFileSync(/* turbopackIgnore: true */ localConfigPath, "utf8");
  const hasGitleaks = content.includes("gitleaks");
  const rootExtends = rootExists && readFileSync(/* turbopackIgnore: true */ rootConfigPath, "utf8").includes("extends");

  return {
    id: "gitleaks-hooks",
    label: "Hooks do gitleaks instalados",
    status: hasGitleaks && rootExtends ? "pass" : "warn",
    detail:
      hasGitleaks && rootExtends
        ? "lefthook.yml (raiz) usa extends para painel-github/lefthook.yml, que roda gitleaks em pre-commit e pre-push."
        : "Configuração de hooks incompleta — verifique se a raiz do repositório Git tem lefthook.yml com extends.",
  };
}

function checkDestructiveFlag(): AuditItem {
  const enabled = process.env.ALLOW_DESTRUCTIVE === "true";
  return {
    id: "destructive-flag",
    label: "Ações destrutivas — flag padrão",
    status: enabled ? "warn" : "pass",
    detail: enabled
      ? "ALLOW_DESTRUCTIVE=true — ações como alternar visibilidade estão habilitadas."
      : "ALLOW_DESTRUCTIVE não está em 'true' — ações destrutivas seguem bloqueadas por padrão.",
  };
}

function checkSecurityHeadersConfigured(): AuditItem {
  const path = join(process.cwd(), "next.config.ts");
  if (!existsSync(/* turbopackIgnore: true */ path)) {
    return {
      id: "security-headers",
      label: "Headers de segurança configurados",
      status: "fail",
      detail: "next.config.ts não encontrado.",
    };
  }

  const content = readFileSync(/* turbopackIgnore: true */ path, "utf8");
  const REQUIRED_HEADERS = [
    "Content-Security-Policy",
    "X-Content-Type-Options",
    "Referrer-Policy",
    "Permissions-Policy",
  ];
  const missing = REQUIRED_HEADERS.filter((header) => !content.includes(header));

  return {
    id: "security-headers",
    label: "Headers de segurança configurados",
    status: missing.length === 0 ? "pass" : "fail",
    detail:
      missing.length === 0
        ? "CSP, X-Content-Type-Options, Referrer-Policy e Permissions-Policy definidos em next.config.ts."
        : `Headers faltando em next.config.ts: ${missing.join(", ")}.`,
  };
}

/**
 * Roda todas as checagens síncronas e devolve o resultado por item — a
 * UI (settings) lista isso como uma checklist ao vivo. Nenhuma checagem
 * aqui faz I/O de rede nem dispara processo filho (ver comentário no
 * topo do arquivo).
 */
export function runSecurityAudit(): AuditItem[] {
  return [
    checkLoopbackBind(),
    checkVaultEncrypted(),
    checkGitignore(),
    checkGitleaksHooks(),
    checkDestructiveFlag(),
    checkSecurityHeadersConfigured(),
  ];
}
