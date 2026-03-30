import uuid
import time
import random
from typing import List, Optional
from collections import defaultdict

# In-memory stores
_expenses = []
_groups = {}
_budgets = {"family": 50000, "solo": 20000}

# Seed demo data on import
DEMO_CATEGORIES = {
    "solo": ["Food", "Transport", "Shopping", "Entertainment", "Utilities", "Health", "Education", "Subscriptions"],
    "friends": ["Dining", "Travel", "Movies", "Shopping", "Drinks", "Adventure", "Tickets", "Other"],
    "family": ["Groceries", "Rent", "Kids", "Shopping", "Medical", "Education", "Utilities", "Travel"],
}

DEMO_MEMBERS = {
    "friends": ["You", "Arun", "Rahul", "Priya", "Sneha"],
    "family": ["Dad", "Mom", "You", "Sister"],
}


def _seed_demo():
    """Generate realistic demo expenses for all modes."""
    if len(_expenses) > 0:
        return

    now = time.time()
    day = 86400

    # Solo expenses — last 30 days
    solo_items = [
        ("Morning coffee", 80, "Food"), ("Uber ride", 220, "Transport"),
        ("Netflix subscription", 649, "Subscriptions"), ("Grocery run", 1200, "Food"),
        ("Gym membership", 1500, "Health"), ("Book purchase", 450, "Shopping"),
        ("Electricity bill", 1800, "Utilities"), ("Lunch with colleague", 350, "Food"),
        ("Spotify", 119, "Subscriptions"), ("Auto fare", 150, "Transport"),
        ("New shoes", 2800, "Shopping"), ("Doctor visit", 700, "Health"),
        ("Movie ticket", 300, "Entertainment"), ("Dinner out", 850, "Food"),
        ("Phone recharge", 599, "Utilities"), ("Course fee", 4999, "Education"),
        ("Breakfast", 120, "Food"), ("Bus pass", 500, "Transport"),
        ("Haircut", 300, "Health"), ("Snacks", 200, "Food"),
        ("Rice & dal", 900, "Food"), ("Water bill", 400, "Utilities"),
        ("Chips & drinks", 180, "Food"), ("Cab to office", 280, "Transport"),
    ]
    for i, (desc, amt, cat) in enumerate(solo_items):
        _expenses.append({
            "id": str(uuid.uuid4())[:8],
            "description": desc, "amount": float(amt + random.randint(-30, 30)),
            "paid_by": "You", "category": cat,
            "split_among": ["You"], "split_type": "equal",
            "mode": "solo", "timestamp": now - (i * day * 1.2),
            "date": time.strftime("%Y-%m-%d", time.localtime(now - (i * day * 1.2))),
        })

    # Friends expenses — last 20 days
    friends_items = [
        ("Pizza night", 2400, "Dining", "You", ["You", "Arun", "Rahul", "Priya"]),
        ("Road trip fuel", 3200, "Travel", "Arun", ["You", "Arun", "Rahul"]),
        ("Movie tickets", 1200, "Movies", "Priya", ["You", "Arun", "Priya", "Sneha"]),
        ("Beach restaurant", 4500, "Dining", "Rahul", ["You", "Arun", "Rahul", "Priya", "Sneha"]),
        ("Uber to venue", 800, "Travel", "You", ["You", "Arun"]),
        ("Concert tickets", 6000, "Tickets", "Sneha", ["You", "Sneha", "Priya"]),
        ("Drinks at pub", 3600, "Drinks", "Arun", ["You", "Arun", "Rahul", "Sneha"]),
        ("Bowling", 1600, "Adventure", "You", ["You", "Arun", "Priya", "Rahul"]),
        ("Cafe hangout", 1100, "Dining", "Priya", ["You", "Priya", "Sneha"]),
        ("Gift for Rahul", 2500, "Shopping", "You", ["You", "Arun", "Priya", "Sneha"]),
        ("Lunch split", 1800, "Dining", "Rahul", ["You", "Rahul", "Arun"]),
        ("Cab share", 600, "Travel", "Sneha", ["Sneha", "You"]),
    ]
    for i, (desc, amt, cat, paid, split) in enumerate(friends_items):
        _expenses.append({
            "id": str(uuid.uuid4())[:8],
            "description": desc, "amount": float(amt + random.randint(-50, 50)),
            "paid_by": paid, "category": cat,
            "split_among": split, "split_type": "equal",
            "mode": "friends", "timestamp": now - (i * day * 1.5),
            "date": time.strftime("%Y-%m-%d", time.localtime(now - (i * day * 1.5))),
        })

    # Family expenses — last 30 days
    family_items = [
        ("Weekly groceries", 3500, "Groceries", "Mom"),
        ("Rent payment", 25000, "Rent", "Dad"),
        ("School fees", 8000, "Education", "Dad"),
        ("Medicine", 1200, "Medical", "Mom"),
        ("Kids toys", 1500, "Kids", "Mom"),
        ("Electricity bill", 2800, "Utilities", "Dad"),
        ("Family dinner", 3200, "Groceries", "You"),
        ("Shopping mall", 5600, "Shopping", "Mom"),
        ("Water bill", 600, "Utilities", "Dad"),
        ("Tuition class", 4000, "Education", "Dad"),
        ("Vegetables", 800, "Groceries", "Mom"),
        ("Gas cylinder", 1100, "Utilities", "Dad"),
        ("Birthday celebration", 4500, "Kids", "Mom"),
        ("Internet bill", 999, "Utilities", "You"),
        ("Fruits", 650, "Groceries", "Sister"),
        ("Doctor checkup", 2000, "Medical", "Dad"),
    ]
    for i, (desc, amt, cat, paid) in enumerate(family_items):
        members = DEMO_MEMBERS["family"]
        _expenses.append({
            "id": str(uuid.uuid4())[:8],
            "description": desc, "amount": float(amt + random.randint(-100, 100)),
            "paid_by": paid, "category": cat,
            "split_among": members, "split_type": "equal",
            "mode": "family", "timestamp": now - (i * day * 1.8),
            "date": time.strftime("%Y-%m-%d", time.localtime(now - (i * day * 1.8))),
        })


_seed_demo()


# ──────────────────── CORE CRUD ────────────────────

def add_expense(expense: dict) -> dict:
    """Add a new expense."""
    mode = expense.get("mode", "solo")
    entry = {
        "id": str(uuid.uuid4())[:8],
        "description": expense.get("description", "Untitled"),
        "amount": float(expense.get("amount", 0)),
        "paid_by": expense.get("paid_by", "You"),
        "category": expense.get("category", "General"),
        "split_among": expense.get("split_among", [expense.get("paid_by", "You")]),
        "split_type": expense.get("split_type", "equal"),
        "mode": mode,
        "timestamp": time.time(),
        "date": time.strftime("%Y-%m-%d"),
    }
    _expenses.append(entry)
    return entry


def get_expenses(mode: str = None) -> dict:
    """Get expenses with mode-specific analytics."""
    filtered = _expenses if not mode else [e for e in _expenses if e.get("mode") == mode]
    total = sum(e["amount"] for e in filtered)

    # Category breakdown
    categories = defaultdict(float)
    for e in filtered:
        categories[e["category"]] += e["amount"]

    cat_list = [{"name": k, "amount": round(v, 2), "percentage": round(v / total * 100, 1) if total > 0 else 0}
                for k, v in sorted(categories.items(), key=lambda x: -x[1])]

    # Daily trend (last 14 days)
    daily = defaultdict(float)
    for e in filtered:
        daily[e["date"]] += e["amount"]
    daily_trend = [{"date": k, "amount": round(v, 2)} for k, v in sorted(daily.items())][-14:]

    result = {
        "expenses": filtered[-50:],
        "total": round(total, 2),
        "count": len(filtered),
        "categories": cat_list,
        "daily_trend": daily_trend,
        "avg_per_day": round(total / max(len(daily), 1), 2),
    }

    # Mode-specific enrichment
    if mode == "solo":
        result.update(_solo_insights(filtered, total))
    elif mode == "friends":
        result.update(_friends_insights(filtered))
    elif mode == "family":
        result.update(_family_insights(filtered, total))

    return result


# ──────────────────── SOLO MODE ────────────────────

def _solo_insights(expenses: list, total: float) -> dict:
    """Personal finance insights for solo mode."""
    budget = _budgets.get("solo", 20000)
    remaining = budget - total
    utilization = round((total / budget) * 100, 1) if budget > 0 else 0

    # Weekly comparison
    now = time.time()
    week_ago = now - 7 * 86400
    two_weeks_ago = now - 14 * 86400
    this_week = sum(e["amount"] for e in expenses if e["timestamp"] > week_ago)
    last_week = sum(e["amount"] for e in expenses if two_weeks_ago < e["timestamp"] <= week_ago)
    week_change = round(((this_week - last_week) / max(last_week, 1)) * 100, 1)

    # Top spending category
    cats = defaultdict(float)
    for e in expenses:
        cats[e["category"]] += e["amount"]
    top_cat = max(cats.items(), key=lambda x: x[1]) if cats else ("None", 0)

    # Insights
    insights = []
    if utilization > 90:
        insights.append({"type": "danger", "text": f"You've used {utilization}% of your monthly budget!"})
    elif utilization > 70:
        insights.append({"type": "warning", "text": f"Budget utilization at {utilization}%. Consider reducing spending."})
    else:
        insights.append({"type": "good", "text": f"On track! {utilization}% budget used. ₹{remaining:,.0f} remaining."})

    if week_change > 20:
        insights.append({"type": "warning", "text": f"Spending up {week_change}% vs last week."})
    elif week_change < -10:
        insights.append({"type": "good", "text": f"Spending down {abs(week_change)}% vs last week. Great job!"})

    insights.append({"type": "info", "text": f"Top category: {top_cat[0]} (₹{top_cat[1]:,.0f})"})

    return {
        "budget": budget,
        "remaining": round(remaining, 2),
        "utilization": utilization,
        "budget_alert": "over" if remaining < 0 else "warning" if utilization > 80 else "ok",
        "this_week_total": round(this_week, 2),
        "last_week_total": round(last_week, 2),
        "week_change_pct": week_change,
        "top_category": {"name": top_cat[0], "amount": round(top_cat[1], 2)},
        "insights": insights,
    }


# ──────────────────── FRIENDS MODE ────────────────────

def _friends_insights(expenses: list) -> dict:
    """Group splitting insights for friends mode."""
    members = set()
    paid_by_totals = defaultdict(float)
    owed_by_totals = defaultdict(float)

    for e in expenses:
        members.update(e.get("split_among", []))
        members.add(e["paid_by"])
        paid_by_totals[e["paid_by"]] += e["amount"]
        share = e["amount"] / max(len(e.get("split_among", [1])), 1)
        for m in e.get("split_among", []):
            owed_by_totals[m] += share

    members = sorted(members)

    # Net balances
    balances = {}
    for m in members:
        balances[m] = round(paid_by_totals.get(m, 0) - owed_by_totals.get(m, 0), 2)

    # Settlement transactions (minimum)
    transactions = _calculate_settlements(balances)

    # Member stats
    member_stats = []
    for m in members:
        member_stats.append({
            "name": m,
            "paid": round(paid_by_totals.get(m, 0), 2),
            "owes": round(owed_by_totals.get(m, 0), 2),
            "balance": balances.get(m, 0),
        })

    # Smart suggestions
    suggestions = []
    for t in transactions:
        suggestions.append(f"{t['from']} pays {t['to']} ₹{t['amount']:,.0f} → closer to settled")
    if not transactions:
        suggestions.append("All settled! 🎉 No pending transactions.")

    return {
        "members": members,
        "member_stats": sorted(member_stats, key=lambda x: -abs(x["balance"])),
        "balances": balances,
        "settlements": transactions,
        "settlement_count": len(transactions),
        "suggestions": suggestions,
        "total_group_spend": round(sum(paid_by_totals.values()), 2),
        "avg_per_person": round(sum(owed_by_totals.values()) / max(len(members), 1), 2),
    }


def _calculate_settlements(balances: dict) -> list:
    """Minimum transactions algorithm (greedy)."""
    debtors = [(m, -b) for m, b in balances.items() if b < -0.5]
    creditors = [(m, b) for m, b in balances.items() if b > 0.5]
    debtors.sort(key=lambda x: x[1], reverse=True)
    creditors.sort(key=lambda x: x[1], reverse=True)

    transactions = []
    i, j = 0, 0
    while i < len(debtors) and j < len(creditors):
        debtor, debt = debtors[i]
        creditor, credit = creditors[j]
        transfer = min(debt, credit)
        if transfer > 0.5:
            transactions.append({"from": debtor, "to": creditor, "amount": round(transfer, 2)})
        debtors[i] = (debtor, debt - transfer)
        creditors[j] = (creditor, credit - transfer)
        if debtors[i][1] < 0.5:
            i += 1
        if creditors[j][1] < 0.5:
            j += 1

    return transactions


# ──────────────────── FAMILY MODE ────────────────────

def _family_insights(expenses: list, total: float) -> dict:
    """Shared budget and contribution tracking for family mode."""
    budget = _budgets.get("family", 50000)
    remaining = budget - total
    utilization = round((total / budget) * 100, 1) if budget > 0 else 0

    # Contribution by member
    contributions = defaultdict(float)
    for e in expenses:
        contributions[e["paid_by"]] += e["amount"]

    contrib_list = [{"name": k, "amount": round(v, 2), "percentage": round(v / total * 100, 1) if total > 0 else 0}
                    for k, v in sorted(contributions.items(), key=lambda x: -x[1])]

    # Weekly category trends
    now = time.time()
    this_week = defaultdict(float)
    last_week = defaultdict(float)
    for e in expenses:
        if e["timestamp"] > now - 7 * 86400:
            this_week[e["category"]] += e["amount"]
        elif e["timestamp"] > now - 14 * 86400:
            last_week[e["category"]] += e["amount"]

    # Category alerts
    alerts = []
    for cat in this_week:
        tw = this_week[cat]
        lw = last_week.get(cat, 0)
        if lw > 0 and tw > lw * 1.3:
            pct = round((tw - lw) / lw * 100)
            alerts.append({"type": "warning", "text": f"{cat} expenses up {pct}% this week (₹{tw:,.0f} vs ₹{lw:,.0f})"})

    if utilization > 90:
        alerts.insert(0, {"type": "danger", "text": f"Family budget nearly exhausted ({utilization}% used)!"})
    elif utilization > 70:
        alerts.insert(0, {"type": "warning", "text": f"Family budget at {utilization}%. ₹{remaining:,.0f} left."})
    else:
        alerts.insert(0, {"type": "good", "text": f"Family budget on track. ₹{remaining:,.0f} remaining."})

    return {
        "budget": budget,
        "remaining": round(remaining, 2),
        "utilization": utilization,
        "budget_alert": "over" if remaining < 0 else "warning" if utilization > 80 else "ok",
        "contributions": contrib_list,
        "alerts": alerts,
        "top_contributor": contrib_list[0] if contrib_list else None,
    }


# ──────────────────── SHARED UTILS ────────────────────

def calculate_split(data: dict) -> dict:
    """Calculate expense split among members."""
    amount = float(data.get("amount", 0))
    members = data.get("members", [])
    split_type = data.get("split_type", "equal")
    paid_by = data.get("paid_by", members[0] if members else "You")
    custom_shares = data.get("custom_shares", {})

    if not members:
        return {"error": "No members specified"}

    splits = []
    if split_type == "equal":
        share = round(amount / len(members), 2)
        for m in members:
            splits.append({"member": m, "share": share, "owes": 0 if m == paid_by else share})
    elif split_type == "custom":
        for m in members:
            share = float(custom_shares.get(m, 0))
            splits.append({"member": m, "share": share, "owes": 0 if m == paid_by else share})
    elif split_type == "percentage":
        for m in members:
            pct = float(custom_shares.get(m, 100 / len(members)))
            share = round(amount * pct / 100, 2)
            splits.append({"member": m, "share": share, "owes": 0 if m == paid_by else share})

    return {"amount": amount, "paid_by": paid_by, "split_type": split_type, "splits": splits}


def settle_debts(members: List[str]) -> dict:
    """Calculate minimum transactions for settlement."""
    balances = defaultdict(float)
    for e in _expenses:
        if e.get("mode") not in ("friends", "family"):
            continue
        paid_by = e["paid_by"]
        split_among = e.get("split_among", members)
        share = e["amount"] / len(split_among)
        balances[paid_by] += e["amount"]
        for m in split_among:
            balances[m] -= share

    transactions = _calculate_settlements(dict(balances))

    return {
        "balances": {m: round(b, 2) for m, b in balances.items()},
        "transactions": transactions,
        "total_transactions": len(transactions),
    }


def get_budget_analysis(budget: float = None, mode: str = "solo") -> dict:
    """Analyze spending against budget."""
    filtered = [e for e in _expenses if e.get("mode") == mode]
    total = sum(e["amount"] for e in filtered)
    if budget is None:
        budget = _budgets.get(mode, max(total * 1.2, 10000))

    categories = defaultdict(float)
    daily = defaultdict(float)
    for e in filtered:
        categories[e["category"]] += e["amount"]
        daily[e["date"]] += e["amount"]

    return {
        "total_spent": round(total, 2),
        "budget": round(budget, 2),
        "remaining": round(budget - total, 2),
        "utilization": round((total / budget) * 100, 1) if budget > 0 else 0,
        "categories": [{"name": k, "amount": round(v, 2), "percentage": round(v / total * 100, 1) if total > 0 else 0}
                       for k, v in sorted(categories.items(), key=lambda x: -x[1])],
        "daily_trend": [{"date": k, "amount": round(v, 2)} for k, v in sorted(daily.items())],
        "alert": "Over budget!" if total > budget else "On track" if total < budget * 0.8 else "Approaching limit",
    }


def set_budget(mode: str, amount: float) -> dict:
    """Set budget for a mode."""
    _budgets[mode] = amount
    return {"mode": mode, "budget": amount, "status": "updated"}


def get_members(mode: str) -> list:
    """Get members for a mode."""
    return DEMO_MEMBERS.get(mode, [])


def suggest_mode() -> dict:
    """Smart mode detection based on recent behavior."""
    recent = _expenses[-5:] if len(_expenses) >= 5 else _expenses
    modes = defaultdict(int)
    has_group = False
    for e in recent:
        modes[e.get("mode", "solo")] += 1
        if len(e.get("split_among", [])) > 1:
            has_group = True

    current = max(modes, key=modes.get) if modes else "solo"
    suggestion = None
    if current == "solo" and has_group:
        suggestion = "You're adding group expenses. Switch to Friends Mode?"
    elif current == "friends" and not has_group:
        suggestion = "Recent expenses are personal. Switch to Solo Mode?"

    return {"current_mode": current, "suggestion": suggestion, "recent_modes": dict(modes)}
