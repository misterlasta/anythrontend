"""FastAPI dependencies: current user from Telegram initData + admin guard."""
from fastapi import Depends, Header, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from database import get_db
from models import User
from utils.auth import validate_init_data


async def get_or_create_user(session: AsyncSession, telegram_id: int) -> User:
    result = await session.execute(select(User).where(User.telegram_id == telegram_id))
    user = result.scalar_one_or_none()
    if user is None:
        user = User(
            telegram_id=telegram_id,
            is_admin=(telegram_id in settings.admin_ids),
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
    elif user.is_admin != (telegram_id in settings.admin_ids):
        # Keep admin flag in sync with config
        user.is_admin = telegram_id in settings.admin_ids
        await session.commit()
        await session.refresh(user)
    return user


async def get_current_user(
    db: AsyncSession = Depends(get_db),
    x_telegram_init_data: str | None = Header(default=None, alias="X-Telegram-Init-Data"),
    x_telegram_id: str | None = Header(default=None, alias="X-Telegram-Id"),
) -> User:
    """Resolve telegram user.

    Primary: validated WebApp initData header.
    Fallback (DEV/test only): plain X-Telegram-Id header with numeric id.
    """
    telegram_id: int | None = None
    if x_telegram_init_data:
        try:
            data = validate_init_data(x_telegram_init_data)
            telegram_id = int(data.get("id"))
        except Exception as e:
            raise HTTPException(status_code=401, detail=f"Invalid initData: {e}")
    elif x_telegram_id and x_telegram_id.isdigit():
        telegram_id = int(x_telegram_id)
    else:
        raise HTTPException(
            status_code=401,
            detail="Missing auth: send X-Telegram-Init-Data (or X-Telegram-Id for dev)",
        )
    return await get_or_create_user(db, telegram_id)


async def require_admin(user: User = Depends(get_current_user)) -> User:
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin only")
    return user
