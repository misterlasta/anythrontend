"""Create tables + seed. Run: python init_db.py"""
import asyncio

from database import Base, engine, AsyncSessionLocal
import models  # noqa: F401  (register models)
from seed_data import seed


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with AsyncSessionLocal() as session:
        await seed(session)
    print("DB initialized + seeded.")


if __name__ == "__main__":
    asyncio.run(init_db())
