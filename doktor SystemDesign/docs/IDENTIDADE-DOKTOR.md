# Identidade Doktor

Este documento define a identidade propria do Doktor System-Design: uma mistura entre a direcao autoral observada nos projetos de AndreGustavoms e a heranca tecnica/visual do material MIT usado como base.

## Principio central

O Doktor deve parecer uma ferramenta de engenharia viva: direta, reutilizavel, bem documentada e pronta para virar base de projeto real.

Em uma frase:

```text
Operacional no uso, tecnico na estrutura, limpo no visual e honesto na origem.
```

## Mistura de influencias

| Fonte | O que entra | O que nao entra |
|-------|-------------|-----------------|
| AndreGustavoms | autoria, nome Doktor, direcao operacional, stack pragmatica, apps funcionais, disciplina de tokens e movimento | depender de uma unica stack ou de uma unica paleta para todo problema |
| Base Felixo/Felipe | ideia de system design reutilizavel, guias como biblioteca, documentacao forte, padroes transferiveis, cuidado com setup e qualidade | assinatura pessoal, autoria ativa, identidade civil no corpo dos guias |
| Doktor novo | fusao dos dois: manual tecnico com cara de produto, pronto para IA e para projeto real | copia literal de marca, texto ou estilo pessoal de terceiros |

## Personalidade visual

A identidade Doktor **nao e uma paleta**. Cor pertence a marca do produto, e cada projeto decide a sua.

O que se repete nos projetos e o **metodo**, nao o tom:

- tokens declarados em `:root` antes de qualquer componente;
- curvas de easing nomeadas e reutilizadas, nunca transicao linear por omissao;
- escala fluida com `clamp()` em vez de multiplos breakpoints por elemento;
- elemento clicavel com hover **e** `:active`, fechando o ciclo tatil;
- animacao em camada propria, separada do conteudo;
- componentes proprios pequenos antes de dependencia visual pesada;
- estados visuais claros para loading, vazio, erro e sucesso;
- `prefers-reduced-motion` e foco visivel tratados desde o inicio.

### Os dois modos

O nivel de acabamento varia conforme o papel da tela, e os dois convivem no mesmo produto:

| | Modo operacional | Modo marca |
|---|---|---|
| Objetivo | executar tarefa | convencer, converter |
| Superficie | clara, neutra | livre; frequentemente escura e profunda |
| Acento | funcional, um tom | rico, gradiente, metalico |
| Animacao | so em transicao de estado | ambiente e no hover |
| Exemplo | dashboard, painel, CRUD | landing, catalogo, checkout, login |

Regra de corte: **se a pessoa vai olhar a tela por mais de dez minutos seguidos, use modo operacional.**

Para modo operacional, os defaults uteis continuam sendo superficie clara, borda sutil, radius moderado, texto compacto, cards agrupando informacao real e icones Lucide.

Para modo marca, o repertorio de acabamento esta em [../guias/frontend/GUIA-BIBLIOTECA-DE-ACABAMENTO-PREMIUM.md](../guias/frontend/GUIA-BIBLIOTECA-DE-ACABAMENTO-PREMIUM.md), [../guias/frontend/GUIA-EFEITOS-DE-CENA-E-AMBIENTE.md](../guias/frontend/GUIA-EFEITOS-DE-CENA-E-AMBIENTE.md) e [../guias/frontend/GUIA-INTERFACE-TECNICA-E-GLITCH.md](../guias/frontend/GUIA-INTERFACE-TECNICA-E-GLITCH.md).

Para materiais mais editoriais ou guias, pode haver um toque mais "handbook": secoes bem nomeadas, checklists, tabelas e exemplos copiaveis.

## Personalidade tecnica

O Doktor deve favorecer:

- projetos que rodam localmente sem ritual complexo;
- scripts de start e instalacao simples;
- README util antes de README bonito;
- `IA.md` como memoria operacional;
- decisoes documentadas;
- componentes proprios pequenos antes de dependencia visual pesada;
- seguranca e privacidade desde o desenho;
- guias opcionais por dominio, nao regras universais.

## Tom de escrita

Use tom direto e tecnico:

- diga quando usar;
- diga quando nao usar;
- mostre o resultado esperado;
- mostre codigo ou checklist quando ajudar;
- evite frase decorativa;
- evite vender demais;
- registre limites e riscos.

Padrao de abertura recomendado:

```text
# Nome do Padrao

## Quando usar

## Quando nao usar

## Resultado esperado
```

## Cor

O Doktor **nao tem cor propria**. A paleta pertence a marca de cada produto.

O que o Doktor exige nao e um tom, e uma estrutura: todo projeto deve declarar um conjunto nomeado de tokens antes de escrever componente.

| Token | Papel |
|-------|-------|
| `background` | fundo da pagina |
| `surface` | superficie elevada (card, painel, modal) |
| `text` | texto principal |
| `muted` | texto secundario e apoio |
| `border` | separacao entre superficies |
| `accent` | acao primaria, foco, destaque da marca |
| `success` | confirmacao |
| `warning` | atencao |
| `danger` | erro e acao destrutiva |
| `info` | mensagem neutra |

Regras que valem em qualquer paleta:

- os quatro tokens de estado (`success`, `warning`, `danger`, `info`) precisam ser distinguiveis entre si, inclusive por quem nao diferencia vermelho e verde - nunca sinalize estado so por cor;
- contraste de texto deve ser verificado sobre a superficie real, nao sobre o branco de referencia;
- `accent` e acento, nao banho de cor: se ele domina a tela, deixa de destacar;
- neutros suficientes sao o que tornam uma interface densa legivel.

Historicamente este documento sugeria verde/ciano como padrao, por leitura de um unico repositorio. Os projetos posteriores do autor usam paletas bem diferentes (dourado sobre azul-marinho, tema editorial proprio), o que confirma que cor e decisao de marca e nao traco de identidade do Doktor.

## Regra de autoria

O README e os projetos derivados usam autoria de Andre Gustavo Melo da Silva / AndreGustavoms.

A influencia Felixo/Felipe deve aparecer como origem preservada em `NOTICE.md`, `LICENSE` e neste documento de identidade. Nos guias tecnicos, prefira linguagem neutra e reaproveitavel.

## Frase de controle

Se uma pessoa olha para um projeto Doktor, ela deve perceber que e uma ferramenta seria, documentada e reutilizavel, com identidade propria, sem precisar conhecer os projetos que inspiraram a base.
