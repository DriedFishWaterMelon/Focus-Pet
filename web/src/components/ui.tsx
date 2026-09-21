import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

export function Card({
  children,
  className = '',
  animate = false,
}: {
  children: ReactNode
  className?: string
  animate?: boolean
}) {
  return (
    <div
      className={`rounded-2xl border border-[#27272a] bg-[#18181b] p-5 ${animate ? 'anim-fade-up' : ''} ${className}`}
    >
      {children}
    </div>
  )
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  type = 'button',
  className = '',
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'ghost' | 'danger' | 'accent'
  disabled?: boolean
  type?: 'button' | 'submit'
  className?: string
}) {
  const styles = {
    primary: 'bg-[#fafafa] text-[#09090b] hover:bg-white active:scale-[0.98]',
    accent: 'bg-[#0ea5e9] text-white hover:bg-[#0284c7] active:scale-[0.98]',
    ghost: 'border border-[#3f3f46] text-[#fafafa] hover:bg-[#27272a] active:scale-[0.98]',
    danger: 'bg-[#ef4444] text-white hover:bg-[#dc2626] active:scale-[0.98]',
  }[variant]

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100 ${styles} ${className}`}
    >
      {children}
    </button>
  )
}

export function StatBar({
  label,
  value,
  color,
  icon,
  warn = false,
}: {
  label: string
  value: number
  color: string
  icon: string
  warn?: boolean
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className={warn ? 'text-[#fbbf24]' : 'text-[#a1a1aa]'}>
          {icon} {label}
        </span>
        <span className="font-medium tabular-nums">{Math.round(value)}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#27272a]">
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }}
        />
      </div>
    </div>
  )
}

/** Counts up to the target so earned rewards feel earned rather than assigned. */
export function AnimatedNumber({ value, duration = 700 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(value)
  const fromRef = useRef(value)
  const frameRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    const from = fromRef.current
    const delta = value - from
    if (delta === 0) return

    const start = performance.now()
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(Math.round(from + delta * eased))
      if (t < 1) frameRef.current = requestAnimationFrame(step)
      else fromRef.current = value
    }
    frameRef.current = requestAnimationFrame(step)

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
      fromRef.current = value
    }
  }, [value, duration])

  return <span className="tabular-nums">{display.toLocaleString('th-TH')}</span>
}

export function StatTile({
  label,
  value,
  hint,
  animate = false,
}: {
  label: string
  value: number | string
  hint?: string
  animate?: boolean
}) {
  return (
    <Card className="text-center">
      <p className="text-2xl font-semibold tabular-nums">
        {animate && typeof value === 'number' ? <AnimatedNumber value={value} /> : value}
      </p>
      <p className="mt-1 text-xs text-[#a1a1aa]">{label}</p>
      {hint && <p className="mt-0.5 text-[11px] text-[#71717a]">{hint}</p>}
    </Card>
  )
}

export function Modal({ children, onClose }: { children: ReactNode; onClose?: () => void }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="anim-modal w-full max-w-sm">{children}</div>
    </div>
  )
}

export function EmptyState({
  emoji,
  title,
  detail,
  action,
}: {
  emoji: string
  title: string
  detail: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center px-4 py-8 text-center">
      <span className="text-4xl opacity-60">{emoji}</span>
      <p className="mt-3 font-medium">{title}</p>
      <p className="mt-1 max-w-xs text-sm text-[#71717a]">{detail}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton rounded-xl ${className}`} />
}

export function TextInput({
  value,
  onChange,
  placeholder,
  maxLength,
  type = 'text',
  onEnter,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  maxLength?: number
  type?: 'text' | 'number'
  onEnter?: () => void
}) {
  return (
    <input
      type={type}
      value={value}
      maxLength={maxLength}
      placeholder={placeholder}
      inputMode={type === 'number' ? 'numeric' : undefined}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onEnter?.()
      }}
      className="w-full rounded-xl border border-[#3f3f46] bg-[#09090b] px-3 py-2.5 text-sm outline-none transition-colors focus:border-[#0ea5e9]"
    />
  )
}
