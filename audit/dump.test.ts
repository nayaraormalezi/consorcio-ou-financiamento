import { writeFileSync } from 'node:fs'
import { describe, it } from 'vitest'
import { createDefaultInput } from '../src/calc/defaults'
import { simulate } from '../src/calc/simulate'
import type { SimulatorInput } from '../src/calc/types'

function base(patch: Partial<SimulatorInput>): SimulatorInput {
  return {
    ...createDefaultInput(),
    consortiumAnnualAdjustmentPct: 0,
    consortiumHasBid: false,
    consortiumBid: 0,
    downPayment: 0,
    downPaymentPct: 0,
    downPaymentLastEdited: 'money',
    financingTermMonths: 100,
    termMonths: 100,
    contemplationMonth: 1,
    rateMonthlyPct: 1,
    rateInputMode: 'monthly',
    amortization: 'sac',
    useCet: false,
    discountAnnualPct: 10,
    ...patch,
  }
}

function slim(input: SimulatorInput) {
  const r = simulate(input)
  return {
    errors: r.errors,
    cheaperNominal: r.cheaperNominal,
    cheaperNpv: r.cheaperNpv,
    cheaperCostBeyond: r.cheaperCostBeyond,
    metricsDisagree: r.metricsDisagree,
    consortiumCostBeyondCredit: r.consortiumCostBeyondCredit,
    financingCostBeyondCredit: r.financingCostBeyondCredit,
    creditPurchasingPowerGain: r.creditPurchasingPowerGain,
    consortium: {
      creditValue: r.consortium.creditValue,
      adminFee: r.consortium.adminFee,
      reserveFund: r.consortium.reserveFund,
      bid: r.consortium.bid,
      bidKind: r.consortium.bidKind,
      creditAtContemplation: r.consortium.creditAtContemplation,
      availableCredit: r.consortium.availableCredit,
      creditAvailableMonth: r.consortium.creditAvailableMonth,
      termMonths: r.consortium.termMonths,
      paidMonths: r.consortium.paidMonths,
      firstInstallment: r.consortium.firstInstallment,
      lastInstallment: r.consortium.lastInstallment,
      totalInstallments: r.consortium.totalInstallments,
      totalDisbursed: r.consortium.totalDisbursed,
      npv: r.consortium.npv,
      finalCreditValue: r.consortium.finalCreditValue,
      totalReajustmentExtra: r.consortium.totalReajustmentExtra,
      inpcApplications: r.consortium.inpcApplications,
      scheduleLen: r.consortium.schedule.length,
      month1: r.consortium.schedule[0],
      lastRow: r.consortium.schedule.at(-1),
    },
    financing: {
      creditValue: r.financing.creditValue,
      downPayment: r.financing.downPayment,
      financedAmount: r.financing.financedAmount,
      termMonths: r.financing.termMonths,
      system: r.financing.system,
      monthlyRate: r.financing.monthlyRate,
      firstInstallment: r.financing.firstInstallment,
      lastInstallment: r.financing.lastInstallment,
      totalInterest: r.financing.totalInterest,
      totalAmortization: r.financing.totalAmortization,
      totalDisbursed: r.financing.totalDisbursed,
      npv: r.financing.npv,
      scheduleLen: r.financing.schedule.length,
      month1: r.financing.schedule[0],
      lastRow: r.financing.schedule.at(-1),
      closingSumAbs: r.financing.schedule.reduce((s, row) => s + Math.abs(row.closingBalance), 0),
    },
  }
}

describe('dump para auditoria independente', () => {
  it('grava JSON dos 10 testes + extras', () => {
    const cases: Record<string, SimulatorInput> = {
      t1_100k_100m_sem_lance: base({
        creditValue: 100_000,
        termMonths: 100,
        financingTermMonths: 100,
      }),
      t2_500k_180m_sem_lance: base({
        creditValue: 500_000,
        termMonths: 180,
        financingTermMonths: 180,
      }),
      t3_500k_lance_proprio_100k: base({
        creditValue: 500_000,
        termMonths: 180,
        financingTermMonths: 180,
        consortiumHasBid: true,
        consortiumBid: 100_000,
        consortiumBidKind: 'own',
        consortiumBidMode: 'reduce_installment',
        consortiumBidLastEdited: 'money',
        contemplationMonth: 12,
      }),
      t4_lance_embutido: base({
        creditValue: 500_000,
        termMonths: 180,
        financingTermMonths: 180,
        consortiumHasBid: true,
        consortiumBid: 100_000,
        consortiumBidKind: 'embedded',
        consortiumBidMode: 'reduce_installment',
        consortiumBidLastEdited: 'money',
        contemplationMonth: 12,
      }),
      t5_price: base({
        creditValue: 100_000,
        termMonths: 100,
        financingTermMonths: 100,
        amortization: 'price',
      }),
      t6_sac: base({
        creditValue: 100_000,
        termMonths: 100,
        financingTermMonths: 100,
        amortization: 'sac',
      }),
      t7_juros_zero: base({
        creditValue: 100_000,
        termMonths: 100,
        financingTermMonths: 100,
        rateMonthlyPct: 0,
        rateAnnualPct: 0,
        amortization: 'sac',
      }),
      t8_admin_zero: base({
        creditValue: 100_000,
        termMonths: 100,
        financingTermMonths: 100,
        consortiumAdminFeePct: 0,
        consortiumReservePct: 0,
      }),
      t9_prazo_1_mes: base({
        creditValue: 100_000,
        termMonths: 1,
        financingTermMonths: 1,
        contemplationMonth: 1,
      }),
      t10_valor_zero: base({
        creditValue: 0,
        termMonths: 100,
        financingTermMonths: 100,
      }),
      extra_embutido_inpc: base({
        creditValue: 500_000,
        termMonths: 180,
        financingTermMonths: 180,
        consortiumHasBid: true,
        consortiumBid: 100_000,
        consortiumBidKind: 'embedded',
        consortiumBidMode: 'reduce_installment',
        consortiumBidLastEdited: 'money',
        consortiumAnnualAdjustmentPct: 4.5,
        consortiumFirstAnniversaryMonth: 13,
        contemplationMonth: 24,
      }),
      extra_inpc_45: base({
        creditValue: 300_000,
        termMonths: 120,
        financingTermMonths: 120,
        consortiumAnnualAdjustmentPct: 4.5,
        consortiumAdminFeePct: 20,
        consortiumReservePct: 2,
      }),
      extra_defaults_app: {
        ...createDefaultInput(),
        contemplationMonth: 1,
      },
      extra_price_residual: base({
        creditValue: 120_000,
        termMonths: 24,
        financingTermMonths: 24,
        amortization: 'price',
        financingHasResidual: true,
        residualValue: 20_000,
        downPayment: 0,
      }),
      extra_cet_as_rate: {
        ...base({
          creditValue: 100_000,
          termMonths: 120,
          financingTermMonths: 120,
          useCet: true,
          cetAnnualPct: 12,
          cetInputMode: 'annual',
          annualRateKind: 'effective',
          amortization: 'sac',
        }),
      },
    }

    const out: Record<string, unknown> = {}
    for (const [name, input] of Object.entries(cases)) {
      out[name] = slim(input)
    }
    writeFileSync('audit/simulator_dump.json', JSON.stringify(out, null, 2))
  })
})
