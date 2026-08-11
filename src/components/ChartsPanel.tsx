import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatBRL } from '../calc/format'
import type { ComparisonResult } from '../calc/types'
import { Card } from './ui'

const CONS = '#005ca9'
const FIN = '#d87b00'
const GRID = '#d0e0e3'
const CONS_DARK = '#00437a'
const CONS_LIGHT = '#8fcbff'
const FIN_DARK = '#804800'
const NEUTRAL = '#9eb2b8'
const NEUTRAL_LIGHT = '#e3ebeb'

export function ChartsPanel({ result }: { result: ComparisonResult }) {
  const installmentData = buildInstallmentSeries(result)
  const cumulativeData = buildCumulativeSeries(result)
  const composition = [
    {
      name: 'Consórcio',
      credito: result.consortium.creditValue,
      taxas: result.consortium.adminFee,
      fundo: result.consortium.reserveFund,
      seguro: result.consortium.totalInsurance,
      outros:
        result.consortium.membershipFee +
        result.consortium.totalOtherMonthly +
        result.consortium.totalReajustmentExtra,
    },
    {
      name: 'Financiamento',
      principal: result.financing.financedAmount + result.financing.downPayment,
      juros: result.financing.totalInterest,
      seguro: result.financing.totalInsurance,
      taxas: result.financing.totalUpfrontFees + result.financing.totalMonthlyExtras,
      outros: result.financing.residual,
    },
  ]

  return (
    <div className="grid gap-5">
      <Card>
        <h3 className="font-display text-xl font-medium">Evolução das parcelas</h3>
        <p className="mt-1 text-sm text-muted">
          Consórcio e financiamento, mês a mês. No SAC a parcela de amortização +
          juros cai; seguros mensais entram no total exibido.
        </p>
        <div className="mt-4 h-72 w-full">
          <ResponsiveContainer>
            <LineChart data={installmentData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={axisMoney} width={72} />
              <Tooltip formatter={(value) => formatBRL(Number(value))} />
              <Legend />
              <Line type="monotone" dataKey="consorcio" name="Consórcio" stroke={CONS} dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="financiamento" name="Financiamento" stroke={FIN} dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h3 className="font-display text-xl font-medium">Composição do valor total</h3>
          <p className="mt-1 text-sm text-muted">
            O crédito/principal é o bem. O que muda o custo são juros, taxas, fundo e seguros.
          </p>
          <div className="mt-4 h-72 w-full">
            <ResponsiveContainer>
              <BarChart data={composition} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={axisMoney} width={72} />
                <Tooltip formatter={(value) => formatBRL(Number(value ?? 0))} />
                <Legend />
                <Bar dataKey="credito" name="Crédito" stackId="a" fill={CONS} />
                <Bar dataKey="taxas" name="Taxas / tarifas" stackId="a" fill={CONS_DARK} />
                <Bar dataKey="fundo" name="Fundo de reserva" stackId="a" fill={CONS_LIGHT} />
                <Bar dataKey="principal" name="Principal + entrada" stackId="a" fill={FIN} />
                <Bar dataKey="juros" name="Juros" stackId="a" fill={FIN_DARK} />
                <Bar dataKey="seguro" name="Seguro" stackId="a" fill={NEUTRAL} />
                <Bar dataKey="outros" name="Outros" stackId="a" fill={NEUTRAL_LIGHT} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="font-display text-xl font-medium">Desembolso acumulado</h3>
          <p className="mt-1 text-sm text-muted">
            Quanto já saiu do bolso ao longo do tempo, incluindo entrada ou lance.
          </p>
          <div className="mt-4 h-72 w-full">
            <ResponsiveContainer>
              <AreaChart data={cumulativeData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={axisMoney} width={72} />
                <Tooltip formatter={(value) => formatBRL(Number(value))} />
                <Legend />
                <Area type="monotone" dataKey="consorcio" name="Consórcio" stroke={CONS} fill={CONS} fillOpacity={0.15} />
                <Area type="monotone" dataKey="financiamento" name="Financiamento" stroke={FIN} fill={FIN} fillOpacity={0.12} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  )
}

function axisMoney(value: number) {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} mi`
  if (Math.abs(value) >= 1_000) return `${Math.round(value / 1000)} mil`
  return String(Math.round(value))
}

function buildInstallmentSeries(result: ComparisonResult) {
  const n = Math.max(result.consortium.schedule.length, result.financing.schedule.length)
  const step = n > 180 ? 2 : 1
  const rows = []
  for (let month = 1; month <= n; month += step) {
    rows.push({
      month,
      consorcio: result.consortium.schedule[month - 1]?.total ?? 0,
      financiamento: result.financing.schedule[month - 1]?.total ?? 0,
    })
  }
  return rows
}

function buildCumulativeSeries(result: ComparisonResult) {
  const consMap = new Map(result.consortium.cashFlows.map((p) => [p.month, p.amount]))
  const finMap = new Map(result.financing.cashFlows.map((p) => [p.month, p.amount]))
  const last = Math.max(
    result.consortium.cashFlows.at(-1)?.month ?? 0,
    result.financing.cashFlows.at(-1)?.month ?? 0,
  )
  let c = 0
  let f = 0
  const rows = []
  const step = last > 180 ? 2 : 1
  for (let month = 0; month <= last; month++) {
    c += consMap.get(month) ?? 0
    f += finMap.get(month) ?? 0
    if (month % step === 0 || month === last) {
      rows.push({ month, consorcio: c, financiamento: f })
    }
  }
  return rows
}
