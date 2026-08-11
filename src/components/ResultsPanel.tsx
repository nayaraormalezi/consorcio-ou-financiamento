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
          subtitle="Há duas contas diferentes. Elas podem até apontar para lados opostos — e as duas estão certas, cada uma para a pergunta que faz."
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
              Pagar depois “pesa menos” do que pagar agora, porque o real de hoje poderia render.
              Usamos {formatPct(input.discountAnnualPct)} a.a. como estimativa desse rendimento.
              Isso não muda o que você paga — só o peso de cada pagamento no tempo.
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
            eyebrow="Valor presente dos desembolsos"
            winner={result.cheaperNpv}
            left={cons.npv}
            right={fin.npv}
            note={`Pergunta: quanto isso representa em dinheiro de hoje? Taxa de desconto: ${formatPct(input.discountAnnualPct)} a.a.`}
          />
        </div>

        <p className="mt-4 rounded-2xl bg-paper px-4 py-3 text-sm leading-relaxed text-ink">
          {reading(result)}
        </p>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-line p-4">
            <p className="text-xs font-semibold tracking-wide text-muted uppercase">
              Custo além do crédito original
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              O que você paga a mais do que os {formatBRL(cons.creditValue)} do bem. Entrada e
              lance não entram aqui: são parte do próprio crédito.
            </p>
            <dl className="mt-4 space-y-2 text-sm">
              <Line
                label="Consórcio (taxa + fundo + INPC + extras)"
                value={result.consortiumCostBeyondCredit}
                accent="cons"
              />
              <Line
                label="Financiamento (juros + seguros + tarifas)"
                value={result.financingCostBeyondCredit}
                accent="fin"
              />
            </dl>
            <p className="mt-3 text-xs text-muted">
              Neste recorte, {winnerPhrase(result.cheaperCostBeyond)} tem menor custo além do bem.
            </p>
          </div>

          <div className="rounded-2xl border border-cons/20 bg-cons-soft/50 p-4">
            <p className="text-xs font-semibold tracking-wide text-cons uppercase">
              INPC também aumenta a carta
            </p>
            {result.creditPurchasingPowerGain > 0 ? (
              <>
                <p className="mt-2 text-sm leading-relaxed">
                  A carta começa em {formatBRL(cons.creditValue)} e, com o INPC estimado, chega a{' '}
                  {formatBRL(cons.finalCreditValue)} no fim do plano (
                  {formatBRL(result.creditPurchasingPowerGain)} a mais de poder de compra).
                </p>
                <p className="mt-2 text-xs leading-relaxed text-muted">
                  Os {formatBRL(cons.totalReajustmentExtra)} de INPC no total pago não são juros:
                  parte corrige o crédito. O financiamento entrega o bem de{' '}
                  {formatBRL(fin.creditValue)} no início, sem essa correção.
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm leading-relaxed">
                INPC em 0%: a carta permanece em {formatBRL(cons.creditValue)}. Sem correção, a
                comparação de totais fica mais próxima de “mesmo bem, mesmo poder de compra”.
              </p>
            )}
          </div>
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
                label="Crédito ao fim do plano"
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
                label="INPC no total pago"
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
                label="Custo além do crédito original"
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
                label="Valor presente (equivalente em dinheiro de hoje)"
                a={formatBRL(cons.npv)}
                b={formatBRL(fin.npv)}
                strong
              />
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted">
          *No consórcio não há juros de financiamento. O custo além do bem aparece como taxa de
          administração, fundo de reserva, seguros e correção pelo INPC — esta última também
          reajusta o valor da carta.
        </p>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h3 className="font-display text-xl font-medium">Composição do consórcio</h3>
          <ul className="mt-4 space-y-2 text-sm">
            <Item label="Crédito original" value={cons.creditValue} />
            <Item label="Taxa de administração" value={cons.adminFee} />
            <Item label="Fundo de reserva" value={cons.reserveFund} />
            <Item label="Lance (desembolso separado)" value={cons.bid} />
            <Item label="Parcelas (sem o lance)" value={cons.totalInstallments} />
            <Item label="Seguro" value={cons.totalInsurance} />
            <Item label="Adesão e outros" value={cons.membershipFee + cons.totalOtherMonthly} />
            <Item
              label={`INPC no aniversário (${cons.inpcApplications}x)`}
              value={cons.totalReajustmentExtra}
            />
            <Item label="Carta ao fim do plano" value={cons.finalCreditValue} />
            <Item label="Custo além do crédito" value={result.consortiumCostBeyondCredit} />
            <Item label="Total desembolsado" value={cons.totalDisbursed} strong />
          </ul>
          {input.consortiumBidKind === 'embedded' && input.consortiumHasBid ? (
            <p className="mt-4 text-xs text-muted">
              Lance embutido: crédito disponível estimado {formatBRL(cons.availableCredit)}.
              Para comprar o mesmo bem de {formatBRL(cons.creditValue)}, o complemento
              aparece como lance no fluxo.
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
            <Item label="Custo além do crédito" value={result.financingCostBeyondCredit} />
            <Item label="Total desembolsado" value={fin.totalDisbursed} strong />
          </ul>
          <p className="mt-4 text-xs text-muted">
            Sistema {fin.system.toUpperCase()} · taxa{' '}
            {fin.rateSource === 'cet' ? 'CET' : 'de juros'} de{' '}
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
  if (result.metricsDisagree) {
    return `As lentes discordam. No total nominal, ${winnerPhrase(result.cheaperNominal)} desembolsaria menos (${formatBRL(Math.abs(result.nominalDiff))}). No valor presente, ${winnerPhrase(result.cheaperNpv)} fica menor (${formatBRL(Math.abs(result.npvDiff))}). Isso é comum quando o INPC empurra parcelas do consórcio para o futuro e o financiamento é prefixado. Olhe também o custo além do bem e o poder de compra da carta.`
  }
  if (result.cheaperNominal === 'tie' && result.cheaperNpv === 'tie') {
    return 'Neste cenário, total pago e valor presente ficam praticamente iguais. A decisão tende a girar em torno de quando você precisa do bem, não do custo.'
  }
  return `Nas duas lentes — total pago e valor presente — ${winnerPhrase(result.cheaperNominal)} desembolsaria menos neste cenário. Ainda assim, isso não é uma recomendação: tempo até ter o bem e o reajuste da carta pelo INPC também pesam.`
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
        {winner === 'tie' ? 'Quase empate' : `Menor neste recorte: ${winner === 'consortium' ? 'consórcio' : 'financiamento'}`}
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
