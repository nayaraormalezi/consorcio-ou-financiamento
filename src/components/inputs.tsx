import { digitsToAmount, formatBRL, formatNumber } from '../calc/format'
import { inputClass } from './ui'

export function CurrencyInput({
  value,
  onChange,
  id,
  className = '',
}: {
  value: number
  onChange: (value: number) => void
  id?: string
  className?: string
}) {
  return (
    <input
      id={id}
      inputMode="numeric"
      autoComplete="off"
      className={`${inputClass} ${className}`.trim()}
      value={formatBRL(value)}
      onChange={(event) => {
        const digits = event.target.value.replace(/\D/g, '')
        onChange(digitsToAmount(digits))
      }}
      onFocus={(event) => event.target.select()}
    />
  )
}

export function PercentInput({
  value,
  onChange,
  decimals = 2,
  suffix,
}: {
  value: number
  onChange: (value: number) => void
  decimals?: number
  suffix?: string
}) {
  const factor = 10 ** decimals
  const display = `${formatNumber(value, decimals)}%${suffix ? ` ${suffix}` : ''}`
  return (
    <input
      inputMode="numeric"
      autoComplete="off"
      className={inputClass}
      value={display}
      onChange={(event) => {
        const digits = event.target.value.replace(/\D/g, '')
        if (!digits) {
          onChange(0)
          return
        }
        onChange(Number(digits) / factor)
      }}
      onFocus={(event) => event.target.select()}
    />
  )
}

export function IntegerInput({
  value,
  onChange,
  min = 0,
  max = 9999,
}: {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
}) {
  return (
    <input
      inputMode="numeric"
      autoComplete="off"
      className={inputClass}
      value={String(value)}
      onChange={(event) => {
        const digits = event.target.value.replace(/\D/g, '')
        const next = digits ? Number(digits) : 0
        onChange(Math.min(max, Math.max(min, next)))
      }}
    />
  )
}
