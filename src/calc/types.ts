export type BidMode = 'reduce_installment' | 'reduce_term'
export type BidKind = 'own' | 'embedded'

/** Reservado: comparação a prazos de mercado vs mesmo prazo. Ainda não exposto na UI. */
export type ComparisonHorizon = 'market_terms' | 'same_term'
export type InsuranceMode = 'none' | 'monthly' | 'percent'
export type AmortizationSystem = 'sac' | 'price'
export type RateInputMode = 'monthly' | 'annual'
export type AnnualRateKind = 'effective' | 'nominal'
export type CreditTiming = 'immediate' | '6m' | '1y' | 'flexible'
export type MoneyPctField = 'money' | 'pct'

export interface SimulatorInput {
  creditValue: number
  termMonths: number
  financingTermMonths: number
  creditTiming: CreditTiming

  consortiumAdminFeePct: number
  consortiumReservePct: number
  consortiumInsuranceMode: InsuranceMode
  consortiumInsuranceMonthly: number
  consortiumInsurancePct: number
  consortiumHasInsurance: boolean
  consortiumHasBid: boolean
  consortiumBid: number
  consortiumBidPct: number
  consortiumBidLastEdited: MoneyPctField
  consortiumBidMode: BidMode
  consortiumBidKind: BidKind
  consortiumAnnualAdjustmentPct: number
  consortiumFirstAnniversaryMonth: number
  consortiumHasMembershipFee: boolean
  consortiumMembershipFee: number
  consortiumHasOtherMonthly: boolean
  consortiumOtherMonthly: number
  contemplationMonth: number

  downPayment: number
  downPaymentPct: number
  downPaymentLastEdited: MoneyPctField
  rateMonthlyPct: number
  rateAnnualPct: number
  rateInputMode: RateInputMode
  annualRateKind: AnnualRateKind
  amortization: AmortizationSystem
  financingHasInsurance: boolean
  financingInsuranceMonthly: number
  financingHasOtherCosts: boolean
  originationFee: number
  appraisalFee: number
  registryFee: number
  otherUpfront: number
  financingOtherMonthly: number
  financingHasResidual: boolean
  residualValue: number
  useCet: boolean
  cetMonthlyPct: number
  cetAnnualPct: number
  cetInputMode: RateInputMode
  cetIncludesExtras: boolean

  discountAnnualPct: number
}

export interface CashFlowPoint {
  month: number
  amount: number
}

export interface ConsortiumMonth {
  month: number
  installment: number
  insurance: number
  other: number
  bid: number
  membershipFee: number
  total: number
  outstanding: number
  creditValue: number
  inpcApplied: boolean
}

export interface FinancingMonth {
  month: number
  openingBalance: number
  amortization: number
  interest: number
  installment: number
  insurance: number
  other: number
  residual: number
  total: number
  closingBalance: number
}

export interface ConsortiumResult {
  creditValue: number
  adminFee: number
  reserveFund: number
  bid: number
  bidKind: BidKind
  /** Carta vigente no mês da contemplação (premissa do modelo linear + INPC). */
  creditAtContemplation: number
  /**
   * Crédito que o cotista pode usar na contemplação.
   * Embutido: carta vigente − lance. Próprio: carta vigente.
   */
  availableCredit: number
  creditAvailableMonth: number
  termMonths: number
  paidMonths: number
  firstInstallment: number
  lastInstallment: number
  totalInstallments: number
  totalInsurance: number
  totalOtherMonthly: number
  membershipFee: number
  totalReajustmentExtra: number
  inpcApplications: number
  finalCreditValue: number
  totalDisbursed: number
  npv: number
  schedule: ConsortiumMonth[]
  cashFlows: CashFlowPoint[]
}

export interface FinancingResult {
  creditValue: number
  downPayment: number
  financedAmount: number
  termMonths: number
  system: AmortizationSystem
  monthlyRate: number
  annualEffectiveRate: number
  annualNominalRate: number
  rateSource: 'cet' | 'interest'
  firstInstallment: number
  lastInstallment: number
  totalInterest: number
  totalAmortization: number
  totalInsurance: number
  totalMonthlyExtras: number
  totalUpfrontFees: number
  residual: number
  totalDisbursed: number
  npv: number
  extrasIncludedInCet: boolean
  schedule: FinancingMonth[]
  cashFlows: CashFlowPoint[]
}

export type CheaperOption = 'consortium' | 'financing' | 'tie'

export interface ComparisonResult {
  consortium: ConsortiumResult
  financing: FinancingResult
  cheaperNominal: CheaperOption
  cheaperNpv: CheaperOption
  cheaperCostBeyond: CheaperOption
  nominalDiff: number
  npvDiff: number
  nominalDiffPct: number
  npvDiffPct: number
  consortiumCostBeyondCredit: number
  financingCostBeyondCredit: number
  creditPurchasingPowerGain: number
  metricsDisagree: boolean
  errors: string[]
}
