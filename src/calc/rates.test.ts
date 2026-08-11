import { describe, expect, it } from 'vitest'
import {
  effectiveAnnualFromMonthly,
  monthlyFromEffectiveAnnual,
  monthlyFromNominalAnnual,
  nominalAnnualFromMonthly,
  resolveMonthlyRate,
} from './rates'

describe('conversão de taxas', () => {
  it('converte mensal efetiva ↔ anual efetiva de forma invertível', () => {
    const monthly = 0.01
    const annual = effectiveAnnualFromMonthly(monthly)
    expect(annual).toBeCloseTo(0.1268250301, 8)
    expect(monthlyFromEffectiveAnnual(annual)).toBeCloseTo(monthly, 12)
  })

  it('trata taxa anual nominal como i/12', () => {
    expect(monthlyFromNominalAnnual(0.12)).toBeCloseTo(0.01, 12)
    expect(nominalAnnualFromMonthly(0.01)).toBeCloseTo(0.12, 12)
  })

  it('diferencia nominal e efetiva ao resolver a taxa de cálculo', () => {
    const fromMonthly = resolveMonthlyRate({
      monthlyPct: 1,
      annualPct: 0,
      inputMode: 'monthly',
      annualKind: 'effective',
    })
    expect(fromMonthly.monthly).toBeCloseTo(0.01, 12)
    expect(fromMonthly.annualEffective).toBeCloseTo(0.1268250301, 8)

    const fromNominal = resolveMonthlyRate({
      monthlyPct: 0,
      annualPct: 12,
      inputMode: 'annual',
      annualKind: 'nominal',
    })
    expect(fromNominal.monthly).toBeCloseTo(0.01, 12)

    const fromEffective = resolveMonthlyRate({
      monthlyPct: 0,
      annualPct: 12.68250301,
      inputMode: 'annual',
      annualKind: 'effective',
    })
    expect(fromEffective.monthly).toBeCloseTo(0.01, 6)
  })
})
