// Portraits officiels SF6 — streetfighter.com
// Mapping slug → numéro de portrait officiel Capcom

const PORTRAIT_MAP: Record<string, number> = {
  ryu:      1,
  luke:     2,
  jamie:    3,
  chunli:   4,
  guile:    5,
  kimberly: 6,
  juri:     7,
  ken:      8,
  blanka:   9,
  dhalsim:  10,
  ehonda:   11,
  deejay:   12,
  manon:    13,
  marisa:   14,
  jp:       15,
  zangief:  16,
  lily:     17,
  cammy:    18,
  rashid:   19,
  aki:      20,
  ed:       21,
  akuma:    22,
  mbison:   23,
  terry:    24,
  mai:      25,
  elena:    26,
  sagat:    27,
  cviper:   28,
  alex:     29,
}

export const getFighterPortrait = (slug: string): string => {
  const n = PORTRAIT_MAP[slug]
  if (!n) return ""
  return `https://www.streetfighter.com/6/assets/images/character/select_character${n}_over.png`
}

// Couleur thématique par perso (accents UI, fallbacks)
export const FIGHTER_COLORS: Record<string, string> = {
  ryu:      "#1a4a8a",
  luke:     "#8a3a1a",
  jamie:    "#4a1a8a",
  chunli:   "#1a6a8a",
  guile:    "#2a5a2a",
  kimberly: "#8a6a1a",
  juri:     "#8a1a6a",
  ken:      "#8a2a1a",
  blanka:   "#2a7a1a",
  dhalsim:  "#8a7a1a",
  ehonda:   "#6a1a1a",
  deejay:   "#1a8a6a",
  manon:    "#8a1a4a",
  marisa:   "#5a1a1a",
  jp:       "#1a1a6a",
  zangief:  "#6a1a1a",
  lily:     "#6a4a1a",
  cammy:    "#1a5a3a",
  rashid:   "#6a5a1a",
  aki:      "#4a6a1a",
  ed:       "#1a3a6a",
  akuma:    "#5a1a1a",
  mbison:   "#3a1a5a",
  terry:    "#8a3a1a",
  mai:      "#8a1a1a",
  elena:    "#1a7a5a",
  sagat:    "#6a4a1a",
  cviper:   "#1a4a6a",
  alex:     "#2a4a6a",
}

export const getFighterColor = (slug: string): string => {
  return FIGHTER_COLORS[slug] ?? "#2a2a4a"
}
