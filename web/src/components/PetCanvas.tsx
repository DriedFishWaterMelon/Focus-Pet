import { useEffect, useRef, useState } from 'react'
import { SpinRing } from './Decor'
import { HAPTIC, accentAt, haptic } from '../lib/design'
import { moodOf } from '../lib/gameLogic'
import { PET_MOOD_INFO, PET_STAGE_LABELS_TH, SPECIES_INFO } from '../lib/types'
import type { Pet } from '../lib/types'

// The pet, extended for the maximalist system: a saturated body, a pulsing
// aura, a rotating dashed ring and hearts that fly off when it is patted.
//
// The idle motion is what makes it read as a creature rather than an
// illustration — it breathes continuously and blinks at irregular intervals.

const STAGE_SCALE: Record<Pet['stage'], number> = {
  BABY: 0.75,
  JUVENILE: 0.85,
  ADULT: 1,
  MYSTIC: 1.1,
  LEGEND: 1.2,
}

interface Props {
  pet: Pet
  isFocusActive?: boolean
  onPat?: () => void
  compact?: boolean
  /** Calm mode strips the decoration during an active session. */
  calm?: boolean
}

export function PetCanvas({ pet, isFocusActive = false, onPat, compact = false, calm = false }: Props) {
  const mood = isFocusActive && pet.isAlive ? 'MEDITATING' : moodOf(pet)
  const scale = STAGE_SCALE[pet.stage]
  const species = SPECIES_INFO[pet.species] ?? SPECIES_INFO.leaf
  const body = pet.isAlive ? species.color : '#3F3F46'

  const [blinking, setBlinking] = useState(false)
  const [reacting, setReacting] = useState(false)
  const [hearts, setHearts] = useState<number[]>([])
  const reactTimer = useRef<number | undefined>(undefined)
  const heartSeq = useRef(0)

  // Irregular blinking. A fixed interval looks mechanical, so the gap is
  // randomised between roughly two and seven seconds.
  useEffect(() => {
    if (!pet.isAlive) return
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
  }, [pet.isAlive])

  useEffect(() => () => window.clearTimeout(reactTimer.current), [])

  function handlePat() {
    if (!onPat || !pet.isAlive) return
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
  const eyesClosed = sleeping || blinking || !pet.isAlive
  const sizeClass = compact ? 'h-28 w-28' : 'h-52 w-52 sm:h-60 sm:w-60'
  const decorated = !calm && pet.isAlive

  return (
    <div className="relative flex flex-col items-center gap-3">
      <div className="relative">
        {decorated && <SpinRing size={compact ? 140 : 250} accent={pet.level % 5} />}

        <button
          type="button"
          onClick={handlePat}
          aria-label={pet.isAlive ? `ลูบ ${pet.name}` : pet.name}
          disabled={!onPat || !pet.isAlive}
          className="group relative rounded-full p-2 transition-transform duration-200 enabled:active:scale-90 disabled:cursor-default"
        >
          <svg viewBox="0 0 200 200" className={sizeClass} role="img">
            <title>{`${pet.name}, ${PET_MOOD_INFO[mood].label}`}</title>

            <defs>
              <radialGradient id={`aura-${pet.species}`}>
                <stop offset="0%" stopColor={body} stopOpacity="0.55" />
                <stop offset="100%" stopColor={body} stopOpacity="0" />
              </radialGradient>
            </defs>

            {pet.isAlive && (
              <circle
                cx="100"
                cy="105"
                r={78 * scale}
                fill={`url(#aura-${pet.species})`}
                className={isFocusActive ? 'animate-pulse-glow' : 'animate-bounce-subtle'}
                style={{ transformOrigin: '100px 105px' }}
              />
            )}

            <g
              transform={`translate(100 105) scale(${scale}) translate(-100 -105)`}
              className={
                !pet.isAlive
                  ? 'pet-dead'
                  : reacting
                    ? 'pet-react'
                    : mood === 'SICK' || mood === 'DYING'
                      ? 'pet-weak'
                      : 'pet-breathe'
              }
              style={{ transformOrigin: '100px 130px' }}
            >
              <ellipse cx="72" cy="58" rx="13" ry="22" fill={body} transform="rotate(-25 72 58)" />
              <ellipse cx="128" cy="58" rx="13" ry="22" fill={body} transform="rotate(25 128 58)" />

              <ellipse cx="100" cy="120" rx="52" ry="46" fill={body} />
              <ellipse cx="100" cy="128" rx="34" ry="30" fill="#FFFFFF" opacity="0.25" />
              <circle cx="100" cy="82" r="42" fill={body} />

              {!pet.isAlive ? (
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

              {!pet.isAlive ? (
                <path d="M91 99 q9 -7 18 0" stroke="#0D0D1A" strokeWidth="3.5" fill="none" strokeLinecap="round" />
              ) : mood === 'HUNGRY' ? (
                <ellipse cx="100" cy="97" rx="7" ry="9" fill="#0D0D1A" opacity="0.85" />
              ) : mood === 'SICK' || mood === 'DYING' ? (
                <path d="M91 99 q9 -6 18 0" stroke="#0D0D1A" strokeWidth="3.5" fill="none" strokeLinecap="round" />
              ) : mood === 'ECSTATIC' ? (
                <path d="M88 94 q12 14 24 0" stroke="#0D0D1A" strokeWidth="4" fill="none" strokeLinecap="round" />
              ) : (
                <path d="M91 95 q9 8 18 0" stroke="#0D0D1A" strokeWidth="4" fill="none" strokeLinecap="round" />
              )}

              {pet.isAlive && (
                <>
                  <circle cx="72" cy="90" r="6.5" fill="#FF3AF2" opacity={mood === 'SICK' ? 0.2 : 0.55} />
                  <circle cx="128" cy="90" r="6.5" fill="#FF3AF2" opacity={mood === 'SICK' ? 0.2 : 0.55} />
                </>
              )}
            </g>

            {isFocusActive && pet.isAlive && (
              <text x="100" y="34" textAnchor="middle" fontSize="22" className="pet-float">
                💤
              </text>
            )}
            {(mood === 'SICK' || mood === 'DYING') && (
              <text x="146" y="50" textAnchor="middle" fontSize="24" className="pet-float">
                🤒
              </text>
            )}
          </svg>
        </button>

        {/* Hearts fly off on every pat — immediate, repeatable, physical feedback. */}
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
            style={{ fontFamily: 'var(--font-display)', color: body }}
          >
            {pet.name}
          </p>
          <p
            className="mt-1 text-xs font-black tracking-widest uppercase"
            style={{ color: accentAt(pet.level + 1) }}
          >
            {PET_STAGE_LABELS_TH[pet.stage]} · LV.{pet.level}
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
