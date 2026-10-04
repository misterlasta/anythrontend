"""REST API replacing frontend localStorage."""
import time

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import get_db
from deps import get_current_user, require_admin
from models import Invoice, Lot, Milestone, Multisig, User, Vote, Investment
from schemas import InvestIn, LotCreate, LotOut, TrustOut, VoteIn
from utils.auth import validate_init_data
from deps import get_or_create_user

router = APIRouter()


def lot_to_out(lot: Lot) -> LotOut:
    milestones = sorted(lot.milestones or [], key=lambda m: m.milestone_index)
    msig = lot.multisig
    return LotOut(
        id=lot.id,
        title=lot.title or "",
        desc=lot.desc or "",
        tag=lot.tag or "",
        grad=lot.grad or "",
        logo=lot.logo or "",
        loc=lot.loc or "",
        stage=lot.stage or "live",
        format=lot.format or "online",
        price=lot.price or "1 TON",
        nano=lot.nano or "1000000000",
        goal=lot.goal or "",
        verified=bool(lot.verified),
        pending=bool(lot.pending),
        _trust=TrustOut(
            milestones=[
                {
                    "milestone_index": m.milestone_index,
                    "title": m.title,
                    "pct": m.pct,
                    "released": bool(m.released),
                    "yes": m.yes,
                    "no": m.no,
                }
                for m in milestones
            ],
            multisig={
                "entrepreneur": bool(msig.entrepreneur) if msig else True,
                "platform": bool(msig.platform) if msig else False,
                "auditor": bool(msig.auditor) if msig else False,
            },
            invoices=[
                {"id": i.id, "title": i.title, "amount": i.amount, "paid": bool(i.paid)}
                for i in (lot.invoices or [])
            ],
        ),
    )


async def load_lots(session: AsyncSession, only_public: bool):
    q = (
        select(Lot)
        .options(selectinload(Lot.milestones), selectinload(Lot.multisig), selectinload(Lot.invoices))
        .order_by(Lot.id)
    )
    if only_public:
        q = q.where(Lot.pending == False)  # noqa: E712
    result = await session.execute(q)
    return result.scalars().all()


# ---------- Public ----------
@router.get("/lots", response_model=list[LotOut])
async def list_lots(db: AsyncSession = Depends(get_db)):
    lots = await load_lots(db, only_public=True)
    return [lot_to_out(l) for l in lots]


# ---------- User actions ----------
async def resolve_user_from_body(db: AsyncSession, init_data: str | None, fallback: User | None) -> User:
    if init_data:
        try:
            data = validate_init_data(init_data)
            return await get_or_create_user(db, int(data["id"]))
        except Exception as e:
            raise HTTPException(status_code=401, detail=f"Invalid initData: {e}")
    if fallback is not None:
        return fallback
    raise HTTPException(status_code=401, detail="Missing auth")


@router.post("/lots", response_model=LotOut)
async def create_lot(
    payload: LotCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    lot_id = payload.id or f"my{int(time.time() * 1000)}"
    exists = await db.get(Lot, lot_id)
    if exists:
        raise HTTPException(status_code=409, detail="Lot id already exists")
    lot = Lot(
        id=lot_id,
        owner_id=user.id,
        title=payload.title,
        desc=payload.desc,
        tag=payload.tag,
        grad=payload.grad,
        logo=payload.logo,
        loc=payload.loc,
        stage=payload.stage,
        format=payload.format,
        price=payload.price,
        nano=payload.nano,
        goal=payload.goal,
        verified=False,
        pending=True,  # user lots go to moderation
    )
    db.add(lot)
    # default trust object for new lots
    db.add_all(
        [
            Milestone(lot_id=lot_id, milestone_index=0, title="Транш 1 — запуск", pct=40),
            Milestone(lot_id=lot_id, milestone_index=1, title="Транш 2 — рост", pct=35),
            Milestone(lot_id=lot_id, milestone_index=2, title="Транш 3 — масштабирование", pct=25),
        ]
    )
    db.add(Multisig(lot_id=lot_id, entrepreneur=True, platform=False, auditor=False))
    await db.commit()
    res = await db.execute(
        select(Lot)
        .where(Lot.id == lot_id)
        .options(selectinload(Lot.milestones), selectinload(Lot.multisig), selectinload(Lot.invoices))
    )
    lot = res.scalar_one()
    return lot_to_out(lot)


@router.post("/vote")
async def vote(
    payload: VoteIn,
    db: AsyncSession = Depends(get_db),
    fallback_user: User = Depends(get_current_user),
):
    user = await resolve_user_from_body(db, payload.initData, fallback_user)
    if payload.vote_type not in ("yes", "no"):
        raise HTTPException(status_code=422, detail="vote_type must be 'yes' or 'no'")
    res = await db.execute(
        select(Milestone).where(
            Milestone.lot_id == payload.lot_id, Milestone.milestone_index == payload.milestone_index
        )
    )
    ms = res.scalar_one_or_none()
    if ms is None:
        raise HTTPException(status_code=404, detail="Milestone not found")
    dup = await db.execute(select(Vote).where(Vote.milestone_id == ms.id, Vote.user_id == user.id))
    if dup.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Already voted")
    db.add(Vote(milestone_id=ms.id, user_id=user.id, vote_type=payload.vote_type))
    if payload.vote_type == "yes":
        ms.yes += 1
    else:
        ms.no += 1
    await db.commit()
    return {"ok": True, "yes": ms.yes, "no": ms.no}


@router.post("/invest")
async def invest(
    payload: InvestIn,
    db: AsyncSession = Depends(get_db),
    fallback_user: User = Depends(get_current_user),
):
    user = await resolve_user_from_body(db, payload.initData, fallback_user)
    lot = await db.get(Lot, payload.lot_id)
    if lot is None:
        raise HTTPException(status_code=404, detail="Lot not found")
    db.add(Investment(lot_id=lot.id, user_id=user.id, tx_hash=payload.tx_hash))
    await db.commit()
    return {"ok": True, "lot_id": lot.id, "tx_hash": payload.tx_hash}


# ---------- Admin ----------
@router.get("/admin/lots", response_model=list[LotOut])
async def admin_list_lots(db: AsyncSession = Depends(get_db), _admin: User = Depends(require_admin)):
    lots = await load_lots(db, only_public=False)
    return [lot_to_out(l) for l in lots]


@router.post("/admin/lots/{lot_id}/verify")
async def admin_verify(lot_id: str, db: AsyncSession = Depends(get_db), _admin: User = Depends(require_admin)):
    lot = await db.get(Lot, lot_id)
    if not lot:
        raise HTTPException(status_code=404, detail="Lot not found")
    lot.verified = True
    lot.pending = False
    await db.commit()
    return {"ok": True, "id": lot_id, "verified": True, "pending": False}


@router.post("/admin/lots/{lot_id}/approve")
async def admin_approve(lot_id: str, db: AsyncSession = Depends(get_db), _admin: User = Depends(require_admin)):
    lot = await db.get(Lot, lot_id)
    if not lot:
        raise HTTPException(status_code=404, detail="Lot not found")
    lot.pending = False
    await db.commit()
    return {"ok": True, "id": lot_id, "pending": False}


@router.delete("/admin/lots/{lot_id}")
async def admin_delete(lot_id: str, db: AsyncSession = Depends(get_db), _admin: User = Depends(require_admin)):
    lot = await db.get(Lot, lot_id)
    if not lot:
        raise HTTPException(status_code=404, detail="Lot not found")
    await db.delete(lot)
    await db.commit()
    return {"ok": True, "deleted": lot_id}


@router.post("/admin/multisig/{lot_id}/{role}")
async def admin_multisig(lot_id: str, role: str, db: AsyncSession = Depends(get_db), _admin: User = Depends(require_admin)):
    if role not in ("entrepreneur", "platform", "auditor"):
        raise HTTPException(status_code=422, detail="role must be entrepreneur|platform|auditor")
    msig = await db.get(Multisig, lot_id)
    if not msig:
        msig = Multisig(lot_id=lot_id)
        db.add(msig)
        await db.flush()
    setattr(msig, role, not getattr(msig, role))  # toggle
    await db.commit()
    return {"ok": True, "lot_id": lot_id, role: getattr(msig, role)}


@router.post("/admin/invoices/{invoice_id}/pay")
async def admin_pay_invoice(invoice_id: str, db: AsyncSession = Depends(get_db), _admin: User = Depends(require_admin)):
    inv = await db.get(Invoice, invoice_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    inv.paid = True
    await db.commit()
    return {"ok": True, "id": invoice_id, "paid": True}
