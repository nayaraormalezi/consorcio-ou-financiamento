import type { ReactNode } from 'react'
import { formatBRL } from '../calc/format'
import type { BidKind, BidMode, InsuranceMode, SimulatorInput } from '../calc/types'
import { CurrencyInput, IntegerInput, PercentInput } from './inputs'
import { Card, Field, Hint, Segmented, SectionTitle } from './ui'

export function ConsortiumForm({
  input,
  onChange,
  footer,
}: {
  input: SimulatorInput
  onChange: (patch: Partial<SimulatorInput>) => void
  footer?: ReactNode
}) {
  return (
    <Card id="consorcio">
      <SectionTitle
        step="Etapa 2 · Consórcio"
        title="Condições do consórcio"
        subtitle="Crédito + taxa de administração + fundo de reserva, diluídos no prazo. O INPC corrige crédito e parcela no aniversário do grupo."
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Taxa de administração total"
          hint="% sobre o valor do crédito, cobrada ao longo do plano — não é juros."
        >
          <PercentInput
            value={input.consortiumAdminFeePct}
            onChange={(consortiumAdminFeePct) => onChange({ consortiumAdminFeePct })}
          />
        </Field>
        <Field
          label="Fundo de reserva total"
          hint="% sobre o crédito para cobrir inadimplência e eventuais despesas do grupo."
        >
          <PercentInput
            value={input.consortiumReservePct}
            onChange={(consortiumReservePct) => onChange({ consortiumReservePct })}
          />
        </Field>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Field label="Lance" hint={`Equivalente a ${formatBRL(input.consortiumBid)}.`}>
          <div className="grid grid-cols-2 gap-2">
            <CurrencyInput
              value={input.consortiumBid}
              onChange={(consortiumBid) =>
                onChange({ consortiumBid, consortiumBidLastEdited: 'money' })
              }
            />
            <PercentInput
              value={input.consortiumBidPct}
              onChange={(consortiumBidPct) =>
                onChange({ consortiumBidPct, consortiumBidLastEdited: 'pct' })
              }
            />
          </div>
        </Field>
        <Field
          label="Mês estimado de contemplação"
          hint="O lance entra no fluxo neste mês. É uma premissa sua, não uma previsão."
        >
          <IntegerInput
            value={input.contemplationMonth}
            onChange={(contemplationMonth) => onChange({ contemplationMonth })}
            min={1}
            max={input.termMonths}
          />
        </Field>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <Field label="Como o lance reduz o saldo">
          <Segmented<BidMode>
            value={input.consortiumBidMode}
            onChange={(consortiumBidMode) => onChange({ consortiumBidMode })}
            options={[
              { value: 'reduce_installment', label: 'Reduz parcelas' },
              { value: 'reduce_term', label: 'Reduz prazo' },
            ]}
          />
        </Field>
        <Field label="Tipo de lance">
          <Segmented<BidKind>
            value={input.consortiumBidKind}
            onChange={(consortiumBidKind) => onChange({ consortiumBidKind })}
            options={[
              { value: 'own', label: 'Recursos próprios' },
              { value: 'embedded', label: 'Embutido' },
            ]}
          />
        </Field>
      </div>
      <div className="mt-3">
        <Hint>
          Premissa desta versão: o lance aparece uma única vez no desembolso, na
          contemplação, e abate o saldo a pagar. Em lance embutido, o crédito
          disponível para compra cai no valor do lance — para adquirir o mesmo bem,
          você ainda precisa complementar com recursos próprios. Contratos reais
          podem misturar redução de prazo e de parcela.
        </Hint>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Field
          label="INPC estimado no aniversário do grupo"
          hint="O crédito e as parcelas são corrigidos pelo INPC a cada aniversário, não mês a mês. Este % é uma estimativa futura — o índice real é divulgado pelo IBGE."
        >
          <PercentInput
            value={input.consortiumAnnualAdjustmentPct}
            onChange={(consortiumAnnualAdjustmentPct) =>
              onChange({ consortiumAnnualAdjustmentPct })
            }
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {[0, 3.5, 4.5, 6, 8].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => onChange({ consortiumAnnualAdjustmentPct: pct })}
                className={`rounded-full border px-3 py-1 text-sm ${
                  input.consortiumAnnualAdjustmentPct === pct
                    ? 'border-cons bg-cons-soft text-cons'
                    : 'border-line bg-white'
                }`}
              >
                {pct.toLocaleString('pt-BR')}%
              </button>
            ))}
          </div>
        </Field>
        <Field
          label="Mês do primeiro aniversário"
          hint="Padrão: mês 13 (após 12 meses no grupo). Se você entra em um grupo já formado, informe em quantos meses cai o próximo aniversário."
        >
          <IntegerInput
            value={input.consortiumFirstAnniversaryMonth}
            onChange={(consortiumFirstAnniversaryMonth) =>
              onChange({ consortiumFirstAnniversaryMonth })
            }
            min={1}
            max={input.termMonths + 12}
          />
        </Field>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Field label="Seguro do consórcio" hint="Campo opcional.">
          <Segmented<InsuranceMode>
            value={input.consortiumInsuranceMode}
            onChange={(consortiumInsuranceMode) => onChange({ consortiumInsuranceMode })}
            options={[
              { value: 'none', label: 'Sem seguro' },
              { value: 'monthly', label: 'R$ / mês' },
              { value: 'percent', label: '% do crédito / mês' },
            ]}
          />
          {input.consortiumInsuranceMode === 'monthly' ? (
            <div className="mt-2">
              <CurrencyInput
                value={input.consortiumInsuranceMonthly}
                onChange={(consortiumInsuranceMonthly) =>
                  onChange({ consortiumInsuranceMonthly })
                }
              />
            </div>
          ) : null}
          {input.consortiumInsuranceMode === 'percent' ? (
            <div className="mt-2">
              <PercentInput
                value={input.consortiumInsurancePct}
                onChange={(consortiumInsurancePct) =>
                  onChange({ consortiumInsurancePct })
                }
              />
            </div>
          ) : null}
        </Field>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Field label="Taxa de adesão (opcional)" hint="Custo inicial, se houver.">
          <CurrencyInput
            value={input.consortiumMembershipFee}
            onChange={(consortiumMembershipFee) => onChange({ consortiumMembershipFee })}
          />
        </Field>
        <Field label="Outros custos mensais (opcional)">
          <CurrencyInput
            value={input.consortiumOtherMonthly}
            onChange={(consortiumOtherMonthly) => onChange({ consortiumOtherMonthly })}
          />
        </Field>
      </div>
      {footer}
    </Card>
  )
}
