"""Motor financeiro independente — NÃO importa o código TypeScript do simulador.

Financiamento: fórmulas fechadas SAC/Price (sistema francês).
Consórcio: (A) modelo linear de mercado; (B) réplica da especificação documentada
no próprio app, reescrita do zero, só para isolar bugs de implementação.
"""

from __future__ import annotations

import json
import math
from dataclasses import asdict, dataclass


def round_cents(x: float) -> float:
    return round(x + 1e-12, 2)


def monthly_from_effective_annual(annual: float) -> float:
    if annual <= -1:
        return 0.0
    return (1 + annual) ** (1 / 12) - 1


def effective_annual_from_monthly(monthly: float) -> float:
    if monthly <= -1:
        return 0.0
    return (1 + monthly) ** 12 - 1


def present_value(flows: list[tuple[int, float]], i_m: float) -> float:
    return sum(amount / ((1 + i_m) ** month) for month, amount in flows)


# ---------------------------------------------------------------------------
# Financiamento — primeira princípios
# ---------------------------------------------------------------------------

def price_pmt(pv: float, i: float, n: int) -> float:
    if n <= 0:
        return 0.0
    if abs(i) < 1e-15:
        return pv / n
    f = (1 + i) ** n
    return pv * i * f / (f - 1)


def sac_schedule(principal: float, i: float, n: int):
    amort = principal / n if n else 0.0
    bal = principal
    rows = []
    for m in range(1, n + 1):
        interest = bal * i
        inst = amort + interest
        bal = bal - amort
        if abs(bal) < 1e-8:
            bal = 0.0
        rows.append(
            {
                "month": m,
                "interest": interest,
                "amortization": amort,
                "installment": inst,
                "closing": bal,
            }
        )
    total_interest = i * principal * (n + 1) / 2  # fórmula fechada SAC
    return rows, total_interest, principal + total_interest


def price_balloon_pmt(pv: float, residual: float, i: float, n: int) -> float:
    balloon = min(max(0.0, residual), max(0.0, pv))
    if n <= 0:
        return 0.0
    if abs(i) < 1e-15:
        return max(0.0, pv - balloon) / n
    return price_pmt(max(0.0, pv - balloon / (1 + i) ** n), i, n)


def price_balloon_schedule(principal: float, residual: float, i: float, n: int):
    """Price com balloon: PMT sobre P − R/(1+i)^n; saldo final permanece R (não entra no caixa)."""
    balloon = min(max(0.0, residual), max(0.0, principal))
    pmt = price_balloon_pmt(principal, balloon, i, n)
    bal = principal
    rows = []
    tot_i = 0.0
    for m in range(1, n + 1):
        interest = bal * i
        inst = pmt
        amort = inst - interest
        bal = bal - amort
        tot_i += interest
        if m == n and abs(bal - balloon) < 0.05:
            bal = balloon
        rows.append(
            {
                "month": m,
                "interest": interest,
                "amortization": amort,
                "installment": inst,
                "closing": bal,
                "residual": balloon if m == n else 0.0,
            }
        )
    total_cash = sum(r["installment"] for r in rows)
    return rows, tot_i, total_cash, pmt


def price_schedule(principal: float, i: float, n: int):
    pmt = price_pmt(principal, i, n)
    bal = principal
    rows = []
    tot_i = 0.0
    for m in range(1, n + 1):
        interest = bal * i
        if m == n:
            inst = bal + interest
            amort = bal
        else:
            inst = pmt
            amort = inst - interest
        bal = bal - amort
        if abs(bal) < 1e-8:
            bal = 0.0
        tot_i += interest
        rows.append(
            {
                "month": m,
                "interest": interest,
                "amortization": amort,
                "installment": inst,
                "closing": bal,
            }
        )
    return rows, tot_i, principal + tot_i, pmt


# ---------------------------------------------------------------------------
# Consórcio — modelo de mercado (linear + aniversário)
# ---------------------------------------------------------------------------

def consortium_linear_no_index(credit: float, admin_pct: float, reserve_pct: float, n: int):
    admin = credit * admin_pct / 100
    reserve = credit * reserve_pct / 100
    fund = credit + admin + reserve
    inst = fund / n if n else 0.0
    return {
        "admin": admin,
        "reserve": reserve,
        "fund": fund,
        "installment": inst,
        "total": fund,
    }


def consortium_anniversary_outstanding(
    credit: float,
    admin_pct: float,
    reserve_pct: float,
    n: int,
    inpc: float,
    first_ann: int,
    bid: float,
    contempl: int,
    bid_mode: str,
    bid_kind: str,
    insurance_monthly: float = 0.0,
    insurance_pct: float = 0.0,
    membership: float = 0.0,
    other_monthly: float = 0.0,
):
    """Réplica independente da especificação linear + INPC no aniversário.

    Diferença financeira consciente no lance embutido:
    - spec_app: soma o lance no caixa (como o TS faz)
    - spec_correct_embedded: lance embutido NÃO é desembolso em dinheiro
    """
    admin = credit * admin_pct / 100
    reserve = credit * reserve_pct / 100
    fund = credit + admin + reserve
    bid = min(max(0.0, bid), fund)
    adj = max(0.0, inpc) / 100
    first_ann = max(1, int(first_ann or 13))
    contempl = min(max(1, int(contempl)), n)
    theoretical = fund / n if n else 0.0
    outstanding = fund
    credit_v = credit
    infl = 1.0
    inpc_n = 0
    schedule = []
    max_months = n + 24
    EPS = 0.005

    for month in range(1, max_months + 1):
        inpc_applied = False
        if adj > 0 and month >= first_ann and (month - first_ann) % 12 == 0:
            infl *= 1 + adj
            outstanding *= 1 + adj
            credit_v = credit * infl
            inpc_applied = True
            inpc_n += 1

        bid_now = 0.0
        if month == contempl and bid > 0:
            applied = min(bid, outstanding)
            outstanding -= applied
            bid_now = bid

        if outstanding < EPS and bid_now == 0 and month > n:
            break

        installment = 0.0
        remaining = n - month + 1
        if outstanding > EPS:
            if bid_mode == "reduce_term" and month >= contempl and bid > 0:
                installment = min(theoretical * infl, outstanding)
            elif remaining > 0:
                installment = outstanding / remaining
            else:
                installment = outstanding

        if installment < EPS:
            installment = 0.0
        outstanding = max(0.0, outstanding - installment)
        if outstanding < EPS:
            outstanding = 0.0

        insurance = 0.0
        if insurance_monthly:
            insurance = insurance_monthly
        elif insurance_pct:
            insurance = credit_v * insurance_pct / 100

        memb = membership if month == 1 else 0.0
        cash_bid = 0.0 if bid_kind == "embedded" else bid_now
        total = installment + insurance + other_monthly + cash_bid + memb
        total_correct_embedded = total

        schedule.append(
            {
                "month": month,
                "installment": installment,
                "bid": bid_now,
                "total_app": total,
                "total_correct_embedded": total_correct_embedded,
                "credit": credit_v,
                "outstanding": outstanding,
                "inpc": inpc_applied,
            }
        )

        if outstanding < EPS and month >= n:
            break
        if outstanding < EPS and bid_mode == "reduce_term" and month >= contempl:
            break

    total_inst = sum(r["installment"] for r in schedule if r["installment"] > EPS)
    total_app = sum(r["total_app"] for r in schedule)
    total_emb = sum(r["total_correct_embedded"] for r in schedule)
    available_app = max(0.0, credit - bid) if bid_kind == "embedded" else credit
    credit_at_contempl = next((r["credit"] for r in schedule if r["month"] == contempl), credit)
    available_at_contempl = (
        max(0.0, credit_at_contempl - bid) if bid_kind == "embedded" else credit_at_contempl
    )

    return {
        "admin": admin,
        "reserve": reserve,
        "fund": fund,
        "first": schedule[0]["installment"] if schedule else 0,
        "last": next((r["installment"] for r in reversed(schedule) if r["installment"] > EPS), 0),
        "total_installments": total_inst,
        "total_disbursed_app": total_app,
        "total_disbursed_correct_embedded": total_emb,
        "available_credit_on_original": available_app,
        "credit_at_contemplation": credit_at_contempl,
        "available_at_contemplation": available_at_contempl,
        "final_credit": schedule[-1]["credit"] if schedule else credit,
        "months": len(schedule),
        "inpc_applications": inpc_n,
        "schedule": schedule,
    }


def npv_from_schedule(schedule, key, discount_aa, extra_t0=0.0):
    i_m = monthly_from_effective_annual(discount_aa / 100)
    flows = [(0, extra_t0)] if extra_t0 else []
    flows += [(r["month"], r[key]) for r in schedule]
    return present_value(flows, i_m)
