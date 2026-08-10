import "server-only";

/*
 * Guarda o token do GitHub decifrado em memória do processo, entre o
 * unlock e o lock. Nunca escrito em disco decifrado — ver
 * docs/SECURITY.md §4.5 (camada 2) e ameaça A1.
 *
 * Ancorado em globalThis, não em `let` de module scope. Route Handlers
 * (app/api/**\/route.ts) e Server Components de página (app/**\/page.tsx)
 * são compilados pelo Next como entry points/chunks separados — cada um
 * ganha sua PRÓPRIA cópia física deste módulo, com sua própria variável
 * de module scope, mesmo dentro do mesmo processo Node e sem restart.
 * Verificado ao vivo: setUnlockedToken() numa Route Handler não era
 * visto por isUnlocked() chamado de dentro de page.tsx. globalThis é
 * compartilhado entre chunks no mesmo processo V8, o que resolve isso.
 * Ver https://github.com/vercel/next.js/issues/65350.
 */

interface VaultGlobalState {
  decryptedToken: string | null;
}

const GLOBAL_KEY = Symbol.for("painel-github.vault-session-state");

function getState(): VaultGlobalState {
  const g = globalThis as unknown as Record<symbol, VaultGlobalState | undefined>;
  if (!g[GLOBAL_KEY]) {
    g[GLOBAL_KEY] = { decryptedToken: null };
  }
  return g[GLOBAL_KEY];
}

export function setUnlockedToken(token: string): void {
  getState().decryptedToken = token;
}

export function getUnlockedToken(): string | null {
  return getState().decryptedToken;
}

export function isUnlocked(): boolean {
  return getState().decryptedToken !== null;
}

/**
 * Ao bloquear o painel, sobrescreve a variável em memória — não basta
 * setar para null, porque isso só remove a referência; a string original
 * ainda existe na heap até o GC rodar. Reatribuir para uma string vazia
 * não apaga os bytes originais na memória do V8 (strings são imutáveis),
 * então isto é uma mitigação best-effort, não uma garantia criptográfica
 * — documentado assim em vez de prometer mais do que o runtime permite.
 */
export function clearUnlockedToken(): void {
  getState().decryptedToken = null;
}
