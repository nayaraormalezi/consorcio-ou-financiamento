# Auditoria independente V2

## Resultado

| | Antes (V1) | Depois (V2) |
| --- | --- | --- |
| Nota qualitativa | 74/100 | 100/100 nas checagens quantitativas |
| Checagens | 64 (2 diffs materiais) | **70** |
| Sucessos | 62 | **70** |
| Falhas | 2 (lance embutido no caixa; Price residual) | **0** |

Fonte: `audit/audit_v2.json`, motor `audit/independent_engine.py` versus dump `audit/simulator_dump.json`.

## O que mudou nas checagens

1. **Lance embutido** — o simulador deixa de somar o lance no caixa. Total = fundo − lance = R$ 510.000 no caso 500k / TA 20% / FR 2% / lance 100k.
2. **Carta na contemplação** — crédito utilizável no embutido = carta vigente no mês da hipótese − lance (com INPC: 522.500 − 100.000 = 422.500 no caso mês 24).
3. **Price com residual** — PMT ≈ 4.907,35; saldo final = 20.000; balloon não entra no desembolso.
4. **INPC vezes** — 9 aplicações em 120 meses com primeiro aniversário no mês 13 (13, 25, …, 109). A V1 esperava 10; o dinheiro já batia. A expectativa da auditoria foi alinhada ao modelo.

## Checagem documental (não é falha)

`total_vs_sem_inpc` compara o total com INPC (R$ 449.748) ao fundo linear sem índice (R$ 366.000). Δ = +22,88%. Está marcada OK de propósito: registra o impacto do reajuste, não uma divergência de implementação.

## Núcleo matemático

Nenhuma divergência relevante entre simulador e motor independente em SAC, Price, Price balloon, NPV, consórcio linear, lance próprio, lance embutido, INPC e casos-limite.

## Premissas que continuam fora do núcleo

Contemplação hipotética, INPC estimado, CET informado (não calculado), consórcio linear ≠ tabela da administradora, VP sem valor de uso do bem, prazos potencialmente diferentes.
