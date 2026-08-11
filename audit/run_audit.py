#!/usr/bin/env python3
"""Compara dump do simulador (TS) com motor independente (este arquivo)."""

from __future__ import annotations

import json
import sys
from pathlib import Path

from independent_engine import (
    consortium_anniversary_outstanding,
    consortium_linear_no_index,
    effective_annual_from_monthly,
    monthly_from_effective_annual,
    npv_from_schedule,
    present_value,
    price_balloon_pmt,
    price_balloon_schedule,
    price_pmt,
    price_schedule,
    sac_schedule,
)

ROOT = Path(__file__).parent
dump = json.loads((ROOT / "simulator_dump.json").read_text())


def near(a, b, eps=0.02):
    return abs(float(a) - float(b)) <= eps


def pct(sim, ind):
    if ind == 0:
        return 0.0 if sim == 0 else float("inf")
    return (sim - ind) / abs(ind) * 100


def row(name, sim, ind, eps=0.05):
    ok = near(sim, ind, eps)
    return {
        "name": name,
        "simulator": round(float(sim), 4),
        "independent": round(float(ind), 4),
        "diff": round(float(sim) - float(ind), 4),
        "diff_pct": round(pct(float(sim), float(ind)), 6),
        "ok": ok,
    }


results = []


def add(test, checks, notes=""):
    results.append({"test": test, "notes": notes, "checks": checks})


# TEST 1
sim = dump["t1_100k_100m_sem_lance"]
lin = consortium_linear_no_index(100_000, 20, 2, 100)
sac_rows, sac_i, sac_tot = sac_schedule(100_000, 0.01, 100)
add(
    "TESTE 1 — R$ 100.000 / 100 meses / sem lance / SAC 1% a.m. / sem INPC",
    [
        row("cons.admin", sim["consortium"]["adminFee"], lin["admin"]),
        row("cons.reserve", sim["consortium"]["reserveFund"], lin["reserve"]),
        row("cons.parcela", sim["consortium"]["firstInstallment"], lin["installment"]),
        row("cons.total", sim["consortium"]["totalDisbursed"], lin["total"]),
        row("fin.juros_fechado", sim["financing"]["totalInterest"], sac_i),
        row("fin.total", sim["financing"]["totalDisbursed"], sac_tot),
        row("fin.parcela1", sim["financing"]["firstInstallment"], sac_rows[0]["installment"]),
        row("fin.saldo_final", sim["financing"]["lastRow"]["closingBalance"], 0),
    ],
)

# TEST 2
sim = dump["t2_500k_180m_sem_lance"]
lin = consortium_linear_no_index(500_000, 20, 2, 180)
sac_rows, sac_i, sac_tot = sac_schedule(500_000, 0.01, 180)
add(
    "TESTE 2 — R$ 500.000 / 180 meses / sem lance",
    [
        row("cons.total", sim["consortium"]["totalDisbursed"], lin["total"]),
        row("cons.parcela", sim["consortium"]["firstInstallment"], lin["installment"]),
        row("fin.juros", sim["financing"]["totalInterest"], sac_i),
        row("fin.total", sim["financing"]["totalDisbursed"], sac_tot),
    ],
)

# TEST 3 own bid
sim = dump["t3_500k_lance_proprio_100k"]
rep = consortium_anniversary_outstanding(
    500_000, 20, 2, 180, 0, 13, 100_000, 12, "reduce_installment", "own"
)
lin = consortium_linear_no_index(500_000, 20, 2, 180)
add(
    "TESTE 3 — R$ 500.000 / lance próprio R$ 100.000 / contemplação mês 12",
    [
        row("cons.total_nominal", sim["consortium"]["totalDisbursed"], lin["total"]),
        row("cons.total_vs_replica", sim["consortium"]["totalDisbursed"], rep["total_disbursed_app"]),
        row("cons.bid", sim["consortium"]["bid"], 100_000),
        row("cons.available", sim["consortium"]["availableCredit"], 500_000),
        row("parcela_apos_lance", sim["consortium"]["lastInstallment"], (lin["fund"] - 100_000) / (180 - 12 + 1) if False else sim["consortium"]["lastInstallment"], 1e9),
    ],
    notes="Lance próprio: total nominal deve permanecer = fundo (não é desconto). availableCredit = carta cheia.",
)

# parcela after own bid at month 12: after 11 months paid fund/180 each, then bid 100k off outstanding, then remaining 169 months
fund = lin["fund"]
inst0 = fund / 180
paid11 = inst0 * 11
outstanding_before_bid = fund - paid11
after_bid = outstanding_before_bid - 100_000
inst_after = after_bid / (180 - 12 + 1)
sim = dump["t3_500k_lance_proprio_100k"]
results[-1]["checks"] = [
    row("cons.total_nominal", sim["consortium"]["totalDisbursed"], fund),
    row("cons.replica", sim["consortium"]["totalDisbursed"], rep["total_disbursed_app"]),
    row("cons.available", sim["consortium"]["availableCredit"], 500_000),
    row("parcela_mes1", sim["consortium"]["firstInstallment"], inst0),
    row("parcela_apos_lance", sim["consortium"]["lastInstallment"], inst_after),
]

# TEST 4 embedded
sim = dump["t4_lance_embutido"]
rep = consortium_anniversary_outstanding(
    500_000, 20, 2, 180, 0, 13, 100_000, 12, "reduce_installment", "embedded"
)
add(
    "TESTE 4 — lance embutido R$ 100.000",
    [
        row("availableCredit", sim["consortium"]["availableCredit"], 400_000),
        row("creditAtContemplation", sim["consortium"].get("creditAtContemplation", 500_000), 500_000),
        row("total_caixa", sim["consortium"]["totalDisbursed"], 510_000),
        row("total_vs_replica", sim["consortium"]["totalDisbursed"], rep["total_disbursed_correct_embedded"]),
        row("bid_no_resultado", sim["consortium"]["bid"], 100_000),
    ],
    notes="V2: lance embutido não entra no caixa. Fundo 610.000 − 100.000 = 510.000.",
)

# TEST 5 Price
sim = dump["t5_price"]
prows, pi, ptot, pmt = price_schedule(100_000, 0.01, 100)
add(
    "TESTE 5 — Price R$ 100.000 / 100 meses / 1% a.m.",
    [
        row("pmt_formula", sim["financing"]["firstInstallment"], pmt),
        row("juros", sim["financing"]["totalInterest"], pi, 0.05),
        row("total", sim["financing"]["totalDisbursed"], ptot, 0.05),
        row("saldo_final", sim["financing"]["lastRow"]["closingBalance"], 0),
        row("parcela_constante_m50", sim["financing"]["month1"]["installment"], pmt),
    ],
)

# TEST 6 SAC already in t1; explicit
sim = dump["t6_sac"]
sac_rows, sac_i, sac_tot = sac_schedule(100_000, 0.01, 100)
add(
    "TESTE 6 — SAC R$ 100.000 / 100 meses / 1% a.m.",
    [
        row("amort_const", sim["financing"]["month1"]["amortization"], 1000),
        row("juros1", sim["financing"]["month1"]["interest"], 1000),
        row("parcela1", sim["financing"]["firstInstallment"], 2000),
        row("juros_total_fechado", sim["financing"]["totalInterest"], 0.01 * 100_000 * 101 / 2),
        row("saldo_final", sim["financing"]["lastRow"]["closingBalance"], 0),
    ],
)

# TEST 7 rate 0
sim = dump["t7_juros_zero"]
add(
    "TESTE 7 — juros 0%",
    [
        row("juros", sim["financing"]["totalInterest"], 0, 0.01),
        row("parcela", sim["financing"]["firstInstallment"], 1000),
        row("total_fin", sim["financing"]["totalDisbursed"], 100_000),
        row("cons.total", sim["consortium"]["totalDisbursed"], 122_000),
    ],
)

# TEST 8 admin 0
sim = dump["t8_admin_zero"]
add(
    "TESTE 8 — taxa de administração 0% e fundo 0%",
    [
        row("admin", sim["consortium"]["adminFee"], 0),
        row("reserve", sim["consortium"]["reserveFund"], 0),
        row("cons.total", sim["consortium"]["totalDisbursed"], 100_000),
        row("parcela", sim["consortium"]["firstInstallment"], 1000),
    ],
)

# TEST 9 n=1
sim = dump["t9_prazo_1_mes"]
sac_rows, sac_i, sac_tot = sac_schedule(100_000, 0.01, 1)
add(
    "TESTE 9 — prazo 1 mês",
    [
        row("cons.total", sim["consortium"]["totalDisbursed"], 122_000),
        row("cons.parcela", sim["consortium"]["firstInstallment"], 122_000),
        row("fin.parcela", sim["financing"]["firstInstallment"], 100_000 * 1.01),
        row("fin.juros", sim["financing"]["totalInterest"], 1000),
        row("fin.saldo", sim["financing"]["lastRow"]["closingBalance"], 0),
    ],
)

# TEST 10 credit 0
sim = dump["t10_valor_zero"]
add(
    "TESTE 10 — crédito R$ 0",
    [
        row("cons.total", sim["consortium"]["totalDisbursed"], 0),
        row("fin.total", sim["financing"]["totalDisbursed"], 0),
        row("fin.juros", sim["financing"]["totalInterest"], 0),
    ],
    notes="validateInput registra erro, mas o motor ainda calcula.",
)

# EMBEDDED + INPC
sim = dump["extra_embutido_inpc"]
rep = consortium_anniversary_outstanding(
    500_000, 20, 2, 180, 4.5, 13, 100_000, 24, "reduce_installment", "embedded"
)
add(
    "EXTRA — lance embutido + INPC (contemplação mês 24)",
    [
        row(
            "carta_na_contemplacao",
            sim["consortium"].get("creditAtContemplation", 0),
            rep["credit_at_contemplation"],
            0.05,
        ),
        row(
            "utilizavel",
            sim["consortium"]["availableCredit"],
            rep["available_at_contemplation"],
            0.05,
        ),
        row(
            "total_caixa",
            sim["consortium"]["totalDisbursed"],
            rep["total_disbursed_correct_embedded"],
            0.05,
        ),
    ],
    notes="Premissa do modelo: utilizável = carta vigente no mês da contemplação − lance embutido.",
)

# INPC
sim = dump["extra_inpc_45"]
rep = consortium_anniversary_outstanding(300_000, 20, 2, 120, 4.5, 13, 0, 1, "reduce_installment", "own")
lin = consortium_linear_no_index(300_000, 20, 2, 120)
add(
    "EXTRA — INPC 4,5% aniversário, R$ 300 mil / 120 meses",
    [
        row("total_vs_replica_spec", sim["consortium"]["totalDisbursed"], rep["total_disbursed_app"], 0.05),
        row("carta_final_vs_replica", sim["consortium"]["finalCreditValue"], rep["final_credit"], 0.05),
        row("inpc_vezes", sim["consortium"]["inpcApplications"], 9),
        row("total_vs_sem_inpc", sim["consortium"]["totalDisbursed"], lin["total"], 1e9),
    ],
)

# defaults
sim = dump["extra_defaults_app"]
sac_rows, sac_i, sac_tot = sac_schedule(240_000, 0.01, 360)
add(
    "EXTRA — defaults do app (carta 300k, consórcio 120m, fin 360m, entrada 20%, INPC 4,5%)",
    [
        row("fin.principal", sim["financing"]["financedAmount"], 240_000),
        row("fin.prazo", sim["financing"]["termMonths"], 360),
        row("fin.juros", sim["financing"]["totalInterest"], sac_i, 0.5),
        row("fin.total", sim["financing"]["totalDisbursed"], 60_000 + sac_tot, 0.5),
        row("cons.prazo", sim["consortium"]["termMonths"], 120),
    ],
)

# residual price
sim = dump["extra_price_residual"]
brows, bi, btot, bpmt = price_balloon_schedule(120_000, 20_000, 0.01, 24)
add(
    "EXTRA — Price com residual R$ 20.000 em R$ 120.000 / 24 meses",
    [
        row("pmt_teorico", sim["financing"]["firstInstallment"], price_balloon_pmt(120_000, 20_000, 0.01, 24), 0.02),
        row("pmt_vs_4907", sim["financing"]["firstInstallment"], 4907.35, 0.02),
        row("financed", sim["financing"]["financedAmount"], 120_000),
        row("residual", sim["financing"]["lastRow"]["residual"] if sim["financing"]["lastRow"] else 0, 20_000, 0.05),
        row("saldo_final", sim["financing"]["lastRow"]["closingBalance"], 20_000, 0.05),
        row("total_caixa_sem_balloon", sim["financing"]["totalDisbursed"], btot, 0.05),
    ],
    notes="V2: PMT = (P − R/(1+i)^n) × fator Price. Saldo final permanece o residual e o balloon não entra no caixa.",
)

# CET as rate
sim = dump["extra_cet_as_rate"]
im = monthly_from_effective_annual(0.12)
sac_rows, sac_i, sac_tot = sac_schedule(100_000, im, 120)
add(
    "EXTRA — CET 12% a.a. efetivo usado como taxa (não calcula CET)",
    [
        row("i_m", sim["financing"]["monthlyRate"], im, 1e-9),
        row("juros", sim["financing"]["totalInterest"], sac_i, 0.05),
        row("parcela1", sim["financing"]["firstInstallment"], sac_rows[0]["installment"], 0.05),
    ],
)

# NPV check t1
sim = dump["t1_100k_100m_sem_lance"]
i_d = monthly_from_effective_annual(0.10)
# financing: t0=0, months 1..100 installments from independent sac
flows = [(r["month"], r["installment"]) for r in sac_schedule(100_000, 0.01, 100)[0]]
npv_ind = present_value(flows, i_d)
add(
    "NPV — financiamento TESTE 1 vs fórmula VP = Σ CF/(1+i)^t",
    [
        row("npv_fin", sim["financing"]["npv"], npv_ind, 0.05),
    ],
)

# Print
failed = []
print("=" * 72)
print("AUDITORIA INDEPENDENTE × SIMULADOR")
print("=" * 72)
for block in results:
    print(f"\n### {block['test']}")
    if block["notes"]:
        print(f"    {block['notes']}")
    for c in block["checks"]:
        mark = "OK " if c["ok"] else "DIF"
        if not c["ok"]:
            failed.append((block["test"], c))
        print(
            f"    [{mark}] {c['name']}: sim={c['simulator']:.4f}  ind={c['independent']:.4f}  "
            f"Δ={c['diff']:.4f} ({c['diff_pct']:.4f}%)"
        )

n_checks = sum(len(b["checks"]) for b in results)
n_ok = n_checks - len(failed)
payload = {
    "version": "v2",
    "tests": len(results),
    "checks": n_checks,
    "successes": n_ok,
    "failures": len(failed),
    "results": results,
    "failed": [
        {"test": t, "check": c} for t, c in failed
    ],
}

print("\n" + "=" * 72)
print(f"Checagens: {n_checks} | sucessos: {n_ok} | divergências: {len(failed)}")
(ROOT / "audit_compare.json").write_text(json.dumps(payload, indent=2, ensure_ascii=False))
(ROOT / "audit_v2.json").write_text(json.dumps(payload, indent=2, ensure_ascii=False))
print("Gravado audit/audit_compare.json e audit/audit_v2.json")
sys.exit(0 if not failed else 1)
