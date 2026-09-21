import { useEffect, useRef } from 'react'
import { ACCENTS } from '../lib/design'

// Confetti burst on reward moments.
//
// Drawn on a canvas rather than as DOM nodes: a hundred absolutely-positioned
// divs animating at once causes layout thrash on a mid-range phone, which is
// exactly the device this study runs on. One canvas, one rAF loop, and the
// whole thing tears itself down when the particles die.

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  rotation: number
  spin: number
  life: number
}

const GRAVITY = 0.32
const DRAG = 0.987

export function Burst({ trigger, intensity = 1 }: { trigger: number; intensity?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (trigger === 0) return
    const canvas = canvasRef.current
    if (!canvas) return

    // Honour the OS setting: no flying debris for people who asked for calm.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const width = canvas.clientWidth
    const height = canvas.clientHeight
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)

    const count = Math.round(70 * intensity)
    const originX = width / 2
    const originY = height * 0.42

    const particles: Particle[] = Array.from({ length: count }, (_, i) => {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4
      const speed = 4 + Math.random() * 8 * intensity
      return {
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 4,
        size: 5 + Math.random() * 8,
        color: ACCENTS[i % ACCENTS.length],
        rotation: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 0.3,
        life: 1,
      }
    })

    const render = () => {
      ctx.clearRect(0, 0, width, height)
      let alive = false

      for (const p of particles) {
        if (p.life <= 0) continue
        alive = true

        p.vy += GRAVITY
        p.vx *= DRAG
        p.vy *= DRAG
        p.x += p.vx
        p.y += p.vy
        p.rotation += p.spin
        p.life -= 0.012

        ctx.save()
        ctx.globalAlpha = Math.max(0, p.life)
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)
        ctx.fillStyle = p.color
        // Alternate rectangles and circles so the burst does not read as uniform.
        if (p.size % 2 > 1) {
          ctx.beginPath()
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
          ctx.fill()
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
        }
        ctx.restore()
      }

      if (alive) {
        frameRef.current = requestAnimationFrame(render)
      } else {
        ctx.clearRect(0, 0, width, height)
      }
    }

    frameRef.current = requestAnimationFrame(render)
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [trigger, intensity])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[70] h-full w-full"
    />
  )
}

/** Full-screen colour flash for the biggest moments (level up, evolution). */
export function ScreenFlash({ trigger, color }: { trigger: number; color: string }) {
  if (trigger === 0) return null
  return (
    <div
      key={trigger}
      aria-hidden
      className="animate-flash pointer-events-none fixed inset-0 z-[65]"
      style={{ background: `radial-gradient(circle at 50% 45%, ${color}, transparent 70%)` }}
    />
  )
}

/** A value that floats up and fades, like damage numbers in a game. */
export function FloatingGain({
  id,
  label,
  color,
}: {
  id: number
  label: string
  color: string
}) {
  return (
    <span
      key={id}
      aria-hidden
      className="animate-rise pointer-events-none absolute left-1/2 -translate-x-1/2 text-2xl font-black whitespace-nowrap"
      style={{ color, fontFamily: 'var(--font-display)', textShadow: '2px 2px 0 #0D0D1A' }}
    >
      {label}
    </span>
  )
}
