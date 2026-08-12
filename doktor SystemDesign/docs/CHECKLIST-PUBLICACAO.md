# Checklist de Publicacao

Use este checklist antes de tornar o Doktor System-Design publico, divulgar como referencia ou instalar em outros projetos.

## Identidade

- [x] Definir autor publico: Andre Gustavo Melo da Silva / AndreGustavoms.
- [x] Confirmar nome publico: `Doktor System-Design`.
- [x] Confirmar stack como baseline tecnica do repositorio, nao preferencia pessoal publica.
- [x] Manter atribuicao da origem em `NOTICE.md` e `LICENSE`.

## Conteudo

- [x] Revisar `README.md` como porta de entrada.
- [x] Revisar `AGENTS.md` como roteiro de uso por IA.
- [x] Revisar `docs/STACK-E-ARQUITETURA.md` como baseline tecnica.
- [x] Revisar `docs/DECISOES-DE-IDENTIDADE.md` e remover pendencias que ja foram decididas.
- [x] Criar guia rapido de uso pratico.
- [x] Criar templates copiaveis de README, IA, deploy, seguranca e ADR.
- [x] Criar checklist de projeto pronto.
- [x] Revisar guias backend opcionais principais para melhorar escrita e remover texto herdado.
- [x] Revisar guias novos/importados conforme `docs/CURADORIA-DOS-GUIAS.md` - todos os guias em `guias/` estao marcados como "Revisado" e seguem a mesma estrutura de secoes (incluindo `Ideias para quem quiser contribuir`).

## Scripts

- [x] Validar `scripts/powershell/install-doktor-powershell.ps1` no PowerShell. Instalacao, `doktor -Help`, `doktor` em pasta temp, desinstalacao e perfil limpo confirmados.
- [x] Validar `scripts/cmd/install-doktor-cmd.cmd` e `scripts/cmd/doktor-command.cmd` no CMD. Instalacao, PATH, sync de 58 arquivos e desinstalacao confirmados.
- [x] Validar `scripts/bash-zsh/install-doktor-bash-zsh.sh` em Bash/Zsh real. Sintaxe valida, instalacao e desinstalacao testadas no Git Bash (Windows) com rsync fake; requer `rsync` em ambiente real.
- [x] Rodar o comando `doktor` em uma pasta temporaria e confirmar que sincroniza sem apagar arquivos fora do destino.
- [x] Registrar roteiro e estado em `docs/VALIDACAO-SCRIPTS.md`.

## Qualidade

- [x] Rodar varredura por identidade herdada fora de `LICENSE` e `NOTICE.md`.
- [x] Rodar varredura por texto quebrado ou caracteres de substituicao.
- [x] Conferir links relativos em documentos principais.
- [x] Confirmar que `IA.md` reflete o estado atual.
- [x] Adicionar validador local `scripts/validate-repo.ps1`.
- [x] Adicionar CI simples em GitHub Actions.
- [x] Fazer commit coeso com mensagem `docs: ...`, `feat: ...` ou `chore: ...`.

## Publicacao

- [x] Conferir remoto Git correto. (`https://github.com/AndreGustavoms/Doktor-SystemDesign.git`, branch `main`).
- [x] Conferir branch atual. (branch `main`).
- [x] Fazer push.
- [ ] Abrir o README no GitHub e verificar renderizacao das tabelas e links.
- [x] Criar tag `v0.1.0` apos confirmar remoto correto.
- [x] Criar tag `v0.2.0` apos a leva de padroes de arquitetura/seguranca/API REST/testes.
- [ ] Criar tag `v0.3.0` apos a leva atual (economia de IA, 10 guias novos/portados, suite de testes dos instaladores, correcao do bug de PATH). Ver `CHANGELOG.md` para o escopo completo.

### Publicacao continua (a cada leva relevante)

Este checklist nao e um evento unico. Sempre que uma leva de mudancas relevante for concluida (novo guia, correcao de bug real, novo documento core):

- [ ] `VERSION` e `CHANGELOG.md` foram atualizados no mesmo commit ou na mesma sessao.
- [ ] Uma tag correspondente foi criada apos o push (`git tag vX.Y.Z && git push origin vX.Y.Z`).
- [ ] `IA.md`, secao "Estado atual (resumo vivo)", reflete a versao e o estado publicados.
