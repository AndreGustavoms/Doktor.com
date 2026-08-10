# Politica de Seguranca

Este repositorio contem documentacao, padroes e scripts instaladores - nao um
servico em producao. Ainda assim, os scripts alteram o perfil do shell e o PATH
do usuario, entao levamos a serio qualquer problema de seguranca neles.

## O que reportar

- Comportamento inseguro nos instaladores (`scripts/`), como escrita fora do
  escopo esperado, execucao de codigo nao confiavel ou vazamento de dado local.
- Exemplo em um guia que induza a uma pratica insegura.
- Segredo, token ou caminho pessoal commitado por engano.

## Como reportar

Prefira o canal privado do GitHub:

1. Acesse a aba **Security** do repositorio.
2. Use **Report a vulnerability** (GitHub Security Advisories).

Se preferir, abra uma issue **sem detalhes sensiveis** pedindo um canal privado
de contato. Nao publique detalhes de exploracao em issue publica antes da correcao.

## O que esperar

- Confirmacao de recebimento assim que possivel.
- Avaliacao do impacto e, se procedente, correcao com credito ao relator quando desejado.

## Escopo

Cobre os arquivos deste repositorio. Nao cobre projetos que apenas usam estes
padroes - cada projeto derivado deve manter seu proprio `SECURITY.md`
(base em [templates/SECURITY-template.md](templates/SECURITY-template.md)).
