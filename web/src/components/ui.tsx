import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { PatternLayer } from './Decor'
import { ACCENTS, HAPTIC, accentAt, accentTextAt, clashAt, glowVars, haptic, multiShadow, readableOn, type HapticPattern } from '../lib/design'

// Primitives for the Maximalism system. Every component takes an `accent`
// index rather than a colour, so callers rotate by position and never reach
// for a hex value themselves.

/* ===========================================================================
   Card
   =========================================================================== */

export function Card({
  children,
  className = '',
  accent = 0,
  pattern = true,
  tilt = false,
  style,
}: {
  children: ReactNode
  className?: string
  accent?: number
  pattern?: boolean
  tilt?: boolean
  style?: CSSProperties
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl border-4 bg-[#2D1B4E]/80 p-5 backdrop-blur-sm transition-all duration-300 ease-out ${
        tilt ? 'hover:-translate-y-1 hover:rotate-1' : ''
      } ${className}`}
      style={{
        borderColor: accentAt(accent),
        ...multiShadow(accent),
        ...style,
      }}
    >
      {pattern && <PatternLayer index={accent} />}
      <div className="relative z-10">{children}</div>
    </div>
  )
}

export function CardTitle({
  children,
  accent = 0,
  className = '',
}: {
  children: ReactNode
  accent?: number
  className?: string
}) {
  return (
    <h2
      className={`ts-1 text-xl font-black tracking-tight uppercase ${className}`}
      style={{ fontFamily: 'var(--font-display)', color: accentTextAt(accent) }}
    >
      {children}
    </h2>
  )
}

/* ===========================================================================
   Button
   =========================================================================== */

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'

export function Button({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  type = 'button',
  accent = 0,
  className = '',
  vibrate = HAPTIC.tap,
}: {
  children: ReactNode
  onClick?: () => void
  variant?: Variant
  disabled?: boolean
  type?: 'button' | 'submit'
  accent?: number
  className?: string
  vibrate?: HapticPattern | null
}) {
  const [pressed, setPressed] = useState(0)
  const base = accentAt(accent)
  const clash = clashAt(accent)

  function handleClick() {
    if (disabled) return
    if (vibrate) haptic(vibrate)
    setPressed((n) => n + 1)
    onClick?.()
  }

  const shared =
    'relative isolate overflow-hidden rounded-full font-black uppercase tracking-widest transition-all duration-200 ease-out px-6 py-3.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed enabled:active:scale-95'

  if (variant === 'primary') {
    return (
      <button
        type={type}
        onClick={handleClick}
        disabled={disabled}
        style={{
          fontFamily: 'var(--font-display)',
          borderColor: clash,
          backgroundImage: `linear-gradient(100deg, ${accentAt(accent)}, ${accentAt(accent + 4)}, ${accentAt(accent + 1)})`,
          backgroundSize: '220% 100%',
          color: '#FFFFFF',
          ...glowVars(accent),
        }}
        className={`${shared} glow animate-pulse-glow border-4 text-white enabled:hover:scale-105 enabled:hover:brightness-110 ${className}`}
      >
        <span key={pressed} className="animate-juice inline-block">
          {children}
        </span>
      </button>
    )
  }

  if (variant === 'secondary') {
    return (
      <button
        type={type}
        onClick={handleClick}
        disabled={disabled}
        style={{ fontFamily: 'var(--font-display)', borderColor: base, color: base }}
        className={`${shared} border-4 border-dashed bg-transparent enabled:hover:scale-105 enabled:hover:border-solid enabled:hover:bg-[color:var(--fill)] ${className}`}
        onMouseEnter={(e) => e.currentTarget.style.setProperty('--fill', `${base}33`)}
      >
        {children}
      </button>
    )
  }

  if (variant === 'danger') {
    return (
      <button
        type={type}
        onClick={handleClick}
        disabled={disabled}
        style={{
          fontFamily: 'var(--font-display)',
          borderColor: '#FFE600',
          background: '#FF3AF2',
          boxShadow: '6px 6px 0 #7B2FFF, 12px 12px 0 #FFE600',
        }}
        className={`${shared} border-4 text-white enabled:hover:-translate-y-0.5 enabled:hover:scale-105 ${className}`}
      >
        {children}
      </button>
    )
  }

  if (variant === 'ghost') {
    return (
      <button
        type={type}
        onClick={handleClick}
        disabled={disabled}
        style={{ fontFamily: 'var(--font-display)', color: base }}
        className={`${shared} underline decoration-4 underline-offset-4 enabled:hover:scale-105 ${className}`}
      >
        {children}
      </button>
    )
  }

  // outline — the stacked hard-shadow press. Translating into the shadow on
  // press is what makes it feel physical.
  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={disabled}
      style={{
        fontFamily: 'var(--font-display)',
        borderColor: base,
        color: '#FFFFFF',
        boxShadow: `6px 6px 0 ${clash}, 12px 12px 0 ${accentAt(accent + 4)}`,
      }}
      className={`${shared} border-4 bg-[#2D1B4E]/70 enabled:hover:-translate-x-0.5 enabled:hover:-translate-y-0.5 enabled:active:translate-x-1.5 enabled:active:translate-y-1.5 enabled:active:shadow-none ${className}`}
    >
      {children}
    </button>
  )
}

/* ===========================================================================
   Stats
   =========================================================================== */

export function StatBar({
  label,
  value,
  accent = 0,
  icon,
  warn = false,
}: {
  label: string
  value: number
  accent?: number
  icon: string
  warn?: boolean
}) {
  const color = accentAt(accent)
  const pct = Math.max(0, Math.min(100, value))

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span
          className="text-xs font-black tracking-widest uppercase"
          style={{ fontFamily: 'var(--font-display)', color: warn ? '#FF6B35' : color }}
        >
          <span aria-hidden>{icon}</span> {label}
        </span>
        <span className="text-sm font-black tabular-nums" style={{ color }}>
          {Math.round(value)}
        </span>
      </div>
      <div
        className="relative h-4 overflow-hidden rounded-full border-2"
        style={{ borderColor: clashAt(accent), background: '#0D0D1A' }}
      >
        <div
          className={`relative h-full overflow-hidden rounded-full transition-[width] duration-700 ease-out ${pct > 8 ? 'shimmer-bar' : ''}`}
          style={{
            width: `${pct}%`,
            backgroundImage: `linear-gradient(90deg, ${color}, ${accentAt(accent + 1)})`,
          }}
        />
      </div>
    </div>
  )
}

/**
 * Counts up to its target with an overshoot pop on arrival. Watching a number
 * climb is the cheapest dopamine in the whole app — an instantly-updated
 * number reads as data, a climbing one reads as a reward.
 */
export function AnimatedNumber({
  value,
  duration = 750,
  className = '',
}: {
  value: number
  duration?: number
  className?: string
}) {
  const [display, setDisplay] = useState(value)
  const [bumps, setBumps] = useState(0)
  const fromRef = useRef(value)
  const frameRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    const from = fromRef.current
    const delta = value - from
    if (delta === 0) return

    const start = performance.now()
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(Math.round(from + delta * eased))
      if (t < 1) {
        frameRef.current = requestAnimationFrame(step)
      } else {
        fromRef.current = value
        setBumps((n) => n + 1)
      }
    }
    frameRef.current = requestAnimationFrame(step)

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
      fromRef.current = value
    }
  }, [value, duration])

  return (
    <span key={bumps} className={`animate-juice inline-block tabular-nums ${className}`}>
      {display.toLocaleString('th-TH')}
    </span>
  )
}

export function StatTile({
  label,
  value,
  hint,
  accent = 0,
  animate = false,
}: {
  label: string
  value: number | string
  hint?: string
  accent?: number
  animate?: boolean
}) {
  const color = accentAt(accent)
  return (
    <div
      className="relative overflow-hidden rounded-2xl border-4 p-3 text-center transition-transform duration-300 hover:-translate-y-1"
      style={{
        borderColor: color,
        background: `${color}1F`,
        boxShadow: `4px 4px 0 ${clashAt(accent)}`,
      }}
    >
      <PatternLayer index={accent + 1} />
      <p
        className="relative z-10 text-2xl font-black"
        style={{ fontFamily: 'var(--font-display)', color }}
      >
        {animate && typeof value === 'number' ? <AnimatedNumber value={value} /> : value}
      </p>
      <p className="relative z-10 mt-0.5 text-[10px] leading-tight font-bold tracking-wider text-white/80 uppercase">
        {label}
      </p>
      {hint && <p className="relative z-10 text-[10px] text-white/50">{hint}</p>}
    </div>
  )
}

/* ===========================================================================
   Overlay shells
   =========================================================================== */

export function Modal({
  children,
  onClose,
  accent = 0,
}: {
  children: ReactNode
  onClose?: () => void
  accent?: number
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0D0D1A]/85 p-4 backdrop-blur-md">
      <div className="animate-slam w-full max-w-sm">
        <Card accent={accent} className="p-6">
          {children}
        </Card>
      </div>
    </div>
  )
}

export function EmptyState({
  emoji,
  title,
  detail,
  action,
  accent = 0,
}: {
  emoji: string
  title: string
  detail: string
  action?: ReactNode
  accent?: number
}) {
  return (
    <div className="flex flex-col items-center px-4 py-8 text-center">
      <span aria-hidden className="animate-bounce-subtle text-6xl">
        {emoji}
      </span>
      <p
        className="ts-1 mt-4 text-2xl font-black uppercase"
        style={{ fontFamily: 'var(--font-display)', color: accentTextAt(accent) }}
      >
        {title}
      </p>
      <p className="mt-2 max-w-xs text-sm text-white/70">{detail}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function TextInput({
  value,
  onChange,
  placeholder,
  maxLength,
  type = 'text',
  onEnter,
  accent = 0,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  maxLength?: number
  type?: 'text' | 'number'
  onEnter?: () => void
  accent?: number
}) {
  const [focused, setFocused] = useState(false)
  const color = accentAt(accent)
  const focusColor = clashAt(accent)

  return (
    <input
      type={type}
      value={value}
      maxLength={maxLength}
      placeholder={placeholder}
      inputMode={type === 'number' ? 'numeric' : undefined}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onEnter?.()
      }}
      className="w-full rounded-full border-4 px-5 py-3 text-base font-bold text-white transition-all duration-300 outline-none placeholder:text-white/35"
      style={{
        borderColor: focused ? focusColor : color,
        background: focused ? '#2D1B4E' : 'rgba(45,27,78,0.5)',
        boxShadow: focused ? `0 0 22px ${focusColor}88` : 'none',
      }}
    />
  )
}

/** Section heading with the mandatory shadow stack and a decorative rule. */
export function SectionTitle({
  children,
  accent = 0,
  rainbow = false,
}: {
  children: ReactNode
  accent?: number
  rainbow?: boolean
}) {
  return (
    <div className="flex items-center gap-3">
      <h2
        className={`text-2xl font-black tracking-tighter uppercase ${rainbow ? 'text-rainbow' : 'ts-2'}`}
        style={{
          fontFamily: 'var(--font-display)',
          color: rainbow ? undefined : accentAt(accent),
        }}
      >
        {children}
      </h2>
      <span
        aria-hidden
        className="h-1.5 flex-1 rounded-full"
        style={{ background: `repeating-linear-gradient(90deg, ${accentAt(accent + 1)} 0 10px, transparent 10px 18px)` }}
      />
    </div>
  )
}

export function Chip({
  children,
  active,
  onClick,
  accent = 0,
}: {
  children: ReactNode
  active: boolean
  onClick: () => void
  accent?: number
}) {
  const color = accentAt(accent)
  return (
    <button
      type="button"
      onClick={() => {
        haptic(HAPTIC.tap)
        onClick()
      }}
      className="rounded-full border-4 px-4 py-1.5 text-xs font-black tracking-widest uppercase transition-all duration-200 active:scale-90"
      style={{
        fontFamily: 'var(--font-display)',
        borderColor: active ? clashAt(accent) : color,
        background: active ? color : 'transparent',
        color: active ? readableOn(color) : color,
        boxShadow: active ? `3px 3px 0 ${clashAt(accent)}` : 'none',
        transform: active ? 'scale(1.06)' : undefined,
      }}
    >
      {children}
    </button>
  )
}

export { ACCENTS }
