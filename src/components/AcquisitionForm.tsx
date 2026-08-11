import type { ReactNode } from 'react'
import { TERM_PRESETS } from '../calc/defaults'
import { formatCompactMonths } from '../calc/format'
import type { CreditTiming, SimulatorInput } from '../calc/types'
import { CurrencyInput, IntegerInput } from './inputs'
import { Card, Field, Segmented, SectionTitle } from './ui'

export function AcquisitionForm({
  input,
  onChange,
  footer,
}: {
  input: SimulatorInput
  onChange: (patch: Partial<SimulatorInput>) => void
  footer?: ReactNode
}) {
  return (
    <Card id="aquisicao">
      <SectionTitle
        step="Etapa 1"
        title="Quanto você precisa?"
        subtitle="Informe o valor do bem e em quanto tempo pretende pagar. Os números desta tela são um ponto de partida — você pode mudar tudo."
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Valor desejado"
          hint="Use o preço do bem ou o crédito que você busca."
          help="É o valor de referência da comparação. Nas duas modalidades usamos o mesmo número para a comparação ser justa: o carro, o imóvel ou o crédito que você quer adquirir."
        >
          <CurrencyInput
            value={input.creditValue}
            onChange={(creditValue) => onChange({ creditValue })}
          />
        </Field>
        <Field
          label="Prazo"
          hint={formatCompactMonths(input.termMonths)}
          help="Quantos meses o contrato duraria. No consórcio é o prazo do grupo. No financiamento é o tempo para quitar o empréstimo. Prazos maiores diminuem a parcela e aumentam o total pago."
        >
          <IntegerInput
            value={input.termMonths}
            onChange={(termMonths) => onChange({ termMonths })}
            min={1}
            max={420}
          />
        </Field>
      </div>
      <div className="mt-4">
        <p className="mb-2 text-xs font-medium tracking-wide text-muted uppercase">
          Seleção rápida de prazo
        </p>
        <div className="flex flex-wrap gap-2">
          {TERM_PRESETS.map((months) => (
            <button
              key={months}
              type="button"
              onClick={() => onChange({ termMonths: months })}
              className={`rounded-full border px-3 py-1.5 text-sm transition ${
                input.termMonths === months
                  ? 'border-primary bg-primary text-white'
                  : 'border-line bg-white text-ink hover:border-primary'
              }`}
            >
              {months} meses
            </button>
          ))}
        </div>
      </div>
      <div className="mt-6">
        <Field
          label="Quando espera utilizar o crédito?"
          hint="Isso ajuda a interpretar o resultado. O mês exato da contemplação você informa na etapa do consórcio, se quiser."
          help="No financiamento, se houver aprovação, o bem costuma ficar disponível no início. No consórcio, você só usa o crédito quando for contemplado por sorteio ou lance. Esta pergunta não inventa uma data — só deixa claro se a espera importa para você."
        >
          <Segmented<CreditTiming>
            value={input.creditTiming}
            onChange={(creditTiming) => onChange({ creditTiming })}
            options={[
              { value: 'immediate', label: 'Imediatamente' },
              { value: '6m', label: 'Até 6 meses' },
              { value: '1y', label: 'Até 1 ano' },
              { value: 'flexible', label: 'Posso esperar' },
            ]}
          />
        </Field>
      </div>
      {footer}
    </Card>
  )
}
