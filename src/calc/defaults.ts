import type { SimulatorInput } from './types'
import { effectiveAnnualFromMonthly, pctToRate, rateToPct } from './rates'

export const TERM_PRESETS = [36, 48, 60, 72, 84, 120, 180, 240, 360] as const

export function createDefaultInput(): SimulatorInput {
  const creditValue = 300_000
  const rateMonthlyPct = 1
  return {
    creditValue,
    termMonths: 120,
    creditTiming: 'immediate',

    consortiumAdminFeePct: 20,
    consortiumReservePct: 2,
    consortiumInsuranceMode: 'none',
    consortiumInsuranceMonthly: 0,
    consortiumInsurancePct: 0,
    consortiumBid: 60_000,
    consortiumBidPct: 20,
    consortiumBidLastEdited: 'pct',
    consortiumBidMode: 'reduce_installment',
    consortiumBidKind: 'own',
    consortiumAnnualAdjustmentPct: 4.5,
    consortiumFirstAnniversaryMonth: 13,
    consortiumMembershipFee: 0,
    consortiumOtherMonthly: 0,
    contemplationMonth: 1,

    downPayment: 60_000,
    downPaymentPct: 20,
    downPaymentLastEdited: 'pct',
    rateMonthlyPct,
    rateAnnualPct: rateToPct(effectiveAnnualFromMonthly(pctToRate(rateMonthlyPct))),
    rateInputMode: 'monthly',
    annualRateKind: 'effective',
    amortization: 'sac',
    financingInsuranceMonthly: 0,
    originationFee: 0,
    appraisalFee: 0,
    registryFee: 0,
    otherUpfront: 0,
    financingOtherMonthly: 0,
    residualValue: 0,
    useCet: false,
    cetMonthlyPct: 0,
    cetAnnualPct: 0,
    cetInputMode: 'monthly',
    cetIncludesExtras: true,

    discountAnnualPct: 10,
  }
}

export const WHAT_IF_SCENARIOS = [
  {
    id: 'bid-30',
    label: 'Lance de 30%',
    apply: (input: SimulatorInput): SimulatorInput => ({
      ...input,
      consortiumBidPct: 30,
      consortiumBid: input.creditValue * 0.3,
      consortiumBidLastEdited: 'pct',
    }),
  },
  {
    id: 'rate-08',
    label: 'Juros de 0,80% a.m.',
    apply: (input: SimulatorInput): SimulatorInput => ({
      ...input,
      rateMonthlyPct: 0.8,
      rateInputMode: 'monthly',
      rateAnnualPct: rateToPct(effectiveAnnualFromMonthly(pctToRate(0.8))),
    }),
  },
  {
    id: 'inpc-0',
    label: 'Sem INPC',
    apply: (input: SimulatorInput): SimulatorInput => ({
      ...input,
      consortiumAnnualAdjustmentPct: 0,
    }),
  },
  {
    id: 'inpc-6',
    label: 'INPC de 6% a.a.',
    apply: (input: SimulatorInput): SimulatorInput => ({
      ...input,
      consortiumAnnualAdjustmentPct: 6,
    }),
  },
  {
    id: 'price',
    label: 'Trocar para Price',
    apply: (input: SimulatorInput): SimulatorInput => ({
      ...input,
      amortization: 'price',
    }),
  },
  {
    id: 'no-bid',
    label: 'Sem lance',
    apply: (input: SimulatorInput): SimulatorInput => ({
      ...input,
      consortiumBid: 0,
      consortiumBidPct: 0,
      consortiumBidLastEdited: 'money',
    }),
  },
] as const
