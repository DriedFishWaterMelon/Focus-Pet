import { useEffect, useRef, useState } from 'react'
import { Burst, ScreenFlash } from './Burst'
import { BackgroundWord, FloatingShapes, Marquee } from './Decor'
import { PetCanvas } from './PetCanvas'
import { ConsentSheet, ParticipantIdIssued } from './ConsentSheet'
import { Button, Card, Modal, TextInput } from './ui'
import { HAPTIC, accentAt, clashAt, haptic, readableOn } from '../lib/design'
import { defaultPet } from '../lib/gameLogic'
import { SPECIES_INFO } from '../lib/types'
import type { PetSpecies } from '../lib/types'
import { useAppStore } from '../store/useAppStore'

const SPECIES_ORDER: PetSpecies[] = ['leaf', 'flame', 'water', 'stone']

/** Colour picker, shared by onboarding and Settings. */
export function SpeciesPicker({
  selected,
  onSelect,
}: {
  selected: PetSpecies
  onSelect: (species: PetSpecies) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {SPECIES_ORDER.map((key) => {
        const info = SPECIES_INFO[key]
        const [primary, accent] = info.palette
        const active = selected === key
        return (
          <button
            key={key}
            type="button"
            onClick={() => {
              haptic(HAPTIC.tap)
              onSelect(key)
            }}
            className={`relative overflow-hidden rounded-2xl border-4 p-3 text-left transition-all duration-300 ${
              active ? 'scale-105 -rotate-2' : 'hover:scale-[1.03]'
            }`}
            style={{
              borderColor: active ? accent : primary,
              background: active ? `${primary}44` : 'rgba(45,27,78,0.6)',
              boxShadow: active ? `5px 5px 0 ${primary}` : 'none',
            }}
          >
            <span
              aria-hidden
              className={`mb-2 block h-9 w-9 rounded-full border-4 ${active ? 'animate-bounce-subtle' : ''}`}
              style={{ background: `linear-gradient(135deg, ${primary}, ${accent})`, borderColor: accent }}
            />
            <p
              className="text-sm font-black uppercase"
              style={{ fontFamily: 'var(--font-display)', color: primary }}
            >
              {info.name}
            </p>
            <p className="mt-0.5 text-[10px] leading-tight text-white/60">{info.description}</p>
          </button>
        )
      })}
    </div>
  )
}

/**
 * Onboarding order matters ethically: the consent sheet comes after a plain
 * explanation of what the app is, but before the person names a pet. Asking for
 * consent only once someone has designed and named a companion would lean on
 * sunk cost, and consent given under that pressure is not freely given.
 */
type Step = 'intro' | 'consent' | 'participantId' | 'species' | 'name'

const STEP_ORDER: Step[] = ['intro', 'consent', 'participantId', 'species', 'name']

const BACKDROP: Record<Step, string> = {
  intro: 'HI',
  consent: 'READ',
  participantId: 'CODE',
  species: 'PICK',
  name: 'NAME',
}

export function Onboarding() {
  const completeOnboarding = useAppStore((s) => s.completeOnboarding)
  const giveConsent = useAppStore((s) => s.giveConsent)
  const declineConsent = useAppStore((s) => s.declineConsent)
  const issueParticipantId = useAppStore((s) => s.issueParticipantId)
  const issuedCode = useAppStore((s) => s.profile?.participantId ?? null)
  const [step, setStep] = useState<Step>('intro')
  const [claiming, setClaiming] = useState(false)
  const [claimError, setClaimError] = useState<string | undefined>(undefined)
  const [name, setName] = useState('')
  const [species, setSpecies] = useState<PetSpecies>('leaf')
  const [saving, setSaving] = useState(false)

  const preview = defaultPet({ name: name.trim() || 'เจ้าตัวน้อย', species })

  async function issueCode() {
    setClaiming(true)
    setClaimError(undefined)
    const result = await issueParticipantId()
    setClaiming(false)
    if (!result.ok) setClaimError(result.message)
  }

  function finish() {
    setSaving(true)
    haptic(HAPTIC.reward)
    void completeOnboarding(name, species)
  }

  return (
    <div className="relative flex min-h-screen flex-col justify-center overflow-hidden p-4">
      <BackgroundWord
        word={BACKDROP[step]}
        className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        accent={STEP_ORDER.indexOf(step)}
      />
      <FloatingShapes count={9} seed={STEP_ORDER.indexOf(step) * 7} />

      <div className="relative z-10 mx-auto w-full max-w-sm">
        {step === 'consent' && (
          <ConsentSheet
            busy={claiming}
            onAgree={async () => {
              setClaiming(true)
              await giveConsent()
              setStep('participantId')
              await issueCode()
            }}
            onDecline={async () => {
              setClaiming(true)
              await declineConsent()
              setClaiming(false)
              setStep('species')
            }}
          />
        )}

        {step === 'participantId' && (
          <ParticipantIdIssued
            code={issuedCode || null}
            busy={claiming}
            error={claimError}
            onRetry={() => void issueCode()}
            onContinue={() => setStep('species')}
          />
        )}

        {step !== 'consent' && step !== 'participantId' && (
        <Card accent={STEP_ORDER.indexOf(step)} className="p-6">
          {step === 'intro' && (
            <div className="text-center">
              <PetCanvas pet={preview} />
              <h1
                className="text-rainbow mt-4 text-4xl font-black tracking-tighter uppercase"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                ยินดีต้อนรับ
              </h1>
              <div className="mt-4 space-y-3 text-left text-sm leading-relaxed">
                <p className="text-white/85">
                  <strong style={{ color: '#00F5D4' }}>🌙 เวลาที่คุณไม่เล่นมือถือ</strong>{' '}
                  จะกลายเป็นอาหารและพลังชีวิตของสัตว์เลี้ยง ยิ่งวางมือถือนาน มันยิ่งโต
                </p>
                <p
                  className="rounded-2xl border-4 border-dashed p-3"
                  style={{ borderColor: '#FF6B35', color: '#FFE600' }}
                >
                  <strong>⚠️ มันหิวได้จริง และตายได้จริง</strong>{' '}
                  <span className="text-white/80">
                    ถ้าคุณหายไปหลายวันโดยไม่ดูแล มันจะอ่อนแอลงจนจากไป และไม่กลับมาอีก
                  </span>
                </p>
              </div>
              <div className="mt-5">
                <Button accent={0} className="w-full py-4" onClick={() => setStep('consent')}>
                  เริ่มเลย
                </Button>
              </div>
            </div>
          )}

          {step === 'species' && (
            <div>
              <h2
                className="ts-2 text-3xl font-black uppercase"
                style={{ fontFamily: 'var(--font-display)', color: accentAt(1) }}
              >
                เลือกสี
              </h2>
              <p className="mt-1 text-xs font-bold text-white/60">
                เปลี่ยนทีหลังได้ในหน้าตั้งค่า ไม่มีผลต่อความยากง่าย
              </p>
              <div className="my-4">
                <PetCanvas pet={preview} compact />
              </div>
              <SpeciesPicker selected={species} onSelect={setSpecies} />
              <div className="mt-5 flex gap-2">
                <Button accent={3} variant="secondary" onClick={() => setStep('intro')}>
                  กลับ
                </Button>
                <Button accent={1} className="flex-1" onClick={() => setStep('name')}>
                  ถัดไป
                </Button>
              </div>
            </div>
          )}

          {step === 'name' && (
            <div>
              <h2
                className="ts-2 text-3xl font-black uppercase"
                style={{ fontFamily: 'var(--font-display)', color: accentAt(2) }}
              >
                ตั้งชื่อ
              </h2>
              <div className="my-4">
                <PetCanvas pet={preview} />
              </div>
              <TextInput
                accent={2}
                value={name}
                onChange={setName}
                placeholder="เช่น น้องเขียว"
                maxLength={20}
                onEnter={() => name.trim() && finish()}
              />
              <div className="mt-5 flex gap-2">
                <Button accent={3} variant="secondary" onClick={() => setStep('species')}>
                  กลับ
                </Button>
                <Button
                  accent={2}
                  className="flex-1"
                  disabled={!name.trim() || saving}
                  onClick={finish}
                >
                  {saving ? 'กำลังสร้าง…' : 'รับเลี้ยง'}
                </Button>
              </div>
            </div>
          )}
        </Card>
        )}
      </div>
    </div>
  )
}

/** Shown once after the app reopens, summarising what the pet went through. */
export function AwayReportModal() {
  const report = useAppStore((s) => s.awayReport)
  const pet = useAppStore((s) => s.pet)
  const dismiss = useAppStore((s) => s.dismissAwayReport)

  // A death gets the memorial screen instead, and short gaps are not worth a modal.
  if (!report || report.died || report.hoursAway < 4) return null

  const hours = Math.round(report.hoursAway)
  const rows = [
    { label: 'ความหิว', value: report.hungerLost, accent: 0 },
    { label: 'ความสุข', value: report.happinessLost, accent: 3 },
    { label: 'พลังงาน', value: report.energyLost, accent: 2 },
    { label: 'สุขภาพ', value: report.healthLost, accent: 1 },
  ].filter((row) => row.value >= 1)

  return (
    <Modal onClose={dismiss} accent={3}>
      <div className="text-center">
        <PetCanvas pet={pet} compact />
        <h2
          className="ts-2 mt-2 text-3xl font-black uppercase"
          style={{ fontFamily: 'var(--font-display)', color: '#FF6B35' }}
        >
          คุณหายไป {hours < 24 ? `${hours} ชม.` : `${Math.round(hours / 24)} วัน`}
        </h2>
        <p className="mt-1 text-xs font-bold text-white/70">ระหว่างนั้น {pet.name} เป็นแบบนี้</p>
      </div>

      <div className="mt-4 space-y-2">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between rounded-xl border-2 px-3 py-1.5"
            style={{ borderColor: accentAt(row.accent), background: `${accentAt(row.accent)}18` }}
          >
            <span className="text-xs font-black tracking-widest text-white/75 uppercase">
              {row.label}
            </span>
            <span className="text-lg font-black" style={{ color: accentAt(row.accent) }}>
              −{Math.round(row.value)}
            </span>
          </div>
        ))}
      </div>

      {report.becameSick && (
        <p
          className="mt-4 rounded-2xl border-4 border-dashed px-3 py-2 text-center text-xs font-black"
          style={{ borderColor: '#FFE600', color: '#FFE600' }}
        >
          🤒 {pet.name} ป่วยแล้ว ใช้ยาก่อนสายเกินไป
        </p>
      )}

      <div className="mt-5">
        <Button accent={3} className="w-full" onClick={dismiss}>
          ดูแลเลย
        </Button>
      </div>
    </Modal>
  )
}

/** The pet is gone. Offers a fresh start without erasing recorded research data. */
export function DeathScreen() {
  const pet = useAppStore((s) => s.pet)
  const revivePet = useAppStore((s) => s.revivePet)
  const [name, setName] = useState('')
  const [species, setSpecies] = useState<PetSpecies>('leaf')
  const [hatching, setHatching] = useState(false)

  const lifespanDays = Math.max(1, Math.round((Date.now() - pet.bornAt) / 86_400_000))

  // The one screen with no colour rotation and no floating shapes. Turning the
  // chaos off is what makes a death register as a loss rather than another event.
  return (
    <div className="flex min-h-screen flex-col justify-center p-4">
      <div className="mx-auto w-full max-w-sm">
        <div className="rounded-3xl border-4 border-[#3F3F46] bg-[#2D1B4E]/60 p-6">
          <div className="text-center">
            <PetCanvas pet={pet} />
            <h1
              className="mt-3 text-3xl font-black uppercase"
              style={{ fontFamily: 'var(--font-display)', color: '#A1A1AA' }}
            >
              {pet.name} จากไปแล้ว
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-white/70">
              อยู่กับคุณมา {lifespanDays} วัน · ถึงเลเวล {pet.level}
              <br />
              ช่วยให้คุณปลอดหน้าจอไป {pet.totalFocusMinutes} นาที
            </p>
          </div>

          <p
            className="mt-5 rounded-2xl border-2 border-dashed px-3 py-2.5 text-center text-[11px] leading-relaxed font-bold"
            style={{ borderColor: '#00F5D4', color: '#00F5D4' }}
          >
            สถิติเวลาปลอดหน้าจอและข้อมูลทั้งหมดของคุณยังอยู่ครบ
            <br />
            ไม่มีอะไรหายไปจากบันทึกการวิจัย
          </p>

          <div className="mt-6">
            <h2
              className="text-xl font-black uppercase"
              style={{ fontFamily: 'var(--font-display)', color: '#FFE600' }}
            >
              เริ่มใหม่อีกครั้ง
            </h2>
            <p className="mt-1 text-xs text-white/60">
              เพื่อนตัวใหม่เริ่มจากเลเวล 1 แต่เวลาปลอดหน้าจอที่สะสมไว้จะติดตัวไปด้วย
            </p>
            <div className="mt-4">
              <SpeciesPicker selected={species} onSelect={setSpecies} />
            </div>
            <div className="mt-4">
              <TextInput
                accent={2}
                value={name}
                onChange={setName}
                placeholder="ตั้งชื่อตัวใหม่"
                maxLength={20}
              />
            </div>
            <div className="mt-5">
              <Button
                accent={2}
                className="w-full py-4"
                disabled={!name.trim() || hatching}
                vibrate={HAPTIC.reward}
                onClick={() => {
                  setHatching(true)
                  void revivePet(name, species)
                }}
              >
                {hatching ? 'กำลังฟัก…' : '🥚 ฟักไข่ใบใหม่'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Queued celebrations. This is the payoff moment the whole design builds toward,
 * so it fires everything at once: confetti, a screen flash, haptics and a
 * slam-in modal.
 */
export function CelebrationModal() {
  const celebrations = useAppStore((s) => s.celebrations)
  const dismiss = useAppStore((s) => s.dismissCelebration)
  const current = celebrations[0]

  const [burst, setBurst] = useState(0)
  const [flash, setFlash] = useState(0)
  const lastTitle = useRef<string | null>(null)

  const isBig = current?.kind === 'levelUp' || current?.kind === 'evolution'

  useEffect(() => {
    if (!current) {
      lastTitle.current = null
      return
    }
    // Re-fire for each queued celebration, not just the first.
    const key = `${current.kind}-${current.title}-${celebrations.length}`
    if (lastTitle.current === key) return
    lastTitle.current = key

    setBurst((n) => n + 1)
    haptic(isBig ? HAPTIC.reward : HAPTIC.success)
    if (isBig) setFlash((n) => n + 1)
  }, [current, celebrations.length, isBig])

  if (!current) return null

  const accent = current.kind === 'evolution' ? 4 : current.kind === 'levelUp' ? 2 : 1

  return (
    <>
      <Burst trigger={burst} intensity={isBig ? 1.6 : 1} />
      <ScreenFlash trigger={flash} color={`${accentAt(accent)}66`} />

      <Modal onClose={dismiss} accent={accent}>
        <div className="text-center">
          <p aria-hidden className="animate-pop text-7xl">
            {current.emoji}
          </p>
          <h2
            className="text-rainbow mt-3 text-4xl font-black tracking-tighter uppercase"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {current.title}
          </h2>
          <p className="mt-2 text-sm font-bold text-white/80">{current.detail}</p>

          {current.session && (
            <>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <RewardTile label="EXP" value={current.session.expEarned} accent={4} />
                <RewardTile label="เหรียญ" value={current.session.coinsEarned} accent={2} />
              </div>
              {current.session.itemRewardName && (
                <p
                  className="animate-pop mt-3 rounded-2xl border-4 border-dashed px-3 py-2.5 text-sm font-black"
                  style={{ borderColor: '#00F5D4', color: '#00F5D4' }}
                >
                  🎁 ได้รับ {current.session.itemRewardName}
                </p>
              )}
            </>
          )}

          <div className="mt-5">
            <Button accent={accent} className="w-full py-4" onClick={dismiss}>
              {celebrations.length > 1 ? 'ถัดไป →' : 'เยี่ยม!'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

function RewardTile({ label, value, accent }: { label: string; value: number; accent: number }) {
  const color = accentAt(accent)
  return (
    <div
      className="animate-pop rounded-2xl border-4 p-3"
      style={{ borderColor: clashAt(accent), background: `${color}26` }}
    >
      <p className="text-3xl font-black" style={{ fontFamily: 'var(--font-display)', color }}>
        +{value}
      </p>
      <p className="text-[10px] font-black tracking-widest text-white/70 uppercase">{label}</p>
    </div>
  )
}

export function ToastLayer() {
  const toasts = useAppStore((s) => s.toasts)
  const dismiss = useAppStore((s) => s.dismissToast)

  const tones = {
    info: { bg: '#7B2FFF', border: '#00F5D4' },
    success: { bg: '#00F5D4', border: '#FF3AF2' },
    warning: { bg: '#FFE600', border: '#FF3AF2' },
    danger: { bg: '#FF3AF2', border: '#FFE600' },
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[60] mx-auto flex max-w-lg flex-col items-center gap-2 px-4">
      {toasts.map((toast) => {
        const tone = tones[toast.tone]
        return (
          <button
            key={toast.id}
            type="button"
            onClick={() => dismiss(toast.id)}
            className="animate-toast pointer-events-auto w-full rounded-2xl border-4 px-4 py-3 text-sm font-black tracking-wide uppercase"
            style={{
              fontFamily: 'var(--font-display)',
              background: tone.bg,
              borderColor: tone.border,
              color: readableOn(tone.bg),
              boxShadow: `5px 5px 0 ${tone.border}`,
            }}
          >
            {toast.message}
          </button>
        )
      })}
    </div>
  )
}

export { Marquee }
