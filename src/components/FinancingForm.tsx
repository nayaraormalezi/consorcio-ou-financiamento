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
import { Card, Field, Hint, OptionalBlock, Segmented, SectionTitle } from './ui'

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
        subtitle="Entrada, juros e sistema de amortização já bastam para comparar. Seguro e tarifas só aparecem se você ligar."
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Entrada"
          hint={`Equivale a ${formatBRL(input.downPayment)}. É parte do preço, paga no início.`}
          help="A entrada reduz o que você financia. Não é um custo extra do bem: é o pedaço que você paga à vista. O total desembolsado mostra a entrada separada das parcelas."
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
        <Field
          label="Sistema de amortização"
          help="SAC: você amortiza o mesmo valor todo mês; os juros caem e a parcela diminui com o tempo. Price: a parcela de juros + amortização fica estável. SAC costuma ter primeira parcela maior e menos juros no total."
        >
          <Segmented<AmortizationSystem>
            value={input.amortization}
            onChange={(amortization) => onChange({ amortization })}
            options={[
              { value: 'sac', label: 'SAC' },
              { value: 'price', label: 'Price' },
            ]}
          />
        </Field>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Field
          label="Taxa de juros"
          hint={`Usamos ${formatRateMonthly(input.rateMonthlyPct)} efetiva · equivalente ${annualLabel}.`}
          help="É o preço do dinheiro emprestado. Informe a taxa do contrato, de preferência a efetiva. Se você só tiver a anual, mude para % a.a. O simulador converte e calcula sempre com a taxa efetiva mensal."
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
          help="Nominal é a taxa mensal multiplicada por 12. Efetiva considera o juro sobre juro do ano: (1 + mensal)¹² − 1. Se o banco disser “12% a.a. nominal”, escolha nominal. Se disser “taxa efetiva”, escolha efetiva."
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

      <div className="mt-6">
        <Field
          label="Taxa de desconto para valor presente"
          hint="Não muda o total desembolsado. Só a conta de “quanto isso vale hoje”."
          help="O total desembolsado soma os reais do contrato. O valor presente pergunta o equivalente em dinheiro de hoje, porque R$ 1.000 daqui a 10 anos não pesam igual a R$ 1.000 agora. Esta taxa é o rendimento que você imagina que o dinheiro teria se ficasse aplicado. Quanto maior, mais as parcelas futuras “encolhem” nessa lente."
        >
          <PercentInput
            value={input.discountAnnualPct}
            onChange={(discountAnnualPct) => onChange({ discountAnnualPct })}
          />
        </Field>
      </div>

      <div className="mt-6 space-y-4">
        <OptionalBlock
          enabled={input.useCet}
          onToggle={(useCet) => onChange({ useCet })}
          label="Quero usar o CET"
          description="Use se o banco informou o Custo Efetivo Total."
          help="O CET junta juros, tarifas e parte dos seguros numa taxa só. Se você preencher o CET, o simulador usa essa taxa e pode deixar de somar de novo os custos que já estão dentro dele."
        >
          <div className="grid gap-4 sm:grid-cols-2">
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
          </div>
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              className="mt-1"
              checked={input.cetIncludesExtras}
              onChange={(event) => onChange({ cetIncludesExtras: event.target.checked })}
            />
            <span className="text-sm text-muted">
              Este CET já inclui seguros e tarifas. Não some esses custos outra vez.
            </span>
          </label>
        </OptionalBlock>

        <OptionalBlock
          enabled={input.financingHasInsurance}
          onToggle={(financingHasInsurance) => onChange({ financingHasInsurance })}
          label="Tem seguro mensal"
          description="Prestamista, MIP, DFI ou outro seguro cobrado todo mês."
          help="Bancos costumam incluir seguro na parcela. Se a simulação do banco já veio “limpa”, sem seguro, deixe desligado. Se o CET já inclui seguro, ligue o CET e marque que ele já cobre esses custos."
        >
          <Field label="Seguro por mês">
            <CurrencyInput
              value={input.financingInsuranceMonthly}
              onChange={(financingInsuranceMonthly) =>
                onChange({ financingInsuranceMonthly })
              }
            />
          </Field>
        </OptionalBlock>

        <OptionalBlock
          enabled={input.financingHasOtherCosts}
          onToggle={(financingHasOtherCosts) => onChange({ financingHasOtherCosts })}
          label="Tem outras taxas e custos"
          description="Cadastro, avaliação, registro, IOF e extras mensais."
          help="São custos além dos juros: tarifa de cadastro, avaliação do bem, cartório, IOF e qualquer outro valor que o banco cobre. Preencha só o que aparecer na proposta. Se o CET já inclui isso, não preencha aqui."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tarifa de cadastro" help="Cobrança única na contratação, se houver.">
              <CurrencyInput
                value={input.originationFee}
                onChange={(originationFee) => onChange({ originationFee })}
              />
            </Field>
            <Field label="Taxa de avaliação" help="Custo para o banco avaliar o imóvel ou o bem.">
              <CurrencyInput
                value={input.appraisalFee}
                onChange={(appraisalFee) => onChange({ appraisalFee })}
              />
            </Field>
            <Field label="Registro / documentação" help="Cartório, ITBI estimado ou despachante, se você quiser incluir.">
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
            <Field label="Outros custos mensais" help="Qualquer tarifa recorrente que não seja seguro nem juros.">
              <CurrencyInput
                value={input.financingOtherMonthly}
                onChange={(financingOtherMonthly) => onChange({ financingOtherMonthly })}
              />
            </Field>
          </div>
        </OptionalBlock>

        <OptionalBlock
          enabled={input.financingHasResidual}
          onToggle={(financingHasResidual) => onChange({ financingHasResidual })}
          label="Tem valor residual"
          description="Saldo pago no fim do contrato, comum em alguns veículos."
          help="Alguns financiamentos deixam uma bola (balloon) para o último mês. Se o seu contrato quita tudo ao longo do prazo, deixe desligado."
        >
          <Field label="Valor residual">
            <CurrencyInput
              value={input.residualValue}
              onChange={(residualValue) => onChange({ residualValue })}
            />
          </Field>
        </OptionalBlock>
      </div>

      {input.useCet && input.cetIncludesExtras ? (
        <div className="mt-4">
          <Hint>
            CET ativo: seguros e tarifas desta tela não entram de novo no fluxo,
            para não duplicar o que já está no CET.
          </Hint>
        </div>
      ) : null}
      {footer}
    </Card>
  )
}
