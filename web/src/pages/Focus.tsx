import { useEffect } from 'react'
import { BackgroundWord, FloatingShapes } from '../components/Decor'
import { PetCanvas } from '../components/PetCanvas'
import { Button, Card, Chip, SectionTitle } from '../components/ui'
import { HAPTIC, accentAt } from '../lib/design'
import { useAppStore } from '../store/useAppStore'

const PRESETS = [15, 25, 30, 45, 60]
const TAGS = ['Deep Work', 'Study', 'Exercise', 'Sleep', 'Social']

function formatClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

/**
 * The one screen that deliberately drops the maximalism.
 *
 * This app exists to reduce screen time, so the surface a participant stares at
 * *during* a detox session is the one place where a stimulating interface would
 * work against the goal. While a session runs, the patterns, floating shapes and
 * glows fade out and the screen goes quiet. Everything comes roaring back at the
 * end — and the contrast makes the reward land harder than constant noise would.
 */
export function Focus() {
  const {
    pet,
    isFocusActive,
    targetMinutes,
    remainingSeconds,
    selectedTag,
    leftTabDuringSession,
    setTargetMinutes,
    setSelectedTag,
    startFocus,
    tickFocus,
    markLeftTab,
    endFocus,
  } = useAppStore()

  useEffect(() => {
    if (!isFocusActive) return
    const interval = window.setInterval(() => tickFocus(), 1000)
    return () => window.clearInterval(interval)
  }, [isFocusActive, tickFocus])

  // Detect the participant leaving the tab. This is the only signal a browser has
  // that the user went elsewhere, and it is weak: it cannot see them picking up a
  // different device or opening another app over the browser on a phone. Sessions
  // flagged here are stored as 'web_timer_interrupted' so the analysis can exclude them.
  useEffect(() => {
    const onHidden = () => {
      if (document.hidden) markLeftTab()
    }
    document.addEventListener('visibilitychange', onHidden)
    return () => document.removeEventListener('visibilitychange', onHidden)
  }, [markLeftTab])

  useEffect(() => {
    if (!isFocusActive || !('wakeLock' in navigator)) return
    let sentinel: WakeLockSentinel | null = null
    navigator.wakeLock
      .request('screen')
      .then((lock) => {
        sentinel = lock
      })
      .catch(() => {
        // Wake Lock is unavailable on some browsers; the session still works.
      })
    return () => {
      void sentinel?.release()
    }
  }, [isFocusActive])

  const progress = isFocusActive ? 1 - remainingSeconds / (targetMinutes * 60) : 0
  const circumference = 2 * Math.PI * 92

  return (
    <div
      className="space-y-6 transition-all duration-1000"
      style={{ filter: isFocusActive ? 'saturate(0.55)' : 'none' }}
    >
      <div
        className="relative overflow-hidden rounded-3xl border-4 py-6 transition-all duration-1000"
        style={{
          borderColor: isFocusActive ? '#2D1B4E' : '#FFE600',
          background: isFocusActive ? 'rgba(13,13,26,0.85)' : 'rgba(45,27,78,0.7)',
          boxShadow: isFocusActive ? 'none' : '8px 8px 0 #7B2FFF, 16px 16px 0 #00F5D4',
        }}
      >
        {!isFocusActive && (
          <>
            <BackgroundWord
              word="GO"
              className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              accent={1}
            />
            <FloatingShapes count={7} seed={5} />
          </>
        )}

        <div className="relative z-10 flex flex-col items-center">
          <div className="relative">
            <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full -rotate-90">
              <circle cx="100" cy="100" r="92" fill="none" stroke="#2D1B4E" strokeWidth="6" />
              {isFocusActive && (
                <circle
                  cx="100"
                  cy="100"
                  r="92"
                  fill="none"
                  stroke="#00F5D4"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - progress)}
                  style={{ transition: 'stroke-dashoffset 1s linear' }}
                />
              )}
            </svg>
            <PetCanvas pet={pet} isFocusActive={isFocusActive} calm={isFocusActive} />
          </div>

          <p
            className={`mt-6 text-7xl font-black tabular-nums ${isFocusActive ? '' : 'ts-2'}`}
            style={{
              fontFamily: 'var(--font-display)',
              color: isFocusActive ? '#FFFFFF' : '#00F5D4',
              letterSpacing: '-0.04em',
            }}
          >
            {formatClock(remainingSeconds)}
          </p>
          <p className="mt-1 text-xs font-bold tracking-widest text-white/50 uppercase">
            {isFocusActive ? `${selectedTag} · วางมือถือลง` : `เป้าหมาย ${targetMinutes} นาที`}
          </p>

          {isFocusActive && leftTabDuringSession && (
            <p
              className="mx-5 mt-5 rounded-2xl border-2 border-dashed px-3 py-2 text-center text-xs font-bold"
              style={{ borderColor: '#FF6B35', color: '#FF6B35' }}
            >
              ⚠️ ระบบตรวจพบว่าคุณออกจากแท็บนี้ เซสชันนี้จะถูกบันทึกแยกว่า "ถูกขัดจังหวะ"
            </p>
          )}
        </div>
      </div>

      {!isFocusActive && (
        <>
          <section className="space-y-3">
            <SectionTitle accent={2}>ตั้งเป้าหมาย</SectionTitle>
            <Card accent={2}>
              <div className="grid grid-cols-5 gap-2">
                {PRESETS.map((minutes, i) => (
                  <Chip
                    key={minutes}
                    accent={i}
                    active={targetMinutes === minutes}
                    onClick={() => setTargetMinutes(minutes)}
                  >
                    {minutes}
                  </Chip>
                ))}
              </div>
            </Card>
          </section>

          <section className="space-y-3">
            <SectionTitle accent={3}>กำลังทำอะไร</SectionTitle>
            <Card accent={3}>
              <div className="flex flex-wrap gap-2">
                {TAGS.map((tag, i) => (
                  <Chip
                    key={tag}
                    accent={i + 1}
                    active={selectedTag === tag}
                    onClick={() => setSelectedTag(tag)}
                  >
                    {tag}
                  </Chip>
                ))}
              </div>
            </Card>
          </section>
        </>
      )}

      {isFocusActive ? (
        <Button
          variant="secondary"
          accent={3}
          className="w-full py-4"
          vibrate={HAPTIC.warn}
          onClick={() => void endFocus(false)}
        >
          ยกเลิกเซสชัน
        </Button>
      ) : (
        <Button accent={1} className="w-full py-5 text-base" onClick={startFocus}>
          เริ่ม {targetMinutes} นาที
        </Button>
      )}

      {!isFocusActive && (
        <p
          className="pb-2 text-center text-xs leading-relaxed font-bold"
          style={{ color: accentAt(4) }}
        >
          วางมือถือลงแล้วปล่อยหน้านี้เปิดไว้
          <br />
          <span className="text-white/60">
            {pet.name} จะได้ EXP และพลังชีวิตจากเวลาที่คุณไม่ได้ใช้หน้าจอ
          </span>
        </p>
      )}
    </div>
  )
}
