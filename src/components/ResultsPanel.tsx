import { formatBRL, formatCompactMonths, formatPct } from '../calc/format'
import type { CheaperOption, ComparisonResult, SimulatorInput } from '../calc/types'
import { Card, SectionTitle } from './ui'

export function ResultsPanel({
  result,
  input,
}: {
  result: ComparisonResult
  input: SimulatorInput
}) {
  const cons = result.consortium
  const fin = result.financing

  return (
    <div id="resultado" className="space-y-5">
      <Card>
        <SectionTitle
          step="Etapa 4"
          title="Veja o resultado"
          subtitle="Cada métrica responde uma pergunta. Nenhuma delas, sozinha, diz qual produto é “melhor”."
        />

        <div className="mb-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-line p-4">
            <p className="text-xs font-semibold tracking-wide text-muted uppercase">1. Total desembolsado</p>
            <p className="mt-2 text-sm font-medium text-ink">Quanto sai da conta, somando os reais.</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Entrada + lance + parcelas + juros + taxas, do primeiro ao último mês. R$ 1.000 no
              mês 1 e R$ 1.000 no mês 120 entram iguais nesta soma. É a conta do extrato bancário.
            </p>
          </div>
          <div className="rounded-2xl border border-line p-4">
            <p className="text-xs font-semibold tracking-wide text-muted uppercase">2. Valor presente dos desembolsos</p>
            <p className="mt-2 text-sm font-medium text-ink">O mesmo dinheiro, convertido para hoje.</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Pagar depois pesa menos do que pagar agora, à taxa de desconto de{' '}
              {formatPct(input.discountAnnualPct)} a.a. Este cálculo considera apenas os
              pagamentos. Não atribui valor financeiro ao período em que o crédito ou o bem
              está disponível.
            </p>
          </div>
        </div>
        <p className="mb-5 rounded-xl bg-primary-soft px-4 py-3 text-sm leading-relaxed text-ink">
          Exemplo: R$ 10.000 hoje e R$ 10.000 daqui a 30 anos somam R$ 20.000 no{' '}
          <strong>total desembolsado</strong>. No <strong>valor presente</strong>, a segunda parcela
          vale menos do que R$ 10.000, porque está longe. Por isso um plano com parcelas tardias
          (consórcio com INPC) pode perder no total e ganhar no valor presente — ou o contrário.
        </p>

        <div className="grid gap-4 lg:grid-cols-2">
          <MetricCard
            eyebrow="Total desembolsado"
            winner={result.cheaperNominal}
            left={cons.totalDisbursed}
            right={fin.totalDisbursed}
            note="Pergunta: no fim das contas, quanto saiu da minha conta? Não desconta o tempo."
          />
          <MetricCard
            eyebrow="Valor presente dos pagamentos"
            winner={result.cheaperNpv}
            left={cons.npv}
            right={fin.npv}
            note={`Só os pagamentos, em dinheiro de hoje. Não mede o valor de usar o bem. Taxa: ${formatPct(input.discountAnnualPct)} a.a.`}
          />
        </div>

        <p className="mt-4 rounded-2xl bg-paper px-4 py-3 text-sm leading-relaxed text-ink">
          {reading(result)}
        </p>

        {input.termMonths !== fin.termMonths ? (
          <p className="mt-4 rounded-xl bg-attention-soft px-4 py-3 text-sm leading-relaxed text-attention">
            Os prazos são diferentes: consórcio {formatCompactMonths(cons.paidMonths)} e
            financiamento {formatCompactMonths(fin.termMonths)}. O total pago não deve ser
            interpretado isoladamente.
          </p>
        ) : null}

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-line p-4">
            <p className="text-xs font-semibold tracking-wide text-muted uppercase">
              Crédito e tempo
            </p>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-cons">Consórcio · crédito estimado na contemplação</dt>
                <dd className="font-medium">{formatBRL(cons.creditAtContemplation)}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-cons">Consórcio · utilizável nesta premissa</dt>
                <dd className="font-medium">{formatBRL(cons.availableCredit)}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-cons">Tempo até o crédito</dt>
                <dd className="font-medium">mês {cons.creditAvailableMonth}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-fin">Financiamento · crédito</dt>
                <dd className="font-medium">{formatBRL(fin.creditValue)}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-fin">Tempo até o crédito</dt>
                <dd className="font-medium">mês 0 · imediato</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs leading-relaxed text-muted">
              A carta na contemplação é premissa deste modelo linear (crédito vigente no mês
              informado). O simulador não prevê sorteio.
            </p>
          </div>

          <div className="rounded-2xl border border-cons/20 bg-cons-soft/50 p-4">
            <p className="text-xs font-semibold tracking-wide text-cons uppercase">
              Impacto acumulado do reajuste (INPC estimado)
            </p>
            <dl className="mt-4 space-y-2 text-sm">
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
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-line p-4">
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">Encargos</p>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            Taxa, fundo, juros, seguros e tarifas — sem misturar reajuste da carta.
          </p>
          <dl className="mt-4 grid gap-2 sm:grid-cols-2 text-sm">
            <Line
              label="Consórcio (TA + fundo + extras)"
              value={result.consortiumCostBeyondCredit}
              accent="cons"
            />
            <Line
              label="Financiamento (juros + seguros + tarifas)"
              value={result.financingCostBeyondCredit}
              accent="fin"
            />
          </dl>
        </div>

        <div className="mt-5 overflow-x-auto">
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
                label="Outras taxas"
                a={formatBRL(cons.membershipFee + cons.totalOtherMonthly)}
                b={formatBRL(fin.totalUpfrontFees + fin.totalMonthlyExtras)}
              />
              <Row
                label="Encargos (sem reajuste da carta)"
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
          O reajuste estimado sobe pagamento e carta juntos — não é juro.
        </p>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h3 className="font-display text-xl font-medium">Composição do consórcio</h3>
          <ul className="mt-4 space-y-2 text-sm">
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
        </Card>
        <Card>
          <h3 className="font-display text-xl font-medium">Composição do financiamento</h3>
          <ul className="mt-4 space-y-2 text-sm">
            <Item label="Entrada (parte do bem)" value={fin.downPayment} />
            <Item label="Principal financiado" value={fin.financedAmount} />
            <Item label="Juros" value={fin.totalInterest} />
            <Item label="Seguros" value={fin.totalInsurance} />
            <Item label="Tarifas e custos iniciais" value={fin.totalUpfrontFees} />
            <Item label="Outros custos mensais" value={fin.totalMonthlyExtras} />
            <Item label="Residual / balloon" value={fin.residual} />
            <Item label="Encargos (juros + seguros + tarifas)" value={result.financingCostBeyondCredit} />
            <Item label="Total desembolsado" value={fin.totalDisbursed} strong />
          </ul>
          <p className="mt-4 text-xs text-muted">
            Sistema {fin.system.toUpperCase()} · taxa{' '}
            {fin.rateSource === 'cet' ? 'CET informado' : 'de juros'} de{' '}
            {formatPct(fin.monthlyRate * 100, 4)} a.m. efetiva (
            {formatPct(fin.annualEffectiveRate * 100, 2)} a.a. efetiva) ·{' '}
            {formatCompactMonths(fin.termMonths)}.
          </p>
        </Card>
      </div>
    </div>
  )
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

function MetricCard({
  eyebrow,
  winner,
  left,
  right,
  note,
}: {
  eyebrow: string
  winner: CheaperOption
  left: number
  right: number
  note: string
}) {
  return (
    <div className="rounded-2xl border border-line bg-card p-4 sm:p-5">
      <p className="text-xs font-semibold tracking-wide text-muted uppercase">{eyebrow}</p>
      <p className="mt-1 text-sm font-medium text-ink">
        {winner === 'tie'
          ? 'Quase empate nesta métrica'
          : `Menor ${eyebrow.toLowerCase()}: ${winner === 'consortium' ? 'consórcio' : 'financiamento'}`}
      </p>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-xs text-cons">Consórcio</dt>
          <dd className="text-lg font-semibold">{formatBRL(left)}</dd>
        </div>
        <div>
          <dt className="text-xs text-fin">Financiamento</dt>
          <dd className="text-lg font-semibold">{formatBRL(right)}</dd>
        </div>
      </dl>
      <p className="mt-3 text-xs leading-relaxed text-muted">{note}</p>
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
      <td className="pr-3 text-muted">{label}</td>
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
