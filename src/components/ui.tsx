import { useId, useState, type ReactNode } from 'react'

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
  help,
  children,
}: {
  label: string
  hint?: string
  help?: ReactNode
  children: ReactNode
}) {
  const [showHelp, setShowHelp] = useState(false)
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-ink">{label}</span>
        {help ? (
          <button
            type="button"
            onClick={() => setShowHelp((open) => !open)}
            className="grid size-5 shrink-0 place-items-center rounded-full border border-primary text-[11px] font-semibold text-primary"
            aria-expanded={showHelp}
            aria-label={`O que significa ${label}?`}
          >
            ?
          </button>
        ) : null}
      </div>
      {showHelp && help ? (
        <p className="rounded-xl bg-primary-soft px-3 py-2 text-xs leading-relaxed text-ink">
          {help}
        </p>
      ) : null}
      {children}
      {hint ? <span className="text-xs leading-relaxed text-muted">{hint}</span> : null}
    </div>
  )
}

export function Switch({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  label: string
  description?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 text-left"
    >
      <span>
        <span className="block text-sm font-medium text-ink">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-xs leading-relaxed text-muted">{description}</span>
        ) : null}
      </span>
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          checked ? 'bg-primary' : 'bg-disabled'
        }`}
      >
        <span
          className={`absolute top-0.5 size-5 rounded-full bg-white transition ${
            checked ? 'left-5' : 'left-0.5'
          }`}
        />
      </span>
    </button>
  )
}

export function OptionalBlock({
  enabled,
  onToggle,
  label,
  description,
  help,
  children,
}: {
  enabled: boolean
  onToggle: (value: boolean) => void
  label: string
  description?: string
  help?: ReactNode
  children: ReactNode
}) {
  const [showHelp, setShowHelp] = useState(false)
  return (
    <div className="rounded-2xl border border-line p-4">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <Switch checked={enabled} onChange={onToggle} label={label} description={description} />
        </div>
        {help ? (
          <button
            type="button"
            onClick={() => setShowHelp((open) => !open)}
            className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border border-primary text-[11px] font-semibold text-primary"
            aria-label={`O que significa ${label}?`}
          >
            ?
          </button>
        ) : null}
      </div>
      {showHelp && help ? (
        <p className="mt-3 rounded-xl bg-primary-soft px-3 py-2 text-xs leading-relaxed text-ink">
          {help}
        </p>
      ) : null}
      {enabled ? <div className="mt-4 space-y-4">{children}</div> : null}
    </div>
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

export function Accordion({
  title,
  subtitle,
  children,
  defaultOpen = false,
}: {
  title: string
  subtitle?: string
  children: ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const panelId = useId()
  return (
    <div className="border-t border-line">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-4 py-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      >
        <span>
          <span className="block text-sm font-medium text-ink">{title}</span>
          {subtitle ? <span className="mt-0.5 block text-xs leading-relaxed text-muted">{subtitle}</span> : null}
        </span>
        <span className="shrink-0 text-lg leading-none text-muted" aria-hidden>
          {open ? '−' : '+'}
        </span>
      </button>
      {open ? (
        <div id={panelId} className="pb-5">
          {children}
        </div>
      ) : null}
    </div>
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
