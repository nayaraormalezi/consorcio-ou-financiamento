import { useMemo, useState } from 'react'
import { formatBRL } from '../calc/format'
import type { ComparisonResult } from '../calc/types'
import { Card } from './ui'

export function Schedule({ result }: { result: ComparisonResult }) {
  const [open, setOpen] = useState(false)
  const csv = useMemo(() => buildCsv(result), [result])

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-xl font-medium">Cronograma mês a mês</h3>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-full border border-line px-3 py-1.5 text-sm"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? 'Ocultar tabela' : 'Ver tabela'}
          </button>
          <a
            className="rounded-full bg-primary px-3 py-1.5 text-sm text-white hover:bg-primary-hover"
            href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`}
            download="cronograma-consorcio-financiamento.csv"
          >
            Exportar CSV
          </a>
        </div>
      </div>
      {open ? (
        <div className="mt-4 max-h-[420px] overflow-auto">
          <table className="w-full min-w-[900px] text-left text-xs">
            <thead className="sticky top-0 bg-card">
              <tr className="border-b border-line text-muted">
                <th className="py-2 pr-2">Mês</th>
                <th className="py-2 pr-2">INPC</th>
                <th className="py-2 pr-2">Cons. parcela</th>
                <th className="py-2 pr-2">Cons. lance</th>
                <th className="py-2 pr-2">Cons. total</th>
                <th className="py-2 pr-2">Fin. juros</th>
                <th className="py-2 pr-2">Fin. amort.</th>
                <th className="py-2 pr-2">Fin. parcela</th>
                <th className="py-2">Fin. saldo</th>
              </tr>
            </thead>
            <tbody>
              {result.financing.schedule.map((fin) => {
                const cons = result.consortium.schedule[fin.month - 1]
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
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted">
          A tabela completa pode ser longa. Use “Ver tabela” ou exporte o CSV para
          auditar juros, amortização, lance e saldo.
        </p>
      )}
    </Card>
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
