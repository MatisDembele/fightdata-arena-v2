# Daily Challenge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Daily Challenge mode — 10 deterministic QCM startup questions per day, same for all players, with a Wordle-style shareable result and a localStorage streak.

**Architecture:** New `GET /api/quiz/daily` FastAPI endpoint uses a seeded `random.Random(date_str)` instance to pick 10 startup questions deterministically. The frontend page `/quiz/daily` fetches once, caches nothing server-side, tracks answers and streak in `localStorage`. Home page gets a 4th DAILY tile.

**Tech Stack:** FastAPI (Python), Next.js 15 (TypeScript/React), localStorage, Clipboard API

---

## File Map

| File | Action | What it does |
|---|---|---|
| `backend/app/services/quiz_service.py` | Modify | Add `generate_daily_questions(db, date_str)` using seeded RNG |
| `backend/app/routers/quiz.py` | Modify | Add `GET /quiz/daily` endpoint |
| `backend/tests/test_daily.py` | Create | Tests for the daily service + endpoint |
| `frontend/lib/api.ts` | Modify | Add `getDailyQuiz()` |
| `frontend/app/quiz/daily/page.tsx` | Create | Full daily page (intro / playing / finished phases) |
| `frontend/app/page.tsx` | Modify | Add DAILY to `MODES[]`, update "3 MODES" → "4 MODES" |

---

## Task 1: Backend service — `generate_daily_questions`

**Files:**
- Modify: `backend/app/services/quiz_service.py`
- Create: `backend/tests/__init__.py` (empty)
- Create: `backend/tests/test_daily.py`

- [ ] **Step 1: Create the test file**

Create `backend/tests/__init__.py` (empty file).

Create `backend/tests/test_daily.py`:

```python
import pytest
from unittest.mock import MagicMock
from app.services.quiz_service import generate_daily_questions


def _make_fighter(id, slug):
    f = MagicMock()
    f.id = id
    f.slug = slug
    return f


def _make_move(fighter_id, move_name, startup, gif_path="fake.gif"):
    m = MagicMock()
    m.fighter_id = fighter_id
    m.move_name = move_name
    m.startup = startup
    m.gif_path = gif_path
    m.gif_url = f"http://example.com/{move_name}.gif"
    m.section = "normals"
    m.on_block = None
    return m


def _build_db(n_fighters=15, moves_per_fighter=10):
    db = MagicMock()
    fighters = [_make_fighter(i, f"fighter_{i}") for i in range(n_fighters)]

    def query_side_effect(model):
        q = MagicMock()
        from app.models.fighter import Fighter
        from app.models.move import Move
        if model is Fighter:
            q.all.return_value = fighters
            q.filter.return_value = q
            q.first.side_effect = lambda: fighters[0]
        if model is Move:
            # Return moves with varied startups for each fighter
            def make_filter(*args, **kwargs):
                inner = MagicMock()
                fid = None
                # Extract fighter_id from filter call
                for arg in args:
                    try:
                        fid = int(str(arg).split("fighter_id = ")[1].split(")")[0])
                    except Exception:
                        pass
                moves = [
                    _make_move(fid if fid is not None else 0, f"move_{j}", str(4 + j))
                    for j in range(moves_per_fighter)
                ]
                inner.all.return_value = moves
                inner.filter.return_value = inner
                return inner
            q.filter.side_effect = make_filter
        return q

    db.query.side_effect = query_side_effect
    return db, fighters


def test_generate_daily_questions_returns_10():
    db, _ = _build_db()
    questions = generate_daily_questions(db, "2026-05-19")
    assert len(questions) == 10


def test_generate_daily_questions_deterministic():
    db1, _ = _build_db()
    db2, _ = _build_db()
    q1 = generate_daily_questions(db1, "2026-05-19")
    q2 = generate_daily_questions(db2, "2026-05-19")
    assert [q.move_name for q in q1] == [q.move_name for q in q2]


def test_generate_daily_questions_different_per_day():
    db1, _ = _build_db()
    db2, _ = _build_db()
    q1 = generate_daily_questions(db1, "2026-05-19")
    q2 = generate_daily_questions(db2, "2026-05-20")
    # With 15 fighters and different seeds, order should differ
    # (not a strict guarantee but extremely likely with seeded shuffle)
    fighter_order_1 = [q.fighter_slug for q in q1]
    fighter_order_2 = [q.fighter_slug for q in q2]
    assert fighter_order_1 != fighter_order_2


def test_generate_daily_questions_each_has_4_choices():
    db, _ = _build_db()
    questions = generate_daily_questions(db, "2026-05-19")
    for q in questions:
        assert len(q.choices) == 4
        assert q.answer in q.choices
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd backend
python -m pytest tests/test_daily.py -v
```

Expected: `ImportError` or `AttributeError` — `generate_daily_questions` does not exist yet.

- [ ] **Step 3: Add `generate_daily_questions` to `quiz_service.py`**

Open `backend/app/services/quiz_service.py`. After the existing `generate_random_punish_question` function, add:

```python
def _generate_startup_question_rng(
    db: Session, slug: str, rng: random.Random
) -> QuizQuestion | None:
    fighter = db.query(Fighter).filter(Fighter.slug == slug).first()
    if not fighter:
        return None

    candidates = (
        db.query(Move)
        .filter(Move.fighter_id == fighter.id, Move.gif_path.isnot(None))
        .all()
    )
    candidates = [m for m in candidates if _is_numeric(m.startup)]

    if len(candidates) < 4:
        return None

    correct_move = rng.choice(candidates)
    correct_answer = correct_move.startup

    other_startups = list({
        m.startup for m in candidates
        if m.startup != correct_answer and _is_numeric(m.startup)
    })

    if len(other_startups) < 3:
        return None

    wrong_answers = rng.sample(other_startups, 3)
    choices = wrong_answers + [correct_answer]
    rng.shuffle(choices)

    return QuizQuestion(
        move_name=correct_move.move_name,
        section=correct_move.section,
        gif_url=correct_move.gif_url,
        gif_path=correct_move.gif_path,
        question=f"Quel est le startup de {correct_move.move_name} ?",
        choices=choices,
        answer=correct_answer,
        fighter_slug=slug,
    )


def generate_daily_questions(db: Session, date_str: str) -> list[QuizQuestion]:
    rng = random.Random(date_str)
    fighters = db.query(Fighter).all()
    fighters_copy = list(fighters)
    rng.shuffle(fighters_copy)

    questions: list[QuizQuestion] = []
    for fighter in fighters_copy:
        if len(questions) >= 10:
            break
        q = _generate_startup_question_rng(db, fighter.slug, rng)
        if q:
            questions.append(q)

    return questions
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd backend
python -m pytest tests/test_daily.py -v
```

Expected: all 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/app/services/quiz_service.py backend/tests/__init__.py backend/tests/test_daily.py
git commit -m "feat(backend): add generate_daily_questions with seeded RNG"
```

---

## Task 2: Backend route — `GET /quiz/daily`

**Files:**
- Modify: `backend/app/routers/quiz.py`
- Modify: `backend/tests/test_daily.py` (add endpoint test)

- [ ] **Step 1: Add endpoint test**

Append to `backend/tests/test_daily.py`:

```python
from fastapi.testclient import TestClient
from app.main import app
from app.database import get_db


def test_daily_endpoint_returns_10_questions(monkeypatch):
    from app.services import quiz_service

    def mock_generate(db, date_str):
        from app.schemas.move import QuizQuestion
        return [
            QuizQuestion(
                move_name=f"move_{i}",
                section="normals",
                gif_url=f"http://x.com/{i}.gif",
                gif_path=f"{i}.gif",
                question=f"Startup de move_{i} ?",
                choices=["4", "5", "6", "7"],
                answer="5",
                fighter_slug=f"fighter_{i}",
            )
            for i in range(10)
        ]

    monkeypatch.setattr(quiz_service, "generate_daily_questions", mock_generate)

    client = TestClient(app)
    response = client.get("/api/quiz/daily")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 10
    assert data[0]["move_name"] == "move_0"
    assert len(data[0]["choices"]) == 4
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend
python -m pytest tests/test_daily.py::test_daily_endpoint_returns_10_questions -v
```

Expected: FAIL — 404 or route not found.

- [ ] **Step 3: Add the route to `quiz.py`**

Open `backend/app/routers/quiz.py`. Add at the top, after existing imports:

```python
from datetime import date
```

Then add this route **before** the `/{slug}/startup` route (to avoid slug capture):

```python
@router.get("/daily", response_model=list[QuizQuestion])
def daily_questions(db: Session = Depends(get_db)):
    questions = quiz_service.generate_daily_questions(db, str(date.today()))
    if not questions:
        raise HTTPException(status_code=404, detail="Impossible de générer le daily challenge")
    return questions
```

- [ ] **Step 4: Run all backend tests**

```bash
cd backend
python -m pytest tests/test_daily.py -v
```

Expected: all 5 tests PASS.

- [ ] **Step 5: Smoke test the endpoint manually**

Start the backend: `cd backend && uvicorn app.main:app --reload`

```bash
curl http://localhost:8000/api/quiz/daily
```

Expected: JSON array of 10 objects, each with `move_name`, `choices` (4 items), `answer`, `fighter_slug`.

- [ ] **Step 6: Commit**

```bash
git add backend/app/routers/quiz.py backend/tests/test_daily.py
git commit -m "feat(backend): add GET /quiz/daily endpoint"
```

---

## Task 3: Frontend API function

**Files:**
- Modify: `frontend/lib/api.ts`

- [ ] **Step 1: Add `getDailyQuiz` to `api.ts`**

Open `frontend/lib/api.ts`. Append at the end of the file:

```typescript
export async function getDailyQuiz(): Promise<import('@/types').QuizQuestion[]> {
  const res = await fetch(`${API_URL}/api/quiz/daily`)
  if (!res.ok) throw new Error('Erreur daily quiz')
  return res.json()
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd frontend
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/lib/api.ts
git commit -m "feat(frontend): add getDailyQuiz API function"
```

---

## Task 4: Frontend — `/quiz/daily` page

**Files:**
- Create: `frontend/app/quiz/daily/page.tsx`

This is the main component. It has three phases: `intro`, `playing`, `finished`.

- [ ] **Step 1: Create the file**

Create `frontend/app/quiz/daily/page.tsx` with this content:

```tsx
'use client'
import { useState, useEffect, useCallback, Suspense } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { getDailyQuiz } from '@/lib/api'
import type { QuizQuestion } from '@/types'

const COLOR     = '#00ff88'
const COLOR_ALT = '#00b894'

type Phase      = 'intro' | 'playing' | 'finished'
type AnswerState = 'idle' | 'correct' | 'wrong'

interface DailyResult {
  date: string
  answers: boolean[]
  score: number
}

interface DailyStreak {
  streak: number
  last_played: string
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

function dayNumber(): number {
  const start = new Date('2026-01-01').getTime()
  const today = new Date().setHours(0, 0, 0, 0)
  return Math.max(1, Math.floor((today - start) / 86400000) + 1)
}

function formatDate(): string {
  const d = new Date()
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

function getStoredResult(): DailyResult | null {
  try {
    const raw = localStorage.getItem('fda_daily_result')
    if (!raw) return null
    return JSON.parse(raw)
  } catch { return null }
}

function getStoredStreak(): DailyStreak {
  try {
    const raw = localStorage.getItem('fda_daily_streak')
    if (!raw) return { streak: 0, last_played: '' }
    return JSON.parse(raw)
  } catch { return { streak: 0, last_played: '' } }
}

function saveResultAndStreak(answers: boolean[], score: number): DailyStreak {
  const today = todayStr()
  localStorage.setItem('fda_daily_result', JSON.stringify({ date: today, answers, score }))

  const stored = getStoredStreak()
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  let newStreak = 1
  if (stored.last_played === yesterdayStr) newStreak = stored.streak + 1
  else if (stored.last_played === today)   newStreak = stored.streak

  const streakData: DailyStreak = { streak: newStreak, last_played: today }
  localStorage.setItem('fda_daily_streak', JSON.stringify(streakData))
  return streakData
}

function buildWordleText(answers: boolean[], score: number, streak: number): string {
  const emojis = answers.map(a => a ? '✅' : '❌').join('')
  const date   = formatDate()
  const lines  = [
    `FIGHT DATA ARENA — DAILY ${date}`,
    `${emojis}  ${score}/10`,
  ]
  if (streak >= 2) lines.push(`🔥 Streak : ${streak} jours`)
  lines.push('fightdata.app/quiz/daily')
  return lines.join('\n')
}

// ── Composant principal ─────────────────────────────────────────────────────

function DailyPage() {
  const [phase, setPhase]         = useState<Phase>('intro')
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [idx, setIdx]             = useState(0)
  const [answers, setAnswers]     = useState<boolean[]>([])
  const [selected, setSelected]   = useState<string | null>(null)
  const [state, setState]         = useState<AnswerState>('idle')
  const [score, setScore]         = useState(0)
  const [streak, setStreak]       = useState(0)
  const [copied, setCopied]       = useState(false)
  const [loading, setLoading]     = useState(false)
  const [alreadyPlayed, setAlreadyPlayed] = useState<DailyResult | null>(null)

  // Check localStorage on mount
  useEffect(() => {
    const result = getStoredResult()
    if (result?.date === todayStr()) {
      setAlreadyPlayed(result)
      setAnswers(result.answers)
      setScore(result.score)
      setStreak(getStoredStreak().streak)
      setPhase('finished')
    }
  }, [])

  const loadQuestions = useCallback(async () => {
    setLoading(true)
    try {
      const qs = await getDailyQuiz()
      setQuestions(qs)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  const startPlaying = () => {
    loadQuestions()
    setPhase('playing')
  }

  const handleChoice = (choice: string) => {
    if (state !== 'idle') return
    const correct = choice === questions[idx]?.answer
    setSelected(choice)
    setState(correct ? 'correct' : 'wrong')
    setAnswers(prev => [...prev, correct])
    if (correct) setScore(s => s + 1)
  }

  const handleNext = () => {
    if (idx + 1 >= questions.length) {
      const finalAnswers = [...answers]
      const finalScore   = score
      const streakData   = saveResultAndStreak(finalAnswers, finalScore)
      setStreak(streakData.streak)
      setPhase('finished')
    } else {
      setIdx(i => i + 1)
      setSelected(null)
      setState('idle')
    }
  }

  const copyResult = async () => {
    const text = buildWordleText(answers, score, streak)
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback: do nothing
    }
  }

  const choiceStyle = (choice: string): React.CSSProperties => {
    const base: React.CSSProperties = {
      padding: '11px 14px',
      display: 'flex', alignItems: 'center', gap: '10px',
      cursor: state === 'idle' ? 'pointer' : 'default',
      border: '1px solid rgba(255,255,255,0.09)',
      background: 'rgba(255,255,255,0.04)',
      transition: 'all 0.15s',
      fontFamily: "'Share Tech Mono', monospace",
      fontSize: '0.88rem', color: 'rgba(255,255,255,0.75)',
      width: '100%', textAlign: 'left',
    }
    if (state === 'idle') return base
    const q = questions[idx]
    if (choice === q?.answer) return { ...base, background: 'rgba(74,222,128,0.12)', border: '1px solid #4ade80', color: '#4ade80', boxShadow: '0 0 12px rgba(74,222,128,0.2)' }
    if (choice === selected)  return { ...base, background: 'rgba(255,45,120,0.12)', border: '1px solid #ff2d78', color: '#ff2d78' }
    return { ...base, opacity: 0.3 }
  }

  // ── INTRO ──────────────────────────────────────────────────────────────────
  if (phase === 'intro') return (
    <>
      <Navbar />
      <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', minHeight: 'calc(100vh - 60px)' }}>
        <div style={{ width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '28px', alignItems: 'center', textAlign: 'center' }}>

          <div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem', letterSpacing: '4px', color: COLOR, marginBottom: '10px' }}>
              #{dayNumber()}
            </div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(2.5rem, 8vw, 4rem)', letterSpacing: '8px', color: '#fff', textShadow: `0 0 20px ${COLOR}, 0 0 50px ${COLOR}55`, lineHeight: 1 }}>
              DAILY {formatDate()}
            </div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', letterSpacing: '3px', color: 'rgba(255,255,255,0.25)', marginTop: '10px' }}>
              10 QUESTIONS — UN PAR JOUR
            </div>
          </div>

          <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '0.9rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, maxWidth: '320px' }}>
            Chaque jour, 10 questions identiques pour tous les joueurs. Pas de skip — réponds à tout.
          </div>

          <button onClick={startPlaying} style={{
            width: '100%', maxWidth: '280px', padding: '14px',
            background: `linear-gradient(90deg, ${COLOR_ALT}, ${COLOR})`,
            border: 'none', cursor: 'pointer',
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '1.1rem', letterSpacing: '6px', color: '#000',
            boxShadow: `0 0 20px ${COLOR}33`, transition: 'all 0.2s',
          }}>
            COMMENCER →
          </button>

          <Link href="/" style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem', letterSpacing: '3px', color: 'rgba(255,255,255,0.2)', textDecoration: 'none' }}>
            ← ACCUEIL
          </Link>
        </div>
      </main>
    </>
  )

  // ── FINISHED ───────────────────────────────────────────────────────────────
  if (phase === 'finished') return (
    <>
      <Navbar />
      <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', minHeight: 'calc(100vh - 60px)' }}>
        <div style={{ width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '28px', alignItems: 'center', textAlign: 'center' }}>

          <div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(2rem, 6vw, 3rem)', letterSpacing: '6px', color: COLOR, textShadow: `0 0 20px ${COLOR}`, lineHeight: 1 }}>
              DAILY {formatDate()}
            </div>
            {alreadyPlayed && (
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', letterSpacing: '3px', color: 'rgba(255,255,255,0.3)', marginTop: '8px' }}>
                DÉJÀ JOUÉ AUJOURD'HUI
              </div>
            )}
          </div>

          {/* Score */}
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(3rem, 10vw, 5rem)', letterSpacing: '4px', color: '#fff', textShadow: `0 0 30px ${COLOR}88`, lineHeight: 1 }}>
            {score}<span style={{ fontSize: '0.5em', color: COLOR }}>/10</span>
          </div>

          {/* Grille Wordle */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
            {[answers.slice(0, 5), answers.slice(5, 10)].map((row, ri) => (
              <div key={ri} style={{ display: 'flex', gap: '6px' }}>
                {row.map((correct, ci) => (
                  <div key={ci} style={{
                    width: '36px', height: '36px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.2rem',
                    background: correct ? 'rgba(74,222,128,0.15)' : 'rgba(255,45,120,0.12)',
                    border: `1px solid ${correct ? '#4ade80' : '#ff2d78'}`,
                  }}>
                    {correct ? '✅' : '❌'}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Streak */}
          {streak >= 2 && (
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.2rem', letterSpacing: '3px', color: '#ffe000', textShadow: '0 0 12px #ffe000' }}>
              🔥 STREAK : {streak} JOURS
            </div>
          )}

          {/* Bouton copier */}
          <button onClick={copyResult} style={{
            width: '100%', maxWidth: '280px', padding: '14px',
            background: copied ? 'rgba(74,222,128,0.2)' : `linear-gradient(90deg, ${COLOR_ALT}, ${COLOR})`,
            border: copied ? '1px solid #4ade80' : 'none',
            cursor: 'pointer',
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '1rem', letterSpacing: '4px',
            color: copied ? '#4ade80' : '#000',
            transition: 'all 0.2s',
            boxShadow: copied ? 'none' : `0 0 16px ${COLOR}33`,
          }}>
            {copied ? '✓ COPIÉ !' : 'COPIER LE RÉSULTAT'}
          </button>

          <Link href="/" style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: '0.6rem', letterSpacing: '3px',
            color: 'rgba(255,255,255,0.2)', textDecoration: 'none',
          }}>← ACCUEIL</Link>

        </div>
      </main>
    </>
  )

  // ── PLAYING ────────────────────────────────────────────────────────────────
  const question = questions[idx]

  return (
    <>
      <Navbar />
      <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 20px', minHeight: 'calc(100vh - 60px)' }}>

        {/* Score bar */}
        <div className="score-bar" style={{ marginBottom: '24px' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: `linear-gradient(90deg, transparent, ${COLOR}, transparent)` }} />
          {[
            { val: score,              label: 'SCORE' },
            { val: `${idx + 1}/10`,    label: 'QUESTION' },
            { val: `${answers.filter(Boolean).length}/${answers.length || '—'}`, label: 'CORRECT' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.7rem', letterSpacing: '2px', background: `linear-gradient(180deg, #fff, ${COLOR})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {s.val}
              </div>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.52rem', letterSpacing: '3px', color: 'rgba(255,255,255,0.28)' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {loading || !question ? (
          <div style={{ fontFamily: "'Share Tech Mono', monospace", color: 'rgba(255,255,255,0.3)', letterSpacing: '4px' }}>
            CHARGEMENT...
          </div>
        ) : (
          <div style={{ width: '100%', maxWidth: '500px', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.08)' }}>

            {/* Header */}
            <div style={{ padding: '11px 18px', background: 'rgba(0,255,136,0.07)', borderBottom: `1px solid ${COLOR}28`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.9rem', letterSpacing: '4px', background: `linear-gradient(90deg, ${COLOR}, ${COLOR_ALT})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                DAILY {formatDate()}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.65rem', letterSpacing: '2px', color: COLOR }}>
                  Q{idx + 1}/10
                </span>
                <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.65rem', letterSpacing: '2px', color: 'rgba(255,255,255,0.4)' }}>
                  {question.fighter_slug}
                </span>
              </div>
            </div>

            {/* GIF */}
            <div style={{ height: '180px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
              {question.gif_url ? (
                <img src={question.gif_url} alt={question.move_name} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
              ) : (
                <span style={{ fontFamily: "'Share Tech Mono', monospace", color: 'rgba(255,255,255,0.15)', fontSize: '0.6rem', letterSpacing: '3px' }}>NO GIF</span>
              )}
              {[
                { top: '7px', left: '7px', borderTop: `1px solid ${COLOR}`, borderLeft: `1px solid ${COLOR}` },
                { top: '7px', right: '7px', borderTop: `1px solid ${COLOR}`, borderRight: `1px solid ${COLOR}` },
                { bottom: '7px', left: '7px', borderBottom: `1px solid ${COLOR}`, borderLeft: `1px solid ${COLOR}` },
                { bottom: '7px', right: '7px', borderBottom: `1px solid ${COLOR}`, borderRight: `1px solid ${COLOR}` },
              ].map((s, i) => (
                <div key={i} style={{ position: 'absolute', width: '10px', height: '10px', ...s }} />
              ))}
            </div>

            {/* Question */}
            <div style={{ padding: '16px 18px 12px' }}>
              <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '1rem', fontWeight: 600, lineHeight: 1.4, color: 'rgba(255,255,255,0.9)' }}>
                Quel est le <span style={{ color: COLOR }}>startup</span> de{' '}
                <strong style={{ color: '#fff' }}>{question.move_name}</strong> ?
              </p>
            </div>

            {/* Choices */}
            <div style={{ padding: '0 18px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {question.choices.map((choice, i) => (
                  <button key={choice} onClick={() => handleChoice(choice)} style={choiceStyle(choice)}>
                    <span style={{ width: '20px', height: '20px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.18)', fontSize: '0.62rem' }}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    {choice} frames
                  </button>
                ))}
              </div>
            </div>

            {/* Feedback + next */}
            <div style={{ padding: '12px 18px 18px' }}>
              {state !== 'idle' && (
                <div style={{ padding: '9px 14px', marginBottom: '10px', background: state === 'correct' ? 'rgba(74,222,128,0.1)' : 'rgba(255,45,120,0.1)', border: `1px solid ${state === 'correct' ? '#4ade80' : '#ff2d78'}`, fontFamily: "'Rajdhani', sans-serif", fontSize: '0.9rem', fontWeight: 700, color: state === 'correct' ? '#4ade80' : '#ff2d78' }}>
                  {state === 'correct'
                    ? `✓ Correct ! Startup : ${question.answer} frames.`
                    : `✗ Raté ! Réponse : ${question.answer} frames.`}
                </div>
              )}
              <button
                onClick={state !== 'idle' ? handleNext : undefined}
                disabled={state === 'idle'}
                style={{
                  width: '100%', padding: '13px',
                  background: state !== 'idle' ? `linear-gradient(90deg, ${COLOR_ALT}, ${COLOR})` : 'rgba(255,255,255,0.05)',
                  border: state === 'idle' ? '1px solid rgba(255,255,255,0.08)' : 'none',
                  cursor: state !== 'idle' ? 'pointer' : 'default',
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: '0.95rem', letterSpacing: '4px',
                  color: state !== 'idle' ? '#000' : 'rgba(255,255,255,0.2)',
                  transition: 'all 0.2s',
                }}>
                {idx + 1 >= 10 && state !== 'idle' ? 'VOIR LES RÉSULTATS →' : 'QUESTION SUIVANTE →'}
              </button>
            </div>

          </div>
        )}

        <Link href="/" style={{ marginTop: '16px', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem', letterSpacing: '3px', color: 'rgba(255,255,255,0.2)', textDecoration: 'none' }}>
          ← ACCUEIL
        </Link>

      </main>
    </>
  )
}

export default function DailyChallengePage() {
  return <Suspense><DailyPage /></Suspense>
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd frontend
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Smoke test in browser**

Start frontend (`npm run dev` in `frontend/`), navigate to `http://localhost:3000/quiz/daily`.

Check:
- Intro screen shows "DAILY DD/MM" and day number
- Clicking COMMENCER loads 10 questions
- Can answer each question (no skip — button disabled until answered)
- Q counter increments: "Q1/10" → "Q2/10"
- Correct answer highlighted green, wrong highlighted red
- After Q10, clicking "VOIR LES RÉSULTATS" shows finished screen
- Finished screen shows score, 2-row emoji grid, COPIER button
- Clicking COPIER copies Wordle text to clipboard
- Refreshing the page goes directly to finished screen (already played)
- Streak shows if ≥ 2 consecutive days

- [ ] **Step 4: Commit**

```bash
git add frontend/app/quiz/daily/page.tsx
git commit -m "feat(frontend): add /quiz/daily page with intro/playing/finished phases"
```

---

## Task 5: Home page — add DAILY tile

**Files:**
- Modify: `frontend/app/page.tsx`

- [ ] **Step 1: Update `MODES` array and stats**

Open `frontend/app/page.tsx`.

Replace the `MODES` array and the `STATS` array:

**Current `MODES`:**
```typescript
const MODES = [
  {
    id: 'quiz', label: 'QUIZ', sub: 'Teste tes connaissances',
    href: '/quiz',
    color: '#ff2d78', colorAlt: '#9b1fff',
    desc: 'Devine le startup, le damage ou le on-block de chaque move depuis son hitbox GIF.',
  },
  {
    id: 'database', label: 'DATABASE', sub: 'Frame data complète',
    href: '/fighters',
    color: '#00f0ff', colorAlt: '#0050ff',
    desc: 'Accède aux données de frame de tous les personnages SF6. Startup, active, recovery et plus.',
  },
  {
    id: 'multi', label: 'MULTI', sub: 'Défie tes amis',
    href: '/multi',
    color: '#ffe000', colorAlt: '#ff6a00',
    desc: 'Affronte tes amis en quiz de frame data en temps réel. Qui connaît le mieux SF6 ?',
  },
]
```

**Replace with:**
```typescript
const MODES = [
  {
    id: 'quiz', label: 'QUIZ', sub: 'Teste tes connaissances',
    href: '/quiz',
    color: '#ff2d78', colorAlt: '#9b1fff',
    desc: 'Devine le startup, le damage ou le on-block de chaque move depuis son hitbox GIF.',
  },
  {
    id: 'database', label: 'DATABASE', sub: 'Frame data complète',
    href: '/fighters',
    color: '#00f0ff', colorAlt: '#0050ff',
    desc: 'Accède aux données de frame de tous les personnages SF6. Startup, active, recovery et plus.',
  },
  {
    id: 'multi', label: 'MULTI', sub: 'Défie tes amis',
    href: '/multi',
    color: '#ffe000', colorAlt: '#ff6a00',
    desc: 'Affronte tes amis en quiz de frame data en temps réel. Qui connaît le mieux SF6 ?',
  },
  {
    id: 'daily', label: 'DAILY', sub: 'Un challenge par jour',
    href: '/quiz/daily',
    color: '#00ff88', colorAlt: '#00b894',
    desc: 'Chaque jour, 10 questions identiques pour tous. Partage ton score style Wordle.',
  },
]
```

**Current `STATS`:**
```typescript
const STATS = [
  { val: '29',   label: 'PERSOS' },
  { val: '1418', label: 'MOVES' },
  { val: '3',    label: 'MODES' },
]
```

**Replace with:**
```typescript
const STATS = [
  { val: '29',   label: 'PERSOS' },
  { val: '1418', label: 'MOVES' },
  { val: '4',    label: 'MODES' },
]
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd frontend
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Test in browser**

Navigate to `http://localhost:3000`.

Check:
- 4 mode cards: QUIZ / DATABASE / MULTI / DAILY
- Arrows navigate through all 4
- DAILY card shows correct color (`#00ff88`)
- Clicking DAILY card (when active) navigates to `/quiz/daily`
- Stats show "4 MODES"

- [ ] **Step 4: Commit**

```bash
git add frontend/app/page.tsx
git commit -m "feat(frontend): add DAILY tile to home page, update mode count to 4"
```

---

## Task 6: Final integration test

- [ ] **Step 1: Full backend test suite**

```bash
cd backend
python -m pytest tests/ -v
```

Expected: all tests PASS.

- [ ] **Step 2: Full user flow test**

With both backend and frontend running:

1. Open `http://localhost:3000` → DAILY tile visible, "4 MODES" in stats
2. Click DAILY → `/quiz/daily` intro screen
3. Click COMMENCER → 10 questions load
4. Answer all 10 (try one wrong on purpose)
5. After Q10 → finished screen with correct emoji grid and score
6. Click COPIER → verify clipboard text format:
   ```
   FIGHT DATA ARENA — DAILY DD/MM
   ✅✅✅✅✅✅✅✅✅❌  9/10
   fightdata.app/quiz/daily
   ```
   (no streak line on first day)
7. Refresh `/quiz/daily` → shows finished screen immediately (already played)
8. Confirm "DÉJÀ JOUÉ AUJOURD'HUI" label visible

- [ ] **Step 3: Backend API call verification**

```bash
curl http://localhost:8000/api/quiz/daily | python -m json.tool | head -30
```

Expected: JSON array, first item has `move_name`, `choices` (4 strings), `answer`, `fighter_slug`.

Call twice, verify identical results:
```bash
curl http://localhost:8000/api/quiz/daily > /tmp/d1.json
curl http://localhost:8000/api/quiz/daily > /tmp/d2.json
diff /tmp/d1.json /tmp/d2.json
```

Expected: no diff.
