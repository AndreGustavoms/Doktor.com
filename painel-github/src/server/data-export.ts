import "server-only";
import { getDb } from "./db";
import { pinned, tags, repoTags, notes, portfolioConfig, portfolioItems } from "./db/schema";

/**
 * Exporta todos os meus dados locais em JSON — ver prompt original
 * §7.9. Inclui só tabelas de dado pessoal (nunca cache de API, nunca
 * sessões, nunca a tabela auth com o hash da senha). O vault.enc não
 * entra aqui: exportar o token cifrado junto com dados "portáveis" é
 * confuso (o vault só decifra com a senha mestra desta instalação
 * específica) — quem quiser migrar o token faz isso via
 * scripts/rotate-token.ts na instalação nova.
 */
export function exportLocalData() {
  const db = getDb();
  return {
    exportedAt: new Date().toISOString(),
    pinned: db.select().from(pinned).all(),
    tags: db.select().from(tags).all(),
    repoTags: db.select().from(repoTags).all(),
    notes: db.select().from(notes).all(),
    portfolioConfig: db.select().from(portfolioConfig).all(),
    portfolioItems: db.select().from(portfolioItems).all(),
  };
}
