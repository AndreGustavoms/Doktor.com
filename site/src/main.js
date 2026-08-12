import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(ScrollTrigger, SplitText);

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const root = document.documentElement;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function buildMotionLayer() {
  const hero = $(".hero");
  const title = $(".hero h1");
  title?.classList.add("hero-title");
  hero?.insertAdjacentHTML("beforeend", '<div class="hero-ghost" aria-hidden="true">DOKTOR</div>');

  const projectsLink = $('.nav a[href="#projetos"]');
  if (projectsLink && !$('.nav a[href="#processo"]')) {
    projectsLink.insertAdjacentHTML("beforebegin", '<a href="#processo">Processo</a>');
  }

  const about = $("#sobre");
  about?.insertAdjacentHTML("afterend", `
    <section id="processo" class="motion-story">
      <div class="story-pin">
        <div class="story-shell container">
          <div class="story-head">
            <div class="kicker">02 / protocolo vivo</div>
            <div class="story-counter"><span id="story-current">01</span> / 03</div>
          </div>
          <h2 class="story-heading">Da ideia crua<br>ao <em>sistema vivo.</em></h2>
          <div class="story-spectrum" aria-hidden="true"></div>
          <div class="story-panels">
            <article class="story-panel" data-status="capturando sinal">
              <span class="story-number">01</span>
              <div class="story-copy"><small>SINAL / ENTENDER</small><h3>Encontrar o que realmente importa.</h3><p>Antes da interface, isolamos o problema, o contexto e a decisão que o produto precisa facilitar.</p></div>
              <div class="story-visual" aria-hidden="true"><i class="story-ring"></i><i class="story-cross"></i><i class="story-core"></i></div>
            </article>
            <article class="story-panel" data-status="organizando estrutura">
              <span class="story-number">02</span>
              <div class="story-copy"><small>ESTRUTURA / PROJETAR</small><h3>Dar forma ao invisível.</h3><p>Arquitetura, hierarquia e estados viram um sistema legível, modular e preparado para crescer.</p></div>
              <div class="story-visual" aria-hidden="true"><i class="story-ring"></i><i class="story-cross"></i><i class="story-core"></i></div>
            </article>
            <article class="story-panel" data-status="produto em movimento">
              <span class="story-number">03</span>
              <div class="story-copy"><small>PRODUTO / ENTREGAR</small><h3>Fazer funcionar no mundo real.</h3><p>O detalhe visual, o código e a documentação convergem em uma experiência clara, rápida e viva.</p></div>
              <div class="story-visual" aria-hidden="true"><i class="story-ring"></i><i class="story-cross"></i><i class="story-core"></i></div>
            </article>
          </div>
          <div class="story-footer"><span>scroll to build</span><div class="story-progress-track"><i class="story-progress-fill"></i></div><output class="story-status">capturando sinal</output></div>
        </div>
      </div>
    </section>`);

  const projectGrid = $(".projects");
  if (projectGrid && !projectGrid.parentElement.classList.contains("projects-stage")) {
    const stage = document.createElement("div");
    stage.className = "projects-stage";
    projectGrid.parentNode.insertBefore(stage, projectGrid);
    stage.append(projectGrid);
    stage.insertAdjacentHTML("beforebegin", '<div class="project-rail-hint" aria-hidden="true">scroll controla o trilho</div>');
  }

  const projectKicker = $("#projetos .kicker");
  const principlesKicker = $("#principios .kicker");
  const contactKicker = $("#contato .kicker");
  if (projectKicker) projectKicker.textContent = "03 / campo de teste";
  if (principlesKicker) principlesKicker.textContent = "04 / princípios";
  if (contactKicker) contactKicker.textContent = "05 / conexão";

  document.body.insertAdjacentHTML("beforeend", `
    <div class="scene-flash" aria-hidden="true"></div>
    <div class="velocity-hud" aria-hidden="true"><span>velocity</span><output>0000</output><span>px/s</span></div>`);
}

function runIntro() {
  const skipIntro = new URLSearchParams(window.location.search).has("skipIntro");
  if (reducedMotion || skipIntro) return Promise.resolve();

  document.body.insertAdjacentHTML("beforeend", `
    <div class="intro-sequence" aria-hidden="true">
      <div class="intro-scan"></div>
      <p class="intro-word"><span>DOK</span><em><span>TOR</span></em></p>
      <div class="intro-meta"><i></i><span>system boot / 2026</span></div>
    </div>`);

  const intro = $(".intro-sequence");
  document.body.style.overflow = "hidden";

  return new Promise((resolve) => {
    gsap.timeline({
      defaults: { ease: "power4.out" },
      onComplete: () => {
        intro.remove();
        document.body.style.removeProperty("overflow");
        resolve();
      },
    })
      .set(".intro-word span", { yPercent: 140, rotate: 8 })
      .set(".intro-word", { scale: 0.28, rotation: -5, filter: "blur(18px)" })
      .set(".intro-meta", { autoAlpha: 0, x: 24 })
      .fromTo(".intro-scan", { x: -20 }, { x: window.innerWidth + 40, duration: 0.9, ease: "power2.inOut" })
      .to(".intro-word", { scale: 1, rotation: 0, filter: "blur(0px)", duration: 1.05 }, 0.08)
      .to(".intro-word span", { yPercent: 0, rotate: 0, duration: 0.95, stagger: 0.08 }, 0.18)
      .to(".intro-meta", { autoAlpha: 1, x: 0, duration: 0.55 }, 0.55)
      .to(".intro-word", { scale: 6.5, letterSpacing: "0.08em", filter: "blur(18px)", autoAlpha: 0, duration: 0.92, ease: "power4.in" }, 1.18)
      .to(".intro-sequence", { clipPath: "inset(50% 0 50% 0)", duration: 0.82, ease: "power4.inOut" }, 1.48);
  });
}

function initCanvasField() {
  const canvas = $("#constellation");
  const context = canvas?.getContext("2d");
  if (!context) return;

  let nodes = [];
  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.min(54, Math.max(24, Math.floor(innerWidth / 26)));
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * innerWidth,
      y: Math.random() * innerHeight,
      vx: (Math.random() - 0.5) * 0.14,
      vy: (Math.random() - 0.5) * 0.14,
      size: Math.random() * 1.6 + 0.45,
    }));
  };

  const render = () => {
    context.clearRect(-1, -1, innerWidth + 2, innerHeight + 2);
    nodes.forEach((node) => {
      if (!reducedMotion) {
        node.x += node.vx;
        node.y += node.vy;
        if (node.x < -20 || node.x > innerWidth + 20) node.vx *= -1;
        if (node.y < -20 || node.y > innerHeight + 20) node.vy *= -1;
      }
      const pulse = (Math.sin(node.x * 0.01 + node.y * 0.008 + scrollY * 0.002) + 1) * 0.5;
      node.renderX = node.x;
      node.renderY = node.y;
      context.beginPath();
      context.arc(node.renderX, node.renderY, node.size + pulse * 0.85, 0, Math.PI * 2);
      context.fillStyle = `rgba(56,220,255,${0.14 + pulse * 0.28})`;
      context.fill();
    });

    for (let index = 0; index < nodes.length; index += 1) {
      for (let sibling = index + 1; sibling < nodes.length; sibling += 1) {
        const a = nodes[index];
        const b = nodes[sibling];
        const distance = Math.hypot(a.renderX - b.renderX, a.renderY - b.renderY);
        if (distance >= 125) continue;
        context.beginPath();
        context.moveTo(a.renderX, a.renderY);
        context.lineTo(b.renderX, b.renderY);
        context.strokeStyle = `rgba(76,125,255,${(1 - distance / 125) * 0.22})`;
        context.lineWidth = 0.6;
        context.stroke();
      }
    }
    if (!reducedMotion) requestAnimationFrame(render);
  };

  window.addEventListener("resize", resize);
  resize();
  render();
}

function initInterface() {
  const menu = $(".menu");
  const nav = $(".nav");
  menu?.addEventListener("click", () => nav?.classList.toggle("open"));
  $$(".nav a").forEach((link) => link.addEventListener("click", () => nav?.classList.remove("open")));

  $$('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const target = $(link.getAttribute("href"));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
      history.replaceState(null, "", link.getAttribute("href"));
    });
  });

  const input = $("#project-search");
  const buttons = $$("[data-filter]");
  const cards = $$(".project");
  const output = $("#telemetry-output");

  const updateProjects = () => {
    const query = (input?.value || "").toLocaleLowerCase("pt-BR").trim();
    const active = $(".filter.selected")?.dataset.filter || "all";
    cards.forEach((card) => {
      const haystack = `${card.dataset.search || ""} ${card.textContent}`.toLocaleLowerCase("pt-BR");
      const visible = (!query || haystack.includes(query)) && (active === "all" || card.dataset.type === active);
      card.classList.toggle("hidden", !visible);
    });
    const count = cards.filter((card) => !card.classList.contains("hidden")).length;
    if (output) output.textContent = `${String(count).padStart(2, "0")} módulos encontrados // trilho sincronizado`;
    gsap.delayedCall(0.08, () => ScrollTrigger.refresh());
  };

  input?.addEventListener("input", updateProjects);
  buttons.forEach((button) => button.addEventListener("click", () => {
    buttons.forEach((item) => item.classList.remove("selected"));
    button.classList.add("selected");
    updateProjects();
  }));
  updateProjects();

}

function initHero() {
  const hero = $(".hero");
  const title = $(".hero-title");
  if (!hero || !title) return;

  const split = SplitText.create(title, {
    type: "lines,words",
    mask: "lines",
    linesClass: "split-line",
    wordsClass: "split-word",
    autoSplit: true,
  });

  gsap.timeline({ defaults: { ease: "power4.out" } })
    .from(".hero .kicker", { autoAlpha: 0, x: -24, duration: 0.65 })
    .from(split.words, { yPercent: 150, scale: 2.2, rotateX: -70, filter: "blur(12px)", autoAlpha: 0, duration: 1.18, stagger: 0.05 }, 0.08)
    .from(".hero-lede", { autoAlpha: 0, y: 60, scale: 0.82, filter: "blur(8px)", duration: 0.82 }, 0.45)
    .from(".hero .actions a", { autoAlpha: 0, y: 22, duration: 0.58, stagger: 0.08 }, 0.6)
    .from(".hero-meta span", { autoAlpha: 0, y: 12, duration: 0.45, stagger: 0.06 }, 0.74)
    .from(".core-stage", { autoAlpha: 0, scale: 3.4, rotation: -35, filter: "blur(20px)", duration: 1.35 }, 0.12)
    .from(".core-node, .core-readout, .core-label, .core-signal", { autoAlpha: 0, scale: 0.4, duration: 0.55, stagger: 0.08 }, 0.58)
    .from(".hero-scroll", { autoAlpha: 0, y: -10, duration: 0.45 }, 0.9);

  gsap.to(".core-node", { rotation: 360, duration: 18, repeat: -1, ease: "none", stagger: 1.8 });
  gsap.to(".core-image", { y: -9, duration: 2.4, repeat: -1, yoyo: true, ease: "sine.inOut" });

  gsap.timeline({
    scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: 0.65 },
  })
    .to(".hero-copy", { y: -180, scale: 0.58, autoAlpha: 0, filter: "blur(14px)", ease: "none" }, 0)
    .to(".core-stage", { y: 80, rotation: 38, scale: 4.6, autoAlpha: 0, filter: "blur(18px)", ease: "none" }, 0)
    .to(".hero-ghost", { xPercent: -30, scale: 3.6, autoAlpha: 0, filter: "blur(10px)", ease: "none" }, 0)
    .to(".hero-scroll", { autoAlpha: 0, y: 18, ease: "none" }, 0);
}

function initReveals() {
  $$(".section-title, #contato h2").forEach((title) => {
    const split = SplitText.create(title, {
      type: "lines,words",
      mask: "lines",
      linesClass: "split-line",
      wordsClass: "split-word",
      autoSplit: true,
    });
    gsap.from(split.words, {
      yPercent: 165,
      scale: 2.35,
      autoAlpha: 0,
      rotateX: -65,
      filter: "blur(14px)",
      stagger: 0.045,
      duration: 1.05,
      ease: "expo.out",
      scrollTrigger: { trigger: title, start: "top 84%", once: true },
    });

    gsap.fromTo(title,
      { scale: 1.28, transformOrigin: "left center" },
      { scale: 1, ease: "none", scrollTrigger: { trigger: title, start: "top bottom", end: "top 42%", scrub: 0.7 } },
    );
  });

  $$(".about-copy, .module, .principle, .contact-copy, .command-bar, .project-tools").forEach((item, index) => {
    gsap.from(item, {
      y: 90,
      scale: 0.68,
      rotationX: 18,
      autoAlpha: 0,
      filter: "blur(10px)",
      duration: 0.95,
      delay: (index % 4) * 0.04,
      ease: "power3.out",
      scrollTrigger: { trigger: item, start: "top 88%", once: true },
    });
  });
}

function initStory() {
  const story = $("#processo");
  const pin = $(".story-pin");
  const panels = $$(".story-panel");
  const counter = $("#story-current");
  const status = $(".story-status");
  if (!story || !pin || panels.length === 0) return;

  const headingSplit = SplitText.create(".story-heading", {
    type: "lines,words",
    mask: "lines",
    linesClass: "split-line",
    wordsClass: "split-word",
  });

  const media = gsap.matchMedia();
  media.add("(min-width: 621px)", () => {
    gsap.set(panels, { autoAlpha: 0, scale: 0.24, rotation: -9, filter: "blur(24px)", clipPath: "inset(12% 12% 12% 12%)" });
    gsap.set(panels[0], { autoAlpha: 1, scale: 1, rotation: 0, filter: "blur(0px)", clipPath: "inset(0% 0% 0% 0%)" });

    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: story,
        start: "top top",
        end: "+=390%",
        pin,
        scrub: 1,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const active = Math.min(panels.length - 1, Math.floor(self.progress * panels.length));
          if (counter) counter.textContent = String(active + 1).padStart(2, "0");
          if (status) status.textContent = panels[active].dataset.status;
        },
      },
    });

    timeline
      .from(headingSplit.words, { yPercent: 170, scale: 2.2, rotateX: -70, filter: "blur(14px)", autoAlpha: 0, duration: 0.7, stagger: 0.04 }, 0)
      .from(".story-head", { autoAlpha: 0, y: -18, duration: 0.4 }, 0)
      .to(".story-progress-fill", { scaleX: 1, ease: "none", duration: 3.5 }, 0)
      .to(".story-spectrum", { rotation: 420, scale: 2.2, xPercent: -18, ease: "none", duration: 3.5 }, 0)
      .to(".story-panel:nth-child(1) .story-visual", { rotation: 520, scale: 2.4, duration: 1.05, ease: "none" }, 0)
      .to(panels[0], { autoAlpha: 0, scale: 3.6, rotation: 8, filter: "blur(24px)", clipPath: "inset(18% 18% 18% 18%)", duration: 0.42 }, 0.78)
      .fromTo(panels[1], { autoAlpha: 0, scale: 0.2, rotation: -12, filter: "blur(26px)", clipPath: "inset(20% 20% 20% 20%)" }, { autoAlpha: 1, scale: 1, rotation: 0, filter: "blur(0px)", clipPath: "inset(0% 0% 0% 0%)", duration: 0.48 }, 1.02)
      .to(".story-panel:nth-child(2) .story-visual", { rotation: -620, scale: 2.6, duration: 1.05, ease: "none" }, 1.12)
      .to(panels[1], { autoAlpha: 0, scale: 3.6, rotation: -8, filter: "blur(24px)", clipPath: "inset(18% 18% 18% 18%)", duration: 0.42 }, 1.78)
      .fromTo(panels[2], { autoAlpha: 0, scale: 0.2, rotation: 12, filter: "blur(26px)", clipPath: "inset(20% 20% 20% 20%)" }, { autoAlpha: 1, scale: 1, rotation: 0, filter: "blur(0px)", clipPath: "inset(0% 0% 0% 0%)", duration: 0.48 }, 2.02)
      .to(".story-panel:nth-child(3) .story-visual", { rotation: 720, scale: 2.8, duration: 1.3, ease: "none" }, 2.12)
      .to(".story-core", { scale: 3.2, boxShadow: "0 0 120px currentColor", stagger: 0.72, duration: 0.38, yoyo: true, repeat: 1 }, 0.3)
      .to(".story-heading", { scale: 1.65, y: -55, autoAlpha: 0.08, filter: "blur(7px)", transformOrigin: "left top", duration: 2.6, ease: "none" }, 0.7);

    return () => {
      timeline.scrollTrigger?.kill();
      timeline.kill();
    };
  });

  media.add("(max-width: 620px)", () => {
    gsap.set(panels, { clearProps: "all" });
    panels.forEach((panel) => {
      gsap.from(panel, {
        y: 45,
        autoAlpha: 0,
        duration: 0.75,
        ease: "power3.out",
        scrollTrigger: { trigger: panel, start: "top 86%", once: true },
      });
    });
  });
}

function initProjectRail() {
  const stage = $(".projects-stage");
  const rail = $(".projects");
  if (!stage || !rail) return;

  const media = gsap.matchMedia();
  media.add("(min-width: 901px)", () => {
    const distance = () => Math.max(0, rail.scrollWidth - stage.clientWidth);
    const cards = $$(".project", rail);
    const updateFocus = (progress) => {
      const viewportCenter = stage.clientWidth * 0.5;
      const travel = distance() * progress;
      cards.forEach((card) => {
        if (card.classList.contains("hidden")) return;
        const center = card.offsetLeft - travel + card.offsetWidth * 0.5;
        const delta = (center - viewportCenter) / Math.max(stage.clientWidth * 0.52, 1);
        const focus = gsap.utils.clamp(0, 1, 1 - Math.abs(delta));
        gsap.set(card, {
          scale: 0.72 + focus * 0.34,
          rotationY: delta * -24,
          z: focus * 110,
          autoAlpha: 0.34 + focus * 0.66,
          filter: `saturate(${0.55 + focus * 0.8}) brightness(${0.62 + focus * 0.48}) blur(${(1 - focus) * 2.4}px)`,
          transformOrigin: "center center",
          force3D: true,
        });
      });
    };
    const tween = gsap.to(rail, {
      x: () => -distance(),
      ease: "none",
      scrollTrigger: {
        trigger: stage,
        start: "top 16%",
        end: () => `+=${distance() + innerWidth * 0.42}`,
        pin: true,
        scrub: 1,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => updateFocus(self.progress),
        onRefresh: (self) => updateFocus(self.progress),
      },
    });

    gsap.from($$(".project", rail), {
      y: 50,
      autoAlpha: 0,
      stagger: 0.08,
      duration: 0.65,
      ease: "power3.out",
      scrollTrigger: { trigger: stage, start: "top 78%", once: true },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
      gsap.set(rail, { clearProps: "transform" });
      gsap.set(cards, { clearProps: "transform,opacity,visibility,filter" });
    };
  });

  media.add("(max-width: 900px)", () => {
    $$(".project", rail).forEach((card, index) => {
      gsap.from(card, {
        x: index % 2 ? 100 : -100,
        scale: 0.58,
        rotation: index % 2 ? 5 : -5,
        filter: "blur(12px)",
        autoAlpha: 0,
        duration: 1,
        ease: "expo.out",
        scrollTrigger: { trigger: card, start: "top 88%", once: true },
      });
    });
  });
}

function initFinale() {
  const contact = $("#contato");
  if (!contact) return;

  gsap.timeline({
    scrollTrigger: {
      trigger: contact,
      start: "top bottom",
      end: "bottom bottom",
      scrub: 0.8,
    },
  })
    .fromTo("#contato h2", {
      scale: 0.32,
      xPercent: -18,
      y: 180,
      rotation: -6,
      filter: "blur(20px)",
      transformOrigin: "left bottom",
    }, {
      scale: 1.18,
      xPercent: 0,
      y: 0,
      rotation: 0,
      filter: "blur(0px)",
      ease: "none",
    }, 0)
    .fromTo("#contato .contact-copy", {
      xPercent: 45,
      scale: 0.7,
      autoAlpha: 0,
      filter: "blur(12px)",
    }, {
      xPercent: 0,
      scale: 1,
      autoAlpha: 1,
      filter: "blur(0px)",
      ease: "none",
    }, 0.12);
}

function initScrollSystem() {
  const progress = $(".scroll-progress");
  const velocity = $(".velocity-hud output");
  const topbar = $(".topbar");
  const flash = $(".scene-flash");
  let navHidden = false;

  const setScene = (color) => {
    gsap.to(root, { "--scene-accent": color, duration: 0.9, ease: "power2.out", overwrite: true });
    if (!flash) return;
    gsap.fromTo(flash,
      { autoAlpha: 0.3, scale: 0.55, filter: "blur(6px)" },
      { autoAlpha: 0, scale: 1.8, filter: "blur(30px)", duration: 1.15, ease: "expo.out", overwrite: true },
    );
  };

  ScrollTrigger.create({
    start: 0,
    end: "max",
    onUpdate: (self) => {
      gsap.set(progress, { scaleX: self.progress });
      if (velocity) velocity.textContent = String(Math.min(9999, Math.round(Math.abs(self.getVelocity())))).padStart(4, "0");
      const shouldHide = self.direction === 1 && self.scroll() > 180 && Math.abs(self.getVelocity()) > 120;
      if (shouldHide !== navHidden) {
        navHidden = shouldHide;
        gsap.to(topbar, { yPercent: shouldHide ? -105 : 0, duration: 0.38, ease: "power3.out", overwrite: true });
      }
      if (self.direction === -1 && navHidden) {
        navHidden = false;
        gsap.to(topbar, { yPercent: 0, duration: 0.34, ease: "power3.out", overwrite: true });
      }
    },
  });

  const navLinks = $$('.nav a[href^="#"]');
  const sceneColors = ["#38dcff", "#8b5cff", "#ff3cac", "#d7ff3f", "#4c7dff", "#38dcff"];
  $$("main section[id]").forEach((section) => {
    const sceneColor = sceneColors[Math.min(sceneColors.length - 1, $$("main section[id]").indexOf(section))];
    ScrollTrigger.create({
      trigger: section,
      start: "top 45%",
      end: "bottom 45%",
      onToggle: (self) => {
        if (!self.isActive) return;
        setScene(sceneColor);
        navLinks.forEach((link) => link.classList.toggle("active", link.getAttribute("href") === `#${section.id}`));
      },
    });
  });
}

function initMotion() {
  root.classList.add("motion-ready");
  gsap.set(".reveal", { autoAlpha: 1, y: 0 });
  initHero();
  initReveals();
  initStory();
  initProjectRail();
  initFinale();
  initScrollSystem();
  ScrollTrigger.refresh();
}

async function init() {
  buildMotionLayer();
  initCanvasField();
  initInterface();

  if (reducedMotion) {
    root.classList.add("motion-reduced");
    gsap.set(".reveal", { clearProps: "all" });
    return;
  }

  await runIntro();
  await document.fonts.ready;
  initMotion();
  window.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });
}

init();
