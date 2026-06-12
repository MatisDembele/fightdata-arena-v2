'use client'

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'

const en = {
  // nav
  'nav.home': 'HOME',

  // home
  'home.subtitle':   'STREET FIGHTER 6 // FRAME DATA ENCYCLOPEDIA',
  'home.patch':      'PATCH JUNE 2026',
  'home.quiz_sub':   'Test your knowledge',
  'home.quiz_desc':  "Guess the startup, damage or on-block value of each move from its hitbox GIF.",
  'home.db_sub':     'Full frame data',
  'home.db_desc':    'Browse frame data for all SF6 characters. Startup, active, recovery and more.',
  'home.multi_sub':  'Challenge your friends',
  'home.multi_desc': 'Real-time frame data quiz against friends. Who knows SF6 best?',
  'home.daily_sub':  'One challenge a day',
  'home.daily_desc': 'Every day, 10 identical questions for everyone. Share your score with the community.',
  'home.stat_chars': 'CHARS',
  'home.stat_moves': 'MOVES',
  'home.stat_modes': 'MODES',

  // quiz mode picker
  'quiz.choose_mode':          'CHOOSE A MODE',
  'quiz.subtitle':             'STREET FIGHTER 6 // QUIZ — {n} MODES',
  'quiz.play':                 'PLAY →',
  'quiz.back':                 '← BACK',
  'quiz.choose_fighter':       'CHOOSE A FIGHTER',
  'quiz.search':               'SEARCH...',
  'quiz.loading':              'LOADING...',
  'quiz.mode_random_sub':      'MCQ — Full roster',
  'quiz.mode_random_desc':     'Multiple-choice questions across the full SF6 roster. The perfect mode to start.',
  'quiz.mode_fighter_sub':     'MCQ — Focus one fighter',
  'quiz.mode_fighter_desc':    'Pick a character and master their frame data in depth.',
  'quiz.mode_input_sub':       'Type the exact value',
  'quiz.mode_input_desc':      'No multiple choice — type the exact startup value yourself. Demanding mode.',
  'quiz.mode_punish_sub':      'Punishable or safe on block?',
  'quiz.mode_punish_desc':     'The fastest move in SF6 is 4 frames. A move at -4 or worse is punishable. Train yourself to spot punishable moves.',
  'quiz.mode_hardcore_sub':    '5s timer — Full roster',
  'quiz.mode_hardcore_desc':   'Answer in under 5 seconds. No skip. For true lab monsters.',
  'quiz.mode_survival_sub':    '1 mistake = over',
  'quiz.mode_survival_desc':   'One life. Answer correctly as long as you can — the first mistake ends your streak.',

  // quiz play
  'play.session_length':          'SESSION LENGTH',
  'play.questions_per_session':   'NUMBER OF QUESTIONS PER SESSION',
  'play.infinite_mode':           'INFINITE MODE — NO LIMIT',
  'play.n_questions':             '{n} QUESTIONS PER SESSION',
  'play.start':                   'START →',
  'play.change_mode':             '← CHANGE MODE',
  'play.final_rank':              'FINAL RANK',
  'play.replay':                  'REPLAY',
  'play.modes_btn':               'MODES',
  'play.share':                   'SHARE',
  'play.copied':                  '✓ COPIED!',
  'play.new_record':              '🏆 NEW RECORD!',
  'play.game_over':               '💀 GAME OVER',
  'play.survived_msg':            'You survived {n} question{s}',
  'play.survived_label':          'QUESTIONS SURVIVED',
  'play.best_record':             'PERSONAL BEST',
  'play.score_label':             'SCORE',
  'play.precision':               'ACCURACY',
  'play.combo_max':               'MAX COMBO',
  'play.infinite_label':          'INFINITE',
  'play.loading':                 'LOADING...',
  'play.hitbox_preview':          'HITBOX PREVIEW',
  'play.see_results':             'SEE RESULTS →',
  'play.skip':                    'SKIP →',
  'play.next_question':           'NEXT QUESTION →',
  'play.input_hint':              'TYPE THE EXACT VALUE IN FRAMES → ENTER',
  'play.pushback_note':           'EXCLUDING EXTREME PUSHBACK CASES',
  'play.score_combo':             'COMBO',
  'play.score_played':            'PLAYED',
  'play.mode_survival_label':     'SURVIVAL MODE',
  'play.q_what_is':               'What is the',
  'play.q_of':                    'of',
  'play.q_is_it_punishable':      'is',
  'play.q_punishable_on_block':   'punishable on block?',
  'play.punishable_label':        'PUNISHABLE',
  'play.safe_label':              'SAFE',
  'play.feedback_correct_startup':      '✓ Correct! Startup: {n} frames.',
  'play.feedback_wrong_startup_input':  '✗ Wrong! The answer was {n} frames (you entered: {v}).',
  'play.feedback_wrong_startup':        '✗ Wrong! Answer: {n} frames.',
  'play.feedback_timeout':              "⏱ Time's up! Answer: {n} frames.",
  'play.feedback_correct_punish':       '✓ Correct! {move} is {label} (on block: {value})',
  'play.feedback_wrong_punish':         '✗ Wrong! {move} is {label} (on block: {value})',
  'play.share_survival_line1':    'Fight Data Arena 🥊 — SURVIVAL Mode',
  'play.share_survival_line2':    'I survived {n} question{s} 💀',
  'play.share_survival_line3':    'Best: {best} questions',
  'play.share_score':             'Score: {score} ({accuracy}%) — Rank {rank}',
  'play.share_combo':             'Max combo: {combo}🔥',

  // daily
  'daily.one_per_day':     '10 QUESTIONS — ONE A DAY',
  'daily.intro_desc':      'Every day, 10 identical questions for all players. No skip — answer everything.',
  'daily.start':           'START →',
  'daily.home':            '← HOME',
  'daily.already_played':  'ALREADY PLAYED TODAY',
  'daily.copy_result':     'COPY RESULT',
  'daily.copied':          '✓ COPIED!',
  'daily.streak':          '{n}-DAY STREAK',
  'daily.loading':         'LOADING...',
  'daily.load_error':      'LOADING ERROR',
  'daily.retry':           'RETRY',
  'daily.feedback_correct': '✓ Correct! Startup: {n} frames.',
  'daily.feedback_wrong':   '✗ Wrong! Answer: {n} frames.',
  'daily.score':           'SCORE',
  'daily.question':        'QUESTION',
  'daily.correct':         'CORRECT',
  'daily.see_results':     'SEE RESULTS →',
  'daily.next_question':   'NEXT QUESTION →',

  // multiplayer lobby
  'multi.title':              'MULTIPLAYER',
  'multi.subtitle':           'REAL-TIME QUIZ — 5 QUESTIONS',
  'multi.your_name':          'YOUR USERNAME',
  'multi.room_code':          'ROOM CODE',
  'multi.game_mode':          'GAME MODE',
  'multi.create':             'CREATE',
  'multi.join':               'JOIN',
  'multi.create_room':        'CREATE ROOM',
  'multi.waking_server':      'WAKING SERVER...',
  'multi.creating':           'CREATING...',
  'multi.back':               '← BACK',
  'multi.err_name':           'Enter your username.',
  'multi.err_code':           'Enter a room code.',
  'multi.err_network':        'Network error.',
  'multi.choose_avatar':       'CHOOSE YOUR FIGHTER',
  'multi.mode_startup_sub':   'MCQ 4 choices',
  'multi.mode_startup_desc':  'Guess the startup of each move in 4 choices.',
  'multi.mode_punish_sub':    'Punishable or safe?',
  'multi.mode_punish_desc':   'Is the move punishable on block?',

  // multiplayer room
  'room.connecting':              'CONNECTING...',
  'room.give_code':               'SHARE THIS CODE WITH YOUR OPPONENT',
  'room.waiting':                 'WAITING FOR AN OPPONENT...',
  'room.both_answered':           'BOTH ANSWERED — RESULT...',
  'room.waiting_for':             'WAITING FOR {name}...',
  'room.opponent_answered':       '{name} ANSWERED!',
  'room.victory':                 'VICTORY',
  'room.defeat':                  'DEFEAT',
  'room.draw':                    'DRAW',
  'room.well_played':             'WELL PLAYED!',
  'room.better_luck':             'BETTER LUCK NEXT TIME',
  'room.draw_msg':                "IT'S A TIE!",
  'room.you':                     'YOU',
  'room.precision':               'ACCURACY',
  'room.questions_mode':          '{n} QUESTIONS — {mode} MODE',
  'room.replay':                  'PLAY AGAIN',
  'room.home':                    'HOME',
  'room.lobby':                   '← LOBBY',
  'room.opponent_left':           'Your opponent left the game.',
  'room.ws_failed':               'WebSocket connection failed.',
  'room.feedback_correct_startup':'✓ Correct! Startup: {answer} frames.',
  'room.feedback_wrong_startup':  '✗ Wrong! Answer: {answer} frames.',
  'room.q_what_is':               'What is the',
  'room.q_of':                    'of',
  'room.q_is_it':                 'is',
  'room.q_punishable_on_block':   'punishable on block?',
  'room.punishable_label':        'PUNISHABLE',
  'room.safe_label':              'SAFE',
  'room.on_block_prefix':         'on block: ',
  'room.feedback_correct_punish': '✓ Correct! {move} is {label}{ob}',
  'room.feedback_wrong_punish':   '✗ Wrong! {move} is {label}{ob}',

  // fighters
  'fighters.title':       'DATABASE',
  'fighters.coming_soon': 'COMING SOON',
} as const

type DictKey = keyof typeof en

const fr: Record<DictKey, string> = {
  // nav
  'nav.home': 'ACCUEIL',

  // home
  'home.subtitle':   'STREET FIGHTER 6 // FRAME DATA ENCYCLOPEDIA',
  'home.patch':      'PATCH JUIN 2026',
  'home.quiz_sub':   'Teste tes connaissances',
  'home.quiz_desc':  'Devine le startup, le damage ou le on-block de chaque move depuis son hitbox GIF.',
  'home.db_sub':     'Frame data complète',
  'home.db_desc':    'Accède aux données de frame de tous les personnages SF6. Startup, active, recovery et plus.',
  'home.multi_sub':  'Défie tes amis',
  'home.multi_desc': 'Affronte tes amis en quiz de frame data en temps réel. Qui connaît le mieux SF6 ?',
  'home.daily_sub':  'Un challenge par jour',
  'home.daily_desc': 'Chaque jour, 10 questions identiques pour tous. Partage ton score avec la communauté.',
  'home.stat_chars': 'PERSOS',
  'home.stat_moves': 'MOVES',
  'home.stat_modes': 'MODES',

  // quiz mode picker
  'quiz.choose_mode':          'CHOISIR UN MODE',
  'quiz.subtitle':             'STREET FIGHTER 6 // QUIZ — {n} MODES',
  'quiz.play':                 'JOUER →',
  'quiz.back':                 '← RETOUR',
  'quiz.choose_fighter':       'CHOISIR UN PERSONNAGE',
  'quiz.search':               'RECHERCHER...',
  'quiz.loading':              'CHARGEMENT...',
  'quiz.mode_random_sub':      'QCM — Tous les persos',
  'quiz.mode_random_desc':     'Questions à choix multiples sur tout le roster SF6. Le mode parfait pour débuter.',
  'quiz.mode_fighter_sub':     'QCM — Focus un perso',
  'quiz.mode_fighter_desc':    'Choisis un personnage et maîtrise ses frames en profondeur.',
  'quiz.mode_input_sub':       'Frappe la valeur exacte',
  'quiz.mode_input_desc':      'Pas de choix multiples — tu dois taper toi-même la valeur exacte du startup. Mode exigeant.',
  'quiz.mode_punish_sub':      'Punissable ou safe on block ?',
  'quiz.mode_punish_desc':     "Le move le plus rapide en SF6 est 4 frames. Un move à -4 ou pire est punissable. Entraîne-toi à reconnaître les moves qui se punissent.",
  'quiz.mode_hardcore_sub':    'Timer 5s — Tous les persos',
  'quiz.mode_hardcore_desc':   'Réponds en moins de 5 secondes. Pas de passe. Pour les vrais lab monsters.',
  'quiz.mode_survival_sub':    '1 erreur = fin',
  'quiz.mode_survival_desc':   "Une seule vie. Réponds correctement le plus longtemps possible — la première erreur met fin à ta série.",

  // quiz play
  'play.session_length':        'LONGUEUR DE SESSION',
  'play.questions_per_session': 'NOMBRE DE QUESTIONS PAR PARTIE',
  'play.infinite_mode':         'MODE INFINI — AUCUNE LIMITE',
  'play.n_questions':           '{n} QUESTIONS PAR SESSION',
  'play.start':                 'COMMENCER →',
  'play.change_mode':           '← CHANGER DE MODE',
  'play.final_rank':            'RANG FINAL',
  'play.replay':                'REJOUER',
  'play.modes_btn':             'MODES',
  'play.share':                 'PARTAGER',
  'play.copied':                '✓ COPIÉ !',
  'play.new_record':            '🏆 NOUVEAU RECORD !',
  'play.game_over':             '💀 GAME OVER',
  'play.survived_msg':          'Tu as survécu {n} question{s}',
  'play.survived_label':        'QUESTIONS SURVÉCUES',
  'play.best_record':           'RECORD PERSO',
  'play.score_label':           'SCORE',
  'play.precision':             'PRÉCISION',
  'play.combo_max':             'COMBO MAX',
  'play.infinite_label':        'INFINI',
  'play.loading':               'CHARGEMENT...',
  'play.hitbox_preview':        'HITBOX PREVIEW',
  'play.see_results':           'VOIR LES RÉSULTATS →',
  'play.skip':                  'PASSER →',
  'play.next_question':         'QUESTION SUIVANTE →',
  'play.input_hint':            'TAPE LA VALEUR EXACTE EN FRAMES → ENTRÉE',
  'play.pushback_note':         'HORS CAS DE PUSHBACK EXTRÊME',
  'play.score_combo':           'COMBO',
  'play.score_played':          'JOUÉS',
  'play.mode_survival_label':   'MODE SURVIE',
  'play.q_what_is':             'Quel est le',
  'play.q_of':                  'de',
  'play.q_is_it_punishable':    'est-il',
  'play.q_punishable_on_block': 'punissable on block ?',
  'play.punishable_label':      'PUNISSABLE',
  'play.safe_label':            'SAFE',
  'play.feedback_correct_startup':      '✓ Exact ! Startup : {n} frames.',
  'play.feedback_wrong_startup_input':  '✗ Raté ! La réponse était {n} frames (tu as mis : {v}).',
  'play.feedback_wrong_startup':        '✗ Raté ! Réponse : {n} frames.',
  'play.feedback_timeout':              '⏱ Temps écoulé ! Réponse : {n} frames.',
  'play.feedback_correct_punish':       '✓ Correct ! {move} est {label} (on block : {value})',
  'play.feedback_wrong_punish':         '✗ Raté ! {move} est {label} (on block : {value})',
  'play.share_survival_line1':  'Fight Data Arena 🥊 — Mode SURVIE',
  'play.share_survival_line2':  "J'ai survécu {n} question{s} 💀",
  'play.share_survival_line3':  'Record : {best} questions',
  'play.share_score':           'Score : {score} ({accuracy}%) — Rang {rank}',
  'play.share_combo':           'Combo max : {combo}🔥',

  // daily
  'daily.one_per_day':     '10 QUESTIONS — UN PAR JOUR',
  'daily.intro_desc':      'Chaque jour, 10 questions identiques pour tous les joueurs. Pas de skip — réponds à tout.',
  'daily.start':           'COMMENCER →',
  'daily.home':            '← ACCUEIL',
  'daily.already_played':  "DÉJÀ JOUÉ AUJOURD'HUI",
  'daily.copy_result':     'COPIER LE RÉSULTAT',
  'daily.copied':          '✓ COPIÉ !',
  'daily.streak':          'STREAK : {n} JOURS',
  'daily.loading':         'CHARGEMENT...',
  'daily.load_error':      'ERREUR DE CHARGEMENT',
  'daily.retry':           'RÉESSAYER',
  'daily.feedback_correct': '✓ Correct ! Startup : {n} frames.',
  'daily.feedback_wrong':   '✗ Raté ! Réponse : {n} frames.',
  'daily.score':           'SCORE',
  'daily.question':        'QUESTION',
  'daily.correct':         'CORRECT',
  'daily.see_results':     'VOIR LES RÉSULTATS →',
  'daily.next_question':   'QUESTION SUIVANTE →',

  // multiplayer lobby
  'multi.title':             'MULTIJOUEUR',
  'multi.subtitle':          'QUIZ EN TEMPS RÉEL — 5 QUESTIONS',
  'multi.your_name':         'TON PSEUDO',
  'multi.room_code':         'CODE DE ROOM',
  'multi.game_mode':         'MODE DE JEU',
  'multi.create':            'CRÉER',
  'multi.join':              'REJOINDRE',
  'multi.create_room':       'CRÉER LA ROOM',
  'multi.waking_server':     'RÉVEIL DU SERVEUR...',
  'multi.creating':          'CRÉATION...',
  'multi.back':              '← RETOUR',
  'multi.err_name':          'Entre ton pseudo.',
  'multi.err_code':          'Entre un code de room.',
  'multi.err_network':       'Erreur réseau.',
  'multi.choose_avatar':      'CHOISIS TON PERSONNAGE',
  'multi.mode_startup_sub':  'QCM 4 choix',
  'multi.mode_startup_desc': 'Devine le startup de chaque move en 4 choix.',
  'multi.mode_punish_sub':   'Punissable ou safe ?',
  'multi.mode_punish_desc':  'Le move est-il punissable on block ?',

  // multiplayer room
  'room.connecting':              'CONNEXION...',
  'room.give_code':               'DONNE CE CODE À TON ADVERSAIRE',
  'room.waiting':                 "EN ATTENTE D'UN ADVERSAIRE...",
  'room.both_answered':           'LES DEUX ONT RÉPONDU — RÉSULTAT...',
  'room.waiting_for':             'EN ATTENTE DE {name}...',
  'room.opponent_answered':       '{name} A RÉPONDU !',
  'room.victory':                 'VICTOIRE',
  'room.defeat':                  'DÉFAITE',
  'room.draw':                    'ÉGALITÉ',
  'room.well_played':             'BIEN JOUÉ !',
  'room.better_luck':             'MEILLEURE CHANCE LA PROCHAINE FOIS',
  'room.draw_msg':                'MATCH NUL !',
  'room.you':                     'TOI',
  'room.precision':               'PRÉCISION',
  'room.questions_mode':          '{n} QUESTIONS — MODE {mode}',
  'room.replay':                  'REJOUER',
  'room.home':                    'ACCUEIL',
  'room.lobby':                   '← LOBBY',
  'room.opponent_left':           'Ton adversaire a quitté la partie.',
  'room.ws_failed':               'Connexion WebSocket échouée.',
  'room.feedback_correct_startup':'✓ Correct ! Startup : {answer} frames.',
  'room.feedback_wrong_startup':  '✗ Raté ! Réponse : {answer} frames.',
  'room.q_what_is':               'Quel est le',
  'room.q_of':                    'de',
  'room.q_is_it':                 'est-il',
  'room.q_punishable_on_block':   'punissable on block ?',
  'room.punishable_label':        'PUNISSABLE',
  'room.safe_label':              'SAFE',
  'room.on_block_prefix':         'on block : ',
  'room.feedback_correct_punish': '✓ Correct ! {move} est {label}{ob}',
  'room.feedback_wrong_punish':   '✗ Raté ! {move} est {label}{ob}',

  // fighters
  'fighters.title':       'BASE DE DONNÉES',
  'fighters.coming_soon': 'COMING SOON',
}

const dict: Record<string, Record<DictKey, string>> = { en, fr }

export type { DictKey }
export type Lang = 'en' | 'fr'

interface LanguageContextValue {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: DictKey, vars?: Record<string, string | number>) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

function getInitialLang(): Lang {
  if (typeof window === 'undefined') return 'en'
  const stored = localStorage.getItem('fda_lang')
  if (stored === 'en' || stored === 'fr') return stored as Lang
  return 'en'
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en')

  useEffect(() => { setLangState(getInitialLang()) }, [])

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    localStorage.setItem('fda_lang', l)
  }, [])

  const t = useCallback((key: DictKey, vars?: Record<string, string | number>): string => {
    let str: string = dict[lang]?.[key] ?? dict.en[key] ?? key
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
      }
    }
    return str
  }, [lang])

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider')
  return ctx
}
