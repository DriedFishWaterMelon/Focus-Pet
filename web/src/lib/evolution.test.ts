import { describe, expect, it } from 'vitest'
import {
  EVOLUTION_TREE,
  ROOT_NODE,
  chooseEvolution,
  currentNode,
  hasPendingEvolution,
  isOnPath,
  isReachable,
  levelsUntilNextChoice,
  migrateEvolutionPath,
  nodeOf,
  pendingChoice,
  treeByTier,
} from './evolution'
import type { NodeId } from './evolution'
import { defaultPet, hatchNewPet, migratePet } from './gameLogic'
import type { Pet } from './types'

const at = (level: number, path: NodeId[] = [ROOT_NODE]): Pet =>
  defaultPet({ level, evolutionPath: path })

describe('tree structure', () => {
  it('has one root, two tier-1 forms, four tier-2 and eight finals', () => {
    const tiers = treeByTier()
    expect(tiers.map((t) => t.length)).toEqual([1, 2, 4, 8])
  })

  it('gives every non-final node exactly two children', () => {
    for (const node of Object.values(EVOLUTION_TREE)) {
      expect(node.children.length === 0 || node.children.length === 2).toBe(true)
    }
  })

  it('leaves no node unreachable from the root', () => {
    const seen = new Set<string>([ROOT_NODE])
    let frontier: string[] = [...EVOLUTION_TREE[ROOT_NODE].children]
    while (frontier.length > 0) {
      frontier.forEach((id) => seen.add(id))
      frontier = frontier.flatMap((id) => nodeOf(id as NodeId).children)
    }
    expect(seen.size).toBe(Object.keys(EVOLUTION_TREE).length)
  })

  it('gives every form its own visual identity', () => {
    // Two forms that render identically make the choice meaningless.
    const signatures = Object.values(EVOLUTION_TREE).map((n) =>
      [n.visual.palette.join('/'), n.visual.body, n.visual.crown, n.visual.particle, n.visual.idle].join('|'),
    )
    expect(new Set(signatures).size).toBe(signatures.length)
  })

  it('gives every form a name and a description', () => {
    for (const node of Object.values(EVOLUTION_TREE)) {
      expect(node.name.length).toBeGreaterThan(0)
      expect(node.description.length).toBeGreaterThan(10)
    }
  })

  it('raises the required level with each tier', () => {
    for (const node of Object.values(EVOLUTION_TREE)) {
      for (const childId of node.children) {
        expect(nodeOf(childId as NodeId).level).toBeGreaterThan(node.level)
      }
    }
  })

  it('offers both options at a branch at the same level', () => {
    // A branch where one side unlocks earlier is not a choice, it is a wait.
    for (const node of Object.values(EVOLUTION_TREE)) {
      if (node.children.length !== 2) continue
      const [a, b] = node.children.map((id) => nodeOf(id as NodeId))
      expect(a.level).toBe(b.level)
    }
  })
})

describe('pending choices', () => {
  it('offers nothing below the branch level', () => {
    expect(pendingChoice(at(2))).toBeNull()
    expect(hasPendingEvolution(at(2))).toBe(false)
  })

  it('offers both tier-1 forms at level 3', () => {
    const options = pendingChoice(at(3))
    expect(options?.map((o) => o.id)).toEqual(['sun', 'moon'])
  })

  it('keeps offering the choice past the threshold', () => {
    // Someone who postpones at level 3 must still be able to choose at level 7.
    expect(pendingChoice(at(7))?.length).toBe(2)
  })

  it('offers nothing once fully grown', () => {
    const final = at(40, [ROOT_NODE, 'sun', 'blossom', 'radiant'])
    expect(pendingChoice(final)).toBeNull()
    expect(levelsUntilNextChoice(final)).toBeNull()
  })

  it('counts down the levels to the next branch', () => {
    expect(levelsUntilNextChoice(at(1))).toBe(2)
    expect(levelsUntilNextChoice(at(3))).toBe(0)
    expect(levelsUntilNextChoice(at(5, [ROOT_NODE, 'sun']))).toBe(3)
  })
})

describe('choosing', () => {
  it('appends the chosen form to the path', () => {
    const evolved = chooseEvolution(at(3), 'moon')
    expect(evolved.evolutionPath).toEqual([ROOT_NODE, 'moon'])
    expect(currentNode(evolved).id).toBe('moon')
  })

  it('refuses a form that is not on offer', () => {
    // Jumping straight to a final form would skip the whole tree.
    const pet = at(3)
    expect(chooseEvolution(pet, 'radiant')).toBe(pet)
    expect(chooseEvolution(pet, 'blossom')).toBe(pet)
  })

  it('refuses to evolve before the level is reached', () => {
    const pet = at(2)
    expect(chooseEvolution(pet, 'sun')).toBe(pet)
  })

  it('walks a full path from root to a final form', () => {
    let pet = at(3)
    pet = { ...chooseEvolution(pet, 'moon'), level: 8 }
    pet = { ...chooseEvolution(pet, 'crystal'), level: 15 }
    pet = chooseEvolution(pet, 'void')

    expect(pet.evolutionPath).toEqual([ROOT_NODE, 'moon', 'crystal', 'void'])
    expect(currentNode(pet).tier).toBe(3)
    expect(pendingChoice(pet)).toBeNull()
  })
})

describe('closed branches', () => {
  const sunPet = at(8, [ROOT_NODE, 'sun'])

  it('marks the path taken', () => {
    expect(isOnPath(sunPet, 'sun')).toBe(true)
    expect(isOnPath(sunPet, 'moon')).toBe(false)
  })

  it('keeps descendants of the taken branch reachable', () => {
    expect(isReachable(sunPet, 'blossom')).toBe(true)
    expect(isReachable(sunPet, 'radiant')).toBe(true)
  })

  it('closes the branch not taken and everything under it', () => {
    // This is what makes the choice cost something.
    expect(isReachable(sunPet, 'moon')).toBe(false)
    expect(isReachable(sunPet, 'crystal')).toBe(false)
    expect(isReachable(sunPet, 'void')).toBe(false)
  })

  it('closes the sibling once a tier-2 choice is made', () => {
    const blossomPet = at(15, [ROOT_NODE, 'sun', 'blossom'])
    expect(isReachable(blossomPet, 'radiant')).toBe(true)
    expect(isReachable(blossomPet, 'canopy')).toBe(false)
    expect(isReachable(blossomPet, 'ancient')).toBe(false)
  })
})

describe('migration from pre-tree saves', () => {
  it('reconstructs a path from level alone', () => {
    expect(migrateEvolutionPath(1)).toEqual([ROOT_NODE])
    expect(migrateEvolutionPath(5)).toEqual([ROOT_NODE, 'sun'])
    expect(migrateEvolutionPath(9)).toEqual([ROOT_NODE, 'sun', 'blossom'])
    expect(migrateEvolutionPath(20)).toEqual([ROOT_NODE, 'sun', 'blossom', 'radiant'])
  })

  it('does not reset an old pet to a seedling', () => {
    // Losing four weeks of visible progress would read as a bug, not a feature.
    const old = { ...defaultPet({ level: 12 }), evolutionPath: undefined } as unknown as Pet
    const migrated = migratePet(old)
    expect(migrated.evolutionPath.length).toBeGreaterThan(1)
    expect(currentNode(migrated).tier).toBe(2)
  })

  it('leaves an already-migrated pet untouched', () => {
    const pet = at(9, [ROOT_NODE, 'moon', 'dewdrop'])
    expect(migratePet(pet)).toBe(pet)
  })
})

describe('rebirth', () => {
  it('starts the next pet back at the root', () => {
    // The choices are the point of the tree, so an heir must make its own.
    const grown = at(20, [ROOT_NODE, 'moon', 'crystal', 'prism'])
    const heir = hatchNewPet(grown, 'Nara', 'flame')
    expect(heir.evolutionPath).toEqual([ROOT_NODE])
    expect(currentNode(heir).id).toBe(ROOT_NODE)
  })
})

describe('balance', () => {
  it('grants no mechanical advantage on any branch', () => {
    // Per-branch perks would give each participant a different difficulty
    // curve, which is a confound in a study that compares people. Forms carry
    // visuals and text only — this test fails if a stat field is ever added.
    for (const node of Object.values(EVOLUTION_TREE)) {
      expect(Object.keys(node)).toEqual([
        'id',
        'name',
        'description',
        'level',
        'tier',
        'children',
        'visual',
      ])
    }
  })
})
