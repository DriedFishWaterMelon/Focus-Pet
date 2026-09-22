// Game rules. The session reward formulas are ported 1:1 from the Android app
// (app/src/main/java/com/example/data/repository/PetRepository.kt) so a participant
// sees the same numbers on both clients. The survival systems below (decay,
// sickness, death, streaks, shop) are new and have no Android counterpart yet.
//
// Everything here is a pure function on purpose — these are the rules the research
// results depend on, so they need to be unit-testable without a browser or Firebase.

import type {
  RestReport,
  InventoryItem,
  Pet,
  PetMood,
  PetSpecies,
  PetStage,
  ScreenFreeSession,
  SessionSource,
} from './types'

// ---------------------------------------------------------------------------
// Balance constants
// ---------------------------------------------------------------------------

/**
 * Stat loss per minute spent inside this app.
 *
 * The pet responds to phone use, not to elapsed time. An earlier version
 * decayed per wall-clock hour, which punished precisely the behaviour the study
 * exists to produce: a participant who stayed off their phone for three days
 * came back to a dead pet, so the most successful person in the study got the
 * worst outcome. Time away now heals instead of harming.
 *
 * Minutes inside Focus Pet are the only phone use a browser can actually
 * measure, so they are what the pet feels moment to moment. An app that asks
 * people to look at screens less should be the first screen it discourages.
 *
 * Tuned so a quick check-in costs almost nothing, while an hour of wandering
 * around the app is plainly visible on the pet.
 */
export const DECAY_PER_APP_MINUTE = {
  hunger: 0.5,
  happiness: 0.4,
  energy: 0.6,
} as const

/**
 * Stat recovery per hour with the app closed, up to REST_CEILING.
 *
 * This is what makes the pet agree with the thesis rather than fight it:
 * putting the phone down is what makes it well. A night's sleep brings a tired
 * pet back.
 */
export const RECOVERY_PER_HOUR_AWAY = {
  hunger: 3,
  happiness: 3,
  energy: 4,
} as const

/**
 * Rest alone tops out here. Climbing above it takes food, play and screen-free
 * sessions, so caring for the pet still means something and the shop still has
 * a purpose — but simply being away can never hurt.
 */
export const REST_CEILING = 70

/**
 * Stat loss per minute of daily screen time above the allowance, applied once
 * when a participant reports a day's total.
 *
 * Self-reported and therefore weak evidence, which is why it is a gentle slope
 * rather than the main driver. It is here because this app's own usage is a
 * sliver of a participant's screen time, and without it the pet would be blind
 * to the very thing the study is about.
 */
export const DECAY_PER_SCREEN_MINUTE = 0.08
export const SCREEN_TIME_ALLOWANCE_MINUTES = 120

/** Health drains only while a core need is fully empty, and only from app use. */
export const HEALTH_DRAIN_PER_APP_MINUTE = 0.5

/** Health returns while the phone is down and every core need is above this. */
export const HEALTH_RECOVERY_PER_HOUR = 3
export const HEALTH_RECOVERY_THRESHOLD = 40

/** Below this the pet is visibly sick and needs medicine. */
export const SICK_THRESHOLD = 50

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value))

// ---------------------------------------------------------------------------
// Levels, stages, mood
// ---------------------------------------------------------------------------

export function stageFromLevel(level: number): PetStage {
  if (level >= 15) return 'LEGEND'
  if (level >= 10) return 'MYSTIC'
  if (level >= 6) return 'ADULT'
  if (level >= 3) return 'JUVENILE'
  return 'BABY'
}

export function levelFromExp(exp: number): number {
  return 1 + Math.floor(exp / 100)
}

export function expForNextLevel(pet: Pet): number {
  return pet.level * 100
}

export function expProgress(pet: Pet): number {
  return (pet.exp % 100) / 100
}

export function moodOf(pet: Pet): PetMood {
  if (!pet.isAlive) return 'DEAD'
  if (pet.health <= 20) return 'DYING'
  if (pet.health < SICK_THRESHOLD) return 'SICK'
  if (pet.hunger < 30) return 'HUNGRY'
  if (pet.energy < 25) return 'TIRED'
  if (pet.happiness >= 80 && pet.hunger >= 70) return 'ECSTATIC'
  if (pet.happiness >= 50) return 'HAPPY'
  return 'CONTENT'
}

// ---------------------------------------------------------------------------
// Dates and streaks
// ---------------------------------------------------------------------------

export function toIsoDate(timestamp: number): string {
  const date = new Date(timestamp)
  const offsetMs = date.getTimezoneOffset() * 60 * 1000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 10)
}

export function daysBetween(fromIso: string, toIso: string): number {
  const from = Date.parse(`${fromIso}T00:00:00Z`)
  const to = Date.parse(`${toIso}T00:00:00Z`)
  return Math.round((to - from) / 86_400_000)
}

/**
 * A real streak: it counts distinct days and it breaks.
 *
 * The Android app increments a counter on every session and never resets it,
 * so five sessions in one afternoon read as a five-day streak and a three-week
 * absence never clears it. That number cannot be reported as adherence.
 */
export function nextStreak(pet: Pet, todayIso: string): number {
  if (!pet.lastSessionDate) return 1
  const gap = daysBetween(pet.lastSessionDate, todayIso)
  if (gap <= 0) return Math.max(1, pet.streakDays) // same day, already counted
  if (gap === 1) return pet.streakDays + 1 // consecutive day
  return 1 // streak broken, this is day one again
}

/** True when the streak would be lost by not completing a session today. */
export function streakAtRisk(pet: Pet, todayIso: string): boolean {
  if (!pet.lastSessionDate || pet.streakDays === 0) return false
  return daysBetween(pet.lastSessionDate, todayIso) === 1
}

// ---------------------------------------------------------------------------
// Decay — the heart of the Tamagotchi loop
// ---------------------------------------------------------------------------

export function defaultPet(overrides: Partial<Pet> = {}): Pet {
  const now = Date.now()
  return {
    name: 'Sproutly',
    species: 'leaf',
    hunger: 85,
    happiness: 90,
    energy: 85,
    health: 100,
    exp: 0,
    level: 1,
    stage: 'BABY',
    totalFocusMinutes: 0,
    streakDays: 0,
    freeMinutesTotal: 0,
    freePointsAwarded: 0,
    lastSessionDate: '',
    coins: 150,
    lastTickAt: now,
    lastFedTimestamp: now,
    lastFocusTimestamp: now,
    bornAt: now,
    isAlive: true,
    diedAt: null,
    generation: 1,
    ...overrides,
  }
}

export interface DecayResult {
  pet: Pet
  report: RestReport | null
}

/**
 * Advances the pet to `now`.
 *
 * `inApp` says whether the elapsed span was spent with this app open and on
 * screen. It is called once a minute while it is, and once with `inApp: false`
 * when the app reopens after being closed, so one function covers both "the
 * participant is here on their phone" and "the participant was away from it".
 *
 * The two cases are exclusive by construction: a span is either app time, which
 * costs, or time away, which heals.
 */
export function applyDecay(pet: Pet, now: number = Date.now(), inApp = false): DecayResult {
  if (!pet.isAlive) return { pet, report: null }

  const elapsedMs = now - pet.lastTickAt
  const hours = elapsedMs / 3_600_000
  // Ignore trivial gaps so a page refresh does not nibble at the stats.
  if (hours < 0.01) return { pet, report: null }

  const appMinutes = inApp ? elapsedMs / 60_000 : 0
  const hoursAway = inApp ? 0 : hours

  const wasSick = pet.health < SICK_THRESHOLD

  const spend = (value: number, perMinute: number, perHour: number) =>
    rest(clamp(value - perMinute * appMinutes), perHour, hoursAway)

  const hunger = spend(pet.hunger, DECAY_PER_APP_MINUTE.hunger, RECOVERY_PER_HOUR_AWAY.hunger)
  const happiness = spend(
    pet.happiness,
    DECAY_PER_APP_MINUTE.happiness,
    RECOVERY_PER_HOUR_AWAY.happiness,
  )
  const energy = spend(pet.energy, DECAY_PER_APP_MINUTE.energy, RECOVERY_PER_HOUR_AWAY.energy)

  // Health responds to how long a need was actually empty, not just to its
  // final value, so a long stretch of heavy app use is penalised throughout
  // rather than only once.
  const inCrisis = Math.max(
    minutesAtZero(pet.hunger, DECAY_PER_APP_MINUTE.hunger, appMinutes),
    minutesAtZero(pet.happiness, DECAY_PER_APP_MINUTE.happiness, appMinutes),
    minutesAtZero(pet.energy, DECAY_PER_APP_MINUTE.energy, appMinutes),
  )

  let health = pet.health
  if (inCrisis > 0) {
    health = clamp(health - HEALTH_DRAIN_PER_APP_MINUTE * inCrisis)
  } else if (
    hunger >= HEALTH_RECOVERY_THRESHOLD &&
    happiness >= HEALTH_RECOVERY_THRESHOLD &&
    energy >= HEALTH_RECOVERY_THRESHOLD
  ) {
    health = clamp(health + HEALTH_RECOVERY_PER_HOUR * hoursAway)
  }

  const isAlive = health > 0
  const updated: Pet = {
    ...pet,
    hunger,
    happiness,
    energy,
    health,
    isAlive,
    diedAt: isAlive ? null : now,
    lastTickAt: now,
  }

  return {
    pet: updated,
    // Only time away is worth reporting back; the per-minute cost of being in
    // the app is something the player watches happen live.
    report:
      hoursAway > 0
        ? {
            hoursAway,
            hungerGained: hunger - pet.hunger,
            happinessGained: happiness - pet.happiness,
            energyGained: energy - pet.energy,
            healthGained: health - pet.health,
            recovered: wasSick && health >= SICK_THRESHOLD,
          }
        : null,
  }
}

/**
 * Raises a stat toward the rest ceiling.
 *
 * A stat already above the ceiling is left alone rather than pulled down to it,
 * so time away is never able to undo care the participant has already given.
 */
function rest(value: number, perHour: number, hoursAway: number): number {
  if (hoursAway <= 0 || value >= REST_CEILING) return value
  return Math.min(REST_CEILING, value + perHour * hoursAway)
}

/** How many of the elapsed app minutes a stat spent sitting at zero. */
function minutesAtZero(startValue: number, ratePerMinute: number, elapsedMinutes: number): number {
  const minutesUntilEmpty = startValue / ratePerMinute
  return Math.max(0, elapsedMinutes - minutesUntilEmpty)
}

/**
 * Applies the cost of a day's reported screen time.
 *
 * Called once when a participant logs a daily total. Minutes below the
 * allowance cost nothing: the goal is less screen time, not none, and a pet
 * that punished an ordinary day would just teach people to under-report.
 */
export function applyScreenTimePenalty(pet: Pet, reportedMinutes: number): Pet {
  if (!pet.isAlive) return pet
  const excess = Math.max(0, reportedMinutes - SCREEN_TIME_ALLOWANCE_MINUTES)
  if (excess === 0) return pet

  const cost = DECAY_PER_SCREEN_MINUTE * excess
  return {
    ...pet,
    hunger: clamp(pet.hunger - cost),
    happiness: clamp(pet.happiness - cost),
    energy: clamp(pet.energy - cost),
  }
}

/** Hunger below this reads as hungry, both for mood and for reminders. */
export const HUNGRY_THRESHOLD = 30

/** A day without a screen-free session is when a nudge is worth sending. */
export const REMINDER_AFTER_IDLE_HOURS = 24

/**
 * When this participant is next worth nudging, as a timestamp.
 *
 * It deliberately keys off the last screen-free session rather than off the
 * pet's stats. Reminding someone that their pet is starving would be a
 * reminder to open the app, and this study cannot ship an app that manufactures
 * reasons to pick the phone up. The only honest nudge is an invitation to put
 * it down again, so it goes out when a day has passed without a session.
 *
 * Computed here and stored on the pet so the reminder script does not have to
 * re-implement the rule and let the two copies drift.
 *
 * Returns null for a dead pet, and for one whose participant is already overdue
 * — there is nothing left to schedule in either case.
 */
export function nextAttentionAt(pet: Pet, now: number = Date.now()): number | null {
  if (!pet.isAlive) return null

  const dueAt = pet.lastFocusTimestamp + REMINDER_AFTER_IDLE_HOURS * 3_600_000
  return dueAt <= now ? null : dueAt
}

/**
 * Minutes of continuous app use that would kill this pet from its current
 * state, which is the only way it can now die.
 *
 * Nothing about being away shortens this. It exists so the app can warn a
 * participant who is spending a long stretch inside it, which is the one
 * behaviour the pet is meant to discourage.
 */
export function appMinutesUntilDeath(pet: Pet): number {
  if (!pet.isAlive) return 0
  const minutesUntilStarving = pet.hunger / DECAY_PER_APP_MINUTE.hunger
  return minutesUntilStarving + pet.health / HEALTH_DRAIN_PER_APP_MINUTE
}

// ---------------------------------------------------------------------------
// Death and rebirth
// ---------------------------------------------------------------------------

/**
 * Hatches a replacement pet after a death.
 *
 * Level, EXP and coins reset — the pet is genuinely gone — but totalFocusMinutes
 * carries over, because those minutes are the participant's real screen-free time
 * and must never be erased by a game event.
 */
export function hatchNewPet(previous: Pet, name: string, species: PetSpecies): Pet {
  return defaultPet({
    name,
    species,
    totalFocusMinutes: previous.totalFocusMinutes,
    generation: previous.generation + 1,
  })
}

// ---------------------------------------------------------------------------
// Session rewards (ported from Android)
// ---------------------------------------------------------------------------

export function expForSession(actualMinutes: number, targetMinutes: number): number {
  return actualMinutes * 2 + (actualMinutes >= targetMinutes ? 20 : 5)
}

export function coinsForSession(actualMinutes: number): number {
  return actualMinutes + Math.floor(actualMinutes / 5) * 2
}

export function rewardItemFor(actualMinutes: number): string | null {
  if (actualMinutes >= 45) return 'Golden Honey Apple'
  if (actualMinutes >= 25) return 'Matcha Focus Brew'
  if (actualMinutes >= 15) return 'Crisp Forest Berry'
  return null
}

export interface SessionOutcome {
  session: Omit<ScreenFreeSession, 'id'>
  pet: Pet
  leveledUp: boolean
  evolved: boolean
}

export function completeFocusSession(
  currentPet: Pet,
  targetMinutes: number,
  actualMinutes: number,
  tag: string,
  source: SessionSource,
  now: number = Date.now(),
): SessionOutcome {
  const expEarned = expForSession(actualMinutes, targetMinutes)
  const coinsEarned = coinsForSession(actualMinutes)
  const todayIso = toIsoDate(now)

  const session: Omit<ScreenFreeSession, 'id'> = {
    targetMinutes,
    actualMinutes,
    startTime: now - actualMinutes * 60 * 1000,
    endTime: now,
    completed: actualMinutes >= targetMinutes,
    expEarned,
    coinsEarned,
    itemRewardName: rewardItemFor(actualMinutes),
    tag,
    source,
    mode: 'targeted',
  }

  const newExp = currentPet.exp + expEarned
  const newLevel = levelFromExp(newExp)
  const newStage = stageFromLevel(newLevel)

  const pet: Pet = {
    ...currentPet,
    totalFocusMinutes: currentPet.totalFocusMinutes + actualMinutes,
    exp: newExp,
    level: newLevel,
    stage: newStage,
    happiness: clamp(currentPet.happiness + 20),
    // Screen-free time rejuvenates energy rather than draining it — this inversion
    // is the core idea of the project ("reward for inaction").
    energy: clamp(currentPet.energy + 15),
    coins: currentPet.coins + coinsEarned,
    streakDays: nextStreak(currentPet, todayIso),
    lastSessionDate: todayIso,
    lastFocusTimestamp: now,
  }

  return {
    session,
    pet,
    leveledUp: newLevel > currentPet.level,
    evolved: newStage !== currentPet.stage,
  }
}

// ---------------------------------------------------------------------------
// Free mode
// ---------------------------------------------------------------------------

/** Minutes of open-ended screen-free time that earn one point. */
export const FREE_MINUTES_PER_POINT = 10

/**
 * What one free point pays.
 *
 * Deliberately the base rate for ten minutes with no completion bonus, because
 * free mode has no target to complete. Ten minutes of a targeted session pays
 * 20 EXP plus a 20 bonus; ten minutes of free time pays the 20 alone. Free mode
 * is therefore never the better deal, which keeps committing to a goal worth
 * doing while still rewarding time the participant only noticed afterwards.
 */
export const FREE_POINT_EXP = FREE_MINUTES_PER_POINT * 2
export const FREE_POINT_COINS = coinsForSession(FREE_MINUTES_PER_POINT)

/** Total points a lifetime of banked free minutes is worth. */
export function freePointsFor(totalMinutes: number): number {
  return Math.floor(totalMinutes / FREE_MINUTES_PER_POINT)
}

/** Minutes counted toward the point currently being earned. */
export function freeProgressMinutes(totalMinutes: number): number {
  return Math.floor(totalMinutes) % FREE_MINUTES_PER_POINT
}

/** Minutes still needed for the next point. */
export function minutesToNextFreePoint(totalMinutes: number): number {
  return FREE_MINUTES_PER_POINT - freeProgressMinutes(totalMinutes)
}

export interface FreeSessionOutcome {
  session: Omit<ScreenFreeSession, 'id'>
  pet: Pet
  /** Points granted by this session. Zero when it did not cross a ten-minute mark. */
  pointsEarned: number
  leveledUp: boolean
  evolved: boolean
}

/**
 * Banks an open-ended session.
 *
 * Points are computed from the lifetime total rather than from this session
 * alone, so seven minutes today and four tomorrow still pay out. Time is never
 * rounded away just because one sitting fell short of ten minutes — which is
 * the whole point of a mode you can start without committing to a target.
 */
export function completeFreeSession(
  currentPet: Pet,
  actualMinutes: number,
  tag: string,
  source: SessionSource,
  now: number = Date.now(),
): FreeSessionOutcome {
  const bankedTotal = currentPet.freeMinutesTotal + actualMinutes
  const pointsEarned = Math.max(0, freePointsFor(bankedTotal) - currentPet.freePointsAwarded)

  const expEarned = pointsEarned * FREE_POINT_EXP
  const coinsEarned = pointsEarned * FREE_POINT_COINS
  const todayIso = toIsoDate(now)

  const session: Omit<ScreenFreeSession, 'id'> = {
    targetMinutes: 0,
    actualMinutes,
    startTime: now - actualMinutes * 60 * 1000,
    endTime: now,
    // There is no target, so "completed" has no meaning here. It stays false
    // and the analysis should read `mode` instead of inferring from it.
    completed: false,
    expEarned,
    coinsEarned,
    itemRewardName: null,
    tag,
    source,
    mode: 'free',
  }

  const newExp = currentPet.exp + expEarned
  const newLevel = levelFromExp(newExp)
  const newStage = stageFromLevel(newLevel)

  const pet: Pet = {
    ...currentPet,
    totalFocusMinutes: currentPet.totalFocusMinutes + actualMinutes,
    freeMinutesTotal: bankedTotal,
    freePointsAwarded: currentPet.freePointsAwarded + pointsEarned,
    exp: newExp,
    level: newLevel,
    stage: newStage,
    // Smaller than a targeted session's +20/+15: the same inversion, scaled to
    // the lighter commitment.
    happiness: clamp(currentPet.happiness + 10),
    energy: clamp(currentPet.energy + 8),
    coins: currentPet.coins + coinsEarned,
    streakDays: nextStreak(currentPet, todayIso),
    lastSessionDate: todayIso,
    lastFocusTimestamp: now,
  }

  return {
    session,
    pet,
    pointsEarned,
    leveledUp: newLevel > currentPet.level,
    evolved: newStage !== currentPet.stage,
  }
}

// ---------------------------------------------------------------------------
// Caring for the pet
// ---------------------------------------------------------------------------

export function feedPet(currentPet: Pet, item: InventoryItem): Pet | null {
  if (item.quantity <= 0) return null
  if (!currentPet.isAlive) return null

  const newExp = currentPet.exp + 10
  const newLevel = levelFromExp(newExp)

  return {
    ...currentPet,
    hunger: clamp(currentPet.hunger + item.hungerBoost),
    happiness: clamp(currentPet.happiness + item.happinessBoost),
    energy: clamp(currentPet.energy + item.energyBoost),
    health: clamp(currentPet.health + item.healthBoost),
    exp: newExp,
    level: newLevel,
    stage: stageFromLevel(newLevel),
    lastFedTimestamp: Date.now(),
  }
}

export function playWithPet(currentPet: Pet): Pet | null {
  if (!currentPet.isAlive) return null

  const newExp = currentPet.exp + 5
  const newLevel = levelFromExp(newExp)

  return {
    ...currentPet,
    happiness: clamp(currentPet.happiness + 15),
    energy: clamp(currentPet.energy - 8),
    exp: newExp,
    level: newLevel,
    stage: stageFromLevel(newLevel),
  }
}

// ---------------------------------------------------------------------------
// Shop
// ---------------------------------------------------------------------------

export interface PurchaseResult {
  pet: Pet
  inventory: InventoryItem[]
}

/**
 * Spends coins on an item. Until this existed, coins accumulated forever with
 * nothing to spend them on, and the `price` field on InventoryItem was dead code.
 */
export function buyItem(
  pet: Pet,
  inventory: InventoryItem[],
  itemId: string,
): PurchaseResult | null {
  const item = SHOP_CATALOG.find((entry) => entry.id === itemId)
  if (!item) return null
  if (pet.coins < item.price) return null

  const existing = inventory.find((entry) => entry.id === itemId)
  const nextInventory = existing
    ? inventory.map((entry) =>
        entry.id === itemId ? { ...entry, quantity: entry.quantity + 1 } : entry,
      )
    : [...inventory, { ...item, quantity: 1 }]

  return {
    pet: { ...pet, coins: pet.coins - item.price },
    inventory: nextInventory,
  }
}

export function grantItem(inventory: InventoryItem[], itemId: string): InventoryItem[] {
  const existing = inventory.find((entry) => entry.id === itemId)
  if (existing) {
    return inventory.map((entry) =>
      entry.id === itemId ? { ...entry, quantity: entry.quantity + 1 } : entry,
    )
  }
  const template = SHOP_CATALOG.find((entry) => entry.id === itemId)
  return template ? [...inventory, { ...template, quantity: 1 }] : inventory
}

export const SHOP_CATALOG: InventoryItem[] = [
  {
    id: 'berry_crisp',
    name: 'เบอร์รีป่ากรอบ',
    category: 'FOOD',
    iconEmoji: '🫐',
    quantity: 0,
    hungerBoost: 25,
    happinessBoost: 15,
    energyBoost: 10,
    healthBoost: 0,
    description: 'เบอร์รีออร์แกนิกเก็บจากการเดินเล่นตอนไม่เล่นมือถือ',
    price: 25,
  },
  {
    id: 'golden_apple',
    name: 'แอปเปิลน้ำผึ้งทองคำ',
    category: 'FOOD',
    iconEmoji: '🍎',
    quantity: 0,
    hungerBoost: 50,
    happinessBoost: 30,
    energyBoost: 25,
    healthBoost: 5,
    description: 'ผลไม้หายาก บำรุงทั้งกายและใจ ฟื้นพลังได้มหาศาล',
    price: 60,
  },
  {
    id: 'energy_potion',
    name: 'ชาเขียวมัทฉะเพิ่มสมาธิ',
    category: 'POTION',
    iconEmoji: '🍵',
    quantity: 0,
    hungerBoost: 5,
    happinessBoost: 20,
    energyBoost: 45,
    healthBoost: 0,
    description: 'ยาเขียวเข้มข้น ฟื้นความกระปรี้กระเปร่าให้สัตว์เลี้ยง',
    price: 45,
  },
  {
    id: 'medicine',
    name: 'ยาสมุนไพรวิเศษ',
    category: 'MEDICINE',
    iconEmoji: '💊',
    quantity: 0,
    hungerBoost: 0,
    happinessBoost: 5,
    energyBoost: 10,
    healthBoost: 45,
    description: 'ใช้รักษาตอนสัตว์เลี้ยงป่วย ฟื้นพลังชีวิตทันที',
    price: 80,
  },
  {
    id: 'yarn_ball',
    name: 'ขนนกเรืองแสง',
    category: 'TOY',
    iconEmoji: '🪶',
    quantity: 0,
    hungerBoost: -5,
    happinessBoost: 35,
    energyBoost: -10,
    healthBoost: 0,
    description: 'ของเล่นที่ทำให้เพื่อนตัวน้อยกระโดดด้วยความดีใจ',
    price: 50,
  },
  {
    id: 'star_crystal',
    name: 'ผงดาวสวรรค์',
    category: 'BADGE',
    iconEmoji: '⭐',
    quantity: 0,
    hungerBoost: 10,
    happinessBoost: 50,
    energyBoost: 30,
    healthBoost: 20,
    description: 'ผงดาวในตำนาน ได้จากการทำสมาธิต่อเนื่องเกิน 60 นาที',
    price: 100,
  },
]

export function defaultInventory(): InventoryItem[] {
  return [
    { ...SHOP_CATALOG[0], quantity: 3 },
    { ...SHOP_CATALOG[3], quantity: 1 },
  ]
}

/** Maps a reward item name back to the inventory id. */
export function itemIdForRewardName(name: string): string {
  if (name === 'Golden Honey Apple') return 'golden_apple'
  if (name === 'Matcha Focus Brew') return 'energy_potion'
  return 'berry_crisp'
}
