const projects = {
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

const slug = new URLSearchParams(location.search).get("project") || "contas-exe";
const project = projects[slug] || projects["contas-exe"];
const content = document.querySelector("#project-content");
const projectSlugs = Object.keys(projects);
const projectIndex = projectSlugs.indexOf(slug) >= 0 ? projectSlugs.indexOf(slug) : 0;
const previous = projects[projectSlugs[(projectIndex - 1 + projectSlugs.length) % projectSlugs.length]];
const next = projects[projectSlugs[(projectIndex + 1) % projectSlugs.length]];
const projectClass = slug.replace(/[^a-z0-9]+/gi, "-");

document.body.classList.add(`project-${projectClass}`);

document.title = `${project.name} — DoktorDev`;
document.querySelector('meta[name="description"]')?.setAttribute("content", project.description);

content.innerHTML = `
  <div class="project-kicker"><span>${project.number}</span><small>${project.category}</small></div>
  <div class="project-grid">
    <div>
      <h1>${project.name}</h1>
      <p class="project-title">${project.title}</p>
    </div>
    <div class="project-summary">
      <p>${project.description}</p>
      <div class="project-actions">
        <a class="project-button" href="${project.github}" target="_blank" rel="noreferrer">Abrir no GitHub ↗</a>
        <button class="project-button project-share" type="button">Compartilhar ↗</button>
      </div>
    </div>
  </div>
  <div class="project-visual project-visual-${projectClass}" aria-hidden="true">
    <img src="assets/doktordev-mark.svg" alt="">
    <div class="project-orbit orbit-a"></div><div class="project-orbit orbit-b"></div>
    <div class="project-visual-label">${project.category}</div>
    <span>${project.number} / DOKTORDEV</span>
  </div>
  <div class="project-details">
    <div><small>STATUS</small><strong>${project.status}</strong></div>
    <div><small>STACK</small><strong>${project.stack.join(" · ")}</strong></div>
    <div><small>ORIGEM</small><strong>DoktorDev lab</strong></div>
  </div>
  <nav class="project-pagination" aria-label="Navegação entre projetos">
    <a href="projeto.html?project=${projectSlugs[(projectIndex - 1 + projectSlugs.length) % projectSlugs.length]}"><small>ANTERIOR</small><strong>← ${previous.name}</strong></a>
    <a href="projeto.html?project=${projectSlugs[(projectIndex + 1) % projectSlugs.length]}"><small>PRÓXIMO</small><strong>${next.name} →</strong></a>
  </nav>
`;

const shareButton = document.querySelector(".project-share");
shareButton?.addEventListener("click", async () => {
  const shareData = { title: `${project.name} — DoktorDev`, text: project.title, url: location.href };
  try {
    if (navigator.share) await navigator.share(shareData);
    else await navigator.clipboard.writeText(location.href);
    shareButton.textContent = navigator.share ? "Compartilhado ✓" : "Link copiado ✓";
  } catch {
    shareButton.textContent = "Compartilhar ↗";
  }
  setTimeout(() => { shareButton.textContent = "Compartilhar ↗"; }, 2200);
});
