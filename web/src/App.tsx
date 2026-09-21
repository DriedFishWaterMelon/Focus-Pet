import { useEffect } from 'react'
import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import {
  AwayReportModal,
  CelebrationModal,
  DeathScreen,
  Onboarding,
  ToastLayer,
} from './components/Overlays'
import { Focus } from './pages/Focus'
import { Home } from './pages/Home'
import { Inventory } from './pages/Inventory'
import { Login } from './pages/Login'
import { Settings } from './pages/Settings'
import { Shop } from './pages/Shop'
import { Stats } from './pages/Stats'
import { moodOf } from './lib/gameLogic'
import { useAppStore } from './store/useAppStore'

const NAV = [
  { to: '/', label: 'สัตว์เลี้ยง', icon: '🌱' },
  { to: '/focus', label: 'ปลอดหน้าจอ', icon: '🌙' },
  { to: '/shop', label: 'ร้านค้า', icon: '🛒' },
  { to: '/stats', label: 'สถิติ', icon: '📊' },
  { to: '/inventory', label: 'กระเป๋า', icon: '🎒' },
  { to: '/settings', label: 'ตั้งค่า', icon: '⚙️' },
]

export default function App() {
  const { profile, authLoading, listenToAuth, pet, tickDecay } = useAppStore()

  useEffect(() => listenToAuth(), [listenToAuth])

  // Keep the pet decaying while the tab is open, and catch up immediately when
  // the tab is brought back to the foreground after being backgrounded.
  useEffect(() => {
    if (!profile) return
    const interval = window.setInterval(tickDecay, 60_000)
    const onVisible = () => {
      if (!document.hidden) tickDecay()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [profile, tickDecay])

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="animate-pulse text-sm text-[#71717a]">กำลังโหลด…</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <>
        <Login />
        <ToastLayer />
      </>
    )
  }

  if (!profile.onboarded) {
    return (
      <>
        <Onboarding />
        <ToastLayer />
      </>
    )
  }

  if (!pet.isAlive) {
    return (
      <>
        <DeathScreen />
        <ToastLayer />
      </>
    )
  }

  const mood = moodOf(pet)
  const needsAttention = mood === 'SICK' || mood === 'DYING' || mood === 'HUNGRY'

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col">
      <header className="flex items-center justify-between px-4 pt-5 pb-3">
        <h1 className="text-lg font-bold">Focus Pet</h1>
        {profile.participantId ? (
          <span className="rounded-full bg-[#27272a] px-2.5 py-1 text-xs text-[#a1a1aa]">
            {profile.participantId}
          </span>
        ) : (
          <NavLink to="/settings" className="text-xs text-[#fbbf24]">
            ยังไม่ได้ใส่รหัสผู้เข้าร่วม
          </NavLink>
        )}
      </header>

      <main className="flex-1 px-4 pb-28">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/focus" element={<Focus />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <nav className="fixed inset-x-0 bottom-0 mx-auto max-w-lg border-t border-[#27272a] bg-[#18181b]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="grid grid-cols-6">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `relative flex flex-col items-center gap-1 py-3 text-[10px] transition-colors ${
                  isActive ? 'text-[#fafafa]' : 'text-[#71717a]'
                }`
              }
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
              {item.to === '/' && needsAttention && (
                <span className="absolute top-2 right-1/4 h-2 w-2 rounded-full bg-[#ef4444]" />
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      <AwayReportModal />
      <CelebrationModal />
      <ToastLayer />
    </div>
  )
}
