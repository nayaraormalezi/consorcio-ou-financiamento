import { describe, expect, it } from 'vitest'
import { createDefaultInput } from './defaults'
import { simulate } from './simulate'

describe('cenário de referência 300 mil / 120 meses / 20% / 1% a.m. SAC', () => {
  it('fecha juros do SAC e não duplica entrada nem lance', () => {
    const input = createDefaultInput()
    input.consortiumAnnualAdjustmentPct = 0
    input.consortiumHasBid = true
    input.financingTermMonths = 120
    const result = simulate(input)
    const expectedInterest = ((0.01 * 240_000) / 2) * 121

    expect(result.errors).toHaveLength(0)
    expect(result.financing.financedAmount).toBeCloseTo(240_000, 2)
    expect(result.financing.totalInterest).toBeCloseTo(expectedInterest, 2)
    expect(result.financing.totalDisbursed).toBeCloseTo(
      60_000 + 240_000 + expectedInterest,
      2,
    )

    expect(result.consortium.adminFee).toBeCloseTo(60_000, 2)
    expect(result.consortium.reserveFund).toBeCloseTo(6_000, 2)
    expect(result.consortium.bid).toBeCloseTo(60_000, 2)
    expect(result.consortium.totalInstallments + result.consortium.bid).toBeCloseTo(
      366_000,
      2,
    )
    expect(result.consortium.totalDisbursed).toBeCloseTo(366_000, 2)
    expect(result.cheaperNominal).toBe('consortium')
  })

  it('ignora lance, seguro e taxas extras quando os interruptores estão desligados', () => {
    const input = createDefaultInput()
    input.consortiumHasBid = false
    input.consortiumBid = 60_000
    input.consortiumAnnualAdjustmentPct = 0
    input.consortiumHasInsurance = false
    input.consortiumHasMembershipFee = false
    input.consortiumHasOtherMonthly = false
    input.financingTermMonths = 120

    const result = simulate(input)
    expect(result.consortium.bid).toBe(0)
    expect(result.consortium.totalDisbursed).toBeCloseTo(366_000, 2)
  })

  it('separa custo além do crédito e detecta quando total e VP discordam', () => {
    const input = createDefaultInput()
    input.financingTermMonths = 120
    const result = simulate(input)
    expect(result.consortiumCostBeyondCredit).toBeGreaterThan(result.consortium.adminFee)
    expect(result.financingCostBeyondCredit).toBeCloseTo(result.financing.totalInterest, 2)
    expect(result.creditPurchasingPowerGain).toBeGreaterThan(0)
    expect(result.metricsDisagree).toBe(true)
    expect(result.cheaperNominal).toBe('financing')
    expect(result.cheaperNpv).toBe('consortium')
  })

  it('usa prazo de financiamento independente, no padrão de 360 meses', () => {
    const result = simulate(createDefaultInput())
    expect(result.errors).toHaveLength(0)
    expect(result.consortium.termMonths).toBe(120)
    expect(result.financing.termMonths).toBe(360)
    expect(result.financing.schedule).toHaveLength(360)
    const expectedInterest = ((0.01 * 240_000) / 2) * (360 + 1)
    expect(result.financing.totalInterest).toBeCloseTo(expectedInterest, 2)
    expect(result.cheaperNominal).toBe('consortium')
  })
})
