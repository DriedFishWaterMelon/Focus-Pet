import { Link } from 'react-router-dom'
import { Button, Card, EmptyState } from '../components/ui'
import { ACHIEVEMENTS } from '../lib/achievements'
import { useAppStore } from '../store/useAppStore'

const CATEGORY_LABELS = {
  FOOD: 'อาหาร',
  POTION: 'ยาบำรุง',
  MEDICINE: 'ยารักษา',
  TOY: 'ของเล่น',
  BADGE: 'ของหายาก',
} as const

export function Inventory() {
  const inventory = useAppStore((s) => s.inventory)
  const pet = useAppStore((s) => s.pet)
  const achievements = useAppStore((s) => s.achievements)
  const feed = useAppStore((s) => s.feed)

  const unlockedCount = achievements.filter((a) => a.unlockedAt).length

  return (
    <div className="space-y-5">
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-[#a1a1aa]">กระเป๋าของฉัน</h2>

        {inventory.length === 0 ? (
          <Card>
            <EmptyState
              emoji="🎒"
              title="กระเป๋าว่างเปล่า"
              detail="ทำเซสชันปลอดหน้าจอเพื่อรับไอเทม หรือใช้เหรียญซื้อที่ร้านค้า"
              action={
                <Link to="/shop">
                  <Button>ไปร้านค้า</Button>
                </Link>
              }
            />
          </Card>
        ) : (
          inventory.map((item) => (
            <Card key={item.id} animate>
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#27272a] text-3xl">
                  {item.iconEmoji}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="font-medium">{item.name}</p>
                    <span className="shrink-0 text-xs text-[#a1a1aa]">×{item.quantity}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-[#71717a]">
                    {CATEGORY_LABELS[item.category]}
                  </p>
                  <p className="mt-1.5 text-sm text-[#a1a1aa]">{item.description}</p>
                </div>
              </div>
              <Button
                className="mt-3 w-full"
                variant="ghost"
                disabled={item.quantity <= 0 || !pet.isAlive}
                onClick={() => void feed(item)}
              >
                ให้ {pet.name}
              </Button>
            </Card>
          ))
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-[#a1a1aa]">ความสำเร็จ</h2>
          <span className="text-xs text-[#71717a]">
            {unlockedCount}/{ACHIEVEMENTS.length}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {ACHIEVEMENTS.map((def) => {
            const unlocked = achievements.find((a) => a.id === def.id)?.unlockedAt
            const progress = Math.min(1, def.progress(pet))

            return (
              <Card
                key={def.id}
                className={unlocked ? '' : 'opacity-55'}
              >
                <p className="text-2xl">{unlocked ? def.iconEmoji : '🔒'}</p>
                <p className="mt-1.5 text-sm font-medium">{def.name}</p>
                <p className="mt-0.5 text-[11px] leading-snug text-[#71717a]">
                  {def.description}
                </p>
                {!unlocked && progress > 0 && (
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#27272a]">
                    <div
                      className="h-full rounded-full bg-[#8b5cf6] transition-[width] duration-700"
                      style={{ width: `${progress * 100}%` }}
                    />
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      </section>
    </div>
  )
}
