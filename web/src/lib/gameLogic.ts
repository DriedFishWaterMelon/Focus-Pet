// Game rules. The session reward formulas are ported 1:1 from the Android app
// (app/src/main/java/com/example/data/repository/PetRepository.kt) so a participant
// sees the same numbers on both clients. The survival systems below (decay,
// sickness, death, streaks, shop) are new and have no Android counterpart yet.
//
// Everything here is a pure function on purpose — these are the rules the research
// results depend on, so they need to be unit-testable without a browser or Firebase.

import type {
  AwayReport,
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
 * Stat loss per hour of neglect. Tuned so a fully cared-for pet takes roughly
 * 40 hours to become hungry enough to start losing health, and about 65 hours
 * of total neglect to die — a bit under three days. Long enough that missing a
 * day is survivable, short enough that the pet genuinely depends on the user.
 */
export const DECAY_PER_HOUR = {
  hunger: 2.5,
  happiness: 2,
  energy: 1.5,
} as const

/** Health drains only while a core need is fully empty. */
export const HEALTH_DRAIN_PER_HOUR = 4

/** Health slowly returns once every core need is back above this level. */
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
  report: AwayReport | null
}

/**
 * Applies everything that should have happened while the app was closed.
 *
 * Decay is derived from elapsed wall-clock time rather than from a running timer,
 * because the page is usually not open. Closing the tab must not pause the pet —
 * that is what makes the pet feel like it exists independently of the app.
 */
export function applyDecay(pet: Pet, now: number = Date.now()): DecayResult {
  if (!pet.isAlive) return { pet, report: null }

  const elapsedMs = now - pet.lastTickAt
  const hours = elapsedMs / 3_600_000
  // Ignore trivial gaps so a page refresh does not nibble at the stats.
  if (hours < 0.01) return { pet, report: null }

  const wasSick = pet.health < SICK_THRESHOLD

  const hunger = clamp(pet.hunger - DECAY_PER_HOUR.hunger * hours)
  const happiness = clamp(pet.happiness - DECAY_PER_HOUR.happiness * hours)
  const energy = clamp(pet.energy - DECAY_PER_HOUR.energy * hours)

  // Health responds to how long a need was actually empty, not just to its final
  // value, so a long absence is penalised correctly rather than only once.
  const hoursStarving = hoursAtZero(pet.hunger, DECAY_PER_HOUR.hunger, hours)
  const hoursMiserable = hoursAtZero(pet.happiness, DECAY_PER_HOUR.happiness, hours)
  const hoursExhausted = hoursAtZero(pet.energy, DECAY_PER_HOUR.energy, hours)
  const hoursInCrisis = Math.max(hoursStarving, hoursMiserable, hoursExhausted)

  let health = pet.health
  if (hoursInCrisis > 0) {
    health = clamp(health - HEALTH_DRAIN_PER_HOUR * hoursInCrisis)
  } else if (
    pet.hunger >= HEALTH_RECOVERY_THRESHOLD &&
    pet.happiness >= HEALTH_RECOVERY_THRESHOLD &&
    pet.energy >= HEALTH_RECOVERY_THRESHOLD
  ) {
    health = clamp(health + HEALTH_RECOVERY_PER_HOUR * hours)
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
    report: {
      hoursAway: hours,
      hungerLost: pet.hunger - hunger,
      happinessLost: pet.happiness - happiness,
      energyLost: pet.energy - energy,
      healthLost: pet.health - health,
      died: !isAlive,
      becameSick: !wasSick && health < SICK_THRESHOLD && isAlive,
    },
  }
}

/** How many of the elapsed hours a stat spent sitting at zero. */
function hoursAtZero(startValue: number, ratePerHour: number, elapsedHours: number): number {
  const hoursUntilEmpty = startValue / ratePerHour
  return Math.max(0, elapsedHours - hoursUntilEmpty)
}

/** Hours of total neglect before this pet would die, from its current state. */
export function hoursUntilDeath(pet: Pet): number {
  if (!pet.isAlive) return 0
  const hoursUntilStarving = pet.hunger / DECAY_PER_HOUR.hunger
  return hoursUntilStarving + pet.health / HEALTH_DRAIN_PER_HOUR
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
