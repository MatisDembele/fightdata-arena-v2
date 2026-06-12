# Fight Data Arena

![Next.js](https://img.shields.io/badge/Next.js_16-black?style=flat-square&logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)

An interactive frame data quiz for Street Fighter 6. Test your knowledge of startups, punish windows, and frame advantage — across all 29 characters and 1418 moves.

**Live at [fightdata.app](https://fightdata.app)**

---

## Features

| Mode | Description |
|------|-------------|
| 🎲 **Random** | Multiple-choice startup questions across the full SF6 roster |
| 🥊 **Fighter** | Focus on a single character and master their frame data |
| ⌨️ **Input** | No choices — type the exact startup value from memory |
| 🎯 **Punish Finder** | Is this move punishable on block? Train your -4 instinct |
| ⚡ **Hardcore** | 5-second timer, no skip, one answer per question |
| 💀 **Survival** | One life — answer correctly as long as you can |
| 📅 **Daily** | 10 identical questions for everyone, refreshed each day |
| 👥 **Multiplayer** | Real-time 1v1 quiz via WebSocket — first to 5 wins |

Additional features:
- SF6-style rank system (Rookie → Iron → Bronze → Silver → Gold → Platinum → Diamond → Master)
- Session end screen with score, accuracy, combo max, and sharable result text
- Personal records saved to `localStorage`
- Smarter distractors: wrong answers stay within ±3 frames of the correct value

---

## Tech Stack

### Frontend
- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Vercel Analytics** with custom events (`quiz_started`, `quiz_completed`, `daily_played`, `multi_game_created`, `multi_game_joined`)
- CSS-in-JS (inline styles) + global CSS for responsive breakpoints
- Fonts: Bebas Neue, Rajdhani, Share Tech Mono

### Backend
- **FastAPI** 0.135 + **SQLAlchemy** 2.0 + **PostgreSQL**
- **Alembic** for migrations
- **WebSockets** (Starlette) for real-time multiplayer rooms
- **Pydantic** v2 for schema validation

### Data
- 1418 moves scraped from [ultimateframedata.com](https://ultimateframedata.com)
- 30 characters, full SF6 roster (patch June 2026)
- Hitbox GIFs served via CDN

### Deployment
- **Frontend**: Vercel (auto-deploy on `main`)
- **Backend**: Render (free tier, spins up on first request)
- **Database**: Render PostgreSQL

---

## Architecture

```
fight-data-arena/
├── frontend/                  # Next.js app
│   ├── app/
│   │   ├── layout.tsx         # Root layout + Analytics
│   │   ├── page.tsx           # Home — mode selector
│   │   ├── quiz/
│   │   │   ├── page.tsx       # Quiz mode picker
│   │   │   ├── play/page.tsx  # Quiz engine (all modes)
│   │   │   └── daily/page.tsx # Daily challenge
│   │   ├── fighters/          # Frame data database
│   │   └── multi/             # Multiplayer lobby + room
│   ├── components/
│   │   └── Navbar.tsx
│   ├── lib/
│   │   └── api.ts             # API client functions
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
└── data/                      # Scraping scripts + raw JSON
    └── scrape_sf6.py
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

# Copy and fill in environment variables
cp .env.example .env

# Run migrations
alembic upgrade head

# Start the server
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install

# Copy and fill in environment variables
cp .env.local.example .env.local

npm run dev
# → http://localhost:3000
```

### Environment Variables

**backend/.env**
```
DATABASE_URL=postgresql://user:password@localhost:5432/fda
```

**frontend/.env.local**
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Roadmap

- [ ] **Punish Calculator** — input the on-block value of any move and get the fastest punish options per character
- [ ] **SuperCombo scraping** — import `atkRange` (attack range / hitbox extension data) for each move
- [ ] **REFramework data mining** — extract pushback values on block to improve punish accuracy
- [ ] **Enriched Database page** — sortable/filterable frame data table with hitbox GIFs inline, section filters, and comparison mode

---

## Credits

- Frame data sourced from **[ultimateframedata.com](https://ultimateframedata.com)** — the reference SF6 frame data resource
- Hitbox GIFs and character assets © **Capcom** — Street Fighter 6

> This is an independent fan project, not affiliated with or endorsed by Capcom.

---

## License

[MIT](LICENSE) — Matis Dembele, 2026
