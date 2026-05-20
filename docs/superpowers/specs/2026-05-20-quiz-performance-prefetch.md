# Quiz Performance — Prefetch Question & GIF Preload

**Date :** 2026-05-20  
**Projet :** Fight Data Arena (SF6 frame data quiz)  
**Statut :** Approuvé

---

## Résumé

Amélioration des performances du quiz en éliminant les deux sources de latence visible :
1. Le délai réseau pour fetcher la prochaine question (quiz aléatoire)
2. Le délai de chargement du GIF à chaque transition de question

---

## Problèmes identifiés

### Quiz aléatoire (`/quiz/play`)
- Les questions sont fetchées **une par une** via `loadQuestion()`, appelée après chaque clic "QUESTION SUIVANTE"
- L'utilisateur attend : réponse API backend + chargement du GIF, tout après son action

### Daily (`/quiz/daily`)
- Les 10 questions sont chargées en une fois (pas de problème API)
- Les GIFs se chargent **à la demande** — chaque transition attend que le GIF de la question suivante charge

---

## Solution

### Quiz aléatoire : Prefetch question + GIF

Dès que l'utilisateur répond (état `correct` ou `wrong`), lancer en arrière-plan :
1. Fetch de la prochaine question (même logique que `loadQuestion`)
2. Une fois la question reçue, `new Image().src = next.gif_url` pour mettre le GIF en cache navigateur

Stockage du résultat dans un `nextQuestionRef = useRef<QuizQuestion | null>(null)`.

Quand l'utilisateur clique "QUESTION SUIVANTE" :
- **Prefetch prête** → utiliser directement `nextQuestionRef.current`, zéro délai réseau
- **Prefetch pas encore prête** → afficher le spinner, attendre la fin du fetch (fallback propre)

Un `prefetchingRef = useRef<boolean>(false)` empêche les doubles fetch en cas de clic rapide.

**Déclenchement de la prefetch :** dans le `useEffect` qui surveille `state` — quand `state !== 'idle'`, lancer la prefetch. Réinitialiser `nextQuestionRef` à `null` au début de chaque question.

### Daily : Preload GIF N+1

- Au chargement des 10 questions : `new Image().src = questions[0].gif_url`
- À chaque transition vers la question `idx` : `new Image().src = questions[idx + 1]?.gif_url`

Aucune logique complexe — le navigateur met le GIF en cache, la transition suivante l'affiche instantanément.

---

## Ce qui n'est pas dans le scope

- Batch endpoint backend (charger plusieurs questions à la fois)
- Preload de tous les GIFs du Daily au chargement (agressif, consomme la bande passante)
- Cache applicatif (service worker, IndexedDB)
- Changements backend

---

## Fichiers modifiés

| Fichier | Changement |
|---|---|
| `frontend/app/quiz/play/page.tsx` | Prefetch prochaine question + GIF après chaque réponse |
| `frontend/app/quiz/daily/page.tsx` | Preload GIF N+1 à chaque affichage de question |
