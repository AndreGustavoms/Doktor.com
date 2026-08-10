# Guia Efeitos de Cena e Ambiente

Segundo volume do acabamento visual. Enquanto a [biblioteca de acabamento premium](GUIA-BIBLIOTECA-DE-ACABAMENTO-PREMIUM.md) trata do polimento de componentes que todo site tem, este guia trata de **cena**: camadas de ambiente, eventos raros e composicoes que existem para dar atmosfera a uma secao inteira.

Sao efeitos de campanha. Custam mais caro em atencao, desempenho e manutencao, e por isso a decisao de usar cada um precisa ser deliberada.

## Quando usar

- secao heroi de landing page ou catalogo de produto;
- pagina de lancamento, campanha sazonal ou evento;
- tela de login/onboarding de produto premium;
- fundo de secao que precisa de profundidade sem competir com o texto.

## Quando nao usar

- qualquer tela operacional;
- pagina com muito texto para leitura continua;
- listagem, tabela, formulario longo;
- quando a metrica da pagina for velocidade de carregamento;
- quando o time nao tiver como manter isso depois.

Regra de corte: **no maximo uma cena por pagina.** Duas competem entre si e nenhuma funciona.

## 1. O principio das camadas

Toda cena boa se organiza em profundidade, e cada camada tem uma regra:

| Camada | Papel | Regra |
|---|---|---|
| Fundo | gradiente base, cor da marca | estatico ou movimento quase imperceptivel |
| Ambiente | aurora, nebulosa, brilho difuso | ciclo longo (15s+), opacidade baixa |
| Evento | meteoro, cintilancia, faisca | raro, aparece e some |
| Conteudo | texto, botao, imagem | nunca animado por ambiente |

O erro comum e animar tudo no mesmo ritmo. O que cria a sensacao de espaco e a **diferenca de velocidade** entre camadas.

Toda camada de cena precisa de:

```css
.scene-layer{
  position:absolute;
  inset:0;
  pointer-events:none;   /* nunca captura clique */
  z-index:0;             /* sempre atras do conteudo */
  overflow:hidden;
}
.scene-content{position:relative;z-index:1}
```

`pointer-events:none` nao e opcional. Uma camada decorativa que intercepta clique e um bug de acessibilidade.

## 2. Aurora - fundo vivo

Mancha de cor grande e desfocada que deriva devagar. E o efeito de ambiente com melhor relacao entre impacto e custo.

```css
@keyframes auroraDrift{
  0%,100%{
    opacity:.18;
    filter:blur(38px) saturate(1);
    transform:translate3d(-1.5rem,.4rem,0) rotate(-10deg) scale(.92);
  }
  42%{
    opacity:.34;
    filter:blur(30px) saturate(1.28);
    transform:translate3d(1.1rem,-.8rem,0) rotate(7deg) scale(1.08);
  }
  70%{
    opacity:.24;
    filter:blur(34px) saturate(1.12);
    transform:translate3d(.4rem,.95rem,0) rotate(2deg) scale(1);
  }
}

.aurora{
  position:absolute;
  width:60vw;
  height:40vh;
  border-radius:50%;
  background:radial-gradient(ellipse,rgba(var(--accent-rgb),.5),transparent 70%);
  animation:auroraDrift 18s ease-in-out infinite;
  will-change:transform,opacity,filter;
}
```

Detalhes que fazem funcionar:

- **os quadros nao sao simetricos** (42% e 70%, nao 50%). Ciclo simetrico o olho identifica como loop; assimetrico parece organico;
- **`saturate` acompanha o `blur`**: quando a mancha se concentra, a cor intensifica junto;
- **opacidade sempre baixa** (.18 a .34). Aurora que aparece demais vira mancha suja.

Use duas ou tres auroras com cores e duracoes diferentes (18s, 23s, 31s) e `animation-delay` negativo para nao comecarem juntas. Numeros nao multiplos entre si evitam que o conjunto se repita.

## 3. Cintilancia - ponto que pisca raro

Estrela que acende e apaga, cada uma no seu tempo.

```css
@keyframes twinkle{
  0%,100%{opacity:0;transform:scale(.4)}
  50%    {opacity:.9;transform:scale(1)}
}

.star{
  position:absolute;
  width:2px;
  height:2px;
  border-radius:50%;
  background:#fff;
  animation:twinkle var(--dur,4s) ease-in-out infinite;
  animation-delay:var(--delay,0s);
}
```

```jsx
{Array.from({length: 40}, (_, i) => (
  <span
    key={i}
    className="star"
    style={{
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      '--dur': `${3 + Math.random() * 4}s`,
      '--delay': `${Math.random() * 6}s`,
    }}
  />
))}
```

A variavel CSS por elemento e o que evita o efeito "pisca-pisca de natal": cada ponto tem duracao e atraso proprios.

Limite: 40 pontos em desktop, 15 em mobile. Acima disso o ganho visual para e o custo continua.

## 4. Meteoro - evento raro

Risco de luz que cruza a tela de tempos em tempos. O segredo esta em ficar invisivel na maior parte do ciclo.

```css
@keyframes meteor{
  0%,100%{opacity:0;transform:rotate(-20deg) translate3d(-30vw,0,0) scaleX(.72)}
  8%     {opacity:0}
  13%    {opacity:1}
  22%    {opacity:1;transform:rotate(-20deg) translate3d(82vw,20vh,0) scaleX(1.05)}
  30%    {opacity:0;transform:rotate(-20deg) translate3d(106vw,27vh,0) scaleX(.94)}
  31%    {transform:rotate(-20deg) translate3d(-30vw,0,0) scaleX(.72)}
}

.meteor{
  position:absolute;
  top:10%;
  width:180px;
  height:2px;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.9),transparent);
  animation:meteor 9s linear infinite;
  animation-delay:var(--delay,0s);
}
```

Leia o keyframe com atencao, porque a tecnica se aplica a qualquer evento raro:

- o meteoro so e visivel de **13% a 30%** do ciclo. Em 9 segundos, isso da ~1,5s de aparicao;
- em **31%** ele volta ao ponto inicial **ja invisivel** - o reposicionamento acontece escondido;
- o resto do ciclo e espera.

E assim que se faz algo parecer casual em vez de metronomo. O `scaleX` variando estica o risco na aceleracao e encolhe na chegada, sugerindo velocidade.

Um ou dois meteoros bastam, com `--delay` diferente.

## 5. Sheen - reflexo que atravessa um card

Faixa de luz cruzando a superficie, como reflexo em vidro.

```css
@keyframes cardSheen{
  0%,18%,100%{opacity:0;transform:translate3d(-42%,0,0)}
  34%        {opacity:.58}
  54%        {opacity:.74;transform:translate3d(42%,0,0)}
  68%        {opacity:0;transform:translate3d(58%,0,0)}
}

.card-premium{position:relative;overflow:hidden}
.card-premium::after{
  content:'';
  position:absolute;
  inset:0;
  background:linear-gradient(105deg,transparent 40%,rgba(255,255,255,.35) 50%,transparent 60%);
  animation:cardSheen 7s ease-in-out infinite;
  pointer-events:none;
}
```

Mesma logica do meteoro: visivel em menos de metade do ciclo. O angulo de 105 graus faz o reflexo passar na diagonal, mais natural que na horizontal.

Aplique so no card em destaque - plano recomendado, oferta principal. Uma grade inteira com sheen fica cansativa.

## 6. Rotacao com contra-rotacao

Forma girando com conteudo legivel dentro. Util em selo, badge de destaque, medalha.

```css
@keyframes shapeSpin   {0%{transform:rotate(45deg)}  100%{transform:rotate(405deg)}}
@keyframes labelCounter{0%{transform:rotate(-45deg)} 100%{transform:rotate(-405deg)}}
@keyframes shapePulse{
  0%,100%{box-shadow:0 0 0 0 rgba(var(--accent-rgb),0)}
  50%    {box-shadow:0 0 28px 6px rgba(var(--accent-rgb),.22)}
}

.badge-diamond{
  width:92px;
  height:92px;
  border:2px solid var(--accent);
  display:flex;
  align-items:center;
  justify-content:center;
  transform:rotate(45deg);
  animation:shapeSpin 16s linear infinite,shapePulse 3s ease-in-out infinite;
}
.badge-diamond > *{
  animation:labelCounter 16s linear infinite;
}
```

A ideia: o losango gira 360 graus em 16s (`45deg` a `405deg`, mantendo a inclinacao base) e o conteudo gira **na direcao oposta, na mesma duracao**. O texto permanece na horizontal enquanto a moldura roda.

As duas duracoes precisam ser identicas. Qualquer diferenca e o texto comeca a deslizar.

16s e proposital - devagar o bastante para parecer detalhe, nao chamariz.

## 7. Orbita no hover de CTA

Para o botao principal de uma cena, quando o hover comum e pouco.

```css
@keyframes ctaOrbit{
  0%,100%{background-position:0% 50%;   transform:translate3d(0,0,0) rotate(7deg) scale(1.02)}
  46%    {background-position:100% 50%; transform:translate3d(5%,-3%,0) rotate(16deg) scale(1.14)}
  72%    {                              transform:translate3d(-3%,2%,0) rotate(2deg) scale(1.06)}
}

.cta-scene:hover .cta-ornament{
  animation:ctaOrbit 2.4s ease-in-out infinite;
}
```

Aplique ao **ornamento** (icone, brilho, forma decorativa), nunca ao botao inteiro. Botao que gira e desorientador e prejudica o clique. O ornamento orbitando ao redor de um botao estavel da energia sem atrapalhar.

## 8. Composicao - montando uma cena

Camadas de uma secao heroi completa:

```html
<section class="hero">
  <div class="scene-layer" aria-hidden="true">
    <div class="aurora aurora--1"></div>
    <div class="aurora aurora--2"></div>
    <div class="stars"><!-- pontos gerados --></div>
    <div class="meteor" style="--delay:3s"></div>
  </div>

  <div class="scene-content">
    <h1>Titulo</h1>
    <a class="btn-accent">Acao principal</a>
  </div>
</section>
```

```css
.hero{position:relative;overflow:hidden;background:var(--grad-surface)}
.aurora--1{top:-10%;left:-5%;  animation-duration:18s}
.aurora--2{bottom:-15%;right:0;animation-duration:27s;animation-delay:-8s;opacity:.7}
```

Pontos importantes:

- `aria-hidden="true"` na camada decorativa - leitor de tela nao deve anuncia-la;
- `animation-delay` negativo faz a segunda aurora comecar no meio do ciclo, evitando sincronia;
- duracoes nao multiplas (18s e 27s) para o conjunto nao repetir;
- `overflow:hidden` no pai contem o meteoro.

## 9. Custo e limites

Cena e a parte mais cara da interface. Respeite:

**Orcamento por pagina**

- 1 cena;
- ate 3 camadas de ambiente;
- ate 2 tipos de evento;
- ate 40 particulas em desktop, 15 em mobile.

**Desligue no mobile.** Cena e efeito de tela grande; em celular custa bateria e entrega pouco:

```css
@media (max-width:900px){
  .scene-layer{display:none}
}
```

**`prefers-reduced-motion` e obrigatorio.** Movimento ambiente continuo e exatamente o que causa desconforto vestibular:

```css
@media (prefers-reduced-motion:reduce){
  .aurora,.star,.meteor,.card-premium::after,
  .badge-diamond,.badge-diamond > *{
    animation:none !important;
  }
  .scene-layer{opacity:.4}
}
```

Note que a cena nao some - ela **congela**. O gradiente e as manchas continuam ali, dando profundidade, mas sem movimento.

**`blur` e caro.** Cada camada com `filter:blur()` grande e uma superficie recomposta a cada quadro. Tres auroras desfocadas ja pesam em maquina modesta. Meca com o DevTools aberto, nao no olho.

**Contraste vence a cena.** Se o texto ficou dificil de ler sobre a aurora, a aurora esta errada - nao o texto. Reduza a opacidade ou coloque uma camada de escurecimento entre cena e conteudo.

## 10. Checklist

- [ ] A pagina tem no maximo uma cena.
- [ ] Toda camada decorativa tem `pointer-events:none` e `aria-hidden="true"`.
- [ ] O conteudo esta em camada propria com `z-index` acima.
- [ ] As duracoes das camadas nao sao multiplas entre si.
- [ ] Eventos raros ficam invisiveis na maior parte do ciclo.
- [ ] O numero de particulas respeita o orcamento.
- [ ] A cena esta desligada abaixo de 900px.
- [ ] `prefers-reduced-motion` congela o movimento sem remover a profundidade.
- [ ] O contraste do texto foi verificado sobre a parte mais clara da cena.
- [ ] Com todo o movimento parado, a secao ainda comunica a mensagem.

## 11. Frase de controle

Cena boa e cenario, nao espetaculo: se a pessoa consegue descrever o efeito depois de sair da pagina, ele estava alto demais.
