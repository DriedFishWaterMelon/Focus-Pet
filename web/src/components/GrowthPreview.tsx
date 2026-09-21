import { useState } from 'react'
import { PetPortrait } from './PetCanvas'
import { Button, Modal } from './ui'
import { HAPTIC, accentAt, clashAt, haptic } from '../lib/design'
import {
  GROWTH_FORMS,
  currentForm,
  hasReached,
  levelsUntilNextForm,
  nextForm,
} from '../lib/evolution'
import type { Pet } from '../lib/types'

/**
 * Growth line preview.
 *
 * A small button rather than its own tab: the growth line is something a player
 * glances at once in a while, not a place they live in, and a sixth of the tab
 * bar is too much room to give it.
 *
 * Forms the pet has not reached yet are shown as silhouettes — visible enough
 * to be worth working toward, not so visible that arriving there is a
 * non-event.
 */
export function GrowthPreviewButton({ pet }: { pet: Pet }) {
  const [open, setOpen] = useState(false)
  const form = currentForm(pet)
  const toNext = levelsUntilNextForm(pet)

  return (
    <>
      <button
        type="button"
        onClick={() => {
          haptic(HAPTIC.tap)
          setOpen(true)
        }}
        className="mx-auto flex items-center gap-1.5 rounded-full border-2 px-3.5 py-1.5 text-[11px] font-black tracking-widest uppercase transition-transform active:scale-90"
        style={{
          fontFamily: 'var(--font-display)',
          borderColor: form.visual.palette[1],
          color: form.visual.palette[1],
        }}
      >
        <span aria-hidden>🌱</span>
        {toNext === null ? 'โตเต็มที่แล้ว' : `อีก ${toNext} เลเวลจะโต`}
      </button>

      {open && <GrowthPreviewModal pet={pet} onClose={() => setOpen(false)} />}
    </>
  )
}

function GrowthPreviewModal({ pet, onClose }: { pet: Pet; onClose: () => void }) {
  const form = currentForm(pet)
  const upcoming = nextForm(pet)
  const toNext = levelsUntilNextForm(pet)

  return (
    <Modal onClose={onClose} accent={1}>
      <div className="text-center">
        <PetPortrait visual={form.visual} tier={GROWTH_FORMS.indexOf(form)} size={120} />
        <h2
          className="ts-1 mt-1 text-2xl font-black uppercase"
          style={{ fontFamily: 'var(--font-display)', color: form.visual.palette[0] }}
        >
          {form.name}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-white/85">{form.description}</p>

        {upcoming ? (
          <p className="mt-3 text-xs font-black tracking-widest uppercase" style={{ color: '#FFE600' }}>
            อีก {toNext} เลเวลจะกลายเป็น {upcoming.name}
          </p>
        ) : (
          <p className="mt-3 text-xs font-black tracking-widest text-white/50 uppercase">
            ร่างสูงสุดแล้ว
          </p>
        )}
      </div>

      <div className="mt-5 space-y-2">
        {GROWTH_FORMS.map((entry, i) => {
          const reached = hasReached(pet, entry)
          const isCurrent = entry.stage === form.stage
          const color = entry.visual.palette[0]

          return (
            <div
              key={entry.stage}
              className="flex items-center gap-3 rounded-2xl border-4 p-2.5 transition-all"
              style={{
                borderColor: isCurrent ? clashAt(i) : reached ? color : '#3F3F46',
                background: isCurrent ? `${color}2E` : reached ? `${color}14` : 'transparent',
                boxShadow: isCurrent ? `4px 4px 0 ${color}` : 'none',
              }}
            >
              <PetPortrait
                visual={entry.visual}
                tier={i}
                size={46}
                still
                dim={!reached}
              />
              <div className="min-w-0 flex-1 text-left">
                <p
                  className="text-sm leading-tight font-black uppercase"
                  style={{
                    fontFamily: 'var(--font-display)',
                    color: reached ? color : '#71717A',
                  }}
                >
                  {reached ? entry.name : '???'}
                </p>
                <p className="text-[10px] font-bold text-white/50">
                  Lv.{entry.level}
                  {isCurrent && ' · ตอนนี้'}
                </p>
              </div>
              <span aria-hidden className="shrink-0 text-lg">
                {isCurrent ? '●' : reached ? '✓' : '🔒'}
              </span>
            </div>
          )
        })}
      </div>

      <div className="mt-5">
        <Button accent={1} className="w-full" onClick={onClose}>
          ปิด
        </Button>
      </div>
    </Modal>
  )
}

export { accentAt }
