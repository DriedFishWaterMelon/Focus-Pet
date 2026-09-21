import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Aura, Body, Crown, Particles, idleClass } from './PetArt'
import { EVOLUTION_TREE } from '../lib/evolution'
import type { PetVisual } from '../lib/types'

// The artwork is composed from traits rather than drawn per form, so the thing
// worth testing is that every form actually composes into valid, distinct SVG.
// A crown that silently renders nothing or a body with a NaN coordinate looks
// like a blank pet in the browser and like nothing at all in a type check.

const FORMS = Object.values(EVOLUTION_TREE)

function markupFor(visual: PetVisual): string {
  return renderToStaticMarkup(
    <svg viewBox="0 0 200 200">
      <Aura visual={visual} alive focus={false} />
      <Crown visual={visual} />
      <Body visual={visual} />
      <Particles visual={visual} alive />
    </svg>,
  )
}

describe('every evolution form renders', () => {
  it.each(FORMS.map((f) => [f.id, f] as const))('%s produces drawable svg', (_id, form) => {
    const markup = markupFor(form.visual)

    // Something was actually drawn.
    expect(markup.length).toBeGreaterThan(120)
    expect(/<(path|circle|ellipse|rect|text)/.test(markup)).toBe(true)

    // No broken geometry. NaN or undefined in a coordinate makes the browser
    // drop the whole element without an error anywhere.
    expect(markup).not.toContain('NaN')
    expect(markup).not.toContain('undefined')
    expect(markup).not.toContain('null')

    // The form's own colours made it into the output.
    expect(markup.toLowerCase()).toContain(form.visual.palette[0].toLowerCase())
  })

  it('draws a visibly different pet for each form', () => {
    // Two forms rendering the same markup would make the branch choice
    // cosmetic in name only.
    const seen = new Map<string, string>()
    for (const form of FORMS) {
      const markup = markupFor(form.visual)
      const clash = seen.get(markup)
      expect(clash, `${form.id} renders identically to ${clash}`).toBeUndefined()
      seen.set(markup, form.id)
    }
    expect(seen.size).toBe(FORMS.length)
  })

  it('gives every form an idle animation class', () => {
    for (const form of FORMS) {
      expect(idleClass(form.visual)).toMatch(/^(art-|pet-)/)
    }
  })

  it('uses more than one idle animation across the tree', () => {
    // If every form breathed the same way the tree would feel static.
    const idles = new Set(FORMS.map((f) => idleClass(f.visual)))
    expect(idles.size).toBeGreaterThanOrEqual(4)
  })
})

describe('trait coverage', () => {
  it('draws every body shape the type allows', () => {
    const bodies: PetVisual['body'][] = ['blob', 'round', 'tall', 'wisp', 'crystal']
    for (const body of bodies) {
      const markup = renderToStaticMarkup(
        <svg>
          <Body visual={{ ...FORMS[0].visual, body }} />
        </svg>,
      )
      expect(markup, `body "${body}" drew nothing`).toMatch(/<(path|circle|ellipse|rect)/)
    }
  })

  it('draws every crown the type allows, and nothing for "none"', () => {
    const crowns: PetVisual['crown'][] = [
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
          <Crown visual={{ ...FORMS[0].visual, crown }} />
        </svg>,
      )
      expect(markup, `crown "${crown}" drew nothing`).toMatch(/<(path|circle|ellipse|rect)/)
    }

    const none = renderToStaticMarkup(
      <svg>
        <Crown visual={{ ...FORMS[0].visual, crown: 'none' }} />
      </svg>,
    )
    expect(none).toBe('<svg></svg>')
  })

  it('draws a glyph for every particle type', () => {
    const particles: PetVisual['particle'][] = [
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
          <Particles visual={{ ...FORMS[0].visual, particle }} alive />
        </svg>,
      )
      expect(markup, `particle "${particle}" drew nothing`).toContain('<text')
    }
  })

  it('hides aura and particles on a dead pet', () => {
    const visual = FORMS[0].visual
    expect(
      renderToStaticMarkup(
        <svg>
          <Aura visual={visual} alive={false} focus={false} />
        </svg>,
      ),
    ).toBe('<svg></svg>')
    expect(
      renderToStaticMarkup(
        <svg>
          <Particles visual={visual} alive={false} />
        </svg>,
      ),
    ).toBe('<svg></svg>')
  })
})
