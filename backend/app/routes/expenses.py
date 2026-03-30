from fastapi import APIRouter
from app.services.expense_service import (
    add_expense, get_expenses, calculate_split, settle_debts,
    get_budget_analysis, set_budget, get_members, suggest_mode,
)

router = APIRouter(prefix="/api", tags=["expenses"])


@router.get("/expenses")
async def expenses(mode: str = None):
    data = get_expenses(mode)
    return {"status": "success", "data": data}


@router.post("/expenses")
async def create_expense(body: dict):
    data = add_expense(body)
    return {"status": "success", "data": data}


@router.post("/split")
async def split(body: dict):
    data = calculate_split(body)
    return {"status": "success", "data": data}


@router.post("/settle")
async def settle(body: dict):
    members = body.get("members", ["You", "Arun", "Rahul", "Priya", "Sneha"])
    data = settle_debts(members)
    return {"status": "success", "data": data}


@router.get("/budget")
async def budget(budget_amount: float = None, mode: str = "solo"):
    data = get_budget_analysis(budget_amount, mode)
    return {"status": "success", "data": data}


@router.post("/budget")
async def update_budget(body: dict):
    mode = body.get("mode", "solo")
    amount = float(body.get("amount", 20000))
    data = set_budget(mode, amount)
    return {"status": "success", "data": data}


@router.get("/expense-members")
async def members(mode: str = "friends"):
    data = get_members(mode)
    return {"status": "success", "data": data}


@router.get("/suggest-mode")
async def mode_suggestion():
    data = suggest_mode()
    return {"status": "success", "data": data}
