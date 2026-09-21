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
 * A border colour that deliberately clashes with `index`'s own accent.
 * Offsetting by two rather than one keeps neighbours from pairing up into
 * the same two-colour combination down a list.
 */
export function clashAt(index: number): Accent {
  return accentAt(index + 2)
}

/** Yellow and cyan are too bright for white text; they take the void instead. */
export function readableOn(color: string): string {
  return ['#FFE600', '#00F5D4'].includes(color.toUpperCase()) ? VOID : '#FFFFFF'
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
