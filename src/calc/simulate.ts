import { simulateConsortium } from './consortium'
import { simulateFinancing } from './financing'
import { resolveMonthlyRate } from './rates'
import type { CheaperOption, ComparisonResult, SimulatorInput } from './types'

export function validateInput(input: SimulatorInput): string[] {
  const errors: string[] = []
  if (input.creditValue <= 0) errors.push('Informe um valor de crédito maior que zero.')
  if (input.termMonths < 1 || input.termMonths > 420) {
    errors.push('O prazo deve estar entre 1 e 420 meses.')
  }
  if (input.downPayment > input.creditValue) {
    errors.push('A entrada não pode ser maior que o valor do crédito.')
  }
  if (input.consortiumBid < 0) errors.push('O lance não pode ser negativo.')
  if (input.contemplationMonth < 1 || input.contemplationMonth > input.termMonths) {
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

export function simulate(input: SimulatorInput): ComparisonResult {
  const errors = validateInput(input)
  const extrasIncludedInCet = input.useCet && input.cetIncludesExtras
  const rate = input.useCet
    ? resolveMonthlyRate({
        monthlyPct: input.cetMonthlyPct,
        annualPct: input.cetAnnualPct,
        inputMode: input.cetInputMode,
        annualKind: input.annualRateKind,
      })
    : resolveMonthlyRate({
        monthlyPct: input.rateMonthlyPct,
        annualPct: input.rateAnnualPct,
        inputMode: input.rateInputMode,
        annualKind: input.annualRateKind,
      })

  const consortium = simulateConsortium(input)
  const financing = simulateFinancing(input, rate.monthly, extrasIncludedInCet)

  const nominalDiff = financing.totalDisbursed - consortium.totalDisbursed
  const npvDiff = financing.npv - consortium.npv
  const baseNominal = Math.max(consortium.totalDisbursed, financing.totalDisbursed)
  const baseNpv = Math.max(consortium.npv, financing.npv)

  return {
    consortium,
    financing,
    cheaperNominal: cheaperOf(consortium.totalDisbursed, financing.totalDisbursed),
    cheaperNpv: cheaperOf(consortium.npv, financing.npv),
    nominalDiff,
    npvDiff,
    nominalDiffPct: baseNominal > 0 ? (Math.abs(nominalDiff) / baseNominal) * 100 : 0,
    npvDiffPct: baseNpv > 0 ? (Math.abs(npvDiff) / baseNpv) * 100 : 0,
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

  next.contemplationMonth = Math.min(
    Math.max(1, Math.round(next.contemplationMonth || 1)),
    Math.max(1, next.termMonths),
  )
  next.consortiumFirstAnniversaryMonth = Math.min(
    Math.max(1, Math.round(next.consortiumFirstAnniversaryMonth || 13)),
    Math.max(1, next.termMonths + 12),
  )

  return next
}
