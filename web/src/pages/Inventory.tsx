import { Link } from 'react-router-dom'
import { BackgroundWord, FloatingShapes, PatternLayer } from '../components/Decor'
import { Button, Card, CardTitle, EmptyState, SectionTitle } from '../components/ui'
import { HAPTIC, accentAt, accentTextAt, clashAt, skewAt, textSafe } from '../lib/design'
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
    <div className="space-y-7">
      <section className="space-y-4">
        <SectionTitle accent={1}>กระเป๋า</SectionTitle>

        {inventory.length === 0 ? (
          <Card accent={1}>
            <EmptyState
              emoji="🎒"
              title="ว่างเปล่า!"
              detail="ทำเซสชันปลอดหน้าจอเพื่อรับไอเทม หรือใช้เหรียญซื้อที่ร้านค้า"
              accent={1}
              action={
                <Link to="/shop">
                  <Button accent={2}>ไปร้านค้า</Button>
                </Link>
              }
            />
          </Card>
        ) : (
          inventory.map((item, i) => (
            <Card key={item.id} accent={i} tilt className={skewAt(i)}>
              <div className="flex items-start gap-4">
                <div
                  className="animate-wiggle flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-4 text-4xl"
                  style={{
                    borderColor: clashAt(i),
                    background: `${accentAt(i)}33`,
                    animationDelay: `${i * 0.3}s`,
                  }}
                >
                  <span aria-hidden>{item.iconEmoji}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <CardTitle accent={i}>{item.name}</CardTitle>
                    <span
                      className="shrink-0 rounded-full border-2 px-2 py-0.5 text-[11px] font-black"
                      style={{ borderColor: accentAt(i), color: accentTextAt(i) }}
                    >
                      ×{item.quantity}
                    </span>
                  </div>
                  <p
                    className="mt-1 text-[10px] font-black tracking-widest uppercase"
                    style={{ color: textSafe(clashAt(i)) }}
                  >
                    {CATEGORY_LABELS[item.category]}
                  </p>
                  <p className="mt-2 text-sm leading-snug text-white/80">{item.description}</p>
                </div>
              </div>
              <div className="mt-4">
                <Button
                  accent={i}
                  variant="outline"
                  className="w-full"
                  vibrate={HAPTIC.success}
                  disabled={item.quantity <= 0 || !pet.isAlive}
                  onClick={() => void feed(item)}
                >
                  ให้ {pet.name}
                </Button>
              </div>
            </Card>
          ))
        )}
      </section>

      <section className="space-y-4">
        <SectionTitle accent={3}>ความสำเร็จ</SectionTitle>

        <div
          className="relative overflow-hidden rounded-2xl border-4 p-4 text-center"
          style={{ borderColor: '#7B2FFF', background: '#7B2FFF22' }}
        >
          <BackgroundWord word="WOW" className="-top-8 left-1/2 -translate-x-1/2" accent={3} />
          <FloatingShapes count={4} seed={21} />
          <p
            className="ts-1 relative z-10 text-4xl font-black"
            style={{ fontFamily: 'var(--font-display)', color: '#FFE600' }}
          >
            {unlockedCount} / {ACHIEVEMENTS.length}
          </p>
          <p className="relative z-10 text-[10px] font-black tracking-widest text-white/70 uppercase">
            ปลดล็อกแล้ว
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {ACHIEVEMENTS.map((def, i) => {
            const unlocked = achievements.find((a) => a.id === def.id)?.unlockedAt
            const progress = Math.min(1, def.progress(pet))
            const color = accentAt(i)

            return (
              <div
                key={def.id}
                className={`relative overflow-hidden rounded-2xl border-4 p-3 transition-all duration-300 ${
                  unlocked ? 'hover:-translate-y-1 hover:rotate-2' : 'opacity-60'
                } ${i % 2 === 1 ? 'translate-y-3' : ''}`}
                style={{
                  borderColor: unlocked ? color : '#3F3F46',
                  background: unlocked ? `${color}22` : 'rgba(45,27,78,0.5)',
                  boxShadow: unlocked ? `4px 4px 0 ${clashAt(i)}` : 'none',
                }}
              >
                {unlocked && <PatternLayer index={i} />}
                <p aria-hidden className={`relative z-10 text-3xl ${unlocked ? 'animate-bounce-subtle' : ''}`}>
                  {unlocked ? def.iconEmoji : '🔒'}
                </p>
                <p
                  className="relative z-10 mt-1.5 text-sm font-black uppercase"
                  style={{ fontFamily: 'var(--font-display)', color: unlocked ? color : '#A1A1AA' }}
                >
                  {def.name}
                </p>
                <p className="relative z-10 mt-1 text-[11px] leading-snug text-white/60">
                  {def.description}
                </p>
                {!unlocked && progress > 0 && (
                  <div className="relative z-10 mt-2 h-2 overflow-hidden rounded-full bg-[#0D0D1A]">
                    <div
                      className="h-full rounded-full transition-[width] duration-700"
                      style={{ width: `${progress * 100}%`, background: color }}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
