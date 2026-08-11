import { describe, expect, it } from 'vitest'
import { createDefaultInput } from './defaults'
import { simulate } from './simulate'
import type { SimulatorInput } from './types'

/** Motor independente — não chama simulateConsortium / simulateFinancing. */
function pmtPrice(P: number, i: number, n: number) {
  if (n <= 0) return 0
  if (Math.abs(i) < 1e-15) return P / n
  const f = (1 + i) ** n
  return (P * i * f) / (f - 1)
}

function pmtBalloon(P: number, R: number, i: number, n: number) {
  if (Math.abs(i) < 1e-15) return (P - R) / n
  return pmtPrice(P - R / (1 + i) ** n, i, n)
}

function sacInterest(P: number, i: number, n: number) {
  return (i * P * (n + 1)) / 2
}

function fund(C: number, ta: number, fr: number) {
  return C * (1 + ta / 100 + fr / 100)
}

function base(patch: Partial<SimulatorInput> = {}): SimulatorInput {
  return {
    ...createDefaultInput(),
    consortiumAnnualAdjustmentPct: 0,
    consortiumHasBid: false,
    consortiumBid: 0,
    downPayment: 0,
    downPaymentPct: 0,
    downPaymentLastEdited: 'money',
    financingHasResidual: false,
    residualValue: 0,
    consortiumHasInsurance: false,
    consortiumInsuranceMode: 'none',
    useCet: false,
    discountAnnualPct: 10,
    contemplationMonth: 1,
    ...patch,
  }
}

describe('V2 — motor independente vs simulador', () => {
  it('1. Price normal', () => {
    const n = 100
    const P = 100_000
    const i = 0.01
    const r = simulate(
      base({
        creditValue: P,
        termMonths: n,
        financingTermMonths: n,
        amortization: 'price',
      }),
    )
    expect(r.financing.firstInstallment).toBeCloseTo(pmtPrice(P, i, n), 4)
    expect(r.financing.schedule.at(-1)?.closingBalance).toBeCloseTo(0, 2)
  })

  it('2. Price 0%', () => {
    const r = simulate(
      base({
        creditValue: 120_000,
        termMonths: 120,
        financingTermMonths: 120,
        amortization: 'price',
        rateMonthlyPct: 0,
        rateAnnualPct: 0,
      }),
    )
    expect(r.financing.firstInstallment).toBeCloseTo(1_000, 6)
    expect(r.financing.totalInterest).toBeCloseTo(0, 6)
  })

  it('3. Price residual', () => {
    const P = 120_000
    const R = 20_000
    const n = 24
    const i = 0.01
    const r = simulate(
      base({
        creditValue: P,
        termMonths: n,
        financingTermMonths: n,
        amortization: 'price',
        financingHasResidual: true,
        residualValue: R,
      }),
    )
    expect(r.financing.firstInstallment).toBeCloseTo(pmtBalloon(P, R, i, n), 2)
    expect(r.financing.firstInstallment).toBeCloseTo(4_907.35, 2)
    expect(r.financing.schedule.at(-1)?.closingBalance).toBeCloseTo(R, 2)
  })

  it('4. SAC', () => {
    const P = 100_000
    const n = 100
    const i = 0.01
    const r = simulate(
      base({
        creditValue: P,
        termMonths: n,
        financingTermMonths: n,
        amortization: 'sac',
      }),
    )
    expect(r.financing.schedule[0].amortization).toBeCloseTo(P / n, 8)
    expect(r.financing.totalInterest).toBeCloseTo(sacInterest(P, i, n), 4)
  })

  it('5. SAC 0%', () => {
    const r = simulate(
      base({
        creditValue: 100_000,
        termMonths: 100,
        financingTermMonths: 100,
        amortization: 'sac',
        rateMonthlyPct: 0,
        rateAnnualPct: 0,
      }),
    )
    expect(r.financing.totalInterest).toBeCloseTo(0, 8)
    expect(r.financing.totalDisbursed).toBeCloseTo(100_000, 8)
  })

  it('6. Consórcio sem lance', () => {
    const r = simulate(
      base({
        creditValue: 100_000,
        termMonths: 100,
        financingTermMonths: 100,
        consortiumAdminFeePct: 20,
        consortiumReservePct: 2,
      }),
    )
    expect(r.consortium.totalDisbursed).toBeCloseTo(fund(100_000, 20, 2), 4)
    expect(r.consortium.firstInstallment).toBeCloseTo(fund(100_000, 20, 2) / 100, 4)
  })

  it('7. Lance próprio', () => {
    const C = 500_000
    const r = simulate(
      base({
        creditValue: C,
        termMonths: 180,
        financingTermMonths: 180,
        consortiumAdminFeePct: 20,
        consortiumReservePct: 2,
        consortiumHasBid: true,
        consortiumBid: 100_000,
        consortiumBidKind: 'own',
        consortiumBidLastEdited: 'money',
        contemplationMonth: 12,
      }),
    )
    expect(r.consortium.availableCredit).toBeCloseTo(C, 2)
    expect(r.consortium.totalDisbursed).toBeCloseTo(fund(C, 20, 2), 2)
  })

  it('8. Lance embutido', () => {
    const C = 500_000
    const r = simulate(
      base({
        creditValue: C,
        termMonths: 180,
        financingTermMonths: 180,
        consortiumAdminFeePct: 20,
        consortiumReservePct: 2,
        consortiumHasBid: true,
        consortiumBid: 100_000,
        consortiumBidKind: 'embedded',
        consortiumBidLastEdited: 'money',
        contemplationMonth: 12,
      }),
    )
    expect(r.consortium.availableCredit).toBeCloseTo(400_000, 2)
    expect(r.consortium.totalDisbursed).toBeCloseTo(510_000, 2)
  })

  it('9. Lance embutido + INPC usa carta vigente', () => {
    const C = 500_000
    const r = simulate(
      base({
        creditValue: C,
        termMonths: 180,
        financingTermMonths: 180,
        consortiumAdminFeePct: 20,
        consortiumReservePct: 2,
        consortiumHasBid: true,
        consortiumBid: 100_000,
        consortiumBidKind: 'embedded',
        consortiumBidLastEdited: 'money',
        consortiumAnnualAdjustmentPct: 4.5,
        consortiumFirstAnniversaryMonth: 13,
        contemplationMonth: 24,
      }),
    )
    const expectedLetter = C * 1.045
    expect(r.consortium.creditAtContemplation).toBeCloseTo(expectedLetter, 2)
    expect(r.consortium.availableCredit).toBeCloseTo(expectedLetter - 100_000, 2)
  })

  it('10. Lance próprio + INPC mantém carta vigente integral', () => {
    const C = 300_000
    const r = simulate(
      base({
        creditValue: C,
        termMonths: 36,
        financingTermMonths: 36,
        consortiumHasBid: true,
        consortiumBid: 30_000,
        consortiumBidKind: 'own',
        consortiumBidLastEdited: 'money',
        consortiumAnnualAdjustmentPct: 10,
        consortiumFirstAnniversaryMonth: 13,
        contemplationMonth: 13,
      }),
    )
    expect(r.consortium.creditAtContemplation).toBeCloseTo(330_000, 2)
    expect(r.consortium.availableCredit).toBeCloseTo(330_000, 2)
  })

  it('11. Contemplação mês 1', () => {
    const r = simulate(base({ creditValue: 100_000, termMonths: 60, financingTermMonths: 60, contemplationMonth: 1 }))
    expect(r.consortium.creditAvailableMonth).toBe(1)
  })

  it('12. Contemplação mês 12', () => {
    const r = simulate(base({ creditValue: 100_000, termMonths: 60, financingTermMonths: 60, contemplationMonth: 12 }))
    expect(r.consortium.creditAvailableMonth).toBe(12)
  })

  it('13. Contemplação no último mês', () => {
    const r = simulate(base({ creditValue: 100_000, termMonths: 60, financingTermMonths: 60, contemplationMonth: 60 }))
    expect(r.consortium.creditAvailableMonth).toBe(60)
  })

  it('14. INPC 0%', () => {
    const r = simulate(
      base({
        creditValue: 300_000,
        termMonths: 120,
        financingTermMonths: 120,
        consortiumAnnualAdjustmentPct: 0,
      }),
    )
    expect(r.consortium.finalCreditValue).toBeCloseTo(300_000, 2)
    expect(r.consortium.totalReajustmentExtra).toBeCloseTo(0, 2)
  })

  it('15. TA 0%', () => {
    const r = simulate(
      base({
        creditValue: 100_000,
        termMonths: 100,
        financingTermMonths: 100,
        consortiumAdminFeePct: 0,
        consortiumReservePct: 2,
      }),
    )
    expect(r.consortium.adminFee).toBe(0)
    expect(r.consortium.totalDisbursed).toBeCloseTo(102_000, 2)
  })

  it('16. FR 0%', () => {
    const r = simulate(
      base({
        creditValue: 100_000,
        termMonths: 100,
        financingTermMonths: 100,
        consortiumAdminFeePct: 20,
        consortiumReservePct: 0,
      }),
    )
    expect(r.consortium.reserveFund).toBe(0)
    expect(r.consortium.totalDisbursed).toBeCloseTo(120_000, 2)
  })

  it('17. crédito 0', () => {
    const r = simulate(base({ creditValue: 0, termMonths: 12, financingTermMonths: 12 }))
    expect(r.errors.length).toBeGreaterThan(0)
    expect(r.consortium.totalDisbursed).toBe(0)
    expect(r.financing.totalDisbursed).toBe(0)
  })

  it('18. prazo 1', () => {
    const r = simulate(
      base({
        creditValue: 100_000,
        termMonths: 1,
        financingTermMonths: 1,
        amortization: 'sac',
        contemplationMonth: 1,
      }),
    )
    expect(r.consortium.totalDisbursed).toBeCloseTo(122_000, 2)
    expect(r.financing.totalInterest).toBeCloseTo(1_000, 2)
  })

  it('19. entrada 0', () => {
    const r = simulate(
      base({
        creditValue: 80_000,
        termMonths: 40,
        financingTermMonths: 40,
        downPayment: 0,
        amortization: 'sac',
      }),
    )
    expect(r.financing.financedAmount).toBeCloseTo(80_000, 2)
    expect(r.financing.downPayment).toBe(0)
  })

  it('20. NPV = Σ CF/(1+i)^t', () => {
    const i = 0.01
    const n = 100
    const P = 100_000
    const r = simulate(
      base({
        creditValue: P,
        termMonths: n,
        financingTermMonths: n,
        amortization: 'sac',
        discountAnnualPct: ((1 + i) ** 12 - 1) * 100,
      }),
    )
    let npv = 0
    let bal = P
    const amort = P / n
    for (let m = 1; m <= n; m++) {
      const inst = amort + bal * i
      npv += inst / (1 + i) ** m
      bal -= amort
    }
    expect(r.financing.npv).toBeCloseTo(npv, 2)
  })
})
