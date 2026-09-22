import { useRef, useState } from 'react'
import { Button, Card } from './ui'
import { HAPTIC, accentAt, accentTextAt, clashAt, haptic, textSafe } from '../lib/design'
import {
  CONSENT_CHECKS,
  CONSENT_SHEET,
  CONSENT_VERSION,
  CONTACT_IS_PLACEHOLDER,
  RESEARCH_CONTACT_EMAIL,
} from '../lib/consent'

/**
 * The informed-consent sheet.
 *
 * Three rules shape this screen, all of them ethical rather than visual:
 *
 * 1. Nothing is pre-ticked and the two answers are given equal visual weight.
 *    A consent button styled as the exciting one and a refusal styled as the
 *    sad one is a dark pattern, and consent obtained that way is not informed.
 * 2. The agree button stays disabled until the sheet has actually been
 *    scrolled to the end and every statement is ticked individually.
 * 3. Declining is a real, supported outcome that still leads into the app.
 */
export function ConsentSheet({
  onAgree,
  onDecline,
  busy = false,
}: {
  onAgree: () => void
  onDecline: () => void
  busy?: boolean
}) {
  const [checked, setChecked] = useState<boolean[]>(CONSENT_CHECKS.map(() => false))
  const [scrolledToEnd, setScrolledToEnd] = useState(false)
  const [readProgress, setReadProgress] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  const checkedCount = checked.filter(Boolean).length
  const allChecked = checkedCount === CONSENT_CHECKS.length
  const canAgree = allChecked && scrolledToEnd && !busy

  function handleScroll() {
    const el = scrollRef.current
    if (!el) return
    const scrollable = el.scrollHeight - el.clientHeight
    setReadProgress(scrollable <= 0 ? 1 : Math.min(1, el.scrollTop / scrollable))
    // 24px of slack so a trackpad that stops just short still counts.
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 24) setScrolledToEnd(true)
  }

  function scrollToEnd() {
    haptic(HAPTIC.tap)
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }

  function toggle(index: number) {
    haptic(HAPTIC.tap)
    setChecked((current) => current.map((v, i) => (i === index ? !v : v)))
  }

  return (
    <Card accent={4} className="p-5">
      <h2
        className="ts-2 text-3xl font-black uppercase"
        style={{ fontFamily: 'var(--font-display)', color: accentTextAt(4) }}
      >
        หนังสือยินยอม
      </h2>
      <p className="mt-1 text-[10px] font-bold tracking-widest text-white/50 uppercase">
        เข้าร่วมโครงงานวิจัย · เวอร์ชัน {CONSENT_VERSION}
      </p>

      {CONTACT_IS_PLACEHOLDER && (
        <p
          className="mt-3 rounded-xl border-4 border-dashed px-3 py-2 text-xs font-black"
          style={{ borderColor: '#FF6B35', color: '#FF6B35' }}
        >
          ⚠️ ทีมพัฒนา: ยังไม่ได้ตั้งอีเมลติดต่อทีมวิจัยใน src/lib/consent.ts
          ต้องตั้งก่อนเปิดให้ผู้เข้าร่วมจริงใช้งาน
        </p>
      )}

      {/* A visible read-progress bar. Without it the only cue that the sheet is
          longer than the box is the scrollbar, which phones hide. */}
      <div
        className="mt-4 h-2 overflow-hidden rounded-full border-2"
        style={{ borderColor: scrolledToEnd ? '#00F5D4' : '#3F3F46', background: '#0D0D1A' }}
      >
        <div
          className="h-full rounded-full transition-[width] duration-200"
          style={{
            width: `${readProgress * 100}%`,
            background: scrolledToEnd ? '#00F5D4' : '#FFE600',
          }}
        />
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="mt-2 max-h-[42vh] space-y-5 overflow-y-auto rounded-2xl border-2 border-white/15 bg-[#0D0D1A]/70 p-4"
      >
        {CONSENT_SHEET.map((section, i) => (
          <section key={section.heading}>
            <h3
              className="text-base leading-snug font-black uppercase"
              style={{ fontFamily: 'var(--font-display)', color: accentTextAt(i) }}
            >
              {i + 1}. {section.heading}
            </h3>
            <ul className="mt-2 space-y-2.5">
              {section.body.map((line, j) => (
                <li key={j} className="flex gap-2.5 text-[15px] leading-[1.75] text-white/90">
                  <span aria-hidden className="shrink-0" style={{ color: textSafe(clashAt(i)) }}>
                    ▸
                  </span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <section>
          <h3
            className="text-base font-black uppercase"
            style={{ fontFamily: 'var(--font-display)', color: accentTextAt(3) }}
          >
            {CONSENT_SHEET.length + 1}. ติดต่อทีมวิจัย
          </h3>
          <p className="mt-2 text-[15px] leading-[1.75] text-white/90">
            หากมีคำถาม ต้องการถอนตัว หรือขอให้ลบข้อมูล ติดต่อได้ที่{' '}
            <span className="font-bold" style={{ color: accentTextAt(3) }}>
              {RESEARCH_CONTACT_EMAIL}
            </span>
          </p>
        </section>

        <p
          className="rounded-xl border-2 border-dashed py-2 text-center text-xs font-black"
          style={{ borderColor: '#00F5D4', color: '#00F5D4' }}
        >
          — จบข้อความ อ่านครบแล้ว —
        </p>
      </div>

      {!scrolledToEnd && (
        <button
          type="button"
          onClick={scrollToEnd}
          className="animate-bounce-subtle mt-2 w-full rounded-xl border-2 border-dashed py-2 text-xs font-black tracking-wide"
          style={{ borderColor: '#FFE600', color: '#FFE600' }}
        >
          ↓ เลื่อนอ่านให้ครบก่อน · อ่านแล้ว {Math.round(readProgress * 100)}% · แตะเพื่อข้ามไปท้าย
        </button>
      )}

      <div className="mt-4 space-y-2">
        {CONSENT_CHECKS.map((label, i) => (
          <label
            key={label}
            className="flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3 transition-colors"
            style={{
              borderColor: checked[i] ? accentAt(i) : 'rgba(255,255,255,0.18)',
              background: checked[i] ? `${accentAt(i)}1A` : 'transparent',
            }}
          >
            <input
              type="checkbox"
              checked={checked[i]}
              onChange={() => toggle(i)}
              className="mt-0.5 h-5 w-5 shrink-0 accent-[#00F5D4]"
            />
            <span className="text-[15px] leading-[1.6] text-white/90">{label}</span>
          </label>
        ))}
      </div>

      {/* Why the button is locked, spelled out.
          A greyed-out button with no explanation reads as a broken app; a
          tester reported exactly that. Each requirement shows its own state, so
          the remaining step is always named rather than guessed at. */}
      {!canAgree && !busy && (
        <div
          className="mt-4 rounded-2xl border-4 border-dashed p-3"
          style={{ borderColor: '#FF6B35' }}
        >
          <p className="text-xs font-black tracking-wide uppercase" style={{ color: '#FF6B35' }}>
            🔒 ปุ่มยินยอมยังกดไม่ได้ ต้องทำให้ครบก่อน
          </p>
          <ul className="mt-2 space-y-1.5">
            <Requirement done={scrolledToEnd}>
              เลื่อนอ่านเอกสารให้จบ{!scrolledToEnd && ` (อ่านแล้ว ${Math.round(readProgress * 100)}%)`}
            </Requirement>
            <Requirement done={allChecked}>
              ติ๊กยืนยันครบทุกข้อ ({checkedCount}/{CONSENT_CHECKS.length})
            </Requirement>
          </ul>
        </div>
      )}

      {/* Equal weight: same size, same prominence, different colour only. */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Button
          accent={3}
          variant="outline"
          className="w-full py-4"
          disabled={busy}
          onClick={onDecline}
        >
          ไม่เข้าร่วม
        </Button>
        <Button
          accent={1}
          variant={canAgree ? 'primary' : 'outline'}
          className="w-full py-4"
          disabled={!canAgree}
          vibrate={HAPTIC.success}
          onClick={onAgree}
        >
          {canAgree ? 'ยินยอมเข้าร่วม' : '🔒 ยินยอมเข้าร่วม'}
        </Button>
      </div>

      <p className="mt-3 text-center text-[11px] leading-relaxed text-white/55">
        เลือก "ไม่เข้าร่วม" ก็ใช้งานแอปได้เต็มรูปแบบเหมือนกัน
        <br />
        เพียงแต่ระบบจะไม่บันทึกข้อมูลใด ๆ เพื่อการวิจัย
      </p>
    </Card>
  )
}

function Requirement({ done, children }: { done: boolean; children: React.ReactNode }) {
  return (
    <li
      className="flex items-start gap-2 text-[13px] leading-snug font-bold"
      style={{ color: done ? '#00F5D4' : 'rgba(255,255,255,0.75)' }}
    >
      <span aria-hidden className="shrink-0">
        {done ? '✅' : '⬜'}
      </span>
      <span>{children}</span>
    </li>
  )
}

/**
 * The issued participant code.
 *
 * Nothing is typed. Codes used to be handed out on paper and entered by hand,
 * which confused people and risked two participants entering the same one; the
 * app issues a unique code instead and the participant only has to copy it onto
 * their questionnaire.
 */
export function ParticipantIdIssued({
  code,
  busy = false,
  error,
  onRetry,
  onContinue,
}: {
  code: string | null
  busy?: boolean
  error?: string
  onRetry: () => void
  onContinue: () => void
}) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    if (!code) return
    haptic(HAPTIC.success)
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard access is blocked in some browsers; the code is on screen
      // anyway, so this is not worth interrupting anyone over.
    }
  }

  return (
    <Card accent={1} className="p-5">
      <h2
        className="ts-2 text-3xl font-black uppercase"
        style={{ fontFamily: 'var(--font-display)', color: accentTextAt(1) }}
      >
        รหัสของคุณ
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-white/80">
        ระบบออกรหัสนิรนามให้อัตโนมัติ ใช้จับคู่ข้อมูลในแอปกับคำตอบแบบสอบถามของท่าน
        โดยไม่ต้องเปิดเผยชื่อจริง
      </p>

      <div
        className="mt-4 rounded-2xl border-4 border-dashed p-5 text-center"
        style={{ borderColor: accentAt(2), background: `${accentAt(1)}1A` }}
      >
        {busy && !code ? (
          <p className="text-lg font-black text-white/60">กำลังออกรหัส…</p>
        ) : code ? (
          <p
            className="ts-1 text-4xl font-black tracking-[0.15em] tabular-nums"
            style={{ fontFamily: 'var(--font-display)', color: accentTextAt(2) }}
          >
            {code}
          </p>
        ) : (
          <p className="text-sm font-bold" style={{ color: '#FF6B35' }}>
            ยังออกรหัสไม่สำเร็จ
          </p>
        )}
      </div>

      {error && (
        <p
          className="mt-3 rounded-xl border-2 border-dashed px-3 py-2 text-xs font-bold"
          style={{ borderColor: '#FF3AF2', color: '#FF3AF2' }}
        >
          {error}
        </p>
      )}

      <p
        className="mt-4 rounded-xl border-2 border-dashed px-3 py-2 text-[11px] leading-relaxed font-bold"
        style={{ borderColor: accentAt(3), color: accentTextAt(3) }}
      >
        📝 จดรหัสนี้ไว้ หรือกดคัดลอก แล้วนำไปกรอกในแบบสอบถามของงานวิจัย
        ดูรหัสย้อนหลังได้ที่หน้าตั้งค่าเสมอ
      </p>

      <div className="mt-5 space-y-2">
        {code ? (
          <>
            <Button accent={1} variant="outline" className="w-full" onClick={() => void copy()}>
              {copied ? '✓ คัดลอกแล้ว' : '📋 คัดลอกรหัส'}
            </Button>
            <Button accent={2} className="w-full py-4" onClick={onContinue}>
              จดแล้ว ไปต่อ
            </Button>
          </>
        ) : (
          <Button accent={1} className="w-full py-4" disabled={busy} onClick={onRetry}>
            {busy ? 'กำลังออกรหัส…' : 'ลองออกรหัสอีกครั้ง'}
          </Button>
        )}
      </div>
    </Card>
  )
}
