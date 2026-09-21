import { useState } from 'react'
import { Burst, ScreenFlash } from './Burst'
import { BackgroundWord, FloatingShapes } from './Decor'
import { EvolutionPreview } from './EvolutionPreview'
import { PetPortrait } from './PetCanvas'
import { Button, Card, Modal } from './ui'
import { HAPTIC, accentAt, clashAt, haptic } from '../lib/design'
import {
  TIER_NAMES,
  currentNode,
  isOnPath,
  isReachable,
  levelsUntilNextChoice,
  nodeOf,
  pendingChoice,
  treeByTier,
} from '../lib/evolution'
import type { EvolutionNode, NodeId } from '../lib/evolution'
import type { Pet } from '../lib/types'
import { useAppStore } from '../store/useAppStore'

/**
 * The branching growth tree.
 *
 * Fifteen forms across four tiers, where each choice permanently closes the
 * other side of the tree for this pet. Paths not taken are greyed rather than
 * hidden, because seeing what was given up is what makes the choice land — and
 * a player who wants the other branch has a reason to raise a second pet.
 */
export function EvolutionTree({ pet }: { pet: Pet }) {
  const pickEvolution = useAppStore((s) => s.pickEvolution)
  const [previewing, setPreviewing] = useState<NodeId | null>(null)

  const tiers = treeByTier()
  const active = currentNode(pet)
  const toNext = levelsUntilNextChoice(pet)
  const choice = pendingChoice(pet)

  // The preview only offers "choose this" for a form that is actually on the
  // table right now, so it can never be used to skip a tier.
  const canChooseNow = (id: NodeId) => Boolean(choice?.some((option) => option.id === id))

  return (
    <div className="space-y-5">
      <div
        className="relative overflow-hidden rounded-3xl border-4 p-5 text-center"
        style={{
          borderColor: active.visual.palette[1],
          background: `${active.visual.palette[0]}1F`,
          boxShadow: `8px 8px 0 ${active.visual.palette[0]}`,
        }}
      >
        <BackgroundWord word="GROW" className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" accent={1} />
        <FloatingShapes count={5} seed={17} />
        <button
          type="button"
          onClick={() => setPreviewing(active.id as NodeId)}
          className="relative z-10 flex w-full flex-col items-center transition-transform active:scale-95"
        >
          <PetPortrait visual={active.visual} tier={active.tier} size={110} />
          <p
            className="ts-1 mt-2 text-2xl font-black uppercase"
            style={{ fontFamily: 'var(--font-display)', color: active.visual.palette[0] }}
          >
            {active.name}
          </p>
          <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-white/75">
            {active.description}
          </p>

          {choice ? (
            <p
              className="animate-wiggle mt-3 rounded-full border-2 px-3 py-1 text-[11px] font-black uppercase"
              style={{ borderColor: '#FFE600', color: '#FFE600' }}
            >
              ✦ พร้อมวิวัฒนาการแล้ว ✦
            </p>
          ) : toNext === null ? (
            <p className="mt-3 text-[11px] font-black tracking-widest text-white/50 uppercase">
              ร่างสุดท้ายแล้ว
            </p>
          ) : (
            <p className="mt-3 text-[11px] font-black tracking-widest text-white/50 uppercase">
              อีก {toNext} เลเวลถึงทางแยกถัดไป
            </p>
          )}
          <span className="mt-2 text-[10px] font-black tracking-widest text-white/40 uppercase">
            ▸ แตะเพื่อดูรายละเอียด ◂
          </span>
        </button>
      </div>

      {tiers.map((nodes, tier) => (
        <section key={tier} className="space-y-2.5">
          <div className="flex items-center gap-2">
            <span
              className="rounded-full border-2 px-2.5 py-0.5 text-[10px] font-black tracking-widest uppercase"
              style={{ borderColor: accentAt(tier), color: accentAt(tier) }}
            >
              {TIER_NAMES[tier]}
            </span>
            <span className="text-[10px] font-bold text-white/40">
              Lv.{nodes[0]?.level ?? 1}
            </span>
            <span
              aria-hidden
              className="h-0.5 flex-1 rounded-full"
              style={{
                background: `repeating-linear-gradient(90deg, ${accentAt(tier)} 0 8px, transparent 8px 14px)`,
              }}
            />
          </div>

          <div className={tier === 3 ? 'grid grid-cols-2 gap-2.5' : 'flex flex-wrap gap-2.5'}>
            {nodes.map((node, i) => (
              <TreeNode
                key={node.id}
                node={node}
                pet={pet}
                index={i}
                wide={tier === 0}
                isCurrent={node.id === active.id}
                onOpen={() => setPreviewing(node.id as NodeId)}
              />
            ))}
          </div>
        </section>
      ))}

      <p className="pb-2 text-center text-[11px] leading-relaxed text-white/45">
        แตะร่างใดก็ได้เพื่อดูรายละเอียดและลองสวมดู
        <br />
        เส้นทางที่ไม่ได้เลือกจะปิดถาวรสำหรับสัตว์เลี้ยงตัวนี้
      </p>

      {previewing && (
        <EvolutionPreview
          node={nodeOf(previewing)}
          pet={pet}
          onClose={() => setPreviewing(null)}
          onChoose={
            canChooseNow(previewing)
              ? async (id) => {
                  await pickEvolution(id)
                  setPreviewing(null)
                }
              : undefined
          }
        />
      )}
    </div>
  )
}

function TreeNode({
  node,
  pet,
  index,
  wide,
  isCurrent,
  onOpen,
}: {
  node: EvolutionNode
  pet: Pet
  index: number
  wide: boolean
  isCurrent: boolean
  onOpen: () => void
}) {
  const taken = isOnPath(pet, node.id)
  const reachable = isReachable(pet, node.id)
  const closed = !taken && !reachable
  const color = node.visual.palette[0]

  return (
    <button
      type="button"
      onClick={() => {
        haptic(HAPTIC.tap)
        onOpen()
      }}
      aria-label={`ดูรายละเอียด ${node.name}`}
      className={`relative overflow-hidden rounded-2xl border-4 p-2.5 text-center transition-all duration-300 hover:-translate-y-0.5 active:scale-95 ${
        wide ? 'w-full' : 'flex-1 basis-[calc(50%-0.32rem)]'
      } ${isCurrent ? 'scale-[1.03]' : ''}`}
      style={{
        borderColor: closed ? '#3F3F46' : isCurrent ? clashAt(index) : color,
        background: closed ? 'rgba(45,27,78,0.35)' : taken ? `${color}26` : `${color}10`,
        boxShadow: isCurrent ? `5px 5px 0 ${color}` : 'none',
      }}
    >
      <div className="flex flex-col items-center">
        <PetPortrait visual={node.visual} tier={node.tier} size={64} dim={closed} still />
        <p
          className="mt-1 text-[11px] leading-tight font-black uppercase"
          style={{ fontFamily: 'var(--font-display)', color: closed ? '#71717A' : color }}
        >
          {node.name}
        </p>
        {closed ? (
          <p className="text-[9px] font-bold text-white/30">ปิดแล้ว</p>
        ) : taken ? (
          <p className="text-[9px] font-black" style={{ color: clashAt(index) }}>
            {isCurrent ? '● ตอนนี้' : '✓ ผ่านมาแล้ว'}
          </p>
        ) : (
          <p className="text-[9px] font-bold text-white/40">ยังไปถึงได้</p>
        )}
      </div>
    </button>
  )
}

/**
 * The choice modal.
 *
 * The decision is permanent, so a stray tap outside must not spend it: there is
 * no click-away dismissal and the confirm button names the form being chosen.
 * Postponing is explicit instead — "ขอคิดดูก่อน" hides the prompt until the
 * player reopens it from the home banner, because a one-way choice should not
 * be forced on someone who just wanted to start a focus session.
 */
export function EvolutionChoiceModal() {
  const pet = useAppStore((s) => s.pet)
  const pickEvolution = useAppStore((s) => s.pickEvolution)
  const open = useAppStore((s) => s.evolutionPromptOpen)
  const defer = useAppStore((s) => s.deferEvolutionPrompt)
  const [selected, setSelected] = useState<NodeId | null>(null)
  const [inspecting, setInspecting] = useState<NodeId | null>(null)
  const [burst, setBurst] = useState(0)
  const [flash, setFlash] = useState(0)
  const [evolving, setEvolving] = useState(false)

  const options = pendingChoice(pet)
  if (!options || !pet.isAlive || !open) return null

  const preview = selected ? nodeOf(selected) : null

  async function confirm() {
    if (!selected) return
    setEvolving(true)
    haptic(HAPTIC.reward)
    setBurst((n) => n + 1)
    setFlash((n) => n + 1)
    await pickEvolution(selected)
    setSelected(null)
    setEvolving(false)
  }

  return (
    <>
      <Burst trigger={burst} intensity={1.8} />
      <ScreenFlash trigger={flash} color={`${preview?.visual.palette[0] ?? '#FFE600'}66`} />

      <Modal accent={2}>
        <div className="text-center">
          <p aria-hidden className="animate-pop text-5xl">
            🌟
          </p>
          <h2
            className="text-rainbow mt-2 text-3xl font-black tracking-tighter uppercase"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            ถึงทางแยกแล้ว
          </h2>
          <p className="mt-1.5 text-xs leading-relaxed font-bold text-white/75">
            {pet.name} พร้อมเติบโตไปอีกขั้น
            <br />
            <span style={{ color: '#FFE600' }}>เลือกได้ทางเดียว และเปลี่ยนใจไม่ได้</span>
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {options.map((option, i) => {
            const active = selected === option.id
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  haptic(HAPTIC.tap)
                  setSelected(option.id as NodeId)
                }}
                className={`relative overflow-hidden rounded-2xl border-4 p-2.5 transition-all duration-300 ${
                  active ? 'scale-105 -rotate-2' : 'hover:scale-[1.03]'
                }`}
                style={{
                  borderColor: active ? clashAt(i) : option.visual.palette[0],
                  background: active ? `${option.visual.palette[0]}3A` : 'rgba(13,13,26,0.5)',
                  boxShadow: active ? `5px 5px 0 ${option.visual.palette[0]}` : 'none',
                }}
              >
                <div className="flex flex-col items-center">
                  <PetPortrait visual={option.visual} tier={option.tier} size={78} />
                  <p
                    className="mt-1 text-sm leading-tight font-black uppercase"
                    style={{
                      fontFamily: 'var(--font-display)',
                      color: option.visual.palette[0],
                    }}
                  >
                    {option.name}
                  </p>
                </div>
              </button>
            )
          })}
        </div>

        {preview && (
          <>
            <p
              className="anim-fade-up mt-3 rounded-xl border-2 border-dashed px-3 py-2 text-[12px] leading-relaxed text-white/85"
              style={{ borderColor: preview.visual.palette[1] }}
            >
              {preview.description}
            </p>
            <div className="mt-2">
              <Button
                accent={1}
                variant="ghost"
                className="w-full"
                onClick={() => setInspecting(selected)}
              >
                🔍 ดูเต็ม ๆ และลองสวม
              </Button>
            </div>
          </>
        )}

        <div className="mt-5">
          <Button
            accent={2}
            className="w-full py-4"
            disabled={!selected || evolving}
            vibrate={HAPTIC.reward}
            onClick={() => void confirm()}
          >
            {evolving
              ? 'กำลังวิวัฒนาการ…'
              : selected
                ? `ยืนยันเป็น ${preview?.name}`
                : 'เลือกร่างที่ต้องการ'}
          </Button>
        </div>

        <p className="mt-2 text-center text-[10px] text-white/45">
          อีกสายจะถูกปิดถาวรสำหรับสัตว์เลี้ยงตัวนี้
        </p>

        {inspecting && (
          <EvolutionPreview
            node={nodeOf(inspecting)}
            pet={pet}
            onClose={() => setInspecting(null)}
            onChoose={(id) => {
              setSelected(id)
              setInspecting(null)
            }}
          />
        )}

        {/* A permanent choice should never be forced on someone mid-session.
            Postponing keeps the pet at its current form with no penalty. */}
        <div className="mt-2">
          <Button accent={3} variant="ghost" className="w-full" disabled={evolving} onClick={defer}>
            ขอคิดดูก่อน
          </Button>
        </div>
      </Modal>
    </>
  )
}

/** Compact prompt on the home screen when a branch is waiting. */
export function EvolutionBanner({ pet, onOpen }: { pet: Pet; onOpen: () => void }) {
  if (!pendingChoice(pet) || !pet.isAlive) return null

  return (
    <button
      type="button"
      onClick={onOpen}
      className="animate-pulse-glow relative w-full overflow-hidden rounded-3xl border-4 border-dashed p-4 text-left transition-transform active:scale-95"
      style={{ borderColor: '#FFE600', background: '#7B2FFF44' }}
    >
      <FloatingShapes count={4} seed={5} />
      <p
        className="relative z-10 text-xl font-black uppercase"
        style={{ fontFamily: 'var(--font-display)', color: '#FFE600' }}
      >
        🌟 {pet.name} พร้อมวิวัฒนาการ!
      </p>
      <p className="relative z-10 mt-0.5 text-xs font-bold text-white/80">
        แตะเพื่อเลือกเส้นทางการเติบโต
      </p>
    </button>
  )
}

export { Card }
