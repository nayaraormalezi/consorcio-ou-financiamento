import type { ReactNode } from 'react'
import { CREDIT_VALUE_PRESETS } from '../calc/defaults'
import type { CreditTiming, SimulatorInput } from '../calc/types'
import { CurrencyInput } from './inputs'
import { Card, Field, Segmented, SectionTitle } from './ui'

function formatPreset(value: number): string {
  if (value >= 1_000_000) {
    const millions = value / 1_000_000
    return millions % 1 === 0 ? `R$ ${millions} mi` : `R$ ${millions.toLocaleString('pt-BR')} mi`
  }
  return `R$ ${(value / 1_000).toLocaleString('pt-BR')} mil`
}

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
        subtitle="Informe o valor do bem. O prazo do grupo fica na etapa do consórcio; o do empréstimo, na etapa do financiamento."
      />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] lg:items-start">
        <Field
          label="Valor desejado"
          hint="Preço do bem ou crédito que você busca."
          help="É o valor de referência da comparação. Nas duas modalidades usamos o mesmo número para a comparação ser justa: o carro, o imóvel ou o crédito que você quer adquirir."
        >
          <CurrencyInput
            value={input.creditValue}
            onChange={(creditValue) => onChange({ creditValue })}
            className="max-w-[18rem] font-display text-2xl font-semibold tracking-tight"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {CREDIT_VALUE_PRESETS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => onChange({ creditValue: value })}
                className={`rounded-full border px-3 py-1.5 text-sm transition ${
                  input.creditValue === value
                    ? 'border-primary bg-primary text-white'
                    : 'border-line bg-white text-ink hover:border-primary'
                }`}
              >
                {formatPreset(value)}
              </button>
            ))}
          </div>
        </Field>
        <Field
          label="Quando espera utilizar o crédito?"
          hint="Isso ajuda a interpretar o resultado. O mês exato da contemplação fica na etapa do consórcio."
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
