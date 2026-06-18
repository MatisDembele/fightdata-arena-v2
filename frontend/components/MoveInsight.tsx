'use client'
import { useLanguage, type DictKey } from '@/lib/i18n'
import type { Move } from '@/types'

/** Parse a frame-data cell like "5", "+2", "-6" into a number, or null if non-numeric. */
function num(v?: string): number | null {
  if (v == null) return null
  const n = parseInt(String(v).replace('+', ''), 10)
  return Number.isNaN(n) ? null : n
}

const MS_PER_FRAME = 1000 / 60 // 16.67 ms

// ── Speed tiers (from startup) ────────────────────────────────────────────────
function speedTier(s: number): { key: DictKey; color: string } {
  if (s <= 4)  return { key: 'move.spd_vfast', color: '#4ade80' }
  if (s <= 7)  return { key: 'move.spd_fast',  color: '#a3e635' }
  if (s <= 12) return { key: 'move.spd_med',   color: '#ffe000' }
  if (s <= 18) return { key: 'move.spd_slow',  color: '#fb923c' }
  return { key: 'move.spd_vslow', color: '#ff2d78' }
}

// ── Block safety tiers (from on-block) ────────────────────────────────────────
function safetyTier(b: number): { key: DictKey; color: string } {
  if (b >= 1)  return { key: 'move.saf_plus',    color: '#4ade80' }
  if (b === 0) return { key: 'move.saf_even',    color: '#ffe000' }
  if (b >= -3) return { key: 'move.saf_safe',    color: '#a3e635' }
  if (b >= -7) return { key: 'move.saf_punish',  color: '#fb923c' }
  return { key: 'move.saf_vpunish', color: '#ff2d78' }
}

function Block({ heading, value, color, body }: { heading: string; value: string; color: string; body: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
        <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-2xs)', letterSpacing: 'var(--ls-2)', color: 'rgba(255,255,255,0.35)' }}>{heading}</span>
        <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-1)', color }}>{value}</span>
      </div>
      <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '0.82rem', fontWeight: 500, color: 'rgba(255,255,255,0.62)', lineHeight: 1.5 }}>{body}</div>
    </div>
  )
}

export default function MoveInsight({ move, color }: { move: Move; color: string }) {
  const { t } = useLanguage()

  const s = num(move.startup)
  const b = num(move.on_block)
  const h = num(move.on_hit)
  const a = num(move.active)
  const r = num(move.recovery)

  // Nothing meaningful to explain
  if (s == null && b == null && h == null) {
    return (
      <div style={{ padding: '14px 16px', fontFamily: "'Rajdhani', sans-serif", fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)' }}>
        {t('move.no_data')}
      </div>
    )
  }

  const spd = s != null ? speedTier(s) : null
  const saf = b != null ? safetyTier(b) : null
  const verdictColor = saf?.color ?? spd?.color ?? color

  // On-hit: detect knockdown (KD / HKD / D) when not a plain number
  const hitRaw = (move.on_hit ?? '').toUpperCase()
  const isKnockdown = h == null && /\b(H?KD|D)\b/.test(hitRaw)

  return (
    <div style={{ background: 'rgba(255,255,255,0.025)', borderLeft: `2px solid ${verdictColor}`, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Verdict badge — the one-glance takeaway */}
      {(spd || saf) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          {spd && (
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.95rem', letterSpacing: '2px', color: spd.color, border: `1px solid ${spd.color}55`, background: `${spd.color}14`, padding: '3px 10px', lineHeight: 1.2 }}>
              {t(spd.key)}
            </span>
          )}
          {saf && (
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.95rem', letterSpacing: '2px', color: saf.color, border: `1px solid ${saf.color}55`, background: `${saf.color}14`, padding: '3px 10px', lineHeight: 1.2 }}>
              {t(saf.key)}
            </span>
          )}
        </div>
      )}

      {/* Startup */}
      {s != null && (
        <Block
          heading="STARTUP"
          value={`${s}F`}
          color={spd!.color}
          body={`${t('move.startup_body', { n: s, ms: Math.round(s * MS_PER_FRAME) })} ${s <= 4 ? t('move.startup_ref_fast') : t('move.startup_ref_norm')}`}
        />
      )}

      {/* On block */}
      {b != null && (
        <Block
          heading="ON BLOCK"
          value={b > 0 ? `+${b}` : `${b}`}
          color={saf!.color}
          body={
            b >= 1   ? t('move.blk_plus_body',   { n: b }) :
            b === 0  ? t('move.blk_even_body') :
            b >= -3  ? t('move.blk_safe_body',   { n: -b }) :
                       t('move.blk_punish_body', { n: -b })
          }
        />
      )}

      {/* On hit */}
      {(h != null || isKnockdown) && (
        <Block
          heading="ON HIT"
          value={isKnockdown ? (move.on_hit ?? 'KD') : (h! > 0 ? `+${h}` : `${h}`)}
          color={isKnockdown || (h != null && h > 0) ? '#4ade80' : h === 0 ? '#ffe000' : '#fb923c'}
          body={
            isKnockdown ? t('move.hit_kd_body') :
            h! >= 1     ? t('move.hit_plus_body',  { n: h! }) :
            h === 0     ? t('move.hit_even_body') :
                          t('move.hit_minus_body', { n: -h! })
          }
        />
      )}

      {/* Proportional frame timeline */}
      {s != null && a != null && r != null && s + a + r > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-2xs)', letterSpacing: 'var(--ls-2)', color: 'rgba(255,255,255,0.3)' }}>{t('move.tl_title')}</div>
          <div style={{ display: 'flex', width: '100%', height: '22px', border: '1px solid rgba(255,255,255,0.08)' }}>
            {[
              { f: s, label: 'STARTUP', c: '#4ade80', bg: 'rgba(74,222,128,0.22)' },
              { f: a, label: 'ACTIVE',  c: '#f87171', bg: 'rgba(248,113,113,0.22)' },
              { f: r, label: 'RECOVERY', c: 'rgba(255,255,255,0.35)', bg: 'rgba(255,255,255,0.06)' },
            ].map(seg => (
              <div key={seg.label} title={`${seg.label} · ${seg.f}F`} style={{ flexGrow: seg.f, flexBasis: 0, minWidth: 0, background: seg.bg, borderRight: '1px solid rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', letterSpacing: '0.5px', color: seg.c, whiteSpace: 'nowrap' }}>{seg.f}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            {[
              { label: 'STARTUP', c: '#4ade80' },
              { label: 'ACTIVE',  c: '#f87171' },
              { label: 'RECOVERY', c: 'rgba(255,255,255,0.4)' },
            ].map(seg => (
              <span key={seg.label} style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.5rem', letterSpacing: '1px', color: seg.c }}>■ {seg.label}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
