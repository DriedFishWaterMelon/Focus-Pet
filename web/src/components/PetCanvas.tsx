import { useEffect, useRef, useState } from 'react'
import { Aura, Body, Crown, Particles, idleClass } from './PetArt'
import { HAPTIC, accentAt, haptic } from '../lib/design'
import { currentNode } from '../lib/evolution'
import { moodOf } from '../lib/gameLogic'
import { PET_MOOD_INFO } from '../lib/types'
import type { Pet, PetVisual } from '../lib/types'

// The pet.
//
// Body, crown, aura and particles all come from the current evolution form, but
// the face and the mood rules are shared by every form on purpose: a sick pet
// must read as sick whether it is a seedling or a Star Prism, and duplicating
// the expression logic fifteen times is how that stops being true.

const TIER_SCALE = [0.74, 0.86, 1, 1.12]

interface Props {
  pet: Pet
  isFocusActive?: boolean
  onPat?: () => void
  compact?: boolean
  /** Calm mode strips decoration during an active session. */
  calm?: boolean
  /** Render a specific form instead of the pet's own, for the tree preview. */
  previewVisual?: PetVisual
  previewTier?: number
}

export function PetCanvas({
  pet,
  isFocusActive = false,
  onPat,
  compact = false,
  calm = false,
  previewVisual,
  previewTier,
}: Props) {
  const node = currentNode(pet)
  const visual = previewVisual ?? node.visual
  const tier = previewTier ?? node.tier
  const mood = isFocusActive && pet.isAlive ? 'MEDITATING' : moodOf(pet)

  const alive = pet.isAlive
  const scale = TIER_SCALE[Math.min(tier, TIER_SCALE.length - 1)]
  const dead = !alive

  const [blinking, setBlinking] = useState(false)
  const [reacting, setReacting] = useState(false)
  const [hearts, setHearts] = useState<number[]>([])
  const reactTimer = useRef<number | undefined>(undefined)
  const heartSeq = useRef(0)

  // Irregular blinking. A fixed interval looks mechanical, so the gap is
  // randomised between roughly two and seven seconds.
  useEffect(() => {
    if (!alive) return
    let timeout: number
    const scheduleBlink = () => {
      timeout = window.setTimeout(
        () => {
          setBlinking(true)
          window.setTimeout(() => setBlinking(false), 150)
          scheduleBlink()
        },
        2000 + Math.random() * 5000,
      )
    }
    scheduleBlink()
    return () => window.clearTimeout(timeout)
  }, [alive])

  useEffect(() => () => window.clearTimeout(reactTimer.current), [])

  function handlePat() {
    if (!onPat || !alive) return
    haptic(HAPTIC.success)
    setReacting(true)

    const id = ++heartSeq.current
    setHearts((current) => [...current, id])
    window.setTimeout(() => setHearts((current) => current.filter((h) => h !== id)), 1100)

    window.clearTimeout(reactTimer.current)
    reactTimer.current = window.setTimeout(() => setReacting(false), 600)
    onPat()
  }

  const sleeping = mood === 'TIRED' || mood === 'MEDITATING'
  const eyesClosed = sleeping || blinking || dead
  const ailing = mood === 'SICK' || mood === 'DYING'
  const sizeClass = compact ? 'h-28 w-28' : 'h-52 w-52 sm:h-60 sm:w-60'
  const decorated = !calm && alive

  const bodyClass = dead
    ? 'pet-dead'
    : reacting
      ? 'pet-react'
      : ailing
        ? 'pet-weak'
        : idleClass(visual)

  return (
    <div className="relative flex flex-col items-center gap-3">
      <div className="relative">
        <button
          type="button"
          onClick={handlePat}
          aria-label={alive ? `ลูบ ${pet.name}` : pet.name}
          disabled={!onPat || !alive}
          className="group relative rounded-full p-2 transition-transform duration-200 enabled:active:scale-90 disabled:cursor-default"
        >
          <svg viewBox="0 0 200 200" className={sizeClass} role="img">
            <title>{`${pet.name}, ${node.name}, ${PET_MOOD_INFO[mood].label}`}</title>

            {decorated && <Aura visual={visual} alive={alive} focus={isFocusActive} />}

            <g
              transform={`translate(100 105) scale(${scale}) translate(-100 -105)`}
              className={bodyClass}
              style={{ transformOrigin: '100px 130px' }}
            >
              <Crown visual={visual} />
              <Body visual={visual} />

              {/* Face — identical across every form so mood always reads. */}
              {dead ? (
                <>
                  <path d="M79 74 l14 14 M93 74 l-14 14" stroke="#0D0D1A" strokeWidth="4" strokeLinecap="round" />
                  <path d="M107 74 l14 14 M121 74 l-14 14" stroke="#0D0D1A" strokeWidth="4" strokeLinecap="round" />
                </>
              ) : eyesClosed ? (
                <>
                  <path d="M78 80 q8 8 16 0" stroke="#0D0D1A" strokeWidth="4" fill="none" strokeLinecap="round" />
                  <path d="M106 80 q8 8 16 0" stroke="#0D0D1A" strokeWidth="4" fill="none" strokeLinecap="round" />
                </>
              ) : (
                <>
                  <circle cx="86" cy="78" r="7" fill="#0D0D1A" />
                  <circle cx="114" cy="78" r="7" fill="#0D0D1A" />
                  <circle cx="88.5" cy="75.5" r="2.4" fill="#FFFFFF" />
                  <circle cx="116.5" cy="75.5" r="2.4" fill="#FFFFFF" />
                </>
              )}

              {dead ? (
                <path d="M91 99 q9 -7 18 0" stroke="#0D0D1A" strokeWidth="3.5" fill="none" strokeLinecap="round" />
              ) : mood === 'HUNGRY' ? (
                <ellipse cx="100" cy="97" rx="7" ry="9" fill="#0D0D1A" opacity="0.85" />
              ) : ailing ? (
                <path d="M91 99 q9 -6 18 0" stroke="#0D0D1A" strokeWidth="3.5" fill="none" strokeLinecap="round" />
              ) : mood === 'ECSTATIC' ? (
                <path d="M88 94 q12 14 24 0" stroke="#0D0D1A" strokeWidth="4" fill="none" strokeLinecap="round" />
              ) : (
                <path d="M91 95 q9 8 18 0" stroke="#0D0D1A" strokeWidth="4" fill="none" strokeLinecap="round" />
              )}

              {alive && (
                <>
                  <circle cx="72" cy="90" r="6.5" fill="#FF3AF2" opacity={ailing ? 0.2 : 0.5} />
                  <circle cx="128" cy="90" r="6.5" fill="#FF3AF2" opacity={ailing ? 0.2 : 0.5} />
                </>
              )}
            </g>

            {decorated && <Particles visual={visual} alive={alive} />}

            {isFocusActive && alive && (
              <text x="100" y="30" textAnchor="middle" fontSize="22" className="pet-float">
                💤
              </text>
            )}
            {ailing && (
              <text x="150" y="46" textAnchor="middle" fontSize="24" className="pet-float">
                🤒
              </text>
            )}
          </svg>
        </button>

        {hearts.map((id, i) => (
          <span
            key={id}
            aria-hidden
            className="animate-rise pointer-events-none absolute top-6 left-1/2 text-3xl"
            style={{ marginLeft: (i % 3) * 26 - 26 }}
          >
            💗
          </span>
        ))}
      </div>

      {!compact && (
        <div className="relative z-10 text-center">
          <p
            className="ts-2 text-3xl font-black tracking-tight uppercase"
            style={{ fontFamily: 'var(--font-display)', color: visual.palette[0] }}
          >
            {pet.name}
          </p>
          <p
            className="mt-1 text-xs font-black tracking-widest uppercase"
            style={{ color: visual.palette[1] }}
          >
            {node.name} · LV.{pet.level}
            {pet.generation > 1 && ` · รุ่น ${pet.generation}`}
          </p>
          <p className="mt-1.5 text-sm font-bold text-white/85">
            <span aria-hidden>{PET_MOOD_INFO[mood].emoji}</span> {PET_MOOD_INFO[mood].label}
          </p>
        </div>
      )}
    </div>
  )
}

/** Small standalone portrait used by the tree and the choice modal. */
export function PetPortrait({
  visual,
  tier,
  size = 96,
  dim = false,
}: {
  visual: PetVisual
  tier: number
  size?: number
  dim?: boolean
}) {
  const scale = TIER_SCALE[Math.min(tier, TIER_SCALE.length - 1)]

  return (
    <svg
      viewBox="0 0 200 200"
      aria-hidden
      style={{ width: size, height: size, opacity: dim ? 0.3 : 1, filter: dim ? 'grayscale(1)' : undefined }}
    >
      {!dim && <Aura visual={visual} alive focus={false} />}
      <g transform={`translate(100 105) scale(${scale}) translate(-100 -105)`}>
        <Crown visual={visual} />
        <Body visual={visual} />
        <circle cx="86" cy="78" r="7" fill="#0D0D1A" />
        <circle cx="114" cy="78" r="7" fill="#0D0D1A" />
        <circle cx="88.5" cy="75.5" r="2.4" fill="#FFFFFF" />
        <circle cx="116.5" cy="75.5" r="2.4" fill="#FFFFFF" />
        <path d="M91 95 q9 8 18 0" stroke="#0D0D1A" strokeWidth="4" fill="none" strokeLinecap="round" />
      </g>
      {!dim && <Particles visual={visual} alive />}
    </svg>
  )
}

export { accentAt }
