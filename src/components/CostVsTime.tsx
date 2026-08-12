import { formatBRL, formatCompactMonths } from '../calc/format'
import type { ComparisonResult, SimulatorInput } from '../calc/types'
import { Accordion } from './ui'

const TIMING_COPY = {
  immediate: 'Você indicou que precisa do bem imediatamente.',
  '6m': 'Você indicou que pode esperar até 6 meses.',
  '1y': 'Você indicou que pode esperar até 1 ano.',
  flexible: 'Você indicou flexibilidade de prazo para usar o crédito.',
} as const

export function CostVsTime({
  input,
  result,
}: {
  input: SimulatorInput
  result: ComparisonResult
}) {
  const wait = input.contemplationMonth
  const cheaper = result.cheaperNominal
  const summary =
    cheaper === 'tie'
      ? 'Neste cenário o total pago das duas opções fica muito próximo. O financiamento libera o bem no início; o consórcio, só na contemplação simulada.'
      : cheaper === 'consortium'
        ? 'Embora o consórcio apresente menor custo total estimado, o financiamento permite acesso imediato ao bem.'
        : 'Embora o financiamento apresente menor custo total estimado, o consórcio só libera o crédito na contemplação simulada.'

  const mismatch =
    input.creditTiming === 'immediate' && wait > 1
      ? 'Há um descompasso: você quer o bem agora, mas a contemplação simulada (hipótese, não previsão) está depois do primeiro mês. O financiamento, se aprovado, costuma entregar o bem no início.'
      : input.creditTiming === 'flexible' && wait === 1
        ? 'Você pode esperar, mas a simulação usa contemplação no 1º mês — hipótese otimista para o consórcio, não uma previsão.'
        : null

  return (
    <section id="custo-tempo" aria-labelledby="custo-tempo-titulo">
      <h3 id="custo-tempo-titulo" className="font-display text-xl font-semibold tracking-tight">
        Custo × tempo
      </h3>
      <p className="mt-2 max-w-3xl text-base leading-relaxed text-ink">{summary}</p>
      <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-cons">Consórcio</dt>
          <dd className="mt-1 font-medium">{formatBRL(result.consortium.totalDisbursed)}</dd>
          <dd className="mt-1 text-muted">
            Crédito no mês {result.consortium.creditAvailableMonth} ·{' '}
            {formatCompactMonths(result.consortium.creditAvailableMonth)}
          </dd>
        </div>
        <div>
          <dt className="text-fin">Financiamento</dt>
          <dd className="mt-1 font-medium">{formatBRL(result.financing.totalDisbursed)}</dd>
          <dd className="mt-1 text-muted">Crédito no mês 0 · imediato</dd>
        </div>
      </dl>

      <Accordion title="Entender a análise" subtitle="Valor presente, urgência informada e o que a planilha não decide.">
        <p className="text-sm leading-relaxed text-muted">
          Comparar só o total pago ignora uma diferença estrutural: no financiamento o bem em
          geral está disponível no início (sujeito à aprovação). No consórcio, o acesso depende
          de contemplação por sorteio ou lance.
        </p>
        <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <p>
            <span className="font-medium text-fin">Financiamento.</span> Acesso típico ao bem no
            início, se houver aprovação. Você começa a pagar juros imediatamente. Contrato:{' '}
            {formatCompactMonths(result.financing.termMonths)}
            {result.financing.termMonths !== input.termMonths
              ? ` — prazo de mercado, diferente dos ${formatCompactMonths(input.termMonths)} do consórcio.`
              : '.'}{' '}
            Desembolso {formatBRL(result.financing.totalDisbursed)} · valor presente dos
            pagamentos {formatBRL(result.financing.npv)}.
          </p>
          <p>
            <span className="font-medium text-cons">Consórcio.</span> Nesta simulação o crédito é
            usado no mês {wait} ({formatCompactMonths(wait)}). Até lá você já paga parcelas, sem
            ter o bem. Desembolso {formatBRL(result.consortium.totalDisbursed)} · valor presente
            dos pagamentos {formatBRL(result.consortium.npv)}.
          </p>
        </div>
        <p className="mt-4 text-sm text-ink">{TIMING_COPY[input.creditTiming]}</p>
        {mismatch ? (
          <p className="mt-2 text-sm text-attention">{mismatch}</p>
        ) : null}

        <p className="mt-5 text-sm font-medium text-ink">
          Fatores não financeiros que a planilha não decide por você
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
          <li>Urgência de uso do bem e custo de alugar enquanto espera.</li>
          <li>Aprovação de crédito, restrições e relacionamento bancário.</li>
          <li>Disciplina de poupança versus endividamento com juros.</li>
          <li>INPC no aniversário do grupo (crédito e parcela sobem juntos).</li>
          <li>Liquidez: o lance exige dinheiro disponível na contemplação.</li>
        </ul>

        <p className="mt-5 mb-2 text-sm font-medium">Total pago × valor presente</p>
        <p className="mb-3 text-sm leading-relaxed text-muted">
          <strong className="font-medium text-ink">Total pago</strong> é a soma do que sai da
          conta. <strong className="font-medium text-ink">Valor presente</strong> é essa mesma
          soma, convertida para hoje com {input.discountAnnualPct.toLocaleString('pt-BR')}% a.a.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-muted">
                <th className="py-2 font-medium">Métrica</th>
                <th className="py-2 font-medium text-cons">Consórcio</th>
                <th className="py-2 font-medium text-fin">Financiamento</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-line/80">
                <td className="py-2 text-muted">Total nominal</td>
                <td>{formatBRL(result.consortium.totalDisbursed)}</td>
                <td>{formatBRL(result.financing.totalDisbursed)}</td>
              </tr>
              <tr>
                <td className="py-2 text-muted">Valor presente</td>
                <td>{formatBRL(result.consortium.npv)}</td>
                <td>{formatBRL(result.financing.npv)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm">
          {result.metricsDisagree
            ? 'Total nominal e valor presente apontam para lados diferentes neste cenário. O INPC empurra dinheiro do consórcio para o futuro; o financiamento prefixado concentra juros no começo.'
            : result.cheaperNpv === 'tie'
              ? 'No valor presente, as duas opções ficam muito próximas neste cenário.'
              : `No valor presente, ${result.cheaperNpv === 'consortium' ? 'o consórcio' : 'o financiamento'} desembolsaria menos — a mesma leitura do total nominal neste cenário.`}
        </p>
      </Accordion>
    </section>
  )
}
