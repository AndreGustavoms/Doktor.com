# Prompt Base Frontend

Use este modelo para pedir a uma IA ou pessoa desenvolvedora que implemente, revise ou planeje um frontend seguindo o Doktor System-Design.

Antes de usar, consulte:

- [GUIA_MINIMO_QUALIDADE.md](GUIA_MINIMO_QUALIDADE.md)
- [DESIGN_SYSTEM_FRONTEND.md](DESIGN_SYSTEM_FRONTEND.md)
- [../docs/STACK-E-ARQUITETURA.md](../docs/STACK-E-ARQUITETURA.md)

## 1. Prompt curto

```text
Voce vai atuar como engenheiro frontend neste projeto.

Siga:
- core/GUIA_MINIMO_QUALIDADE.md
- core/DESIGN_SYSTEM_FRONTEND.md
- docs/STACK-E-ARQUITETURA.md

Objetivo:
[descreva a tela, fluxo ou componente]

Contexto:
[stack atual, identidade visual, dados, API, restricoes]

Requisitos:
- [requisito 1]
- [requisito 2]
- [requisito 3]

Obrigatorio:
- pensar em mobile e desktop;
- criar estados de loading, vazio e erro;
- separar UI, services e utilidades;
- validar textos para nao estourarem containers;
- manter acessibilidade basica;
- antes de usar uma API/lib/prop, confirmar que existe na versao instalada (nao presumir de memoria);
- rodar build/lint/testes de verdade e reportar a saida real ("deve funcionar" nao e validacao);
- atualizar README/IA.md em tempo real conforme o estado do projeto muda, nao so ao final;
- informar como foi validado.
```

## 2. Prompt completo

```text
Voce vai trabalhar no frontend deste projeto com foco em clareza, responsividade, acessibilidade e manutencao.

Leia e siga estes documentos:
- core/GUIA_MINIMO_QUALIDADE.md
- core/DESIGN_SYSTEM_FRONTEND.md
- docs/STACK-E-ARQUITETURA.md
- IA.md, se existir

Objetivo da tarefa:
[explique a entrega esperada]

Estado atual:
- framework/build:
- estilo:
- componentes existentes:
- rotas/telas:
- API/dados:
- comando para rodar:

Publico e uso:
- quem usa:
- tarefa principal:
- contexto de uso:

Requisitos de UI:
- layout:
- componentes:
- estados:
- responsividade:
- acessibilidade:
- textos:

Restricoes:
- nao usar:
- nao alterar:
- manter compatibilidade com:

Arquitetura esperada:
- componentes base em `components/ui`;
- layout em `components/layout`;
- componentes de dominio separados;
- services/hooks fora da camada visual;
- tokens ou constantes visuais reutilizaveis;
- estados de loading, vazio, erro e sucesso;
- prefira componentes compostos quando houver multiplas partes.

Forma de trabalhar:
- garanta responsividade a cada etapa, nao so no final;
- verifique a responsividade com evidencia real: rode o app e inspecione os breakpoints (browser, screenshot); se nao houver como ver a interface, peca para o usuario validar e registre o resultado no `IA.md` - nunca afirme ter testado visualmente sem ter visto;
- antes de usar uma API, biblioteca ou prop, confirme que ela existe na versao instalada - nao presuma de memoria;
- rode build, lint e testes e observe a saida real antes de dar a etapa por concluida;
- atualize README/IA.md em tempo real a cada mudanca relevante de estado do projeto.

Validacao esperada:
- rodar build/lint/test quando existir, com saida real observada e reportada;
- validar visualmente mobile e desktop com evidencia real (execucao, screenshot ou validacao do usuario);
- registrar verificacao manual quando nao houver teste automatico;
- apontar risco residual.

Entrega:
- implementar ou revisar a solucao;
- atualizar documentacao afetada;
- explicar o que mudou, por que mudou, como foi validado (com evidencia real) e qual risco sobrou.
```

## 3. Escolha de stack

Use a baseline:

| Cenario | Stack sugerida |
|---------|----------------|
| App web com estado/componentes | React + TypeScript + Vite + Tailwind CSS |
| Pagina simples/prototipo pequeno | HTML + CSS + JavaScript |
| Admin/legado rapido | Bootstrap quando ja fizer sentido |

Quando a stack fugir da baseline, registre:

```text
DECISAO:
ALTERNATIVAS:
MOTIVO:
RISCO:
VALIDACAO:
```

## 4. Checklist para a resposta

A resposta ou entrega deve cobrir:

- [ ] stack escolhida ou mantida;
- [ ] componentes reutilizaveis;
- [ ] responsividade;
- [ ] estados de loading/vazio/erro;
- [ ] acessibilidade basica;
- [ ] separacao entre UI e acesso a dados;
- [ ] textos sem overflow;
- [ ] validacao visual ou automatizada;
- [ ] documentacao atualizada.

## 5. Anti-padroes

Evite pedir ou aceitar:

- landing page quando o pedido e app/ferramenta;
- componentes gigantes com regra de API embutida;
- botao sem estado disabled/loading;
- formulario sem erro por campo;
- tabela que quebra no mobile sem alternativa;
- texto decorativo explicando como usar a propria interface;
- UI dependente de uma unica cor sem hierarquia;
- animacao constante competindo com conteudo;
- afirmar que testou responsividade sem ter executado o app ou visto a interface;
- usar API, biblioteca ou prop sem confirmar que existe na versao instalada;
- mudanca sem atualizacao de README/IA.md quando comandos ou comportamento mudam.
