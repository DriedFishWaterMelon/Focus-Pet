import { useEffect } from 'react'
import { PetCanvas } from '../components/PetCanvas'
import { Button, Card } from '../components/ui'
import { useAppStore } from '../store/useAppStore'

const PRESETS = [15, 25, 30, 45, 60]
const TAGS = ['Deep Work', 'Study', 'Exercise', 'Sleep', 'Social']

function formatClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

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
  const circumference = 2 * Math.PI * 88

  return (
    <div className="space-y-5">
      <Card className="text-center">
        <div className="relative mx-auto w-fit">
          {/* Progress ring around the pet, so the pet itself is the timer. */}
          <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full -rotate-90">
            <circle cx="100" cy="100" r="88" fill="none" stroke="#27272a" strokeWidth="4" />
            {isFocusActive && (
              <circle
                cx="100"
                cy="100"
                r="88"
                fill="none"
                stroke="#0ea5e9"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - progress)}
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            )}
          </svg>
          <PetCanvas pet={pet} isFocusActive={isFocusActive} />
        </div>

        <p className="mt-5 font-mono text-6xl font-bold tabular-nums tracking-tight">
          {formatClock(remainingSeconds)}
        </p>
        <p className="mt-1 text-xs text-[#71717a]">
          {isFocusActive ? `กำลังทำ · ${selectedTag}` : `เป้าหมาย ${targetMinutes} นาที`}
        </p>

        {isFocusActive && leftTabDuringSession && (
          <p className="mt-4 rounded-xl bg-[#f59e0b]/10 px-3 py-2 text-xs text-[#fbbf24]">
            ⚠️ ระบบตรวจพบว่าคุณออกจากแท็บนี้ระหว่างเซสชัน
            เซสชันนี้จะถูกบันทึกแยกว่า "ถูกขัดจังหวะ" ในข้อมูลวิจัย
          </p>
        )}
      </Card>

      {!isFocusActive && (
        <>
          <Card animate>
            <p className="mb-3 text-sm text-[#a1a1aa]">ตั้งเป้าหมาย (นาที)</p>
            <div className="grid grid-cols-5 gap-2">
              {PRESETS.map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  onClick={() => setTargetMinutes(minutes)}
                  className={`rounded-xl py-2.5 text-sm font-medium transition-all active:scale-95 ${
                    targetMinutes === minutes
                      ? 'bg-[#fafafa] text-[#09090b]'
                      : 'border border-[#3f3f46] text-[#a1a1aa] hover:bg-[#27272a]'
                  }`}
                >
                  {minutes}
                </button>
              ))}
            </div>
          </Card>

          <Card animate>
            <p className="mb-3 text-sm text-[#a1a1aa]">กำลังทำอะไร</p>
            <div className="flex flex-wrap gap-2">
              {TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedTag(tag)}
                  className={`rounded-full px-3.5 py-1.5 text-sm transition-all active:scale-95 ${
                    selectedTag === tag
                      ? 'bg-[#0ea5e9] text-white'
                      : 'border border-[#3f3f46] text-[#a1a1aa] hover:bg-[#27272a]'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </Card>
        </>
      )}

      {isFocusActive ? (
        <Button variant="danger" className="w-full py-3.5" onClick={() => void endFocus(false)}>
          ยกเลิกเซสชัน
        </Button>
      ) : (
        <Button variant="accent" className="w-full py-3.5 text-base" onClick={startFocus}>
          เริ่ม {targetMinutes} นาที
        </Button>
      )}

      {!isFocusActive && (
        <p className="pb-2 text-center text-xs leading-relaxed text-[#52525b]">
          วางมือถือลงแล้วปล่อยให้หน้านี้เปิดไว้
          <br />
          {pet.name} จะได้ EXP และพลังชีวิตจากเวลาที่คุณไม่ได้ใช้หน้าจอ
        </p>
      )}
    </div>
  )
}
