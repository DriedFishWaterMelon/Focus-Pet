import { useState } from 'react'
import { ConsentSheet, ParticipantIdIssued } from '../components/ConsentSheet'
import { FloatingShapes } from '../components/Decor'
import { SpeciesPicker } from '../components/Overlays'
import { Button, Card, SectionTitle, TextInput } from '../components/ui'
import { RESEARCH_CONTACT_EMAIL } from '../lib/consent'
import { surveyUrlFor } from '../lib/survey'
import { HAPTIC, accentAt, haptic } from '../lib/design'
import type { EnrolmentStatus } from '../lib/types'
import { useAppStore } from '../store/useAppStore'

const STATUS_LABEL: Record<EnrolmentStatus, string> = {
  undecided: 'ยังไม่ได้ตัดสินใจ',
  consented: 'เข้าร่วมอยู่',
  declined: 'ไม่เข้าร่วม',
  withdrawn: 'ถอนตัวแล้ว',
}

const STATUS_COLOR: Record<EnrolmentStatus, string> = {
  undecided: '#FFE600',
  consented: '#00F5D4',
  declined: '#A1A1AA',
  withdrawn: '#FF6B35',
}

export function Settings() {
  const {
    profile,
    pet,
    renamePet,
    setSpecies,
    issueParticipantId,
    logOut,
    giveConsent,
    withdrawFromStudy,
  } = useAppStore()

  const [name, setName] = useState(pet.name)
  const [claiming, setClaiming] = useState(false)
  const [claimError, setClaimError] = useState<string | undefined>(undefined)
  const [showSheet, setShowSheet] = useState(false)
  const [confirmWithdraw, setConfirmWithdraw] = useState(false)

  const enrolment = profile?.enrolment
  const status: EnrolmentStatus = enrolment?.status ?? 'undecided'
  const idLocked = Boolean(enrolment?.participantIdSetAt)
  const needsId = status === 'consented' && !profile?.participantId
  // Only offered once there is a code to prefill; see surveyUrlFor.
  const surveyUrl =
    status === 'consented' ? surveyUrlFor(profile?.participantId ?? '') : null

  async function issueCode() {
    setClaiming(true)
    setClaimError(undefined)
    const result = await issueParticipantId()
    setClaiming(false)
    if (!result.ok) setClaimError(result.message)
  }

  return (
    <div className="space-y-7">
      <section className="space-y-3">
        <SectionTitle accent={0}>บัญชี</SectionTitle>
        <Card accent={0}>
          <div className="flex items-center gap-4">
            {profile?.photoUrl ? (
              <img
                src={profile.photoUrl}
                alt=""
                className="h-14 w-14 rounded-full border-4"
                style={{ borderColor: '#FFE600' }}
              />
            ) : (
              <div
                className="flex h-14 w-14 items-center justify-center rounded-full border-4 text-2xl"
                style={{ borderColor: '#FFE600', background: '#FF3AF233' }}
              >
                <span aria-hidden>🧑</span>
              </div>
            )}
            <div className="min-w-0">
              <p
                className="truncate text-lg font-black uppercase"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {profile?.displayName}
              </p>
              <p className="truncate text-xs font-bold text-white/60">
                {profile?.isAnonymous ? 'ผู้เยี่ยมชม' : profile?.email}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <Button accent={0} variant="secondary" className="w-full" onClick={() => void logOut()}>
              ออกจากระบบ
            </Button>
          </div>
        </Card>
      </section>

      <section className="space-y-3">
        <SectionTitle accent={1}>การเข้าร่วมวิจัย</SectionTitle>

        <Card accent={1}>
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-black tracking-widest text-white/60 uppercase">
              สถานะ
            </span>
            <span
              className="rounded-full border-2 px-3 py-1 text-xs font-black"
              style={{ borderColor: STATUS_COLOR[status], color: STATUS_COLOR[status] }}
            >
              {STATUS_LABEL[status]}
            </span>
          </div>

          {status === 'consented' && (
            <>
              <dl className="mt-4 space-y-2 text-sm">
                <CodeRow code={profile?.participantId ?? ''} />
                <Row
                  label="ยินยอมเมื่อ"
                  value={
                    enrolment?.consentedAt
                      ? new Date(enrolment.consentedAt).toLocaleDateString('th-TH')
                      : '—'
                  }
                  accent={2}
                />
                <Row label="เวอร์ชันเอกสาร" value={enrolment?.consentVersion ?? '—'} accent={3} />
              </dl>

              {needsId && (
                <p
                  className="mt-4 rounded-xl border-2 border-dashed px-3 py-2 text-xs leading-relaxed font-bold"
                  style={{ borderColor: '#FF6B35', color: '#FF6B35' }}
                >
                  ⚠️ ยังไม่มีรหัสผู้เข้าร่วม ข้อมูลของคุณจะยังไม่ถูกนำไปวิเคราะห์
                </p>
              )}

              {surveyUrl && (
                <a
                  href={surveyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 block"
                  onClick={() => haptic(HAPTIC.tap)}
                >
                  <div
                    className="flex items-center justify-between gap-2 rounded-2xl border-4 px-4 py-3 transition-transform active:scale-95"
                    style={{
                      borderColor: '#FFE600',
                      background: '#00F5D422',
                      boxShadow: '4px 4px 0 #00F5D4',
                    }}
                  >
                    <span className="text-left">
                      <span
                        className="block text-sm font-black uppercase"
                        style={{ fontFamily: 'var(--font-display)', color: '#00F5D4' }}
                      >
                        📝 ทำแบบสอบถามงานวิจัย
                      </span>
                      <span className="block text-[10px] font-bold text-white/60">
                        เปิดฟอร์มพร้อมกรอกรหัสให้แล้ว ไม่ต้องพิมพ์เอง
                      </span>
                    </span>
                    <span aria-hidden className="text-xl" style={{ color: '#FFE600' }}>
                      ›
                    </span>
                  </div>
                </a>
              )}

              {idLocked && (
                <p className="mt-3 text-[11px] leading-relaxed text-white/50">
                  นำรหัสนี้ไปกรอกในแบบสอบถามของงานวิจัย รหัสออกให้ครั้งเดียวและเปลี่ยนไม่ได้{' '}
                  หากมีปัญหาติดต่อ {RESEARCH_CONTACT_EMAIL}
                </p>
              )}
            </>
          )}

          {(status === 'undecided' || status === 'declined') && (
            <p className="mt-3 text-sm leading-relaxed text-white/75">
              ตอนนี้ระบบไม่ได้บันทึกข้อมูลใด ๆ เพื่อการวิจัย
              คุณใช้งานแอปได้เต็มรูปแบบเหมือนเดิม หากเปลี่ยนใจสามารถอ่านเอกสารและเข้าร่วมได้ตลอดเวลา
            </p>
          )}

          {status === 'withdrawn' && (
            <p className="mt-3 text-sm leading-relaxed text-white/75">
              คุณถอนตัวเมื่อ{' '}
              {enrolment?.withdrawnAt
                ? new Date(enrolment.withdrawnAt).toLocaleDateString('th-TH')
                : '—'}{' '}
              ระบบหยุดบันทึกข้อมูลใหม่แล้ว หากต้องการให้ลบข้อมูลที่เก็บไปก่อนหน้านี้ กรุณาติดต่อ{' '}
              {RESEARCH_CONTACT_EMAIL}
            </p>
          )}

          <div className="mt-5 space-y-2">
            {needsId && !showSheet && (
              <Button
                accent={1}
                className="w-full"
                onClick={() => {
                  setShowSheet(true)
                  void issueCode()
                }}
              >
                ขอรหัสผู้เข้าร่วม
              </Button>
            )}

            {status !== 'consented' && !showSheet && (
              <Button
                accent={1}
                variant="outline"
                className="w-full"
                onClick={() => setShowSheet(true)}
              >
                อ่านเอกสารและเข้าร่วม
              </Button>
            )}

            {status === 'consented' && !confirmWithdraw && (
              <Button
                accent={3}
                variant="ghost"
                className="w-full"
                onClick={() => setConfirmWithdraw(true)}
              >
                ถอนตัวจากงานวิจัย
              </Button>
            )}

            {status === 'consented' && confirmWithdraw && (
              <div
                className="rounded-2xl border-4 border-dashed p-3"
                style={{ borderColor: '#FF6B35' }}
              >
                <p className="text-sm leading-relaxed font-bold text-white/85">
                  ยืนยันการถอนตัว? ระบบจะหยุดบันทึกข้อมูลเพื่อการวิจัยทันที
                  คุณยังใช้งานแอปได้ตามปกติ
                </p>
                {/* Saying the data still exists is the honest thing to do. The app
                    cannot delete another user's records, and promising otherwise
                    here would be a consent violation dressed up as a feature. */}
                <p className="mt-2 text-[11px] leading-relaxed text-white/60">
                  ข้อมูลที่เก็บไปก่อนหน้านี้จะยังอยู่ในระบบ หากต้องการให้ลบ กรุณาติดต่อทีมวิจัย
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button accent={1} variant="outline" onClick={() => setConfirmWithdraw(false)}>
                    ยกเลิก
                  </Button>
                  <Button
                    accent={3}
                    variant="outline"
                    vibrate={HAPTIC.warn}
                    onClick={() => {
                      setConfirmWithdraw(false)
                      void withdrawFromStudy()
                    }}
                  >
                    ยืนยันถอนตัว
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>

        {showSheet && status !== 'consented' && (
          <ConsentSheet
            busy={claiming}
            onAgree={async () => {
              setClaiming(true)
              await giveConsent()
              setClaiming(false)
            }}
            onDecline={() => setShowSheet(false)}
          />
        )}

        {showSheet && needsId && (
          <ParticipantIdIssued
            code={profile?.participantId || null}
            busy={claiming}
            error={claimError}
            onRetry={() => void issueCode()}
            onContinue={() => setShowSheet(false)}
          />
        )}
      </section>

      <section className="space-y-3">
        <SectionTitle accent={2}>สีของสัตว์เลี้ยง</SectionTitle>
        <Card accent={2}>
          <p className="text-sm leading-snug text-white/75">
            เปลี่ยนได้ตลอดเวลา สีไม่มีผลต่อความยากง่ายหรือข้อมูลวิจัย
          </p>
          <div className="mt-4">
            <SpeciesPicker
              selected={pet.species}
              onSelect={(next) => void setSpecies(next)}
            />
          </div>
        </Card>
      </section>

      <section className="space-y-3">
        <SectionTitle accent={3}>ตั้งชื่อสัตว์เลี้ยง</SectionTitle>
        <Card accent={2}>
          <div className="flex gap-2">
            <div className="flex-1">
              <TextInput accent={2} value={name} onChange={setName} maxLength={20} />
            </div>
            <Button
              accent={2}
              disabled={!name.trim()}
              vibrate={HAPTIC.success}
              onClick={() => void renamePet(name)}
            >
              เปลี่ยน
            </Button>
          </div>
        </Card>
      </section>

      <section className="space-y-3">
        <SectionTitle accent={3}>เกี่ยวกับการวัดเวลาหน้าจอ</SectionTitle>
        <Card accent={3}>
          <FloatingShapes count={3} seed={44} />
          <p className="relative z-10 text-sm leading-relaxed text-white/80">
            เว็บเบราว์เซอร์ไม่สามารถอ่านเวลาการใช้งานหน้าจอของมือถือได้โดยตรง
            เพราะเป็นข้อจำกัดด้านความปลอดภัยของ Android และ iOS
          </p>
          <p className="relative z-10 mt-3 text-sm leading-relaxed text-white/80">
            เว็บนี้จึงวัดได้เฉพาะ{' '}
            <strong style={{ color: accentAt(3) }}>
              เวลาที่คุณเปิดเซสชันปลอดหน้าจอค้างไว้ในแท็บนี้
            </strong>{' '}
            ถ้าสลับไปแท็บอื่นระบบจะบันทึกว่าถูกขัดจังหวะ
            ส่วนเวลาหน้าจอรวมรายวันต้องกรอกเองจากหน้าสถิติ
          </p>
        </Card>
      </section>

      <section className="space-y-3">
        <SectionTitle accent={4}>สัตว์เลี้ยงตัวนี้</SectionTitle>
        <Card accent={4}>
          <dl className="space-y-2.5 text-sm">
            <Row label="รุ่นที่" value={String(pet.generation)} accent={4} />
            <Row
              label="เกิดเมื่อ"
              value={new Date(pet.bornAt).toLocaleDateString('th-TH')}
              accent={0}
            />
            <Row label="เลเวล" value={String(pet.level)} accent={1} />
            <Row label="นาทีปลอดหน้าจอ" value={String(pet.totalFocusMinutes)} accent={2} />
          </dl>
        </Card>
      </section>
    </div>
  )
}

/**
 * The participant code with a copy button. It is the one value in here people
 * have to transcribe onto a questionnaire, so it gets larger type, letter
 * spacing and one tap to copy rather than being a row of small text.
 */
function CodeRow({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    if (!code) return
    haptic(HAPTIC.success)
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard access is blocked in some browsers; the code stays on screen.
    }
  }

  return (
    <div className="flex items-center justify-between gap-2 border-b-2 border-dashed border-white/10 pb-2">
      <dt className="text-xs font-black tracking-widest text-white/60 uppercase">รหัสผู้เข้าร่วม</dt>
      <dd className="flex items-center gap-2">
        <span
          className="text-lg font-black tracking-[0.1em]"
          style={{ fontFamily: 'var(--font-display)', color: accentAt(1) }}
        >
          {code || 'ยังไม่มี'}
        </span>
        {code && (
          <button
            type="button"
            onClick={() => void copy()}
            aria-label="คัดลอกรหัส"
            className="rounded-lg border-2 px-2 py-0.5 text-[10px] font-black transition-transform active:scale-90"
            style={{ borderColor: accentAt(2), color: accentAt(2) }}
          >
            {copied ? '✓' : '📋'}
          </button>
        )}
      </dd>
    </div>
  )
}

function Row({ label, value, accent }: { label: string; value: string; accent: number }) {
  return (
    <div className="flex items-center justify-between border-b-2 border-dashed border-white/10 pb-2">
      <dt className="text-xs font-black tracking-widest text-white/60 uppercase">{label}</dt>
      <dd className="text-base font-black" style={{ color: accentAt(accent) }}>
        {value}
      </dd>
    </div>
  )
}
