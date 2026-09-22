// Central design tokens for the Maximalism/Dopamine system.
//
// Colour rotation is the backbone of this aesthetic: every repeated element
// (grid cards, stat tiles, shop rows, nav items) must cycle through the five
// accents rather than picking one. Keeping that arithmetic here means a
// component never hardcodes a hex value, and adding a sixth accent later is a
// one-line change instead of a search across the codebase.

export const ACCENTS = ['#FF3AF2', '#00F5D4', '#FFE600', '#FF6B35', '#7B2FFF'] as const

export type Accent = (typeof ACCENTS)[number]

export const VOID = '#0D0D1A'
export const MUTED = '#2D1B4E'

/** The accent for position `index` in any repeated set. */
export function accentAt(index: number): Accent {
  return ACCENTS[((index % ACCENTS.length) + ACCENTS.length) % ACCENTS.length]
}

/**
 * Readable-on-dark substitutes, used when an accent becomes text.
 *
 * Measured against the #0D0D1A background, four of the five accents clear WCAG
 * AA comfortably — magenta 6.6:1, orange 6.8:1, cyan 13.8:1, yellow 15.2:1 —
 * but the vivid purple lands at 3.39:1, which is below the 4.5:1 floor for body
 * text and was reported as hard to read. It keeps its saturation on borders,
 * fills and shadows, where contrast against text is not at stake, and hands
 * over to a lighter violet (7.1:1) wherever it has to be read.
 */
const TEXT_SAFE: Partial<Record<Accent, string>> = {
  '#7B2FFF': '#A78BFA',
}

/** The accent for `index`, swapped for a legible variant if it is going on text. */
export function accentTextAt(index: number): string {
  const base = accentAt(index)
  return TEXT_SAFE[base] ?? base
}

/** Same substitution for a colour that did not come from the rotation. */
export function textSafe(color: string): string {
  return TEXT_SAFE[color.toUpperCase() as Accent] ?? color
}

/**
 * A border colour that deliberately clashes with `index`'s own accent.
 * Offsetting by two rather than one keeps neighbours from pairing up into
 * the same two-colour combination down a list.
 */
export function clashAt(index: number): Accent {
  return accentAt(index + 2)
}

const srgb = (value: number) =>
  value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4)

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  return 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b)
}

function contrastRatio(a: string, b: string): number {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Foreground for text sitting on a solid accent.
 *
 * Computed rather than listed. The previous version put white on everything
 * except yellow and cyan, which left white text on magenta at 2.9:1 and on
 * orange at 2.8:1 — both far below the 4.5:1 floor, and both used on button
 * labels. Measuring both candidates and taking the better one puts every accent
 * above the floor, and a future accent gets the right answer for free.
 */
export function readableOn(color: string): string {
  return contrastRatio(VOID, color) >= contrastRatio('#FFFFFF', color) ? VOID : '#FFFFFF'
}

/** Inline CSS variables consumed by the .shadow-multi / .glow utilities. */
export function multiShadow(index: number): React.CSSProperties {
  return {
    ['--sh1' as string]: accentAt(index + 1),
    ['--sh2' as string]: accentAt(index + 3),
    ['--sh3' as string]: accentAt(index + 4),
  }
}

export function glowVars(index: number): React.CSSProperties {
  return {
    ['--gl1' as string]: accentAt(index),
    ['--gl2' as string]: accentAt(index + 1),
    ['--gl3' as string]: accentAt(index + 3),
  }
}

/** Rotation and vertical offset, so rows never line up perfectly. */
export function skewAt(index: number): string {
  const rotations = ['-rotate-2', 'rotate-1', '-rotate-1', 'rotate-2', 'rotate-0']
  return rotations[index % rotations.length]
}

export const PATTERNS = ['pattern-dots', 'pattern-stripes', 'pattern-checker'] as const

export function patternAt(index: number): string {
  return PATTERNS[index % PATTERNS.length]
}

/**
 * Short vibration on reward moments. Real physical feedback is the cheapest
 * and most effective part of a satisfying interaction on a phone, and it is
 * silently ignored on desktop and on iOS Safari.
 */
export type HapticPattern = number | readonly number[]

export function haptic(pattern: HapticPattern = 12): void {
  try {
    // The Vibration API's typing wants a mutable array; the HAPTIC presets are
    // `as const` so they stay immutable at their definition site.
    navigator.vibrate?.(typeof pattern === 'number' ? pattern : [...pattern])
  } catch {
    // Vibration is unsupported or blocked by permissions policy; ignore.
  }
}

export const HAPTIC = {
  tap: 10,
  success: [14, 40, 22],
  reward: [18, 50, 28, 50, 44],
  warn: [40, 60, 40],
} as const
