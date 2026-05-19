# Daily Challenge — Design Spec

**Date :** 2026-05-19  
**Projet :** Fight Data Arena (SF6 frame data quiz)  
**Statut :** Approuvé

---

## Résumé

Ajout d'un mode **Daily Challenge** : 10 questions QCM startup, identiques pour tous les joueurs chaque jour, jouables une seule fois par jour. Score partageable en texte style Wordle. Streak de jours consécutifs stocké en localStorage.

---

## Emplacement dans l'app

- **Home (`/`)** : 4ème tuile dans `MODES[]`, au même niveau que QUIZ / DATABASE / MULTI.
- **Page dédiée** : `/quiz/daily` (nouvelle page Next.js).
- **Pas** ajouté dans la grille `/quiz` (modes quiz).
- Le compteur "3 MODES" sur la home passe à "4 MODES".

---

## Architecture & Data flow

```
[Joueur arrive sur /quiz/daily]
        │
        ▼
localStorage a une entrée fda_daily_result pour aujourd'hui ?
   ├── OUI → écran "déjà joué" (score + grille Wordle + streak + bouton COPIER)
   └── NON → fetch GET /api/daily
                │
                ▼
        Réponse : 10 QuizQuestion[] (identiques pour tous ce jour-là)
                │
                ▼
        Phase "playing" : 10 questions QCM, pas de skip
                │
                ▼
        Sauvegarder dans localStorage (2 clés)
                │
                ▼
        Phase "finished" → texte Wordle → bouton COPIER
```

---

## Backend

### Nouvelle route : `GET /api/daily`

- Utilise `random.seed(str(date.today()))` pour une sélection déterministe.
- Sélectionne 10 moves depuis la DB avec la logique existante de `/quiz/random`.
- Retourne un tableau de 10 objets `QuizQuestion` (même format que l'API existante).
- Aucune nouvelle table en DB. Aucun stockage de scores côté serveur.
- Pas d'authentification requise.

**Exemple de réponse :**
```json
[
  { "move_name": "cr.HP", "fighter_slug": "ryu", "answer": "7", "choices": ["5", "7", "9", "11"], "gif_url": "..." },
  ...
]
```

---

## Frontend

### localStorage — 2 clés

**`fda_daily_result`**
```json
{
  "date": "2026-05-19",
  "answers": [true, false, true, true, false, true, true, true, false, true],
  "score": 7
}
```

**`fda_daily_streak`**
```json
{
  "streak": 3,
  "last_played": "2026-05-19"
}
```

### Logique de streak

- Fin de session → lire `last_played`
- `last_played` = hier → `streak + 1`
- `last_played` = aujourd'hui → pas de changement (cas reload)
- `last_played` absent ou >1 jour d'écart → streak = 1
- Streak affiché dans le texte Wordle **seulement si ≥ 2**

### Page `/quiz/daily` — 3 phases

**`intro`**
- Splash : "DAILY 19/05" + numéro du jour (jours écoulés depuis le 01/01/2026, affiché uniquement sur l'écran intro — pas dans le texte Wordle)
- Bouton COMMENCER
- Si `fda_daily_result.date` = aujourd'hui → saute directement à `finished`

**`playing`**
- Même composant que le quiz existant, avec ces différences :
  - Pas de bouton "PASSER →" — le bouton "QUESTION SUIVANTE" est inactif tant que l'utilisateur n'a pas répondu
  - Compteur visible dans le header : "Q3 / 10"
  - Pas de sélecteur de longueur de session
  - Couleur du mode : `#00ff88` / `#00b894`

**`finished`**
- Grille d'emojis sur 2 lignes (5 + 5)
- Score : `7 / 10`
- Streak (si ≥ 2) : `🔥 3 jours`
- Bouton "COPIER LE RÉSULTAT" (copie le texte Wordle dans le presse-papier)
- Lien "← MODES"

### Format du texte Wordle (copié)

```
FIGHT DATA ARENA — DAILY 19/05
✅❌✅✅❌✅✅✅❌✅  7/10
🔥 Streak : 3 jours
fightdata.app/quiz/daily
```

La ligne streak est omise si streak < 2.

### Home page (`/page.tsx`)

Ajout d'un 4ème mode dans `MODES[]` :

```ts
{
  id: 'daily',
  label: 'DAILY',
  sub: 'Un challenge par jour',
  href: '/quiz/daily',
  color: '#00ff88',
  colorAlt: '#00b894',
  desc: 'Chaque jour, 10 questions identiques pour tous. Compare ton score avec la communauté.',
}
```

---

## Ce qui est hors scope

- Leaderboard global (aucun stockage de scores serveur)
- Authentification / comptes utilisateurs
- Replay du daily le même jour
- Questions sur autre chose que le startup (damage, on-block, etc.)
- Daily par perso (thème du jour)
