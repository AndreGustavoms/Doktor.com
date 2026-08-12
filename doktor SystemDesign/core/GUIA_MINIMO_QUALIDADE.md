# GUIA MINIMO DE QUALIDADE DE SOFTWARE

> **O que e**: Um contrato curto de qualidade para qualquer projeto que use o `Doktor System-Design`.
>
> **Quando usar**: Sempre. Este arquivo deve ser lido antes dos design systems completos quando a sessao precisa de um resumo rapido dos padroes obrigatorios.
>
> **Objetivo**: Preservar qualidade de software sem depender de documentos longos, memoria da conversa ou interpretacao livre do modelo.

---

## 1. Regra central

Nenhuma entrega deve ser tratada como pronta se ela melhora uma parte do sistema enquanto piora arquitetura, seguranca, manutencao, documentacao ou previsibilidade.

Quando houver duvida, siga os documentos completos:

- Backend: [`DESIGN_SYSTEM_BACKEND.md`](DESIGN_SYSTEM_BACKEND.md)
- Frontend: [`DESIGN_SYSTEM_FRONTEND.md`](DESIGN_SYSTEM_FRONTEND.md)
- Granularidade de arquivo: [`DESIGN_SYSTEM_MODULARIDADE.md`](DESIGN_SYSTEM_MODULARIDADE.md)
- README: [`DESIGN_SYSTEM_README.md`](DESIGN_SYSTEM_README.md)
- Contexto operacional: [`TEMPLATE-CONTEXTO-IA.md`](TEMPLATE-CONTEXTO-IA.md)
- Economia de contexto e escolha de modelo de IA: [`DESIGN_SYSTEM_ECONOMIA_IA.md`](DESIGN_SYSTEM_ECONOMIA_IA.md)
- Menu de entrada (start app): [`GUIA-START-APP-SCRIPT.md`](GUIA-START-APP-SCRIPT.md)

---

## 2. Padroes obrigatorios

1. **Entender antes de alterar**
 - Leia a estrutura existente, identifique o padrao local e preserve a intencao do projeto.
 - Nao invente stack, arquitetura ou convencao se o repositorio ja define uma.

2. **Manter responsabilidades separadas**
 - Regra de negocio nao fica misturada com view/controller, acesso a banco, UI ou integracao externa.
 - Arquivos "faz-tudo" devem ser tratados como sinal de refatoracao.
 - **Um arquivo, uma responsabilidade.** A prioridade nao e ter poucos arquivos: e permitir consertar uma parte do sistema lendo so os arquivos daquela parte. Arquivo grande custa tempo, token e risco de mexer no que nao devia. Nomes-deposito (`utils.ts`, `helpers.ts`, `misc.ts`, `common.ts`) sao proibidos; um componente, um hook e um contexto por arquivo. Limites por tipo e criterio de quebra em [`DESIGN_SYSTEM_MODULARIDADE.md`](DESIGN_SYSTEM_MODULARIDADE.md).

3. **Preferir simplicidade verificavel**
 - Use a solucao mais simples que resolva o problema real.
 - Nao adicione camada, dependencia, fila, microservico ou abstracao sem justificativa concreta.

4. **Preservar contratos**
 - APIs, DTOs, modelos, props, eventos e formatos de resposta devem ser estaveis.
 - Mudanca quebradora precisa ser explicita, documentada e justificada.

5. **Validar entradas e erros**
 - Toda entrada externa deve ser validada.
 - Erros precisam ser previsiveis, compreensiveis e seguros para quem consome o sistema.
 - Cubra os riscos classicos (OWASP Top 10) na camada certa: injecao (SQL/comando), XSS, CSRF e falhas de autenticacao/autorizacao. Checklist detalhado em [`DESIGN_SYSTEM_SEGURANCA.md`](DESIGN_SYSTEM_SEGURANCA.md).

6. **Proteger dados e segredos**
 - Nunca registre tokens, senhas, cookies, dados pessoais ou HTML sensivel em repositorio publico.
 - Logs devem ajudar debug sem vazar segredo.
 - Dependencias tambem sao superficie de ataque: pine versoes, commite o lockfile e rode auditoria (`pip-audit`, `npm audit`) quando adicionar ou atualizar dependencia.
 - Se o projeto **trata dados pessoais de usuarios** (nao so evita vaza-los em log), ele tem dever de privacidade/LGPD: registre finalidade, base legal, retencao e direitos do titular. Use [`../templates/PRIVACIDADE-LGPD-template.md`](../templates/PRIVACIDADE-LGPD-template.md) e o [`../templates/SECURITY-template.md`](../templates/SECURITY-template.md).

7. **Testar comportamento importante**
 - Regras criticas, bugs corrigidos, contratos de API, parser, autenticacao e fluxo destrutivo precisam de teste quando aplicavel.
 - Se nao houver teste automatico viavel, registre verificacao manual objetiva.
 - **Regua unica de testes** (vale para backend e frontend): teste automatizado e obrigatorio para logica de negocio, contrato e correcao de bug; e opcional para UI puramente visual - nesse caso, registre a verificacao manual feita.
 - **Validacao exige evidencia real**: nao declare uma entrega pronta sem executar o codigo (ou os testes) e observar a saida real. "Deve funcionar" nao e validacao; saida de execucao e.
 - **Anti-alucinacao**: antes de usar uma API, biblioteca, metodo ou opcao de configuracao, confirme que ela existe na versao instalada (doc oficial, codigo-fonte ou execucao). Nao presuma de memoria.

8. **Documentar estado relevante**
 - README explica uso, setup e decisao importante.
 - `IA.md` registra contexto operacional, decisoes, bugs relevantes, testes e proximos passos.
 - `IA.md` deve preservar a linha do tempo do projeto: nao apague nem reescreva registros antigos para "corrigir" uma decisao anterior; adicione um novo registro datado explicando a mudanca, o motivo e a validacao.
 - Como a maioria dos projetos e open source, escreva documentacao e logs com linguagem geral e acessivel, sem valores hardcoded e sem depender de contexto privado.
 - Enquadre trabalho futuro como convite a contribuicao: prefira "ideias para quem quiser contribuir" ou "melhorias que o projeto poderia expandir" em vez de "features futuras para implementar". Detalhes em [`DESIGN_SYSTEM_README.md`](DESIGN_SYSTEM_README.md), secao 3.5.

9. **Preferir automacao e ferramenta reutilizavel (nao descuidar da qualidade)**
 - **Regra explicita**: toda vez que for preciso fazer uma mudanca manual - em dados de um sistema externo (ex.: Notion, planilhas, APIs) ou em qualquer projeto que use este padrao de qualidade - prefira scripts e automacoes para manipular os dados, nunca a edicao manual como primeiro recurso.
 - **Por que**: scripts reutilizaveis viram patrimonio do projeto. Modelos de IA cada vez mais capazes podem ler, melhorar e estender essas ferramentas ao longo do tempo. Uma mudanca manual nao deixa rastro reutilizavel; um script deixa.
 - Ao alterar codigo, conteudo estruturado ou dados, procure primeiro se ja existe script, comando, automacao ou ferramenta para esse tipo de mudanca.
 - Se a base existente quase resolve, prefira estender a automacao atual em vez de fazer ajuste manual pontual.
 - Edicao manual e excecao: use apenas quando automacao nao for viavel ou quando o custo de criar a ferramenta for maior do que o ganho real.
 - Quando houver excecao manual, registre a decisao e o motivo de forma objetiva para manter o historico auditavel e repetivel.
 - **Scripts e automacoes nao sao "codigo descartavel"**: seguem os MESMOS padroes de qualidade do projeto (responsabilidade separada, estrutura clara, sem hardcodes, com documentacao, com tratamento de erros).
 - Organize scripts em pastas apropriadas (ex.: `scripts/`, `tools/`), nao na raiz. Se o projeto ja define onde scripts vivem, preserve isso; se nao define, crie uma convencao clara e documente no README.

10. **Fazer mudanca pequena e rastreavel**
 - Prefira entregas coesas, com escopo claro.
 - Nao misture refatoracao ampla com feature sem necessidade.
 - **Versionamento (git):** commite direto no `main` por padrao; so crie branch para feature grande, refatoracao significativa ou alto risco. Commits pequenos no formato `tipo: descricao` (`feat`/`fix`/`docs`/`style`/`refactor`/`test`/`chore`), explicando o que e por que. Politica completa em [`../docs/GIT-POLITICA-DE-VERSIONAMENTO.md`](../docs/GIT-POLITICA-DE-VERSIONAMENTO.md).

11. **Entregar um menu de entrada (`start_app.py`) em todo programa**
 - Todo programa (web, CLI, automacao, script, desktop) deve ter um `start_app.py` na raiz que abre um **menu interativo, colorido e descritivo** - a porta de entrada unica por onde a pessoa instala, configura, inicia e deixa o programa pronto (`python start_app.py`).
 - Sempre menu interativo, nunca flags decoradas. Menu minimo: Iniciar/Rodar, Instalar/Setup, Configurar, Status/Sair.
 - Cross-platform, com mensagens de erro claras, para facilitar quem nao tem facilidade com terminal.
 - Excecao coerente com o item 3 (simplicidade): script interno pequeno e de uso pontual, sem usuario final, pode dispensar o menu - registre a excecao e o motivo.
 - Detalhes em [`GUIA-START-APP-SCRIPT.md`](GUIA-START-APP-SCRIPT.md).

12. **Economizar contexto e escolher o nivel certo de IA**
 - Leia so os documentos indicados pelo `AGENTS.md` para a tarefa atual; nao abra guias "por garantia".
 - Combine complexidade da tarefa com o nivel de modelo de IA apropriado (triagem/leitura vs. implementacao vs. decisao arquitetural).
 - Detalhes em [`DESIGN_SYSTEM_ECONOMIA_IA.md`](DESIGN_SYSTEM_ECONOMIA_IA.md).

13. **Finalizar com criterio de pronto**
 - Codigo/guia revisado.
 - Links internos validos.
 - Testes ou verificacoes executados.
 - Riscos, limites e pendencias registrados.

---

## 3. Checklist rapido antes de encerrar

- [ ] A solucao segue o padrao existente do repositorio.
- [ ] As responsabilidades continuam separadas.
- [ ] Nenhum arquivo virou deposito e os limites de tamanho por tipo foram respeitados (ver `DESIGN_SYSTEM_MODULARIDADE.md`).
- [ ] Nao ha segredo, dado sensivel ou URL privada exposta.
- [ ] Se o projeto trata dados pessoais, ha documento de privacidade/LGPD (base: `templates/PRIVACIDADE-LGPD-template.md`).
- [ ] Contratos afetados foram preservados ou documentados.
- [ ] Testes/verificacoes relevantes foram executados ou justificados.
- [ ] O codigo foi executado de verdade e a saida real foi observada (nao apenas "deve funcionar").
- [ ] APIs, bibliotecas e metodos usados existem na versao instalada (verificado, nao presumido).
- [ ] Dependencias novas/atualizadas estao pinadas, com lockfile commitado e auditoria rodada.
- [ ] Scripts, automacoes e ferramentas reutilizaveis foram priorizados antes de editar manualmente; se houve excecao manual, ela foi registrada com o motivo.
- [ ] Qualidade de scripts: organizados em pasta apropriada, com responsabilidade clara, tratamento de erros, sem hardcodes, documentados.
- [ ] Documentacao e logs usam linguagem geral/open source, sem valores hardcoded, e enquadram trabalho futuro como convite a contribuicao.
- [ ] Todo programa tem `start_app.py` com menu interativo (Iniciar/Rodar, Instalar/Setup, Configurar, Status/Sair) funcionando.
- [ ] README, `IA.md` ou guia afetado foram atualizados quando necessario.
- [ ] O `IA.md` preserva o historico: decisoes novas foram adicionadas como registros datados, sem apagar a linha de raciocinio anterior.
- [ ] O versionamento segue [`../docs/GIT-POLITICA-DE-VERSIONAMENTO.md`](../docs/GIT-POLITICA-DE-VERSIONAMENTO.md): mudanca no `main` (ou branch justificada), commit pequeno no formato `tipo: descricao`, doc atualizada no mesmo passo.
- [ ] Apenas os documentos necessarios para a tarefa foram lidos (ver [`DESIGN_SYSTEM_ECONOMIA_IA.md`](DESIGN_SYSTEM_ECONOMIA_IA.md)).
- [ ] O proximo mantenedor consegue entender a decisao sem reler toda a conversa.

---

## 4. Frase de controle

Se a entrega nao puder responder claramente **o que mudou**, **por que mudou**, **como foi validado** e **qual risco sobrou**, ela ainda nao esta pronta.
