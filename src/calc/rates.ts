/**
 * Conversões de taxa.
 *
 * Convenção desta simulação:
 * - A taxa mensal informada é tratada como taxa efetiva mensal.
 * - A taxa anual efetiva i_a relaciona-se com a mensal efetiva i_m por:
 *     (1 + i_a) = (1 + i_m)^12
 *     i_m = (1 + i_a)^(1/12) - 1
 * - A taxa anual nominal capitalizada mensalmente é:
 *     i_nom = i_m * 12
 *
 * Os cálculos de SAC e Price usam sempre a taxa efetiva mensal.
 */

export function monthlyFromEffectiveAnnual(annual: number): number {
  if (annual <= -1) return 0
  return (1 + annual) ** (1 / 12) - 1
}

export function effectiveAnnualFromMonthly(monthly: number): number {
  if (monthly <= -1) return 0
  return (1 + monthly) ** 12 - 1
}

export function monthlyFromNominalAnnual(nominalAnnual: number): number {
  return nominalAnnual / 12
}

export function nominalAnnualFromMonthly(monthly: number): number {
  return monthly * 12
}

export function pctToRate(pct: number): number {
  return pct / 100
}

export function rateToPct(rate: number): number {
  return rate * 100
}

export function monthlyDiscountFromAnnual(annualPct: number): number {
  const annual = Math.max(0, annualPct) / 100
  return (1 + annual) ** (1 / 12) - 1
}

export function resolveMonthlyRate(params: {
  monthlyPct: number
  annualPct: number
  inputMode: 'monthly' | 'annual'
  annualKind: 'effective' | 'nominal'
}): { monthly: number; annualEffective: number; annualNominal: number } {
  let monthly: number
  if (params.inputMode === 'monthly') {
    monthly = pctToRate(params.monthlyPct)
  } else if (params.annualKind === 'nominal') {
    monthly = monthlyFromNominalAnnual(pctToRate(params.annualPct))
  } else {
    monthly = monthlyFromEffectiveAnnual(pctToRate(params.annualPct))
  }

  return {
    monthly,
    annualEffective: effectiveAnnualFromMonthly(monthly),
    annualNominal: nominalAnnualFromMonthly(monthly),
  }
}
