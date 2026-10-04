# TWA Invest Platform — Backend + Frontend (FastAPI + aiogram 3.x + Capiton TWA)

Фронтенд `frontend/` — из https://github.com/misterlasta/anythrontend (`index.html`, `app.js`, `style.css`), уже связан с REST API через `frontend/api.js`. Бэкенд раздаёт его сам: `GET /` → `frontend/index.html`, статика на `/static/`.

## Запуск

```bash
cp .env.example .env   # прописать BOT_TOKEN и FRONTEND_URL
python -m pip install -r requirements.txt
python init_db.py      # создать app.db + залить 4 лота (lot1, lot2, uzv, lot4)
python main.py         # API на :8000 (uvicorn)
# отдельно:
python bot.py          # Telegram-бот /start (регистрация + WebApp-кнопка)
```

## Auth

Фронтенд шлёт заголовок `X-Telegram-Init-Data: Telegram.WebApp.initData`.
`utils/auth.py` валидирует подпись по `BOT_TOKEN` (HMAC `WebAppData`).
Для локального тестирования можно слать `X-Telegram-Id: <число>` (dev-fallback).
Админка проверяет `User.is_admin` (`ADMIN_IDS=5236965009,8593240092`).

## API

| Метод | Путь | Описание |
|---|---|---|
| GET | `/api/lots` | Витрина (`pending == False`), у каждого `_trust: {milestones, multisig, invoices}` |
| POST | `/api/lots` | Создать лот (`pending=True, verified=False` + дефолтный Trust) |
| POST | `/api/vote` | `{lot_id, milestone_index, vote_type}` — 409 при повторе |
| POST | `/api/invest` | `{lot_id, txHash}` — заглушка покупки |
| GET | `/api/admin/lots` | Все лоты (admin) |
| POST | `/api/admin/lots/{id}/verify` | `verified=True, pending=False` |
| POST | `/api/admin/lots/{id}/approve` | `pending=False` |
| DELETE | `/api/admin/lots/{id}` | Удаление |
| POST | `/api/admin/multisig/{id}/{role}` | Toggle `entrepreneur/plarform/auditor` |
| POST | `/api/admin/invoices/{id}/pay` | `paid=True` |

Пример замены localStorage на фронтенде:

```js
const r = await fetch('http://localhost:8000/api/lots');
const lots = await r.json(); // у каждого lots[i]._trust
await fetch('http://localhost:8000/api/vote', {
  method: 'POST',
  headers: {'Content-Type': 'application/json', 'X-Telegram-Init-Data': Telegram.WebApp.initData},
  body: JSON.stringify({lot_id, milestone_index, vote_type: 'yes'})
});
```

## Структура

`main.py` (FastAPI + CORS + lifespan seed + раздача `frontend/`) · `models.py` · `schemas.py` ·
`routes.py` · `bot.py` · `database.py` · `deps.py` ·
`utils/auth.py` · `seed_data.py` · `init_db.py` ·
`frontend/` (`index.html`, `app.js` — витрина/голоса/админка через API с fallback на localStorage, `api.js` — REST-клиент с `X-Telegram-Init-Data`, `style.css`)
