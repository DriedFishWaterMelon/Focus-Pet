import { describe, expect, it } from 'vitest'
import {
  DECAY_PER_HOUR,
  HEALTH_DRAIN_PER_HOUR,
  applyDecay,
  buyItem,
  coinsForSession,
  completeFocusSession,
  daysBetween,
  defaultInventory,
  defaultPet,
  expForSession,
  feedPet,
  hatchNewPet,
  hoursUntilDeath,
  levelFromExp,
  moodOf,
  nextStreak,
  playWithPet,
  rewardItemFor,
  stageFromLevel,
  streakAtRisk,
} from './gameLogic'

const HOUR = 3_600_000

// The session-reward assertions are the contract between the web app and the
// Android app: expected values come from PetRepository.kt, and a failure here
// means a participant would see different numbers depending on which client
// they opened. The survival tests below cover behaviour that is web-only.

describe('levels and stages', () => {
  it('derives level from exp the same way as the Kotlin app', () => {
    expect(levelFromExp(0)).toBe(1)
    expect(levelFromExp(99)).toBe(1)
    expect(levelFromExp(100)).toBe(2)
    expect(levelFromExp(550)).toBe(6)
  })

  it('maps levels to stages at the documented thresholds', () => {
    expect(stageFromLevel(1)).toBe('BABY')
    expect(stageFromLevel(3)).toBe('JUVENILE')
    expect(stageFromLevel(6)).toBe('ADULT')
    expect(stageFromLevel(10)).toBe('MYSTIC')
    expect(stageFromLevel(15)).toBe('LEGEND')
  })
})

describe('session rewards', () => {
  it('gives the completion bonus only when the target is met', () => {
    expect(expForSession(25, 25)).toBe(70)
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

  it('increases energy rather than draining it', () => {
    const pet = defaultPet({ energy: 50 })
    const { pet: after } = completeFocusSession(pet, 25, 25, 'Study', 'web_timer_verified')
    expect(after.energy).toBe(65)
  })

  it('reports level ups and evolutions so the UI can celebrate them', () => {
    const pet = defaultPet({ exp: 95, level: 1 })
    const result = completeFocusSession(pet, 25, 25, 'Study', 'web_timer_verified')
    expect(result.leveledUp).toBe(true)

    const nearEvolution = defaultPet({ exp: 195, level: 2, stage: 'BABY' })
    expect(completeFocusSession(nearEvolution, 25, 25, 'S', 'web_timer_verified').evolved).toBe(
      true,
    )
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
})

describe('streaks', () => {
  const at = (iso: string) => Date.parse(`${iso}T12:00:00Z`)

  it('counts days, not sessions', () => {
    // The Android app adds 1 per session, so five sessions in an afternoon read
    // as a five-day streak. Repeat sessions on the same day must not inflate it.
    let pet = defaultPet()
    pet = completeFocusSession(pet, 25, 25, 'S', 'web_timer_verified', at('2026-09-01')).pet
    expect(pet.streakDays).toBe(1)
    pet = completeFocusSession(pet, 25, 25, 'S', 'web_timer_verified', at('2026-09-01')).pet
    expect(pet.streakDays).toBe(1)
  })

  it('increments on a consecutive day', () => {
    const pet = defaultPet({ streakDays: 4, lastSessionDate: '2026-09-01' })
    expect(nextStreak(pet, '2026-09-02')).toBe(5)
  })

  it('breaks after a missed day', () => {
    const pet = defaultPet({ streakDays: 12, lastSessionDate: '2026-09-01' })
    expect(nextStreak(pet, '2026-09-03')).toBe(1)
    expect(nextStreak(pet, '2026-10-01')).toBe(1)
  })

  it('warns when the streak is one day from breaking', () => {
    const pet = defaultPet({ streakDays: 6, lastSessionDate: '2026-09-01' })
    expect(streakAtRisk(pet, '2026-09-02')).toBe(true)
    expect(streakAtRisk(pet, '2026-09-01')).toBe(false)
  })

  it('computes calendar gaps across month boundaries', () => {
    expect(daysBetween('2026-08-31', '2026-09-01')).toBe(1)
    expect(daysBetween('2026-09-01', '2026-09-01')).toBe(0)
  })
})

describe('decay while the app is closed', () => {
  it('drains stats in proportion to elapsed time', () => {
    const pet = defaultPet({ hunger: 100, happiness: 100, energy: 100 })
    const { pet: after } = applyDecay(pet, pet.lastTickAt + 10 * HOUR)

    expect(after.hunger).toBeCloseTo(100 - DECAY_PER_HOUR.hunger * 10, 5)
    expect(after.happiness).toBeCloseTo(100 - DECAY_PER_HOUR.happiness * 10, 5)
    expect(after.energy).toBeCloseTo(100 - DECAY_PER_HOUR.energy * 10, 5)
  })

  it('ignores a page refresh', () => {
    const pet = defaultPet({ hunger: 80 })
    const { pet: after, report } = applyDecay(pet, pet.lastTickAt + 1000)
    expect(after.hunger).toBe(80)
    expect(report).toBeNull()
  })

  it('never drains health while needs are still met', () => {
    const pet = defaultPet({ hunger: 100, happiness: 100, energy: 100, health: 80 })
    const { pet: after } = applyDecay(pet, pet.lastTickAt + 5 * HOUR)
    expect(after.health).toBeGreaterThanOrEqual(80)
  })

  it('caps recovered health at 100', () => {
    const pet = defaultPet({ hunger: 100, happiness: 100, energy: 100, health: 95 })
    const { pet: after } = applyDecay(pet, pet.lastTickAt + 40 * HOUR)
    expect(after.health).toBe(100)
  })

  it('drains health only for the hours a need was actually empty', () => {
    // Hunger 25 at 2.5/hr empties after 10h; 14h elapsed leaves 4h starving.
    const pet = defaultPet({ hunger: 25, happiness: 100, energy: 100, health: 100 })
    const { pet: after } = applyDecay(pet, pet.lastTickAt + 14 * HOUR)
    expect(after.hunger).toBe(0)
    expect(after.health).toBeCloseTo(100 - HEALTH_DRAIN_PER_HOUR * 4, 5)
  })

  it('recovers health once the pet is cared for again', () => {
    const pet = defaultPet({ hunger: 100, happiness: 100, energy: 100, health: 50 })
    const { pet: after } = applyDecay(pet, pet.lastTickAt + 4 * HOUR)
    expect(after.health).toBeGreaterThan(50)
  })

  it('kills the pet after sustained total neglect', () => {
    const pet = defaultPet({ hunger: 100, happiness: 100, energy: 100, health: 100 })
    const { pet: after, report } = applyDecay(pet, pet.lastTickAt + 90 * HOUR)
    expect(after.isAlive).toBe(false)
    expect(after.health).toBe(0)
    expect(after.diedAt).not.toBeNull()
    expect(report?.died).toBe(true)
  })

  it('survives a normal missed day', () => {
    // Skipping one day must not be fatal, or participants would drop out of the
    // study over a single busy day.
    const pet = defaultPet({ hunger: 85, happiness: 90, energy: 85, health: 100 })
    const { pet: after } = applyDecay(pet, pet.lastTickAt + 24 * HOUR)
    expect(after.isAlive).toBe(true)
    expect(after.health).toBe(100)
  })

  it('does nothing to a pet that is already dead', () => {
    const dead = defaultPet({ isAlive: false, health: 0, hunger: 0 })
    const { pet: after, report } = applyDecay(dead, dead.lastTickAt + 100 * HOUR)
    expect(after).toEqual(dead)
    expect(report).toBeNull()
  })

  it('estimates time until death from the current state', () => {
    const pet = defaultPet({ hunger: 100, health: 100 })
    // 40h to starve, then 25h to die.
    expect(hoursUntilDeath(pet)).toBeCloseTo(65, 5)
  })
})

describe('death and rebirth', () => {
  it('refuses to feed or play with a dead pet', () => {
    const dead = defaultPet({ isAlive: false })
    expect(feedPet(dead, { ...defaultInventory()[0] })).toBeNull()
    expect(playWithPet(dead)).toBeNull()
  })

  it('carries screen-free minutes to the next pet but resets game progress', () => {
    // Those minutes are the participant's real recorded behaviour. A game event
    // must never erase research data.
    const previous = defaultPet({
      totalFocusMinutes: 840,
      exp: 1200,
      level: 13,
      coins: 999,
      generation: 1,
      isAlive: false,
    })
    const fresh = hatchNewPet(previous, 'Nara', 'flame')

    expect(fresh.totalFocusMinutes).toBe(840)
    expect(fresh.exp).toBe(0)
    expect(fresh.level).toBe(1)
    expect(fresh.generation).toBe(2)
    expect(fresh.isAlive).toBe(true)
    expect(fresh.name).toBe('Nara')
  })
})

describe('shop', () => {
  it('spends coins and adds the item', () => {
    const pet = defaultPet({ coins: 100 })
    const result = buyItem(pet, [], 'berry_crisp')
    expect(result?.pet.coins).toBe(75)
    expect(result?.inventory[0].quantity).toBe(1)
  })

  it('stacks onto an item already owned', () => {
    const pet = defaultPet({ coins: 100 })
    const owned = [{ ...defaultInventory()[0], quantity: 2 }]
    const result = buyItem(pet, owned, 'berry_crisp')
    expect(result?.inventory[0].quantity).toBe(3)
  })

  it('refuses a purchase that cannot be afforded', () => {
    const pet = defaultPet({ coins: 10 })
    expect(buyItem(pet, [], 'golden_apple')).toBeNull()
  })

  it('refuses an unknown item', () => {
    expect(buyItem(defaultPet({ coins: 9999 }), [], 'nope')).toBeNull()
  })
})

describe('caring', () => {
  it('applies item boosts and clamps to 100', () => {
    const pet = defaultPet({ hunger: 90 })
    const after = feedPet(pet, { ...defaultInventory()[0] })
    expect(after?.hunger).toBe(100)
  })

  it('heals with medicine', () => {
    const pet = defaultPet({ health: 20 })
    const medicine = defaultInventory()[1]
    expect(feedPet(pet, medicine)?.health).toBe(65)
  })

  it('trades energy for happiness when playing', () => {
    const pet = defaultPet({ happiness: 50, energy: 50 })
    const after = playWithPet(pet)
    expect(after?.happiness).toBe(65)
    expect(after?.energy).toBe(42)
  })
})

describe('mood', () => {
  it('reports death above everything else', () => {
    expect(moodOf(defaultPet({ isAlive: false }))).toBe('DEAD')
  })

  it('reports sickness before hunger', () => {
    expect(moodOf(defaultPet({ health: 30, hunger: 5 }))).toBe('SICK')
    expect(moodOf(defaultPet({ health: 15 }))).toBe('DYING')
  })

  it('falls back to the original Android mood rules when healthy', () => {
    expect(moodOf(defaultPet({ health: 100, hunger: 10 }))).toBe('HUNGRY')
    expect(moodOf(defaultPet({ health: 100, hunger: 80, energy: 10 }))).toBe('TIRED')
    expect(moodOf(defaultPet({ health: 100, hunger: 80, energy: 80, happiness: 85 }))).toBe(
      'ECSTATIC',
    )
  })
})
