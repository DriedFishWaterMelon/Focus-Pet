// Domain model ported from the Android app (app/src/main/java/com/example/data/model/Models.kt).
// Field names are kept identical so the Firestore documents written by the Android
// app and by this web app stay compatible with each other.

export type PetStage = 'BABY' | 'JUVENILE' | 'ADULT' | 'MYSTIC' | 'LEGEND'

export const PET_STAGE_LABELS: Record<PetStage, string> = {
  BABY: 'Baby Sprout',
  JUVENILE: 'Playful Sprout',
  ADULT: 'Guardian Beast',
  MYSTIC: 'Mystic Elder',
  LEGEND: 'Celestial Spirit',
}

export type PetMood = 'ECSTATIC' | 'HAPPY' | 'CONTENT' | 'HUNGRY' | 'TIRED' | 'MEDITATING'

export const PET_MOOD_INFO: Record<PetMood, { emoji: string; label: string }> = {
  ECSTATIC: { emoji: '✨', label: 'Ecstatic & Blooming' },
  HAPPY: { emoji: '😊', label: 'Happy & Energetic' },
  CONTENT: { emoji: '🌿', label: 'Calm & Peaceful' },
  HUNGRY: { emoji: '🍽️', label: 'Tummy is Rumbling' },
  TIRED: { emoji: '😴', label: 'Drowsy & Resting' },
  MEDITATING: { emoji: '🧘', label: 'In Deep Focus' },
}

export interface Pet {
  name: string
  species: string
  /** 0 to 100 */
  hunger: number
  /** 0 to 100 */
  happiness: number
  /** 0 to 100 */
  energy: number
  exp: number
  level: number
  stage: PetStage
  totalFocusMinutes: number
  streakDays: number
  coins: number
  lastFedTimestamp: number
  lastFocusTimestamp: number
}

export interface ScreenFreeSession {
  id: string
  targetMinutes: number
  actualMinutes: number
  startTime: number
  endTime: number
  completed: boolean
  expEarned: number
  coinsEarned: number
  itemRewardName: string | null
  tag: string
  /** How the duration was established. Critical for research validity — see research.ts. */
  source: SessionSource
}

/**
 * Where a session's minutes came from. The research analysis must be able to tell
 * browser-timed sessions apart from self-reported ones, because they do not carry
 * the same evidential weight.
 */
export type SessionSource =
  /** Timed by the browser with the tab visible the whole time. Strongest evidence. */
  | 'web_timer_verified'
  /** Timed by the browser, but the user left the tab during the session. */
  | 'web_timer_interrupted'
  /** Typed in by the participant from their phone's Digital Wellbeing screen. */
  | 'self_reported'
  /** Measured by the Android companion app via UsageStatsManager. Strongest of all. */
  | 'android_usage_stats'

export type ItemCategory = 'FOOD' | 'TOY' | 'POTION' | 'BADGE'

export interface InventoryItem {
  id: string
  name: string
  category: ItemCategory
  iconEmoji: string
  quantity: number
  hungerBoost: number
  happinessBoost: number
  energyBoost: number
  description: string
  price: number
}

export interface UserProfile {
  uid: string
  displayName: string
  email: string | null
  photoUrl: string | null
  isAnonymous: boolean
  /** Study participant code, assigned at consent. Empty when not enrolled. */
  participantId: string
}
