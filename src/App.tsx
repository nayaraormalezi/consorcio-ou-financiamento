import { lazy, Suspense, useMemo, useState } from 'react'
import { createDefaultInput } from './calc/defaults'
import { formatBRL } from './calc/format'
import { simulate, syncDerivedFields } from './calc/simulate'
import type { ComparisonResult, SimulatorInput } from './calc/types'
import { AcquisitionForm } from './components/AcquisitionForm'
import { ConsortiumForm } from './components/ConsortiumForm'
import { CostVsTime } from './components/CostVsTime'
import { FinancingForm } from './components/FinancingForm'
import { Premises } from './components/Premises'
import { ResultsPanel } from './components/ResultsPanel'
import { ScenariosBar } from './components/ScenariosBar'
import { Schedule } from './components/Schedule'
import { DownloadPdfButton } from './components/DownloadPdfButton'
import { StepActions } from './components/ui'

const ChartsPanel = lazy(async () => {
  const mod = await import('./components/ChartsPanel')
  return { default: mod.ChartsPanel }
})

const STEPS = [
  { id: 1, label: 'Crédito' },
  { id: 2, label: 'Consórcio' },
  { id: 3, label: 'Financiamento' },
  { id: 4, label: 'Resultado' },
] as const

export default function App() {
  const [step, setStep] = useState(1)
  const [maxReached, setMaxReached] = useState(1)
  const [input, setInput] = useState<SimulatorInput>(() => createDefaultInput())
  const [saved, setSaved] = useState<{
    name: string
    input: SimulatorInput
    result: ComparisonResult
  } | null>(null)

  const result = useMemo(() => simulate(input), [input])
  const stepErrors = errorsForStep(step, input)

  function patch(partial: Partial<SimulatorInput>) {
    setInput((current) => syncDerivedFields({ ...current, ...partial }))
  }

  function goTo(next: number) {
    const target = Math.min(4, Math.max(1, next))
    setStep(target)
    setMaxReached((current) => Math.max(current, target))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function continueFrom(current: number) {
    if (errorsForStep(current, input).length > 0) return
    goTo(current + 1)
  }

  return (
    <div className="min-h-svh">
      <header className="no-print border-b border-line bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 sm:px-6">
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] text-muted uppercase">
              Simulador comparativo
            </p>
            <h1 className="font-display mt-1 text-[1.75rem] leading-tight font-semibold tracking-tight sm:text-4xl">
              Consórcio ou Financiamento: qual custa menos?
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
              Compare parcelas, juros, taxas e o total que você desembolsará.
              Os números valem apenas para as premissas informadas.
            </p>
          </div>
          <nav className="no-print" aria-label="Etapas da simulação">
            <ol className="grid grid-cols-4 gap-2">
              {STEPS.map((item) => {
                const active = step === item.id
                const reachable = item.id <= maxReached
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      disabled={!reachable}
                      onClick={() => goTo(item.id)}
                      className={`flex w-full flex-col rounded-xl border px-2 py-2 text-left transition sm:px-3 ${
                        active
                          ? 'border-primary bg-primary text-white'
                          : reachable
                            ? 'border-line bg-white text-ink hover:border-primary'
                            : 'cursor-not-allowed border-line bg-paper text-disabled'
                      }`}
                    >
                      <span className="text-[10px] font-semibold tracking-wide uppercase sm:text-xs">
                        Etapa {item.id}
                      </span>
                      <span className="truncate text-xs font-medium sm:text-sm">{item.label}</span>
                    </button>
                  </li>
                )
              })}
            </ol>
          </nav>
        </div>
      </header>

      {step === 4 ? (
        <div className="sticky top-0 z-20 border-b border-line bg-ink text-white sm:hidden">
          <div className="grid grid-cols-2 gap-px bg-white/10 text-xs">
          <div className="px-3 py-2">
            <p className="text-inverse-muted">Consórcio · total / VP</p>
            <p className="font-medium">
              {formatBRL(result.consortium.totalDisbursed)} · {formatBRL(result.consortium.npv)}
            </p>
          </div>
          <div className="px-3 py-2">
            <p className="text-inverse-muted">Financiamento · total / VP</p>
            <p className="font-medium">
              {formatBRL(result.financing.totalDisbursed)} · {formatBRL(result.financing.npv)}
            </p>
          </div>
          </div>
        </div>
      ) : null}

      <main className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6 sm:py-10">
        <aside className="rounded-2xl border border-info/30 bg-info-soft px-4 py-3 text-sm leading-relaxed text-info">
          Esta é uma simulação matemática. No consórcio, o crédito e as parcelas
          são corrigidos pelo INPC no aniversário do grupo, com a taxa que você
          informar. Condições reais podem variar. A ferramenta não recomenda
          consórcio nem financiamento — ela responde quanto você desembolsaria
          nestas premissas.
        </aside>

        {stepErrors.length > 0 ? (
          <aside className="rounded-2xl border border-negative/30 bg-negative-soft px-4 py-3 text-sm text-negative">
            {stepErrors.map((error) => (
              <p key={error}>{error}</p>
            ))}
          </aside>
        ) : null}

        {step === 1 ? (
          <AcquisitionForm
            input={input}
            onChange={patch}
            footer={
              <StepActions
                onNext={() => continueFrom(1)}
                nextLabel="Continuar para o consórcio"
                disableNext={stepErrors.length > 0}
              />
            }
          />
        ) : null}

        {step === 2 ? (
          <ConsortiumForm
            input={input}
            onChange={patch}
            footer={
              <StepActions
                onBack={() => goTo(1)}
                onNext={() => continueFrom(2)}
                nextLabel="Continuar para o financiamento"
                disableNext={stepErrors.length > 0}
              />
            }
          />
        ) : null}

        {step === 3 ? (
          <FinancingForm
            input={input}
            onChange={patch}
            footer={
              <StepActions
                onBack={() => goTo(2)}
                onNext={() => continueFrom(3)}
                nextLabel="Ver o resultado"
                disableNext={stepErrors.length > 0}
              />
            }
          />
        ) : null}

        {step === 4 ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted">Dados preenchidos. Você pode voltar e ajustar qualquer etapa.</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => goTo(3)}
                  className="rounded-full border border-line bg-white px-4 py-2 text-sm font-medium hover:border-primary"
                >
                  Ajustar dados
                </button>
                <DownloadPdfButton input={input} result={result} />
              </div>
            </div>
            <ScenariosBar
              input={input}
              onChange={(next) => setInput(syncDerivedFields(next))}
              onSave={() =>
                setSaved({
                  name: new Date().toLocaleString('pt-BR'),
                  input,
                  result,
                })
              }
              saved={saved}
            />

            {saved ? (
              <section className="rounded-2xl border border-line bg-card p-5">
                <h3 className="font-display text-lg font-medium">Comparação com o cenário salvo</h3>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[520px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-line text-muted">
                        <th className="py-2 font-medium"> </th>
                        <th className="py-2 font-medium">Atual</th>
                        <th className="py-2 font-medium">Salvo</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-line/80">
                        <td className="py-2 text-muted">Consórcio</td>
                        <td>{formatBRL(result.consortium.totalDisbursed)}</td>
                        <td>{formatBRL(saved.result.consortium.totalDisbursed)}</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-muted">Financiamento</td>
                        <td>{formatBRL(result.financing.totalDisbursed)}</td>
                        <td>{formatBRL(saved.result.financing.totalDisbursed)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            ) : null}

            <ResultsPanel result={result} input={input} />
            <Suspense
              fallback={
                <div className="rounded-2xl border border-line bg-card p-5 text-sm text-muted">
                  Carregando gráficos…
                </div>
              }
            >
              <ChartsPanel result={result} />
            </Suspense>
            <CostVsTime input={input} result={result} />
            <Schedule result={result} />
            <Premises input={input} result={result} />
          </>
        ) : null}
      </main>

      <footer className="border-t border-line px-4 py-8 text-center text-xs text-muted">
        Ferramenta educativa e imparcial. Não substitui proposta de administradora,
        banco ou profissional habilitado. Cálculos executados localmente no navegador.
      </footer>
    </div>
  )
}

function errorsForStep(current: number, input: SimulatorInput): string[] {
  if (current === 1) {
    const errors: string[] = []
    if (input.creditValue <= 0) errors.push('Informe um valor de crédito maior que zero.')
    if (input.termMonths < 1 || input.termMonths > 420) {
      errors.push('O prazo deve estar entre 1 e 420 meses.')
    }
    return errors
  }
  if (current === 2) {
    const errors: string[] = []
    if (input.consortiumHasBid && input.consortiumBid < 0) {
      errors.push('O lance não pode ser negativo.')
    }
    if (input.contemplationMonth < 1 || input.contemplationMonth > input.termMonths) {
      errors.push('O mês de contemplação deve estar dentro do prazo.')
    }
    return errors
  }
  if (current === 3) {
    const errors: string[] = []
    if (input.downPayment > input.creditValue) {
      errors.push('A entrada não pode ser maior que o valor do crédito.')
    }
    if (input.rateMonthlyPct < 0 || input.rateAnnualPct < 0) {
      errors.push('As taxas de juros não podem ser negativas.')
    }
    if (
      input.financingHasResidual &&
      input.residualValue > input.creditValue - input.downPayment
    ) {
      errors.push('O valor residual não pode exceder o valor financiado.')
    }
    return errors
  }
  return []
}
