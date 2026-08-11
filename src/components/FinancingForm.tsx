import type { ReactNode } from 'react'
import { formatBRL, formatRateAnnual, formatRateMonthly } from '../calc/format'
import { effectiveAnnualFromMonthly, pctToRate, rateToPct } from '../calc/rates'
import type {
  AmortizationSystem,
  AnnualRateKind,
  RateInputMode,
  SimulatorInput,
} from '../calc/types'
import { CurrencyInput, PercentInput } from './inputs'
import { Card, Field, Hint, Segmented, SectionTitle } from './ui'

export function FinancingForm({
  input,
  onChange,
  footer,
}: {
  input: SimulatorInput
  onChange: (patch: Partial<SimulatorInput>) => void
  footer?: ReactNode
}) {
  const annualLabel =
    input.annualRateKind === 'effective'
      ? formatRateAnnual(input.rateAnnualPct)
      : formatRateAnnual(input.rateMonthlyPct * 12)

  return (
    <Card id="financiamento">
      <SectionTitle
        step="Etapa 3 · Financiamento"
        title="Condições do financiamento"
        subtitle="Cálculo com amortização SAC ou Price. A taxa efetiva mensal é a usada nas fórmulas."
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Entrada"
          hint={`Equivalente a ${formatBRL(input.downPayment)}. É desembolso inicial, não um custo extra do bem.`}
        >
          <div className="grid grid-cols-2 gap-2">
            <CurrencyInput
              value={input.downPayment}
              onChange={(downPayment) =>
                onChange({ downPayment, downPaymentLastEdited: 'money' })
              }
            />
            <PercentInput
              value={input.downPaymentPct}
              onChange={(downPaymentPct) =>
                onChange({ downPaymentPct, downPaymentLastEdited: 'pct' })
              }
            />
          </div>
        </Field>
        <Field label="Sistema de amortização">
          <Segmented<AmortizationSystem>
            value={input.amortization}
            onChange={(amortization) => onChange({ amortization })}
            options={[
              { value: 'sac', label: 'SAC' },
              { value: 'price', label: 'Price' },
            ]}
          />
          <p className="mt-2 text-xs text-muted">
            SAC: amortização constante e parcela decrescente. Price: parcela de
            amortização + juros constante (antes de seguros).
          </p>
        </Field>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Field
          label="Taxa de juros"
          hint={`Cálculo usa ${formatRateMonthly(input.rateMonthlyPct)} efetiva · equivalente ${annualLabel}.`}
        >
          <Segmented<RateInputMode>
            value={input.rateInputMode}
            onChange={(rateInputMode) => onChange({ rateInputMode })}
            options={[
              { value: 'monthly', label: '% a.m.' },
              { value: 'annual', label: '% a.a.' },
            ]}
          />
          <div className="mt-2">
            {input.rateInputMode === 'monthly' ? (
              <PercentInput
                value={input.rateMonthlyPct}
                onChange={(rateMonthlyPct) =>
                  onChange({
                    rateMonthlyPct,
                    rateInputMode: 'monthly',
                    rateAnnualPct: rateToPct(
                      effectiveAnnualFromMonthly(pctToRate(rateMonthlyPct)),
                    ),
                  })
                }
              />
            ) : (
              <PercentInput
                value={input.rateAnnualPct}
                onChange={(rateAnnualPct) =>
                  onChange({ rateAnnualPct, rateInputMode: 'annual' })
                }
              />
            )}
          </div>
        </Field>
        <Field
          label="Tipo da taxa anual"
          hint="Nominal = 12 × mensal. Efetiva = (1 + mensal)¹² − 1. Sempre calculamos com a efetiva mensal."
        >
          <Segmented<AnnualRateKind>
            value={input.annualRateKind}
            onChange={(annualRateKind) => onChange({ annualRateKind })}
            options={[
              { value: 'effective', label: 'Efetiva' },
              { value: 'nominal', label: 'Nominal' },
            ]}
          />
        </Field>
      </div>

      <div className="mt-6 rounded-2xl border border-line p-4">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            className="mt-1"
            checked={input.useCet}
            onChange={(event) => onChange({ useCet: event.target.checked })}
          />
          <span>
            <span className="block text-sm font-medium">Usar CET no lugar da taxa de juros</span>
            <span className="text-xs text-muted">
              O CET já embute juros, tarifas e parte dos seguros. Se marcado, o
              simulador usa o CET como taxa e evita somar de novo os custos inclusos.
            </span>
          </span>
        </label>
        {input.useCet ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="CET mensal">
              <PercentInput
                value={input.cetMonthlyPct}
                onChange={(cetMonthlyPct) =>
                  onChange({ cetMonthlyPct, cetInputMode: 'monthly' })
                }
              />
            </Field>
            <Field label="CET anual">
              <PercentInput
                value={input.cetAnnualPct}
                onChange={(cetAnnualPct) =>
                  onChange({ cetAnnualPct, cetInputMode: 'annual' })
                }
              />
            </Field>
            <label className="flex items-start gap-3 sm:col-span-2">
              <input
                type="checkbox"
                className="mt-1"
                checked={input.cetIncludesExtras}
                onChange={(event) =>
                  onChange({ cetIncludesExtras: event.target.checked })
                }
              />
              <span className="text-sm text-muted">
                O CET informado já inclui seguros, tarifa de cadastro, avaliação e
                demais taxas desta seção.
              </span>
            </label>
          </div>
        ) : null}
      </div>

      <h3 className="mt-8 mb-3 text-sm font-semibold tracking-wide text-muted uppercase">
        Seguros e demais custos
      </h3>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Seguro mensal">
          <CurrencyInput
            value={input.financingInsuranceMonthly}
            onChange={(financingInsuranceMonthly) =>
              onChange({ financingInsuranceMonthly })
            }
          />
        </Field>
        <Field label="Outros custos mensais">
          <CurrencyInput
            value={input.financingOtherMonthly}
            onChange={(financingOtherMonthly) => onChange({ financingOtherMonthly })}
          />
        </Field>
        <Field label="Tarifa de cadastro">
          <CurrencyInput
            value={input.originationFee}
            onChange={(originationFee) => onChange({ originationFee })}
          />
        </Field>
        <Field label="Taxa de avaliação">
          <CurrencyInput
            value={input.appraisalFee}
            onChange={(appraisalFee) => onChange({ appraisalFee })}
          />
        </Field>
        <Field label="Registro / documentação">
          <CurrencyInput
            value={input.registryFee}
            onChange={(registryFee) => onChange({ registryFee })}
          />
        </Field>
        <Field label="IOF e outras taxas iniciais">
          <CurrencyInput
            value={input.otherUpfront}
            onChange={(otherUpfront) => onChange({ otherUpfront })}
          />
        </Field>
        <Field
          label="Valor residual / balloon (opcional)"
          hint="Saldo pago no último mês. Comum em alguns contratos de veículos. 0 = quitação total no prazo."
        >
          <CurrencyInput
            value={input.residualValue}
            onChange={(residualValue) => onChange({ residualValue })}
          />
        </Field>
        <Field
          label="Taxa de desconto para valor presente"
          hint="Custo de oportunidade anual efetivo. Usada só no VP, não altera o total nominal."
        >
          <PercentInput
            value={input.discountAnnualPct}
            onChange={(discountAnnualPct) => onChange({ discountAnnualPct })}
          />
        </Field>
      </div>
      {input.useCet && input.cetIncludesExtras ? (
        <div className="mt-4">
          <Hint>
            CET ativo: seguros e tarifas desta seção não entram de novo no fluxo,
            para não duplicar o que já está no CET.
          </Hint>
        </div>
      ) : null}
      {footer}
    </Card>
  )
}
