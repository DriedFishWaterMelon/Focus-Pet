import { describe, expect, it } from 'vitest'
import {
  DECAY_PER_APP_MINUTE,
  HEALTH_DRAIN_PER_APP_MINUTE,
  RECOVERY_PER_HOUR_AWAY,
  REMINDER_AFTER_IDLE_HOURS,
  REST_CEILING,
  applyDecay,
  buyItem,
  coinsForSession,
  FREE_MINUTES_PER_POINT,
  FREE_POINT_EXP,
  completeFocusSession,
  completeFreeSession,
  daysBetween,
  defaultInventory,
  defaultPet,
  expForSession,
  feedPet,
  freePointsFor,
  freeProgressMinutes,
  hatchNewPet,
  appMinutesUntilDeath,
  applyScreenTimePenalty,
  levelFromExp,
  minutesToNextFreePoint,
  moodOf,
  nextAttentionAt,
  nextStreak,
  playWithPet,
  rewardItemFor,
  stageFromLevel,
  streakAtRisk,
} from './gameLogic'

const HOUR = 3_600_000
const MINUTE = 60_000

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
    const { pet: after } = completeFocusSession(pet, 25, 25, 'Study', 'web_timer_screen_off')
    expect(after.energy).toBe(65)
  })

  it('reports level ups and evolutions so the UI can celebrate them', () => {
    const pet = defaultPet({ exp: 95, level: 1 })
    const result = completeFocusSession(pet, 25, 25, 'Study', 'web_timer_screen_off')
    expect(result.leveledUp).toBe(true)

    const nearEvolution = defaultPet({ exp: 195, level: 2, stage: 'BABY' })
    expect(completeFocusSession(nearEvolution, 25, 25, 'S', 'web_timer_screen_off').evolved).toBe(
      true,
    )
  })

  it('records the source so the analysis can separate evidence quality', () => {
    const { session } = completeFocusSession(
      defaultPet(),
      25,
      25,
      'Study',
      'web_timer_screen_on',
    )
    expect(session.source).toBe('web_timer_screen_on')
  })
})

describe('streaks', () => {
  const at = (iso: string) => Date.parse(`${iso}T12:00:00Z`)

  it('counts days, not sessions', () => {
    // The Android app adds 1 per session, so five sessions in an afternoon read
    // as a five-day streak. Repeat sessions on the same day must not inflate it.
    let pet = defaultPet()
    pet = completeFocusSession(pet, 25, 25, 'S', 'web_timer_screen_off', at('2026-09-01')).pet
    expect(pet.streakDays).toBe(1)
    pet = completeFocusSession(pet, 25, 25, 'S', 'web_timer_screen_off', at('2026-09-01')).pet
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

// The pet must reward putting the phone down and charge for picking it up.
// These tests exist because the opposite was shipped: stats decayed per hour of
// wall-clock time, so three days away killed the pet of whichever participant
// was doing best at the very thing the study measures.

describe('time in the app costs the pet', () => {
  it('drains stats in proportion to minutes spent in the app', () => {
    const pet = defaultPet({ hunger: 100, happiness: 100, energy: 100 })
    const { pet: after } = applyDecay(pet, pet.lastTickAt + 30 * MINUTE, true)

    expect(after.hunger).toBeCloseTo(100 - DECAY_PER_APP_MINUTE.hunger * 30, 5)
    expect(after.happiness).toBeCloseTo(100 - DECAY_PER_APP_MINUTE.happiness * 30, 5)
    expect(after.energy).toBeCloseTo(100 - DECAY_PER_APP_MINUTE.energy * 30, 5)
  })

  it('reports nothing for time spent in the app', () => {
    // The player is watching it happen; a modal about it would be noise.
    const pet = defaultPet()
    const { report } = applyDecay(pet, pet.lastTickAt + 30 * MINUTE, true)
    expect(report).toBeNull()
  })

  it('drains health only for the app minutes a need was actually empty', () => {
    // Hunger 25 at 0.5/min empties after 50 min; 60 min leaves 10 min starving.
    const pet = defaultPet({ hunger: 25, happiness: 100, energy: 100, health: 100 })
    const { pet: after } = applyDecay(pet, pet.lastTickAt + 60 * MINUTE, true)
    expect(after.hunger).toBe(0)
    expect(after.health).toBeCloseTo(100 - HEALTH_DRAIN_PER_APP_MINUTE * 10, 5)
  })

  it('can only kill the pet through sustained app use', () => {
    const pet = defaultPet({ hunger: 100, happiness: 100, energy: 100, health: 100 })
    const { pet: after } = applyDecay(pet, pet.lastTickAt + 10 * HOUR, true)
    expect(after.isAlive).toBe(false)
    expect(after.diedAt).not.toBeNull()
  })

  it('estimates the app minutes left before death', () => {
    const pet = defaultPet({ hunger: 100, health: 100 })
    // 200 min to starve at 0.5/min, then 200 more at 0.5 health/min.
    expect(appMinutesUntilDeath(pet)).toBeCloseTo(400, 5)
  })
})

describe('time away from the phone heals the pet', () => {
  it('never harms a pet for being away, however long', () => {
    // The regression that matters most. Under the old rules this pet was dead.
    const pet = defaultPet({ hunger: 100, happiness: 100, energy: 100, health: 100 })
    const { pet: after } = applyDecay(pet, pet.lastTickAt + 30 * 24 * HOUR, false)

    expect(after.isAlive).toBe(true)
    expect(after.health).toBe(100)
    expect(after.hunger).toBe(100)
    expect(after.happiness).toBe(100)
    expect(after.energy).toBe(100)
  })

  it('restores a depleted pet toward the rest ceiling', () => {
    const pet = defaultPet({ hunger: 10, happiness: 10, energy: 10, health: 60 })
    const { pet: after } = applyDecay(pet, pet.lastTickAt + 8 * HOUR, false)

    expect(after.hunger).toBeCloseTo(10 + RECOVERY_PER_HOUR_AWAY.hunger * 8, 5)
    expect(after.happiness).toBeGreaterThan(10)
    expect(after.energy).toBeGreaterThan(10)
  })

  it('stops resting at the ceiling, so care still matters', () => {
    const pet = defaultPet({ hunger: 10, happiness: 10, energy: 10 })
    const { pet: after } = applyDecay(pet, pet.lastTickAt + 100 * HOUR, false)

    expect(after.hunger).toBe(REST_CEILING)
    expect(after.happiness).toBe(REST_CEILING)
    expect(after.energy).toBe(REST_CEILING)
  })

  it('leaves a well-cared-for pet above the ceiling alone', () => {
    // Rest tops a pet up; it must never drag one down to the ceiling, or a
    // participant would be punished for having fed it before going out.
    const pet = defaultPet({ hunger: 95, happiness: 95, energy: 95 })
    const { pet: after } = applyDecay(pet, pet.lastTickAt + 12 * HOUR, false)

    expect(after.hunger).toBe(95)
    expect(after.happiness).toBe(95)
    expect(after.energy).toBe(95)
  })

  it('recovers health while the phone is down', () => {
    const pet = defaultPet({ hunger: 100, happiness: 100, energy: 100, health: 50 })
    const { pet: after } = applyDecay(pet, pet.lastTickAt + 4 * HOUR, false)
    expect(after.health).toBeGreaterThan(50)
  })

  it('caps recovered health at 100', () => {
    const pet = defaultPet({ hunger: 100, happiness: 100, energy: 100, health: 95 })
    const { pet: after } = applyDecay(pet, pet.lastTickAt + 40 * HOUR, false)
    expect(after.health).toBe(100)
  })

  it('reports the gain back to the participant', () => {
    const pet = defaultPet({ hunger: 20, happiness: 20, energy: 20, health: 40 })
    const { report } = applyDecay(pet, pet.lastTickAt + 8 * HOUR, false)

    expect(report).not.toBeNull()
    expect(report?.hungerGained).toBeGreaterThan(0)
    expect(report?.healthGained).toBeGreaterThan(0)
    expect(report?.recovered).toBe(true)
  })

  it('ignores a page refresh', () => {
    const pet = defaultPet({ hunger: 80 })
    const { pet: after, report } = applyDecay(pet, pet.lastTickAt + 1000, false)
    expect(after.hunger).toBe(80)
    expect(report).toBeNull()
  })

  it('does nothing to a pet that is already dead', () => {
    const dead = defaultPet({ isAlive: false, health: 0, hunger: 0 })
    const { pet: after, report } = applyDecay(dead, dead.lastTickAt + 100 * HOUR, false)
    expect(after).toEqual(dead)
    expect(report).toBeNull()
  })
})

describe('reported screen time reaches the pet', () => {
  it('costs nothing for a day inside the allowance', () => {
    const pet = defaultPet({ hunger: 100, happiness: 100, energy: 100 })
    expect(applyScreenTimePenalty(pet, 90)).toBe(pet)
  })

  it('charges for the minutes above the allowance only', () => {
    const pet = defaultPet({ hunger: 100, happiness: 100, energy: 100 })
    const after = applyScreenTimePenalty(pet, 420)
    // 420 - 120 = 300 excess minutes at 0.08 each.
    expect(after.hunger).toBeCloseTo(100 - 24, 5)
    expect(after.happiness).toBeCloseTo(100 - 24, 5)
  })

  it('leaves a dead pet alone', () => {
    const dead = defaultPet({ isAlive: false })
    expect(applyScreenTimePenalty(dead, 600)).toBe(dead)
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

describe('free mode', () => {
  it('pays one point per ten banked minutes', () => {
    expect(freePointsFor(0)).toBe(0)
    expect(freePointsFor(9)).toBe(0)
    expect(freePointsFor(10)).toBe(1)
    expect(freePointsFor(23.42)).toBe(2)
  })

  it('reports progress toward the next point', () => {
    // Matches the readout the tester asked for: 23.42 banked reads as 3/10
    // with 7 minutes to go.
    expect(freeProgressMinutes(23.42)).toBe(3)
    expect(minutesToNextFreePoint(23.42)).toBe(7)
    expect(freeProgressMinutes(10)).toBe(0)
    expect(minutesToNextFreePoint(10)).toBe(10)
  })

  it('carries leftover minutes across sessions instead of discarding them', () => {
    // Seven minutes then four minutes must pay a point. Rounding each session
    // down on its own would silently throw the time away.
    let pet = defaultPet()
    const first = completeFreeSession(pet, 7, 'Study', 'web_timer_screen_off')
    expect(first.pointsEarned).toBe(0)
    expect(first.pet.freeMinutesTotal).toBe(7)

    pet = first.pet
    const second = completeFreeSession(pet, 4, 'Study', 'web_timer_screen_off')
    expect(second.pointsEarned).toBe(1)
    expect(second.pet.freeMinutesTotal).toBe(11)
  })

  it('never pays for the same minutes twice', () => {
    const pet = defaultPet({ freeMinutesTotal: 25, freePointsAwarded: 2 })
    const outcome = completeFreeSession(pet, 3, 'Study', 'web_timer_screen_off')
    expect(outcome.pointsEarned).toBe(0)
    expect(outcome.pet.freePointsAwarded).toBe(2)
  })

  it('pays several points at once for a long session', () => {
    const outcome = completeFreeSession(defaultPet(), 35, 'Study', 'web_timer_screen_off')
    expect(outcome.pointsEarned).toBe(3)
    expect(outcome.pet.exp).toBe(defaultPet().exp + 3 * FREE_POINT_EXP)
  })

  it('is never a better deal than committing to a target', () => {
    // Ten minutes free pays the base rate; ten minutes against a met target
    // also pays the completion bonus. If this inverts, nobody would ever set
    // a goal again.
    const freeExp = FREE_POINT_EXP
    const targetedExp = expForSession(FREE_MINUTES_PER_POINT, FREE_MINUTES_PER_POINT)
    expect(targetedExp).toBeGreaterThan(freeExp)
  })

  it('tags the session so the analysis can separate the two timers', () => {
    const free = completeFreeSession(defaultPet(), 12, 'Study', 'web_timer_screen_off')
    expect(free.session.mode).toBe('free')
    expect(free.session.targetMinutes).toBe(0)

    const targeted = completeFocusSession(defaultPet(), 25, 25, 'Study', 'web_timer_screen_off')
    expect(targeted.session.mode).toBe('targeted')
  })

  it('still records the source, so an interrupted free session is flagged', () => {
    const outcome = completeFreeSession(defaultPet(), 12, 'Study', 'web_timer_screen_on')
    expect(outcome.session.source).toBe('web_timer_screen_on')
  })

  it('counts toward total focus minutes and the daily streak', () => {
    const outcome = completeFreeSession(defaultPet(), 12, 'Study', 'web_timer_screen_off')
    expect(outcome.pet.totalFocusMinutes).toBe(12)
    expect(outcome.pet.streakDays).toBe(1)
  })
})

describe('reminder schedule', () => {
  // A reminder is the app asking for the participant's attention, so its
  // trigger has to be something the study actually wants to encourage. It keys
  // off the last screen-free session, never off the pet's stats: "your pet is
  // starving" is a reason to pick the phone up, and this app cannot ship one.

  it('schedules nothing for a dead pet', () => {
    expect(nextAttentionAt(defaultPet({ isAlive: false }))).toBeNull()
  })

  it('is due a day after the last screen-free session', () => {
    const now = Date.now()
    const pet = defaultPet({ lastFocusTimestamp: now })
    expect(nextAttentionAt(pet, now)).toBe(now + REMINDER_AFTER_IDLE_HOURS * 3_600_000)
  })

  it('schedules nothing once the participant is already overdue', () => {
    // Nothing left to schedule; sending is the reminder script's job by then.
    const now = Date.now()
    const pet = defaultPet({ lastFocusTimestamp: now - 48 * HOUR })
    expect(nextAttentionAt(pet, now)).toBeNull()
  })

  it('ignores the pet stats entirely', () => {
    // Two pets, same session history, wildly different stats: identical
    // schedules. A starving pet must not buy the app an extra notification.
    const now = Date.now()
    const healthy = defaultPet({ lastFocusTimestamp: now, hunger: 100, health: 100 })
    const starving = defaultPet({ lastFocusTimestamp: now, hunger: 1, health: 10 })
    expect(nextAttentionAt(starving, now)).toBe(nextAttentionAt(healthy, now))
  })

  it('pushes the reminder back each time a session is completed', () => {
    const now = Date.now()
    const before = nextAttentionAt(defaultPet({ lastFocusTimestamp: now - 12 * HOUR }), now)
    const after = nextAttentionAt(defaultPet({ lastFocusTimestamp: now }), now)
    expect(after as number).toBeGreaterThan(before as number)
  })
})
