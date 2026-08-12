# Guia Biblioteca de Acabamento Premium

Catalogo de acabamentos reutilizaveis para os elementos que aparecem em praticamente todo projeto web: navbar, logo, botao, card, link, icone, scrollbar. Cada item tem a versao sobria e a versao premium, com o CSS pronto para copiar.

Este guia responde a uma pergunta pratica: "o layout ja funciona, mas parece generico - o que adiciono para parecer produto acabado?"

## Quando usar

- produto com marca propria, landing page, catalogo, area de vendas;
- tela de login ou onboarding que precisa causar boa impressao;
- projeto onde a identidade visual e argumento comercial.

## Quando nao usar

- ferramenta operacional densa (painel administrativo, tabela de dados, CRUD interno);
- tela que a pessoa usa oito horas por dia;
- qualquer contexto em que o brilho competir com o dado.

Este guia trata de acabamento em componentes. Para o que vem depois:

- camadas de cena, aurora, meteoro e ambiente de secao heroi: [GUIA-EFEITOS-DE-CENA-E-AMBIENTE.md](GUIA-EFEITOS-DE-CENA-E-AMBIENTE.md);
- linguagem tecnica com boot, glitch, terminal e HUD: [GUIA-INTERFACE-TECNICA-E-GLITCH.md](GUIA-INTERFACE-TECNICA-E-GLITCH.md);
- particulas com Framer Motion e sistema de glow por niveis: [GUIA-PARTICULAS-E-GLOW.md](GUIA-PARTICULAS-E-GLOW.md).

## 1. Os dois modos

O erro comum e aplicar um modo unico a todo projeto. Decida o modo antes de escolher acabamento.

| | Modo operacional | Modo marca |
|---|---|---|
| Objetivo | executar tarefa rapido | convencer, encantar, converter |
| Superficie | clara, neutra | escura, profunda, com gradiente |
| Acento | funcional, um tom | rico, gradiente, metalico |
| Animacao | so em transicao de estado | ambiente, continua, no hover |
| Densidade | alta, muita informacao | respiro, poucos elementos por tela |
| Exemplo | dashboard, painel, CRUD | landing, catalogo, checkout, login |

Os dois modos podem coexistir no mesmo produto: landing em modo marca, area logada em modo operacional. O que nao pode e misturar dentro da mesma tela.

Regra de corte: **se a pessoa vai olhar essa tela por mais de dez minutos seguidos, use modo operacional.**

## 2. Tokens base

Toda a biblioteca depende destes tokens. Declare-os antes de copiar qualquer efeito.

```css
:root{
  /* superficie - modo marca */
  --surface-deep:#0A1628;
  --surface-mid:#142238;
  --surface-raised:#1B3A6B;

  /* acento - troque pela cor da marca */
  --accent:#C9A84C;
  --accent-strong:#E2C47A;
  --accent-deep:#9E7D2E;
  --accent-rgb:201,168,76;

  /* gradientes derivados */
  --grad-surface:linear-gradient(160deg,var(--surface-deep) 0%,var(--surface-mid) 44%,var(--surface-raised) 100%);
  --grad-accent:linear-gradient(135deg,var(--accent) 0%,var(--accent-strong) 100%);

  /* curvas */
  --ease-out:cubic-bezier(0.16,1,0.3,1);
  --ease-spring:cubic-bezier(0.34,1.56,0.64,1);
}
```

Sobre as duas curvas, porque elas fazem quase toda a diferenca:

- `--ease-out` desacelera forte no fim. Use em movimento que precisa parecer controlado: altura, opacidade, deslize.
- `--ease-spring` passa do alvo e volta. Use em hover de elemento clicavel, onde o leve exagero da sensacao fisica.

Transicao linear e o que faz interface parecer amadora. Praticamente nunca use.

## 3. Logo com glow pulsante e giro no hover

O acabamento de maior retorno por linha de CSS. Parada, a logo respira; no hover, gira.

```css
@keyframes glowPulse{
  0%,100%{filter:drop-shadow(0 0 6px rgba(var(--accent-rgb),.6)) drop-shadow(0 0 12px rgba(var(--accent-rgb),.3))}
  50%    {filter:drop-shadow(0 0 14px rgba(var(--accent-rgb),.95)) drop-shadow(0 0 28px rgba(var(--accent-rgb),.6))}
}
@keyframes spinSoft{
  0%  {transform:rotate(0deg) scale(1)}
  50% {transform:rotate(180deg) scale(1.06)}
  100%{transform:rotate(360deg) scale(1)}
}

.logo-icon{
  height:clamp(54px,3.9vw,62px);
  width:auto;
  display:block;
  cursor:pointer;
  transition:height .3s var(--ease-out);
  animation:glowPulse 2s ease-in-out infinite;
}
.logo-icon:hover{
  filter:drop-shadow(0 0 18px rgba(var(--accent-rgb),1)) drop-shadow(0 0 36px rgba(var(--accent-rgb),.8));
  animation:spinSoft 1.6s ease-in-out infinite, glowPulse 2s ease-in-out infinite;
}
```

Tres detalhes que sustentam o efeito:

1. **Dois `drop-shadow` empilhados.** Um proximo e intenso, outro distante e difuso. Um sozinho parece borrao chapado.
2. **`scale(1.06)` na metade da volta.** Sem isso o giro fica mecanico; com isso a logo "respira" enquanto gira.
3. **As duas animacoes juntas no hover.** Nao substitua o pulso pelo giro. Como 1.6s e 2s nao sao multiplos, os ciclos desencontram e a combinacao nunca se repete igual - e isso que parece vivo em vez de looping.

## 4. Texto com brilho metalico

Gradiente maior que o texto, deslizando devagar por baixo do recorte.

```css
@keyframes shimmer{
  0%  {background-position:-200% center}
  100%{background-position:200% center}
}

.text-shimmer{
  background:linear-gradient(90deg,
    var(--accent-deep) 0%,
    var(--accent-strong) 30%,
    var(--accent) 50%,
    var(--accent-strong) 70%,
    var(--accent-deep) 100%);
  background-size:200%;
  -webkit-background-clip:text;
  background-clip:text;
  -webkit-text-fill-color:transparent;
  animation:shimmer 7.5s linear infinite;
}
```

O ciclo longo (7.5s) e proposital: rapido demais vira pisca-pisca. Aqui `linear` e correto - o brilho deve atravessar em velocidade constante.

Restrinja a wordmark, numero de destaque ou titulo curto. Paragrafo com shimmer fica ilegivel.

## 5. Botao com brilho que atravessa

Faixa clara cruzando a superficie no hover, mais elevacao com curva mola.

```css
.btn-accent{
  position:relative;
  overflow:hidden;
  background:var(--grad-accent);
  color:#fff;
  border:none;
  border-radius:10px;
  padding:clamp(14px,1vw,15px) clamp(24px,2.2vw,34px);
  font-weight:500;
  letter-spacing:.04em;
  cursor:pointer;
  transition:transform .25s var(--ease-spring),box-shadow .25s var(--ease-out);
}
.btn-accent::before{
  content:'';
  position:absolute;
  inset:0 auto 0 0;
  width:55%;
  height:100%;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.2),transparent);
  transform:translate3d(-185%,0,0);
  transition:transform .5s var(--ease-out);
  pointer-events:none;
  will-change:transform;
}
.btn-accent:hover{
  transform:translateY(-3px) scale(1.01);
  box-shadow:0 16px 44px rgba(var(--accent-rgb),.58),0 0 44px 10px rgba(var(--accent-rgb),.18);
}
.btn-accent:hover::before{transform:translate3d(275%,0,0)}
.btn-accent:active{transform:translateY(0) scale(.98)}
```

Notas:

- o brilho e `::before` com `translate3d`, nao `background-position` - fica na GPU e nao repinta;
- `overflow:hidden` no pai e o que recorta a faixa;
- a sombra do hover tem duas camadas: uma projetada para baixo (elevacao real) e um halo difuso (brilho);
- `:active` com `scale(.98)` fecha o ciclo tatil. Botao que sobe no hover e nao afunda no clique parece quebrado.

## 6. Link com sublinhado que cresce

```css
.nav-link{
  position:relative;
  padding-bottom:3px;
  text-decoration:none;
  color:#E8F0F7;
  transition:color .2s;
}
.nav-link::after{
  content:'';
  position:absolute;
  left:0;
  bottom:-1px;
  width:100%;
  height:1px;
  background:var(--accent);
  transform:scaleX(0);
  transform-origin:left center;
  transition:transform .3s var(--ease-out);
  will-change:transform;
}
.nav-link:hover{color:#fff}
.nav-link:hover::after{transform:scaleX(1)}
```

`scaleX` com `transform-origin:left` anima na GPU e cresce da esquerda. Animar `width` produz o mesmo desenho com pior desempenho.

## 7. Navbar que reage ao scroll

```css
nav{
  position:fixed;
  top:0;
  width:100%;
  z-index:100;
  transition:background .3s var(--ease-out),box-shadow .3s var(--ease-out),padding .3s var(--ease-out);
}
nav.scrolled{
  background:linear-gradient(90deg,rgba(5,15,34,.62),rgba(12,40,78,.56));
  backdrop-filter:blur(12px);
  box-shadow:0 6px 30px rgba(2,28,53,.4);
}
nav.scrolled .logo-icon{height:clamp(46px,3.1vw,50px)}
```

```js
useEffect(() => {
  const onScroll = () => {
    document.querySelector('nav')?.classList.toggle('scrolled', window.scrollY > 40);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  return () => window.removeEventListener('scroll', onScroll);
}, []);
```

O `{ passive: true }` evita travar a rolagem. O limiar de 40px impede que a navbar pisque com micro-scroll.

## 8. Escala fluida com clamp

Em vez de tres breakpoints por elemento, uma declaracao continua:

```css
font-size:clamp(24px,2vw,30.8px);
padding:clamp(14px,1vw,15px) clamp(24px,2.2vw,34px);
gap:clamp(18px,2vw,33.6px);
```

Le-se: minimo, valor fluido, maximo. Entre os extremos acompanha a viewport.

Use em tipografia, espacamento e altura de elemento de marca. Evite em largura de container - ali `max-width` com `%` continua melhor.

## 9. Scrollbar customizada

Detalhe pequeno que muda a percepcao de acabamento no desktop.

```css
::-webkit-scrollbar{width:14px}
::-webkit-scrollbar-track{
  background:var(--surface-deep);
  border-left:1px solid rgba(var(--accent-rgb),.08);
}
::-webkit-scrollbar-thumb{
  background:linear-gradient(90deg,rgba(255,255,255,.22) 0%,var(--accent-deep) 12%,var(--accent) 50%,var(--accent-deep) 88%);
  border-radius:7px;
}
::-webkit-scrollbar-thumb:hover{background:var(--accent)}
```

O reflexo branco na borda esquerda do thumb e o que da o aspecto de relevo.

Restricoes: e prefixo WebKit, entao Firefox usa `scrollbar-color` e `scrollbar-width` (bem mais limitados). Nunca deixe a barra com menos de 10px - vira problema de usabilidade. E so no modo marca; em ferramenta operacional, mantenha a barra nativa.

## 10. Card com elevacao no hover

```css
.card{
  background:var(--grad-card,linear-gradient(145deg,#fff 0%,#EDF5FC 100%));
  border:1px solid rgba(var(--accent-rgb),.12);
  border-radius:14px;
  padding:clamp(18px,1.6vw,26px);
  transition:transform .3s var(--ease-spring),box-shadow .3s var(--ease-out),border-color .3s;
}
.card:hover{
  transform:translateY(-4px);
  border-color:rgba(var(--accent-rgb),.35);
  box-shadow:0 18px 40px rgba(2,28,53,.18);
}
```

Suba no maximo 4-6px. Card que salta demais parece instavel.

## 11. Acessibilidade e desempenho

Esta secao nao e opcional. Animacao continua e exatamente o que prejudica quem tem sensibilidade a movimento.

```css
@media (prefers-reduced-motion:reduce){
  *,*::before,*::after{
    animation-duration:.01ms !important;
    animation-iteration-count:1 !important;
    transition-duration:.01ms !important;
    scroll-behavior:auto !important;
  }
}
```

Complementos:

- **Desligue ambiente no mobile.** Pulso e shimmer infinitos consomem bateria sem retorno em tela pequena:

```css
@media (max-width:900px){
  .logo-icon,.text-shimmer{animation:none !important}
}
```

- **Foco sempre visivel.** Se remover `outline`, reponha com `:focus-visible`:

```css
.logo:focus-visible{
  outline:none;
  box-shadow:0 0 0 2px rgba(var(--accent-rgb),.8),0 0 14px rgba(var(--accent-rgb),.4);
}
```

- **Anime so `transform`, `opacity` e `filter`.** Animar `width`, `height`, `top` ou `margin` forca recalculo de layout a cada quadro.
- **`will-change` com parcimonia**, so no elemento que anima de fato em resposta a interacao.
- **Contraste vale para texto com gradiente tambem.** Verifique o tom mais claro do gradiente contra o fundo.

## 12. Checklist

- [ ] O modo (operacional ou marca) foi escolhido antes do acabamento.
- [ ] Tokens de acento e superficie estao declarados em `:root`.
- [ ] Nenhuma transicao usa curva linear sem motivo.
- [ ] Elementos clicaveis tem hover **e** `:active`.
- [ ] `:focus-visible` e perceptivel em todo controle.
- [ ] `prefers-reduced-motion` esta tratado.
- [ ] Animacao ambiente esta desligada no mobile.
- [ ] Animacoes usam apenas `transform`, `opacity` ou `filter`.
- [ ] Nenhum paragrafo longo tem shimmer ou gradiente no texto.
- [ ] A tela ainda comunica prioridade e proxima acao com tudo parado.

## 13. Frase de controle

Acabamento premium e o que se nota ao sair, nao ao entrar: a pessoa deve terminar a tarefa com a sensacao de que o produto e bem feito, sem lembrar de nenhum efeito em particular.
