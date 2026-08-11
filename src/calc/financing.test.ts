import { describe, expect, it } from 'vitest'
import { createDefaultInput } from './defaults'
import { priceBalloonInstallment, priceInstallment, simulateFinancing } from './financing'
import { almostEqual } from './format'

describe('SAC', () => {
  it('amortização constante, juros sobre saldo e total de juros fechado', () => {
    const input = createDefaultInput()
    input.creditValue = 300_000
    input.downPayment = 60_000
    input.termMonths = 120
    input.financingTermMonths = 120
    input.amortization = 'sac'
    input.residualValue = 0

    const result = simulateFinancing(input, 0.01, false)
    const A = 240_000 / 120

    expect(result.financedAmount).toBeCloseTo(240_000, 2)
    expect(result.schedule[0].amortization).toBeCloseTo(A, 6)
    expect(result.schedule[0].interest).toBeCloseTo(2_400, 6)
    expect(result.schedule[0].installment).toBeCloseTo(4_400, 6)
    expect(result.schedule[0].closingBalance).toBeCloseTo(238_000, 6)

    const last = result.schedule[119]
    expect(last.amortization).toBeCloseTo(A, 4)
    expect(last.interest).toBeCloseTo(A * 0.01, 4)
    expect(last.closingBalance).toBeCloseTo(0, 2)

    const expectedInterest = ((0.01 * 240_000) / 2) * (120 + 1)
    expect(result.totalInterest).toBeCloseTo(expectedInterest, 2)
    expect(result.totalAmortization).toBeCloseTo(240_000, 2)

    const sumAmort = result.schedule.reduce((s, r) => s + r.amortization, 0)
    expect(sumAmort).toBeCloseTo(240_000, 2)

    expect(result.totalDisbursed).toBeCloseTo(60_000 + 240_000 + expectedInterest, 2)
  })

  it('não conta a entrada duas vezes', () => {
    const input = createDefaultInput()
    const result = simulateFinancing(input, 0.01, false)
    const fromSchedule = result.schedule.reduce((s, r) => s + r.total, 0)
    expect(result.totalDisbursed).toBeCloseTo(result.downPayment + fromSchedule, 6)
  })
})

describe('Price', () => {
  it('parcela constante e amortização + juros = PMT', () => {
    const input = createDefaultInput()
    input.amortization = 'price'
    input.financingTermMonths = 120
    const i = 0.01
    const n = 120
    const P = 240_000
    const pmt = priceInstallment(P, i, n)
    const result = simulateFinancing(input, i, false)

    expect(pmt).toBeGreaterThan(0)
    for (let k = 0; k < n - 1; k++) {
      const row = result.schedule[k]
      expect(almostEqual(row.installment, pmt, 0.0001)).toBe(true)
      expect(row.interest).toBeCloseTo(row.openingBalance * i, 8)
      expect(row.amortization).toBeCloseTo(row.installment - row.interest, 8)
    }

    expect(result.schedule.at(-1)?.closingBalance).toBeCloseTo(0, 2)
    const sumAmort = result.schedule.reduce((s, r) => s + r.amortization, 0)
    expect(sumAmort).toBeCloseTo(P, 2)
  })

  it('com taxa zero, Price coincide com P/n', () => {
    expect(priceInstallment(120_000, 0, 120)).toBeCloseTo(1_000, 10)
  })

  it('Price com residual preserva o balloon e o PMT teórico', () => {
    const input = createDefaultInput()
    input.creditValue = 120_000
    input.downPayment = 0
    input.financingTermMonths = 24
    input.amortization = 'price'
    input.financingHasResidual = true
    input.residualValue = 20_000
    const i = 0.01
    const pmt = priceBalloonInstallment(120_000, 20_000, i, 24)
    expect(pmt).toBeCloseTo(4_907.35, 2)

    const result = simulateFinancing(input, i, false)
    expect(result.firstInstallment).toBeCloseTo(pmt, 2)
    expect(result.schedule.at(-1)?.closingBalance).toBeCloseTo(20_000, 2)
    expect(result.schedule.at(-1)?.residual).toBeCloseTo(20_000, 2)
    for (let k = 0; k < 23; k++) {
      expect(result.schedule[k].installment).toBeCloseTo(pmt, 4)
    }
  })
})

describe('CET', () => {
  it('não duplica seguros e tarifas quando o CET já os inclui', () => {
    const input = createDefaultInput()
    input.financingInsuranceMonthly = 200
    input.originationFee = 3_000
    input.amortization = 'sac'
    input.financingTermMonths = 120

    const withExtras = simulateFinancing(input, 0.01, false)
    const cetOnly = simulateFinancing(input, 0.012, true)

    expect(withExtras.totalInsurance).toBeCloseTo(200 * 120, 2)
    expect(withExtras.totalUpfrontFees).toBeCloseTo(3_000, 2)
    expect(cetOnly.totalInsurance).toBe(0)
    expect(cetOnly.totalUpfrontFees).toBe(0)
    expect(cetOnly.rateSource).toBe('cet')
  })
})
