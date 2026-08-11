# Consórcio ou Financiamento: qual custa menos?

Simulador web **educativo** para comparar consórcio e financiamento a partir das premissas que você informa. Tudo roda no navegador — não há backend nem envio de dados.

Versão 2: o núcleo matemático (SAC, Price, NPV, consórcio linear) permanece; a modelagem de lance embutido, crédito na contemplação, residual Price e a linguagem da comparação foram alinhadas à auditoria independente.

## O que o simulador calcula

- Parcelas (consórcio linear; financiamento SAC ou Price)
- Juros do financiamento e encargos do consórcio (taxa de administração, fundo de reserva)
- Reajuste estimado da carta (INPC no aniversário do grupo)
- Desembolsos nominais (o que sai do caixa)
- Valor presente dos pagamentos: `PV = Σ CF_t / (1+i)^t`

## O que ele NÃO prevê

- Quando a contemplação realmente ocorrerá
- A taxa futura de INPC (o índice informado é estimado)
- Aprovação de crédito no banco
- CET Bacen a partir dos fluxos, se você só cola uma taxa
- A tabela oficial de uma administradora
- O valor econômico de usar o bem antes (moradia, uso do veículo etc.)

## Premissas explícitas

| Premissa | Papel no modelo |
| --- | --- |
| INPC | Índice **estimado** no aniversário do grupo. Sobe parcela e carta juntas. Não é juro. |
| Contemplação | Hipótese **obrigatória**. Sem o mês informado o simulador não avança. Não é previsão de sorteio. |
| Taxa de juros / CET informado | Substitui `i` no SAC/Price. CET informado **não** é CET calculado aqui. |
| Taxa administrativa e fundo de reserva | Incidem sobre o crédito inicial e entram no fundo a diluir. |
| Prazo | Consórcio e financiamento são independentes. Prazos diferentes: o total pago não é equivalente isoladamente. |
| Lance próprio | Sai do caixa no mês da contemplação e reduz o saldo. Crédito permanece a carta vigente. |
| Lance embutido | Não sai do caixa. Reduz o saldo e o crédito utilizável (`carta vigente − lance`). |

## Matemática preservada (já auditada)

- Price sem residual: `PMT = P × [i(1+i)^n] / [(1+i)^n − 1]`
- Price com residual: `PMT = (P − R/(1+i)^n) × mesmo fator`; saldo final ≈ R (o balloon permanece como saldo, não entra no caixa)
- SAC: amortização constante; juros = saldo × i
- Conversão de taxas efetiva mensal ↔ anual
- NPV dos desembolsos (não é “qual opção é melhor”)
- Consórcio linear sem índice; lance próprio

## Comparação

O simulador **não declara** “melhor opção”. Mostra, neste cenário:

1. Total pago
2. Valor presente dos pagamentos
3. Crédito efetivamente disponível
4. Tempo até o crédito (financiamento: mês 0; consórcio: mês da hipótese)
5. Encargos

Arquitetura reservada (ainda não na UI): método de comparação `market_terms` vs `same_term`.

## Como executar localmente

Requisitos: Node.js 20+ e npm.

```bash
npm install
npm run dev
```

Abra o endereço indicado no terminal (em geral `http://localhost:5173`).

```bash
npm test
npx vitest run --config audit/vitest.config.ts   # dump para auditoria
python3 audit/run_audit.py
npm run build
```

## Estrutura

```
src/calc/           Fórmulas, formatação, testes
src/components/     Interface
audit/              Motor independente (Python) e relatórios
```
