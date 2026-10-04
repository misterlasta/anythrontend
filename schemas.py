"""Pydantic v2 schemas — JSON in/out mirrors frontend localStorage shapes."""
from pydantic import BaseModel, Field


# ---------- Trust (nested) ----------
class MilestoneOut(BaseModel):
    milestone_index: int
    title: str
    pct: int
    released: bool
    yes: int
    no: int


class MultisigOut(BaseModel):
    entrepreneur: bool = True
    platform: bool = False
    auditor: bool = False


class InvoiceOut(BaseModel):
    id: str
    title: str
    amount: str
    paid: bool


class TrustOut(BaseModel):
    milestones: list[MilestoneOut] = []
    multisig: MultisigOut = Field(default_factory=MultisigOut)
    invoices: list[InvoiceOut] = []


# ---------- Lots ----------
class LotOut(BaseModel):
    id: str
    title: str = ""
    desc: str = ""
    tag: str = ""
    grad: str = ""
    logo: str = ""
    loc: str = ""
    stage: str = "live"
    format: str = "online"
    price: str = "1 TON"
    nano: str = "1000000000"
    goal: str = ""
    verified: bool = False
    pending: bool = False
    # Frontend reads nested trust object as `_trust`
    trust: TrustOut | None = Field(default=None, alias="_trust", serialization_alias="_trust")

    model_config = {"populate_by_name": True}


class LotCreate(BaseModel):
    """Body for POST /api/lots. id optional — server generates 'my<ts>' if missing."""

    id: str | None = None
    title: str = ""
    desc: str = ""
    tag: str = ""
    grad: str = ""
    logo: str = ""
    loc: str = ""
    stage: str = "idea"
    format: str = "online"
    price: str = "1 TON"
    nano: str = "1000000000"
    goal: str = ""


# ---------- Users ----------
class UserOut(BaseModel):
    id: int
    telegram_id: int
    is_admin: bool
    wallet_address: str | None = None


class AuthIn(BaseModel):
    """Fallback auth body when client cannot set headers (sends initData in JSON)."""

    initData: str | None = Field(default=None, alias="initData")


# ---------- Vote / Invest ----------
class VoteIn(BaseModel):
    lot_id: str
    milestone_index: int
    vote_type: str  # 'yes' | 'no'
    initData: str | None = None  # optional: alternative to X-Telegram-Init-Data header


class InvestIn(BaseModel):
    lot_id: str
    tx_hash: str = Field(alias="txHash", default="")
    initData: str | None = None

    model_config = {"populate_by_name": True}
