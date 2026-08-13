const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

const fallbackRepositories = [
  {
    name: "Doktor.com",
    description: "Landing page e portfólio público do laboratório Doktor.",
    language: "JavaScript",
    stargazers_count: 0,
    html_url: "https://github.com/AndreGustavoms/Doktor.com",
    topics: ["portfolio", "landing-page"],
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
    name: "PrismaTest",
    description: "Plataforma de estudos com inteligência artificial para instituições de ensino.",
    language: "Python",
    stargazers_count: 0,
    html_url: "https://github.com/AndreGustavoms/PrismaTest",
    topics: ["ia", "educação"],
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
    name: "Contas.exe",
    description: "Cofre de credenciais para equipes gerenciarem acessos compartilhados com segurança e clareza.",
    language: "TypeScript",
    stargazers_count: 0,
    html_url: "https://github.com/AndreGustavoms/Contas.exe",
    topics: ["segurança", "produto"],
  },
];

const repositoryDescriptions = Object.fromEntries(
  fallbackRepositories.map((repository) => [repository.name, repository.description]),
);

let repositories = fallbackRepositories;

function initHeader() {
  const header = $(".site-header");
  const menu = $(".menu-button");
  const nav = $(".site-nav");
  let scrollFrame = 0;

  const closeMenu = () => {
    menu?.setAttribute("aria-expanded", "false");
    nav?.classList.remove("is-open");
  };

  const syncHeader = () => {
    scrollFrame = 0;
    header?.classList.toggle("is-scrolled", scrollY > 16);
  };

  syncHeader();
  window.addEventListener("scroll", () => {
    if (scrollFrame) return;
    scrollFrame = requestAnimationFrame(syncHeader);
  }, { passive: true });

  menu?.addEventListener("click", () => {
    const open = menu.getAttribute("aria-expanded") !== "true";
    menu.setAttribute("aria-expanded", String(open));
    nav?.classList.toggle("is-open", open);
  });

  $$("a", nav).forEach((link) => link.addEventListener("click", closeMenu));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });
}

function initSectionState() {
  const sections = $$("main section[id]");
  const links = $$('.site-nav a[href^="#"]');
  const status = $("#system-status");

  const observer = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;

    const id = visible.target.id;
    links.forEach((link) => link.classList.toggle("is-active", link.hash === `#${id}`));
    if (status) status.textContent = visible.target.dataset.sectionStatus || "SYSTEM / READY";
  }, { rootMargin: "-24% 0px -62%", threshold: [0.04, 0.2, 0.45] });

  sections.forEach((section) => observer.observe(section));
}

function initReveals() {
  const items = $$('[data-reveal]');
  if (reducedMotion || !("IntersectionObserver" in window)) {
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

function initSignalCore() {
  const core = $("[data-core]");
  const state = $("[data-core-state]", core);
  if (!core) return;

  let inView = false;
  const sync = () => {
    const running = inView && !document.hidden && !reducedMotion;
    core.classList.toggle("is-running", running);
    if (state) state.textContent = running ? "ACTIVE" : "IDLE";
  };

  const observer = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    sync();
  }, { threshold: 0.08 });

  observer.observe(core);
  document.addEventListener("visibilitychange", sync);
}

function createRepoCard(repo, index) {
  const card = document.createElement("a");
  card.className = "repo-card";
  card.href = repo.html_url;
  card.target = "_blank";
  card.rel = "noreferrer";
  card.setAttribute("aria-label", `Abrir ${repo.name} no GitHub`);

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
  description.textContent = repo.description || "Projeto público do laboratório Doktor.";

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
  initSectionState();
  initReveals();
  initSignalCore();
  initRepositorySearch();
}

init();
