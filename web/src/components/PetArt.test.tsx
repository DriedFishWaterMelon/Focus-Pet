import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Aura, Body, Crown, Particles, idleClass } from './PetArt'
import { GROWTH_FORMS } from '../lib/evolution'
import { SPECIES_INFO } from '../lib/types'
import type { PetShape } from '../lib/types'

// The artwork is composed from traits rather than drawn per form, so the thing
// worth testing is that every form actually composes into valid, distinct SVG.
// A crown that silently renders nothing or a body with a NaN coordinate looks
// like a blank pet in the browser and like nothing at all in a type check.

const FORMS = GROWTH_FORMS

const PALETTE = SPECIES_INFO.leaf.palette

function markupFor(shape: PetShape, palette = PALETTE): string {
  return renderToStaticMarkup(
    <svg viewBox="0 0 200 200">
      <Aura shape={shape} palette={palette} alive focus={false} />
      <Crown shape={shape} palette={palette} />
      <Body shape={shape} palette={palette} />
      <Particles shape={shape} palette={palette} alive />
    </svg>,
  )
}

describe('every evolution form renders', () => {
  it.each(FORMS.map((f) => [f.stage, f] as const))('%s produces drawable svg', (_stage, form) => {
    const markup = markupFor(form.shape)

    // Something was actually drawn.
    expect(markup.length).toBeGreaterThan(120)
    expect(/<(path|circle|ellipse|rect|text)/.test(markup)).toBe(true)

    // No broken geometry. NaN or undefined in a coordinate makes the browser
    // drop the whole element without an error anywhere.
    expect(markup).not.toContain('NaN')
    expect(markup).not.toContain('undefined')
    expect(markup).not.toContain('null')

    // The requested palette made it into the output.
    expect(markup.toLowerCase()).toContain(PALETTE[0].toLowerCase())
  })

  it('draws a visibly different pet for each form', () => {
    // Two forms rendering the same markup would make the branch choice
    // cosmetic in name only.
    const seen = new Map<string, string>()
    for (const form of FORMS) {
      const markup = markupFor(form.shape)
      const clash = seen.get(markup)
      expect(clash, `${form.stage} renders identically to ${clash}`).toBeUndefined()
      seen.set(markup, form.stage)
    }
    expect(seen.size).toBe(FORMS.length)
  })

  it('gives every form an idle animation class', () => {
    for (const form of FORMS) {
      expect(idleClass(form.shape)).toMatch(/^(art-|pet-)/)
    }
  })

  it('uses more than one idle animation across the growth line', () => {
    // If every form breathed the same way, growing up would feel like nothing.
    const idles = new Set(FORMS.map((f) => idleClass(f.shape)))
    expect(idles.size).toBeGreaterThanOrEqual(3)
  })
})

describe('trait coverage', () => {
  it('draws every body shape the type allows', () => {
    const bodies: PetShape['body'][] = ['blob', 'round', 'tall', 'wisp', 'crystal']
    for (const body of bodies) {
      const markup = renderToStaticMarkup(
        <svg>
          <Body shape={{ ...FORMS[0].shape, body }} palette={PALETTE} />
        </svg>,
      )
      expect(markup, `body "${body}" drew nothing`).toMatch(/<(path|circle|ellipse|rect)/)
    }
  })

  it('draws every crown the type allows, and nothing for "none"', () => {
    const crowns: PetShape['crown'][] = [
      'sprout',
      'leaf',
      'petal',
      'branch',
      'spike',
      'halo',
      'bloom',
    ]
    for (const crown of crowns) {
      const markup = renderToStaticMarkup(
        <svg>
          <Crown shape={{ ...FORMS[0].shape, crown }} palette={PALETTE} />
        </svg>,
      )
      expect(markup, `crown "${crown}" drew nothing`).toMatch(/<(path|circle|ellipse|rect)/)
    }

    const none = renderToStaticMarkup(
      <svg>
        <Crown shape={{ ...FORMS[0].shape, crown: 'none' }} palette={PALETTE} />
      </svg>,
    )
    expect(none).toBe('<svg></svg>')
  })

  it('draws a glyph for every particle type', () => {
    const particles: PetShape['particle'][] = [
      'sparkle',
      'petal',
      'leaf',
      'dew',
      'star',
      'mist',
    ]
    for (const particle of particles) {
      const markup = renderToStaticMarkup(
        <svg>
          <Particles shape={{ ...FORMS[0].shape, particle }} palette={PALETTE} alive />
        </svg>,
      )
      expect(markup, `particle "${particle}" drew nothing`).toContain('<text')
    }
  })

  it('hides aura and particles on a dead pet', () => {
    const shape = FORMS[0].shape
    expect(
      renderToStaticMarkup(
        <svg>
          <Aura shape={shape} palette={PALETTE} alive={false} focus={false} />
        </svg>,
      ),
    ).toBe('<svg></svg>')
    expect(
      renderToStaticMarkup(
        <svg>
          <Particles shape={shape} palette={PALETTE} alive={false} />
        </svg>,
      ),
    ).toBe('<svg></svg>')
  })
})
