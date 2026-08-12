import { useMemo, useState } from 'react'
import { formatBRL } from '../calc/format'
import type { ComparisonResult } from '../calc/types'

export function Schedule({ result }: { result: ComparisonResult }) {
  const [open, setOpen] = useState(false)
  const csv = useMemo(() => buildCsv(result), [result])
  const previewMonths = 6
  const rows = result.financing.schedule
  const preview = rows.slice(0, previewMonths)

  return (
    <section aria-labelledby="cronograma-titulo">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 id="cronograma-titulo" className="font-display text-xl font-semibold tracking-tight">
            Cronograma mês a mês
          </h3>
          <p className="mt-1 text-sm text-muted">
            Veja como os pagamentos evoluem ao longo do período.
          </p>
        </div>
        <a
          className="rounded-full bg-primary px-3 py-1.5 text-sm text-white hover:bg-primary-hover"
          href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`}
          download="cronograma-consorcio-financiamento.csv"
        >
          Exportar CSV
        </a>
      </div>

      <div className="mt-4 overflow-x-auto">
        <ScheduleTable
          rows={preview}
          consortium={result.consortium.schedule}
          caption={`Primeiros ${previewMonths} meses`}
        />
      </div>

      <div className="mt-3">
        <button
          type="button"
          className="text-sm font-medium text-primary underline-offset-2 hover:underline"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
        >
          {open ? 'Ocultar cronograma completo' : 'Ver cronograma completo'}
        </button>
      </div>

      {open ? (
        <div className="mt-4 max-h-[420px] overflow-auto">
          <ScheduleTable
            rows={rows}
            consortium={result.consortium.schedule}
            caption="Cronograma completo"
            sticky
          />
        </div>
      ) : (
        <p className="mt-2 text-xs text-muted">
          A tabela completa pode ser longa. Expanda ou exporte o CSV para auditar juros,
          amortização, lance e saldo.
        </p>
      )}
    </section>
  )
}

function ScheduleTable({
  rows,
  consortium,
  caption,
  sticky = false,
}: {
  rows: ComparisonResult['financing']['schedule']
  consortium: ComparisonResult['consortium']['schedule']
  caption: string
  sticky?: boolean
}) {
  return (
    <table className="w-full min-w-[900px] text-left text-xs">
      <caption className="sr-only">{caption}</caption>
      <thead className={sticky ? 'sticky top-0 bg-card' : undefined}>
        <tr className="border-b border-line text-muted">
          <th className="py-2 pr-2 font-medium">Mês</th>
          <th className="py-2 pr-2 font-medium">INPC</th>
          <th className="py-2 pr-2 font-medium">Cons. parcela</th>
          <th className="py-2 pr-2 font-medium">Cons. lance</th>
          <th className="py-2 pr-2 font-medium">Cons. total</th>
          <th className="py-2 pr-2 font-medium">Fin. juros</th>
          <th className="py-2 pr-2 font-medium">Fin. amort.</th>
          <th className="py-2 pr-2 font-medium">Fin. parcela</th>
          <th className="py-2 font-medium">Fin. saldo</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((fin) => {
          const cons = consortium[fin.month - 1]
          return (
            <tr key={fin.month} className="border-b border-line/70">
              <td className="py-1.5 pr-2">{fin.month}</td>
              <td className="py-1.5 pr-2">{cons?.inpcApplied ? 'Sim' : '—'}</td>
              <td className="py-1.5 pr-2">{formatBRL(cons?.installment ?? 0)}</td>
              <td className="py-1.5 pr-2">{formatBRL(cons?.bid ?? 0)}</td>
              <td className="py-1.5 pr-2">{formatBRL(cons?.total ?? 0)}</td>
              <td className="py-1.5 pr-2">{formatBRL(fin.interest)}</td>
              <td className="py-1.5 pr-2">{formatBRL(fin.amortization)}</td>
              <td className="py-1.5 pr-2">{formatBRL(fin.total)}</td>
              <td className="py-1.5">{formatBRL(fin.closingBalance)}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function buildCsv(result: ComparisonResult): string {
  const header = [
    'mes',
    'consorcio_inpc_aniversario',
    'consorcio_parcela',
    'consorcio_lance',
    'consorcio_seguro',
    'consorcio_total',
    'fin_saldo_inicial',
    'fin_juros',
    'fin_amortizacao',
    'fin_parcela',
    'fin_seguro',
    'fin_total',
    'fin_saldo_final',
  ].join(';')
  const n = Math.max(result.consortium.schedule.length, result.financing.schedule.length)
  const lines = [header]
  for (let i = 0; i < n; i++) {
    const c = result.consortium.schedule[i]
    const f = result.financing.schedule[i]
    lines.push(
      [
        i + 1,
        c?.inpcApplied ? 'sim' : 'nao',
        csvNum(c?.installment),
        csvNum(c?.bid),
        csvNum(c?.insurance),
        csvNum(c?.total),
        csvNum(f?.openingBalance),
        csvNum(f?.interest),
        csvNum(f?.amortization),
        csvNum(f?.installment),
        csvNum(f?.insurance),
        csvNum(f?.total),
        csvNum(f?.closingBalance),
      ].join(';'),
    )
  }
  return lines.join('\n')
}

function csvNum(value: number | undefined) {
  return (value ?? 0).toFixed(2).replace('.', ',')
}
