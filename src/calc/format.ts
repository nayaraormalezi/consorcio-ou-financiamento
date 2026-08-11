const BRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const PCT = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const PCT_RATE = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
})

export function formatBRL(value: number): string {
  if (!Number.isFinite(value)) return 'R$ 0,00'
  return BRL.format(value)
}

export function formatPct(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return '0,00%'
  const fmt =
    digits === 2
      ? PCT
      : new Intl.NumberFormat('pt-BR', {
          minimumFractionDigits: digits,
          maximumFractionDigits: digits,
        })
  return `${fmt.format(value)}%`
}

export function formatRateMonthly(pct: number): string {
  return `${PCT_RATE.format(pct)}% a.m.`
}

export function formatRateAnnual(pct: number): string {
  return `${PCT_RATE.format(pct)}% a.a.`
}

export function formatNumber(value: number, digits = 2): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)
}

export function formatCompactMonths(months: number): string {
  if (months < 12) return `${months} ${months === 1 ? 'mês' : 'meses'}`
  const years = Math.floor(months / 12)
  const rest = months % 12
  const yearLabel = years === 1 ? '1 ano' : `${years} anos`
  if (rest === 0) return `${yearLabel} (${months} meses)`
  return `${yearLabel} e ${rest} ${rest === 1 ? 'mês' : 'meses'}`
}

/** Digits-only string (centavos) → number in reais. */
export function digitsToAmount(digits: string): number {
  const clean = digits.replace(/\D/g, '')
  if (!clean) return 0
  return Number(clean) / 100
}

export function amountToDigits(value: number): string {
  const cents = Math.round(Math.max(0, value) * 100)
  return String(cents)
}

export function roundCents(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function almostEqual(a: number, b: number, eps = 0.02): boolean {
  return Math.abs(a - b) <= eps
}
