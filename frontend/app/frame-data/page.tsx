'use client'
export const dynamic = 'force-static'
import { useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { useLanguage } from '@/lib/i18n'

type Lang = 'en' | 'fr' | 'es' | 'ja'

const ACCENT = '#c084fc'
// SF6's in-game frame-meter colour code: startup = green, active = pink/magenta, recovery = blue.
const COL = { startup: '#46c24e', active: '#e6368c', recovery: '#2d8ce0', plus: '#46c24e', minus: '#ff2d78' }

interface Content {
  read_time: string
  hook: string
  promise: string
  show_answer: string
  qc_label: string

  s1_t: string; s1_lead: string; s1_analogy: string; s1_body: string
  fps_l: string; ms_l: string
  qc1_q: string; qc1_a: string

  s2_t: string; s2_lead: string; s2_analogy: string
  startup_b: string; active_b: string; recovery_b: string
  caption: string; total_note: string
  qc2_q: string; qc2_a: string

  s3_t: string; s3_lead: string
  plus_t: string; plus_b: string; minus_t: string; minus_b: string
  s3_key: string
  qc3_q: string; qc3_a: string

  s4_t: string; s4_lead: string; s4_rule: string
  lab_t: string; lab_their: string; lab_your: string
  lab_yes_t: string; lab_yes_d: string; lab_no_t: string; lab_no_d: string

  cs_t: string; cs1: string; cs2: string; cs3: string; cs4: string
  cta_t: string; cta_btn: string; db_btn: string
}

const CONTENT: Record<Lang, Content> = {
  en: {
    read_time: '5 min read · 4 chapters',
    hook: 'You block their attack, press a button, and eat a counter-hit. Felt random? It wasn’t. The game told you exactly what would happen — in a language called frame data.',
    promise: 'Learn to read it and you stop guessing: you’ll know when it’s safe to press, when to hold back, and when a blocked move is free damage. Five minutes. Let’s go.',
    show_answer: 'Show answer',
    qc_label: 'QUICK CHECK',
    s1_t: 'The frame — the atom of the game',
    s1_lead: 'Before anything else, one unit rules them all.',
    s1_analogy: 'Picture a match as a flipbook: 60 drawings flashed every second. Each drawing is one frame. Nothing in the game is faster than a single frame.',
    s1_body: 'Every action — a jab, a block, a dash — lasts a whole number of frames. Frame data is just the length of each part of a move, counted in frames. That’s the entire secret.',
    fps_l: 'frames per second', ms_l: 'one frame',
    qc1_q: 'If the game runs at 60 frames per second, how long is a single frame?',
    qc1_a: 'About 1/60 of a second ≈ 17 milliseconds — faster than you can blink, yet the game counts every single one.',
    s2_t: 'Anatomy of a move — 3 phases',
    s2_lead: 'Every attack tells the same 3-act story.',
    s2_analogy: 'Throw a real punch: you wind up, your fist connects, then you pull your arm back. A move in SF6 is identical — startup, active, recovery.',
    startup_b: 'The wind-up before the hit comes out. “5f startup” = 5 frames before it can touch. Fewer frames = faster move, harder to react to.',
    active_b: 'The only frames where the hitbox is live and can actually hit. Miss this window and the move whiffs.',
    recovery_b: 'The cool-down afterwards — you’re frozen and wide open. Whiff here and you get punished.',
    caption: 'Read it like the in-game frame meter: green → pink → blue.',
    total_note: 'Total = startup + active + recovery',
    qc2_q: 'You throw a move and it misses. During which phase are you most likely to get hit?',
    qc2_a: 'Recovery. The hitbox is gone but you still can’t move — the perfect moment for your opponent to strike.',
    s3_t: 'Frame advantage — whose turn is it?',
    s3_lead: 'This is the concept that wins rounds.',
    plus_t: 'PLUS (+) — your turn',
    plus_b: 'After a +2 move you recover 2 frames before your opponent. Press again, throw, keep the pressure — you act first.',
    minus_t: 'MINUS (−) — their turn',
    minus_b: 'After a −4 move they recover 4 frames before you. Stop pressing. Block, or you walk into a counter.',
    s3_key: 'The rule to tattoo on your brain: PLUS = keep going. MINUS = let go.',
    qc3_q: 'Your move is −3 on block. Should you press another button right after?',
    qc3_a: 'No. −3 means your opponent acts 3 frames before you. Pressing = getting counter-hit. Block and wait for your turn.',
    s4_t: 'The punish — turn knowledge into damage',
    s4_lead: 'Everything so far leads here.',
    s4_rule: 'If their blocked move is −X, you can punish it with any move whose startup is ≤ X.',
    lab_t: 'Try it — the punish lab',
    lab_their: 'Their move on block',
    lab_your: 'Your fastest move',
    lab_yes_t: 'PUNISH ✓',
    lab_yes_d: 'Your move lands before they recover. Free damage — take it every time.',
    lab_no_t: 'TOO SLOW ✗',
    lab_no_d: 'They recover first. The move is safe against you — don’t press, it’s their turn.',
    cs_t: 'The cheat sheet — keep this',
    cs1: 'Everything is measured in frames (60 per second).',
    cs2: 'Every move = startup · active · recovery.',
    cs3: 'On block: PLUS = your turn, MINUS = their turn.',
    cs4: 'Blocked move at −X? Punish it with a move that starts in ≤ X frames.',
    cta_t: 'That’s frame data. Now burn it into muscle memory.',
    cta_btn: 'Train on the quiz →',
    db_btn: 'Full frame data ↗',
  },
  fr: {
    read_time: '5 min de lecture · 4 chapitres',
    hook: 'Tu blocks son attaque, tu appuies sur un bouton, et tu manges un contre. Ça t’a paru aléatoire ? Ça ne l’était pas. Le jeu t’avait dit exactement ce qui allait se passer — dans une langue qui s’appelle la frame data.',
    promise: 'Apprends à la lire et tu arrêtes de deviner : tu sauras quand tu peux appuyer, quand te taire, et quand un coup gardé est un cadeau de dégâts. Cinq minutes. C’est parti.',
    show_answer: 'Voir la réponse',
    qc_label: 'À TOI',
    s1_t: 'La frame — l’atome du jeu',
    s1_lead: 'Avant tout, une seule unité règne.',
    s1_analogy: 'Imagine un match comme un flipbook : 60 dessins défilent chaque seconde. Chaque dessin, c’est une frame. Rien dans le jeu n’est plus rapide qu’une seule frame.',
    s1_body: 'Chaque action — un jab, une garde, un dash — dure un nombre entier de frames. La frame data, c’est juste la durée de chaque partie d’un coup, comptée en frames. C’est tout le secret.',
    fps_l: 'frames par seconde', ms_l: 'une frame',
    qc1_q: 'Si le jeu tourne à 60 frames par seconde, combien de temps dure une seule frame ?',
    qc1_a: 'Environ 1/60 de seconde ≈ 17 millisecondes — plus rapide qu’un clignement d’œil, et pourtant le jeu les compte toutes.',
    s2_t: 'Anatomie d’un coup — 3 phases',
    s2_lead: 'Chaque attaque raconte la même histoire en 3 actes.',
    s2_analogy: 'Lance un vrai coup de poing : tu armes, ton poing touche, puis tu ramènes ton bras. Un coup dans SF6, c’est pareil — startup, active, recovery.',
    startup_b: 'L’armement avant que le coup sorte. « 5f de startup » = 5 frames avant qu’il puisse toucher. Moins de frames = coup plus rapide, plus dur à anticiper.',
    active_b: 'Les seules frames où la hitbox est active et peut réellement toucher. Rate cette fenêtre et le coup passe dans le vide.',
    recovery_b: 'La récupération juste après — tu es figé et grand ouvert. Frappe dans le vide ici et tu te fais punir.',
    caption: 'Lis-le comme le frame meter en jeu : vert → rose → bleu.',
    total_note: 'Total = startup + active + recovery',
    qc2_q: 'Tu lances un coup et il passe dans le vide. Pendant quelle phase risques-tu le plus de te faire toucher ?',
    qc2_a: 'La recovery. La hitbox a disparu mais tu ne peux toujours pas bouger — le moment parfait pour que l’adversaire frappe.',
    s3_t: 'L’avantage frame — à qui le tour ?',
    s3_lead: 'Le concept qui gagne des rounds.',
    plus_t: 'PLUS (+) — ton tour',
    plus_b: 'Après un coup à +2, tu récupères 2 frames avant l’adversaire. Réappuie, choppe, continue la pression — tu agis en premier.',
    minus_t: 'MOINS (−) — son tour',
    minus_b: 'Après un coup à −4, il récupère 4 frames avant toi. Arrête d’appuyer. Garde, sinon tu fonces dans un contre.',
    s3_key: 'La règle à te tatouer : PLUS = tu continues. MOINS = tu lâches.',
    qc3_q: 'Ton coup est à −3 sur garde. Tu réappuies sur un bouton juste après ?',
    qc3_a: 'Non. −3 veut dire que l’adversaire agit 3 frames avant toi. Appuyer = te faire contrer. Garde et attends ton tour.',
    s4_t: 'Le punish — transformer le savoir en dégâts',
    s4_lead: 'Tout ce qui précède mène ici.',
    s4_rule: 'Si son coup gardé est à −X, tu peux le punir avec n’importe quel coup dont le startup est ≤ X.',
    lab_t: 'À toi — le labo du punish',
    lab_their: 'Son coup sur garde',
    lab_your: 'Ton coup le plus rapide',
    lab_yes_t: 'PUNITION ✓',
    lab_yes_d: 'Ton coup touche avant qu’il récupère. Dégâts gratuits — prends-les à chaque fois.',
    lab_no_t: 'TROP LENT ✗',
    lab_no_d: 'Il récupère en premier. Le coup est safe contre toi — n’appuie pas, c’est son tour.',
    cs_t: 'L’antisèche — garde ça',
    cs1: 'Tout se mesure en frames (60 par seconde).',
    cs2: 'Chaque coup = startup · active · recovery.',
    cs3: 'Sur garde : PLUS = ton tour, MOINS = son tour.',
    cs4: 'Coup gardé à −X ? Punis-le avec un coup qui sort en ≤ X frames.',
    cta_t: 'Ça, c’est la frame data. Maintenant grave-la dans tes réflexes.',
    cta_btn: 'S’entraîner sur le quiz →',
    db_btn: 'Frame data complète ↗',
  },
  es: {
    read_time: '5 min de lectura · 4 capítulos',
    hook: 'Bloqueas su ataque, pulsas un botón y comes un contra. ¿Te pareció aleatorio? No lo era. El juego te dijo exactamente lo que iba a pasar — en un idioma llamado frame data.',
    promise: 'Aprende a leerla y dejas de adivinar: sabrás cuándo puedes pulsar, cuándo callarte y cuándo un movimiento bloqueado es daño gratis. Cinco minutos. Vamos.',
    show_answer: 'Ver la respuesta',
    qc_label: 'TU TURNO',
    s1_t: 'El frame — el átomo del juego',
    s1_lead: 'Antes que nada, una unidad lo gobierna todo.',
    s1_analogy: 'Imagina un combate como un flipbook: 60 dibujos por segundo. Cada dibujo es un frame. Nada en el juego es más rápido que un solo frame.',
    s1_body: 'Cada acción — un jab, una guardia, un dash — dura un número entero de frames. La frame data es solo la duración de cada parte de un movimiento, contada en frames. Ese es todo el secreto.',
    fps_l: 'frames por segundo', ms_l: 'un frame',
    qc1_q: 'Si el juego corre a 60 frames por segundo, ¿cuánto dura un solo frame?',
    qc1_a: 'Alrededor de 1/60 de segundo ≈ 17 milisegundos — más rápido que un parpadeo, y aun así el juego los cuenta todos.',
    s2_t: 'Anatomía de un movimiento — 3 fases',
    s2_lead: 'Cada ataque cuenta la misma historia en 3 actos.',
    s2_analogy: 'Lanza un puñetazo real: cargas, tu puño impacta, y luego retiras el brazo. Un movimiento en SF6 es idéntico — startup, active, recovery.',
    startup_b: 'La preparación antes de que salga el golpe. «5f de startup» = 5 frames antes de poder tocar. Menos frames = más rápido, más difícil de reaccionar.',
    active_b: 'Los únicos frames donde la hitbox está activa y puede impactar. Falla esa ventana y el golpe pasa en vano.',
    recovery_b: 'La recuperación posterior — estás congelado y expuesto. Falla aquí y te castigan.',
    caption: 'Léelo como el frame meter del juego: verde → rosa → azul.',
    total_note: 'Total = startup + active + recovery',
    qc2_q: 'Lanzas un movimiento y falla. ¿En qué fase es más probable que te golpeen?',
    qc2_a: 'La recovery. La hitbox ya no está pero aún no puedes moverte — el momento perfecto para que el rival ataque.',
    s3_t: 'Ventaja de frames — ¿de quién es el turno?',
    s3_lead: 'El concepto que gana rounds.',
    plus_t: 'MÁS (+) — tu turno',
    plus_b: 'Tras un movimiento a +2 te recuperas 2 frames antes que el rival. Pulsa otra vez, agarra, mantén la presión — actúas primero.',
    minus_t: 'MENOS (−) — su turno',
    minus_b: 'Tras un movimiento a −4 él se recupera 4 frames antes que tú. Deja de pulsar. Guarda, o caerás en un contra.',
    s3_key: 'La regla para tatuarte: MÁS = sigue. MENOS = suelta.',
    qc3_q: 'Tu movimiento es −3 al guardar. ¿Pulsas otro botón justo después?',
    qc3_a: 'No. −3 significa que el rival actúa 3 frames antes que tú. Pulsar = comer un contra. Guarda y espera tu turno.',
    s4_t: 'El castigo — convierte el saber en daño',
    s4_lead: 'Todo lo anterior lleva aquí.',
    s4_rule: 'Si su movimiento bloqueado es −X, puedes castigarlo con cualquier movimiento cuyo startup sea ≤ X.',
    lab_t: 'Pruébalo — el laboratorio del castigo',
    lab_their: 'Su movimiento al guardar',
    lab_your: 'Tu movimiento más rápido',
    lab_yes_t: 'CASTIGO ✓',
    lab_yes_d: 'Tu movimiento impacta antes de que se recupere. Daño gratis — tómalo siempre.',
    lab_no_t: 'DEMASIADO LENTO ✗',
    lab_no_d: 'Él se recupera primero. El movimiento es seguro contra ti — no pulses, es su turno.',
    cs_t: 'La chuleta — guárdala',
    cs1: 'Todo se mide en frames (60 por segundo).',
    cs2: 'Cada movimiento = startup · active · recovery.',
    cs3: 'Al guardar: MÁS = tu turno, MENOS = su turno.',
    cs4: '¿Movimiento bloqueado a −X? Castígalo con un movimiento que salga en ≤ X frames.',
    cta_t: 'Eso es la frame data. Ahora grábala en tu memoria muscular.',
    cta_btn: 'Entrena en el quiz →',
    db_btn: 'Frame data completa ↗',
  },
  ja: {
    read_time: '5分で読める · 全4章',
    hook: '相手の攻撃をガードしてボタンを押したら、カウンターを食らった。理不尽に感じた？違う。何が起こるか、ゲームは正確に教えてくれていた——「フレームデータ」という言語で。',
    promise: 'これを読めるようになれば、当て勘は卒業。いつ押していいか、いつ我慢すべきか、ガードした技がいつ「タダ取り」になるかが分かる。5分でいこう。',
    show_answer: '答えを見る',
    qc_label: 'やってみよう',
    s1_t: 'フレーム — ゲームの最小単位',
    s1_lead: 'まず、すべてを支配する単位がひとつ。',
    s1_analogy: '試合をパラパラ漫画だと思ってほしい。1秒に60枚の絵が流れる。その1枚が「1フレーム」。ゲーム内で1フレームより速いものは存在しない。',
    s1_body: 'あらゆる行動——ジャブ、ガード、ダッシュ——は整数フレームぶん続く。フレームデータとは、技の各部分の長さをフレームで数えたもの。それがすべての秘密。',
    fps_l: 'フレーム／秒', ms_l: '1フレーム',
    qc1_q: 'ゲームが60フレーム／秒なら、1フレームはどれくらいの長さ？',
    qc1_a: '約1/60秒 ≈ 17ミリ秒——まばたきより速い。それでもゲームは一つ残らず数えている。',
    s2_t: '技の解剖 — 3つの段階',
    s2_lead: 'どの攻撃も同じ「3幕」の物語。',
    s2_analogy: '実際にパンチを打つと：振りかぶり、拳が当たり、腕を戻す。SF6の技も同じ——発生・持続・硬直。',
    startup_b: '技が出るまでの振りかぶり。「発生5F」=当たるまで5フレーム。フレームが少ない＝速い＝反応されにくい。',
    active_b: 'ヒットボックスが出て実際に当たる唯一のフレーム。この窓を外すと空振り。',
    recovery_b: 'その後の硬直——固まって無防備。空振りするとここを狩られる。',
    caption: 'ゲームのフレームメーターと同じ読み方：緑 → 桃 → 青。',
    total_note: '全体 = 発生 + 持続 + 硬直',
    qc2_q: '技を出して空振りした。最も被弾しやすいのはどの段階？',
    qc2_a: '硬直（recovery）。判定は消えたのにまだ動けない——相手が狙う絶好のタイミング。',
    s3_t: 'フレーム有利 — ターンは誰のもの？',
    s3_lead: 'ラウンドを取る核心の概念。',
    plus_t: 'プラス (+) — 自分のターン',
    plus_b: '+2の技の後、相手より2フレーム早く動ける。もう一度押す、投げる、攻めを継続——先に動けるのは自分。',
    minus_t: 'マイナス (−) — 相手のターン',
    minus_b: '−4の技の後、相手が4フレーム早く動ける。押すのをやめる。ガードしないとカウンターに突っ込む。',
    s3_key: '刻むべきルール：プラス＝続ける。マイナス＝引く。',
    qc3_q: '自分の技がガード時−3。直後にもう一度ボタンを押す？',
    qc3_a: 'ダメ。−3は相手が3フレーム早く動ける意味。押す＝カウンター確定。ガードしてターンを待とう。',
    s4_t: '確定反撃 — 知識をダメージに変える',
    s4_lead: 'ここまでの全部がここに繋がる。',
    s4_rule: 'ガードした技が−Xなら、発生がX以下の技で確定反撃できる。',
    lab_t: '試そう — パニッシュ・ラボ',
    lab_their: '相手の技（ガード時）',
    lab_your: '自分の最速技',
    lab_yes_t: '確定反撃 ✓',
    lab_yes_d: '相手が硬直から戻る前に当たる。タダ取りのダメージ——毎回取ろう。',
    lab_no_t: '遅すぎる ✗',
    lab_no_d: '相手が先に戻る。その技は自分には安全——押さない、相手のターン。',
    cs_t: 'チートシート — これを覚えて',
    cs1: 'すべてはフレームで測る（1秒60フレーム）。',
    cs2: 'どの技も = 発生 · 持続 · 硬直。',
    cs3: 'ガード時：プラス＝自分のターン、マイナス＝相手のターン。',
    cs4: 'ガードした技が−X？ 発生X以下の技で反撃。',
    cta_t: 'これがフレームデータ。あとは体に刻み込もう。',
    cta_btn: 'クイズで練習する →',
    db_btn: 'フレームデータ一覧 ↗',
  },
}

const card: React.CSSProperties = {
  background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.08)',
  padding: 'clamp(20px, 4vw, 32px)',
}
const lead: React.CSSProperties = {
  fontFamily: "'Rajdhani', sans-serif", fontSize: 'clamp(1.05rem, 2.2vw, 1.25rem)', fontWeight: 600,
  lineHeight: 1.5, color: '#fff', margin: 0,
}
const body: React.CSSProperties = {
  fontFamily: "'Rajdhani', sans-serif", fontSize: '1.05rem', fontWeight: 500,
  lineHeight: 1.6, color: 'rgba(255,255,255,0.75)', margin: 0,
}

function SectionHead({ n, title }: { n: string; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px' }}>
      <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(1.4rem, 3vw, 1.9rem)', letterSpacing: '2px', color: ACCENT, textShadow: `0 0 14px ${ACCENT}66`, flexShrink: 0 }}>{n}</span>
      <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', letterSpacing: '3px', color: '#fff', margin: 0 }}>{title}</h2>
    </div>
  )
}

function Callout({ children, color = ACCENT, icon }: { children: React.ReactNode; color?: string; icon?: string }) {
  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', background: `${color}12`, borderLeft: `3px solid ${color}`, padding: '14px 16px' }}>
      {icon && <span style={{ fontSize: '1.25rem', flexShrink: 0, lineHeight: 1.2 }} aria-hidden>{icon}</span>}
      <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '1.05rem', fontWeight: 500, lineHeight: 1.55, color: 'rgba(255,255,255,0.9)', margin: 0 }}>{children}</p>
    </div>
  )
}

function Phase({ name, frames, color, text }: { name: string; frames: string; color: string; text: string }) {
  return (
    <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
      <div style={{ flexShrink: 0, width: '8px', alignSelf: 'stretch', background: color, boxShadow: `0 0 10px ${color}` }} />
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.4rem', letterSpacing: '3px', color, textShadow: `0 0 12px ${color}66` }}>{name}</span>
          <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-2xs)', letterSpacing: '2px', color: 'rgba(255,255,255,0.7)' }}>{frames}</span>
        </div>
        <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '1rem', fontWeight: 500, lineHeight: 1.55, color: 'rgba(255,255,255,0.72)', marginTop: '4px' }}>{text}</p>
      </div>
    </div>
  )
}

// Active-recall card: question now, answer on demand.
function QuickCheck({ q, a, label, show }: { q: string; a: string; label: string; show: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ border: `1px solid ${ACCENT}40`, background: `${ACCENT}0d`, padding: '16px 18px' }}>
      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-2xs)', letterSpacing: 'var(--ls-3)', color: ACCENT, marginBottom: '8px' }}>◆ {label}</div>
      <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '1.08rem', fontWeight: 600, color: '#fff', lineHeight: 1.45, margin: 0 }}>{q}</p>
      {open ? (
        <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '1rem', fontWeight: 500, color: '#bff0c8', lineHeight: 1.55, margin: '12px 0 0', paddingLeft: '12px', borderLeft: `2px solid ${COL.startup}` }}>{a}</p>
      ) : (
        <button
          onClick={() => setOpen(true)}
          style={{ marginTop: '12px', background: 'none', border: `1px solid ${ACCENT}66`, color: ACCENT, cursor: 'pointer', padding: '7px 16px', fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-2)', transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.background = `${ACCENT}1a` }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
        >{show} ↓</button>
      )}
    </div>
  )
}

// Interactive punisher: pick their on-block value + your fastest move, get the verdict.
function PunishLab({ c }: { c: Content }) {
  const [onBlock, setOnBlock] = useState(-6)
  const [startup, setStartup] = useState(5)
  const dis = -onBlock
  const ok = startup <= dis
  const vCol = ok ? COL.startup : COL.minus

  const pill = (active: boolean): React.CSSProperties => ({
    padding: '8px 14px', cursor: 'pointer', transition: 'all 0.15s',
    fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: '1px',
    background: active ? `${ACCENT}26` : 'rgba(255,255,255,0.04)',
    border: `1px solid ${active ? ACCENT : 'rgba(255,255,255,0.1)'}`,
    color: active ? '#fff' : 'rgba(255,255,255,0.7)',
  })

  return (
    <div style={{ ...card }}>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.3rem', letterSpacing: '3px', color: '#fff', marginBottom: '18px' }}>{c.lab_t}</div>

      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-2)', color: 'rgba(255,255,255,0.65)', marginBottom: '8px' }}>{c.lab_their}</div>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '18px' }}>
        {[-2, -4, -6, -8, -10].map(v => (
          <button key={v} onClick={() => setOnBlock(v)} style={pill(onBlock === v)}>{v}</button>
        ))}
      </div>

      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-2)', color: 'rgba(255,255,255,0.65)', marginBottom: '8px' }}>{c.lab_your}</div>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {[4, 5, 6, 7, 8].map(v => (
          <button key={v} onClick={() => setStartup(v)} style={pill(startup === v)}>{v}F</button>
        ))}
      </div>

      <div style={{ background: `${vCol}14`, border: `1px solid ${vCol}66`, padding: '16px 18px', textAlign: 'center', transition: 'all 0.2s' }}>
        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-sm)', letterSpacing: '1px', color: 'rgba(255,255,255,0.7)' }}>
          {startup}F {ok ? '≤' : '>'} {dis}F
        </div>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(1.6rem, 5vw, 2.2rem)', letterSpacing: '3px', color: vCol, textShadow: `0 0 16px ${vCol}66`, margin: '6px 0 8px' }}>
          {ok ? c.lab_yes_t : c.lab_no_t}
        </div>
        <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '1rem', fontWeight: 500, lineHeight: 1.5, color: 'rgba(255,255,255,0.8)', maxWidth: '420px', margin: '0 auto' }}>
          {ok ? c.lab_yes_d : c.lab_no_d}
        </div>
      </div>
    </div>
  )
}

export default function FrameDataPage() {
  const { lang } = useLanguage()
  const c = CONTENT[(['en', 'fr', 'es', 'ja'].includes(lang) ? lang : 'en') as Lang]

  // Frame meter example: 5f startup · 3f active · 12f recovery
  const TL = [
    { label: 'STARTUP', f: 5, color: COL.startup },
    { label: 'ACTIVE', f: 3, color: COL.active },
    { label: 'RECOVERY', f: 12, color: COL.recovery },
  ]
  const totalF = TL.reduce((a, b) => a + b.f, 0)
  const cells = TL.flatMap(b => Array<string>(b.f).fill(b.color))

  return (
    <>
      <Navbar />
      <main style={{ position: 'relative', minHeight: 'calc(100vh - 60px)', overflow: 'hidden', padding: 'clamp(32px, 6vh, 64px) 20px 0' }}>
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          background: `
            radial-gradient(ellipse 80% 60% at 50% 0%, ${ACCENT}1f 0%, transparent 60%),
            radial-gradient(ellipse 70% 60% at 12% 40%, #7c3aed26 0%, transparent 55%),
            linear-gradient(160deg, #0d0010 0%, #14001f 60%, #0d0015 100%)`,
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '760px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'clamp(36px, 7vh, 60px)', paddingBottom: '80px' }}>

          {/* Hero */}
          <header className="animate-fadeInUp" style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-4)', color: ACCENT, marginBottom: '12px' }}>
              {c.read_time}
            </div>
            <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(2.6rem, 8vw, 4.5rem)', letterSpacing: '6px', lineHeight: 1, color: '#fff', textShadow: `0 0 14px ${ACCENT}, 0 0 38px ${ACCENT}66` }}>FRAME DATA</h1>
            <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 'clamp(1.05rem, 2.2vw, 1.3rem)', fontWeight: 600, lineHeight: 1.55, color: '#fff', maxWidth: '600px', margin: '22px auto 0' }}>{c.hook}</p>
            <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 'clamp(0.98rem, 2vw, 1.1rem)', fontWeight: 500, lineHeight: 1.6, color: 'rgba(255,255,255,0.7)', maxWidth: '560px', margin: '14px auto 0' }}>{c.promise}</p>
          </header>

          {/* 01 — The frame */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <SectionHead n="01" title={c.s1_t} />
            <p style={lead}>{c.s1_lead}</p>
            <Callout icon="📖">{c.s1_analogy}</Callout>
            <p style={body}>{c.s1_body}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[{ n: '60', l: c.fps_l }, { n: '≈17 ms', l: c.ms_l }].map((x, i) => (
                <div key={i} style={{ ...card, textAlign: 'center', padding: '20px 12px' }}>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(2rem, 6vw, 2.8rem)', letterSpacing: '2px', color: ACCENT, textShadow: `0 0 14px ${ACCENT}88` }}>{x.n}</div>
                  <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-2)', color: 'rgba(255,255,255,0.65)', marginTop: '4px' }}>{x.l}</div>
                </div>
              ))}
            </div>
            <QuickCheck q={c.qc1_q} a={c.qc1_a} label={c.qc_label} show={c.show_answer} />
          </section>

          {/* 02 — The 3 phases */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <SectionHead n="02" title={c.s2_t} />
            <p style={lead}>{c.s2_lead}</p>
            <Callout icon="🥊">{c.s2_analogy}</Callout>

            {/* Frame meter (one cell per frame, game colours) */}
            <div style={{ ...card }}>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: '1px', color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}>
                Startup <span style={{ color: COL.startup }}>{TL[0].f} F</span> / Total <span style={{ color: '#fff' }}>{totalF} F</span>
              </div>
              <div style={{ display: 'flex', height: '40px', gap: '2px', border: '1px solid rgba(255,255,255,0.12)', background: '#05050a', padding: '2px' }}>
                {cells.map((color, i) => (
                  <div key={i} style={{ flex: 1, background: `linear-gradient(180deg, ${color}, ${color}99)`, boxShadow: `inset 0 0 0 1px ${color}55` }} />
                ))}
              </div>
              <div style={{ display: 'flex', marginTop: '8px' }}>
                {TL.map(b => (
                  <div key={b.label} style={{ flex: `${b.f} 0 0`, textAlign: 'center', minWidth: 0 }}>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1rem', letterSpacing: '1px', color: b.color, textShadow: `0 0 10px ${b.color}66` }}>{b.f}F</div>
                    <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-2xs)', letterSpacing: '1px', color: 'rgba(255,255,255,0.7)' }}>{b.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-2xs)', letterSpacing: '1px', color: 'rgba(255,255,255,0.7)', marginTop: '12px', textAlign: 'center' }}>
                {c.caption} — {c.total_note} = {totalF}F
              </div>
            </div>

            <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <Phase name="STARTUP" frames="5F" color={COL.startup} text={c.startup_b} />
              <Phase name="ACTIVE" frames="3F" color={COL.active} text={c.active_b} />
              <Phase name="RECOVERY" frames="12F" color={COL.recovery} text={c.recovery_b} />
            </div>
            <QuickCheck q={c.qc2_q} a={c.qc2_a} label={c.qc_label} show={c.show_answer} />
          </section>

          {/* 03 — Frame advantage */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <SectionHead n="03" title={c.s3_t} />
            <p style={lead}>{c.s3_lead}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
              {[{ t: c.plus_t, b: c.plus_b, col: COL.plus }, { t: c.minus_t, b: c.minus_b, col: COL.minus }].map((x, i) => (
                <div key={i} style={{ ...card, borderColor: `${x.col}44`, background: `${x.col}0d` }}>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.35rem', letterSpacing: '2px', color: x.col, textShadow: `0 0 12px ${x.col}66` }}>{x.t}</div>
                  <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '1rem', fontWeight: 500, lineHeight: 1.55, color: 'rgba(255,255,255,0.78)', marginTop: '6px' }}>{x.b}</p>
                </div>
              ))}
            </div>
            <Callout icon="🧠" color="#ffd700"><strong>{c.s3_key}</strong></Callout>
            <QuickCheck q={c.qc3_q} a={c.qc3_a} label={c.qc_label} show={c.show_answer} />
          </section>

          {/* 04 — Punish */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <SectionHead n="04" title={c.s4_t} />
            <p style={lead}>{c.s4_lead}</p>
            <Callout color={COL.startup} icon="⚡"><strong>{c.s4_rule}</strong></Callout>
            <PunishLab c={c} />
          </section>

          {/* Cheat sheet */}
          <section style={{ ...card, background: `${ACCENT}0f`, border: `1px solid ${ACCENT}44`, display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(1.4rem, 3.5vw, 1.9rem)', letterSpacing: '3px', color: '#fff', textShadow: `0 0 16px ${ACCENT}66` }}>{c.cs_t}</div>
            {[c.cs1, c.cs2, c.cs3, c.cs4].map((line, i) => (
              <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <span style={{ flexShrink: 0, fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.1rem', letterSpacing: '1px', color: ACCENT, lineHeight: 1.3 }}>0{i + 1}</span>
                <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '1.05rem', fontWeight: 600, lineHeight: 1.45, color: 'rgba(255,255,255,0.9)', margin: 0 }}>{line}</p>
              </div>
            ))}
          </section>

          {/* CTA */}
          <section style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '18px', alignItems: 'center' }}>
            <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 'clamp(1.1rem, 2.4vw, 1.4rem)', fontWeight: 700, lineHeight: 1.5, color: '#fff', margin: 0, maxWidth: '480px' }}>{c.cta_t}</p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <Link href="/quiz" style={{ padding: '14px 32px', background: `linear-gradient(90deg, #7c3aed, ${ACCENT})`, color: '#fff', textDecoration: 'none', fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.1rem', letterSpacing: '4px', boxShadow: `0 0 24px ${ACCENT}44` }}>{c.cta_btn}</Link>
              <a href="https://ultimateframedata.com/sf6" target="_blank" rel="noopener noreferrer" style={{ padding: '14px 28px', background: 'none', border: '1px solid rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontFamily: "'Bebas Neue', sans-serif", fontSize: '1rem', letterSpacing: '3px' }}>{c.db_btn}</a>
            </div>
          </section>

        </div>
      </main>
      <Footer />
    </>
  )
}
