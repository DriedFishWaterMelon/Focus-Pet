import { useEffect, useMemo, useState } from 'react'
import { Button, Card, StatTile } from '../components/ui'
import {
  downloadCsv,
  fetchScreenTimeDays,
  fetchSessions,
  logScreenTimeDay,
  screenTimeToCsv,
  sessionsToCsv,
  todayIso,
} from '../lib/research'
import type { ScreenTimeDay } from '../lib/research'
import type { ScreenFreeSession } from '../lib/types'
import { useAppStore } from '../store/useAppStore'

const SOURCE_LABELS: Record<ScreenFreeSession['source'], string> = {
  web_timer_verified: 'จับเวลาบนเว็บ',
  web_timer_interrupted: 'ถูกขัดจังหวะ',
  self_reported: 'กรอกเอง',
  android_usage_stats: 'วัดจากแอป Android',
}

export function Stats() {
  const profile = useAppStore((s) => s.profile)
  const [sessions, setSessions] = useState<ScreenFreeSession[]>([])
  const [days, setDays] = useState<ScreenTimeDay[]>([])
  const [minutesInput, setMinutesInput] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!profile) return
    void Promise.all([fetchSessions(profile.uid), fetchScreenTimeDays(profile.uid)]).then(
      ([s, d]) => {
        setSessions(s)
        setDays(d)
      },
    )
  }, [profile])

  const totals = useMemo(() => {
    const verified = sessions.filter((s) => s.source !== 'web_timer_interrupted')
    return {
      count: sessions.length,
      minutes: verified.reduce((sum, s) => sum + s.actualMinutes, 0),
      interrupted: sessions.length - verified.length,
    }
  }, [sessions])

  async function saveScreenTime() {
    const minutes = Number(minutesInput)
    if (!profile || !Number.isFinite(minutes) || minutes < 0) return
    const entry: ScreenTimeDay = {
      date: todayIso(),
      minutes: Math.round(minutes),
      source: 'self_reported',
      recordedAt: Date.now(),
    }
    await logScreenTimeDay(profile.uid, entry)
    setDays((prev) => [...prev.filter((d) => d.date !== entry.date), entry].sort((a, b) => a.date.localeCompare(b.date)))
    setMinutesInput('')
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2500)
  }

  const participantId = profile?.participantId || 'UNASSIGNED'

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <StatTile label="เซสชันทั้งหมด" value={`${totals.count}`} />
        <StatTile label="นาทีปลอดหน้าจอ" value={`${totals.minutes}`} hint="นับเฉพาะที่ไม่ถูกขัด" />
        <StatTile label="ถูกขัดจังหวะ" value={`${totals.interrupted}`} hint="ไม่นับรวม" />
      </div>

      <Card>
        <h2 className="text-base font-semibold">บันทึกเวลาหน้าจอวันนี้</h2>
        <p className="mt-1 text-xs text-[#a1a1aa]">
          เปิดดูตัวเลขจาก Digital Wellbeing (Android) หรือ Screen Time (iOS) บนมือถือ
          แล้วกรอกจำนวนนาทีรวมของวันนี้ ข้อมูลนี้จะถูกบันทึกเป็น "กรอกเอง" ในชุดข้อมูลวิจัย
        </p>
        <div className="mt-3 flex gap-2">
          <input
            type="number"
            min="0"
            inputMode="numeric"
            value={minutesInput}
            onChange={(e) => setMinutesInput(e.target.value)}
            placeholder="เช่น 320"
            className="flex-1 rounded-xl border border-[#3f3f46] bg-[#09090b] px-3 py-2.5 text-sm outline-none focus:border-[#0ea5e9]"
          />
          <Button onClick={() => void saveScreenTime()} disabled={!minutesInput}>
            บันทึก
          </Button>
        </div>
        {saved && <p className="mt-2 text-xs text-[#10b981]">บันทึกแล้ว ✓</p>}
      </Card>

      <Card>
        <h2 className="mb-3 text-base font-semibold">เวลาหน้าจอรายวัน</h2>
        {days.length === 0 ? (
          <p className="text-sm text-[#71717a]">ยังไม่มีข้อมูล</p>
        ) : (
          <div className="space-y-2">
            {days.slice(-14).map((day) => (
              <div key={day.date} className="flex items-center gap-3 text-sm">
                <span className="w-24 shrink-0 text-[#a1a1aa]">{day.date}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#27272a]">
                  <div
                    className="h-full rounded-full bg-[#f43f5e]"
                    style={{ width: `${Math.min(100, (day.minutes / 600) * 100)}%` }}
                  />
                </div>
                <span className="w-20 shrink-0 text-right tabular-nums">
                  {Math.floor(day.minutes / 60)}ชม {day.minutes % 60}น
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h2 className="mb-3 text-base font-semibold">ประวัติเซสชันล่าสุด</h2>
        {sessions.length === 0 ? (
          <p className="text-sm text-[#71717a]">ยังไม่มีเซสชัน</p>
        ) : (
          <div className="space-y-2">
            {sessions.slice(0, 10).map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-xl bg-[#09090b] px-3 py-2.5 text-sm"
              >
                <div>
                  <p className="font-medium">
                    {s.actualMinutes} นาที · {s.tag}
                  </p>
                  <p className="text-xs text-[#71717a]">
                    {new Date(s.endTime).toLocaleString('th-TH')} · {SOURCE_LABELS[s.source]}
                  </p>
                </div>
                <span className={s.completed ? 'text-[#10b981]' : 'text-[#71717a]'}>
                  {s.completed ? '✓' : '—'}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h2 className="text-base font-semibold">ส่งออกข้อมูลสำหรับวิเคราะห์</h2>
        <p className="mt-1 text-xs text-[#a1a1aa]">
          ดาวน์โหลดเป็น CSV เพื่อนำไปทำ paired t-test และ Pearson correlation ใน SPSS หรือ Python
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            variant="ghost"
            onClick={() =>
              downloadCsv(`sessions_${participantId}.csv`, sessionsToCsv(participantId, sessions))
            }
            disabled={sessions.length === 0}
          >
            ⬇ เซสชัน (CSV)
          </Button>
          <Button
            variant="ghost"
            onClick={() =>
              downloadCsv(`screentime_${participantId}.csv`, screenTimeToCsv(participantId, days))
            }
            disabled={days.length === 0}
          >
            ⬇ เวลาหน้าจอ (CSV)
          </Button>
        </div>
      </Card>
    </div>
  )
}
