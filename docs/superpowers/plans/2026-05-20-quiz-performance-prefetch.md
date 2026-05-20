# Quiz Performance — Prefetch Question & GIF Preload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate the two visible loading delays in the quiz — API round-trip between questions and GIF render lag on question transitions.

**Architecture:** In quiz/play, prefetch the next question + preload its GIF as soon as the user answers (during the feedback phase), storing the result in a ref. On "QUESTION SUIVANTE" click, use the prefetched question instantly if ready, or fall back to a normal fetch. In quiz/daily, add a `useEffect` that triggers `new Image().src` for the next GIF whenever `idx` or `questions` changes.

**Tech Stack:** React (useRef, useEffect, useCallback), Next.js 15, TypeScript — no new dependencies.

---

## File Map

| File | Change |
|---|---|
| `frontend/app/quiz/play/page.tsx` | Add `nextQuestionRef`, `prefetchingRef`, `prefetchNext`, `handleNextQuestion`; trigger prefetch on answer |
| `frontend/app/quiz/daily/page.tsx` | Add single `useEffect` to preload GIF at index `idx + 1` |

---

### Task 1: Prefetch next question + GIF in quiz/play

**Files:**
- Modify: `frontend/app/quiz/play/page.tsx`

No unit test framework exists in the frontend — manual verification steps are provided instead.

- [ ] **Step 1: Add refs after the existing `inputRef` declaration (line 28)**

Add these two lines immediately after `const inputRef = useRef<HTMLInputElement>(null)`:

```typescript
const nextQuestionRef  = useRef<QuizQuestion | null>(null)
const prefetchingRef   = useRef<boolean>(false)
```

- [ ] **Step 2: Reset refs at the top of `loadQuestion`**

`loadQuestion` is called on session start and on skip. Resetting refs there ensures no stale prefetch is used after a restart.

Find this block (around line 56–75):
```typescript
const loadQuestion = useCallback(async () => {
  setLoading(true)
  setSelected(null)
```

Replace the first two lines of the function body:
```typescript
const loadQuestion = useCallback(async () => {
  nextQuestionRef.current = null
  prefetchingRef.current  = false
  setLoading(true)
  setSelected(null)
```

- [ ] **Step 3: Add `prefetchNext` after `loadQuestion`**

Insert this function immediately after the closing `}, [mode, slug])` of `loadQuestion`:

```typescript
const prefetchNext = useCallback(async () => {
  if (prefetchingRef.current) return
  prefetchingRef.current = true
  try {
    const q = isPunish
      ? await getRandomPunish()
      : (mode === 'fighter' && slug)
      ? await getFighterQuiz(slug)
      : await getRandomQuiz()
    nextQuestionRef.current = q
    if (q.gif_url) {
      const img = new Image()
      img.src = q.gif_url
    }
  } catch {
    // silent — handleNextQuestion falls back to loadQuestion
  } finally {
    prefetchingRef.current = false
  }
}, [mode, slug, isPunish])
```

- [ ] **Step 4: Add useEffect to trigger prefetch when user answers**

Insert after the existing `useEffect(() => { if (sessionPhase === 'playing') loadQuestion() }, ...)` line (line 77):

```typescript
useEffect(() => {
  if (state !== 'idle') prefetchNext()
}, [state, prefetchNext])
```

This fires whenever state becomes `'correct'` or `'wrong'`, initiating the background fetch.

- [ ] **Step 5: Add `handleNextQuestion` before `choiceStyle`**

Insert before `const choiceStyle = ...` (around line 143):

```typescript
const handleNextQuestion = useCallback(() => {
  if (isSessionOver) { setSessionPhase('finished'); return }
  if (nextQuestionRef.current) {
    const q = nextQuestionRef.current
    nextQuestionRef.current = null
    prefetchingRef.current  = false
    setQuestion(q)
    setSelected(null)
    setState('idle')
    setInputVal('')
    setTimeLeft(5)
    if (timerRef.current) clearInterval(timerRef.current)
  } else {
    loadQuestion()
  }
}, [isSessionOver, loadQuestion])
```

- [ ] **Step 6: Wire the button to `handleNextQuestion`**

Find the "QUESTION SUIVANTE" button (around line 590):
```typescript
<button onClick={() => isSessionOver ? setSessionPhase('finished') : loadQuestion()} style={{
```

Replace with:
```typescript
<button onClick={handleNextQuestion} style={{
```

- [ ] **Step 7: Manual test**

Start the dev server: `cd frontend && npm run dev`

Test the following scenarios:

1. **Normal flow**: Start a random quiz, answer a question, wait ~1s (prefetch time), click "QUESTION SUIVANTE" → next question appears instantly with no loading spinner.
2. **Fast click**: Answer immediately and click "QUESTION SUIVANTE" before 1s → shows spinner briefly, then question appears (fallback path).
3. **Skip flow**: Start a quiz, click "PASSER →" without answering → question loads normally (no prefetch was queued).
4. **Session restart**: Complete a session, click "REJOUER" → first question loads normally (refs reset).
5. **Fighter mode**: `?mode=fighter&slug=ryu` → same prefetch behavior.
6. **Punish mode**: `?mode=punish` → same prefetch behavior using `getRandomPunish`.

- [ ] **Step 8: Commit**

```bash
git add frontend/app/quiz/play/page.tsx
git commit -m "perf: prefetch next question + GIF in quiz play"
```

---

### Task 2: Preload next GIF in daily quiz

**Files:**
- Modify: `frontend/app/quiz/daily/page.tsx`

- [ ] **Step 1: Add GIF preload effect**

Find the block after `const answersRef = useRef<boolean[]>([])` (line 99) — specifically the first `useEffect` (around line 101):

```typescript
useEffect(() => {
  const result = getStoredResult()
  ...
}, [])
```

Insert a new `useEffect` **after** this first one:

```typescript
useEffect(() => {
  const next = questions[idx + 1]
  if (next?.gif_url) {
    const img = new Image()
    img.src = next.gif_url
  }
}, [idx, questions])
```

This fires when `questions` first loads (preloads Q2's GIF while the user sees Q1) and again each time `idx` increments (preloads the following question's GIF during the answer feedback window).

- [ ] **Step 2: Manual test**

Start the dev server: `cd frontend && npm run dev`

Open Network tab in browser DevTools (filter: Img).

1. Navigate to `/quiz/daily` and click COMMENCER.
2. Wait for Q1 to load. Observe in DevTools: the GIF for Q2 should start loading in the background while Q1 is displayed.
3. Answer Q1. Click "QUESTION SUIVANTE →" → Q2's GIF should appear instantly (already in cache).
4. Repeat for Q2→Q3 transition to confirm.

- [ ] **Step 3: Commit**

```bash
git add frontend/app/quiz/daily/page.tsx
git commit -m "perf: preload next GIF in daily quiz"
```
