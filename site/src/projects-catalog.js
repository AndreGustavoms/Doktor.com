// Catalogo dos projetos e a logica de resolucao a partir da URL.
//
// Vive separado de `project.js` porque aquele arquivo toca `document`,
// `location` e `navigator` no topo do modulo e por isso nao e importavel fora
// do navegador. Aqui nao ha nenhuma dependencia de DOM, entao esta logica pode
// ser testada diretamente - ver `tests/projects-catalog.test.mjs`.

export const SLUG_PADRAO = "contas-exe";

export const projects = {
  "contas-exe": {
    number: "01",
    category: "PRODUCT / SECURITY",
    name: "Contas.exe",
    title: "Segurança que também é clareza.",
    description: "Um cofre de credenciais para equipes organizarem acessos compartilhados com segurança, contexto e uma interface fácil de entender.",
    status: "Produto em evolução",
    stack: ["TypeScript", "Security", "Desktop"],
    github: "https://github.com/AndreGustavoms/Contas.exe",
  },
  "doktor-system-design": {
    number: "02",
    category: "FOUNDATION / SYSTEMS",
    name: "Doktor System Design",
    title: "Começar com direção.",
    description: "Uma base de arquitetura, documentação e qualidade para projetos que precisam crescer sem perder coerência.",
    status: "Sistema em construção",
    stack: ["Architecture", "Docs", "Quality"],
    github: "https://github.com/AndreGustavoms/Doktor-SystemDesign",
  },
  "meu-ecoo": {
    number: "03",
    category: "EXPERIENCE / IDENTITY",
    name: "MeuEcoo",
    title: "Uma presença que continua reverberando.",
    description: "Identidade, narrativa e presença em uma experiência digital autoral construída para transformar expressão em conexão.",
    status: "Experiência autoral",
    stack: ["TypeScript", "Web", "Interface"],
    github: "https://github.com/AndreGustavoms/MeuEcooBETA",
  },
  "prisma-test": {
    number: "04",
    category: "APPLIED AI / LEARNING",
    name: "PrismaTest",
    title: "Estudar conecta.",
    description: "Uma plataforma de estudos com inteligência artificial para organizar conhecimento e aproximar cada pessoa do seu contexto.",
    status: "Pesquisa aplicada",
    stack: ["Python", "AI", "Education"],
    github: "https://github.com/AndreGustavoms/PrismaTest",
  },
};

export const projectSlugs = Object.keys(projects);

// Usa Object.hasOwn em vez de `projects[slug]`: chaves herdadas de
// Object.prototype ("constructor", "toString", "valueOf", "__proto__",
// "hasOwnProperty") devolvem valor truthy e passariam por um fallback com `||`,
// entregando um objeto sem os campos do catalogo.
export function resolverSlug(pedido) {
  const candidato = pedido || SLUG_PADRAO;
  return Object.hasOwn(projects, candidato) ? candidato : SLUG_PADRAO;
}

// Navegacao circular entre projetos. Devolve slug e projeto de cada lado para
// que quem renderiza nao precise recalcular indices.
export function vizinhos(slug) {
  const indice = projectSlugs.indexOf(resolverSlug(slug));
  const total = projectSlugs.length;
  const slugAnterior = projectSlugs[(indice - 1 + total) % total];
  const slugProximo = projectSlugs[(indice + 1) % total];
  return {
    anterior: { slug: slugAnterior, project: projects[slugAnterior] },
    proximo: { slug: slugProximo, project: projects[slugProximo] },
  };
}
