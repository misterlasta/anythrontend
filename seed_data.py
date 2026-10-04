"""Seed 4 default lots (lot1, lot2, uzv, lot4) with standard Trust (3 tranches, 2 invoices)."""
from sqlalchemy.ext.asyncio import AsyncSession

import models
from models import Invoice, Lot, Milestone, Multisig

DEFAULT_LOTS = [
    {
        "id": "lot1",
        "title": "NEURO Farming",
        "desc": "AI-ферма доходности на TON: алгоритмы перераспределяют ликвидность.",
        "tag": "AI · DeFi",
        "grad": "linear-gradient(135deg,#7c3aed,#06b6d4)",
        "logo": "🧠",
        "loc": "Online",
        "stage": "live",
        "format": "online",
        "price": "1 TON",
        "nano": "1000000000",
        "goal": "100 000 TON",
        "verified": True,
        "pending": False,
    },
    {
        "id": "lot2",
        "title": "TON Estate",
        "desc": "Токенизированная недвижимость: доля в арендных объектах.",
        "tag": "RWA",
        "grad": "linear-gradient(135deg,#f59e0b,#ef4444)",
        "logo": "🏠",
        "loc": "Dubai · Hybrid",
        "stage": "live",
        "format": "hybrid",
        "price": "5 TON",
        "nano": "5000000000",
        "goal": "250 000 TON",
        "verified": True,
        "pending": False,
    },
    {
        "id": "uzv",
        "title": "UZV Mining",
        "desc": "Модульные майнинг-контейнеры с green-energy.",
        "tag": "Mining",
        "grad": "linear-gradient(135deg,#10b981,#3b82f6)",
        "logo": "⛏️",
        "loc": "Almaty · Offline",
        "stage": "live",
        "format": "offline",
        "price": "2 TON",
        "nano": "2000000000",
        "goal": "80 000 TON",
        "verified": False,
        "pending": False,
    },
    {
        "id": "lot4",
        "title": "GameFi Arena",
        "desc": "Турнирная платформа с призовым фондом в TON.",
        "tag": "GameFi",
        "grad": "linear-gradient(135deg,#ec4899,#8b5cf6)",
        "logo": "🎮",
        "loc": "Online",
        "stage": "idea",
        "format": "online",
        "price": "0.5 TON",
        "nano": "500000000",
        "goal": "30 000 TON",
        "verified": False,
        "pending": False,
    },
]

MILESTONES = [
    {"milestone_index": 0, "title": "Транш 1 — запуск и MVP", "pct": 40},
    {"milestone_index": 1, "title": "Транш 2 — рост и аудит", "pct": 35},
    {"milestone_index": 2, "title": "Транш 3 — масштабирование", "pct": 25},
]

INVOICES = [
    {"suffix": "inv1", "title": "Аудит смарт-контракта", "amount": "5 000 TON"},
    {"suffix": "inv2", "title": "Маркетинг и листинг", "amount": "3 000 TON"},
]


async def seed(session: AsyncSession):
    for data in DEFAULT_LOTS:
        if await session.get(Lot, data["id"]):
            continue
        session.add(Lot(**data))
        await session.flush()
        for m in MILESTONES:
            session.add(
                Milestone(
                    lot_id=data["id"],
                    milestone_index=m["milestone_index"],
                    title=m["title"],
                    pct=m["pct"],
                    released=(m["milestone_index"] == 0),
                    yes=0,
                    no=0,
                )
            )
        session.add(Multisig(lot_id=data["id"], entrepreneur=True, platform=True, auditor=False))
        for inv in INVOICES:
            session.add(
                Invoice(
                    id=f"{data['id']}-{inv['suffix']}",
                    lot_id=data["id"],
                    title=inv["title"],
                    amount=inv["amount"],
                    paid=False,
                )
            )
    await session.commit()
