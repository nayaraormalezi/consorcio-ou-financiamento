import { monthlyDiscountFromAnnual } from './rates'
import { mergeCashFlows, presentValue } from './npv'
import type { ConsortiumMonth, ConsortiumResult, SimulatorInput } from './types'

const EPS = 0.005

/**
 * Modelo simplificado de consórcio (v1):
 *
 * 1. Encargos totais = crédito × (taxa de administração + fundo de reserva)
 * 2. Saldo a diluir = crédito + encargos
 * 3. O lance reduz o saldo na contemplação (não entra de novo nas parcelas)
 * 4. Redução de parcela: parcela = saldo / meses restantes no prazo original
 * 5. Redução de prazo: parcela teórica inicial (reajustada) até zerar o saldo
 * 6. No aniversário do grupo, o INPC estimado corrige crédito e saldo remanescente.
 *    O aniversário se repete a cada 12 meses a partir do mês informado.
 *
 * Não há juros de financiamento. O custo é taxa, fundo, seguro e INPC.
 */
export function isGroupAnniversary(
  month: number,
  firstAnniversaryMonth: number,
): boolean {
  if (month < firstAnniversaryMonth) return false
  return (month - firstAnniversaryMonth) % 12 === 0
}

export function simulateConsortium(input: SimulatorInput): ConsortiumResult {
  const credit0 = Math.max(0, input.creditValue)
  const n = Math.max(1, Math.round(input.termMonths))
  const adminFee = credit0 * (Math.max(0, input.consortiumAdminFeePct) / 100)
  const reserveFund = credit0 * (Math.max(0, input.consortiumReservePct) / 100)
  const fundTotal = credit0 + adminFee + reserveFund
  const bid = Math.min(Math.max(0, input.consortiumBid), fundTotal)
  const adj = Math.max(0, input.consortiumAnnualAdjustmentPct) / 100
  const firstAnniversary = Math.max(1, Math.round(input.consortiumFirstAnniversaryMonth || 13))
  const contemplation = Math.min(Math.max(1, Math.round(input.contemplationMonth)), n)
  const membershipFee = Math.max(0, input.consortiumMembershipFee)
  const otherMonthly = Math.max(0, input.consortiumOtherMonthly)
  const theoreticalInstallment = n > 0 ? fundTotal / n : 0

  let outstanding = fundTotal
  let creditValue = credit0
  let inflation = 1
  let inpcApplications = 0
  const schedule: ConsortiumMonth[] = []

  const maxMonths = n + 24

  for (let month = 1; month <= maxMonths; month++) {
    let inpcApplied = false
    if (adj > 0 && isGroupAnniversary(month, firstAnniversary)) {
      inflation *= 1 + adj
      outstanding *= 1 + adj
      creditValue = credit0 * inflation
      inpcApplied = true
      inpcApplications += 1
    }

    let bidNow = 0
    if (month === contemplation && bid > 0) {
      const applied = Math.min(bid, outstanding)
      outstanding -= applied
      bidNow = bid
    }

    if (outstanding < EPS && bidNow === 0 && month > n) break

    let installment = 0
    const remainingContractMonths = n - month + 1

    if (outstanding > EPS) {
      if (input.consortiumBidMode === 'reduce_term' && month >= contemplation && bid > 0) {
        const inflatedBase = theoreticalInstallment * inflation
        installment = Math.min(inflatedBase, outstanding)
      } else if (remainingContractMonths > 0) {
        installment = outstanding / remainingContractMonths
      } else {
        installment = outstanding
      }
    }

    if (installment < EPS) installment = 0
    outstanding = Math.max(0, outstanding - installment)
    if (outstanding < EPS) outstanding = 0

    const insurance = insuranceForMonth(input, creditValue)
    const membership = month === 1 ? membershipFee : 0
    const total = installment + insurance + otherMonthly + bidNow + membership

    schedule.push({
      month,
      installment,
      insurance,
      other: otherMonthly,
      bid: bidNow,
      membershipFee: membership,
      total,
      outstanding,
      creditValue,
      inpcApplied,
    })

    const pastOriginalTerm = month >= n
    if (outstanding < EPS && pastOriginalTerm) break
    if (outstanding < EPS && input.consortiumBidMode === 'reduce_term' && month >= contemplation) {
      break
    }
    if (month >= n && outstanding < EPS) break
  }

  const paidMonths = schedule.filter((row) => row.installment > EPS || row.bid > EPS).length
  const installmentRows = schedule.filter((row) => row.installment > EPS)
  const totalInstallments = installmentRows.reduce((sum, row) => sum + row.installment, 0)
  const totalInsurance = schedule.reduce((sum, row) => sum + row.insurance, 0)
  const totalOtherMonthly = schedule.reduce((sum, row) => sum + row.other, 0)
  const unadjustedFundAfterBid = fundTotal - bid
  const totalReajustmentExtra = Math.max(0, totalInstallments - unadjustedFundAfterBid)

  const cashFlows = mergeCashFlows(
    schedule.map((row) => ({ month: row.month, amount: row.total })),
  )

  const availableCredit =
    input.consortiumBidKind === 'embedded' ? Math.max(0, credit0 - bid) : credit0

  return {
    creditValue: credit0,
    adminFee,
    reserveFund,
    bid,
    availableCredit,
    termMonths: n,
    paidMonths: Math.max(paidMonths, installmentRows.length),
    firstInstallment: (installmentRows[0]?.installment ?? 0) + insuranceForMonth(input, credit0) + otherMonthly,
    lastInstallment:
      (installmentRows.at(-1)?.installment ?? 0) +
      insuranceForMonth(input, installmentRows.at(-1)?.creditValue ?? credit0) +
      otherMonthly,
    totalInstallments,
    totalInsurance,
    totalOtherMonthly,
    membershipFee,
    totalReajustmentExtra,
    inpcApplications,
    finalCreditValue: installmentRows.at(-1)?.creditValue ?? credit0,
    totalDisbursed: schedule.reduce((sum, row) => sum + row.total, 0),
    npv: presentValue(cashFlows, monthlyDiscountFromAnnual(input.discountAnnualPct)),
    schedule,
    cashFlows,
  }
}

function insuranceForMonth(input: SimulatorInput, creditValue: number): number {
  if (input.consortiumInsuranceMode === 'monthly') {
    return Math.max(0, input.consortiumInsuranceMonthly)
  }
  if (input.consortiumInsuranceMode === 'percent') {
    return creditValue * (Math.max(0, input.consortiumInsurancePct) / 100)
  }
  return 0
}

export function theoreticalConsortiumInstallment(
  creditValue: number,
  adminFeePct: number,
  reservePct: number,
  termMonths: number,
): number {
  const fund =
    creditValue *
    (1 + Math.max(0, adminFeePct) / 100 + Math.max(0, reservePct) / 100)
  return termMonths > 0 ? fund / termMonths : 0
}
