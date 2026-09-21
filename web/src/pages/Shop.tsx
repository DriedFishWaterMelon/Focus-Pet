import { AnimatedNumber, Button, Card } from '../components/ui'
import { SHOP_CATALOG } from '../lib/gameLogic'
import { useAppStore } from '../store/useAppStore'

const CATEGORY_LABELS = {
  FOOD: 'อาหาร',
  POTION: 'ยาบำรุง',
  MEDICINE: 'ยารักษา',
  TOY: 'ของเล่น',
  BADGE: 'ของหายาก',
} as const

export function Shop() {
  const pet = useAppStore((s) => s.pet)
  const inventory = useAppStore((s) => s.inventory)
  const purchase = useAppStore((s) => s.purchase)

  return (
    <div className="space-y-4">
      <Card className="flex items-center justify-between">
        <div>
          <p className="text-xs text-[#a1a1aa]">เหรียญที่มี</p>
          <p className="text-2xl font-semibold text-[#f59e0b]">
            🪙 <AnimatedNumber value={pet.coins} />
          </p>
        </div>
        <p className="max-w-[45%] text-right text-[11px] text-[#71717a]">
          ได้เหรียญจากการทำเซสชันปลอดหน้าจอ ยิ่งนานยิ่งได้มาก
        </p>
      </Card>

      {SHOP_CATALOG.map((item) => {
        const owned = inventory.find((entry) => entry.id === item.id)?.quantity ?? 0
        const affordable = pet.coins >= item.price

        return (
          <Card key={item.id} animate>
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#27272a] text-3xl">
                {item.iconEmoji}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-medium">{item.name}</p>
                  {owned > 0 && (
                    <span className="shrink-0 text-xs text-[#71717a]">มีอยู่ {owned}</span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-[#71717a]">{CATEGORY_LABELS[item.category]}</p>
                <p className="mt-1.5 text-sm text-[#a1a1aa]">{item.description}</p>
                <div className="mt-2 flex flex-wrap gap-3 text-xs">
                  {item.healthBoost !== 0 && (
                    <span className="text-[#22d3ee]">💗 +{item.healthBoost}</span>
                  )}
                  {item.hungerBoost !== 0 && (
                    <span className="text-[#10b981]">
                      🍃 {item.hungerBoost > 0 ? '+' : ''}
                      {item.hungerBoost}
                    </span>
                  )}
                  {item.happinessBoost !== 0 && (
                    <span className="text-[#f43f5e]">
                      ❤️ {item.happinessBoost > 0 ? '+' : ''}
                      {item.happinessBoost}
                    </span>
                  )}
                  {item.energyBoost !== 0 && (
                    <span className="text-[#f59e0b]">
                      ⚡ {item.energyBoost > 0 ? '+' : ''}
                      {item.energyBoost}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Button
              className="mt-3 w-full"
              variant={affordable ? 'ghost' : 'ghost'}
              disabled={!affordable}
              onClick={() => void purchase(item.id)}
            >
              {affordable ? `ซื้อ · 🪙 ${item.price}` : `เหรียญไม่พอ · 🪙 ${item.price}`}
            </Button>
          </Card>
        )
      })}
    </div>
  )
}
