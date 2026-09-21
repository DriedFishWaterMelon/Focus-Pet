import { describe, expect, it } from 'vitest'
import {
  coinsForSession,
  completeFocusSession,
  defaultPet,
  expForSession,
  feedPet,
  levelFromExp,
  moodOf,
  playWithPet,
  rewardItemFor,
  stageFromLevel,
} from './gameLogic'
import { defaultInventory } from './gameLogic'

// These assertions are the contract between the web app and the Android app.
// The expected values are taken from PetRepository.kt and Models.kt — if a test
// here fails, the two clients have drifted and a participant would see different
// numbers depending on which one they opened.

describe('levels and stages', () => {
  it('derives level from exp the same way as the Kotlin app', () => {
    expect(levelFromExp(0)).toBe(1)
    expect(levelFromExp(99)).toBe(1)
    expect(levelFromExp(100)).toBe(2)
    expect(levelFromExp(550)).toBe(6)
  })

  it('maps levels to stages at the documented thresholds', () => {
    expect(stageFromLevel(1)).toBe('BABY')
    expect(stageFromLevel(2)).toBe('BABY')
    expect(stageFromLevel(3)).toBe('JUVENILE')
    expect(stageFromLevel(6)).toBe('ADULT')
    expect(stageFromLevel(10)).toBe('MYSTIC')
    expect(stageFromLevel(15)).toBe('LEGEND')
  })
})

describe('session rewards', () => {
  it('gives the completion bonus only when the target is met', () => {
    // 25 min target reached: 25*2 + 20
    expect(expForSession(25, 25)).toBe(70)
    // 20 of 25 min: 20*2 + 5
    expect(expForSession(20, 25)).toBe(45)
  })

  it('computes coins with the 5-minute bonus step', () => {
    expect(coinsForSession(25)).toBe(25 + 5 * 2)
    expect(coinsForSession(4)).toBe(4)
  })

  it('rolls reward items at the documented thresholds', () => {
    expect(rewardItemFor(14)).toBeNull()
    expect(rewardItemFor(15)).toBe('Crisp Forest Berry')
    expect(rewardItemFor(25)).toBe('Matcha Focus Brew')
    expect(rewardItemFor(45)).toBe('Golden Honey Apple')
  })
})

describe('completeFocusSession', () => {
  it('increases energy rather than draining it', () => {
    // The inversion is the whole premise of the project: doing nothing restores
    // the pet. If this ever flips, the game contradicts the research question.
    const pet = { ...defaultPet(), energy: 50 }
    const { pet: after } = completeFocusSession(pet, 25, 25, 'Study', 'web_timer_verified')
    expect(after.energy).toBe(65)
  })

  it('clamps stats at 100', () => {
    const pet = { ...defaultPet(), energy: 95, happiness: 95 }
    const { pet: after } = completeFocusSession(pet, 25, 25, 'Study', 'web_timer_verified')
    expect(after.energy).toBe(100)
    expect(after.happiness).toBe(100)
  })

  it('marks a session incomplete when the target was not reached', () => {
    const { session } = completeFocusSession(defaultPet(), 30, 10, 'Study', 'web_timer_verified')
    expect(session.completed).toBe(false)
    expect(session.actualMinutes).toBe(10)
  })

  it('records the source so the analysis can separate evidence quality', () => {
    const { session } = completeFocusSession(
      defaultPet(),
      25,
      25,
      'Study',
      'web_timer_interrupted',
    )
    expect(session.source).toBe('web_timer_interrupted')
  })

  it('accumulates total focus minutes across sessions', () => {
    const first = completeFocusSession(defaultPet(), 25, 25, 'Study', 'web_timer_verified')
    const second = completeFocusSession(first.pet, 30, 30, 'Study', 'web_timer_verified')
    expect(second.pet.totalFocusMinutes).toBe(55)
  })
})

describe('feeding and playing', () => {
  it('refuses to feed an item with no quantity left', () => {
    const item = { ...defaultInventory()[0], quantity: 0 }
    expect(feedPet(defaultPet(), item)).toBeNull()
  })

  it('applies the item boosts and clamps to 100', () => {
    const pet = { ...defaultPet(), hunger: 90 }
    const berry = defaultInventory()[0] // +25 hunger
    const after = feedPet(pet, berry)
    expect(after?.hunger).toBe(100)
  })

  it('trades energy for happiness when playing', () => {
    const pet = { ...defaultPet(), happiness: 50, energy: 50 }
    const after = playWithPet(pet)
    expect(after.happiness).toBe(65)
    expect(after.energy).toBe(42)
  })

  it('does not let energy fall below zero', () => {
    const pet = { ...defaultPet(), energy: 3 }
    expect(playWithPet(pet).energy).toBe(0)
  })
})

describe('mood', () => {
  it('prioritises hunger over every other state', () => {
    expect(moodOf({ ...defaultPet(), hunger: 10, happiness: 100 })).toBe('HUNGRY')
  })

  it('reports tired when energy is low but the pet is fed', () => {
    expect(moodOf({ ...defaultPet(), hunger: 80, energy: 10 })).toBe('TIRED')
  })

  it('reports ecstatic only when both happy and well fed', () => {
    expect(moodOf({ ...defaultPet(), hunger: 80, energy: 80, happiness: 85 })).toBe('ECSTATIC')
    expect(moodOf({ ...defaultPet(), hunger: 50, energy: 80, happiness: 85 })).toBe('HAPPY')
  })
})
