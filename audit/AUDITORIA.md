# AUDITORIA DO SIMULADOR

**Escopo:** código em `src/calc/*` (consórcio, financiamento, NPV, taxas, `simulate`).  
**Método:** reconstrução independente em Python (`audit/independent_engine.py`), sem importar as funções TypeScript. A saída do app foi extraída uma vez (`audit/simulator_dump.json`) só para obter o X do simulador; o Y veio de fórmulas fechadas / motor próprio.  
**Data:** 11/08/2026.  
**Nada do simulador foi alterado nesta etapa.**

---

## 1. VEREDITO

SAC, Price (sem residual), conversão de taxas efetivas/nominais, valor presente dos *desembolsos* e o consórcio linear **sem INPC e sem lance embutido** batem com a matemática de livro até o centavo nos testes. O motor faz o que a especificação do próprio app descreve, de forma internamente consistente.

Os problemas não são “PMT errado”. São de **modelagem e equivalência econômica**: lance embutido entra no caixa como se fosse dinheiro novo; a contemplação padrão é o mês 1 e o benefício de ter o bem cedo não entra no NPV; a carta na contemplação inflacionada não é o “crédito disponível” exibido no lance embutido; o CET não é calculado, só usado como taxa; Price com valor residual não preserva o balloon de R$ X.

É um simulador educativo confiável para SAC/Price e para consórcio linear transparente — **não** um substituto da tabela da administradora nem de uma proposta bancária com CET completo.

## 2. NOTA GERAL

**74/100**

| Dimensão | Nota |
|---|---|
| 1. Matemática | 90 |
| 2. Financiamento | 88 |
| 3. Consórcio | 64 |
| 4. Modelagem de fluxo de caixa | 76 |
| 5. Tratamento de contemplação | 52 |
| 6. Tratamento de lance | 58 |
| 7. Reajustes | 70 |
| 8. Comparação entre produtos | 68 |
| 9. Transparência das premissas | 84 |

## 3. PRINCIPAIS PROBLEMAS

### 🔴 CRÍTICO — Lance embutido entra no desembolso como dinheiro

O lance reduz o saldo **e** é somado em `total` no mês da contemplação. No lance próprio isso está certo (saiu do bolso). No embutido, o cliente **não** paga esse valor em dinheiro: ele reduz a carta. O simulador mostra total = fundo (ex.: R$ 610.000) em vez de fundo − lance (R$ 510.000), e ainda corta a carta para R$ 400.000. O usuário parece pagar o lance duas vezes (caixa + carta menor).

### 🟠 IMPORTANTE — NPV só desconta saídas; ter o bem cedo não vale nada na conta

O financiamento entrega o bem no mês 0; o consórcio, no mês da contemplação. O VP compara apenas pagamentos. Quem paga mais tarde “ganha” no VP mesmo sem o imóvel. O painel “Custo × tempo” é qualitativo. `creditTiming` **não entra** em nenhuma fórmula.

### 🟠 IMPORTANTE — Contemplação padrão = mês 1

`contemplationMonth: 1`. Quase contemplação imediata. Não é sorteio, não é média de grupo. Está escrito que é premissa, mas o default favorece o consórcio (crédito cedo + parcelas diluídas + INPC depois).

### 🟠 IMPORTANTE — Crédito disponível do embutido usa a carta original, não a da contemplação

`availableCredit = credit0 − bid`. Com INPC, a carta na contemplação já foi reajustada. A regra de mercado típica (DEPENDE DE PREMISSA EXTERNA) aplica o lance sobre o crédito vigente.

### 🟠 IMPORTANTE — CET não é calculado

Se `useCet`, a taxa informada substitui os juros. Não há IRR/TIR do fluxo com tarifas para obter o CET Bacen. Com `cetIncludesExtras`, seguros e tarifas somem do fluxo — coerente *se* o CET já as inclui; o app **não verifica** isso.

### 🟡 MODERADO — Price + residual não é balloon clássico

PMT é calculado só sobre `financiado − residual`, mas os juros incidem sobre o saldo cheio. O balloon de R$ 20.000 não se mantém: no teste, o saldo na última prestação era ~R$ 29.804 e o total do mês ficou R$ 30.102. Internamente zera o saldo (consistente), mas **não** entrega residual contratual de R$ 20.000. Residual vem desligado por padrão.

### 🟡 MODERADO — Taxa de administração só sobre o crédito inicial

`adminFee = C × %`. O INPC infla o *saldo a diluir* (que já contém a TA), não recalcula TA sobre a carta nova. Aproximação linear, não a tabela da administradora.

### 🟡 MODERADO — “Custo além do crédito” trata INPC como custo puro

Enquanto o herói explica que a carta também sobe, `cheaperCostBeyond` soma `totalReajustmentExtra` como custo. Pode induzir “consórcio mais caro” no recorte errado.

### 🟡 MODERADO — Prazos diferentes (120 vs 360) sem equalizar o serviço do bem

Intencional (padrão de mercado), mas os totais nominais deixam de ser comparáveis. O VP mitiga; o total desembolsado, não.

### 🟢 OK — SAC, Price sem residual, NPV de fluxos, lance próprio (não é desconto), limites 0% / 1 mês / R$ 0

---

## 4. FÓRMULAS AUDITADAS

| Cálculo | Fórmula atual | Fórmula correta | Status |
|---|---|---|---|
| TA consórcio | `C × ta%` | Percentual do crédito da categoria; em contratos reais a TA residual reajusta com a carta (premissa externa) | ⚠️ |
| Fundo de reserva | `C × fr%` | Idem, diluído; saldo pode ser rateado no fim (premissa externa) | ⚠️ |
| Fundo / saldo a diluir | `C + TA + FR` | Modelo linear válido como simplificação | ✅ |
| Parcela teórica | `fundo / N` | Sem reajuste e sem lance, sim | ✅ |
| Parcela com saldo | `outstanding / meses restantes` | Redistribuição linear; grupos reais usam % do crédito vigente (premissa externa) | ⚠️ |
| INPC aniversário | No mês A, A+12, …: `outstanding ×= (1+g)`, `carta = C₀ × ∏(1+g)` | Aniversário do grupo é o desenho usual; índice real é INPC/INCC divulgado | ⚠️ estimativa |
| Lance no saldo | `outstanding -= min(lance, outstanding)` | Lance abate saldo devedor do cotista | ✅ |
| Lance no caixa | `total += lance` sempre | Só recursos próprios; embutido **não** é caixa | ❌ embutido |
| Carta líquida embutido | `C₀ − lance` | `C_contemplação − lance` (típico) | ⚠️ |
| Seguro % | `carta_vigente × %` ao mês | Se o % for mensal sobre a carta, ok; se o usuário pensar anual, erra | ❓ |
| Adesão | Mês 1, se o switch estiver on | Premissa de contrato | ❓ |
| Price PMT | `P × i(1+i)^n / ((1+i)^n−1)` | Sistema francês | ✅ |
| Price i=0 | `P/n` | Correto | ✅ |
| SAC amortização | `P/n` | Correto | ✅ |
| SAC juros | `saldo × i` | Correto | ✅ |
| SAC juros totais | (implícito no loop) = `i×P×(n+1)/2` | Fechada confirmada | ✅ |
| Taxa mensal efetiva | `i_m` informado, ou `(1+i_a)^{1/12}−1`, ou `i_nom/12` | Convenção explícita e correta | ✅ |
| CET | Usa o % como `i` | CET é TIR do fluxo com custos; aqui é atalho | ⚠️ |
| Entrada | Mês 0 no fluxo; `financiado = C − entrada` | Correto | ✅ |
| Residual Price | PMT(P−R), juros sobre P, balloon misturado | Balloon: PMT sobre `P − R/(1+i)^n` **ou** juros+amort que preserve R | ❌ |
| VP | `Σ CF_t / (1+i_m)^t`, mês 0 sem desconto | Correto para *custos*; incompleto sem benefício do bem | ⚠️ |
| i desconto | `(1+d_aa)^{1/12}−1` | Efetivo, coerente | ✅ |
| “Mais barato” | `|Δ| < 0,50` empate; senão menor total ou menor VP | Não declara um único vencedor no herói | ✅ |
| Custo além do crédito (cons.) | TA+FR+INPC extra+seguro+adesão+outros | INPC extra ≠ juro | ⚠️ |
| Poder de compra | `max(0, carta_final − C₀)` | Carta no **fim do plano**, não na contemplação | ⚠️ |

---

## 5. FINANCIAMENTO

**SAC: correto.** Amortização constante, juros sobre saldo, saldo final zero, juros totais idênticos à fórmula `i × P × (n+1) / 2` (testes 1, 2, 6, 7, 9).

**Price: correto** sem residual. PMT bate com a fórmula francesa; parcelas constantes até o acerto da última; juros e total iguais ao motor independente (teste 5). `i = 0` → `P/n` (teste 7).

**Principal:** `roundCents(crédito − entrada)`. Entrada não entra duas vezes.

**Seguros/tarifas:** somados se os switches estão on; zerados se CET “já inclui extras”.

**CET:** não é calculado. É uma taxa substituta. Convenção anual efetiva `(1+CET)^{1/12}−1` está certa **se** o usuário informar CET efetivo ao ano.

**Residual/balloon:** implementação inconsistente com um residual contratual fixo (ver problema amarelo). Desligado no default.

**IOF, ITBI, avaliação:** só existem se o usuário ligar e preencher. O default os ignora — explícito, mas o custo “limpo” subestima um financiamento imobiliário real. DEPENDE DE PREMISSA EXTERNA.

## 6. CONSÓRCIO

Modelo **linear v1**, documentado no código: não é a tabela da administradora (percentuais mensais de FC/TA/FR sobre o crédito vigente, assembleia, seguro MIP da apólice, etc.).

Sem reajuste e sem lance:  
`parcela = C(1 + ta + fr) / N`  
`total = C(1 + ta + fr)`  
Testes 1, 2, 8, 9: centavo a centavo.

Com INPC no aniversário: o saldo remanescente (crédito + encargos ainda não pagos) é multiplicado por `(1+g)` nos meses 13, 25, … A parcela vira `saldo / meses restantes`, então **sobe no aniversário e fica estável até o próximo**. A carta exibida é `C₀ × (1+g)^k`. Internamente consistente (réplica Python bateu R$ 449.748,46).

Limitações de produto (premissa externa): índice pode ser INCC em imóvel; TA/FR sobre crédito reajustado; parcela flex; fundo de reserva devolvido; seguro por idade; contemplação probabilística.

## 7. LANCE

### A) Sem lance
Parcela constante (sem INPC). Total = fundo. **Não há desconto fantasma.** ✅

### B) Lance com recursos próprios (teste 3)
- R$ 100.000 saem no mês 12 (caixa).
- Saldo cai; parcela seguinte = R$ 2.797,17 (era R$ 3.388,89).
- **Total nominal continua R$ 610.000** = fundo. O lance **não** é desconto do custo; é antecipação de saldo.
- `availableCredit = 500.000` (carta cheia). ✅

### C) Lance embutido (teste 4)
- `availableCredit = 400.000` (carta original − lance).
- Total desembolsado **ainda R$ 610.000** — o app lançou R$ 100.000 no caixa.
- Tratamento correto de caixa: **R$ 510.000** (parcelas do fundo após abater o lance, sem pagar o lance em dinheiro).
- Diferença: **R$ 100.000 (19,6%)**. ❌

Redução de prazo (`reduce_term`): parcela teórica (reajustada) até zerar; encurta `paidMonths`. Não testado como falha de fórmula; é regra simplificada. DEPENDE DE PREMISSA EXTERNA a regra real do grupo.

## 8. CONTEMPLAÇÃO

1. **Não** assume sempre imediata — o mês é input.  
2. O **default é mês 1**, o que na prática é contemplação imediata. Está nas premissas (“mês informado”), não como “média de mercado”.  
3. Não estima sorteio; não usa distribuição de contemplação.  
4. Sim, existe `contemplationMonth`.  
5. Custo de oportunidade da espera **não** está no NPV (não há aluguel imputado nem benefício do bem).  
6. O financiamento gera o bem no início; o consórcio, só na contemplação — a UI fala isso; a métrica de “mais barato” não.  
7. Situações **não** são economicamente equivalentes se os meses de posse diferem.

Impacto do default mês 1: o consórcio recebe o crédito cedo (melhor caso), paga INPC principalmente *depois* de ter a carta, e ainda assim o VP favorece pagamentos tardios do INPC. É o cenário mais otimista para o consórcio.

## 9. REAJUSTES

- **Índice:** INPC *estimado* pelo usuário (default 4,5% a.a.).  
- **Periodicidade:** aniversário do grupo (default mês 13, depois a cada 12).  
- **Base:** saldo remanescente e carta.  
- **TA/FR:** não são recalculadas à parte; viajam dentro do saldo.  
- **Financiamento:** prefixado; sem correção de saldo (SAC/Price clássicos). TR/poupança não existem. DEPENDE DE PREMISSA EXTERNA (contrato pode ser poupança + TR).

### Exemplo numérico (independente = simulador)

Entrada: carta R$ 300.000, TA 20%, FR 2%, 120 meses, INPC 4,5%, sem lance, 1º aniversário mês 13.

| | Sem INPC | Com INPC 4,5% |
|---|---|---|
| Parcela 1 | R$ 3.050,00 | R$ 3.050,00 |
| Parcela final | R$ 3.050,00 | R$ 4.532,59 |
| Total pago (parcelas) | R$ 366.000,00 | R$ 449.748,46 |
| Extra de correção | R$ 0 | R$ 83.748,46 |
| Carta final | R$ 300.000,00 | R$ 445.828,54 |
| Aplicações | 0 | 9 (meses 13…109) |

O extra de R$ 83,7 mil **não** é juro: a carta subiu R$ 145,8 mil. Comparar só o total pago sem a carta reajustada enviesa contra o consórcio — o app mostra as duas coisas, mas `cheaperCostBeyond` puxa para o enviesamento.

Taxa fixa 4,5% por 10 anos é **cenário**, não INPC real. Correto como estimativa se estiver rotulado assim.

## 10. TESTES NUMÉRICOS

Bateria: Python independente × dump do `simulate()`. 64 checagens, **2 divergências relevantes** (embutido; contagem INPC na réplica extra de um aniversário sem caixa — o app com 9 aplicações está certo).

| Teste | Resultado |
|---|---|
| 1. R$ 100 mil / 100 m / sem lance / SAC 1% | Consórcio total R$ 122.000; parcela R$ 1.220; SAC juros R$ 50.500; parcela 1 R$ 2.000. **Bate.** |
| 2. R$ 500 mil / 180 m | Consórcio R$ 610.000; parcela R$ 3.388,89; SAC juros R$ 452.500. **Bate.** |
| 3. Lance próprio R$ 100 mil, mês 12 | Total **ainda** R$ 610.000; parcela pós-lance R$ 2.797,17; carta R$ 500.000. **Bate (não é desconto).** |
| 4. Lance embutido R$ 100 mil | App R$ 610.000 caixa + carta R$ 400.000. Caixa correto R$ 510.000. **Falha de modelagem.** |
| 5. Price | PMT R$ 1.586,57; total R$ 158.657,43; saldo 0. **Bate.** |
| 6. SAC | Amort. R$ 1.000; juros 1 = R$ 1.000; juros tot. R$ 50.500. **Bate.** |
| 7. Juros 0% | Parcela fin. R$ 1.000; juros 0; total fin. = principal. **Bate.** |
| 8. TA = FR = 0 | Consórcio total = carta; parcela R$ 1.000. **Bate.** |
| 9. Prazo 1 mês | Consórcio R$ 122.000 numa parcela; fin. R$ 101.000. **Bate.** |
| 10. Crédito R$ 0 | Totais 0; `errors` avisa. Motor não explode. **Bate.** |

Extras: defaults 360 meses SAC juros R$ 433.200 **bate**; CET 12% a.a. → i_m correto; NPV teste 1 **bate** R$ 107.943,69; Price+residual PMT R$ 4.707 vs balloon teórico R$ 4.907.

## 11. DIFERENÇAS ENCONTRADAS

**ENTRADA:** carta R$ 500.000 · 180 meses · TA 20% · FR 2% · lance embutido R$ 100.000 · contemplação mês 12 · sem INPC  

**RESULTADO DO SIMULADOR:** desembolso R$ 610.000 · crédito disponível R$ 400.000  

**RESULTADO CORRETO (caixa do embutido):** desembolso R$ 510.000 · crédito disponível R$ 400.000 (ou carta vigente − lance, se houver INPC)  

**DIFERENÇA:** R$ 100.000 · **19,61%** sobre o caixa correto  

**CAUSA:** `bidNow` entra em `row.total` para qualquer `consortiumBidKind`.

---

**ENTRADA:** R$ 120.000 · 24 meses · Price · residual R$ 20.000 · 1% a.m.  

**RESULTADO DO SIMULADOR:** 1ª parcela R$ 4.707,35 (PMT de R$ 100.000); última saída R$ 30.102,04; juros R$ 18.371  

**RESULTADO CORRETO (balloon Price):** PMT ≈ R$ 4.907,35 sobre `P − R/(1+i)^n`; residual final = R$ 20.000  

**DIFERENÇA (1ª parcela):** R$ −200,00 · **−4,08%**  

**CAUSA:** juros do residual comem a amortização dentro de um PMT dimensionado só para R$ 100.000; o balloon não permanece R$ 20.000.

---

Demais testes do núcleo: **diferença R$ 0,00**.

## 12. RISCOS DE INTERPRETAÇÃO

1. Ler “menor neste recorte: consórcio” como recomendação de compra. O texto diz que não é, mas o card usa linguagem de vencedor.  
2. Default mês 1 = “consórcio quase à vista”.  
3. Comparar total nominal 120 meses vs 360 meses como se fossem o mesmo serviço.  
4. Lance embutido: achar que pagou R$ 610 mil *e* só recebe R$ 400 mil.  
5. INPC no “custo além do crédito” sem olhar a carta maior.  
6. 1% a.m. em 30 anos parece financiamento de veículo, não SFH (~CET 9–12% a.a.). O usuário pode não trocar a taxa.  
7. CET do banco colado como juros sem conferir se já tem seguro/IOF.  
8. VP a 10% a.a. favorece quem empurra pagamento (consórcio + INPC). Sem aluguel imputado, o financiamento “parece” pior no VP.  
9. `creditTiming` “imediatamente” não muda número nenhum.

## 13. O QUE PRECISA SER CORRIGIDO

1. Lance embutido: **não** somar o lance no caixa; só reduzir carta e saldo.  
2. Exibir carta / disponível **na contemplação** (valor vigente), não só C₀ e carta no último mês.  
3. Ou mudar o default de contemplação para um mês conservador (ex. N/2) com rótulo “hipótese, não sorteio”, ou exigir o campo sem default otimista.  
4. NPV com cenário de benefício (aluguel evitado) ou deixar explícito na manchete: “VP apenas de saídas, sem valor de uso do bem”.  
5. Price+residual: PMT sobre `P − R/(1+i)^n` **ou** juros sobre saldo com amortização que preserve R.  
6. Não incluir INPC extra em `cheaperCostBeyond` sem net da variação da carta.  
7. Se houver “usar CET”, deixar claro que **não se calcula CET**; é taxa informada.  
8. (Opcional) equalizar prazos num modo “mesmo horizonte” vs “prazos de mercado”.

## 14. O QUE ESTÁ CORRETO

- PMT Price e SAC, incluindo i = 0 e n = 1.  
- Juros totais SAC = fórmula fechada.  
- Saldo final zero.  
- Conversão efetiva/nominal mensal/anual.  
- VP dos desembolsos `Σ CF/(1+i)^t` (mês 0 sem desconto).  
- Consórcio linear sem índice: `(C+TA+FR)/N`.  
- Lance próprio: antecipação de saldo, total nominal inalterado.  
- INPC no aniversário internamente consistente (carta e saldo sobem juntos).  
- Switches de opcionais realmente zeram seguro/adesão/tarifas.  
- Entrada só no mês 0.  
- Dois prazos (grupo vs banco).  
- Herói com duas lentes e disclaimer de que não é recomendação.  
- Validação de crédito zero.  
- Réplica independente do loop de INPC = mesmo total do TS.

## 15. CONCLUSÃO

**Eu confiaria neste simulador para uso real?**

**SIM, COM RESSALVAS**

Confio para: explicar SAC vs Price, mostrar que consórcio não tem juro composto no saldo, e comparar *desembolsos* sob premissas que o usuário enxerga (prazo, taxa, INPC, lance próprio).

Não confio para: decidir consórcio com lance embutido; tratar o default como contemplação real; usar o VP como “qual produto é melhor” sem o valor de morar/usar o bem; colar um CET de proposta sem saber o que ele já inclui; achar que a parcela do grupo é a da administradora.

É uma **calculadora educativa honesta no núcleo matemático**, com enviesamentos de *enquadramento* (quando o crédito chega, o que conta como caixa, o que entra no “custo”). Não substitui proposta, CET Bacen nem regulamento do grupo.

---

### Mapa do código (referência da auditoria)

| Função | Arquivo | Papel |
|---|---|---|
| `simulate` | `simulate.ts` | Orquestra, opcionais, “mais barato” |
| `applyOptionalFields` | `simulate.ts` | Zera lance/seguro/taxas se o switch está off |
| `simulateConsortium` | `consortium.ts` | Loop mensal do grupo |
| `simulateFinancing` | `financing.ts` | Loop SAC/Price |
| `priceInstallment` | `financing.ts` | PMT |
| `resolveMonthlyRate` | `rates.ts` | i efetiva mensal |
| `presentValue` / `mergeCashFlows` | `npv.ts` | VP |
| `createDefaultInput` | `defaults.ts` | Premissas iniciais |
| UI | `AcquisitionForm`, `ConsortiumForm`, `FinancingForm`, `ResultsPanel` | Entradas e leitura |

**Estimativas (não derivadas de contrato):** INPC 4,5%, mês de contemplação, taxa 1% a.m., desconto 10% a.a., TA 20%, FR 2%.  
**Derivados matematicamente:** parcelas, juros, amortização, VP, totais, carta reajustada no modelo linear.

---

*Arquivos desta auditoria (não alteram o app):* `audit/independent_engine.py`, `audit/run_audit.py`, `audit/dump.test.ts`, `audit/simulator_dump.json`, `audit/audit_compare.json`.
