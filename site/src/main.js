const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

const fallbackRepositories = [
  {
    name: "DoktorDev.com",
    description: "Landing page e portfólio público do laboratório DoktorDev.",
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

const projectPages = {
  "Contas.exe": "projeto.html?project=contas-exe",
  "Doktor-SystemDesign": "projeto.html?project=doktor-system-design",
  "MeuEcooBETA": "projeto.html?project=meu-ecoo",
  "PrismaTest": "projeto.html?project=prisma-test",
};

const repositoryDescriptions = Object.fromEntries(
  fallbackRepositories.map((repository) => [repository.name, repository.description]),
);

let repositories = fallbackRepositories;
let activeLanguage = "all";

function initHeader() {
  const header = $(".site-header, .topbar");
  const progress = $("#page-progress");
  const menu = $(".menu-button");
  const nav = $(".site-nav, .nav");
  let frame = 0;

  const closeMenu = () => {
    menu?.setAttribute("aria-expanded", "false");
    nav?.classList.remove("is-open");
    document.body.classList.remove("menu-open");
  };

  const sync = () => {
    frame = 0;
    header?.classList.toggle("is-scrolled", scrollY > 14);
    const scrollable = document.documentElement.scrollHeight - innerHeight;
    const position = scrollable > 0 ? Math.min(scrollY / scrollable, 1) : 0;
    if (progress) progress.style.transform = `scaleX(${position})`;
  };

  sync();
  addEventListener("scroll", () => {
    if (!frame) frame = requestAnimationFrame(sync);
  }, { passive: true });

  menu?.addEventListener("click", () => {
    const open = menu.getAttribute("aria-expanded") !== "true";
    menu.setAttribute("aria-expanded", String(open));
    nav?.classList.toggle("is-open", open);
    document.body.classList.toggle("menu-open", open);
  });

  $$("a", nav).forEach((link) => link.addEventListener("click", closeMenu));
  document.addEventListener("pointerdown", (event) => {
    if (!nav?.classList.contains("is-open")) return;
    if (nav.contains(event.target) || menu?.contains(event.target)) return;
    closeMenu();
  });
  addEventListener("resize", () => {
    if (innerWidth > 900) closeMenu();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });
}

function initSectionNavigation() {
  const sections = $$("main section[id]");
  const links = $$('.site-nav a[href^="#"], .nav a[href^="#"]');

  if (!("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver((entries) => {
    const current = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!current) return;

    links.forEach((link) => {
      link.classList.toggle("is-active", link.hash === `#${current.target.id}`);
    });
  }, { rootMargin: "-22% 0px -66%", threshold: [0.02, 0.2, 0.5] });

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
  }, { rootMargin: "0px 0px -9%", threshold: 0.06 });

  items.forEach((item) => observer.observe(item));
}

function initAmbientMotion() {
  if (reducedMotion) return;

  const canHover = matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (!canHover) return;

  const root = document.documentElement;
  let frame = 0;
  let pointerX = innerWidth / 2;
  let pointerY = innerHeight / 2;

  const syncSpotlight = () => {
    frame = 0;
    root.style.setProperty("--pointer-x", `${pointerX}px`);
    root.style.setProperty("--pointer-y", `${pointerY}px`);
  };

  addEventListener("pointermove", (event) => {
    pointerX = event.clientX;
    pointerY = event.clientY;
    if (!frame) frame = requestAnimationFrame(syncSpotlight);
  }, { passive: true });

  $$(".case-stage").forEach((stage) => {
    const spotlight = document.createElement("span");
    spotlight.className = "stage-spotlight";
    spotlight.setAttribute("aria-hidden", "true");
    stage.append(spotlight);
    stage.addEventListener("pointermove", (event) => {
      const bounds = stage.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - .5;
      const y = (event.clientY - bounds.top) / bounds.height - .5;
      stage.style.setProperty("--tilt-x", `${(y * -3.2).toFixed(2)}deg`);
      stage.style.setProperty("--tilt-y", `${(x * 3.2).toFixed(2)}deg`);
      stage.style.setProperty("--spot-x", `${((x + .5) * 100).toFixed(1)}%`);
      stage.style.setProperty("--spot-y", `${((y + .5) * 100).toFixed(1)}%`);
    });
    stage.addEventListener("pointerleave", () => {
      stage.style.removeProperty("--tilt-x");
      stage.style.removeProperty("--tilt-y");
      stage.style.removeProperty("--spot-x");
      stage.style.removeProperty("--spot-y");
    });
  });
}

function initHeroArt() {
  const art = $("[data-art]");
  if (!art) return;

  let visible = false;
  const sync = () => art.classList.toggle("is-running", visible && !document.hidden && !reducedMotion);
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    sync();
  }, { threshold: 0.08 });

  observer.observe(art);
  document.addEventListener("visibilitychange", sync);

  const loadScene = async () => {
    if (!("WebGLRenderingContext" in window) || navigator.connection?.saveData) return;
    try {
      const modulePath = "./hero3d.js?v=2";
      const { mountHero3D } = await import(modulePath);
      mountHero3D(art);
    } catch {
      art.classList.add("webgl-failed");
    }
  };

  if ("requestIdleCallback" in window) requestIdleCallback(loadScene, { timeout: 1200 });
  else setTimeout(loadScene, 320);
}

function createRepoRow(repository, index) {
  const row = document.createElement("a");
  row.className = "repo-card";
  row.href = projectPages[repository.name] || repository.html_url;
  row.target = "_blank";
  row.rel = "noreferrer";
  row.setAttribute("aria-label", `Abrir página de ${repository.name}`);

  const number = document.createElement("span");
  number.className = "repo-number";
  number.textContent = String(index + 1).padStart(2, "0");

  const title = document.createElement("h3");
  title.textContent = repository.name;

  const description = document.createElement("p");
  description.textContent = repository.description || "Projeto público do laboratório DoktorDev.";

  const meta = document.createElement("span");
  meta.className = "repo-meta";
  const language = repository.language || "Projeto";
  const stars = Number(repository.stargazers_count || 0);
  meta.textContent = `${language} / ${stars} ${stars === 1 ? "star" : "stars"}`;
  if (repository.pushed_at) {
    const updated = new Date(repository.pushed_at).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    meta.title = `Atualizado em ${updated}`;
  }

  const arrow = document.createElement("span");
  arrow.className = "repo-arrow";
  arrow.setAttribute("aria-hidden", "true");
  arrow.textContent = "↗";

  row.append(number, title, description, meta, arrow);
  return row;
}

function renderRepositories(list, query = "") {
  const grid = $("#repo-grid");
  const status = $("#repo-count");
  if (!grid || !status) return;

  const normalized = query.toLocaleLowerCase("pt-BR").trim();
  const filtered = list.filter((repository) => {
    const searchable = [
      repository.name,
      repository.description,
      repository.language,
      ...(repository.topics || []),
    ].filter(Boolean).join(" ").toLocaleLowerCase("pt-BR");
    const matchesQuery = !normalized || searchable.includes(normalized);
    const matchesLanguage = activeLanguage === "all" || repository.language === activeLanguage;
    return matchesQuery && matchesLanguage;
  });

  grid.replaceChildren();
  if (!filtered.length) {
    const empty = document.createElement("p");
    empty.className = "repo-empty";
    empty.textContent = "Nenhum repositório encontrado para essa busca.";
    grid.append(empty);
  } else {
    filtered.slice(0, 9).forEach((repository, index) => {
      grid.append(createRepoRow(repository, index));
    });
  }

  const shown = Math.min(filtered.length, 9);
  status.textContent = `${String(shown).padStart(2, "0")} ${shown === 1 ? "repositório público" : "repositórios públicos"}`;
}

async function loadRepositories() {
  const status = $(".repo-status");
  renderRepositories(repositories);

  try {
    const response = await fetch("https://api.github.com/users/AndreGustavoms/repos?per_page=100&sort=updated", {
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!response.ok) throw new Error(`GitHub respondeu ${response.status}`);

    const data = await response.json();
    const publicRepositories = data
      .filter((repository) => !repository.fork && !repository.archived)
      .map((repository) => ({
        ...repository,
        description: repositoryDescriptions[repository.name] || repository.description,
      }))
      .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at));

    if (publicRepositories.length) repositories = publicRepositories;
    sessionStorage.setItem("doktordev-repositories", JSON.stringify({
      timestamp: Date.now(),
      data: publicRepositories,
    }));
  } catch {
    try {
      const cached = JSON.parse(sessionStorage.getItem("doktordev-repositories") || "null");
      repositories = cached?.data?.length ? cached.data : fallbackRepositories;
    } catch {
      repositories = fallbackRepositories;
    }
  }

  renderRepositories(repositories, $("#repo-search")?.value || "");
  status?.setAttribute("aria-busy", "false");
}

function initRepositorySearch() {
  const input = $("#repo-search");
  input?.addEventListener("input", () => renderRepositories(repositories, input.value));
  $$(".repo-filter").forEach((filter) => {
    filter.addEventListener("click", () => {
      activeLanguage = filter.dataset.language || "all";
      $$(".repo-filter").forEach((item) => item.classList.toggle("is-active", item === filter));
      renderRepositories(repositories, input?.value || "");
    });
  });
  loadRepositories();
}

function init() {
  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();
  initHeader();
  initSectionNavigation();
  initReveals();
  initAmbientMotion();
  initHeroArt();
  initRepositorySearch();
}

init();
