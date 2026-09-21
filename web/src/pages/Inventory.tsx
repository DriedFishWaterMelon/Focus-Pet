import { Button, Card } from '../components/ui'
import { useAppStore } from '../store/useAppStore'

const CATEGORY_LABELS = {
  FOOD: 'อาหาร',
  POTION: 'ยา',
  TOY: 'ของเล่น',
  BADGE: 'เหรียญตรา',
} as const

export function Inventory() {
  const inventory = useAppStore((s) => s.inventory)
  const feed = useAppStore((s) => s.feed)

  return (
    <div className="space-y-3">
      {inventory.map((item) => (
        <Card key={item.id}>
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
              <div className="mt-2 flex flex-wrap gap-3 text-xs">
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
            variant="ghost"
            disabled={item.quantity <= 0}
            onClick={() => void feed(item)}
          >
            {item.quantity > 0 ? 'ให้สัตว์เลี้ยง' : 'หมดแล้ว'}
          </Button>
        </Card>
      ))}
    </div>
  )
}
