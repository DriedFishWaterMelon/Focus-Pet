import { PET_MOOD_INFO, PET_STAGE_LABELS } from '../lib/types'
import type { Pet } from '../lib/types'
import { moodOf } from '../lib/gameLogic'

// SVG re-creation of the Compose Canvas pet from the Android app
// (ui/components/PetVisualCanvas.kt). The pet grows with its stage and its
// expression follows the same mood rules, so both clients read the same.

const STAGE_SCALE: Record<Pet['stage'], number> = {
  BABY: 0.75,
  JUVENILE: 0.85,
  ADULT: 1,
  MYSTIC: 1.1,
  LEGEND: 1.2,
}

const STAGE_BODY: Record<Pet['stage'], string> = {
  BABY: '#34d399',
  JUVENILE: '#10b981',
  ADULT: '#0ea5e9',
  MYSTIC: '#8b5cf6',
  LEGEND: '#f59e0b',
}

interface Props {
  pet: Pet
  isFocusActive?: boolean
  onPat?: () => void
}

export function PetCanvas({ pet, isFocusActive = false, onPat }: Props) {
  const mood = isFocusActive ? 'MEDITATING' : moodOf(pet)
  const scale = STAGE_SCALE[pet.stage]
  const body = STAGE_BODY[pet.stage]
  const sleeping = mood === 'TIRED' || mood === 'MEDITATING'

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={onPat}
        aria-label={`Pat ${pet.name}`}
        disabled={!onPat}
        className="group relative rounded-full p-2 transition-transform enabled:hover:scale-105 enabled:active:scale-95 disabled:cursor-default"
      >
        <svg viewBox="0 0 200 200" className="h-48 w-48 sm:h-56 sm:w-56" role="img">
          <title>{`${pet.name}, ${PET_MOOD_INFO[mood].label}`}</title>

          {/* aura, brighter while meditating */}
          <circle
            cx="100"
            cy="105"
            r={72 * scale}
            fill={body}
            opacity={isFocusActive ? 0.22 : 0.1}
            className={isFocusActive ? 'animate-pulse' : ''}
          />

          <g transform={`translate(100 105) scale(${scale}) translate(-100 -105)`}>
            {/* ears / leaves */}
            <ellipse cx="72" cy="58" rx="13" ry="22" fill={body} transform="rotate(-25 72 58)" />
            <ellipse cx="128" cy="58" rx="13" ry="22" fill={body} transform="rotate(25 128 58)" />

            {/* body */}
            <ellipse cx="100" cy="120" rx="52" ry="46" fill={body} />
            {/* belly */}
            <ellipse cx="100" cy="128" rx="34" ry="30" fill="#fafafa" opacity="0.22" />
            {/* head */}
            <circle cx="100" cy="82" r="42" fill={body} />

            {/* eyes */}
            {sleeping ? (
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

            {/* mouth reflects mood */}
            {mood === 'HUNGRY' ? (
              <ellipse cx="100" cy="97" rx="7" ry="9" fill="#09090b" opacity="0.8" />
            ) : mood === 'ECSTATIC' ? (
              <path d="M88 94 q12 14 24 0" stroke="#09090b" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            ) : (
              <path d="M91 95 q9 8 18 0" stroke="#09090b" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            )}

            {/* cheeks */}
            <circle cx="72" cy="90" r="6" fill="#f43f5e" opacity="0.35" />
            <circle cx="128" cy="90" r="6" fill="#f43f5e" opacity="0.35" />
          </g>

          {isFocusActive && (
            <text x="100" y="32" textAnchor="middle" fontSize="20" className="animate-bounce">
              💤
            </text>
          )}
        </svg>
      </button>

      <div className="text-center">
        <p className="text-xl font-semibold">{pet.name}</p>
        <p className="text-sm text-[--color-muted]">
          {PET_STAGE_LABELS[pet.stage]} · Lv.{pet.level}
        </p>
        <p className="mt-1 text-sm">
          {PET_MOOD_INFO[mood].emoji} {PET_MOOD_INFO[mood].label}
        </p>
      </div>
    </div>
  )
}
