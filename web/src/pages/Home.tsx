import { Link } from 'react-router-dom'
import { PetCanvas } from '../components/PetCanvas'
import { Button, Card, StatBar, StatTile } from '../components/ui'
import { expProgress } from '../lib/gameLogic'
import { useAppStore } from '../store/useAppStore'

export function Home() {
  const pet = useAppStore((s) => s.pet)
  const pat = useAppStore((s) => s.pat)
  const isFocusActive = useAppStore((s) => s.isFocusActive)

  return (
    <div className="space-y-5">
      <Card>
        <PetCanvas pet={pet} isFocusActive={isFocusActive} onPat={() => void pat()} />
        <p className="mt-3 text-center text-xs text-[#71717a]">แตะสัตว์เลี้ยงเพื่อเล่นด้วย</p>
      </Card>

      <Card className="space-y-4">
        <StatBar label="ความหิว (Hunger)" value={pet.hunger} color="#10b981" icon="🍃" />
        <StatBar label="ความสุข (Happiness)" value={pet.happiness} color="#f43f5e" icon="❤️" />
        <StatBar label="พลังงาน (Energy)" value={pet.energy} color="#f59e0b" icon="⚡" />
        <StatBar label="EXP" value={expProgress(pet) * 100} color="#8b5cf6" icon="✨" />
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <StatTile label="เวลาปลอดหน้าจอรวม" value={`${pet.totalFocusMinutes}`} hint="นาที" />
        <StatTile label="สถิติต่อเนื่อง" value={`${pet.streakDays}`} hint="เซสชัน" />
        <StatTile label="เหรียญ" value={`${pet.coins}`} hint="coins" />
      </div>

      <Link to="/focus" className="block">
        <Button className="w-full py-3.5 text-base">🌙 เริ่มเวลาปลอดหน้าจอ</Button>
      </Link>
    </div>
  )
}
