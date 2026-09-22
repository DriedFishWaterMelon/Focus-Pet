import { describe, expect, it } from 'vitest'
import { ACCENTS, VOID, accentAt, accentTextAt, readableOn, textSafe } from './design'

// A tester reported purple text as hard to read. It measured 3.39:1 against the
// background, below the 4.5:1 WCAG AA floor for body text. These tests hold the
// whole palette to that floor so a future accent cannot reintroduce the problem
// by looking fine on a bright laptop screen.

const AA_NORMAL_TEXT = 4.5

function channel(value: number): number {
  return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4)
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

function contrast(a: string, b: string): number {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (lighter + 0.05) / (darker + 0.05)
}

describe('contrast', () => {
  it('computes known ratios correctly', () => {
    // Sanity check the maths itself before trusting its verdicts.
    expect(contrast('#FFFFFF', '#000000')).toBeCloseTo(21, 1)
    expect(contrast('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5)
  })

  it('reproduces the reported problem with the raw purple', () => {
    // Documents why accentTextAt exists at all.
    expect(contrast('#7B2FFF', VOID)).toBeLessThan(AA_NORMAL_TEXT)
  })

  it.each(ACCENTS.map((_, i) => i))('accentTextAt(%i) is readable on the background', (i) => {
    expect(contrast(accentTextAt(i), VOID)).toBeGreaterThanOrEqual(AA_NORMAL_TEXT)
  })

  it('keeps the saturated accent for borders and fills', () => {
    // The substitution is only for text; losing the vivid purple everywhere
    // would flatten the palette the design system is built on.
    expect(accentAt(4)).toBe('#7B2FFF')
    expect(accentTextAt(4)).not.toBe('#7B2FFF')
  })

  it('leaves accents that already pass untouched', () => {
    for (let i = 0; i < ACCENTS.length; i++) {
      if (contrast(accentAt(i), VOID) >= AA_NORMAL_TEXT) {
        expect(accentTextAt(i)).toBe(accentAt(i))
      }
    }
  })

  it('applies the same substitution to a colour passed directly', () => {
    expect(textSafe('#7B2FFF')).toBe(accentTextAt(4))
    expect(textSafe('#7b2fff')).toBe(accentTextAt(4))
    expect(textSafe('#00F5D4')).toBe('#00F5D4')
  })

  it('picks a foreground that is readable on each accent fill', () => {
    // readableOn decides the text colour laid over a solid accent, which is the
    // inverse problem and just as easy to get wrong.
    for (const accent of ACCENTS) {
      expect(contrast(readableOn(accent), accent)).toBeGreaterThanOrEqual(AA_NORMAL_TEXT)
    }
  })

  it('keeps muted body text above the floor', () => {
    expect(contrast('#A1A1AA', VOID)).toBeGreaterThanOrEqual(AA_NORMAL_TEXT)
    expect(contrast('#FFFFFF', VOID)).toBeGreaterThanOrEqual(7)
  })
})
