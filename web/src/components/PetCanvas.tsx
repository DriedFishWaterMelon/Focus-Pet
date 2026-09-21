import { useEffect, useRef, useState } from 'react'
import { moodOf } from '../lib/gameLogic'
import { PET_MOOD_INFO, PET_STAGE_LABELS_TH, SPECIES_INFO } from '../lib/types'
import type { Pet } from '../lib/types'

// SVG re-creation of the Compose Canvas pet from the Android app
// (ui/components/PetVisualCanvas.kt), extended with idle motion.
//
// The idle animation is the whole reason this feels like a creature rather than
// an illustration: it breathes continuously, blinks at irregular intervals, and
// reacts when patted. A static pet reads as dead even when it is healthy.

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
}

export function PetCanvas({ pet, isFocusActive = false, onPat, compact = false }: Props) {
  const mood = isFocusActive && pet.isAlive ? 'MEDITATING' : moodOf(pet)
  const scale = STAGE_SCALE[pet.stage]
  const species = SPECIES_INFO[pet.species] ?? SPECIES_INFO.leaf
  const body = pet.isAlive ? species.color : '#52525b'

  const [blinking, setBlinking] = useState(false)
  const [reacting, setReacting] = useState(false)
  const reactTimer = useRef<number | undefined>(undefined)

  // Blink at irregular intervals. A fixed interval looks mechanical, so the gap
  // is randomised between roughly two and seven seconds.
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
    setReacting(true)
    window.clearTimeout(reactTimer.current)
    reactTimer.current = window.setTimeout(() => setReacting(false), 600)
    onPat()
  }

  const sleeping = mood === 'TIRED' || mood === 'MEDITATING'
  const eyesClosed = sleeping || blinking || !pet.isAlive
  const sizeClass = compact ? 'h-28 w-28' : 'h-48 w-48 sm:h-56 sm:w-56'

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={handlePat}
        aria-label={pet.isAlive ? `ลูบ ${pet.name}` : pet.name}
        disabled={!onPat || !pet.isAlive}
        className="group relative rounded-full p-2 transition-transform enabled:active:scale-95 disabled:cursor-default"
      >
        <svg viewBox="0 0 200 200" className={sizeClass} role="img">
          <title>{`${pet.name}, ${PET_MOOD_INFO[mood].label}`}</title>

          {pet.isAlive && (
            <circle
              cx="100"
              cy="105"
              r={72 * scale}
              fill={body}
              opacity={isFocusActive ? 0.24 : 0.1}
              className={isFocusActive ? 'pet-aura' : undefined}
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
            <ellipse cx="100" cy="128" rx="34" ry="30" fill="#fafafa" opacity="0.22" />
            <circle cx="100" cy="82" r="42" fill={body} />

            {!pet.isAlive ? (
              <>
                <path d="M79 74 l14 14 M93 74 l-14 14" stroke="#18181b" strokeWidth="4" strokeLinecap="round" />
                <path d="M107 74 l14 14 M121 74 l-14 14" stroke="#18181b" strokeWidth="4" strokeLinecap="round" />
              </>
            ) : eyesClosed ? (
              <>
                <path d="M78 80 q8 8 16 0" stroke="#09090b" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                <path d="M106 80 q8 8 16 0" stroke="#09090b" strokeWidth="3.5" fill="none" strokeLinecap="round" />
              </>
            ) : (
              <>
                <circle cx="86" cy="78" r="6.5" fill="#09090b" />
                <circle cx="114" cy="78" r="6.5" fill="#09090b" />
                <circle cx="88" cy="76" r="2.2" fill="#fafafa" />
                <circle cx="116" cy="76" r="2.2" fill="#fafafa" />
              </>
            )}

            {!pet.isAlive ? (
              <path d="M91 99 q9 -7 18 0" stroke="#18181b" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            ) : mood === 'HUNGRY' ? (
              <ellipse cx="100" cy="97" rx="7" ry="9" fill="#09090b" opacity="0.8" />
            ) : mood === 'SICK' || mood === 'DYING' ? (
              <path d="M91 99 q9 -6 18 0" stroke="#09090b" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            ) : mood === 'ECSTATIC' ? (
              <path d="M88 94 q12 14 24 0" stroke="#09090b" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            ) : (
              <path d="M91 95 q9 8 18 0" stroke="#09090b" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            )}

            {pet.isAlive && (
              <>
                <circle cx="72" cy="90" r="6" fill="#f43f5e" opacity={mood === 'SICK' ? 0.15 : 0.35} />
                <circle cx="128" cy="90" r="6" fill="#f43f5e" opacity={mood === 'SICK' ? 0.15 : 0.35} />
              </>
            )}
          </g>

          {isFocusActive && pet.isAlive && (
            <text x="100" y="34" textAnchor="middle" fontSize="20" className="pet-float">
              💤
            </text>
          )}
          {(mood === 'SICK' || mood === 'DYING') && (
            <text x="140" y="52" textAnchor="middle" fontSize="22" className="pet-float">
              🤒
            </text>
          )}
          {reacting && (
            <text x="146" y="60" textAnchor="middle" fontSize="22" className="pet-pop">
              💗
            </text>
          )}
        </svg>
      </button>

      {!compact && (
        <div className="text-center">
          <p className="text-xl font-semibold">{pet.name}</p>
          <p className="text-sm text-[#a1a1aa]">
            {PET_STAGE_LABELS_TH[pet.stage]} · Lv.{pet.level}
            {pet.generation > 1 && ` · รุ่นที่ ${pet.generation}`}
          </p>
          <p className="mt-1 text-sm">
            {PET_MOOD_INFO[mood].emoji} {PET_MOOD_INFO[mood].label}
          </p>
        </div>
      )}
    </div>
  )
}
