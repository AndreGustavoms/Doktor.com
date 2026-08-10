# Guia Interface Tecnica e Glitch

Terceiro volume do acabamento visual. Enquanto o [acabamento premium](GUIA-BIBLIOTECA-DE-ACABAMENTO-PREMIUM.md) trata de polimento e os [efeitos de cena](GUIA-EFEITOS-DE-CENA-E-AMBIENTE.md) tratam de atmosfera, este guia trata de **linguagem tecnica**: interfaces que comunicam sistema, processamento e precisao.

E um vocabulario visual distinto - terminal, HUD, telemetria, glitch controlado. Nao serve para produto de luxo nem para ferramenta administrativa: serve para produto que quer parecer **maquina**.

## Quando usar

- produto tecnico, ferramenta de desenvolvedor, painel de dados ao vivo;
- gamificacao, plataforma de comunidade, produto voltado a publico jovem;
- tela de processamento onde a espera precisa parecer trabalho real;
- lancamento ou campanha com tom tecnologico.

## Quando nao usar

- produto financeiro serio, saude, juridico - glitch sugere falha;
- publico nao tecnico, que le ruido visual como erro;
- fluxo de pagamento ou confirmacao de dados;
- qualquer lugar em que "parecer quebrado" custe confianca.

Aviso central: **glitch simula defeito.** Se a pessoa nao entender que e intencional, ela acha que seu produto travou. Use apenas em entrada de elemento, nunca em estado de repouso.

## 1. O vocabulario

Interface tecnica se apoia em quatro ideias, e a coerencia entre elas e o que separa "produto tecnologico" de "efeito solto":

| Ideia | O que comunica | Efeito tipico |
|---|---|---|
| Boot | o sistema esta iniciando | entrada com blur e escala |
| Sinal | ha transmissao acontecendo | varredura, cursor, ruido |
| Telemetria | algo esta sendo medido | HUD, anel, contador |
| Impacto | uma acao teve consequencia | shockwave, ejecao |

Escolha duas, no maximo tres. As quatro juntas viram carnaval.

## 2. Boot - entrada de sistema

A assinatura da linguagem tecnica. Em vez de aparecer, o elemento **entra em foco**, como imagem sintonizando.

```css
@keyframes terminalBoot{
  0%  {opacity:0;transform:scale(.82);filter:blur(16px)}
  55% {opacity:1}
  100%{opacity:1;transform:scale(1);filter:blur(0)}
}

.panel-boot{
  animation:terminalBoot .58s var(--ease-spring) both;
}
```

Tres decisoes importam:

- **`blur` alto no inicio** (16px) e o que vende a ideia de sintonia. Sem ele e so um fade;
- **opacidade chega a 1 antes do fim** (55%), entao a nitidez termina de resolver com o elemento ja visivel - parece foco travando, nao surgimento;
- **`both`** mantem o estado final e evita o piscar de um quadro.

`--ease-spring` da o leve exagero na chegada. Duracoes entre .5s e .7s: mais rapido nao se le, mais lento irrita.

### Variante HUD com perspectiva

Para paineis que devem parecer projecao:

```css
@keyframes hudBoot{
  0%  {opacity:0;transform:perspective(1200px) rotateX(16deg) scale(.9) translateY(20px);filter:blur(12px)}
  55% {opacity:1;filter:blur(0)}
  100%{opacity:1;transform:perspective(1200px) rotateX(0deg) scale(1) translateY(0)}
}
```

O `rotateX` partindo de 16 graus faz o painel "deitar" e levantar. Mantenha `perspective` nos dois extremos, senao a interpolacao quebra.

## 3. Glitch de estabilizacao

Deslocamento lateral que decai ate assentar. So na entrada.

```css
@keyframes stabilize{
  0%  {opacity:0;transform:translate3d(-4%,0,0) scaleX(.96);filter:blur(14px)}
  18% {opacity:.95;filter:blur(0)}
  26% {transform:translate3d(3%,0,0) scaleX(1.02)}
  34% {transform:translate3d(-2%,0,0) scaleX(.985)}
  48% {opacity:.72}
  100%{opacity:1;transform:translate3d(0,0,0) scaleX(1);filter:blur(0)}
}

.title-glitch{animation:stabilize .9s var(--ease-out) both}
```

A estrutura e uma **oscilacao amortecida**: -4%, +3%, -2%, 0. Cada correcao menor que a anterior, como sistema achando o ponto de equilibrio.

Dois erros comuns:

- oscilar com amplitude constante - vira tremor, nao estabilizacao;
- deixar em loop - o elemento nunca assenta e a pagina parece com defeito.

A queda de opacidade em 48% simula perda momentanea de sinal. Sutil, mas e o que da o carater eletrico.

## 4. Cursor piscando

O detalhe mais barato de toda a linguagem tecnica.

```css
@keyframes cursorBlink{
  0%,49%  {opacity:1}
  50%,100%{opacity:0}
}

.cursor{
  display:inline-block;
  width:.6em;
  height:1.1em;
  background:var(--accent);
  vertical-align:text-bottom;
  animation:cursorBlink .8s steps(1,end) infinite;
}
```

`steps(1,end)` e obrigatorio. Sem ele o navegador interpola a opacidade e o cursor **desvanece** - errado. Terminal pisca seco, ligado ou desligado, sem meio-termo.

Entre .7s e .9s. Mais rapido cansa; mais lento parece travado.

### Maquina de escrever

```jsx
function Typewriter({ text, speed = 45 }) {
  const [shown, setShown] = useState('');

  useEffect(() => {
    setShown('');
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);

  return (
    <span>
      {shown}
      <span className="cursor" aria-hidden="true" />
    </span>
  );
}
```

Cuidados de acessibilidade e layout:

- reserve a altura do texto final (`min-height`), senao a pagina salta a cada caractere;
- para leitor de tela, exponha o texto completo de uma vez - datilografia nao deve ser lida letra a letra;
- respeite `prefers-reduced-motion` mostrando o texto inteiro imediatamente.

```jsx
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reduced) return <span>{text}</span>;
```

## 5. Varredura de sinal

Faixa clara cruzando um painel, sugerindo leitura ou scan.

```css
@keyframes sweep{
  0%  {transform:translateX(-140%);opacity:0}
  18% {opacity:.9}
  100%{transform:translateX(180%);opacity:0}
}

.panel-scan{position:relative;overflow:hidden}
.panel-scan::before{
  content:'';
  position:absolute;
  inset:0 auto 0 0;
  width:40%;
  background:linear-gradient(90deg,transparent,rgba(var(--accent-rgb),.28),transparent);
  animation:sweep 3.2s var(--ease-out) infinite;
  pointer-events:none;
}
```

Variante com inclinacao, mais agressiva:

```css
@keyframes sweepSkew{
  0%  {transform:translateX(-130%) skewX(-18deg);opacity:0}
  30% {opacity:1}
  100%{transform:translateX(180%) skewX(-18deg);opacity:0}
}
```

O `skewX(-18deg)` precisa estar nos dois extremos - so no inicio, o navegador anima o desalinhamento junto e o resultado torce.

Diferenca em relacao ao sheen do volume 2: sheen sugere **material** (vidro, metal); sweep sugere **processo** (leitura, varredura). Mesma tecnica, leitura oposta.

## 6. HUD - anel de telemetria

Elementos que sugerem medicao ao vivo.

```css
@keyframes hudOrbit{
  0%  {transform:translate(-50%,-50%) rotate(0deg)}
  100%{transform:translate(-50%,-50%) rotate(360deg)}
}
@keyframes hudPulse{
  0%,100%{box-shadow:0 0 0 0 rgba(var(--accent-rgb),0),0 0 32px rgba(var(--accent-rgb),.12)}
  50%    {box-shadow:0 0 0 12px rgba(var(--accent-rgb),.05),0 0 46px rgba(var(--accent-rgb),.26)}
}

.hud-ring{
  position:absolute;
  top:50%;
  left:50%;
  width:120%;
  aspect-ratio:1;
  border:1px solid rgba(var(--accent-rgb),.35);
  border-top-color:transparent;
  border-radius:50%;
  animation:hudOrbit 9s linear infinite;
  pointer-events:none;
}
.hud-target{animation:hudPulse 3s ease-in-out infinite}
```

O truque do anel: `border-top-color:transparent` cria uma **lacuna** que torna a rotacao perceptivel. Anel completo girando parece estatico.

`linear` aqui e correto - rotacao de instrumento nao acelera nem desacelera. Note que essa e a excecao a regra geral de evitar curva linear.

Mantenha o `translate(-50%,-50%)` em todos os quadros ao combinar centralizacao e rotacao, senao o elemento orbita em vez de girar no proprio eixo.

## 7. Impacto - shockwave e ejecao

Para o momento em que uma acao acontece. Ao contrario dos anteriores, sao **disparados**, nao continuos.

```css
@keyframes shockwave{
  0%  {opacity:0;transform:translate(-50%,-50%) scale(.24)}
  22% {opacity:.85}
  100%{opacity:0;transform:translate(-50%,-50%) scale(2.3)}
}

.shockwave{
  position:absolute;
  top:50%;
  left:50%;
  width:200px;
  aspect-ratio:1;
  border:2px solid rgba(var(--accent-rgb),.7);
  border-radius:50%;
  animation:shockwave .7s var(--ease-out) forwards;
  pointer-events:none;
}
```

Ejecao de pacotes - fragmentos saindo do centro:

```css
@keyframes ejectLeft{
  0%  {opacity:0;transform:translate3d(14px,0,0) scale(.72)}
  18% {opacity:.95}
  100%{opacity:0;transform:translate3d(-240px,0,0) scale(var(--packet-scale,1))}
}
@keyframes ejectRight{
  0%  {opacity:0;transform:translate3d(-14px,0,0) scale(.72)}
  18% {opacity:.95}
  100%{opacity:0;transform:translate3d(240px,0,0) scale(var(--packet-scale,1))}
}
```

Os dois lados sao espelhados e comecam **cruzando o centro** (+14px indo para a esquerda), o que sugere ejecao de dentro. O `--packet-scale` por elemento evita que todos os fragmentos tenham o mesmo tamanho.

Para disparar em React:

```jsx
const [pulse, setPulse] = useState(0);

<button onClick={() => setPulse(n => n + 1)}>
  Executar
  {pulse > 0 && <span key={pulse} className="shockwave" aria-hidden="true" />}
</button>
```

A `key` mudando remonta o elemento e reinicia a animacao. Sem isso, o segundo clique nao dispara nada.

## 8. Esteira infinita

Faixa de itens rolando sem fim - logos de parceiros, tags, tickers.

```css
@keyframes strip{
  0%  {transform:translateX(0)}
  100%{transform:translateX(-50%)}
}

.strip{display:flex;overflow:hidden}
.strip__track{
  display:flex;
  gap:24px;
  animation:strip 28s linear infinite;
  will-change:transform;
}
.strip:hover .strip__track{animation-play-state:paused}
```

```jsx
<div className="strip">
  <div className="strip__track">
    {[...items, ...items].map((item, i) => <Item key={i} {...item} />)}
  </div>
</div>
```

O conteudo precisa estar **duplicado** e a animacao ir a exatamente `-50%`. Assim o fim da primeira copia coincide com o inicio da segunda e o salto e invisivel. Qualquer outro valor produz um pulo perceptivel.

`animation-play-state:paused` no hover permite ler o item - importante se forem clicaveis.

## 9. Coerencia e limites

**Um sistema, nao efeitos soltos.** Se a entrada usa boot com blur, os paineis internos devem usar a mesma curva e duracao aproximada. Efeito tecnico avulso em interface comum parece bug.

**Glitch so na entrada.** Nunca em loop, nunca em repouso, nunca em elemento que a pessoa precisa ler agora.

**Ruido nunca sobre texto longo.** Varredura e cintilancia podem cruzar paineis e molduras; sobre paragrafo, atrapalham a leitura.

**Estado de erro real precisa ser diferente.** Se a interface toda pisca e falha por estilo, a falha de verdade se perde. Reserve vermelho, movimento brusco e parada total para erro real.

**`prefers-reduced-motion`:**

```css
@media (prefers-reduced-motion:reduce){
  .panel-boot,.title-glitch,.panel-scan::before,
  .hud-ring,.hud-target,.strip__track{
    animation:none !important;
  }
  .panel-boot,.title-glitch{opacity:1;transform:none;filter:none}
}
```

Elementos com `both`/`forwards` precisam do reset explicito de `opacity` e `transform`, senao ficam presos no estado inicial - invisiveis.

**Custo:** `blur` animado e a operacao mais cara aqui. Aceitavel em entrada (dura menos de um segundo); proibido em loop infinito.

## 10. Checklist

- [ ] O tom tecnico combina com o produto e o publico.
- [ ] No maximo tres das quatro ideias (boot, sinal, telemetria, impacto) estao em uso.
- [ ] Glitch aparece so na entrada, nunca em loop.
- [ ] Cursor usa `steps(1,end)`.
- [ ] Datilografia reserva altura e expoe o texto completo ao leitor de tela.
- [ ] Anel de HUD tem lacuna na borda.
- [ ] Efeitos de impacto sao disparados por acao real do usuario.
- [ ] Esteira duplica o conteudo e anima ate `-50%`.
- [ ] Estado de erro real e visualmente distinto do ruido decorativo.
- [ ] `prefers-reduced-motion` reseta `opacity` e `transform` dos elementos com `both`.
- [ ] Nenhum `blur` animado roda em loop infinito.

## 11. Frase de controle

Interface tecnica bem feita parece um sistema ligado; mal feita parece um sistema quebrado - e a diferenca esta em fazer o movimento sempre terminar em ordem.
