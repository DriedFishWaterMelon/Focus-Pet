// The evolution tree.
//
// The pet used to change form purely as a function of level, which meant every
// participant's pet looked identical at the same point in the study. Here the
// path branches: at levels 3, 8 and 15 the player picks one of two forms, so a
// four-week run ends on one of eight silhouettes that reflect the choices made.
//
// Deliberately cosmetic. No node grants a stat bonus, a decay modifier or any
// other mechanical advantage. The survival balance in gameLogic.ts is tuned and
// unit-tested, and branch perks would give each participant a different
// difficulty curve — a confound in a study that compares behaviour across
// people. Identity is the reward; the numbers stay equal for everyone.
//
// The two tier-1 branches echo the two things the project actually measures:
// Sun is daytime focus and productivity, Moon is rest and sleep quality.

import type { Pet, PetVisual } from './types'

export type NodeId =
  // Tier 0
  | 'sprout'
  // Tier 1
  | 'sun'
  | 'moon'
  // Tier 2
  | 'blossom'
  | 'canopy'
  | 'dewdrop'
  | 'crystal'
  // Tier 3
  | 'radiant'
  | 'wildflower'
  | 'ancient'
  | 'grove'
  | 'mist'
  | 'lotus'
  | 'prism'
  | 'void'

export interface EvolutionNode {
  id: NodeId
  name: string
  description: string
  /** Level at which this form becomes available. */
  level: number
  tier: 0 | 1 | 2 | 3
  /** The two forms this one can grow into. Empty at the final tier. */
  children: NodeId[]
  visual: PetVisual
}

/** Levels at which a branch choice is offered. */
export const EVOLUTION_LEVELS = [3, 8, 15] as const

export const TIER_NAMES = ['เมล็ด', 'หน่อ', 'เติบโต', 'ตำนาน'] as const

export const EVOLUTION_TREE: Record<NodeId, EvolutionNode> = {
  sprout: {
    id: 'sprout',
    name: 'เมล็ดน้อย',
    description: 'จุดเริ่มต้นของทุกเส้นทาง ยังไม่รู้ว่าจะโตไปทางไหน',
    level: 1,
    tier: 0,
    children: ['sun', 'moon'],
    visual: {
      palette: ['#10B981', '#34D399'],
      body: 'blob',
      crown: 'sprout',
      particle: 'none',
      idle: 'breathe',
      aura: 'soft',
    },
  },

  // --- Tier 1 -------------------------------------------------------------
  sun: {
    id: 'sun',
    name: 'หน่อตะวัน',
    description: 'เติบโตด้วยแสง เหมาะกับคนที่โฟกัสตอนกลางวัน',
    level: 3,
    tier: 1,
    children: ['blossom', 'canopy'],
    visual: {
      palette: ['#FFE600', '#FF6B35'],
      body: 'blob',
      crown: 'leaf',
      particle: 'sparkle',
      idle: 'breathe',
      aura: 'rays',
    },
  },
  moon: {
    id: 'moon',
    name: 'หน่อจันทรา',
    description: 'เติบโตในความเงียบ เหมาะกับคนที่พักผ่อนให้พอ',
    level: 3,
    tier: 1,
    children: ['dewdrop', 'crystal'],
    visual: {
      palette: ['#7B2FFF', '#A78BFA'],
      body: 'round',
      crown: 'halo',
      particle: 'star',
      idle: 'float',
      aura: 'soft',
    },
  },

  // --- Tier 2 -------------------------------------------------------------
  blossom: {
    id: 'blossom',
    name: 'ผกาบาน',
    description: 'ผลิดอกสดใส ยิ่งดูแลยิ่งเบ่งบาน',
    level: 8,
    tier: 2,
    children: ['radiant', 'wildflower'],
    visual: {
      palette: ['#FF3AF2', '#FB7185'],
      body: 'round',
      crown: 'petal',
      particle: 'petal',
      idle: 'sway',
      aura: 'soft',
    },
  },
  canopy: {
    id: 'canopy',
    name: 'ร่มไทร',
    description: 'แผ่กิ่งก้านมั่นคง เป็นร่มเงาให้ผู้อื่น',
    level: 8,
    tier: 2,
    children: ['ancient', 'grove'],
    visual: {
      palette: ['#059669', '#84CC16'],
      body: 'tall',
      crown: 'branch',
      particle: 'leaf',
      idle: 'sway',
      aura: 'none',
    },
  },
  dewdrop: {
    id: 'dewdrop',
    name: 'หยาดน้ำค้าง',
    description: 'ใสสะอาด สงบนิ่งยามเช้ามืด',
    level: 8,
    tier: 2,
    children: ['mist', 'lotus'],
    visual: {
      palette: ['#00F5D4', '#38BDF8'],
      body: 'wisp',
      crown: 'none',
      particle: 'dew',
      idle: 'float',
      aura: 'soft',
    },
  },
  crystal: {
    id: 'crystal',
    name: 'ผลึกราตรี',
    description: 'แข็งแกร่งและเปล่งประกายในความมืด',
    level: 8,
    tier: 2,
    children: ['prism', 'void'],
    visual: {
      palette: ['#8B5CF6', '#00F5D4'],
      body: 'crystal',
      crown: 'spike',
      particle: 'star',
      idle: 'shimmer',
      aura: 'ring',
    },
  },

  // --- Tier 3 -------------------------------------------------------------
  radiant: {
    id: 'radiant',
    name: 'บุปผาเรืองรอง',
    description: 'ดอกไม้ที่เปล่งแสงได้เอง สัญลักษณ์ของวินัยที่ทำจนสำเร็จ',
    level: 15,
    tier: 3,
    children: [],
    visual: {
      palette: ['#FFE600', '#FF3AF2'],
      body: 'round',
      crown: 'bloom',
      particle: 'sparkle',
      idle: 'pulse',
      aura: 'rays',
    },
  },
  wildflower: {
    id: 'wildflower',
    name: 'วิญญาณไม้ป่า',
    description: 'อิสระ ไม่ถูกจัดระเบียบ แต่งดงามในแบบของตัวเอง',
    level: 15,
    tier: 3,
    children: [],
    visual: {
      palette: ['#FF6B35', '#FFE600'],
      body: 'blob',
      crown: 'bloom',
      particle: 'petal',
      idle: 'sway',
      aura: 'soft',
    },
  },
  ancient: {
    id: 'ancient',
    name: 'พฤกษ์โบราณ',
    description: 'ยืนต้นมานาน รากหยั่งลึกจนไม่มีอะไรสั่นคลอนได้',
    level: 15,
    tier: 3,
    children: [],
    visual: {
      palette: ['#047857', '#A16207'],
      body: 'tall',
      crown: 'branch',
      particle: 'leaf',
      idle: 'breathe',
      aura: 'none',
    },
  },
  grove: {
    id: 'grove',
    name: 'ผู้พิทักษ์ไพร',
    description: 'ไม่ได้โตเพื่อตัวเอง แต่โตเพื่อปกป้องสิ่งรอบข้าง',
    level: 15,
    tier: 3,
    children: [],
    visual: {
      palette: ['#10B981', '#00F5D4'],
      body: 'tall',
      crown: 'branch',
      particle: 'sparkle',
      idle: 'pulse',
      aura: 'ring',
    },
  },
  mist: {
    id: 'mist',
    name: 'ละอองหมอก',
    description: 'เบาจนแทบจับต้องไม่ได้ อยู่ตรงนั้นแต่ไม่รบกวนใคร',
    level: 15,
    tier: 3,
    children: [],
    visual: {
      palette: ['#38BDF8', '#A78BFA'],
      body: 'wisp',
      crown: 'none',
      particle: 'mist',
      idle: 'float',
      aura: 'soft',
    },
  },
  lotus: {
    id: 'lotus',
    name: 'บัวรัตติกาล',
    description: 'บานในความมืด สงบที่สุดเมื่อโลกเงียบที่สุด',
    level: 15,
    tier: 3,
    children: [],
    visual: {
      palette: ['#00F5D4', '#FF3AF2'],
      body: 'round',
      crown: 'petal',
      particle: 'dew',
      idle: 'float',
      aura: 'ring',
    },
  },
  prism: {
    id: 'prism',
    name: 'ปริซึมดารา',
    description: 'หักเหแสงดาวออกมาเป็นสีที่ไม่มีใครเคยเห็น',
    level: 15,
    tier: 3,
    children: [],
    visual: {
      palette: ['#00F5D4', '#FFE600'],
      body: 'crystal',
      crown: 'spike',
      particle: 'star',
      idle: 'shimmer',
      aura: 'rays',
    },
  },
  void: {
    id: 'void',
    name: 'บุปผาสุญญตา',
    description: 'ว่างเปล่าแต่เต็มเปี่ยม ปลายทางของการปล่อยวาง',
    level: 15,
    tier: 3,
    children: [],
    visual: {
      palette: ['#7B2FFF', '#0D0D1A'],
      body: 'crystal',
      crown: 'halo',
      particle: 'star',
      idle: 'pulse',
      aura: 'strong',
    },
  },
}

export const ROOT_NODE: NodeId = 'sprout'

export function nodeOf(id: NodeId): EvolutionNode {
  return EVOLUTION_TREE[id] ?? EVOLUTION_TREE[ROOT_NODE]
}

/** The form the pet is currently in. */
export function currentNode(pet: Pet): EvolutionNode {
  const path = pet.evolutionPath?.length ? pet.evolutionPath : [ROOT_NODE]
  return nodeOf(path[path.length - 1] as NodeId)
}

/**
 * The two forms on offer right now, or null when no choice is due.
 *
 * A choice is pending when the pet has reached the level of the next tier but
 * has not yet picked. Levels are checked against the child's own level rather
 * than a separate table, so adding a tier means editing the tree only.
 */
export function pendingChoice(pet: Pet): EvolutionNode[] | null {
  const node = currentNode(pet)
  if (node.children.length === 0) return null

  const options = node.children.map((id) => nodeOf(id as NodeId))
  const required = options[0].level
  if (pet.level < required) return null

  return options
}

/** Whether the pet can evolve but the player has not chosen yet. */
export function hasPendingEvolution(pet: Pet): boolean {
  return pendingChoice(pet) !== null
}

/** Applies a choice, returning the pet on its new branch. */
export function chooseEvolution(pet: Pet, choice: NodeId): Pet {
  const options = pendingChoice(pet)
  if (!options || !options.some((option) => option.id === choice)) return pet

  return {
    ...pet,
    evolutionPath: [...(pet.evolutionPath ?? [ROOT_NODE]), choice],
  }
}

/** Levels remaining before the next branch opens, or null when fully grown. */
export function levelsUntilNextChoice(pet: Pet): number | null {
  const node = currentNode(pet)
  if (node.children.length === 0) return null
  const required = nodeOf(node.children[0] as NodeId).level
  return Math.max(0, required - pet.level)
}

/**
 * Fills in the evolution path for pets saved before the tree existed.
 *
 * Old saves only recorded a level, so the fairest reconstruction is the first
 * branch at each tier they had already earned. Their pet keeps its progress and
 * simply arrives on the Sun line; every future branch is still theirs to pick.
 */
export function migrateEvolutionPath(level: number): NodeId[] {
  const path: NodeId[] = [ROOT_NODE]
  if (level >= 3) path.push('sun')
  if (level >= 8) path.push('blossom')
  if (level >= 15) path.push('radiant')
  return path
}

/**
 * The chain of forms leading from the root to `id`, inclusive.
 *
 * Used by the preview to show how a form is reached — "เมล็ด → จันทรา → ผลึก →
 * ปริซึม" tells a player what they would have to commit to far better than a
 * required level does.
 */
export function pathTo(id: NodeId): EvolutionNode[] {
  const walk = (from: NodeId, trail: NodeId[]): NodeId[] | null => {
    if (from === id) return [...trail, from]
    for (const child of nodeOf(from).children) {
      const found = walk(child as NodeId, [...trail, from])
      if (found) return found
    }
    return null
  }
  return (walk(ROOT_NODE, []) ?? [ROOT_NODE]).map((n) => nodeOf(n))
}

/** Every node, grouped by tier, for rendering the tree. */
export function treeByTier(): EvolutionNode[][] {
  const tiers: EvolutionNode[][] = [[], [], [], []]
  for (const node of Object.values(EVOLUTION_TREE)) tiers[node.tier].push(node)
  return tiers
}

/** True when `id` sits on the path the pet actually took. */
export function isOnPath(pet: Pet, id: NodeId): boolean {
  return (pet.evolutionPath ?? []).includes(id)
}

/**
 * True when `id` is still reachable from where the pet stands.
 *
 * Once a branch is taken the other side of the tree is closed for this pet —
 * that is what makes the choice matter — so the tree view greys it out rather
 * than pretending it is still an option.
 */
export function isReachable(pet: Pet, id: NodeId): boolean {
  if (isOnPath(pet, id)) return true
  const node = nodeOf(id)
  const current = currentNode(pet)
  if (node.tier <= current.tier) return false

  // Walk down from the current node and see whether we meet it.
  let frontier: NodeId[] = [...(current.children as NodeId[])]
  while (frontier.length > 0) {
    if (frontier.includes(id)) return true
    frontier = frontier.flatMap((child) => nodeOf(child).children as NodeId[])
  }
  return false
}
