import { useRef, useState } from 'react'
import { Button, Card } from './ui'
import { HAPTIC, accentAt, clashAt, haptic } from '../lib/design'
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
  const scrollRef = useRef<HTMLDivElement>(null)

  const allChecked = checked.every(Boolean)
  const canAgree = allChecked && scrolledToEnd && !busy

  function handleScroll() {
    const el = scrollRef.current
    if (!el) return
    // 24px of slack so a trackpad that stops just short still counts.
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 24) setScrolledToEnd(true)
  }

  function toggle(index: number) {
    haptic(HAPTIC.tap)
    setChecked((current) => current.map((v, i) => (i === index ? !v : v)))
  }

  return (
    <Card accent={4} className="p-5">
      <h2
        className="ts-2 text-3xl font-black uppercase"
        style={{ fontFamily: 'var(--font-display)', color: accentAt(4) }}
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

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="mt-4 max-h-[46vh] space-y-4 overflow-y-auto rounded-2xl border-2 border-white/15 bg-[#0D0D1A]/60 p-4"
      >
        {CONSENT_SHEET.map((section, i) => (
          <section key={section.heading}>
            <h3
              className="text-sm font-black uppercase"
              style={{ fontFamily: 'var(--font-display)', color: accentAt(i) }}
            >
              {section.heading}
            </h3>
            <ul className="mt-1.5 space-y-1.5">
              {section.body.map((line, j) => (
                <li key={j} className="flex gap-2 text-[13px] leading-relaxed text-white/85">
                  <span aria-hidden style={{ color: clashAt(i) }}>
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
            className="text-sm font-black uppercase"
            style={{ fontFamily: 'var(--font-display)', color: accentAt(3) }}
          >
            ติดต่อทีมวิจัย
          </h3>
          <p className="mt-1.5 text-[13px] leading-relaxed text-white/85">
            หากมีคำถาม ต้องการถอนตัว หรือขอให้ลบข้อมูล ติดต่อได้ที่{' '}
            <span className="font-bold" style={{ color: accentAt(3) }}>
              {RESEARCH_CONTACT_EMAIL}
            </span>
          </p>
        </section>

        <p className="pt-2 text-center text-[11px] font-bold text-white/40">— จบข้อความ —</p>
      </div>

      {!scrolledToEnd && (
        <p className="mt-2 text-center text-[11px] font-bold" style={{ color: accentAt(2) }}>
          ↓ เลื่อนอ่านให้ครบก่อนตัดสินใจ
        </p>
      )}

      <div className="mt-4 space-y-2">
        {CONSENT_CHECKS.map((label, i) => (
          <label
            key={label}
            className="flex cursor-pointer items-start gap-3 rounded-xl border-2 p-2.5 transition-colors"
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
            <span className="text-[13px] leading-snug text-white/90">{label}</span>
          </label>
        ))}
      </div>

      {/* Equal weight: same size, same prominence, different colour only. */}
      <div className="mt-5 grid grid-cols-2 gap-3">
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
          variant="outline"
          className="w-full py-4"
          disabled={!canAgree}
          vibrate={HAPTIC.success}
          onClick={onAgree}
        >
          ยินยอมเข้าร่วม
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
        style={{ fontFamily: 'var(--font-display)', color: accentAt(1) }}
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
            style={{ fontFamily: 'var(--font-display)', color: accentAt(2) }}
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
        style={{ borderColor: accentAt(3), color: accentAt(3) }}
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
