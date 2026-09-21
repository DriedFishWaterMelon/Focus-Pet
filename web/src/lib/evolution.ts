// Linear growth.
//
// The pet grows through five fixed forms as its level rises. There is no branch
// and no choice: the form is a pure function of the level, which means it needs
// no stored state, no migration for older saves, and no way to get out of sync.
//
// The thresholds are `stageFromLevel` in gameLogic.ts — the same ones ported
// from the Android app and covered by its tests — so a participant sees the
// same stage on both clients and the achievements that key on PetStage keep
// working untouched.

import { stageFromLevel } from './gameLogic'
import type { Pet, PetStage, PetVisual } from './types'

export interface GrowthForm {
  stage: PetStage
  name: string
  description: string
  /** Level at which this form appears. Mirrors stageFromLevel. */
  level: number
  visual: PetVisual
}

/** The growth line, in order. */
export const GROWTH_FORMS: GrowthForm[] = [
  {
    stage: 'BABY',
    name: 'เมล็ดน้อย',
    description: 'เพิ่งงอกออกมา ยังเล็กและต้องการการดูแลใกล้ชิด',
    level: 1,
    visual: {
      palette: ['#10B981', '#34D399'],
      body: 'blob',
      crown: 'sprout',
      particle: 'none',
      idle: 'breathe',
      aura: 'soft',
    },
  },
  {
    stage: 'JUVENILE',
    name: 'หน่อซุกซน',
    description: 'แตกใบอ่อนแล้ว เริ่มแข็งแรงและอยากรู้อยากเห็น',
    level: 3,
    visual: {
      palette: ['#FFE600', '#FF6B35'],
      body: 'blob',
      crown: 'leaf',
      particle: 'sparkle',
      idle: 'breathe',
      aura: 'rays',
    },
  },
  {
    stage: 'ADULT',
    name: 'ผกาบาน',
    description: 'ผลิดอกครั้งแรก เป็นสัญญาณว่าการดูแลของคุณได้ผล',
    level: 6,
    visual: {
      palette: ['#FF3AF2', '#FB7185'],
      body: 'round',
      crown: 'petal',
      particle: 'petal',
      idle: 'sway',
      aura: 'soft',
    },
  },
  {
    stage: 'MYSTIC',
    name: 'ร่มไทรใหญ่',
    description: 'แผ่กิ่งก้านมั่นคง รากหยั่งลึกจนไม่มีอะไรสั่นคลอนได้',
    level: 10,
    visual: {
      palette: ['#059669', '#84CC16'],
      body: 'tall',
      crown: 'branch',
      particle: 'leaf',
      idle: 'sway',
      aura: 'ring',
    },
  },
  {
    stage: 'LEGEND',
    name: 'วิญญาณสวรรค์',
    description: 'เปล่งแสงได้เอง ร่างสูงสุดของการเดินทางครั้งนี้',
    level: 15,
    visual: {
      palette: ['#00F5D4', '#FFE600'],
      body: 'crystal',
      crown: 'bloom',
      particle: 'star',
      idle: 'shimmer',
      aura: 'strong',
    },
  },
]

const BY_STAGE: Record<PetStage, GrowthForm> = GROWTH_FORMS.reduce(
  (acc, form) => ({ ...acc, [form.stage]: form }),
  {} as Record<PetStage, GrowthForm>,
)

export function formForStage(stage: PetStage): GrowthForm {
  return BY_STAGE[stage] ?? GROWTH_FORMS[0]
}

/** The form the pet is in, derived from its level. */
export function currentForm(pet: Pet): GrowthForm {
  return formForStage(stageFromLevel(pet.level))
}

/** The next form up, or null once fully grown. */
export function nextForm(pet: Pet): GrowthForm | null {
  const index = GROWTH_FORMS.findIndex((f) => f.stage === stageFromLevel(pet.level))
  return GROWTH_FORMS[index + 1] ?? null
}

/** Levels remaining before the next form, or null once fully grown. */
export function levelsUntilNextForm(pet: Pet): number | null {
  const next = nextForm(pet)
  return next ? Math.max(0, next.level - pet.level) : null
}

/** How far through the whole growth line the pet is, 0 to 1. */
export function growthProgress(pet: Pet): number {
  const index = GROWTH_FORMS.findIndex((f) => f.stage === stageFromLevel(pet.level))
  return (index + 1) / GROWTH_FORMS.length
}

/** True once the pet has reached this form. */
export function hasReached(pet: Pet, form: GrowthForm): boolean {
  return pet.level >= form.level
}
