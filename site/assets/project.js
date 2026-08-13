(()=>{var a={"contas-exe":{number:"01",category:"PRODUCT / SECURITY",name:"Contas.exe",title:"Seguran\xE7a que tamb\xE9m \xE9 clareza.",description:"Um cofre de credenciais para equipes organizarem acessos compartilhados com seguran\xE7a, contexto e uma interface f\xE1cil de entender.",status:"Produto em evolu\xE7\xE3o",stack:["TypeScript","Security","Desktop"],github:"https://github.com/AndreGustavoms/Contas.exe"},"doktor-system-design":{number:"02",category:"FOUNDATION / SYSTEMS",name:"Doktor System Design",title:"Come\xE7ar com dire\xE7\xE3o.",description:"Uma base de arquitetura, documenta\xE7\xE3o e qualidade para projetos que precisam crescer sem perder coer\xEAncia.",status:"Sistema em constru\xE7\xE3o",stack:["Architecture","Docs","Quality"],github:"https://github.com/AndreGustavoms/Doktor-SystemDesign"},"meu-ecoo":{number:"03",category:"EXPERIENCE / IDENTITY",name:"MeuEcoo",title:"Uma presen\xE7a que continua reverberando.",description:"Identidade, narrativa e presen\xE7a em uma experi\xEAncia digital autoral constru\xEDda para transformar express\xE3o em conex\xE3o.",status:"Experi\xEAncia autoral",stack:["TypeScript","Web","Interface"],github:"https://github.com/AndreGustavoms/MeuEcooBETA"},"prisma-test":{number:"04",category:"APPLIED AI / LEARNING",name:"PrismaTest",title:"Estudar conecta.",description:"Uma plataforma de estudos com intelig\xEAncia artificial para organizar conhecimento e aproximar cada pessoa do seu contexto.",status:"Pesquisa aplicada",stack:["Python","AI","Education"],github:"https://github.com/AndreGustavoms/PrismaTest"}},s=new URLSearchParams(location.search).get("project")||"contas-exe",e=a[s]||a["contas-exe"],c=document.querySelector("#project-content"),t=Object.keys(a),o=t.indexOf(s)>=0?t.indexOf(s):0,i=a[t[(o-1+t.length)%t.length]],n=a[t[(o+1)%t.length]],r=s.replace(/[^a-z0-9]+/gi,"-");document.body.classList.add(`project-${r}`);document.title=`${e.name} \u2014 DoktorDev`;document.querySelector('meta[name="description"]')?.setAttribute("content",e.description);c.innerHTML=`
  <div class="project-kicker"><span>${e.number}</span><small>${e.category}</small></div>
  <div class="project-grid">
    <div>
      <h1>${e.name}</h1>
      <p class="project-title">${e.title}</p>
    </div>
    <div class="project-summary">
      <p>${e.description}</p>
      <a class="project-button" href="${e.github}" target="_blank" rel="noreferrer">Abrir no GitHub \u2197</a>
    </div>
  </div>
  <div class="project-visual project-visual-${r}" aria-hidden="true">
    <img src="assets/doktordev-mark.svg" alt="">
    <div class="project-orbit orbit-a"></div><div class="project-orbit orbit-b"></div>
    <div class="project-visual-label">${e.category}</div>
    <span>${e.number} / DOKTORDEV</span>
  </div>
  <div class="project-details">
    <div><small>STATUS</small><strong>${e.status}</strong></div>
    <div><small>STACK</small><strong>${e.stack.join(" \xB7 ")}</strong></div>
    <div><small>ORIGEM</small><strong>DoktorDev lab</strong></div>
  </div>
  <nav class="project-pagination" aria-label="Navega\xE7\xE3o entre projetos">
    <a href="projeto.html?project=${t[(o-1+t.length)%t.length]}"><small>ANTERIOR</small><strong>\u2190 ${i.name}</strong></a>
    <a href="projeto.html?project=${t[(o+1)%t.length]}"><small>PR\xD3XIMO</small><strong>${n.name} \u2192</strong></a>
  </nav>
`;})();
