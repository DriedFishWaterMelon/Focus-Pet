import { useState } from 'react'
import { PetCanvas, PetPortrait } from './PetCanvas'
import { Button, Card, Modal } from './ui'
import { HAPTIC, accentAt, clashAt, haptic } from '../lib/design'
import { TIER_NAMES, currentNode, isOnPath, isReachable, nodeOf, pathTo } from '../lib/evolution'
import type { EvolutionNode, NodeId } from '../lib/evolution'
import type { Pet } from '../lib/types'

/**
 * Detail view for a single form in the tree.
 *
 * Two modes. "Art" shows the form on its own, animated, at the size it will
 * actually appear. "Try on" renders the player's own pet wearing it — same
 * name, same level, same mood — which is the question someone tapping a node is
 * really asking: not what this creature looks like, but what *mine* would look
 * like. The preview never changes any stored state.
 */
export function EvolutionPreview({
  node,
  pet,
  onClose,
  onChoose,
}: {
  node: EvolutionNode
  pet: Pet
  onClose: () => void
  /** Offered only when this form is one the pet may evolve into right now. */
  onChoose?: (id: NodeId) => void
}) {
  const [tryOn, setTryOn] = useState(false)

  const taken = isOnPath(pet, node.id)
  const isCurrent = currentNode(pet).id === node.id
  const reachable = isReachable(pet, node.id)
  const closed = !taken && !reachable
  const chain = pathTo(node.id)
  const leadsTo = node.children.map((id) => nodeOf(id as NodeId))

  const status = isCurrent
    ? { label: 'ร่างปัจจุบัน', color: '#00F5D4' }
    : taken
      ? { label: 'เคยผ่านมาแล้ว', color: '#FFE600' }
      : closed
        ? { label: 'ปิดถาวรแล้ว', color: '#71717A' }
        : { label: 'ยังไปถึงได้', color: '#FF3AF2' }

  return (
    <Modal onClose={onClose} accent={node.tier}>
      <div className="text-center">
        <div className="flex min-h-[150px] items-center justify-center">
          {tryOn ? (
            <PetCanvas
              pet={pet}
              compact
              previewVisual={node.visual}
              previewTier={node.tier}
            />
          ) : (
            <PetPortrait visual={node.visual} tier={node.tier} size={150} />
          )}
        </div>

        <h2
          className="ts-1 mt-1 text-2xl font-black uppercase"
          style={{ fontFamily: 'var(--font-display)', color: node.visual.palette[0] }}
        >
          {node.name}
        </h2>

        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          <Badge label={TIER_NAMES[node.tier]} color={accentAt(node.tier)} />
          <Badge label={`Lv.${node.level}+`} color={node.visual.palette[1]} />
          <Badge label={status.label} color={status.color} />
        </div>

        <p className="mt-3 text-sm leading-relaxed text-white/85">{node.description}</p>
      </div>

      {/* Try-on toggle. Disabled for a dead pet, where there is nothing to dress. */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <ToggleTab active={!tryOn} accent={1} onClick={() => setTryOn(false)}>
          ดูร่าง
        </ToggleTab>
        <ToggleTab active={tryOn} accent={3} onClick={() => setTryOn(true)}>
          ลองสวมดู
        </ToggleTab>
      </div>
      {tryOn && (
        <p className="mt-2 text-center text-[11px] text-white/50">
          นี่คือ {pet.name} ของคุณในร่างนี้ · เป็นการแสดงตัวอย่างเท่านั้น ยังไม่เปลี่ยนจริง
        </p>
      )}

      <section className="mt-5">
        <SubHeading accent={2}>เส้นทางไปถึง</SubHeading>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {chain.map((step, i) => (
            <span key={step.id} className="flex items-center gap-1.5">
              <span
                className="rounded-full border-2 px-2 py-0.5 text-[10px] font-black"
                style={{
                  borderColor: isOnPath(pet, step.id) ? step.visual.palette[0] : '#3F3F46',
                  color: isOnPath(pet, step.id) ? step.visual.palette[0] : '#71717A',
                }}
              >
                {step.name}
              </span>
              {i < chain.length - 1 && (
                <span aria-hidden style={{ color: '#52525B' }}>
                  →
                </span>
              )}
            </span>
          ))}
        </div>
      </section>

      {leadsTo.length > 0 && (
        <section className="mt-4">
          <SubHeading accent={4}>เติบโตต่อไปเป็น</SubHeading>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {leadsTo.map((child, i) => (
              <div
                key={child.id}
                className="flex items-center gap-2 rounded-xl border-2 p-2"
                style={{ borderColor: clashAt(i), background: `${child.visual.palette[0]}14` }}
              >
                <PetPortrait visual={child.visual} tier={child.tier} size={34} still />
                <span
                  className="text-[10px] leading-tight font-black uppercase"
                  style={{ color: child.visual.palette[0] }}
                >
                  {child.name}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {closed && (
        <p
          className="mt-4 rounded-xl border-2 border-dashed px-3 py-2 text-[11px] leading-relaxed font-bold"
          style={{ borderColor: '#71717A', color: '#A1A1AA' }}
        >
          เส้นทางนี้ถูกปิดไปแล้วจากการเลือกครั้งก่อน ถ้าอยากได้ร่างนี้ต้องเริ่มเลี้ยงตัวใหม่
        </p>
      )}

      <div className="mt-5 space-y-2">
        {onChoose && (
          <Button
            accent={node.tier}
            className="w-full py-4"
            vibrate={HAPTIC.reward}
            onClick={() => onChoose(node.id as NodeId)}
          >
            เลือกร่างนี้
          </Button>
        )}
        <Button accent={3} variant="outline" className="w-full" onClick={onClose}>
          ปิด
        </Button>
      </div>
    </Modal>
  )
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="rounded-full border-2 px-2.5 py-0.5 text-[10px] font-black tracking-widest uppercase"
      style={{ borderColor: color, color }}
    >
      {label}
    </span>
  )
}

function SubHeading({ children, accent }: { children: React.ReactNode; accent: number }) {
  return (
    <p
      className="text-[10px] font-black tracking-widest uppercase"
      style={{ fontFamily: 'var(--font-display)', color: accentAt(accent) }}
    >
      {children}
    </p>
  )
}

function ToggleTab({
  children,
  active,
  accent,
  onClick,
}: {
  children: React.ReactNode
  active: boolean
  accent: number
  onClick: () => void
}) {
  const color = accentAt(accent)
  return (
    <button
      type="button"
      onClick={() => {
        haptic(HAPTIC.tap)
        onClick()
      }}
      className="rounded-xl border-4 py-2 text-xs font-black tracking-widest uppercase transition-all active:scale-95"
      style={{
        fontFamily: 'var(--font-display)',
        borderColor: active ? clashAt(accent) : '#3F3F46',
        background: active ? `${color}33` : 'transparent',
        color: active ? color : 'rgba(255,255,255,0.45)',
      }}
    >
      {children}
    </button>
  )
}

export { Card }
