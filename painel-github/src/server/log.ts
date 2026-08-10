import "server-only";
import { appendFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

/*
 * Único módulo autorizado a usar console (ver eslint.config.mjs,
 * ignores da regra no-console). Ver docs/SECURITY.md, ameaça A7 —
 * console.log de objeto de request/response do Octokit vaza o header
 * Authorization; este módulo é o único ponto por onde texto chega ao
 * terminal/arquivo, então é o único lugar que precisa reproduzir a
 * defesa de redação.
 */

const TOKEN_PATTERNS = [
  /ghp_[A-Za-z0-9]{36}/g,
  /github_pat_[A-Za-z0-9_]{22,}/g,
  /gho_[A-Za-z0-9]{36}/g,
  /ghs_[A-Za-z0-9]{36}/g,
  /ghu_[A-Za-z0-9]{36}/g,
];

/*
 * Ancorado em globalThis, não em `let` de module scope — mesmo motivo
 * documentado em src/server/vault/session-state.ts: Route Handlers e
 * Server Components de página são chunks de build separados, cada um
 * com sua própria cópia do módulo. Sem isto, redação do token registrado
 * funcionaria nas rotas de API mas silenciosamente não funcionaria em
 * qualquer log chamado de dentro de um Server Component — falha de
 * segurança sutil e específica da ameaça A7.
 */
const REDACT_GLOBAL_KEY = Symbol.for("painel-github.log-redact-state");

function getRedactState(): { currentTokenValue: string | null } {
  const g = globalThis as unknown as Record<symbol, { currentTokenValue: string | null } | undefined>;
  if (!g[REDACT_GLOBAL_KEY]) {
    g[REDACT_GLOBAL_KEY] = { currentTokenValue: null };
  }
  return g[REDACT_GLOBAL_KEY];
}

/**
 * Registra o valor literal do token atual para redação — chamado uma
 * vez após unlock bem-sucedido (ver src/server/vault/session-state.ts).
 * Sem isto, um token que não bate com os padrões de regex acima (ex: um
 * token de formato futuro do GitHub) ainda vazaria em log.
 */
export function registerSecretForRedaction(secret: string): void {
  getRedactState().currentTokenValue = secret;
}

export function clearRegisteredSecret(): void {
  getRedactState().currentTokenValue = null;
}

export function redact(input: string): string {
  let output = input;
  for (const pattern of TOKEN_PATTERNS) {
    output = output.replace(pattern, "[REDACTED]");
  }
  const { currentTokenValue } = getRedactState();
  if (currentTokenValue) {
    output = output.split(currentTokenValue).join("[REDACTED]");
  }
  return output;
}

const LOG_PATH = join(process.cwd(), "data", "logs", "app.log");

function writeToFile(line: string) {
  const dir = dirname(LOG_PATH);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  appendFileSync(LOG_PATH, line + "\n");
}

interface LogFields {
  [key: string]: string | number | boolean | null | undefined;
}

function formatLine(level: string, message: string, fields?: LogFields): string {
  const entry = {
    time: new Date().toISOString(),
    level,
    message: redact(message),
    ...(fields ? Object.fromEntries(
        Object.entries(fields).map(([k, v]) => [k, typeof v === "string" ? redact(v) : v]),
      ) : {}),
  };
  return JSON.stringify(entry);
}

export function logInfo(message: string, fields?: LogFields): void {
  const line = formatLine("info", message, fields);
  console.log(line);
  writeToFile(line);
}

export function logWarn(message: string, fields?: LogFields): void {
  const line = formatLine("warn", message, fields);
  console.warn(line);
  writeToFile(line);
}

export function logError(message: string, fields?: LogFields): void {
  const line = formatLine("error", message, fields);
  console.error(line);
  writeToFile(line);
}
