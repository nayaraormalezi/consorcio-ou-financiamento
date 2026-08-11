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
        subtitle="Este valor é a referência das duas modalidades: o bem ou crédito que você quer comparar."
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Valor desejado"
          hint="Valor do crédito/bem usado na comparação."
        >
          <CurrencyInput
            value={input.creditValue}
            onChange={(creditValue) => onChange({ creditValue })}
          />
        </Field>
        <Field label="Prazo" hint={formatCompactMonths(input.termMonths)}>
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
          hint="Indicador qualitativo. Não altera o cálculo financeiro — use o mês de contemplação no consórcio para o fluxo de caixa."
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
