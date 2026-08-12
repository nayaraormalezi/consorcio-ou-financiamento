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
import { Accordion } from './ui'

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
    },
  ]

  return (
    <div className="space-y-10 sm:space-y-14">
      <section aria-labelledby="parcelas-titulo">
        <h3 id="parcelas-titulo" className="font-display text-xl font-semibold tracking-tight">
          Como suas parcelas evoluem?
        </h3>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">
          Veja como o valor das parcelas pode se comportar ao longo do prazo. Os prazos podem
          ser diferentes — o financiamento segue o contrato bancário.
        </p>
        <div className="mt-5 h-72 w-full sm:h-80">
          <ResponsiveContainer>
            <LineChart data={installmentData} margin={{ top: 12, right: 12, left: 4, bottom: 4 }}>
              <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: '#525f66' }}
                axisLine={{ stroke: GRID }}
                tickLine={false}
                label={{ value: 'Mês', position: 'insideBottom', offset: -2, fontSize: 11, fill: '#525f66' }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#525f66' }}
                tickFormatter={axisMoney}
                width={72}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(value, name) => [formatBRL(Number(value)), String(name)]}
                labelFormatter={(month) => `Mês ${month}`}
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid #d0e0e3',
                  fontSize: 13,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 13, paddingTop: 8 }} />
              <Line
                type="monotone"
                dataKey="consorcio"
                name="Consórcio"
                stroke={CONS}
                dot={false}
                strokeWidth={2.5}
              />
              <Line
                type="monotone"
                dataKey="financiamento"
                name="Financiamento"
                stroke={FIN}
                dot={false}
                strokeWidth={2.5}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section aria-labelledby="desembolso-titulo">
        <h3 id="desembolso-titulo" className="font-display text-xl font-semibold tracking-tight">
          Quanto você desembolsa ao longo do tempo?
        </h3>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">
          Soma do que já saiu do bolso, incluindo entrada ou lance.
        </p>
        <div className="mt-5 h-72 w-full sm:h-80">
          <ResponsiveContainer>
            <AreaChart data={cumulativeData} margin={{ top: 12, right: 12, left: 4, bottom: 4 }}>
              <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: '#525f66' }}
                axisLine={{ stroke: GRID }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#525f66' }}
                tickFormatter={axisMoney}
                width={72}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(value, name) => [formatBRL(Number(value)), String(name)]}
                labelFormatter={(month) => `Mês ${month}`}
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid #d0e0e3',
                  fontSize: 13,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 13, paddingTop: 8 }} />
              <Area
                type="monotone"
                dataKey="consorcio"
                name="Consórcio"
                stroke={CONS}
                fill={CONS}
                fillOpacity={0.12}
              />
              <Area
                type="monotone"
                dataKey="financiamento"
                name="Financiamento"
                stroke={FIN}
                fill={FIN}
                fillOpacity={0.1}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <Accordion
          title="Análises detalhadas"
          subtitle="Composição do valor total — crédito, juros, taxas, fundo e seguros."
        >
          <p className="mb-4 text-sm text-muted">
            O crédito/principal é o bem. O que muda o custo são juros, taxas, fundo e seguros.
          </p>
          <div className="h-72 w-full">
            <ResponsiveContainer>
              <BarChart data={composition} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#525f66' }} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 12, fill: '#525f66' }}
                  tickFormatter={axisMoney}
                  width={72}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value, name) => [formatBRL(Number(value ?? 0)), String(name)]}
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid #d0e0e3',
                    fontSize: 13,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
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
        </Accordion>
      </section>
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
