// Domain model. Originally ported from the Android app
// (app/src/main/java/com/example/data/model/Models.kt) and since extended with
// the survival systems (decay, sickness, death) that the Android version lacks.

export type PetStage = 'BABY' | 'JUVENILE' | 'ADULT' | 'MYSTIC' | 'LEGEND'

export const PET_STAGE_LABELS: Record<PetStage, string> = {
  BABY: 'Baby Sprout',
  JUVENILE: 'Playful Sprout',
  ADULT: 'Guardian Beast',
  MYSTIC: 'Mystic Elder',
  LEGEND: 'Celestial Spirit',
}

export const PET_STAGE_LABELS_TH: Record<PetStage, string> = {
  BABY: 'เจ้าหน่อน้อย',
  JUVENILE: 'หน่อซุกซน',
  ADULT: 'ผู้พิทักษ์',
  MYSTIC: 'ผู้เฒ่าลี้ลับ',
  LEGEND: 'วิญญาณสวรรค์',
}

export type PetMood =
  | 'ECSTATIC'
  | 'HAPPY'
  | 'CONTENT'
  | 'HUNGRY'
  | 'TIRED'
  | 'MEDITATING'
  | 'SICK'
  | 'DYING'
  | 'DEAD'

export const PET_MOOD_INFO: Record<PetMood, { emoji: string; label: string }> = {
  ECSTATIC: { emoji: '✨', label: 'มีความสุขสุด ๆ' },
  HAPPY: { emoji: '😊', label: 'ร่าเริงแจ่มใส' },
  CONTENT: { emoji: '🌿', label: 'สงบ สบายใจ' },
  HUNGRY: { emoji: '🍽️', label: 'ท้องร้องแล้ว' },
  TIRED: { emoji: '😴', label: 'ง่วงนอน หมดแรง' },
  MEDITATING: { emoji: '🧘', label: 'กำลังทำสมาธิ' },
  SICK: { emoji: '🤒', label: 'ไม่สบาย ต้องการการดูแล' },
  DYING: { emoji: '💔', label: 'อ่อนแอมาก ใกล้จะไม่ไหวแล้ว' },
  DEAD: { emoji: '🪦', label: 'จากไปแล้ว' },
}

export type PetSpecies = 'leaf' | 'flame' | 'water' | 'stone'

export const SPECIES_INFO: Record<
  PetSpecies,
  { name: string; color: string; description: string }
> = {
  leaf: { name: 'หน่อไม้ใบเขียว', color: '#10b981', description: 'ใจเย็น โตสม่ำเสมอ' },
  flame: { name: 'เปลวไฟน้อย', color: '#f59e0b', description: 'กระตือรือร้น ชอบท้าทาย' },
  water: { name: 'หยดน้ำใส', color: '#0ea5e9', description: 'อ่อนโยน ปรับตัวเก่ง' },
  stone: { name: 'ก้อนหินมีชีวิต', color: '#8b5cf6', description: 'อดทน ไม่ยอมแพ้ง่าย' },
}

/**
 * Visual traits a form is drawn from.
 *
 * Fifteen hand-drawn pets would be fifteen things to keep in sync, so each form
 * instead declares which body, crown, particle, idle motion and aura it uses and
 * PetCanvas composes them. Adding a form is a data change, not a drawing.
 */
export interface PetVisual {
  /** Body colour and accent. */
  palette: [string, string]
  body: 'blob' | 'round' | 'tall' | 'wisp' | 'crystal'
  crown: 'none' | 'sprout' | 'leaf' | 'petal' | 'branch' | 'spike' | 'halo' | 'bloom'
  particle: 'none' | 'sparkle' | 'petal' | 'leaf' | 'dew' | 'star' | 'mist'
  idle: 'breathe' | 'sway' | 'float' | 'pulse' | 'shimmer'
  aura: 'none' | 'soft' | 'strong' | 'ring' | 'rays'
}

export interface Pet {
  name: string
  species: PetSpecies
  /**
   * The forms this pet has grown through, root first. The last entry is the
   * current form. Storing the whole path rather than just the current node is
   * what lets the tree view show the road taken and grey out what was closed
   * off by earlier choices.
   */
  evolutionPath: string[]
  /** 0 to 100 */
  hunger: number
  /** 0 to 100 */
  happiness: number
  /** 0 to 100 */
  energy: number
  /**
   * 0 to 100. Only falls while a core stat is fully depleted, and it is what
   * actually kills the pet. Recovers slowly once the pet is cared for again.
   */
  health: number
  exp: number
  level: number
  stage: PetStage
  totalFocusMinutes: number
  streakDays: number
  /** ISO date (YYYY-MM-DD) of the most recent completed session, for the streak. */
  lastSessionDate: string
  coins: number
  /** When decay was last applied. Decay is derived from elapsed wall-clock time. */
  lastTickAt: number
  lastFedTimestamp: number
  lastFocusTimestamp: number
  bornAt: number
  isAlive: boolean
  diedAt: number | null
  /** Which pet this is: the first is 1, the one hatched after a death is 2, etc. */
  generation: number
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
  /** How the duration was established. Critical for research validity. */
  source: SessionSource
}

/**
 * Where a session's minutes came from. The research analysis must be able to tell
 * browser-timed sessions apart from self-reported ones, because they do not carry
 * the same evidential weight.
 */
export type SessionSource =
  /** Timed by the browser with the tab visible the whole time. Strongest on web. */
  | 'web_timer_verified'
  /** Timed by the browser, but the user left the tab during the session. */
  | 'web_timer_interrupted'
  /** Typed in by the participant from their phone's Digital Wellbeing screen. */
  | 'self_reported'
  /** Measured by the Android companion app via UsageStatsManager. Strongest of all. */
  | 'android_usage_stats'

export type ItemCategory = 'FOOD' | 'TOY' | 'POTION' | 'BADGE' | 'MEDICINE'

export interface InventoryItem {
  id: string
  name: string
  category: ItemCategory
  iconEmoji: string
  quantity: number
  hungerBoost: number
  happinessBoost: number
  energyBoost: number
  healthBoost: number
  description: string
  price: number
}

export interface Achievement {
  id: string
  name: string
  description: string
  iconEmoji: string
  unlockedAt: number | null
}

export interface UserProfile {
  uid: string
  displayName: string
  email: string | null
  photoUrl: string | null
  isAnonymous: boolean
  /** Study participant code, claimed at consent. Empty when not enrolled. */
  participantId: string
  /** False until the participant has named their first pet. */
  onboarded: boolean
  /** Enrolment state. See EnrolmentStatus for why this is not a boolean. */
  enrolment: Enrolment
}

/**
 * Research enrolment, kept deliberately separate from the game state so that
 * declining or withdrawing never blocks someone from using the app.
 *
 * `undecided` and `declined` are distinct: undecided means the consent sheet
 * has not been answered yet, declined means the person read it and said no.
 * Collapsing them into one boolean would make it impossible to tell a refusal
 * from an unfinished sign-up when reporting recruitment numbers.
 */
export type EnrolmentStatus = 'undecided' | 'consented' | 'declined' | 'withdrawn'

export interface Enrolment {
  status: EnrolmentStatus
  /** Which version of the consent text this person actually agreed to. */
  consentVersion: string | null
  consentedAt: number | null
  participantIdSetAt: number | null
  withdrawnAt: number | null
}

export function emptyEnrolment(): Enrolment {
  return {
    status: 'undecided',
    consentVersion: null,
    consentedAt: null,
    participantIdSetAt: null,
    withdrawnAt: null,
  }
}

/** Research data may only be written while this is true. */
export function isEnrolled(enrolment: Enrolment): boolean {
  return enrolment.status === 'consented'
}

/** What happened to the pet while the app was closed, shown on the next open. */
export interface AwayReport {
  hoursAway: number
  hungerLost: number
  happinessLost: number
  energyLost: number
  healthLost: number
  died: boolean
  becameSick: boolean
}
