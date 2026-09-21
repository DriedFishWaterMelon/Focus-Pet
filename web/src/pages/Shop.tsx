import { BackgroundWord, FloatingShapes } from '../components/Decor'
import { AnimatedNumber, Button, Card, CardTitle, SectionTitle } from '../components/ui'
import { HAPTIC, accentAt, clashAt, readableOn, skewAt } from '../lib/design'
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
    <div className="space-y-6">
      <div
        className="relative overflow-hidden rounded-3xl border-4 border-dashed p-5"
        style={{ borderColor: '#00F5D4', background: '#FFE60022', boxShadow: '8px 8px 0 #FF3AF2' }}
      >
        <BackgroundWord word="$$$" className="-top-4 -right-6" accent={2} />
        <FloatingShapes count={5} seed={13} />
        <div className="relative z-10">
          <p className="text-[10px] font-black tracking-widest text-white/70 uppercase">
            เหรียญที่มี
          </p>
          <p
            className="ts-2 text-5xl font-black"
            style={{ fontFamily: 'var(--font-display)', color: '#FFE600' }}
          >
            🪙 <AnimatedNumber value={pet.coins} />
          </p>
          <p className="mt-1 text-xs font-bold text-white/70">
            ได้เหรียญจากการปลอดหน้าจอ ยิ่งนานยิ่งได้มาก
          </p>
        </div>
      </div>

      <SectionTitle accent={0} rainbow>
        ร้านค้า
      </SectionTitle>

      <div className="space-y-5">
        {SHOP_CATALOG.map((item, i) => {
          const owned = inventory.find((entry) => entry.id === item.id)?.quantity ?? 0
          const affordable = pet.coins >= item.price
          const color = accentAt(i)

          return (
            <Card
              key={item.id}
              accent={i}
              tilt
              // Offsetting alternate rows breaks the grid so the list never
              // settles into a tidy column.
              className={`${i % 2 === 1 ? 'ml-4' : 'mr-4'} ${skewAt(i)}`}
            >
              <div className="flex items-start gap-4">
                <div
                  className="animate-bounce-subtle flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-4 text-4xl"
                  style={{
                    borderColor: clashAt(i),
                    background: `${color}33`,
                    animationDelay: `${i * 0.25}s`,
                  }}
                >
                  <span aria-hidden>{item.iconEmoji}</span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <CardTitle accent={i}>{item.name}</CardTitle>
                    {owned > 0 && (
                      <span
                        className="shrink-0 rounded-full border-2 px-2 py-0.5 text-[10px] font-black"
                        style={{ borderColor: color, color }}
                      >
                        มี {owned}
                      </span>
                    )}
                  </div>
                  <p
                    className="mt-1 text-[10px] font-black tracking-widest uppercase"
                    style={{ color: clashAt(i) }}
                  >
                    {CATEGORY_LABELS[item.category]}
                  </p>
                  <p className="mt-2 text-sm leading-snug text-white/80">{item.description}</p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.healthBoost !== 0 && <Boost label="💗" value={item.healthBoost} accent={1} />}
                    {item.hungerBoost !== 0 && <Boost label="🍃" value={item.hungerBoost} accent={0} />}
                    {item.happinessBoost !== 0 && (
                      <Boost label="❤️" value={item.happinessBoost} accent={3} />
                    )}
                    {item.energyBoost !== 0 && <Boost label="⚡" value={item.energyBoost} accent={2} />}
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <Button
                  accent={i}
                  variant={affordable ? 'primary' : 'outline'}
                  disabled={!affordable}
                  className="w-full"
                  vibrate={HAPTIC.reward}
                  onClick={() => void purchase(item.id)}
                >
                  {affordable ? `ซื้อ · 🪙 ${item.price}` : `เหรียญไม่พอ · 🪙 ${item.price}`}
                </Button>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function Boost({ label, value, accent }: { label: string; value: number; accent: number }) {
  const color = accentAt(accent)
  return (
    <span
      className="rounded-full border-2 px-2.5 py-0.5 text-[11px] font-black"
      style={{ borderColor: color, background: `${color}22`, color: readableOn(color) === '#0D0D1A' ? color : color }}
    >
      <span aria-hidden>{label}</span> {value > 0 ? '+' : ''}
      {value}
    </span>
  )
}
