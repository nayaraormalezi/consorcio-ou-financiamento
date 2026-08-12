import { simulateConsortium } from './consortium'
import { simulateFinancing } from './financing'
import { resolveMonthlyRate } from './rates'
import type { CheaperOption, ComparisonResult, SimulatorInput } from './types'

export function validateInput(input: SimulatorInput): string[] {
  const errors: string[] = []
  if (input.creditValue <= 0) errors.push('Informe um valor de crédito maior que zero.')
  if (input.termMonths < 1 || input.termMonths > 420) {
    errors.push('O prazo do consórcio deve estar entre 1 e 420 meses.')
  }
  if (input.financingTermMonths < 1 || input.financingTermMonths > 420) {
    errors.push('O prazo do financiamento deve estar entre 1 e 420 meses.')
  }
  if (input.downPayment > input.creditValue) {
    errors.push('A entrada não pode ser maior que o valor do crédito.')
  }
  if (input.consortiumBid < 0) errors.push('O lance não pode ser negativo.')
  if (!input.contemplationMonth || input.contemplationMonth < 1) {
    errors.push(
      'Informe o mês da contemplação. É uma hipótese de cálculo, não uma previsão.',
    )
  } else if (input.contemplationMonth > input.termMonths) {
    errors.push('O mês de contemplação deve estar dentro do prazo.')
  }
  if (input.rateMonthlyPct < 0 || input.rateAnnualPct < 0) {
    errors.push('As taxas de juros não podem ser negativas.')
  }
  if (input.residualValue > input.creditValue - input.downPayment) {
    errors.push('O valor residual não pode exceder o valor financiado.')
  }
  return errors
}

export function applyOptionalFields(input: SimulatorInput): SimulatorInput {
  return {
    ...input,
    consortiumBid: input.consortiumHasBid ? input.consortiumBid : 0,
    consortiumInsuranceMode: input.consortiumHasInsurance
      ? input.consortiumInsuranceMode
      : 'none',
    consortiumMembershipFee: input.consortiumHasMembershipFee
      ? input.consortiumMembershipFee
      : 0,
    consortiumOtherMonthly: input.consortiumHasOtherMonthly
      ? input.consortiumOtherMonthly
      : 0,
    financingInsuranceMonthly: input.financingHasInsurance
      ? input.financingInsuranceMonthly
      : 0,
    originationFee: input.financingHasOtherCosts ? input.originationFee : 0,
    appraisalFee: input.financingHasOtherCosts ? input.appraisalFee : 0,
    registryFee: input.financingHasOtherCosts ? input.registryFee : 0,
    otherUpfront: input.financingHasOtherCosts ? input.otherUpfront : 0,
    financingOtherMonthly: input.financingHasOtherCosts
      ? input.financingOtherMonthly
      : 0,
    residualValue: input.financingHasResidual ? input.residualValue : 0,
  }
}

export function simulate(input: SimulatorInput): ComparisonResult {
  const effective = applyOptionalFields(input)
  const errors = validateInput(effective)
  const extrasIncludedInCet = effective.useCet && effective.cetIncludesExtras
  const rate = effective.useCet
    ? resolveMonthlyRate({
        monthlyPct: effective.cetMonthlyPct,
        annualPct: effective.cetAnnualPct,
        inputMode: effective.cetInputMode,
        annualKind: effective.annualRateKind,
      })
    : resolveMonthlyRate({
        monthlyPct: effective.rateMonthlyPct,
        annualPct: effective.rateAnnualPct,
        inputMode: effective.rateInputMode,
        annualKind: effective.annualRateKind,
      })

  const consortium = simulateConsortium(effective)
  const financing = simulateFinancing(effective, rate.monthly, extrasIncludedInCet)

  const consortiumCostBeyondCredit =
    consortium.adminFee +
    consortium.reserveFund +
    consortium.totalInsurance +
    consortium.membershipFee +
    consortium.totalOtherMonthly
  const financingTariffs = financing.totalUpfrontFees + financing.totalMonthlyExtras
  const financingCostBeyondCredit =
    financing.totalInterest + financing.totalInsurance + financingTariffs
  const cheaperNominal = cheaperOf(consortium.totalDisbursed, financing.totalDisbursed)
  const cheaperNpv = cheaperOf(consortium.npv, financing.npv)
  const cheaperCostBeyond = cheaperOf(consortiumCostBeyondCredit, financingCostBeyondCredit)
  const nominalDiff = financing.totalDisbursed - consortium.totalDisbursed
  const npvDiff = financing.npv - consortium.npv
  const baseNominal = Math.max(consortium.totalDisbursed, financing.totalDisbursed)
  const baseNpv = Math.max(consortium.npv, financing.npv)

  return {
    consortium,
    financing,
    cheaperNominal,
    cheaperNpv,
    cheaperCostBeyond,
    nominalDiff,
    npvDiff,
    nominalDiffPct: baseNominal > 0 ? (Math.abs(nominalDiff) / baseNominal) * 100 : 0,
    npvDiffPct: baseNpv > 0 ? (Math.abs(npvDiff) / baseNpv) * 100 : 0,
    consortiumCostBeyondCredit,
    financingCostBeyondCredit,
    creditPurchasingPowerGain: Math.max(0, consortium.finalCreditValue - consortium.creditValue),
    metricsDisagree: cheaperNominal !== cheaperNpv,
    errors,
  }
}

function cheaperOf(consortium: number, financing: number): CheaperOption {
  const delta = Math.abs(consortium - financing)
  if (delta < 0.5) return 'tie'
  return consortium < financing ? 'consortium' : 'financing'
}

export function syncDerivedFields(input: SimulatorInput): SimulatorInput {
  const next = { ...input }
  if (next.creditValue < 0) next.creditValue = 0

  if (next.consortiumBidLastEdited === 'pct') {
    next.consortiumBid = next.creditValue * (next.consortiumBidPct / 100)
  } else if (next.creditValue > 0) {
    next.consortiumBidPct = (next.consortiumBid / next.creditValue) * 100
  }

  if (next.downPaymentLastEdited === 'pct') {
    next.downPayment = next.creditValue * (next.downPaymentPct / 100)
  } else if (next.creditValue > 0) {
    next.downPaymentPct = (next.downPayment / next.creditValue) * 100
  }

  const interest = resolveMonthlyRate({
    monthlyPct: next.rateMonthlyPct,
    annualPct: next.rateAnnualPct,
    inputMode: next.rateInputMode,
    annualKind: next.annualRateKind,
  })
  if (next.rateInputMode === 'monthly') {
    next.rateAnnualPct = interest.annualEffective * 100
  } else {
    next.rateMonthlyPct = interest.monthly * 100
  }

  const cet = resolveMonthlyRate({
    monthlyPct: next.cetMonthlyPct,
    annualPct: next.cetAnnualPct,
    inputMode: next.cetInputMode,
    annualKind: next.annualRateKind,
  })
  if (next.cetInputMode === 'monthly') {
    next.cetAnnualPct = cet.annualEffective * 100
  } else {
    next.cetMonthlyPct = cet.monthly * 100
  }

  if (next.termMonths >= 1) {
    next.termMonths = Math.min(420, Math.round(next.termMonths))
  } else {
    next.termMonths = 0
  }
  if (next.financingTermMonths >= 1) {
    next.financingTermMonths = Math.min(420, Math.round(next.financingTermMonths))
  } else {
    next.financingTermMonths = 0
  }
  if (next.contemplationMonth >= 1) {
    next.contemplationMonth = Math.max(1, Math.round(next.contemplationMonth))
    if (next.termMonths >= 1) {
      next.contemplationMonth = Math.min(next.contemplationMonth, next.termMonths)
    }
  } else {
    next.contemplationMonth = 0
  }
  if (next.consortiumFirstAnniversaryMonth >= 1) {
    next.consortiumFirstAnniversaryMonth = Math.max(
      1,
      Math.round(next.consortiumFirstAnniversaryMonth),
    )
    if (next.termMonths >= 1) {
      next.consortiumFirstAnniversaryMonth = Math.min(
        next.consortiumFirstAnniversaryMonth,
        next.termMonths + 12,
      )
    }
  } else {
    next.consortiumFirstAnniversaryMonth = 0
  }

  return next
}
