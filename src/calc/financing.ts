import { roundCents } from './format'
import { mergeCashFlows, presentValue } from './npv'
import { monthlyDiscountFromAnnual } from './rates'
import type { CashFlowPoint, FinancingMonth, FinancingResult, SimulatorInput } from './types'

const EPS = 0.005

/**
 * Parcela Price (sistema francês):
 * PMT = P * [ i * (1+i)^n ] / [ (1+i)^n - 1 ]
 * Se i = 0, PMT = P / n
 */
export function priceInstallment(
  principal: number,
  monthlyRate: number,
  n: number,
): number {
  if (n <= 0) return 0
  if (Math.abs(monthlyRate) < 1e-12) return principal / n
  const factor = (1 + monthlyRate) ** n
  return (principal * monthlyRate * factor) / (factor - 1)
}

export function simulateFinancing(
  input: SimulatorInput,
  monthlyRate: number,
  extrasIncludedInCet: boolean,
): FinancingResult {
  const creditValue = Math.max(0, input.creditValue)
  const n = Math.max(1, Math.round(input.termMonths))
  const downPayment = Math.min(Math.max(0, input.downPayment), creditValue)
  const residual = Math.min(Math.max(0, input.residualValue), creditValue - downPayment)
  const financedAmount = roundCents(creditValue - downPayment)
  const amortizable = Math.max(0, financedAmount - residual)

  const skipMonthlyExtras = extrasIncludedInCet
  const insuranceMonthly = skipMonthlyExtras ? 0 : Math.max(0, input.financingInsuranceMonthly)
  const otherMonthly = skipMonthlyExtras ? 0 : Math.max(0, input.financingOtherMonthly)
  const upfrontFees = skipMonthlyExtras
    ? 0
    : Math.max(0, input.originationFee) +
      Math.max(0, input.appraisalFee) +
      Math.max(0, input.registryFee) +
      Math.max(0, input.otherUpfront)

  const system = input.amortization
  const sacAmort = n > 0 ? amortizable / n : 0
  const pmt = priceInstallment(amortizable, monthlyRate, n)

  const schedule: FinancingMonth[] = []
  let balance = financedAmount
  let totalInterest = 0
  let totalAmortization = 0
  let totalInsurance = 0
  let totalMonthlyExtras = 0

  for (let month = 1; month <= n; month++) {
    const opening = balance
    const interest = opening * monthlyRate
    const isLast = month === n

    let amortization: number
    let installment: number
    let residualPayment = 0

    if (system === 'sac') {
      amortization = isLast ? Math.max(0, opening - residual) : sacAmort
      installment = amortization + interest
      if (isLast) {
        residualPayment = residual
        amortization += residual
      }
    } else {
      installment = isLast ? opening * (1 + monthlyRate) - residual : pmt
      amortization = installment - interest
      if (isLast) {
        residualPayment = residual
        amortization += residual
      }
    }

    let closing = opening - amortization
    if (Math.abs(closing) < EPS) closing = 0
    if (closing < 0 && closing > -0.05) closing = 0

    const insurance = insuranceMonthly
    const other = otherMonthly
    const total = installment + insurance + other + residualPayment

    schedule.push({
      month,
      openingBalance: opening,
      amortization,
      interest,
      installment,
      insurance,
      other,
      residual: residualPayment,
      total,
      closingBalance: closing,
    })

    totalInterest += interest
    totalAmortization += amortization
    totalInsurance += insurance
    totalMonthlyExtras += other
    balance = closing
  }

  const cashFlows: CashFlowPoint[] = mergeCashFlows([
    { month: 0, amount: downPayment + upfrontFees },
    ...schedule.map((row) => ({ month: row.month, amount: row.total })),
  ])

  const firstPrincipalInstallment = schedule[0]?.installment ?? 0
  const lastPrincipalInstallment = schedule.at(-1)?.installment ?? 0

  return {
    creditValue,
    downPayment,
    financedAmount,
    system,
    monthlyRate,
    annualEffectiveRate: (1 + monthlyRate) ** 12 - 1,
    annualNominalRate: monthlyRate * 12,
    rateSource: extrasIncludedInCet ? 'cet' : 'interest',
    firstInstallment: firstPrincipalInstallment + insuranceMonthly + otherMonthly,
    lastInstallment:
      lastPrincipalInstallment +
      insuranceMonthly +
      otherMonthly +
      (schedule.at(-1)?.residual ?? 0),
    totalInterest,
    totalAmortization,
    totalInsurance,
    totalMonthlyExtras,
    totalUpfrontFees: upfrontFees,
    residual,
    totalDisbursed:
      downPayment +
      upfrontFees +
      schedule.reduce((sum, row) => sum + row.total, 0),
    npv: presentValue(cashFlows, monthlyDiscountFromAnnual(input.discountAnnualPct)),
    extrasIncludedInCet,
    schedule,
    cashFlows,
  }
}
