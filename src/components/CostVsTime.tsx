import { formatBRL, formatCompactMonths } from '../calc/format'
import type { ComparisonResult, SimulatorInput } from '../calc/types'
import { Card } from './ui'

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
  const mismatch =
    input.creditTiming === 'immediate' && wait > 1
      ? 'Há um descompasso: você quer o bem agora, mas a contemplação simulada (hipótese, não previsão) está depois do primeiro mês. O financiamento, se aprovado, costuma entregar o bem no início.'
      : input.creditTiming === 'flexible' && wait === 1
        ? 'Você pode esperar, mas a simulação usa contemplação no 1º mês — hipótese otimista para o consórcio, não uma previsão.'
        : null

  return (
    <Card id="custo-tempo">
      <h3 className="font-display text-xl font-medium">Custo × tempo</h3>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">
        Comparar só o total pago ignora uma diferença estrutural: no financiamento o
        bem em geral está disponível no início (sujeito à aprovação). No consórcio, o
        acesso depende de contemplação por sorteio ou lance.
      </p>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-fin/20 bg-fin-soft/50 p-4">
          <p className="text-xs font-semibold tracking-wide text-fin uppercase">Financiamento</p>
          <p className="mt-2 text-sm leading-relaxed">
            Acesso típico ao bem no início da operação, se houver aprovação de crédito.
            Você começa a pagar juros imediatamente sobre o saldo. O contrato
            desta simulação tem {formatCompactMonths(result.financing.termMonths)}
            {result.financing.termMonths !== input.termMonths
              ? ` — prazo de mercado, diferente dos ${formatCompactMonths(input.termMonths)} do consórcio.`
              : '.'}
          </p>
          <p className="mt-3 text-sm font-medium">
            Crédito disponível: mês 0 (imediato)
          </p>
          <p className="mt-1 text-sm font-medium">
            Desembolso total {formatBRL(result.financing.totalDisbursed)} · valor presente
            dos pagamentos {formatBRL(result.financing.npv)}
          </p>
        </div>
        <div className="rounded-2xl border border-cons/20 bg-cons-soft/60 p-4">
          <p className="text-xs font-semibold tracking-wide text-cons uppercase">Consórcio</p>
          <p className="mt-2 text-sm leading-relaxed">
            Nesta simulação, o crédito é usado no mês {wait} (
            {formatCompactMonths(wait)}). Até lá você já paga parcelas, sem ter o bem.
            Não há garantia de contemplação nessa data.
          </p>
          <p className="mt-3 text-sm font-medium">
            Crédito disponível: mês {result.consortium.creditAvailableMonth} · tempo até o
            crédito: {formatCompactMonths(result.consortium.creditAvailableMonth)}
          </p>
          <p className="mt-1 text-sm font-medium">
            Desembolso total {formatBRL(result.consortium.totalDisbursed)} · valor presente
            dos pagamentos {formatBRL(result.consortium.npv)}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <p className="text-sm text-ink">{TIMING_COPY[input.creditTiming]}</p>
        {mismatch ? (
          <p className="mt-2 rounded-xl bg-attention-soft px-3 py-2 text-sm text-attention">{mismatch}</p>
        ) : null}
      </div>

      <div className="mt-5 rounded-2xl bg-paper px-4 py-4 text-sm leading-relaxed text-muted">
        <p className="font-medium text-ink">Fatores não financeiros que a planilha não decide por você</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Urgência de uso do bem e custo de alugar enquanto espera.</li>
          <li>Aprovação de crédito, restrições e relacionamento bancário.</li>
          <li>Disciplina de poupança versus endividamento com juros.</li>
          <li>INPC no aniversário do grupo (crédito e parcela sobem juntos).</li>
          <li>Liquidez: o lance exige dinheiro disponível na contemplação.</li>
        </ul>
      </div>

      <div className="mt-5 overflow-x-auto">
        <p className="mb-2 text-sm font-medium">Total desembolsado × valor presente</p>
        <p className="mb-3 text-sm leading-relaxed text-muted">
          <strong className="font-medium text-ink">Total desembolsado</strong> é a soma do que
          sai da conta. <strong className="font-medium text-ink">Valor presente</strong> é essa
          mesma soma, convertida para hoje com {input.discountAnnualPct.toLocaleString('pt-BR')}%
          a.a.: pagar daqui a vários anos pesa menos do que pagar no começo. Os dois números
          respondem perguntas diferentes; um não substitui o outro.
        </p>
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
        <p className="mt-3 text-sm">
          {result.metricsDisagree
            ? 'Total nominal e valor presente apontam para lados diferentes neste cenário. O INPC empurra dinheiro do consórcio para o futuro; o financiamento prefixado concentra juros no começo.'
            : result.cheaperNpv === 'tie'
              ? 'No valor presente, as duas opções ficam muito próximas neste cenário.'
              : `No valor presente, ${result.cheaperNpv === 'consortium' ? 'o consórcio' : 'o financiamento'} desembolsaria menos — a mesma leitura do total nominal neste cenário.`}
        </p>
      </div>
    </Card>
  )
}
