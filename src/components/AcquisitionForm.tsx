import type { ReactNode } from 'react'
import type { CreditTiming, SimulatorInput } from '../calc/types'
import { CurrencyInput } from './inputs'
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
        subtitle="Informe o valor do bem. O prazo do grupo fica na etapa do consórcio; o do empréstimo, na etapa do financiamento."
      />
      <div>
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
