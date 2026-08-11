import { describe, expect, it } from 'vitest'
import { createDefaultInput } from './defaults'
import { presentValue } from './npv'
import { simulate } from './simulate'

describe('valor presente', () => {
  it('não desconta o fluxo do mês 0', () => {
    expect(presentValue([{ month: 0, amount: 1000 }], 0.01)).toBe(1000)
  })

  it('desconta um fluxo futuro por (1+i)^t', () => {
    expect(presentValue([{ month: 12, amount: 1000 }], 0.01)).toBeCloseTo(
      1000 / 1.01 ** 12,
      8,
    )
  })

  it('o VP é menor que o total nominal quando há desembolso ao longo do tempo', () => {
    const result = simulate(createDefaultInput())
    expect(result.consortium.npv).toBeLessThan(result.consortium.totalDisbursed)
    expect(result.financing.npv).toBeLessThan(result.financing.totalDisbursed)
  })
})
