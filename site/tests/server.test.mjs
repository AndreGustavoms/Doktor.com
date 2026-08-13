// Testes do servidor de desenvolvimento.
//
// O alvo principal e a protecao contra path traversal: e a unica logica do
// projeto com consequencia de seguranca, e a regua de qualidade exige teste
// automatizado para esse tipo de codigo.
//
// Os testes sao de caixa-preta: sobem `server.mjs` como processo separado numa
// porta livre e fazem requisicoes reais. Nada no servidor precisou ser alterado
// para viabilizar o teste.

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const testDir = dirname(fileURLToPath(import.meta.url));
const siteDir = resolve(testDir, "..");
const serverPath = resolve(siteDir, "server.mjs");

// O servidor imprime a porta que recebeu, nao a que o SO atribuiu, entao
// PORT=0 nao serve: descobrimos uma porta livre aqui e a passamos explicita.
function obterPortaLivre() {
  return new Promise((resolvePorta, rejeitar) => {
    const sonda = createServer();
    sonda.on("error", rejeitar);
    sonda.listen(0, "127.0.0.1", () => {
      const { port } = sonda.address();
      sonda.close(() => resolvePorta(port));
    });
  });
}

let processo;
let baseUrl;

before(async () => {
  const porta = await obterPortaLivre();
  processo = spawn(process.execPath, [serverPath], {
    env: { ...process.env, PORT: String(porta) },
    stdio: ["ignore", "pipe", "pipe"],
  });

  await new Promise((pronto, rejeitar) => {
    const limite = setTimeout(() => rejeitar(new Error("servidor nao subiu a tempo")), 10000);
    processo.stdout.on("data", (chunk) => {
      if (String(chunk).includes(`:${porta}`)) {
        clearTimeout(limite);
        pronto();
      }
    });
    processo.on("error", rejeitar);
  });

  baseUrl = `http://localhost:${porta}`;
});

after(() => {
  processo?.kill();
});

test("serve a pagina inicial na raiz", async () => {
  const resposta = await fetch(`${baseUrl}/`);
  assert.equal(resposta.status, 200);
  assert.match(resposta.headers.get("content-type"), /text\/html/);
  assert.match(await resposta.text(), /<html/i);
});

test("serve asset publico com o content-type correto", async () => {
  const resposta = await fetch(`${baseUrl}/assets/motion.css`);
  assert.equal(resposta.status, 200);
  assert.match(resposta.headers.get("content-type"), /text\/css/);
});

test("serve paginas internas e seo publico", async () => {
  const projeto = await fetch(`${baseUrl}/projeto.html?project=contas-exe`);
  assert.equal(projeto.status, 200);
  assert.match(projeto.headers.get("content-type"), /text\/html/);

  const robots = await fetch(`${baseUrl}/robots.txt`);
  assert.equal(robots.status, 200);
  assert.match(robots.headers.get("content-type"), /text\/plain/);

  const sitemap = await fetch(`${baseUrl}/sitemap.xml`);
  assert.equal(sitemap.status, 200);
  assert.match(sitemap.headers.get("content-type"), /application\/xml/);
  assert.match(await sitemap.text(), /sitemap/);
});

test("serve a pagina 404 personalizada", async () => {
  const resposta = await fetch(`${baseUrl}/404.html`);
  assert.equal(resposta.status, 200);
  assert.match(await resposta.text(), /ERROR \/ 404/);
});

test("responde 400 para URL malformada", async () => {
  // %ZZ nao e uma sequencia percent-encoded valida: decodeURIComponent lanca.
  const resposta = await fetch(`${baseUrl}/%ZZ`);
  assert.equal(resposta.status, 400);
});

// Invariante de seguranca: nenhuma tentativa pode servir arquivo de fora de
// site/. Os alvos existem SOMENTE acima da raiz do servidor - se o conteudo
// deles aparecer numa resposta, houve escape.
//
// A afirmacao e sobre o conteudo vazado, nao sobre o status exato, para nao
// travar uma correcao futura (hoje arquivo ausente responde 500, nao 404).
const alvosExternos = [
  { marcador: /IA\.md - Contexto Operacional/, arquivo: "IA.md" },
  { marcador: /\[core\]/, arquivo: ".git/config" },
];

const variacoesDeTravessia = [
  (a) => `/../${a}`,
  (a) => `/../../${a}`,
  (a) => `/%2e%2e%2f${a}`,
  (a) => `/%2e%2e/%2e%2e/${a}`,
  (a) => `/..%2f..%2f${a}`,
  (a) => `/....//${a}`,
  (a) => `/assets/../../${a}`,
  (a) => `/%2e%2e%5c${a}`,
];

for (const { marcador, arquivo } of alvosExternos) {
  for (const montar of variacoesDeTravessia) {
    const caminho = montar(arquivo);
    test(`bloqueia travessia: ${caminho}`, async () => {
      const resposta = await fetch(`${baseUrl}${caminho}`);
      const corpo = await resposta.text();
      assert.doesNotMatch(
        corpo,
        marcador,
        `${caminho} vazou conteudo de ${arquivo}, que esta fora de site/`,
      );
    });
  }
}

test("nao expoe listagem de diretorio", async () => {
  const resposta = await fetch(`${baseUrl}/assets`);
  assert.notEqual(resposta.status, 200);
});
