// Testes do catalogo de projetos e da resolucao de slug.
//
// Estes testes existem porque `?project=constructor` (e as demais chaves
// herdadas de Object.prototype) derrubava a pagina: a busca era
// `projects[slug] || padrao`, e chaves herdadas retornam valor truthy, entao o
// fallback nunca disparava e o objeto entregue nao tinha os campos usados na
// renderizacao. O caso esta fixado abaixo.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import {
  projects,
  projectSlugs,
  resolverSlug,
  vizinhos,
  SLUG_PADRAO,
} from "../src/projects-catalog.js";

const siteDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");

test("resolve cada slug conhecido para ele mesmo", () => {
  for (const slug of projectSlugs) {
    assert.equal(resolverSlug(slug), slug);
  }
});

test("cai no padrao para slug desconhecido", () => {
  assert.equal(resolverSlug("zzz-inexistente"), SLUG_PADRAO);
  assert.equal(resolverSlug("../../etc/passwd"), SLUG_PADRAO);
});

test("cai no padrao para entrada vazia ou ausente", () => {
  for (const entrada of [null, undefined, ""]) {
    assert.equal(resolverSlug(entrada), SLUG_PADRAO);
  }
});

// Regressao do bug corrigido: chaves herdadas nao podem escapar do padrao.
for (const herdada of ["constructor", "toString", "valueOf", "__proto__", "hasOwnProperty", "isPrototypeOf"]) {
  test(`cai no padrao para a chave herdada "${herdada}"`, () => {
    assert.equal(resolverSlug(herdada), SLUG_PADRAO);
    const project = projects[resolverSlug(herdada)];
    assert.ok(Array.isArray(project.stack), "o projeto resolvido precisa ter stack utilizavel");
  });
}

test("o slug padrao existe no catalogo", () => {
  assert.ok(Object.hasOwn(projects, SLUG_PADRAO));
});

test("todo projeto tem os campos usados na renderizacao", () => {
  for (const slug of projectSlugs) {
    const project = projects[slug];
    for (const campo of ["number", "category", "name", "title", "description", "status", "github"]) {
      assert.equal(typeof project[campo], "string", `${slug}.${campo} deveria ser string`);
      assert.notEqual(project[campo].trim(), "", `${slug}.${campo} nao pode ser vazio`);
    }
    assert.ok(Array.isArray(project.stack) && project.stack.length > 0, `${slug}.stack deveria ter itens`);
    assert.match(project.github, /^https:\/\/github\.com\//, `${slug}.github deveria ser URL do GitHub`);
  }
});

test("a navegacao entre projetos e circular", () => {
  const primeiro = projectSlugs[0];
  const ultimo = projectSlugs[projectSlugs.length - 1];
  assert.equal(vizinhos(primeiro).anterior.slug, ultimo);
  assert.equal(vizinhos(ultimo).proximo.slug, primeiro);
});

test("a navegacao avanca e volta de forma consistente", () => {
  for (const slug of projectSlugs) {
    const { anterior, proximo } = vizinhos(slug);
    assert.equal(vizinhos(anterior.slug).proximo.slug, slug);
    assert.equal(vizinhos(proximo.slug).anterior.slug, slug);
    assert.equal(anterior.project, projects[anterior.slug]);
    assert.equal(proximo.project, projects[proximo.slug]);
  }
});

test("slug invalido navega como o padrao", () => {
  assert.deepEqual(vizinhos("constructor"), vizinhos(SLUG_PADRAO));
});

// Evita a deriva silenciosa entre o catalogo e o SEO: adicionar um projeto sem
// listar a pagina dele deixaria a rota fora do sitemap.
test("o sitemap lista exatamente os projetos do catalogo", () => {
  const sitemap = readFileSync(resolve(siteDir, "sitemap.xml"), "utf8");
  for (const slug of projectSlugs) {
    assert.match(sitemap, new RegExp(`projeto\\.html\\?project=${slug}\\b`), `sitemap.xml nao lista ${slug}`);
  }
  const listados = [...sitemap.matchAll(/projeto\.html\?project=([a-z0-9-]+)/g)].map((m) => m[1]);
  for (const slug of listados) {
    assert.ok(Object.hasOwn(projects, slug), `sitemap.xml lista ${slug}, que nao existe no catalogo`);
  }
});
