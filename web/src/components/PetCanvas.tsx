import { useEffect, useRef, useState } from 'react'
import { Aura, Body, Crown, Particles, idleClass } from './PetArt'
import { HAPTIC, accentAt, haptic } from '../lib/design'
import { GROWTH_FORMS, currentForm } from '../lib/evolution'
import { moodOf } from '../lib/gameLogic'
import { PET_MOOD_INFO, paletteOf } from '../lib/types'
import type { Pet, PetPalette, PetShape } from '../lib/types'

// The pet.
//
// Body, crown, aura and particles come from the current growth form, but the
// face and the mood rules are shared by every form on purpose: a sick pet must
// read as sick whether it is a seedling or a Celestial Spirit, and duplicating
// the expression logic per form is how that stops being true.

const TIER_SCALE = [0.74, 0.86, 1, 1.12]

interface Props {
  pet: Pet
  isFocusActive?: boolean
  onPat?: () => void
  compact?: boolean
  /** Calm mode strips decoration during an active session. */
  calm?: boolean
  /** Render a specific form instead of the pet's own, for the growth preview. */
  previewShape?: PetShape
  previewTier?: number
  /** Override the colour, for previewing a species before committing to it. */
  previewPalette?: PetPalette
}

export function PetCanvas({
  pet,
  isFocusActive = false,
  onPat,
  compact = false,
  calm = false,
  previewShape,
  previewTier,
  previewPalette,
}: Props) {
  const form = currentForm(pet)
  const shape = previewShape ?? form.shape
  const tier = previewTier ?? GROWTH_FORMS.indexOf(form)
  // Colour follows the species, never the growth form, so levelling up never
  // silently replaces the palette the player picked.
  const palette = previewPalette ?? paletteOf(pet.species)
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
        : idleClass(shape)

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
            <title>{`${pet.name}, ${form.name}, ${PET_MOOD_INFO[mood].label}`}</title>

            {decorated && <Aura shape={shape} palette={palette} alive={alive} focus={isFocusActive} />}

            <g
              transform={`translate(100 105) scale(${scale}) translate(-100 -105)`}
              className={bodyClass}
              style={{ transformOrigin: '100px 130px' }}
            >
              <Crown shape={shape} palette={palette} />
              <Body shape={shape} palette={palette} />

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

            {decorated && <Particles shape={shape} palette={palette} alive={alive} />}

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
            style={{ fontFamily: 'var(--font-display)', color: palette[0] }}
          >
            {pet.name}
          </p>
          <p
            className="mt-1 text-xs font-black tracking-widest uppercase"
            style={{ color: palette[1] }}
          >
            {form.name} · LV.{pet.level}
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

/**
 * Standalone portrait used by the tree grid and the preview.
 *
 * `still` exists for the grid: fifteen portraits each animating an aura, a
 * crown and five drifting particles is a lot of simultaneous compositing on the
 * mid-range phones this study runs on, and a wall of motion is hard to read
 * anyway. The grid renders still; the preview animates, because each form's
 * movement is part of what distinguishes it.
 */
export function PetPortrait({
  shape,
  palette,
  tier,
  size = 96,
  dim = false,
  still = false,
}: {
  shape: PetShape
  palette: PetPalette
  tier: number
  size?: number
  dim?: boolean
  still?: boolean
}) {
  const scale = TIER_SCALE[Math.min(tier, TIER_SCALE.length - 1)]
  const decorated = !dim && !still

  return (
    <svg
      viewBox="0 0 200 200"
      aria-hidden
      style={{
        width: size,
        height: size,
        opacity: dim ? 0.3 : 1,
        filter: dim ? 'grayscale(1)' : undefined,
      }}
    >
      {!dim && <Aura shape={shape} palette={palette} alive focus={false} />}
      <g
        transform={`translate(100 105) scale(${scale}) translate(-100 -105)`}
        className={still ? undefined : idleClass(shape)}
        style={{ transformOrigin: '100px 130px' }}
      >
        <Crown shape={shape} palette={palette} />
        <Body shape={shape} palette={palette} />
        <circle cx="86" cy="78" r="7" fill="#0D0D1A" />
        <circle cx="114" cy="78" r="7" fill="#0D0D1A" />
        <circle cx="88.5" cy="75.5" r="2.4" fill="#FFFFFF" />
        <circle cx="116.5" cy="75.5" r="2.4" fill="#FFFFFF" />
        <path d="M91 95 q9 8 18 0" stroke="#0D0D1A" strokeWidth="4" fill="none" strokeLinecap="round" />
      </g>
      {decorated && <Particles shape={shape} palette={palette} alive />}
    </svg>
  )
}

export { accentAt }
