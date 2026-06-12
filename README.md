# Fight Data Arena

![Next.js](https://img.shields.io/badge/Next.js_16-black?style=flat-square&logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)

An interactive frame data quiz for Street Fighter 6. Test your knowledge of startups, punish windows, and frame advantage — across all 30 characters and 1562 moves.

**Live at [fightdata.app](https://fightdata.app)**

---

## Features

| Mode | Description |
| --- | --- |
| 🎲 **Random** | Multiple-choice startup questions across the full SF6 roster |
| 🥊 **Fighter** | Focus on a single character and master their frame data |
| ⌨️ **Input** | No choices — type the exact startup value from memory |
| 🎯 **Punish Finder** | Is this move punishable on block? Train your −4 instinct |
| ⚡ **Hardcore** | 5-second timer, no skip, one answer per question |
| 💀 **Survival** | One life — answer correctly as long as you can |
| 📅 **Daily** | 10 identical questions for everyone, refreshed each day |
| 👥 **Multiplayer** | Real-time 1v1 quiz via WebSocket — first to 5 wins |

Additional features:

- SF6-style rank system (Rookie → Iron → Bronze → Silver → Gold → Platinum → Diamond → Master)
- Session end screen with score, accuracy, combo max, and sharable result text
- Personal records saved to `localStorage`
- Smarter distractors — wrong answers stay within ±3 frames of the correct value
- Vercel Analytics custom events (`quiz_started`, `quiz_completed`, `daily_played`, …)

---

## Tech Stack

### Frontend

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Vercel Analytics** with custom events
- CSS-in-JS (inline styles) + global CSS for responsive breakpoints
- Fonts: Bebas Neue, Rajdhani, Share Tech Mono

### Backend

- **FastAPI** 0.135 + **SQLAlchemy** 2.0 + **PostgreSQL**
- **Alembic** for migrations
- **WebSockets** (Starlette) for real-time multiplayer rooms
- **Pydantic** v2 for schema validation

### Data

- 1562 moves scraped from [ultimateframedata.com](https://ultimateframedata.com)
- 30 characters, full SF6 roster (patch June 2026)
- Automated patch pipeline: scrape → diff → seed → portrait download

### Deployment

- **Frontend**: Vercel (auto-deploy on `main`)
- **Backend**: Render (free tier, spins up on first request)
- **Database**: Render PostgreSQL

---

## Architecture

```text
fight-data-arena/
├── frontend/                  # Next.js app
│   ├── app/
│   │   ├── layout.tsx         # Root layout + Analytics
│   │   ├── page.tsx           # Home — mode selector
│   │   ├── quiz/
│   │   │   ├── page.tsx       # Quiz mode picker
│   │   │   ├── play/page.tsx  # Quiz engine (all modes)
│   │   │   └── daily/page.tsx # Daily challenge
│   │   ├── fighters/          # Frame data browser
│   │   └── multi/             # Multiplayer lobby + room
│   ├── components/
│   │   └── Navbar.tsx
│   ├── lib/
│   │   ├── api.ts             # API client functions
│   │   └── portraits.ts       # Slug → portrait URL mapping
│   └── types/index.ts
│
├── backend/                   # FastAPI app
│   ├── app/
│   │   ├── routers/
│   │   │   ├── quiz.py        # Quiz endpoints
│   │   │   ├── fighters.py    # Fighter / move endpoints
│   │   │   └── multi.py       # WebSocket multiplayer
│   │   ├── services/
│   │   │   └── quiz_service.py
│   │   ├── models/            # SQLAlchemy ORM models
│   │   └── schemas/           # Pydantic schemas
│   └── requirements.txt
│
├── data/                      # Raw JSON data
│   └── json/all_fighters.json # 30 fighters, 1562 moves
│
└── scripts/                   # Maintenance tooling
    ├── update_patch.py        # Full patch update pipeline
    ├── scrape_sf6.py          # SF6 frame data scraper
    └── download_portraits.py  # Character portrait downloader
```

---

## Local Setup

### Prerequisites

- Node.js 18+
- Python 3.11+
- PostgreSQL 15+

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env          # fill in DATABASE_URL

alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install

cp .env.local.example .env.local   # fill in NEXT_PUBLIC_API_URL

npm run dev
# → http://localhost:3000
```

### Environment variables

**`backend/.env`**

```env
DATABASE_URL=postgresql://user:password@localhost:5432/fda
```

**`frontend/.env.local`**

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Patch update (after a new SF6 patch)

```bash
py scripts/update_patch.py --dry-run      # preview changes
py scripts/update_patch.py --db-url "postgresql://..."
```

---

## Roadmap

- [ ] **Punish Calculator** — input the on-block value of any move and get the fastest punish options per character
- [ ] **SuperCombo scraping** — import `atkRange` (attack range / hitbox extension data) for each move
- [ ] **REFramework data mining** — extract pushback values on block to improve punish accuracy
- [ ] **Enriched Database page** — sortable/filterable frame data table with hitbox GIFs inline

---

## Credits

- Hitbox GIFs sourced from **[ultimateframedata.com](https://ultimateframedata.com)** — the reference SF6 frame data resource
- Frame data and character assets © **Capcom** — Street Fighter 6

> This is an independent fan project, not affiliated with or endorsed by Capcom.

---

## License

[MIT](LICENSE) — Matis Dembele, 2026
