"""Telegram bot (aiogram 3.x): /start registers user + WebApp button."""
import asyncio
import logging

from aiogram import Bot, Dispatcher, types
from aiogram.filters import CommandStart
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo

from config import settings
from database import AsyncSessionLocal
from deps import get_or_create_user

logging.basicConfig(level=logging.INFO)

dp = Dispatcher()


@dp.message(CommandStart())
async def cmd_start(message: types.Message):
    tg_id = message.from_user.id
    async with AsyncSessionLocal() as session:
        await get_or_create_user(session, tg_id)
    kb = InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="🚀 Открыть платформу", web_app=WebAppInfo(url=settings.FRONTEND_URL))]
        ]
    )
    await message.answer(
        "Добро пожаловать в инвест-платформу TON!\nНажмите кнопку ниже, чтобы открыть приложение.",
        reply_markup=kb,
    )


async def main():
    bot = Bot(token=settings.BOT_TOKEN)
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
