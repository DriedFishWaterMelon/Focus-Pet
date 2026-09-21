import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { BackgroundWord, FloatingShapes, Marquee } from '../components/Decor'
import { GrowthPreviewButton } from '../components/GrowthPreview'
import { PetCanvas } from '../components/PetCanvas'
import { AnimatedNumber, Button, Card, SectionTitle, StatBar, StatTile } from '../components/ui'
import { FloatingGain } from '../components/Burst'
import { HAPTIC, accentAt, haptic } from '../lib/design'
import {
  SICK_THRESHOLD,
  expProgress,
  hoursUntilDeath,
  moodOf,
  streakAtRisk,
  toIsoDate,
} from '../lib/gameLogic'
import { useAppStore } from '../store/useAppStore'

export function Home() {
  const pet = useAppStore((s) => s.pet)
  const inventory = useAppStore((s) => s.inventory)
  const pat = useAppStore((s) => s.pat)
  const feed = useAppStore((s) => s.feed)
  const isFocusActive = useAppStore((s) => s.isFocusActive)

  const mood = moodOf(pet)
  const atRisk = streakAtRisk(pet, toIsoDate(Date.now()))
  const hoursLeft = hoursUntilDeath(pet)

  const quickFood = inventory.find((item) => item.category === 'FOOD' && item.quantity > 0)
  const medicine = inventory.find((item) => item.category === 'MEDICINE' && item.quantity > 0)
  const needsMedicine = pet.health < SICK_THRESHOLD

  // Float the EXP gain off the pet whenever it actually increases, so patting
  // and feeding produce a visible number rather than a silent stat change.
  const [gains, setGains] = useState<{ id: number; label: string; color: string }[]>([])
  const prevExp = useRef(pet.exp)
  const gainSeq = useRef(0)

  useEffect(() => {
    const delta = pet.exp - prevExp.current
    prevExp.current = pet.exp
    if (delta <= 0) return

    const id = ++gainSeq.current
    setGains((current) => [...current, { id, label: `+${delta} EXP`, color: '#FFE600' }])
    window.setTimeout(() => setGains((current) => current.filter((g) => g.id !== id)), 1200)
  }, [pet.exp])

  return (
    <div className="space-y-6">
      {needsMedicine && (
        <div
          className="animate-slam relative overflow-hidden rounded-3xl border-4 border-dashed p-5"
          style={{
            borderColor: '#FFE600',
            background: '#FF3AF2',
            boxShadow: '6px 6px 0 #7B2FFF, 12px 12px 0 #00F5D4',
          }}
        >
          <FloatingShapes count={4} seed={9} />
          <p
            className="relative z-10 text-xl font-black uppercase"
            style={{ fontFamily: 'var(--font-display)', textShadow: '2px 2px 0 #0D0D1A' }}
          >
            🚨 {pet.name} ป่วยหนัก!
          </p>
          <p className="relative z-10 mt-1 text-sm font-bold text-white">
            เหลือเวลาอีกประมาณ {Math.round(hoursLeft)} ชั่วโมง
          </p>
          <div className="relative z-10 mt-4">
            {medicine ? (
              <Button
                variant="outline"
                accent={2}
                className="w-full"
                vibrate={HAPTIC.warn}
                onClick={() => void feed(medicine)}
              >
                💊 ใช้{medicine.name}
              </Button>
            ) : (
              <Link to="/shop" className="block">
                <Button variant="outline" accent={2} className="w-full">
                  ไปร้านค้าด่วน
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Hero: the pet, framed by oversized type and floating shapes. */}
      <div className="relative overflow-hidden rounded-3xl border-4 border-[#00F5D4] bg-[#2D1B4E]/70 py-6 backdrop-blur-sm"
        style={{ boxShadow: '8px 8px 0 #FF3AF2, 16px 16px 0 #FFE600' }}
      >
        <BackgroundWord word="PET" className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" accent={4} />
        <FloatingShapes count={8} seed={2} />
        <div className="relative z-10">
          <PetCanvas pet={pet} isFocusActive={isFocusActive} onPat={() => void pat()} />
          {gains.map((gain) => (
            <FloatingGain key={gain.id} id={gain.id} label={gain.label} color={gain.color} />
          ))}
          <p
            className="mt-4 text-center text-[10px] font-black tracking-widest text-white/60 uppercase"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            ▸ แตะเพื่อเล่นด้วย ◂
          </p>
          <div className="relative z-10 mt-3 flex justify-center">
            <GrowthPreviewButton pet={pet} />
          </div>
        </div>
      </div>

      <Marquee text={`${pet.totalFocusMinutes} นาทีปลอดหน้าจอ`} accent={2} />

      <div className="grid grid-cols-3 gap-3">
        <StatTile label="นาทีสะสม" value={pet.totalFocusMinutes} accent={0} animate />
        <StatTile
          label="ต่อเนื่อง"
          value={pet.streakDays}
          hint={atRisk ? '⚠️ วันนี้ยังไม่ทำ' : 'วัน'}
          accent={1}
          animate
        />
        <StatTile label="เหรียญ" value={pet.coins} accent={2} animate />
      </div>

      <section className="space-y-3">
        <SectionTitle accent={4}>สถานะ</SectionTitle>
        <Card accent={4} className="space-y-3.5">
          <StatBar label="สุขภาพ" value={pet.health} accent={1} icon="💗" warn={pet.health < SICK_THRESHOLD} />
          <StatBar label="ความหิว" value={pet.hunger} accent={0} icon="🍃" warn={pet.hunger < 30} />
          <StatBar label="ความสุข" value={pet.happiness} accent={3} icon="❤️" />
          <StatBar label="พลังงาน" value={pet.energy} accent={2} icon="⚡" warn={pet.energy < 25} />
          <StatBar label="EXP" value={expProgress(pet) * 100} accent={4} icon="✨" />
        </Card>
      </section>

      {quickFood && mood === 'HUNGRY' && (
        <Button
          variant="outline"
          accent={0}
          className="w-full"
          vibrate={HAPTIC.success}
          onClick={() => void feed(quickFood)}
        >
          {quickFood.iconEmoji} ให้{quickFood.name}เลย
        </Button>
      )}

      {atRisk && (
        <div
          className="animate-wiggle rounded-2xl border-4 border-dotted p-3 text-center will-change-transform"
          style={{ borderColor: '#FF6B35', background: '#FF6B3522' }}
        >
          <p className="text-sm font-black tracking-wide uppercase" style={{ color: '#FF6B35' }}>
            🔥 อย่าให้สถิติ {pet.streakDays} วันขาด!
          </p>
        </div>
      )}

      <Link to="/focus" className="block" onClick={() => haptic(HAPTIC.tap)}>
        <Button accent={0} className="w-full py-5 text-base">
          🌙 เริ่มปลอดหน้าจอ
        </Button>
      </Link>

      <p
        className="pb-2 text-center text-xs font-bold tracking-widest uppercase"
        style={{ color: accentAt(3) }}
      >
        สะสมแล้ว <AnimatedNumber value={pet.totalFocusMinutes} /> นาที
      </p>
    </div>
  )
}
