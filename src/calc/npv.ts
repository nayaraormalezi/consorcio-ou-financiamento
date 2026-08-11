import type { CashFlowPoint } from './types'

/**
 * Valor presente de uma série de fluxos mensais.
 * month = 0 é o desembolso inicial (não descontado).
 * VP = Σ CF_t / (1 + i)^t
 */
export function presentValue(
  cashFlows: CashFlowPoint[],
  monthlyRate: number,
): number {
  return cashFlows.reduce((sum, point) => {
    const factor = (1 + monthlyRate) ** point.month
    if (factor === 0) return sum
    return sum + point.amount / factor
  }, 0)
}

export function mergeCashFlows(points: CashFlowPoint[]): CashFlowPoint[] {
  const map = new Map<number, number>()
  for (const point of points) {
    map.set(point.month, (map.get(point.month) ?? 0) + point.amount)
  }
  return [...map.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([month, amount]) => ({ month, amount }))
}
