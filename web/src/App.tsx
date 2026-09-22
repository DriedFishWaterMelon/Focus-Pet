import { useEffect } from 'react'
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { MeshBackdrop } from './components/Decor'
import {
  RestReportModal,
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
import { HAPTIC, accentAt, haptic, readableOn } from './lib/design'
import { moodOf } from './lib/gameLogic'
import { endVisit, flush, markNotificationOpen, recordScreen, startVisit } from './lib/telemetry'
import { useAppStore } from './store/useAppStore'

const NAV = [
  { to: '/', label: 'เพื่อน', icon: '🌱' },
  { to: '/focus', label: 'โฟกัส', icon: '🌙' },
  { to: '/shop', label: 'ร้าน', icon: '🛒' },
  { to: '/stats', label: 'สถิติ', icon: '📊' },
  { to: '/inventory', label: 'กระเป๋า', icon: '🎒' },
  { to: '/settings', label: 'ตั้งค่า', icon: '⚙️' },
]

export default function App() {
  const { profile, authLoading, listenToAuth, pet, tickDecay } = useAppStore()
  const location = useLocation()

  useEffect(() => listenToAuth(), [listenToAuth])

  // App-usage records. Starts when the participant is known and stops when the
  // tab is hidden, which on a phone is what "closed the app" actually looks like.
  useEffect(() => {
    if (!profile) return
    startVisit(profile.uid, profile.enrolment)

    const onVisibility = () => {
      if (document.hidden) void flush(true)
      else startVisit(profile.uid, profile.enrolment)
    }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', () => void flush(true))

    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      void endVisit()
    }
  }, [profile])

  useEffect(() => {
    recordScreen(location.pathname)
  }, [location.pathname])

  // Tapping a reminder when a tab is already open focuses that tab rather than
  // navigating it, so the service worker says so over postMessage instead.
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === 'focus-pet-notification-open') markNotificationOpen()
    }
    navigator.serviceWorker.addEventListener('message', onMessage)
    return () => navigator.serviceWorker.removeEventListener('message', onMessage)
  }, [])

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
        <p
          className="text-rainbow text-3xl font-black uppercase"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          กำลังโหลด…
        </p>
      </div>
    )
  }

  if (!profile) {
    return (
      <>
        <MeshBackdrop />
        <Login />
        <ToastLayer />
      </>
    )
  }

  if (!profile.onboarded) {
    return (
      <>
        <MeshBackdrop />
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
    <>
      <MeshBackdrop />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-lg flex-col">
        <header className="flex items-center justify-between gap-2 px-4 pt-5 pb-3">
          <h1
            className="text-rainbow text-2xl font-black tracking-tighter uppercase"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Focus Pet
          </h1>
          <div className="flex items-center gap-2">
            {profile.participantId ? (
              <span
                className="rounded-full border-2 px-3 py-1 text-[10px] font-black tracking-widest uppercase"
                style={{ borderColor: '#00F5D4', color: '#00F5D4' }}
              >
                {profile.participantId}
              </span>
            ) : (
              <NavLink
                to="/settings"
                className="animate-wiggle rounded-full border-2 px-3 py-1 text-[10px] font-black uppercase"
                style={{ borderColor: '#FFE600', color: '#FFE600' }}
              >
                ใส่รหัสผู้เข้าร่วม
              </NavLink>
            )}
          </div>
        </header>

        <main className="flex-1 px-4 pb-32">
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

        <nav
          className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-lg border-t-4 bg-[#0D0D1A]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md"
          style={{ borderColor: '#FF3AF2' }}
        >
          <div className="grid grid-cols-6">
            {NAV.map((item, i) => {
              const color = accentAt(i)
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => haptic(HAPTIC.tap)}
                  className="relative flex flex-col items-center gap-0.5 py-2.5 transition-transform duration-200 active:scale-90"
                >
                  {({ isActive }) => (
                    <>
                      <span
                        aria-hidden
                        className={`flex h-9 w-9 items-center justify-center rounded-full text-lg transition-all duration-300 ${
                          isActive ? 'scale-110 border-2' : 'opacity-55'
                        }`}
                        style={
                          isActive
                            ? { background: color, borderColor: readableOn(color) }
                            : undefined
                        }
                      >
                        {item.icon}
                      </span>
                      <span
                        className="text-[9px] font-black tracking-wider uppercase"
                        style={{
                          fontFamily: 'var(--font-display)',
                          color: isActive ? color : 'rgba(255,255,255,0.4)',
                        }}
                      >
                        {item.label}
                      </span>
                      {item.to === '/' && needsAttention && (
                        <span
                          aria-hidden
                          className="animate-pulse-glow absolute top-1.5 right-1/4 h-2.5 w-2.5 rounded-full"
                          style={{ background: '#FF6B35' }}
                        />
                      )}
                    </>
                  )}
                </NavLink>
              )
            })}
          </div>
        </nav>

        <RestReportModal />
        <CelebrationModal />
        <ToastLayer />
      </div>
    </>
  )
}
