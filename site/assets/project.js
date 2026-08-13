(()=>{var a={"contas-exe":{number:"01",category:"PRODUCT / SECURITY",name:"Contas.exe",title:"Seguran\xE7a que tamb\xE9m \xE9 clareza.",description:"Um cofre de credenciais para equipes organizarem acessos compartilhados com seguran\xE7a, contexto e uma interface f\xE1cil de entender.",status:"Produto em evolu\xE7\xE3o",stack:["TypeScript","Security","Desktop"],github:"https://github.com/AndreGustavoms/Contas.exe"},"doktor-system-design":{number:"02",category:"FOUNDATION / SYSTEMS",name:"Doktor System Design",title:"Come\xE7ar com dire\xE7\xE3o.",description:"Uma base de arquitetura, documenta\xE7\xE3o e qualidade para projetos que precisam crescer sem perder coer\xEAncia.",status:"Sistema em constru\xE7\xE3o",stack:["Architecture","Docs","Quality"],github:"https://github.com/AndreGustavoms/Doktor-SystemDesign"},"meu-ecoo":{number:"03",category:"EXPERIENCE / IDENTITY",name:"MeuEcoo",title:"Uma presen\xE7a que continua reverberando.",description:"Identidade, narrativa e presen\xE7a em uma experi\xEAncia digital autoral constru\xEDda para transformar express\xE3o em conex\xE3o.",status:"Experi\xEAncia autoral",stack:["TypeScript","Web","Interface"],github:"https://github.com/AndreGustavoms/MeuEcooBETA"},"prisma-test":{number:"04",category:"APPLIED AI / LEARNING",name:"PrismaTest",title:"Estudar conecta.",description:"Uma plataforma de estudos com intelig\xEAncia artificial para organizar conhecimento e aproximar cada pessoa do seu contexto.",status:"Pesquisa aplicada",stack:["Python","AI","Education"],github:"https://github.com/AndreGustavoms/PrismaTest"}},e=Object.keys(a),n=new URLSearchParams(location.search).get("project")||"contas-exe",s=Object.hasOwn(a,n)?n:"contas-exe",t=a[s],l=document.querySelector("#project-content"),r=e.indexOf(s),d=a[e[(r-1+e.length)%e.length]],m=a[e[(r+1)%e.length]],i=s.replace(/[^a-z0-9]+/gi,"-");document.body.classList.add(`project-${i}`);document.title=`${t.name} \u2014 DoktorDev`;document.querySelector('meta[name="description"]')?.setAttribute("content",t.description);l.innerHTML=`
  <div class="project-kicker"><span>${t.number}</span><small>${t.category}</small></div>
  <div class="project-grid">
    <div>
      <h1>${t.name}</h1>
      <p class="project-title">${t.title}</p>
    </div>
    <div class="project-summary">
      <p>${t.description}</p>
      <div class="project-actions">
        <a class="project-button" href="${t.github}" target="_blank" rel="noreferrer">Abrir no GitHub \u2197</a>
        <button class="project-button project-share" type="button">Compartilhar \u2197</button>
      </div>
    </div>
  </div>
  <div class="project-visual project-visual-${i}" aria-hidden="true">
    <img src="assets/doktordev-mark.svg" alt="">
    <div class="project-orbit orbit-a"></div><div class="project-orbit orbit-b"></div>
    <div class="project-visual-label">${t.category}</div>
    <span>${t.number} / DOKTORDEV</span>
  </div>
  <div class="project-details">
    <div><small>STATUS</small><strong>${t.status}</strong></div>
    <div><small>STACK</small><strong>${t.stack.join(" \xB7 ")}</strong></div>
    <div><small>ORIGEM</small><strong>DoktorDev lab</strong></div>
  </div>
  <nav class="project-pagination" aria-label="Navega\xE7\xE3o entre projetos">
    <a href="projeto.html?project=${e[(r-1+e.length)%e.length]}"><small>ANTERIOR</small><strong>\u2190 ${d.name}</strong></a>
    <a href="projeto.html?project=${e[(r+1)%e.length]}"><small>PR\xD3XIMO</small><strong>${m.name} \u2192</strong></a>
  </nav>
`;var o=document.querySelector(".project-share");o?.addEventListener("click",async()=>{let c={title:`${t.name} \u2014 DoktorDev`,text:t.title,url:location.href};try{navigator.share?await navigator.share(c):await navigator.clipboard.writeText(location.href),o.textContent=navigator.share?"Compartilhado \u2713":"Link copiado \u2713"}catch{o.textContent="Compartilhar \u2197"}setTimeout(()=>{o.textContent="Compartilhar \u2197"},2200)});})();
