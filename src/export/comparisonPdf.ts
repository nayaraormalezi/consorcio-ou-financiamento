import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatBRL, formatCompactMonths, formatPct, formatRateAnnual, formatRateMonthly } from '../calc/format'
import type { ComparisonResult, SimulatorInput } from '../calc/types'

const PRIMARY: [number, number, number] = [0, 92, 169]
const INK: [number, number, number] = [34, 41, 46]
const MUTED: [number, number, number] = [82, 95, 102]
const LINE: [number, number, number] = [208, 224, 227]

function tableBottom(doc: jsPDF): number {
  const extra = doc as jsPDF & { lastAutoTable?: { finalY: number } }
  return extra.lastAutoTable?.finalY ?? 60
}

export function downloadComparisonPdf(input: SimulatorInput, result: ComparisonResult) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const cons = result.consortium
  const fin = result.financing
  const generatedAt = new Date().toLocaleString('pt-BR')

  const cheaper = result.metricsDisagree
    ? `As lentes discordam. No total nominal, ${result.cheaperNominal === 'consortium' ? 'o consórcio' : 'o financiamento'} desembolsaria menos (${formatBRL(Math.abs(result.nominalDiff))}). No valor presente, ${result.cheaperNpv === 'consortium' ? 'o consórcio' : 'o financiamento'} fica menor (${formatBRL(Math.abs(result.npvDiff))}).`
    : result.cheaperNominal === 'tie'
      ? 'Neste cenário, total pago e valor presente ficam praticamente iguais.'
      : `Neste cenário, ${result.cheaperNominal === 'consortium' ? 'o consórcio' : 'o financiamento'} apresenta menor desembolso nominal e menor valor presente dos pagamentos. Isso mede pagamentos, não qual produto é melhor.`

  doc.setFillColor(...PRIMARY)
  doc.rect(0, 0, pageWidth, 28, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('Consórcio ou Financiamento', 14, 12)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text('Comparativo de desembolso estimado', 14, 19)
  doc.setFontSize(8)
  doc.text(generatedAt, pageWidth - 14, 12, { align: 'right' })

  doc.setTextColor(...INK)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('Resumo deste cenário', 14, 36)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...MUTED)
  const lenses = doc.splitTextToSize(
    'Total desembolsado = soma do que sai da conta. Valor presente = o mesmo fluxo convertido para dinheiro de hoje (pagar depois pesa menos). As duas contas podem discordar e as duas estar certas.',
    pageWidth - 28,
  )
  doc.text(lenses, 14, 41)
  doc.setTextColor(...INK)
  doc.setFontSize(9)
  const summary = doc.splitTextToSize(
    `${cheaper} Custo além do crédito: consórcio ${formatBRL(result.consortiumCostBeyondCredit)} vs financiamento ${formatBRL(result.financingCostBeyondCredit)}. INPC estimado eleva a carta de ${formatBRL(cons.creditValue)} para ${formatBRL(cons.finalCreditValue)}.`,
    pageWidth - 28,
  )
  doc.text(summary, 14, 52)

  autoTable(doc, {
    startY: 68,
    head: [['Indicador', 'Consórcio', 'Financiamento']],
    body: [
      ['Crédito original', formatBRL(cons.creditValue), formatBRL(fin.creditValue)],
      ['Crédito estimado na contemplação', formatBRL(cons.creditAtContemplation), formatBRL(fin.creditValue)],
      ['Crédito utilizável', formatBRL(cons.availableCredit), formatBRL(fin.financedAmount + fin.downPayment)],
      ['Tempo até o crédito', `mês ${cons.creditAvailableMonth}`, 'mês 0'],
      ['Carta após reajustes', formatBRL(cons.finalCreditValue), formatBRL(fin.creditValue)],
      ['Lance / Entrada', formatBRL(cons.bid), formatBRL(fin.downPayment)],
      ['Prazo efetivo', formatCompactMonths(cons.paidMonths), formatCompactMonths(fin.termMonths)],
      ['Parcela inicial', formatBRL(cons.firstInstallment), formatBRL(fin.firstInstallment)],
      ['Parcela final', formatBRL(cons.lastInstallment), formatBRL(fin.lastInstallment)],
      ['Juros', 'Não se aplica', formatBRL(fin.totalInterest)],
      ['Taxa de administração', formatBRL(cons.adminFee), '—'],
      ['Fundo de reserva', formatBRL(cons.reserveFund), '—'],
      ['Impacto do reajuste', formatBRL(cons.totalReajustmentExtra), '—'],
      ['Encargos', formatBRL(result.consortiumCostBeyondCredit), formatBRL(result.financingCostBeyondCredit)],
      ['Seguros', formatBRL(cons.totalInsurance), formatBRL(fin.totalInsurance)],
      [
        'Outras taxas',
        formatBRL(cons.membershipFee + cons.totalOtherMonthly),
        formatBRL(fin.totalUpfrontFees + fin.totalMonthlyExtras),
      ],
      ['Total desembolsado', formatBRL(cons.totalDisbursed), formatBRL(fin.totalDisbursed)],
      ['Valor presente dos pagamentos', formatBRL(cons.npv), formatBRL(fin.npv)],
    ],
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      textColor: INK,
      lineColor: LINE,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: PRIMARY,
      textColor: 255,
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 62 },
      1: { cellWidth: 60 },
      2: { cellWidth: 60 },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.row.index >= 16) {
        data.cell.styles.fontStyle = 'bold'
      }
    },
  })

  autoTable(doc, {
    startY: tableBottom(doc) + 10,
    head: [['Premissas usadas nesta simulação', '']],
    body: [
      ['Crédito / bem', formatBRL(input.creditValue)],
      ['Prazo do consórcio', formatCompactMonths(input.termMonths)],
      ['Prazo do financiamento', formatCompactMonths(fin.termMonths)],
      ['Taxa de administração', formatPct(input.consortiumAdminFeePct)],
      ['Fundo de reserva', formatPct(input.consortiumReservePct)],
      [
        'INPC no aniversário do grupo',
        `${formatPct(input.consortiumAnnualAdjustmentPct)} a.a. · 1º aniversário no mês ${input.consortiumFirstAnniversaryMonth} · aplicado ${cons.inpcApplications}x`,
      ],
      [
        'Lance',
        input.consortiumHasBid
          ? `${formatBRL(cons.bid)} (${cons.bidKind === 'embedded' ? 'embutido, não sai do caixa' : 'próprio'})`
          : 'Não informado',
      ],
      ['Contemplação (hipótese)', `Mês ${input.contemplationMonth} — não é previsão`],
      ['Entrada', formatBRL(fin.downPayment)],
      [
        'Juros / CET',
        `${fin.rateSource === 'cet' ? 'CET informado' : 'Taxa de juros'} ${formatRateMonthly(fin.monthlyRate * 100)} efetiva (${formatRateAnnual(fin.annualEffectiveRate * 100)} efetiva) · ${fin.system.toUpperCase()}`,
      ],
      ['Taxa de desconto (valor presente)', `${formatPct(input.discountAnnualPct)} a.a.`],
    ],
    theme: 'plain',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      textColor: INK,
      cellPadding: 1.6,
    },
    headStyles: {
      fillColor: [240, 242, 242],
      textColor: INK,
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 70, textColor: MUTED },
      1: { cellWidth: 112 },
    },
  })

  const notesY = tableBottom(doc) + 12
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...INK)
  doc.text('Como ler este arquivo', 14, notesY)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...MUTED)
  const notes = doc.splitTextToSize(
    'Simulação matemática com as premissas informadas. O total nominal e o valor presente podem discordar: o INPC infla parcelas futuras do consórcio e também aumenta a carta de crédito; o financiamento prefixado não corrige o bem. Custo além do crédito isola taxa, fundo, INPC, juros e tarifas, sem misturar o preço do bem. Esta ferramenta não recomenda uma modalidade.',
    pageWidth - 28,
  )
  doc.text(notes, 14, notesY + 6)

  const pageCount = doc.getNumberOfPages()
  for (let page = 1; page <= pageCount; page++) {
    doc.setPage(page)
    doc.setFontSize(7)
    doc.setTextColor(...MUTED)
    doc.text(
      `Página ${page} de ${pageCount} · Documento gerado pelo simulador comparativo`,
      14,
      287,
    )
  }

  const stamp = new Date().toISOString().slice(0, 10)
  doc.save(`comparativo-consorcio-financiamento-${stamp}.pdf`)
}
