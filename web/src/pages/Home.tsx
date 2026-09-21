import { Link } from 'react-router-dom'
import { PetCanvas } from '../components/PetCanvas'
import { AnimatedNumber, Button, Card, StatBar, StatTile } from '../components/ui'
import { SICK_THRESHOLD, expProgress, hoursUntilDeath, moodOf, toIsoDate, streakAtRisk } from '../lib/gameLogic'
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

  return (
    <div className="space-y-5">
      {needsMedicine && (
        <div className="anim-fade-up rounded-2xl border border-[#ef4444]/40 bg-[#ef4444]/10 p-4">
          <p className="text-sm font-medium text-[#fb7185]">
            🚨 {pet.name} ป่วยหนัก เหลือเวลาอีกประมาณ {Math.round(hoursLeft)} ชั่วโมง
          </p>
          <p className="mt-1 text-xs text-[#a1a1aa]">
            {medicine
              ? 'ใช้ยาสมุนไพรในกระเป๋าเพื่อรักษาทันที'
              : 'ไม่มียาในกระเป๋า ไปซื้อที่ร้านค้าด่วน'}
          </p>
          {medicine ? (
            <Button variant="danger" className="mt-3 w-full" onClick={() => void feed(medicine)}>
              💊 ใช้{medicine.name}
            </Button>
          ) : (
            <Link to="/shop" className="mt-3 block">
              <Button variant="danger" className="w-full">
                ไปร้านค้า
              </Button>
            </Link>
          )}
        </div>
      )}

      <Card>
        <PetCanvas pet={pet} isFocusActive={isFocusActive} onPat={() => void pat()} />
        <p className="mt-3 text-center text-xs text-[#71717a]">แตะสัตว์เลี้ยงเพื่อเล่นด้วย</p>
      </Card>

      <Card className="space-y-4">
        <StatBar
          label="สุขภาพ (Health)"
          value={pet.health}
          color="#22d3ee"
          icon="💗"
          warn={pet.health < SICK_THRESHOLD}
        />
        <StatBar
          label="ความหิว (Hunger)"
          value={pet.hunger}
          color="#10b981"
          icon="🍃"
          warn={pet.hunger < 30}
        />
        <StatBar label="ความสุข (Happiness)" value={pet.happiness} color="#f43f5e" icon="❤️" />
        <StatBar
          label="พลังงาน (Energy)"
          value={pet.energy}
          color="#f59e0b"
          icon="⚡"
          warn={pet.energy < 25}
        />
        <StatBar label="EXP" value={expProgress(pet) * 100} color="#8b5cf6" icon="✨" />
      </Card>

      {quickFood && mood === 'HUNGRY' && (
        <Button variant="accent" className="w-full py-3" onClick={() => void feed(quickFood)}>
          {quickFood.iconEmoji} ให้{quickFood.name}
        </Button>
      )}

      <div className="grid grid-cols-3 gap-3">
        <StatTile label="นาทีปลอดหน้าจอ" value={pet.totalFocusMinutes} animate />
        <StatTile
          label="ทำต่อเนื่อง"
          value={pet.streakDays}
          hint={atRisk ? '⚠️ วันนี้ยังไม่ทำ' : 'วัน'}
          animate
        />
        <StatTile label="เหรียญ" value={pet.coins} animate />
      </div>

      {atRisk && (
        <p className="rounded-xl bg-[#f59e0b]/10 px-3 py-2.5 text-center text-xs text-[#fbbf24]">
          🔥 ทำเซสชันวันนี้เพื่อรักษาสถิติ {pet.streakDays} วันไว้
        </p>
      )}

      <Link to="/focus" className="block">
        <Button className="w-full py-3.5 text-base">🌙 เริ่มเวลาปลอดหน้าจอ</Button>
      </Link>

      <p className="pb-2 text-center text-xs text-[#52525b]">
        สะสมมาแล้ว <AnimatedNumber value={pet.totalFocusMinutes} /> นาที
      </p>
    </div>
  )
}
