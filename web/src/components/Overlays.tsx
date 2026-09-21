import { useState } from 'react'
import { PetCanvas } from './PetCanvas'
import { Button, Card, Modal, TextInput } from './ui'
import { defaultPet } from '../lib/gameLogic'
import { SPECIES_INFO } from '../lib/types'
import type { PetSpecies } from '../lib/types'
import { useAppStore } from '../store/useAppStore'

const SPECIES_ORDER: PetSpecies[] = ['leaf', 'flame', 'water', 'stone']

function SpeciesPicker({
  selected,
  onSelect,
}: {
  selected: PetSpecies
  onSelect: (species: PetSpecies) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {SPECIES_ORDER.map((key) => {
        const info = SPECIES_INFO[key]
        const active = selected === key
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            className={`rounded-xl border p-3 text-left transition-all ${
              active
                ? 'border-transparent bg-[#27272a] ring-2'
                : 'border-[#3f3f46] hover:bg-[#27272a]'
            }`}
            style={active ? { ['--tw-ring-color' as string]: info.color } : undefined}
          >
            <span
              className="mb-1.5 block h-7 w-7 rounded-full"
              style={{ background: info.color }}
            />
            <p className="text-sm font-medium">{info.name}</p>
            <p className="mt-0.5 text-[11px] text-[#71717a]">{info.description}</p>
          </button>
        )
      })}
    </div>
  )
}

/** First run: name the pet and pick a species before seeing the app. */
export function Onboarding() {
  const completeOnboarding = useAppStore((s) => s.completeOnboarding)
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [species, setSpecies] = useState<PetSpecies>('leaf')
  const [saving, setSaving] = useState(false)

  const preview = defaultPet({ name: name.trim() || 'เจ้าตัวน้อย', species })

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center p-4">
      <Card animate>
        {step === 0 && (
          <div className="text-center">
            <PetCanvas pet={preview} />
            <h1 className="mt-4 text-2xl font-bold">ยินดีต้อนรับสู่ Focus Pet</h1>
            <div className="mt-4 space-y-3 text-left text-sm text-[#a1a1aa]">
              <p>
                <strong className="text-[#fafafa]">🌙 เวลาที่คุณไม่เล่นมือถือ</strong> จะกลายเป็น
                อาหารและพลังชีวิตของสัตว์เลี้ยง ยิ่งวางมือถือนาน มันยิ่งโต
              </p>
              <p>
                <strong className="text-[#fbbf24]">⚠️ มันหิวได้จริง และตายได้จริง</strong>{' '}
                ถ้าคุณหายไปหลายวันโดยไม่ดูแล มันจะอ่อนแอลงเรื่อย ๆ จนจากไป
                และจะไม่กลับมาอีก
              </p>
              <p>พร้อมจะรับเลี้ยงแล้วหรือยัง</p>
            </div>
            <Button className="mt-5 w-full py-3" onClick={() => setStep(1)}>
              เริ่มเลย
            </Button>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="text-lg font-semibold">เลือกเพื่อนของคุณ</h2>
            <p className="mt-1 text-xs text-[#71717a]">
              สายพันธุ์มีผลแค่หน้าตา ไม่มีผลต่อความยากง่าย
            </p>
            <div className="my-4">
              <PetCanvas pet={preview} compact />
            </div>
            <SpeciesPicker selected={species} onSelect={setSpecies} />
            <div className="mt-5 flex gap-2">
              <Button variant="ghost" onClick={() => setStep(0)}>
                ย้อนกลับ
              </Button>
              <Button className="flex-1" onClick={() => setStep(2)}>
                ถัดไป
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-lg font-semibold">ตั้งชื่อให้เพื่อนตัวน้อย</h2>
            <div className="my-4">
              <PetCanvas pet={preview} />
            </div>
            <TextInput
              value={name}
              onChange={setName}
              placeholder="เช่น น้องเขียว"
              maxLength={20}
              onEnter={() => {
                if (name.trim()) {
                  setSaving(true)
                  void completeOnboarding(name, species)
                }
              }}
            />
            <div className="mt-5 flex gap-2">
              <Button variant="ghost" onClick={() => setStep(1)}>
                ย้อนกลับ
              </Button>
              <Button
                className="flex-1"
                disabled={!name.trim() || saving}
                onClick={() => {
                  setSaving(true)
                  void completeOnboarding(name, species)
                }}
              >
                {saving ? 'กำลังสร้าง…' : 'รับเลี้ยง'}
              </Button>
            </div>
          </div>
        )}
      </Card>
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
    { label: 'ความหิว', value: report.hungerLost, color: '#10b981' },
    { label: 'ความสุข', value: report.happinessLost, color: '#f43f5e' },
    { label: 'พลังงาน', value: report.energyLost, color: '#f59e0b' },
    { label: 'สุขภาพ', value: report.healthLost, color: '#22d3ee' },
  ].filter((row) => row.value >= 1)

  return (
    <Modal onClose={dismiss}>
      <Card>
        <div className="text-center">
          <PetCanvas pet={pet} compact />
          <h2 className="mt-2 text-lg font-semibold">
            คุณหายไป {hours < 24 ? `${hours} ชั่วโมง` : `${Math.round(hours / 24)} วัน`}
          </h2>
          <p className="mt-1 text-sm text-[#a1a1aa]">ระหว่างนั้น {pet.name} เป็นแบบนี้</p>
        </div>

        <div className="mt-4 space-y-2">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between text-sm">
              <span className="text-[#a1a1aa]">{row.label}</span>
              <span style={{ color: row.color }}>−{Math.round(row.value)}</span>
            </div>
          ))}
        </div>

        {report.becameSick && (
          <p className="mt-4 rounded-xl bg-[#f59e0b]/10 px-3 py-2 text-xs text-[#fbbf24]">
            🤒 {pet.name} ป่วยแล้ว ใช้ยาสมุนไพรเพื่อรักษาก่อนที่จะสายเกินไป
          </p>
        )}

        <Button className="mt-5 w-full" onClick={dismiss}>
          ดูแลเลย
        </Button>
      </Card>
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

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center p-4">
      <Card animate>
        <div className="text-center">
          <PetCanvas pet={pet} />
          <h1 className="mt-3 text-xl font-bold">{pet.name} จากไปแล้ว</h1>
          <p className="mt-2 text-sm text-[#a1a1aa]">
            อยู่กับคุณมา {lifespanDays} วัน · ถึงเลเวล {pet.level}
            <br />
            ช่วยให้คุณปลอดหน้าจอไปทั้งหมด {pet.totalFocusMinutes} นาที
          </p>
        </div>

        <p className="mt-4 rounded-xl bg-[#27272a] px-3 py-2.5 text-center text-xs text-[#a1a1aa]">
          สถิติเวลาปลอดหน้าจอและข้อมูลทั้งหมดของคุณยังอยู่ครบ
          <br />
          ไม่มีอะไรหายไปจากบันทึกการวิจัย
        </p>

        <div className="mt-5">
          <h2 className="text-sm font-semibold">เริ่มใหม่อีกครั้ง</h2>
          <p className="mt-1 text-xs text-[#71717a]">
            เพื่อนตัวใหม่จะเริ่มจากเลเวล 1 แต่เวลาปลอดหน้าจอที่สะสมไว้จะถูกนำติดตัวไปด้วย
          </p>
          <div className="mt-3">
            <SpeciesPicker selected={species} onSelect={setSpecies} />
          </div>
          <div className="mt-3">
            <TextInput value={name} onChange={setName} placeholder="ตั้งชื่อตัวใหม่" maxLength={20} />
          </div>
          <Button
            className="mt-4 w-full py-3"
            disabled={!name.trim() || hatching}
            onClick={() => {
              setHatching(true)
              void revivePet(name, species)
            }}
          >
            {hatching ? 'กำลังฟัก…' : '🥚 ฟักไข่ใบใหม่'}
          </Button>
        </div>
      </Card>
    </div>
  )
}

/** Queued celebrations: session complete, level up, evolution, achievement. */
export function CelebrationModal() {
  const celebrations = useAppStore((s) => s.celebrations)
  const dismiss = useAppStore((s) => s.dismissCelebration)
  const current = celebrations[0]

  if (!current) return null

  return (
    <Modal onClose={dismiss}>
      <Card className="text-center">
        <p className="text-6xl">{current.emoji}</p>
        <h2 className="mt-3 text-xl font-semibold">{current.title}</h2>
        <p className="mt-1 text-sm text-[#a1a1aa]">{current.detail}</p>

        {current.session && (
          <>
            <div className="mt-4 flex justify-center gap-6 text-sm">
              <span className="text-[#8b5cf6]">+{current.session.expEarned} EXP</span>
              <span className="text-[#f59e0b]">+{current.session.coinsEarned} เหรียญ</span>
            </div>
            {current.session.itemRewardName && (
              <p className="mt-3 rounded-xl bg-[#27272a] px-3 py-2 text-sm">
                🎁 ได้รับ {current.session.itemRewardName}
              </p>
            )}
          </>
        )}

        <Button className="mt-5 w-full" onClick={dismiss}>
          {celebrations.length > 1 ? 'ถัดไป' : 'เยี่ยม!'}
        </Button>
      </Card>
    </Modal>
  )
}

export function ToastLayer() {
  const toasts = useAppStore((s) => s.toasts)
  const dismiss = useAppStore((s) => s.dismissToast)

  const tones = {
    info: 'bg-[#27272a] text-[#fafafa]',
    success: 'bg-[#10b981] text-[#052e22]',
    warning: 'bg-[#f59e0b] text-[#3b2503]',
    danger: 'bg-[#ef4444] text-white',
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[60] mx-auto flex max-w-lg flex-col items-center gap-2 px-4">
      {toasts.map((toast) => (
        <button
          key={toast.id}
          type="button"
          onClick={() => dismiss(toast.id)}
          className={`anim-toast pointer-events-auto w-full rounded-xl px-4 py-2.5 text-sm font-medium shadow-lg ${tones[toast.tone]}`}
        >
          {toast.message}
        </button>
      ))}
    </div>
  )
}
