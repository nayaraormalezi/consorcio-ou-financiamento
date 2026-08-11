import { formatBRL, formatCompactMonths, formatPct } from '../calc/format'
import type { ComparisonResult, SimulatorInput } from '../calc/types'
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
  const cheaperLabel =
    result.cheaperNominal === 'tie'
      ? 'Neste cenário, o desembolso total estimado é praticamente o mesmo.'
      : result.cheaperNominal === 'consortium'
        ? 'Neste cenário, o consórcio apresenta menor desembolso total estimado.'
        : 'Neste cenário, o financiamento apresenta menor desembolso total estimado.'
  const economyAbs = Math.abs(result.nominalDiff)
  const economyTitle =
    result.cheaperNominal === 'tie'
      ? 'Empate no desembolso nominal'
      : result.cheaperNominal === 'consortium'
        ? 'Economia estimada escolhendo consórcio'
        : 'Economia estimada escolhendo financiamento'

  return (
    <div id="resultado" className="space-y-5">
      <Card>
        <SectionTitle
          step="Etapa 4"
          title="Veja o resultado"
          subtitle="Comparação nas premissas que você informou. Não é uma recomendação comercial."
        />

        <div className="rounded-2xl bg-primary px-5 py-5 text-white sm:px-7">
          <p className="text-xs tracking-[0.14em] text-white/70 uppercase">{economyTitle}</p>
          <p className="font-display mt-2 text-3xl font-semibold sm:text-4xl">
            {formatBRL(economyAbs)}
          </p>
          <p className="mt-1 text-sm text-white/80">
            {formatPct(result.nominalDiffPct)} de diferença sobre o maior total.
          </p>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/90">{cheaperLabel}</p>
          <dl className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-white/10 px-4 py-3">
              <dt className="text-xs text-white/70">Consórcio · total</dt>
              <dd className="text-lg font-medium">{formatBRL(cons.totalDisbursed)}</dd>
            </div>
            <div className="rounded-xl bg-white/10 px-4 py-3">
              <dt className="text-xs text-white/70">Financiamento · total</dt>
              <dd className="text-lg font-medium">{formatBRL(fin.totalDisbursed)}</dd>
            </div>
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
              <Row label="Valor do crédito" a={formatBRL(cons.creditValue)} b={formatBRL(fin.creditValue)} />
              <Row
                label="Entrada / Lance"
                a={formatBRL(cons.bid)}
                b={formatBRL(fin.downPayment)}
              />
              <Row
                label="Prazo efetivo"
                a={formatCompactMonths(cons.paidMonths)}
                b={formatCompactMonths(input.termMonths)}
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
              <Row
                label="Taxa de administração"
                a={formatBRL(cons.adminFee)}
                b="—"
              />
              <Row label="Fundo de reserva" a={formatBRL(cons.reserveFund)} b="—" />
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
                label="INPC (efeito no total)"
                a={formatBRL(cons.totalReajustmentExtra)}
                b="—"
              />
              <Row
                label="Total desembolsado"
                a={formatBRL(cons.totalDisbursed)}
                b={formatBRL(fin.totalDisbursed)}
                strong
              />
              <Row
                label="Valor presente dos desembolsos"
                a={formatBRL(cons.npv)}
                b={formatBRL(fin.npv)}
              />
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted">
          *No consórcio não há juros de financiamento no sentido do SAC/Price. O
          custo aparece como taxa de administração, fundo de reserva, seguros e
          correção pelo INPC no aniversário do grupo.
        </p>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h3 className="font-display text-xl font-medium">Composição do consórcio</h3>
          <ul className="mt-4 space-y-2 text-sm">
            <Item label="Crédito (referência)" value={cons.creditValue} />
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
            <Item label="Crédito no fim do plano" value={cons.finalCreditValue} />
            <Item label="Total desembolsado" value={cons.totalDisbursed} strong />
          </ul>
          {input.consortiumBidKind === 'embedded' ? (
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
            <Item label="Entrada" value={fin.downPayment} />
            <Item label="Principal financiado" value={fin.financedAmount} />
            <Item label="Juros" value={fin.totalInterest} />
            <Item label="Seguros" value={fin.totalInsurance} />
            <Item label="Tarifas e custos iniciais" value={fin.totalUpfrontFees} />
            <Item label="Outros custos mensais" value={fin.totalMonthlyExtras} />
            <Item label="Residual / balloon" value={fin.residual} />
            <Item label="Total desembolsado" value={fin.totalDisbursed} strong />
          </ul>
          <p className="mt-4 text-xs text-muted">
            Sistema {fin.system.toUpperCase()} · taxa{' '}
            {fin.rateSource === 'cet' ? 'CET' : 'de juros'} de{' '}
            {formatPct(fin.monthlyRate * 100, 4)} a.m. efetiva (
            {formatPct(fin.annualEffectiveRate * 100, 2)} a.a. efetiva).
          </p>
        </Card>
      </div>
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
