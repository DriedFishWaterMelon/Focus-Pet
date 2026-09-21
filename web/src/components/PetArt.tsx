import type { PetPalette, PetShape } from '../lib/types'

// Composable pet artwork.
//
// Each growth form declares its shape (body, crown, particle, aura) and this
// module draws it in the palette the player picked. Bespoke SVGs per form would
// be several things to keep in sync every time the eyes or the sick expression
// changed; here a new form is a row of data and it inherits every fix.
//
// Shape and palette are separate arguments on purpose: growth changes the
// silhouette, the species changes the colour, and neither overwrites the other.
//
// All pieces draw inside a 200x200 viewBox with the body centred near (100,120)
// and the head near (100,82), matching the original Compose canvas.

export function Aura({
  shape,
  palette,
  alive,
  focus,
}: {
  shape: PetShape
  palette: PetPalette
  alive: boolean
  focus: boolean
}) {
  if (!alive || shape.aura === 'none') return null
  const [body, accent] = palette
  const id = `aura-${shape.body}-${shape.crown}-${body.slice(1)}`

  if (shape.aura === 'ring') {
    return (
      <g aria-hidden>
        <circle
          cx="100"
          cy="105"
          r="80"
          fill="none"
          stroke={accent}
          strokeWidth="2"
          strokeDasharray="4 9"
          opacity="0.75"
          className="art-spin"
          style={{ transformOrigin: '100px 105px' }}
        />
      </g>
    )
  }

  if (shape.aura === 'rays') {
    return (
      <g aria-hidden className="art-spin-slow" style={{ transformOrigin: '100px 100px' }}>
        {Array.from({ length: 12 }, (_, i) => (
          <rect
            key={i}
            x="99"
            y="8"
            width="2.5"
            height={i % 2 === 0 ? 18 : 11}
            rx="1.25"
            fill={accent}
            opacity="0.55"
            transform={`rotate(${i * 30} 100 100)`}
          />
        ))}
      </g>
    )
  }

  return (
    <g aria-hidden>
      <defs>
        <radialGradient id={id}>
          <stop offset="0%" stopColor={body} stopOpacity={shape.aura === 'strong' ? 0.8 : 0.5} />
          <stop offset="100%" stopColor={body} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle
        cx="100"
        cy="105"
        r={shape.aura === 'strong' ? 92 : 80}
        fill={`url(#${id})`}
        className={focus ? 'animate-pulse-glow' : 'art-breathe-soft'}
        style={{ transformOrigin: '100px 105px' }}
      />
    </g>
  )
}

export function Body({ shape, palette }: { shape: PetShape; palette: PetPalette }) {
  const [body, accent] = palette

  switch (shape.body) {
    case 'tall':
      return (
        <g>
          {/* trunk */}
          <rect x="88" y="112" width="24" height="56" rx="11" fill={accent} />
          <ellipse cx="100" cy="126" rx="44" ry="42" fill={body} />
          <ellipse cx="100" cy="132" rx="28" ry="26" fill="#FFFFFF" opacity="0.2" />
          <circle cx="100" cy="82" r="40" fill={body} />
        </g>
      )

    case 'wisp':
      return (
        <g>
          {/* a tapering droplet rather than a solid body */}
          <path
            d="M100 168 C 66 146, 58 112, 100 44 C 142 112, 134 146, 100 168 Z"
            fill={body}
            opacity="0.92"
          />
          <ellipse cx="100" cy="126" rx="24" ry="30" fill="#FFFFFF" opacity="0.22" />
          <circle cx="100" cy="86" r="34" fill={body} />
        </g>
      )

    case 'crystal':
      return (
        <g>
          <path d="M100 160 L62 118 L78 74 L122 74 L138 118 Z" fill={body} />
          <path d="M100 160 L62 118 L100 104 Z" fill="#FFFFFF" opacity="0.16" />
          <path d="M100 160 L138 118 L100 104 Z" fill="#000000" opacity="0.14" />
          <path d="M100 42 L78 74 L122 74 Z" fill={accent} />
          <circle cx="100" cy="92" r="32" fill={body} />
        </g>
      )

    case 'round':
      return (
        <g>
          <circle cx="100" cy="124" r="48" fill={body} />
          <circle cx="100" cy="130" r="31" fill="#FFFFFF" opacity="0.22" />
          <circle cx="100" cy="82" r="40" fill={body} />
        </g>
      )

    default:
      return (
        <g>
          <ellipse cx="100" cy="120" rx="52" ry="46" fill={body} />
          <ellipse cx="100" cy="128" rx="34" ry="30" fill="#FFFFFF" opacity="0.25" />
          <circle cx="100" cy="82" r="42" fill={body} />
        </g>
      )
  }
}

export function Crown({ shape, palette }: { shape: PetShape; palette: PetPalette }) {
  const [body, accent] = palette

  switch (shape.crown) {
    case 'sprout':
      return (
        <g className="art-sway-slow" style={{ transformOrigin: '100px 56px' }}>
          <path d="M100 52 C 100 34, 86 26, 76 30 C 78 44, 90 52, 100 52 Z" fill={accent} />
          <path d="M100 52 C 100 36, 112 28, 122 32 C 120 46, 110 52, 100 52 Z" fill={body} />
          <rect x="98.5" y="40" width="3" height="16" rx="1.5" fill={accent} />
        </g>
      )

    case 'leaf':
      return (
        <g>
          <ellipse cx="70" cy="54" rx="13" ry="23" fill={accent} transform="rotate(-28 70 54)" />
          <ellipse cx="130" cy="54" rx="13" ry="23" fill={accent} transform="rotate(28 130 54)" />
        </g>
      )

    case 'petal':
      return (
        <g className="art-sway-slow" style={{ transformOrigin: '100px 48px' }}>
          {Array.from({ length: 6 }, (_, i) => (
            <ellipse
              key={i}
              cx="100"
              cy="28"
              rx="9"
              ry="17"
              fill={i % 2 === 0 ? accent : body}
              transform={`rotate(${i * 60} 100 48)`}
            />
          ))}
          <circle cx="100" cy="48" r="8" fill="#FFE600" />
        </g>
      )

    case 'bloom':
      return (
        <g>
          <g className="art-spin-slow" style={{ transformOrigin: '100px 44px' }}>
            {Array.from({ length: 8 }, (_, i) => (
              <ellipse
                key={i}
                cx="100"
                cy="20"
                rx="8"
                ry="18"
                fill={i % 2 === 0 ? accent : body}
                opacity="0.95"
                transform={`rotate(${i * 45} 100 44)`}
              />
            ))}
          </g>
          <circle cx="100" cy="44" r="11" fill="#FFE600" />
          <circle cx="100" cy="44" r="5" fill="#FF6B35" />
        </g>
      )

    case 'branch':
      return (
        <g stroke={accent} strokeWidth="5" strokeLinecap="round" fill="none">
          <path d="M100 48 L100 18" />
          <path d="M100 30 L78 14" />
          <path d="M100 30 L122 14" />
          <path d="M100 42 L82 32" />
          <path d="M100 42 L118 32" />
          <circle cx="78" cy="14" r="6" fill={body} stroke="none" />
          <circle cx="122" cy="14" r="6" fill={body} stroke="none" />
          <circle cx="100" cy="18" r="7" fill={body} stroke="none" />
        </g>
      )

    case 'spike':
      return (
        <g>
          <path d="M100 14 L112 52 L88 52 Z" fill={accent} />
          <path d="M74 30 L88 56 L66 58 Z" fill={accent} opacity="0.85" />
          <path d="M126 30 L112 56 L134 58 Z" fill={accent} opacity="0.85" />
        </g>
      )

    case 'halo':
      return (
        <g className="art-float-slow">
          <ellipse
            cx="100"
            cy="30"
            rx="30"
            ry="9"
            fill="none"
            stroke={accent}
            strokeWidth="5"
            opacity="0.9"
          />
        </g>
      )

    default:
      return null
  }
}

const PARTICLE_GLYPH: Record<PetShape['particle'], string> = {
  none: '',
  sparkle: '✦',
  petal: '❁',
  leaf: '❧',
  dew: '◦',
  star: '★',
  mist: '～',
}

/** Ambient specks that drift around the pet, unique per form. */
export function Particles({
  shape,
  palette,
  alive,
}: {
  shape: PetShape
  palette: PetPalette
  alive: boolean
}) {
  if (!alive || shape.particle === 'none') return null
  const glyph = PARTICLE_GLYPH[shape.particle]
  const [, accent] = palette

  // Fixed offsets rather than random ones, so specks stay put across renders.
  const spots = [
    { x: 42, y: 60, size: 15, delay: 0 },
    { x: 158, y: 74, size: 12, delay: 1.1 },
    { x: 52, y: 142, size: 11, delay: 2.2 },
    { x: 152, y: 132, size: 14, delay: 0.6 },
    { x: 100, y: 30, size: 10, delay: 1.7 },
  ]

  return (
    <g aria-hidden>
      {spots.map((spot, i) => (
        <text
          key={i}
          x={spot.x}
          y={spot.y}
          fontSize={spot.size}
          fill={accent}
          opacity="0.85"
          textAnchor="middle"
          className="art-drift"
          style={{ animationDelay: `${spot.delay}s` }}
        >
          {glyph}
        </text>
      ))}
    </g>
  )
}

/** Maps a form's idle trait to the class that animates its body. */
export function idleClass(shape: PetShape): string {
  switch (shape.idle) {
    case 'sway':
      return 'art-sway'
    case 'float':
      return 'art-float'
    case 'pulse':
      return 'art-pulse'
    case 'shimmer':
      return 'art-shimmer'
    default:
      return 'pet-breathe'
  }
}
