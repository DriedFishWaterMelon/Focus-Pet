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

export type PetPalette = readonly [string, string]

/**
 * Species is purely the pet's colour, and it is the one visual thing the player
 * owns: growth changes the silhouette, never the palette.
 *
 * Both were baked into the growth forms at first, which quietly discarded the
 * colour chosen during onboarding — the pet always came out the form's colour
 * and the picker did nothing.
 */
export const SPECIES_INFO: Record<
  PetSpecies,
  { name: string; palette: PetPalette; description: string }
> = {
  leaf: { name: 'เขียวใบไม้', palette: ['#10B981', '#84CC16'], description: 'สดชื่น เป็นธรรมชาติ' },
  flame: { name: 'ส้มเปลวไฟ', palette: ['#FF6B35', '#FFE600'], description: 'อบอุ่น มีพลัง' },
  water: { name: 'ฟ้าสายน้ำ', palette: ['#0EA5E9', '#00F5D4'], description: 'เย็นสบาย ใสสะอาด' },
  stone: { name: 'ม่วงศิลา', palette: ['#7B2FFF', '#A78BFA'], description: 'ลึกลับ สง่างาม' },
}

export function paletteOf(species: PetSpecies): PetPalette {
  return (SPECIES_INFO[species] ?? SPECIES_INFO.leaf).palette
}

/**
 * The silhouette a growth form is drawn from — shape only, no colour.
 *
 * Hand-drawing every form would be several things to keep in sync, so each one
 * declares which body, crown, particle, idle motion and aura it uses and
 * PetArt composes them. Adding a form is a data change, not a drawing.
 *
 * Colour deliberately lives outside this: it comes from the species the player
 * picked, so growing up never overwrites their choice.
 */
export interface PetShape {
  body: 'blob' | 'round' | 'tall' | 'wisp' | 'crystal'
  crown: 'none' | 'sprout' | 'leaf' | 'petal' | 'branch' | 'spike' | 'halo' | 'bloom'
  particle: 'none' | 'sparkle' | 'petal' | 'leaf' | 'dew' | 'star' | 'mist'
  idle: 'breathe' | 'sway' | 'float' | 'pulse' | 'shimmer'
  aura: 'none' | 'soft' | 'strong' | 'ring' | 'rays'
}

export interface Pet {
  name: string
  species: PetSpecies
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
  /**
   * Every minute ever banked in free mode. Points are derived from this rather
   * than stored separately, so the running total and the points cannot disagree.
   */
  freeMinutesTotal: number
  /** Points already paid out, so the same minutes are never paid for twice. */
  freePointsAwarded: number
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
  /**
   * Which timer produced this session. The analysis has to be able to separate
   * them: a targeted session is a commitment made in advance, a free one is
   * time noticed after the fact, and averaging the two hides that difference.
   */
  mode: SessionMode
}

export type SessionMode = 'targeted' | 'free'

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
