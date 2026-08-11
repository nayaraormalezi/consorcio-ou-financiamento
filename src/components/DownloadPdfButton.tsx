import { useState } from 'react'
import { downloadComparisonPdf } from '../export/comparisonPdf'
import type { ComparisonResult, SimulatorInput } from '../calc/types'

export function DownloadPdfButton({
  input,
  result,
}: {
  input: SimulatorInput
  result: ComparisonResult
}) {
  const [busy, setBusy] = useState(false)

  async function handleClick() {
    setBusy(true)
    try {
      downloadComparisonPdf(input, result)
    } finally {
      window.setTimeout(() => setBusy(false), 400)
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      disabled={busy}
      className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
    >
      {busy ? 'Gerando PDF…' : 'Baixar comparativo em PDF'}
    </button>
  )
}
