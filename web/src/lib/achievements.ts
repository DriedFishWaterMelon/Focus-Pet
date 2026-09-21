import type { Achievement, Pet } from './types'

// Achievements are derived from pet state rather than stored as their own
// counters, so they can never drift out of sync with the real numbers and a
// new one can be added later without a data migration.

export interface AchievementDef {
  id: string
  name: string
  description: string
  iconEmoji: string
  /** Progress from 0 to 1. Reaching 1 unlocks it. */
  progress: (pet: Pet) => number
}

const ratio = (value: number, target: number) => Math.min(1, value / target)

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_session',
    name: 'ก้าวแรก',
    description: 'ทำเซสชันปลอดหน้าจอสำเร็จครั้งแรก',
    iconEmoji: '🌱',
    progress: (pet) => ratio(pet.totalFocusMinutes, 1),
  },
  {
    id: 'hour_free',
    name: 'หนึ่งชั่วโมงแรก',
    description: 'สะสมเวลาปลอดหน้าจอครบ 60 นาที',
    iconEmoji: '⏳',
    progress: (pet) => ratio(pet.totalFocusMinutes, 60),
  },
  {
    id: 'ten_hours',
    name: 'สิบชั่วโมงแห่งอิสระ',
    description: 'สะสมเวลาปลอดหน้าจอครบ 600 นาที',
    iconEmoji: '🏅',
    progress: (pet) => ratio(pet.totalFocusMinutes, 600),
  },
  {
    id: 'streak_3',
    name: 'สามวันติด',
    description: 'ทำเซสชันต่อเนื่องกัน 3 วัน',
    iconEmoji: '🔥',
    progress: (pet) => ratio(pet.streakDays, 3),
  },
  {
    id: 'streak_7',
    name: 'ครบสัปดาห์',
    description: 'ทำเซสชันต่อเนื่องกัน 7 วัน',
    iconEmoji: '📅',
    progress: (pet) => ratio(pet.streakDays, 7),
  },
  {
    id: 'streak_28',
    name: 'ครบสี่สัปดาห์',
    description: 'ทำเซสชันต่อเนื่องกัน 28 วัน ครบระยะเวลาการวิจัย',
    iconEmoji: '🏆',
    progress: (pet) => ratio(pet.streakDays, 28),
  },
  {
    id: 'level_5',
    name: 'เติบโต',
    description: 'เลี้ยงสัตว์เลี้ยงจนถึงเลเวล 5',
    iconEmoji: '⭐',
    progress: (pet) => ratio(pet.level, 5),
  },
  {
    id: 'stage_adult',
    name: 'ผู้พิทักษ์',
    description: 'สัตว์เลี้ยงวิวัฒนาการถึงขั้น Guardian Beast',
    iconEmoji: '🛡️',
    progress: (pet) => (['ADULT', 'MYSTIC', 'LEGEND'].includes(pet.stage) ? 1 : 0),
  },
  {
    id: 'stage_legend',
    name: 'วิญญาณสวรรค์',
    description: 'สัตว์เลี้ยงวิวัฒนาการถึงขั้นสูงสุด',
    iconEmoji: '👑',
    progress: (pet) => (pet.stage === 'LEGEND' ? 1 : 0),
  },
  {
    id: 'caretaker',
    name: 'ผู้ดูแลชั้นเยี่ยม',
    description: 'รักษาสุขภาพสัตว์เลี้ยงไว้ที่ 100 เต็ม',
    iconEmoji: '💚',
    progress: (pet) => (pet.health >= 100 ? 1 : 0),
  },
]

export function evaluateAchievements(
  pet: Pet,
  unlocked: Record<string, number>,
): { achievements: Achievement[]; newlyUnlocked: Achievement[] } {
  const newlyUnlocked: Achievement[] = []

  const achievements = ACHIEVEMENTS.map((def) => {
    const already = unlocked[def.id] ?? null
    const isComplete = def.progress(pet) >= 1
    const unlockedAt = already ?? (isComplete ? Date.now() : null)

    const achievement: Achievement = {
      id: def.id,
      name: def.name,
      description: def.description,
      iconEmoji: def.iconEmoji,
      unlockedAt,
    }

    if (!already && isComplete) newlyUnlocked.push(achievement)
    return achievement
  })

  return { achievements, newlyUnlocked }
}

export function progressOf(pet: Pet, id: string): number {
  const def = ACHIEVEMENTS.find((entry) => entry.id === id)
  return def ? def.progress(pet) : 0
}
