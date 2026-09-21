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
    celebration,
    setTargetMinutes,
    setSelectedTag,
    startFocus,
    tickFocus,
    markLeftTab,
    endFocus,
    dismissCelebration,
  } = useAppStore()

  // The timer runs off wall-clock time rather than counting intervals, because
  // browsers throttle timers in background tabs and a naive counter would drift
  // badly — which would put wrong minutes into the research data.
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

  // Keep the screen awake during a session where the browser allows it.
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

  return (
    <div className="space-y-5">
      <Card className="text-center">
        <PetCanvas pet={pet} isFocusActive={isFocusActive} />

        <div className="mt-4">
          <p className="font-mono text-6xl font-bold tabular-nums tracking-tight">
            {formatClock(remainingSeconds)}
          </p>
          <div className="mx-auto mt-4 h-1.5 max-w-xs overflow-hidden rounded-full bg-[#27272a]">
            <div
              className="h-full rounded-full bg-[#0ea5e9] transition-all duration-1000"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>

        {isFocusActive && leftTabDuringSession && (
          <p className="mt-4 rounded-xl bg-[#f59e0b]/10 px-3 py-2 text-xs text-[#fbbf24]">
            ⚠️ ระบบตรวจพบว่าคุณออกจากแท็บนี้ระหว่างเซสชัน
            เซสชันนี้จะถูกบันทึกแยกว่า "ถูกขัดจังหวะ" ในข้อมูลวิจัย
          </p>
        )}
      </Card>

      {!isFocusActive && (
        <>
          <Card>
            <p className="mb-3 text-sm text-[#a1a1aa]">ตั้งเป้าหมาย (นาที)</p>
            <div className="grid grid-cols-5 gap-2">
              {PRESETS.map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  onClick={() => setTargetMinutes(minutes)}
                  className={`rounded-xl py-2.5 text-sm font-medium transition-colors ${
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

          <Card>
            <p className="mb-3 text-sm text-[#a1a1aa]">กำลังทำอะไร</p>
            <div className="flex flex-wrap gap-2">
              {TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedTag(tag)}
                  className={`rounded-full px-3.5 py-1.5 text-sm transition-colors ${
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
        <Button className="w-full py-3.5 text-base" onClick={startFocus}>
          เริ่ม {targetMinutes} นาที
        </Button>
      )}

      {celebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <Card className="w-full max-w-sm text-center">
            <p className="text-5xl">{celebration.completed ? '🎉' : '👍'}</p>
            <h2 className="mt-3 text-xl font-semibold">
              {celebration.completed ? 'สำเร็จแล้ว!' : 'จบเซสชัน'}
            </h2>
            <p className="mt-1 text-sm text-[#a1a1aa]">
              ปลอดหน้าจอไป {celebration.actualMinutes} นาที
            </p>
            <div className="mt-4 flex justify-center gap-6 text-sm">
              <span className="text-[#8b5cf6]">+{celebration.expEarned} EXP</span>
              <span className="text-[#f59e0b]">+{celebration.coinsEarned} coins</span>
            </div>
            {celebration.itemRewardName && (
              <p className="mt-3 rounded-xl bg-[#27272a] px-3 py-2 text-sm">
                🎁 ได้รับ {celebration.itemRewardName}
              </p>
            )}
            <Button className="mt-5 w-full" onClick={dismissCelebration}>
              เยี่ยม!
            </Button>
          </Card>
        </div>
      )}
    </div>
  )
}
