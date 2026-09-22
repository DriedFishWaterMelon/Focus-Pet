import { useEffect, useMemo, useState } from 'react'
import { BackgroundWord, FloatingShapes } from '../components/Decor'
import { Button, Card, EmptyState, SectionTitle, StatTile, TextInput } from '../components/ui'
import { HAPTIC, accentAt, accentTextAt, clashAt, haptic } from '../lib/design'
import { surveyUrlFor } from '../lib/survey'
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
import { isEnrolled } from '../lib/types'
import type { ScreenFreeSession } from '../lib/types'
import { useAppStore } from '../store/useAppStore'

const SOURCE_LABELS: Record<ScreenFreeSession['source'], string> = {
  web_timer_screen_off: 'ปิดหน้าจอไว้',
  web_timer_screen_on: 'เปิดหน้าจอค้างไว้',
  self_reported: 'กรอกเอง',
  android_usage_stats: 'วัดจากแอป',
}

export function Stats() {
  const profile = useAppStore((s) => s.profile)
  const pushToast = useAppStore((s) => s.pushToast)
  const reportScreenTime = useAppStore((s) => s.reportScreenTime)
  const [sessions, setSessions] = useState<ScreenFreeSession[]>([])
  const [days, setDays] = useState<ScreenTimeDay[]>([])
  const [minutesInput, setMinutesInput] = useState('')

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
    const verified = sessions.filter((s) => s.source !== 'web_timer_screen_on')
    return {
      count: sessions.length,
      minutes: verified.reduce((sum, s) => sum + s.actualMinutes, 0),
      interrupted: sessions.length - verified.length,
    }
  }, [sessions])

  async function saveScreenTime() {
    const minutes = Number(minutesInput)
    if (!profile || !Number.isFinite(minutes) || minutes < 0) return

    // Screen time is research data, so it follows the same rule as sessions:
    // nothing is written unless the person is actively enrolled.
    if (!isEnrolled(profile.enrolment)) {
      pushToast('ต้องเข้าร่วมงานวิจัยก่อนจึงจะบันทึกข้อมูลได้', 'warning')
      return
    }
    const entry: ScreenTimeDay = {
      date: todayIso(),
      minutes: Math.round(minutes),
      source: 'self_reported',
      recordedAt: Date.now(),
    }
    await logScreenTimeDay(profile.uid, entry)
    // The pet feels a heavy day. This is the only route by which phone use
    // outside this app reaches the game at all.
    await reportScreenTime(entry.minutes)
    setDays((prev) =>
      [...prev.filter((d) => d.date !== entry.date), entry].sort((a, b) =>
        a.date.localeCompare(b.date),
      ),
    )
    setMinutesInput('')
    pushToast('บันทึกเวลาหน้าจอแล้ว', 'success')
  }

  const participantId = profile?.participantId || 'UNASSIGNED'
  const surveyUrl = profile ? surveyUrlFor(profile.participantId) : null
  const maxMinutes = Math.max(600, ...days.map((d) => d.minutes))

  return (
    <div className="space-y-7">
      <div
        className="relative overflow-hidden rounded-3xl border-4 p-5"
        style={{ borderColor: '#FF6B35', background: '#7B2FFF33', boxShadow: '8px 8px 0 #00F5D4' }}
      >
        <BackgroundWord word="DATA" className="top-2 -right-8" accent={1} />
        <FloatingShapes count={5} seed={31} />
        <div className="relative z-10 grid grid-cols-3 gap-3">
          <StatTile label="เซสชัน" value={totals.count} accent={0} animate />
          <StatTile label="นาทีจริง" value={totals.minutes} accent={1} hint="ไม่นับที่ถูกขัด" animate />
          <StatTile label="ถูกขัด" value={totals.interrupted} accent={3} animate />
        </div>
      </div>

      <section className="space-y-3">
        <SectionTitle accent={2}>บันทึกเวลาหน้าจอวันนี้</SectionTitle>
        <Card accent={2}>
          <p className="text-sm leading-snug text-white/75">
            เปิด Digital Wellbeing (Android) หรือ Screen Time (iOS) บนมือถือ
            แล้วกรอกจำนวนนาทีรวมของวันนี้
          </p>
          <div className="mt-4 flex gap-2">
            <div className="flex-1">
              <TextInput
                type="number"
                accent={2}
                value={minutesInput}
                onChange={setMinutesInput}
                placeholder="เช่น 320"
                onEnter={() => void saveScreenTime()}
              />
            </div>
            <Button
              accent={2}
              disabled={!minutesInput}
              vibrate={HAPTIC.success}
              onClick={() => void saveScreenTime()}
            >
              บันทึก
            </Button>
          </div>
          <p className="mt-2 text-[11px] font-bold" style={{ color: accentTextAt(3) }}>
            ข้อมูลนี้จะถูกบันทึกเป็น "กรอกเอง" ในชุดข้อมูลวิจัย
          </p>
        </Card>
      </section>

      {surveyUrl && (
        <section className="space-y-3">
          <SectionTitle accent={1}>แบบสอบถามงานวิจัย</SectionTitle>
          <Card accent={1}>
            <p className="text-sm leading-snug text-white/75">
              ทำ 2 รอบ คือก่อนเริ่มใช้แอป และหลังใช้ครบ 4 สัปดาห์
              ฟอร์มจะกรอกรหัสผู้เข้าร่วมให้อัตโนมัติ
            </p>
            <a
              href={surveyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 block"
              onClick={() => haptic(HAPTIC.tap)}
            >
              <div
                className="rounded-2xl border-4 px-4 py-3 text-center transition-transform active:scale-95"
                style={{
                  borderColor: '#FFE600',
                  background: '#00F5D422',
                  boxShadow: '4px 4px 0 #00F5D4',
                }}
              >
                <span
                  className="text-sm font-black uppercase"
                  style={{ fontFamily: 'var(--font-display)', color: '#00F5D4' }}
                >
                  📝 เปิดแบบสอบถาม
                </span>
              </div>
            </a>
          </Card>
        </section>
      )}

      <section className="space-y-3">
        <SectionTitle accent={4}>เวลาหน้าจอรายวัน</SectionTitle>
        <Card accent={4}>
          {days.length === 0 ? (
            <EmptyState
              emoji="📊"
              title="ยังไม่มีข้อมูล"
              detail="กรอกเวลาหน้าจอวันนี้เพื่อเริ่มเก็บสถิติ"
              accent={4}
            />
          ) : (
            <div className="space-y-2.5">
              {days.slice(-14).map((day, i) => (
                <div key={day.date} className="flex items-center gap-3">
                  <span className="w-20 shrink-0 text-[11px] font-bold text-white/60">
                    {day.date.slice(5)}
                  </span>
                  <div
                    className="h-4 flex-1 overflow-hidden rounded-full border-2"
                    style={{ borderColor: clashAt(i), background: '#0D0D1A' }}
                  >
                    <div
                      className="h-full rounded-full transition-[width] duration-700"
                      style={{
                        width: `${Math.min(100, (day.minutes / maxMinutes) * 100)}%`,
                        backgroundImage: `linear-gradient(90deg, ${accentAt(i)}, ${accentAt(i + 1)})`,
                      }}
                    />
                  </div>
                  <span
                    className="w-16 shrink-0 text-right text-xs font-black tabular-nums"
                    style={{ color: accentTextAt(i) }}
                  >
                    {Math.floor(day.minutes / 60)}ช {day.minutes % 60}น
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>

      <section className="space-y-3">
        <SectionTitle accent={0}>เซสชันล่าสุด</SectionTitle>
        <Card accent={0}>
          {sessions.length === 0 ? (
            <EmptyState
              emoji="🌙"
              title="ยังไม่มีเซสชัน"
              detail="เริ่มเซสชันปลอดหน้าจอครั้งแรกของคุณ"
              accent={0}
            />
          ) : (
            <div className="space-y-2.5">
              {sessions.slice(0, 10).map((s, i) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-2xl border-2 px-3 py-2.5"
                  style={{ borderColor: accentAt(i), background: `${accentAt(i)}14` }}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-black" style={{ color: accentTextAt(i) }}>
                      {s.actualMinutes} นาที · {s.tag}
                    </p>
                    <p className="mt-0.5 text-[10px] text-white/50">
                      {new Date(s.endTime).toLocaleString('th-TH')} · {SOURCE_LABELS[s.source]}
                    </p>
                  </div>
                  <span aria-hidden className="shrink-0 text-xl">
                    {s.completed ? '✅' : '➖'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>

      <section className="space-y-3">
        <SectionTitle accent={3}>ส่งออกข้อมูล</SectionTitle>
        <Card accent={3}>
          <p className="text-sm leading-snug text-white/75">
            ดาวน์โหลด CSV เพื่อนำไปทำ paired t-test และ Pearson correlation ใน SPSS หรือ Python
          </p>
          <div className="mt-4 flex flex-col gap-2.5">
            <Button
              accent={3}
              variant="outline"
              disabled={sessions.length === 0}
              onClick={() =>
                downloadCsv(`sessions_${participantId}.csv`, sessionsToCsv(participantId, sessions))
              }
            >
              ⬇ เซสชัน (CSV)
            </Button>
            <Button
              accent={4}
              variant="outline"
              disabled={days.length === 0}
              onClick={() =>
                downloadCsv(`screentime_${participantId}.csv`, screenTimeToCsv(participantId, days))
              }
            >
              ⬇ เวลาหน้าจอ (CSV)
            </Button>
          </div>
        </Card>
      </section>
    </div>
  )
}
