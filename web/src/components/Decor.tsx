import { ACCENTS, accentAt, patternAt } from '../lib/design'

// Decorative furniture for the maximalist layout: floating shapes, oversized
// background typography and stacked pattern layers.
//
// Everything here is presentational noise, so every node carries aria-hidden —
// a screen reader should hear the content, not a list of sparkle emoji.

const SHAPES = ['✦', '★', '✧', '●', '◆', '▲', '✿', '❋']

interface FloatingShapesProps {
  /** Shapes to scatter. The system asks for 5-10 per full-height section. */
  count?: number
  seed?: number
}

/**
 * Scattered shapes at fixed pseudo-random positions. Positions are derived from
 * the index rather than Math.random so they stay put across re-renders — shapes
 * that teleport whenever state changes read as a bug, not as decoration.
 */
export function FloatingShapes({ count = 7, seed = 0 }: FloatingShapesProps) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: count }, (_, i) => {
        const n = i + seed
        const top = (n * 37) % 88
        const left = (n * 53) % 90
        const size = [18, 26, 34, 44, 22][n % 5]
        const anim = ['animate-float', 'animate-float-reverse', 'animate-wiggle', 'animate-spin-slow'][
          n % 4
        ]
        return (
          <span
            key={i}
            className={`absolute will-move ${anim}`}
            style={{
              top: `${top}%`,
              left: `${left}%`,
              fontSize: size,
              color: accentAt(n),
              opacity: 0.5,
              animationDelay: `${(n % 6) * 0.45}s`,
            }}
          >
            {SHAPES[n % SHAPES.length]}
          </span>
        )
      })}
    </div>
  )
}

/**
 * Oversized word sitting behind content and bleeding off the edges. Adds the
 * depth that stops a section from reading as a flat list of cards.
 */
export function BackgroundWord({
  word,
  className = '',
  accent = 0,
}: {
  word: string
  className?: string
  accent?: number
}) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute font-black tracking-tighter select-none ${className}`}
      style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'clamp(7rem, 34vw, 16rem)',
        lineHeight: 0.75,
        color: accentAt(accent),
        opacity: 0.11,
      }}
    >
      {word}
    </span>
  )
}

/** Two stacked patterns tinted with rotating accents. */
export function PatternLayer({ index = 0 }: { index?: number }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
      <div
        className={`absolute inset-0 ${patternAt(index)}`}
        style={{ color: accentAt(index) }}
      />
      <div
        className={`absolute inset-0 ${patternAt(index + 1)}`}
        style={{ color: accentAt(index + 3) }}
      />
    </div>
  )
}

/** Full-bleed radial mesh, used once per screen under everything else. */
export function MeshBackdrop() {
  return <div aria-hidden className="pointer-events-none fixed inset-0 z-0 pattern-mesh" />
}

/** Scrolling ticker of repeated text — pure visual energy along a section edge. */
export function Marquee({ text, accent = 0 }: { text: string; accent?: number }) {
  const color = accentAt(accent)
  return (
    <div
      aria-hidden
      className="relative overflow-hidden border-y-4 py-1.5"
      style={{ borderColor: color, background: `${color}1A` }}
    >
      <div className="animate-marquee flex w-max will-move">
        {Array.from({ length: 2 }, (_, block) => (
          <span key={block} className="flex shrink-0">
            {Array.from({ length: 8 }, (_, i) => (
              <span
                key={i}
                className="px-4 text-xs font-black tracking-widest uppercase"
                style={{ color: accentAt(accent + i), fontFamily: 'var(--font-display)' }}
              >
                {text} ✦
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  )
}

/** Rotating dashed ring used behind icons and the pet. */
export function SpinRing({ size = 200, accent = 0 }: { size?: number; accent?: number }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 100 100"
      className="animate-spin-slow pointer-events-none absolute will-move"
      style={{ width: size, height: size, left: '50%', top: '50%', marginLeft: -size / 2, marginTop: -size / 2 }}
    >
      <circle
        cx="50"
        cy="50"
        r="46"
        fill="none"
        stroke={ACCENTS[accent % ACCENTS.length]}
        strokeWidth="1.5"
        strokeDasharray="6 10"
        opacity="0.6"
      />
    </svg>
  )
}
