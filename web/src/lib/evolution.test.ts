import { describe, expect, it } from 'vitest'
import {
  GROWTH_FORMS,
  currentForm,
  formForStage,
  growthProgress,
  hasReached,
  levelsUntilNextForm,
  nextForm,
} from './evolution'
import { defaultPet, hatchNewPet, stageFromLevel } from './gameLogic'

const at = (level: number) => defaultPet({ level })

describe('growth line', () => {
  it('has one form per pet stage, in ascending order', () => {
    expect(GROWTH_FORMS.map((f) => f.stage)).toEqual([
      'BABY',
      'JUVENILE',
      'ADULT',
      'MYSTIC',
      'LEGEND',
    ])
    for (let i = 1; i < GROWTH_FORMS.length; i++) {
      expect(GROWTH_FORMS[i].level).toBeGreaterThan(GROWTH_FORMS[i - 1].level)
    }
  })

  it('matches the level thresholds the Android app uses', () => {
    // The forms are driven by stageFromLevel rather than a second table, so a
    // participant sees the same stage on both clients. If these ever diverge,
    // the pet would change shape at different levels depending on the device.
    for (const form of GROWTH_FORMS) {
      expect(stageFromLevel(form.level)).toBe(form.stage)
    }
  })

  it('gives every form a name, a description and its own silhouette', () => {
    for (const form of GROWTH_FORMS) {
      expect(form.name.length).toBeGreaterThan(0)
      expect(form.description.length).toBeGreaterThan(10)
    }
    const looks = GROWTH_FORMS.map((f) =>
      [f.shape.body, f.shape.crown, f.shape.particle, f.shape.idle, f.shape.aura].join('|'),
    )
    expect(new Set(looks).size).toBe(looks.length)
  })

  it('carries no colour, so growing up cannot overwrite the chosen species', () => {
    // Palette used to live on the form, which silently discarded the colour
    // picked during onboarding. This fails if it is ever put back.
    for (const form of GROWTH_FORMS) {
      expect(Object.keys(form.shape).sort()).toEqual([
        'aura',
        'body',
        'crown',
        'idle',
        'particle',
      ])
      expect(JSON.stringify(form)).not.toMatch(/#[0-9a-f]{6}/i)
    }
  })
})

describe('currentForm', () => {
  it('follows the level', () => {
    expect(currentForm(at(1)).stage).toBe('BABY')
    expect(currentForm(at(2)).stage).toBe('BABY')
    expect(currentForm(at(3)).stage).toBe('JUVENILE')
    expect(currentForm(at(6)).stage).toBe('ADULT')
    expect(currentForm(at(10)).stage).toBe('MYSTIC')
    expect(currentForm(at(15)).stage).toBe('LEGEND')
  })

  it('stays at the final form beyond the last threshold', () => {
    expect(currentForm(at(99)).stage).toBe('LEGEND')
  })

  it('needs no stored state, so a fresh object grows the same way', () => {
    // Growth is derived, not saved, which is why there is nothing to migrate
    // and no way for a save to disagree with its own level.
    const bare = { ...at(10) }
    expect(currentForm(bare).stage).toBe(currentForm(at(10)).stage)
  })
})

describe('next form', () => {
  it('points at the following form', () => {
    expect(nextForm(at(1))?.stage).toBe('JUVENILE')
    expect(nextForm(at(6))?.stage).toBe('MYSTIC')
  })

  it('returns null once fully grown', () => {
    expect(nextForm(at(15))).toBeNull()
    expect(levelsUntilNextForm(at(15))).toBeNull()
  })

  it('counts down the levels remaining', () => {
    expect(levelsUntilNextForm(at(1))).toBe(2)
    expect(levelsUntilNextForm(at(3))).toBe(3)
    expect(levelsUntilNextForm(at(9))).toBe(1)
  })
})

describe('progress and unlocks', () => {
  it('reports how far through the line the pet is', () => {
    expect(growthProgress(at(1))).toBeCloseTo(0.2, 5)
    expect(growthProgress(at(15))).toBe(1)
  })

  it('marks a form reached only at or past its level', () => {
    const pet = at(6)
    expect(hasReached(pet, formForStage('ADULT'))).toBe(true)
    expect(hasReached(pet, formForStage('MYSTIC'))).toBe(false)
  })
})

describe('rebirth', () => {
  it('starts the next pet back at the first form', () => {
    const grown = at(20)
    const heir = hatchNewPet(grown, 'Nara', 'flame')
    expect(heir.level).toBe(1)
    expect(currentForm(heir).stage).toBe('BABY')
  })
})
