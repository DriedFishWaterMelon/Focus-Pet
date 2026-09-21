// Game rules ported 1:1 from the Android app so that a participant sees the same
// numbers on web and on the phone. Source of truth for the original formulas:
// app/src/main/java/com/example/data/repository/PetRepository.kt
//
// Everything here is a pure function on purpose — these are the rules the research
// results depend on, so they need to be unit-testable without a browser or Firebase.

import type { InventoryItem, Pet, PetMood, PetStage, ScreenFreeSession, SessionSource } from './types'

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
  if (pet.hunger < 30) return 'HUNGRY'
  if (pet.energy < 25) return 'TIRED'
  if (pet.happiness >= 80 && pet.hunger >= 70) return 'ECSTATIC'
  if (pet.happiness >= 50) return 'HAPPY'
  return 'CONTENT'
}

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value))

export function defaultPet(): Pet {
  const now = Date.now()
  return {
    name: 'Sproutly',
    species: 'Leafy Sprout',
    hunger: 85,
    happiness: 90,
    energy: 85,
    exp: 80,
    level: 1,
    stage: 'BABY',
    totalFocusMinutes: 0,
    streakDays: 0,
    coins: 150,
    lastFedTimestamp: now,
    lastFocusTimestamp: now,
  }
}

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
}

export function completeFocusSession(
  currentPet: Pet,
  targetMinutes: number,
  actualMinutes: number,
  tag: string,
  source: SessionSource,
): SessionOutcome {
  const expEarned = expForSession(actualMinutes, targetMinutes)
  const coinsEarned = coinsForSession(actualMinutes)
  const now = Date.now()

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
  }

  const newExp = currentPet.exp + expEarned
  const newLevel = levelFromExp(newExp)

  const pet: Pet = {
    ...currentPet,
    totalFocusMinutes: currentPet.totalFocusMinutes + actualMinutes,
    exp: newExp,
    level: newLevel,
    stage: stageFromLevel(newLevel),
    happiness: clamp(currentPet.happiness + 20),
    // Screen-free time rejuvenates energy rather than draining it — this inversion
    // is the core idea of the project ("reward for inaction").
    energy: clamp(currentPet.energy + 15),
    coins: currentPet.coins + coinsEarned,
    streakDays: currentPet.streakDays + 1,
    lastFocusTimestamp: now,
  }

  return { session, pet }
}

export function feedPet(currentPet: Pet, item: InventoryItem): Pet | null {
  if (item.quantity <= 0) return null

  const newExp = currentPet.exp + 10
  const newLevel = levelFromExp(newExp)

  return {
    ...currentPet,
    hunger: clamp(currentPet.hunger + item.hungerBoost),
    happiness: clamp(currentPet.happiness + item.happinessBoost),
    energy: clamp(currentPet.energy + item.energyBoost),
    exp: newExp,
    level: newLevel,
    stage: stageFromLevel(newLevel),
    lastFedTimestamp: Date.now(),
  }
}

export function playWithPet(currentPet: Pet): Pet {
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

export function defaultInventory(): InventoryItem[] {
  return [
    {
      id: 'berry_crisp',
      name: 'Crisp Forest Berry',
      category: 'FOOD',
      iconEmoji: '🫐',
      quantity: 5,
      hungerBoost: 25,
      happinessBoost: 15,
      energyBoost: 10,
      description: 'Sweet organic berry collected during screen-free nature walks.',
      price: 25,
    },
    {
      id: 'golden_apple',
      name: 'Golden Honey Apple',
      category: 'FOOD',
      iconEmoji: '🍎',
      quantity: 2,
      hungerBoost: 50,
      happinessBoost: 30,
      energyBoost: 25,
      description: 'Rare fruit that nourishes body and mind. Huge vitality boost!',
      price: 60,
    },
    {
      id: 'energy_potion',
      name: 'Matcha Focus Brew',
      category: 'POTION',
      iconEmoji: '🍵',
      quantity: 3,
      hungerBoost: 5,
      happinessBoost: 20,
      energyBoost: 45,
      description: 'Concentrated green elixir that revitalizes pet stamina.',
      price: 45,
    },
    {
      id: 'yarn_ball',
      name: 'Glow Feather Toy',
      category: 'TOY',
      iconEmoji: '🪶',
      quantity: 1,
      hungerBoost: -5,
      happinessBoost: 35,
      energyBoost: -10,
      description: 'Interactive toy that makes your companion jump with joy!',
      price: 50,
    },
    {
      id: 'star_crystal',
      name: 'Celestial Stardust',
      category: 'BADGE',
      iconEmoji: '⭐',
      quantity: 1,
      hungerBoost: 10,
      happinessBoost: 50,
      energyBoost: 30,
      description: 'Mythic stardust dropped after achieving 60+ min focus sessions.',
      price: 100,
    },
  ]
}

/** Maps a reward item name back to the inventory id the Android app uses. */
export function itemIdForRewardName(name: string): string {
  if (name === 'Golden Honey Apple') return 'golden_apple'
  if (name === 'Matcha Focus Brew') return 'energy_potion'
  return 'berry_crisp'
}
