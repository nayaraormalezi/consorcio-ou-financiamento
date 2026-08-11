import type { ReactNode } from 'react'
import { formatBRL } from '../calc/format'
import type { BidKind, BidMode, InsuranceMode, SimulatorInput } from '../calc/types'
import { CurrencyInput, IntegerInput, PercentInput } from './inputs'
import { Card, Field, OptionalBlock, Segmented, SectionTitle } from './ui'

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
        subtitle="Preencha o essencial. Lance, seguro e taxas extras só aparecem se você disser que existem."
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Taxa de administração total"
          hint="Não é juros. É a remuneração da administradora, diluída no prazo."
          help="A administradora cobra um percentual sobre o crédito para organizar o grupo. Se a taxa é 20% e o crédito é R$ 300.000, isso vira R$ 60.000 ao longo do plano — não um juro que incide todo mês sobre o saldo."
        >
          <PercentInput
            value={input.consortiumAdminFeePct}
            onChange={(consortiumAdminFeePct) => onChange({ consortiumAdminFeePct })}
          />
        </Field>
        <Field
          label="Fundo de reserva total"
          hint="Colchão do grupo para inadimplência e despesas extras."
          help="Um percentual pequeno do crédito, também diluído nas parcelas. Serve para o grupo não quebrar se alguém atrasar. Em alguns contratos, o que sobrar pode ser devolvido no encerramento."
        >
          <PercentInput
            value={input.consortiumReservePct}
            onChange={(consortiumReservePct) => onChange({ consortiumReservePct })}
          />
        </Field>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Field
          label="INPC estimado no aniversário do grupo"
          hint="Corrige crédito e parcela uma vez por ano, não todo mês."
          help="Todo ano, no aniversário do grupo, o contrato reajusta o crédito e as parcelas pelo INPC. O índice real só é conhecido depois que o IBGE divulga. Aqui você informa uma estimativa para o futuro. 0% seria um cenário sem correção, pouco usual."
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
          hint="Padrão: mês 13, depois de um ano no grupo."
          help="Se você entra num grupo novo, o primeiro reajuste costuma cair após 12 meses (mês 13). Se o grupo já existe, informe em quantos meses será o próximo aniversário."
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

      <div className="mt-6">
        <Field
          label="Mês estimado de contemplação"
          hint="Quando você acha que vai usar o crédito. Não é uma previsão de sorteio."
          help="Contemplação é o momento em que você recebe o crédito, por sorteio ou lance. Até lá você já paga parcelas, em geral sem ter o bem. Esta data é a sua hipótese para o fluxo de caixa — o simulador não adivinha o sorteio."
        >
          <IntegerInput
            value={input.contemplationMonth}
            onChange={(contemplationMonth) => onChange({ contemplationMonth })}
            min={1}
            max={input.termMonths}
          />
        </Field>
      </div>

      <div className="mt-6 space-y-4">
        <OptionalBlock
          enabled={input.consortiumHasBid}
          onToggle={(consortiumHasBid) => onChange({ consortiumHasBid })}
          label="Vou oferecer lance"
          description="Deixe desligado se pretende esperar o sorteio."
          help="Lance é um valor que você oferece para tentar ser contemplado antes. Ele sai do bolso na contemplação e reduz o que ainda falta pagar — ou o prazo, conforme a regra que você escolher. Não é um desconto extra: é parte do que você já pagaria, antecipada."
        >
          <Field label="Valor do lance" hint={`Equivale a ${formatBRL(input.consortiumBid)}.`}>
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
            label="Como o lance reduz o que falta"
            help="Reduzir parcelas: o prazo continua o mesmo e cada parcela fica menor. Reduzir prazo: a parcela fica parecida e você termina antes. Contratos reais às vezes misturam as duas regras."
          >
            <Segmented<BidMode>
              value={input.consortiumBidMode}
              onChange={(consortiumBidMode) => onChange({ consortiumBidMode })}
              options={[
                { value: 'reduce_installment', label: 'Reduz parcelas' },
                { value: 'reduce_term', label: 'Reduz prazo' },
              ]}
            />
          </Field>
          <Field
            label="De onde sai o dinheiro do lance"
            help="Recursos próprios: você paga o lance com dinheiro que já tem e recebe o crédito integral. Embutido: o lance é descontado da carta de crédito. Para comprar o mesmo bem, você ainda precisa completar a diferença."
          >
            <Segmented<BidKind>
              value={input.consortiumBidKind}
              onChange={(consortiumBidKind) => onChange({ consortiumBidKind })}
              options={[
                { value: 'own', label: 'Recursos próprios' },
                { value: 'embedded', label: 'Embutido' },
              ]}
            />
          </Field>
        </OptionalBlock>

        <OptionalBlock
          enabled={input.consortiumHasInsurance}
          onToggle={(consortiumHasInsurance) =>
            onChange({
              consortiumHasInsurance,
              consortiumInsuranceMode:
                consortiumHasInsurance && input.consortiumInsuranceMode === 'none'
                  ? 'monthly'
                  : input.consortiumInsuranceMode,
            })
          }
          label="Tem seguro"
          description="Só preencha se o contrato cobrar seguro."
          help="Alguns grupos incluem seguro de vida ou prestamista na parcela. Se a sua simulação da administradora não mostrar seguro, deixe desligado."
        >
          <Field label="Como informar o seguro">
            <Segmented<InsuranceMode>
              value={input.consortiumInsuranceMode === 'none' ? 'monthly' : input.consortiumInsuranceMode}
              onChange={(consortiumInsuranceMode) => onChange({ consortiumInsuranceMode })}
              options={[
                { value: 'monthly', label: 'R$ por mês' },
                { value: 'percent', label: '% do crédito / mês' },
              ]}
            />
          </Field>
          {input.consortiumInsuranceMode === 'percent' ? (
            <Field label="Percentual mensal">
              <PercentInput
                value={input.consortiumInsurancePct}
                onChange={(consortiumInsurancePct) => onChange({ consortiumInsurancePct })}
              />
            </Field>
          ) : (
            <Field label="Valor mensal">
              <CurrencyInput
                value={input.consortiumInsuranceMonthly}
                onChange={(consortiumInsuranceMonthly) =>
                  onChange({ consortiumInsuranceMonthly })
                }
              />
            </Field>
          )}
        </OptionalBlock>

        <OptionalBlock
          enabled={input.consortiumHasMembershipFee}
          onToggle={(consortiumHasMembershipFee) => onChange({ consortiumHasMembershipFee })}
          label="Tem taxa de adesão"
          description="Cobrança inicial para entrar no grupo, se houver."
          help="Algumas administradoras cobram uma taxa só na entrada. Se a proposta não tiver esse item, ignore."
        >
          <Field label="Valor da adesão">
            <CurrencyInput
              value={input.consortiumMembershipFee}
              onChange={(consortiumMembershipFee) => onChange({ consortiumMembershipFee })}
            />
          </Field>
        </OptionalBlock>

        <OptionalBlock
          enabled={input.consortiumHasOtherMonthly}
          onToggle={(consortiumHasOtherMonthly) => onChange({ consortiumHasOtherMonthly })}
          label="Tem outros custos mensais"
          description="Tarifas extras que entram todo mês, além da parcela."
          help="Use só se a administradora cobrar algo recorrente que ainda não esteja na taxa de administração, no fundo ou no seguro."
        >
          <Field label="Valor mensal extra">
            <CurrencyInput
              value={input.consortiumOtherMonthly}
              onChange={(consortiumOtherMonthly) => onChange({ consortiumOtherMonthly })}
            />
          </Field>
        </OptionalBlock>
      </div>
      {footer}
    </Card>
  )
}
