import { describe, expect, it } from 'vitest'
import { isGroupAnniversary, simulateConsortium } from './consortium'
import { createDefaultInput } from './defaults'

describe('consórcio simplificado', () => {
  it('reproduz o exemplo 300 mil / 20% / 2% / 100 meses', () => {
    const input = createDefaultInput()
    input.creditValue = 300_000
    input.termMonths = 100
    input.consortiumAdminFeePct = 20
    input.consortiumReservePct = 2
    input.consortiumBid = 0
    input.consortiumAnnualAdjustmentPct = 0
    input.consortiumFirstAnniversaryMonth = 13
    input.consortiumInsuranceMode = 'none'
    input.contemplationMonth = 1

    const result = simulateConsortium(input)
    expect(result.adminFee).toBeCloseTo(60_000, 2)
    expect(result.reserveFund).toBeCloseTo(6_000, 2)
    expect(result.schedule[0].installment).toBeCloseTo(3_660, 2)
    expect(result.totalInstallments).toBeCloseTo(366_000, 2)
    expect(result.totalDisbursed).toBeCloseTo(366_000, 2)
  })

  it('não conta o lance duas vezes ao reduzir parcelas', () => {
    const input = createDefaultInput()
    input.creditValue = 300_000
    input.termMonths = 100
    input.consortiumAdminFeePct = 20
    input.consortiumReservePct = 2
    input.consortiumBid = 60_000
    input.consortiumBidMode = 'reduce_installment'
    input.consortiumAnnualAdjustmentPct = 0

    const result = simulateConsortium(input)
    expect(result.bid).toBeCloseTo(60_000, 2)
    expect(result.schedule[0].bid).toBeCloseTo(60_000, 2)
    expect(result.schedule[0].installment).toBeCloseTo(3_060, 2)
    expect(result.totalInstallments + result.bid).toBeCloseTo(366_000, 2)
    expect(result.totalDisbursed).toBeCloseTo(366_000, 2)
  })

  it('reduz o prazo quando essa for a regra do lance', () => {
    const input = createDefaultInput()
    input.creditValue = 300_000
    input.termMonths = 100
    input.consortiumAdminFeePct = 20
    input.consortiumReservePct = 2
    input.consortiumBid = 60_000
    input.consortiumBidMode = 'reduce_term'
    input.consortiumAnnualAdjustmentPct = 0

    const result = simulateConsortium(input)
    expect(result.schedule[0].installment).toBeCloseTo(3_660, 2)
    expect(result.paidMonths).toBeLessThan(100)
    expect(result.totalInstallments + result.bid).toBeCloseTo(366_000, 1)
    expect(result.totalDisbursed).toBeCloseTo(366_000, 1)
  })

  it('INPC no aniversário aumenta o desembolso e o crédito', () => {
    const base = createDefaultInput()
    base.consortiumBid = 0
    base.consortiumAnnualAdjustmentPct = 0
    base.consortiumFirstAnniversaryMonth = 13
    const adjusted = {
      ...base,
      consortiumAnnualAdjustmentPct: 6,
      consortiumFirstAnniversaryMonth: 13,
    }

    const a = simulateConsortium(base)
    const b = simulateConsortium(adjusted)
    expect(b.totalDisbursed).toBeGreaterThan(a.totalDisbursed)
    expect(b.totalReajustmentExtra).toBeGreaterThan(0)
    expect(b.finalCreditValue).toBeGreaterThan(b.creditValue)
    expect(b.inpcApplications).toBeGreaterThan(0)
  })

  it('aplica o INPC no aniversário do grupo e a cada 12 meses', () => {
    expect(isGroupAnniversary(1, 13)).toBe(false)
    expect(isGroupAnniversary(12, 13)).toBe(false)
    expect(isGroupAnniversary(13, 13)).toBe(true)
    expect(isGroupAnniversary(25, 13)).toBe(true)
    expect(isGroupAnniversary(14, 13)).toBe(false)
    expect(isGroupAnniversary(7, 7)).toBe(true)
    expect(isGroupAnniversary(19, 7)).toBe(true)

    const input = createDefaultInput()
    input.consortiumBid = 0
    input.consortiumAnnualAdjustmentPct = 10
    input.consortiumFirstAnniversaryMonth = 13
    input.termMonths = 36
    input.consortiumInsuranceMode = 'none'

    const result = simulateConsortium(input)
    expect(result.schedule[0].inpcApplied).toBe(false)
    expect(result.schedule[11].inpcApplied).toBe(false)
    expect(result.schedule[12].inpcApplied).toBe(true)
    expect(result.schedule[12].creditValue).toBeCloseTo(330_000, 2)
    expect(result.schedule[24].inpcApplied).toBe(true)
    expect(result.schedule[24].creditValue).toBeCloseTo(363_000, 2)
    expect(result.inpcApplications).toBe(2)
  })
})
