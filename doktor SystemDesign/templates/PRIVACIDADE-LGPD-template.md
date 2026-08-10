# Privacidade e LGPD

> Copie este arquivo para `PRIVACIDADE.md` (ou `docs/PRIVACIDADE.md`) no projeto
> destino sempre que a aplicacao tratar dados pessoais. Preencha cada secao com
> a realidade do projeto - campos em branco significam decisao ainda nao tomada,
> nao "nao se aplica".

## Escopo

Este documento registra como o projeto trata dados pessoais sob a LGPD
(Lei 13.709/2018). Ele nao substitui parecer juridico; serve como registro
tecnico das decisoes de privacidade tomadas no produto.

## 1. Papeis

| Papel LGPD | Quem e | Observacao |
|------------|--------|------------|
| Controlador | | Define finalidade e meios do tratamento. |
| Operador | | Trata dados em nome do controlador (ex.: plataforma de hospedagem). |
| Encarregado (DPO) | | Contato para titulares e ANPD, se aplicavel. |

## 2. Dados pessoais tratados

Liste cada dado pessoal coletado. Nao registre exemplos reais de titulares aqui.

| Dado | Categoria | Finalidade | Base legal |
|------|-----------|------------|------------|
| Nome | Comum | | |
| E-mail | Comum | | |
| CPF | Comum (sensivel operacionalmente) | | |
| | Sensivel (art. 5, II) | | |

Bases legais possiveis (art. 7 e art. 11): consentimento, execucao de contrato,
obrigacao legal, legitimo interesse, protecao ao credito, entre outras. Escolha
uma base por finalidade - nao use "consentimento" como base padrao para tudo.

## 3. Minimizacao

- [ ] Cada dado coletado tem finalidade declarada na tabela acima.
- [ ] Nenhum dado e coletado "por garantia" sem uso definido.
- [ ] Campos opcionais estao marcados como opcionais na interface.
- [ ] Dados sensiveis (art. 5, II) so sao coletados com base legal especifica.

## 4. Consentimento (quando for a base legal)

- [ ] Consentimento e livre, informado e inequivoco (opt-in, nao pre-marcado).
- [ ] O titular consegue revogar o consentimento com a mesma facilidade que deu.
- [ ] O registro de consentimento guarda data, versao do texto e finalidade.

## 5. Direitos dos titulares (art. 18)

Descreva como o projeto atende cada direito. Se ainda for manual, registre isso.

| Direito | Como o projeto atende |
|---------|-----------------------|
| Confirmacao e acesso | |
| Correcao | |
| Anonimizacao, bloqueio ou eliminacao | |
| Portabilidade | |
| Eliminacao dos dados tratados com consentimento | |
| Informacao sobre compartilhamento | |
| Revogacao do consentimento | |

## 6. Retencao e eliminacao

| Dado | Prazo de retencao | Gatilho de eliminacao |
|------|-------------------|-----------------------|
| | | |

- [ ] Existe rotina (manual ou automatica) de eliminacao apos o prazo.
- [ ] Backups tambem respeitam a eliminacao, ou o prazo do backup esta documentado.

## 7. Compartilhamento com terceiros

Liste operadores e subprocessadores (hospedagem, e-mail, analytics, pagamento).

| Terceiro | Dado compartilhado | Finalidade | Fica fora do Brasil? |
|----------|--------------------|------------|----------------------|
| | | | |

- [ ] Transferencia internacional, se houver, tem salvaguarda (art. 33).

## 8. Seguranca dos dados

Aponte para o `SECURITY.md` do projeto e confirme os itens que tocam dados pessoais.

- [ ] Dados pessoais trafegam sob TLS.
- [ ] Dados sensiveis em repouso sao cifrados quando aplicavel.
- [ ] Acesso a dados pessoais e restrito por perfil/permissao.
- [ ] Ha registro (log/auditoria) de acesso a dados pessoais criticos.
- [ ] Logs nao imprimem dado pessoal desnecessario.

Ver [SECURITY-template.md](SECURITY-template.md) para os cuidados tecnicos gerais.

## 9. Incidentes

- [ ] Existe um plano minimo de resposta a incidente de dados.
- [ ] O responsavel sabe que incidente relevante deve ser comunicado a ANPD e aos
      titulares (art. 48).
- Contato para reportar incidente:

## 10. Pendencias

- [ ] Pendencia de privacidade 1.
