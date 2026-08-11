import type { ReactNode } from 'react'

export function Card({
  children,
  className = '',
  id,
}: {
  children: ReactNode
  className?: string
  id?: string
}) {
  return (
    <section
      id={id}
      className={`rounded-2xl border border-line bg-card p-5 sm:p-7 ${className}`}
    >
      {children}
    </section>
  )
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-ink">{label}</span>
      {children}
      {hint ? <span className="text-xs leading-relaxed text-muted">{hint}</span> : null}
    </label>
  )
}

export const inputClass =
  'w-full rounded-xl border border-line bg-white px-3 py-2.5 text-[15px] text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20'

export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (value: T) => void
  options: { value: T; label: string }[]
}) {
  return (
    <div className="flex flex-wrap gap-1 rounded-xl bg-paper p-1">
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`min-h-10 flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
              active ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

export function Hint({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl bg-paper px-3 py-2.5 text-xs leading-relaxed text-muted">
      {children}
    </p>
  )
}

export function SectionTitle({
  step,
  title,
  subtitle,
}: {
  step?: string
  title: string
  subtitle?: string
}) {
  return (
    <header className="mb-5">
      {step ? (
        <p className="mb-1 text-xs font-semibold tracking-[0.14em] text-muted uppercase">
          {step}
        </p>
      ) : null}
      <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">{title}</h2>
      {subtitle ? <p className="mt-1 text-sm leading-relaxed text-muted">{subtitle}</p> : null}
    </header>
  )
}

export function StepActions({
  onBack,
  onNext,
  nextLabel = 'Continuar',
  backLabel = 'Voltar',
  disableNext = false,
}: {
  onBack?: () => void
  onNext?: () => void
  nextLabel?: string
  backLabel?: string
  disableNext?: boolean
}) {
  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="rounded-full border border-line bg-white px-5 py-2.5 text-sm font-medium text-ink hover:border-ink"
        >
          {backLabel}
        </button>
      ) : (
        <span />
      )}
      {onNext ? (
        <button
          type="button"
          disabled={disableNext}
          onClick={onNext}
          className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          {nextLabel}
        </button>
      ) : null}
    </div>
  )
}
