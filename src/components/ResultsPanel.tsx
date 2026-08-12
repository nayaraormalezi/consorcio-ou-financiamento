import { formatBRL, formatCompactMonths, formatPct } from '../calc/format'
import type { CheaperOption, ComparisonResult, SimulatorInput } from '../calc/types'
import { Accordion } from './ui'

export function ResultsPanel({
  result,
  input,
}: {
  result: ComparisonResult
  input: SimulatorInput
}) {
  const cons = result.consortium
  const fin = result.financing
  const savings = Math.abs(result.nominalDiff)
  const cheaper = result.cheaperNominal
  const consCheaper = cheaper === 'consortium'
  const finCheaper = cheaper === 'financing'

  return (
    <div id="resultado" className="space-y-10 sm:space-y-14">
      <section aria-labelledby="resultado-titulo">
        <p className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">
          Resultado da simulação
        </p>
        <h2
          id="resultado-titulo"
          className="font-display mt-2 max-w-3xl text-2xl font-semibold tracking-tight text-ink sm:text-4xl"
        >
          {headline(cheaper)}
        </h2>
        <div className="mt-6">
          <p className="text-sm text-muted">
            {cheaper === 'tie' ? 'Diferença estimada no total pago' : 'Economia estimada'}
          </p>
          <p className="font-display mt-1 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            {formatBRL(savings)}
          </p>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            Neste cenário, a diferença é o total pago de uma opção menos o da outra. Não declara
            qual produto é melhor: o financiamento libera o crédito no mês 0; o consórcio, no mês{' '}
            {cons.creditAvailableMonth}.
          </p>
        </div>
        {input.termMonths !== fin.termMonths ? (
          <p className="mt-4 text-sm leading-relaxed text-attention">
            Os prazos são diferentes: consórcio {formatCompactMonths(cons.paidMonths)} e
            financiamento {formatCompactMonths(fin.termMonths)}. O total pago não deve ser
            interpretado isoladamente.
          </p>
        ) : null}
      </section>

      <section aria-labelledby="comparacao-titulo">
        <h3 id="comparacao-titulo" className="font-display text-xl font-semibold tracking-tight">
          Consórcio e financiamento, lado a lado
        </h3>

        <div className="mt-5 grid gap-4 sm:hidden">
          <CompareCard
            name="Consórcio"
            accent="cons"
            total={cons.totalDisbursed}
            installment={cons.firstInstallment}
            term={formatCompactMonths(cons.paidMonths)}
            access={`Após contemplação · mês ${cons.creditAvailableMonth}`}
            highlightTotal={consCheaper}
          />
          <CompareCard
            name="Financiamento"
            accent="fin"
            total={fin.totalDisbursed}
            installment={fin.firstInstallment}
            term={formatCompactMonths(fin.termMonths)}
            access="Imediato · mês 0"
            highlightTotal={finCheaper}
          />
        </div>

        <div className="mt-5 hidden overflow-x-auto sm:block">
          <table className="w-full min-w-[560px] text-left">
            <caption className="sr-only">
              Comparação de total pago, parcela inicial, prazo e acesso ao bem
            </caption>
            <thead>
              <tr className="border-b border-line text-sm text-muted">
                <th className="py-3 pr-4 font-medium">Indicador</th>
                <th className="py-3 pr-4 font-medium text-cons">Consórcio</th>
                <th className="py-3 font-medium text-fin">Financiamento</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-line">
                <th scope="row" className="py-4 pr-4 text-sm font-medium text-muted">
                  Total que você paga
                </th>
                <td className={`py-4 pr-4 font-display text-2xl font-semibold ${consCheaper ? 'text-ink' : 'text-ink/80'}`}>
                  {formatBRL(cons.totalDisbursed)}
                </td>
                <td className={`py-4 font-display text-2xl font-semibold ${finCheaper ? 'text-ink' : 'text-ink/80'}`}>
                  {formatBRL(fin.totalDisbursed)}
                </td>
              </tr>
              <tr className="border-b border-line/80">
                <th scope="row" className="py-3 pr-4 text-sm font-medium text-muted">
                  Parcela inicial
                </th>
                <td className="py-3 pr-4 text-base">{formatBRL(cons.firstInstallment)}</td>
                <td className="py-3 text-base">{formatBRL(fin.firstInstallment)}</td>
              </tr>
              <tr className="border-b border-line/80">
                <th scope="row" className="py-3 pr-4 text-sm font-medium text-muted">
                  Prazo
                </th>
                <td className="py-3 pr-4 text-base">{formatCompactMonths(cons.paidMonths)}</td>
                <td className="py-3 text-base">{formatCompactMonths(fin.termMonths)}</td>
              </tr>
              <tr>
                <th scope="row" className="py-3 pr-4 text-sm font-medium text-muted">
                  Quando você pode ter o bem
                </th>
                <td className="py-3 pr-4 text-base">
                  Após contemplação · mês {cons.creditAvailableMonth}
                </td>
                <td className="py-3 text-base">Imediato · mês 0</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="diferenca-titulo">
        <h3 id="diferenca-titulo" className="font-display text-xl font-semibold tracking-tight">
          Qual é a diferença na prática?
        </h3>
        <div className="mt-5 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold tracking-wide text-muted uppercase">
              Se sua prioridade é pagar menos
            </p>
            <p className="mt-2 text-base font-medium text-ink">{priorityCost(cheaper)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold tracking-wide text-muted uppercase">
              Se sua prioridade é ter o bem imediatamente
            </p>
            <p className="mt-2 text-base font-medium text-ink">
              Financiamento — acesso imediato ao crédito
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-8 sm:grid-cols-2">
          <TradeList
            title="Consórcio"
            accent="cons"
            plus={[
              consCheaper || cheaper === 'tie'
                ? 'Menor custo total estimado neste cenário'
                : 'Sem juros de financiamento',
              'Sem juros de financiamento',
            ].filter((item, index, list) => list.indexOf(item) === index)}
            minus={[
              'Não garante contemplação imediata',
              'Parcela pode sofrer reajustes',
            ]}
          />
          <TradeList
            title="Financiamento"
            accent="fin"
            plus={['Acesso imediato ao bem', 'Previsibilidade da aquisição']}
            minus={[
              finCheaper ? 'Incidência de juros e outros custos' : 'Maior custo total estimado neste cenário',
              'Incidência de juros e outros custos',
            ].filter((item, index, list) => list.indexOf(item) === index)}
          />
        </div>

        <p className="mt-6 border-l-2 border-attention pl-4 text-sm leading-relaxed text-ink">
          <span className="font-medium">Importante:</span> o consórcio não garante acesso
          imediato ao crédito. A contemplação depende das regras do grupo e pode ocorrer por
          sorteio ou lance. O mês {cons.creditAvailableMonth} desta simulação é uma hipótese,
          não uma previsão.
        </p>
      </section>

      <section aria-labelledby="pagar-titulo">
        <h3 id="pagar-titulo" className="font-display text-xl font-semibold tracking-tight">
          Quanto você vai pagar?
        </h3>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-muted">
                <th className="py-3 pr-3 font-medium">Indicador</th>
                <th className="py-3 pr-3 font-medium text-cons">Consórcio</th>
                <th className="py-3 font-medium text-fin">Financiamento</th>
              </tr>
            </thead>
            <tbody>
              <Row label="Valor do bem" a={formatBRL(cons.creditValue)} b={formatBRL(fin.creditValue)} />
              <Row label="Entrada / lance" a={formatBRL(cons.bid)} b={formatBRL(fin.downPayment)} />
              <Row
                label="Crédito / financiamento"
                a={formatBRL(cons.availableCredit)}
                b={formatBRL(fin.financedAmount)}
              />
              <Row
                label="Custos adicionais"
                a={formatBRL(result.consortiumCostBeyondCredit)}
                b={formatBRL(result.financingCostBeyondCredit)}
              />
              <Row
                label="Total que você paga"
                a={formatBRL(cons.totalDisbursed)}
                b={formatBRL(fin.totalDisbursed)}
                strong
              />
            </tbody>
          </table>
        </div>

        <Accordion
          title="Ver todos os detalhes financeiros"
          subtitle="Crédito na contemplação, valor presente, encargos, reajuste e demais indicadores já calculados."
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-muted">
                  <th className="py-3 pr-3 font-medium">Indicador</th>
                  <th className="py-3 pr-3 font-medium text-cons">Consórcio</th>
                  <th className="py-3 font-medium text-fin">Financiamento</th>
                </tr>
              </thead>
              <tbody className="[&_td]:py-2.5 [&_td]:align-top">
                <Row label="Crédito original" a={formatBRL(cons.creditValue)} b={formatBRL(fin.creditValue)} />
                <Row
                  label="Crédito estimado na contemplação"
                  a={formatBRL(cons.creditAtContemplation)}
                  b={formatBRL(fin.creditValue)}
                />
                <Row
                  label="Crédito utilizável"
                  a={formatBRL(cons.availableCredit)}
                  b={formatBRL(fin.financedAmount + fin.downPayment)}
                />
                <Row
                  label="Tempo até o crédito"
                  a={`mês ${cons.creditAvailableMonth}`}
                  b="mês 0 · imediato"
                />
                <Row
                  label="Carta após reajustes"
                  a={formatBRL(cons.finalCreditValue)}
                  b={formatBRL(fin.creditValue)}
                />
                <Row label="Entrada / Lance" a={formatBRL(cons.bid)} b={formatBRL(fin.downPayment)} />
                <Row
                  label="Prazo efetivo"
                  a={formatCompactMonths(cons.paidMonths)}
                  b={formatCompactMonths(fin.termMonths)}
                />
                <Row
                  label="Parcela inicial"
                  a={formatBRL(cons.firstInstallment)}
                  b={formatBRL(fin.firstInstallment)}
                />
                <Row
                  label="Parcela final"
                  a={formatBRL(cons.lastInstallment)}
                  b={formatBRL(fin.lastInstallment)}
                />
                <Row label="Juros" a="Não se aplica*" b={formatBRL(fin.totalInterest)} />
                <Row label="Taxa de administração" a={formatBRL(cons.adminFee)} b="—" />
                <Row label="Fundo de reserva" a={formatBRL(cons.reserveFund)} b="—" />
                <Row
                  label="Impacto acumulado do reajuste"
                  a={formatBRL(cons.totalReajustmentExtra)}
                  b="—"
                />
                <Row
                  label="Seguros"
                  a={formatBRL(cons.totalInsurance)}
                  b={formatBRL(fin.totalInsurance)}
                />
                <Row
                  label="Tarifas e outros custos"
                  a={formatBRL(cons.membershipFee + cons.totalOtherMonthly)}
                  b={formatBRL(fin.totalUpfrontFees + fin.totalMonthlyExtras)}
                />
                <Row
                  label="Encargos (juros + seguros + tarifas)"
                  a={formatBRL(result.consortiumCostBeyondCredit)}
                  b={formatBRL(result.financingCostBeyondCredit)}
                  strong
                />
                <Row
                  label="Total desembolsado (soma dos reais)"
                  a={formatBRL(cons.totalDisbursed)}
                  b={formatBRL(fin.totalDisbursed)}
                  strong
                />
                <Row
                  label="Valor presente dos pagamentos"
                  a={formatBRL(cons.npv)}
                  b={formatBRL(fin.npv)}
                  strong
                />
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted">
            *No consórcio não há juros de financiamento. Encargos são taxa, fundo, seguro e adesão.
            O reajuste estimado sobe pagamento e carta juntos — não é juro. Valor presente à taxa de{' '}
            {formatPct(input.discountAnnualPct)} a.a.; considera só os pagamentos.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted">{reading(result)}</p>
        </Accordion>
      </section>

      <section aria-labelledby="custos-titulo">
        <h3 id="custos-titulo" className="font-display text-xl font-semibold tracking-tight">
          Quanto custa cada opção
        </h3>
        <div className="mt-2">
          <Accordion title="Composição do consórcio" subtitle="Ver detalhes">
            <ul className="space-y-2 text-sm">
              <Item label="Crédito original" value={cons.creditValue} />
              <Item label="Taxa de administração" value={cons.adminFee} />
              <Item label="Fundo de reserva" value={cons.reserveFund} />
              <Item
                label={
                  cons.bidKind === 'embedded'
                    ? 'Lance embutido (não sai do caixa)'
                    : 'Lance próprio (sai do caixa)'
                }
                value={cons.bid}
              />
              <Item label="Crédito estimado na contemplação" value={cons.creditAtContemplation} />
              <Item label="Crédito utilizável nesta premissa" value={cons.availableCredit} />
              <Item label="Parcelas (sem o lance)" value={cons.totalInstallments} />
              <Item label="Seguro" value={cons.totalInsurance} />
              <Item label="Adesão e outros" value={cons.membershipFee + cons.totalOtherMonthly} />
              <Item
                label={`Impacto do reajuste (${cons.inpcApplications}x)`}
                value={cons.totalReajustmentExtra}
              />
              <Item label="Carta após reajustes" value={cons.finalCreditValue} />
              <Item label="Encargos (TA + fundo + extras)" value={result.consortiumCostBeyondCredit} />
              <Item label="Total desembolsado" value={cons.totalDisbursed} strong />
            </ul>
            {input.consortiumBidKind === 'embedded' && input.consortiumHasBid ? (
              <p className="mt-4 text-xs text-muted">
                Lance embutido (premissa do modelo): a carta vigente na contemplação menos o
                lance. Utilizável {formatBRL(cons.availableCredit)}. O lance não entra no caixa.
              </p>
            ) : null}
            <dl className="mt-5 space-y-2 text-sm">
              <Line label="Carta inicial" value={cons.creditValue} accent="cons" />
              <Line label="Carta após reajustes" value={cons.finalCreditValue} accent="cons" />
              <Line label="Total de pagamentos (parcelas)" value={cons.totalInstallments} accent="cons" />
              <Line
                label="Impacto acumulado do reajuste nos pagamentos"
                value={cons.totalReajustmentExtra}
                accent="cons"
              />
            </dl>
            <p className="mt-3 text-xs leading-relaxed text-muted">
              O índice é uma estimativa, não uma previsão do IBGE. O pagamento sobe e a carta
              também. Isso não é juro de financiamento.
            </p>
          </Accordion>
          <Accordion title="Composição do financiamento" subtitle="Ver detalhes">
            <ul className="space-y-2 text-sm">
              <Item label="Entrada (parte do bem)" value={fin.downPayment} />
              <Item label="Principal financiado" value={fin.financedAmount} />
              <Item label="Juros" value={fin.totalInterest} />
              <Item label="Seguros" value={fin.totalInsurance} />
              <Item
                label="Tarifas (iniciais + mensais)"
                value={fin.totalUpfrontFees + fin.totalMonthlyExtras}
              />
              <Item
                label="Encargos (juros + seguros + tarifas)"
                value={result.financingCostBeyondCredit}
                strong
              />
              <Item label="Total desembolsado" value={fin.totalDisbursed} />
            </ul>
            {fin.residual > 0.5 ? (
              <p className="mt-3 text-xs leading-relaxed text-muted">
                Saldo residual no fim: {formatBRL(fin.residual)}. Não entra nos encargos nem no
                total pago — permanece como saldo devedor.
              </p>
            ) : null}
            <p className="mt-4 text-xs text-muted">
              Sistema {fin.system.toUpperCase()} · taxa{' '}
              {fin.rateSource === 'cet' ? 'CET informado' : 'de juros'} de{' '}
              {formatPct(fin.monthlyRate * 100, 4)} a.m. efetiva (
              {formatPct(fin.annualEffectiveRate * 100, 2)} a.a. efetiva) ·{' '}
              {formatCompactMonths(fin.termMonths)}.
            </p>
            <p className="mt-3 text-xs leading-relaxed text-muted">
              Financiamento: juros {formatBRL(fin.totalInterest)} + seguros{' '}
              {formatBRL(fin.totalInsurance)} + tarifas{' '}
              {formatBRL(fin.totalUpfrontFees + fin.totalMonthlyExtras)}.
            </p>
          </Accordion>
        </div>
      </section>
    </div>
  )
}

function headline(option: CheaperOption): string {
  if (option === 'tie') {
    return 'Na sua simulação, o custo total das duas opções fica praticamente igual'
  }
  return option === 'consortium'
    ? 'Na sua simulação, o consórcio tem menor custo total'
    : 'Na sua simulação, o financiamento tem menor custo total'
}

function priorityCost(option: CheaperOption): string {
  if (option === 'tie') return 'Neste cenário, o total pago das duas opções fica muito próximo'
  return option === 'consortium'
    ? 'Consórcio — menor custo total estimado'
    : 'Financiamento — menor custo total estimado'
}

function reading(result: ComparisonResult): string {
  const consWait = result.consortium.creditAvailableMonth
  const waitLine =
    consWait > 0
      ? ` Neste cenário, o financiamento disponibiliza o crédito no mês 0; o consórcio, no mês ${consWait}.`
      : ' Neste cenário, as duas hipóteses disponibilizam o crédito no início.'
  const depend = ' Os resultados dependem da hipótese de contemplação e do índice estimado.'

  if (result.metricsDisagree) {
    return `Neste cenário, ${winnerPhrase(result.cheaperNominal)} apresenta menor desembolso nominal (${formatBRL(Math.abs(result.nominalDiff))}). No valor presente dos pagamentos, ${winnerPhrase(result.cheaperNpv)} fica menor (${formatBRL(Math.abs(result.npvDiff))}). Isso não declara uma opção melhor: o VP não atribui valor ao uso do bem.${waitLine}${depend}`
  }
  if (result.cheaperNominal === 'tie' && result.cheaperNpv === 'tie') {
    return `Neste cenário, total pago e valor presente dos pagamentos ficam praticamente iguais.${waitLine}${depend}`
  }
  return `Neste cenário, ${winnerPhrase(result.cheaperNominal)} apresenta menor desembolso nominal e também menor valor presente dos pagamentos. Isso mede pagamentos, não qual produto é melhor.${waitLine}${depend}`
}

function winnerPhrase(option: CheaperOption): string {
  if (option === 'tie') return 'as duas opções'
  return option === 'consortium' ? 'o consórcio' : 'o financiamento'
}

function CompareCard({
  name,
  accent,
  total,
  installment,
  term,
  access,
  highlightTotal,
}: {
  name: string
  accent: 'cons' | 'fin'
  total: number
  installment: number
  term: string
  access: string
  highlightTotal: boolean
}) {
  return (
    <article className="border-t-2 border-line pt-4">
      <p className={`text-xs font-semibold tracking-wide uppercase ${accent === 'cons' ? 'text-cons' : 'text-fin'}`}>
        {name}
      </p>
      <p className="mt-3 text-xs text-muted">Total que você paga</p>
      <p className={`font-display text-2xl font-semibold ${highlightTotal ? 'text-ink' : 'text-ink/80'}`}>
        {formatBRL(total)}
      </p>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-muted">Parcela inicial</dt>
          <dd>{formatBRL(installment)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted">Prazo</dt>
          <dd>{term}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted">Quando você pode ter o bem</dt>
          <dd className="text-right">{access}</dd>
        </div>
      </dl>
    </article>
  )
}

function TradeList({
  title,
  accent,
  plus,
  minus,
}: {
  title: string
  accent: 'cons' | 'fin'
  plus: string[]
  minus: string[]
}) {
  return (
    <div>
      <p className={`text-sm font-semibold ${accent === 'cons' ? 'text-cons' : 'text-fin'}`}>{title}</p>
      <ul className="mt-3 space-y-2 text-sm leading-relaxed">
        {plus.map((item) => (
          <li key={item}>+ {item}</li>
        ))}
        {minus.map((item) => (
          <li key={item} className="text-muted">
            − {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function Line({
  label,
  value,
  accent,
}: {
  label: string
  value: number
  accent: 'cons' | 'fin'
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className={accent === 'cons' ? 'text-cons' : 'text-fin'}>{label}</dt>
      <dd className="font-medium">{formatBRL(value)}</dd>
    </div>
  )
}

function Row({
  label,
  a,
  b,
  strong = false,
}: {
  label: string
  a: string
  b: string
  strong?: boolean
}) {
  return (
    <tr className={`border-b border-line/80 ${strong ? 'font-semibold' : ''}`}>
      <th scope="row" className="py-2.5 pr-3 text-left font-medium text-muted">
        {label}
      </th>
      <td className="pr-3">{a}</td>
      <td>{b}</td>
    </tr>
  )
}

function Item({
  label,
  value,
  strong = false,
}: {
  label: string
  value: number
  strong?: boolean
}) {
  return (
    <li className={`flex items-baseline justify-between gap-3 ${strong ? 'border-t border-line pt-2 font-semibold' : ''}`}>
      <span className="text-muted">{label}</span>
      <span>{formatBRL(value)}</span>
    </li>
  )
}
