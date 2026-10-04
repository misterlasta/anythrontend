"""SQLAlchemy 2.0 async models. Mirror frontend localStorage JSON structures."""
import enum

from sqlalchemy import BigInteger, Boolean, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class LotStage(str, enum.Enum):
    idea = "idea"
    live = "live"


class LotFormat(str, enum.Enum):
    online = "online"
    offline = "offline"
    hybrid = "hybrid"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    telegram_id: Mapped[int] = mapped_column(BigInteger, unique=True, index=True)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    wallet_address: Mapped[str | None] = mapped_column(String, nullable=True)

    lots: Mapped[list["Lot"]] = relationship(back_populates="owner", cascade="all, delete-orphan")
    votes: Mapped[list["Vote"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class Lot(Base):
    __tablename__ = "lots"

    # Frontend uses string ids like 'lot1' or 'my169...'
    id: Mapped[str] = mapped_column(String, primary_key=True)
    owner_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)

    title: Mapped[str] = mapped_column(String, default="")
    desc: Mapped[str] = mapped_column(String, default="")
    tag: Mapped[str] = mapped_column(String, default="")
    grad: Mapped[str] = mapped_column(String, default="")
    logo: Mapped[str] = mapped_column(String, default="")
    loc: Mapped[str] = mapped_column(String, default="")

    stage: Mapped[str] = mapped_column(String, default=LotStage.live.value)  # 'idea' | 'live'
    format: Mapped[str] = mapped_column(String, default=LotFormat.online.value)

    price: Mapped[str] = mapped_column(String, default="1 TON")
    nano: Mapped[str] = mapped_column(String, default="1000000000")
    goal: Mapped[str] = mapped_column(String, default="")

    verified: Mapped[bool] = mapped_column(Boolean, default=False)
    pending: Mapped[bool] = mapped_column(Boolean, default=False)

    owner: Mapped[User | None] = relationship(back_populates="lots")
    milestones: Mapped[list["Milestone"]] = relationship(
        back_populates="lot", cascade="all, delete-orphan", order_by="Milestone.milestone_index"
    )
    invoices: Mapped[list["Invoice"]] = relationship(back_populates="lot", cascade="all, delete-orphan")
    multisig: Mapped["Multisig | None"] = relationship(back_populates="lot", cascade="all, delete-orphan", uselist=False)


class Milestone(Base):
    """Escrow tranche. Frontend: { title, pct, released, yes, no } + index."""

    __tablename__ = "milestones"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    lot_id: Mapped[str] = mapped_column(ForeignKey("lots.id", ondelete="CASCADE"), index=True)
    milestone_index: Mapped[int] = mapped_column(Integer, default=0)

    title: Mapped[str] = mapped_column(String, default="")
    pct: Mapped[int] = mapped_column(Integer, default=0)
    released: Mapped[bool] = mapped_column(Boolean, default=False)
    yes: Mapped[int] = mapped_column(Integer, default=0)
    no: Mapped[int] = mapped_column(Integer, default=0)

    lot: Mapped[Lot] = relationship(back_populates="milestones")
    votes: Mapped[list["Vote"]] = relationship(back_populates="milestone", cascade="all, delete-orphan")


class Vote(Base):
    __tablename__ = "votes"
    __table_args__ = (UniqueConstraint("milestone_id", "user_id", name="uq_vote_milestone_user"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    milestone_id: Mapped[int] = mapped_column(ForeignKey("milestones.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    vote_type: Mapped[str] = mapped_column(String)  # 'yes' | 'no'

    milestone: Mapped[Milestone] = relationship(back_populates="votes")
    user: Mapped[User] = relationship(back_populates="votes")


class Multisig(Base):
    """Safe signatures. One row per lot (lot_id is PK)."""

    __tablename__ = "multisigs"

    lot_id: Mapped[str] = mapped_column(ForeignKey("lots.id", ondelete="CASCADE"), primary_key=True)
    entrepreneur: Mapped[bool] = mapped_column(Boolean, default=True)
    platform: Mapped[bool] = mapped_column(Boolean, default=False)
    auditor: Mapped[bool] = mapped_column(Boolean, default=False)

    lot: Mapped[Lot] = relationship(back_populates="multisig")


class Invoice(Base):
    """Contractor bill. Frontend: { id, title, amount, paid }."""

    __tablename__ = "invoices"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    lot_id: Mapped[str] = mapped_column(ForeignKey("lots.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String, default="")
    amount: Mapped[str] = mapped_column(String, default="")
    paid: Mapped[bool] = mapped_column(Boolean, default=False)

    lot: Mapped[Lot] = relationship(back_populates="invoices")


class Investment(Base):
    """Stub ledger for POST /api/invest (tx hash + lot). Not required by spec, but useful."""

    __tablename__ = "investments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    lot_id: Mapped[str] = mapped_column(ForeignKey("lots.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    tx_hash: Mapped[str] = mapped_column(String, default="")
