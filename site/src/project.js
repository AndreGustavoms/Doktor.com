// Renderiza a pagina de detalhe do projeto. O catalogo e a resolucao do slug
// vivem em `projects-catalog.js`, que nao depende de DOM e por isso e testavel.
import { projects, resolverSlug, vizinhos } from "./projects-catalog.js";

const slug = resolverSlug(new URLSearchParams(location.search).get("project"));
const project = projects[slug];
const { anterior, proximo } = vizinhos(slug);
const content = document.querySelector("#project-content");
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
    <a href="projeto.html?project=${anterior.slug}"><small>ANTERIOR</small><strong>← ${anterior.project.name}</strong></a>
    <a href="projeto.html?project=${proximo.slug}"><small>PRÓXIMO</small><strong>${proximo.project.name} →</strong></a>
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
