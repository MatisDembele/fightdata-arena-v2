let ctx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!ctx) ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
  return ctx
}

function tone(freq: number, type: OscillatorType, duration: number, gain: number) {
  try {
    const c = getCtx()
    const osc = c.createOscillator()
    const g = c.createGain()
    osc.connect(g)
    g.connect(c.destination)
    osc.type = type
    osc.frequency.setValueAtTime(freq, c.currentTime)
    g.gain.setValueAtTime(gain, c.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration)
    osc.start()
    osc.stop(c.currentTime + duration)
  } catch {}
}

export function getSoundEnabled(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('fda_sound') !== 'off'
}

export function toggleSound(): boolean {
  const next = !getSoundEnabled()
  localStorage.setItem('fda_sound', next ? 'on' : 'off')
  return next
}

export function playCorrect() {
  if (!getSoundEnabled()) return
  tone(523, 'sine', 0.15, 0.3)
  setTimeout(() => tone(659, 'sine', 0.25, 0.25), 120)
}

export function playWrong() {
  if (!getSoundEnabled()) return
  tone(110, 'sawtooth', 0.2, 0.18)
}
