/*
 * Mock de "server-only" para o Vitest. O pacote real sempre lança (ver
 * node_modules/server-only/index.js) — ele depende do bundler do Next
 * resolver esse import para um módulo vazio no lado servidor, e o
 * Vitest não faz essa substituição. Como todo teste unitário aqui já
 * roda em ambiente Node puro (nunca no browser), a garantia que
 * "server-only" oferece é redundante nesse contexto — é seguro no-op.
 */
export {};
