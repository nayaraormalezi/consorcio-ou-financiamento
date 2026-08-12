import { WHAT_IF_SCENARIOS } from '../calc/defaults'
import { formatBRL } from '../calc/format'
import type { ComparisonResult, SimulatorInput } from '../calc/types'

export function ScenariosBar({
  input,
  onChange,
  onSave,
  saved,
}: {
  input: SimulatorInput
  onChange: (next: SimulatorInput) => void
  onSave: () => void
  saved: { name: string; result: ComparisonResult } | null
}) {
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium text-ink">Testar outro cenário</h3>
          <p className="text-xs text-muted">Altere uma premissa sem refazer o preenchimento.</p>
        </div>
        <button
          type="button"
          onClick={onSave}
          className="text-sm font-medium text-primary underline-offset-2 hover:underline"
        >
          Salvar cenário atual
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {WHAT_IF_SCENARIOS.map((scenario) => (
          <button
            key={scenario.id}
            type="button"
            onClick={() => onChange(scenario.apply(input))}
            className="rounded-full border border-line bg-white px-3 py-1.5 text-sm hover:border-primary"
          >
            {scenario.label}
          </button>
        ))}
      </div>
      {saved ? (
        <p className="mt-4 text-sm text-muted">
          Cenário salvo ({saved.name}): consórcio {formatBRL(saved.result.consortium.totalDisbursed)}{' '}
          vs financiamento {formatBRL(saved.result.financing.totalDisbursed)}.
        </p>
      ) : null}
    </div>
  )
}
