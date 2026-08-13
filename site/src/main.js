const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const fallbackRepositories = [
  {
    name: "Contas.exe",
    description: "Cofre de credenciais para equipes gerenciarem acessos compartilhados com segurança e clareza.",
    language: "TypeScript",
    stargazers_count: 0,
    html_url: "https://github.com/AndreGustavoms/Contas.exe",
    topics: ["segurança", "produto"],
  },
  {
    name: "Doktor-SystemDesign",
    description: "Base de arquitetura, documentação e qualidade usada nos projetos do laboratório.",
    language: "Markdown",
    stargazers_count: 0,
    html_url: "https://github.com/AndreGustavoms/Doktor-SystemDesign",
    topics: ["arquitetura", "documentação"],
  },
  {
    name: "MeuEcooBETA",
    description: "Experiência digital autoral sobre identidade, narrativa e presença na web.",
    language: "TypeScript",
    stargazers_count: 0,
    html_url: "https://github.com/AndreGustavoms/MeuEcooBETA",
    topics: ["web", "interface"],
  },
  {
    name: "PrismaTest",
    description: "Experimentos com inteligência artificial aplicada a estudos e produtividade.",
    language: "Python",
    stargazers_count: 0,
    html_url: "https://github.com/AndreGustavoms/PrismaTest",
    topics: ["ia", "estudos"],
  },
  {
    name: "Doktor.com",
    description: "Site público e portfólio do laboratório independente Doktor.",
    language: "JavaScript",
    stargazers_count: 0,
    html_url: "https://github.com/AndreGustavoms/Doktor.com",
    topics: ["portfolio", "landing-page"],
  },
  {
    name: "Discord-Us",
    description: "Automação para estruturar comunidades e reduzir trabalho repetitivo no Discord.",
    language: "JavaScript",
    stargazers_count: 0,
    html_url: "https://github.com/AndreGustavoms",
    topics: ["automação", "comunidade"],
  },
];

let repositories = fallbackRepositories;

const repositoryDescriptions = {
  "Doktor.com": "Landing page e portfólio público do laboratório Doktor.",
  "Doktor-SystemDesign": "Base de arquitetura, documentação e qualidade usada nos projetos do laboratório.",
  PrismaTest: "Plataforma de estudos com inteligência artificial para instituições de ensino.",
  MeuEcooBETA: "Experiência digital autoral sobre identidade, narrativa e presença na web.",
  "Contas.exe": "Cofre de credenciais para equipes gerenciarem acessos compartilhados com segurança e clareza.",
};

function initHeader() {
  const header = $(".site-header");
  const menu = $(".menu-button");
  const nav = $(".site-nav");

  const syncHeader = () => header?.classList.toggle("is-scrolled", scrollY > 16);
  syncHeader();
  window.addEventListener("scroll", syncHeader, { passive: true });

  menu?.addEventListener("click", () => {
    const open = menu.getAttribute("aria-expanded") !== "true";
    menu.setAttribute("aria-expanded", String(open));
    nav?.classList.toggle("is-open", open);
  });

  $$("a", nav).forEach((link) => link.addEventListener("click", () => {
    menu?.setAttribute("aria-expanded", "false");
    nav?.classList.remove("is-open");
  }));

  const sections = $$("main section[id]");
  const links = $$('.site-nav a[href^="#"]');
  const activeObserver = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    links.forEach((link) => link.classList.toggle("is-active", link.hash === `#${visible.target.id}`));
  }, { rootMargin: "-25% 0px -60%", threshold: [0.05, 0.25, 0.5] });

  sections.forEach((section) => activeObserver.observe(section));
}

function initReveals() {
  const items = $$('[data-reveal]');
  if (matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
    items.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { rootMargin: "0px 0px -8%", threshold: 0.08 });

  items.forEach((item) => observer.observe(item));
}

function createRepoCard(repo, index) {
  const card = document.createElement("a");
  card.className = "repo-card";
  card.href = repo.html_url;
  card.target = "_blank";
  card.rel = "noreferrer";

  const head = document.createElement("div");
  head.className = "repo-card-head";
  const number = document.createElement("span");
  number.className = "repo-number";
  number.textContent = String(index + 1).padStart(2, "0");
  const arrow = document.createElement("span");
  arrow.className = "repo-arrow";
  arrow.setAttribute("aria-hidden", "true");
  arrow.textContent = "↗";
  head.append(number, arrow);

  const title = document.createElement("h3");
  title.textContent = repo.name;
  const description = document.createElement("p");
  description.textContent = repo.description || "Projeto aberto do laboratório Doktor.";

  const foot = document.createElement("div");
  foot.className = "repo-card-foot";
  const language = document.createElement("span");
  language.className = "language";
  language.textContent = repo.language || "Projeto";
  const stars = document.createElement("span");
  stars.textContent = `☆ ${repo.stargazers_count || 0}`;
  foot.append(language, stars);

  card.append(head, title, description, foot);
  return card;
}

function renderRepositories(list, query = "") {
  const grid = $("#repo-grid");
  const status = $("#repo-count");
  if (!grid || !status) return;

  const normalized = query.toLocaleLowerCase("pt-BR").trim();
  const filtered = list.filter((repo) => {
    const content = [repo.name, repo.description, repo.language, ...(repo.topics || [])]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase("pt-BR");
    return !normalized || content.includes(normalized);
  });

  grid.replaceChildren();
  if (filtered.length === 0) {
    const empty = document.createElement("p");
    empty.className = "repo-empty";
    empty.textContent = "Nenhum repositório encontrado para essa busca.";
    grid.append(empty);
  } else {
    filtered.slice(0, 9).forEach((repo, index) => grid.append(createRepoCard(repo, index)));
  }

  const shown = Math.min(filtered.length, 9);
  status.textContent = `${String(shown).padStart(2, "0")} ${shown === 1 ? "repositório exibido" : "repositórios exibidos"}`;
}

async function loadRepositories() {
  renderRepositories(repositories);
  try {
    const response = await fetch("https://api.github.com/users/AndreGustavoms/repos?per_page=100&sort=updated", {
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!response.ok) throw new Error(`GitHub respondeu ${response.status}`);
    const data = await response.json();
    const publicRepos = data
      .filter((repo) => !repo.fork && !repo.archived)
      .map((repo) => ({ ...repo, description: repositoryDescriptions[repo.name] || repo.description }))
      .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at));
    if (publicRepos.length) repositories = publicRepos;
  } catch {
    repositories = fallbackRepositories;
  }
  renderRepositories(repositories, $("#repo-search")?.value || "");
}

function initRepositorySearch() {
  const input = $("#repo-search");
  input?.addEventListener("input", () => renderRepositories(repositories, input.value));
  loadRepositories();
}

function init() {
  $("#year").textContent = new Date().getFullYear();
  initHeader();
  initReveals();
  initRepositorySearch();
}

init();
