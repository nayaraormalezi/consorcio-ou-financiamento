import { formatBRL, formatPct, formatRateAnnual, formatRateMonthly } from '../calc/format'
import type { ComparisonResult, SimulatorInput } from '../calc/types'
import { Card } from './ui'

export function Premises({
  input,
  result,
}: {
  input: SimulatorInput
  result: ComparisonResult
}) {
  const fin = result.financing
  const cons = result.consortium

  return (
    <Card id="premissas">
      <h3 className="font-display text-xl font-medium">Como calculamos</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Simulação matemática no navegador. Condições reais variam conforme
        administradora, banco, contrato, seguros, tarifas, reajustes e sistema de
        amortização.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <h4 className="text-sm font-semibold tracking-wide text-cons uppercase">Consórcio</h4>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted">
            <li>
              Taxa de administração = {formatBRL(cons.creditValue)} ×{' '}
              {formatPct(input.consortiumAdminFeePct)} = {formatBRL(cons.adminFee)}.
            </li>
            <li>
              Fundo de reserva = {formatBRL(cons.creditValue)} ×{' '}
              {formatPct(input.consortiumReservePct)} = {formatBRL(cons.reserveFund)}.
            </li>
            <li>
              Saldo a diluir = crédito + taxa + fundo. Sem reajuste e sem lance, a
              parcela teórica é esse total dividido pelo prazo.
            </li>
            <li>
              Lance de {formatBRL(cons.bid)} no mês {input.contemplationMonth}
              {cons.bidKind === 'embedded'
                ? ': embutido — reduz a carta vigente e o saldo, sem sair do caixa.'
                : ': recursos próprios — sai do caixa e reduz o saldo. Não é desconto do custo.'}
              {input.consortiumBidMode === 'reduce_installment'
                ? ' O saldo restante é redistribuído nas parcelas do prazo original.'
                : ' A parcela teórica segue até zerar o saldo, encurtando o prazo.'}
              Carta estimada na contemplação: {formatBRL(cons.creditAtContemplation)}. Crédito
              utilizável nesta premissa: {formatBRL(cons.availableCredit)}.
            </li>
            <li>
              INPC no aniversário do grupo: {formatPct(input.consortiumAnnualAdjustmentPct)} a.a.
              estimado. Primeiro aniversário no mês {input.consortiumFirstAnniversaryMonth},
              depois a cada 12 meses.
              {input.consortiumAnnualAdjustmentPct === 0
                ? ' Com 0%, não há correção — cenário hipotético, não o comportamento usual do contrato.'
                : ` Nesta simulação o INPC foi aplicado ${cons.inpcApplications} ${cons.inpcApplications === 1 ? 'vez' : 'vezes'}: crédito e saldo remanescente sobem juntos. A carta vai de ${formatBRL(cons.creditValue)} para ${formatBRL(cons.finalCreditValue)}. Esse acréscimo no total pago não é juro: parte é correção do poder de compra.`}
            </li>
            <li>
              Não há juros de financiamento. O custo é taxa, fundo, seguro, adesão e correção pelo INPC.
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold tracking-wide text-fin uppercase">Financiamento</h4>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted">
            <li>
              Prazo do contrato = {fin.termMonths} meses (independente do grupo de
              consórcio, {input.termMonths} meses). Padrão de mercado para imóvel: 360
              meses; teto usual: 420.
            </li>
            <li>
              Valor financiado = crédito − entrada = {formatBRL(fin.financedAmount)}.
            </li>
            <li>
              Sistema {fin.system.toUpperCase()}. Taxa usada:{' '}
              {formatRateMonthly(fin.monthlyRate * 100)} efetiva, equivalente a{' '}
              {formatRateAnnual(fin.annualEffectiveRate * 100)} efetiva e{' '}
              {formatRateAnnual(fin.annualNominalRate * 100)} nominal.
              {fin.rateSource === 'cet' ? ' Origem: CET informado.' : ' Origem: taxa de juros informada.'}
            </li>
            <li>
              SAC: amortização constante = principal amortizável / prazo. Juros do
              mês = saldo inicial × taxa. Parcela = amortização + juros.
            </li>
            <li>
              Price: PMT = P × [i(1+i)ⁿ] / [(1+i)ⁿ − 1]. Com residual R, PMT usa
              P − R/(1+i)ⁿ e o saldo final permanece o balloon. Sem residual, a última
              parcela acerta o saldo.
            </li>
            <li>
              Entrada, IOF e tarifas iniciais saem no mês 0. Seguros e custos
              mensais somam-se a cada parcela
              {fin.extrasIncludedInCet ? ', exceto quando o CET já os inclui.' : '.'}
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-attention/30 bg-attention-soft px-4 py-4 text-sm leading-relaxed text-attention">
        O consórcio desta simulação é corrigido pelo INPC no aniversário do grupo,
        com a taxa anual que você informou. O INPC real varia todo ano e só é
        conhecido depois da divulgação do IBGE. Alguns grupos de imóveis usam INCC
        em vez de INPC — nesse caso, informe a estimativa do índice previsto no
        contrato.
      </div>

      <div className="mt-4 text-xs leading-relaxed text-muted">
        Limitações conscientes: não há modelagem de sorteio probabilístico; o mês
        de contemplação é premissa; o consórcio linear não replica a tabela da
        administradora; IOF, ITBI e cartório só entram se você preencher; o VP usa
        uma taxa de desconto única, sem inflação separada no financiamento prefixado.
      </div>
    </Card>
  )
}
