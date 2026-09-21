import { BackgroundWord, FloatingShapes, Marquee } from '../components/Decor'
import { PetCanvas } from '../components/PetCanvas'
import { Button } from '../components/ui'
import { defaultPet } from '../lib/gameLogic'
import { useAppStore } from '../store/useAppStore'

export function Login() {
  const { signInGoogle, signInGuest, authError } = useAppStore()

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-4">
      <BackgroundWord
        word="FOCUS"
        className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        accent={0}
      />
      <FloatingShapes count={10} seed={1} />

      <div className="relative z-10 w-full max-w-sm">
        <div
          className="relative overflow-hidden rounded-3xl border-4 bg-[#2D1B4E]/85 p-6 backdrop-blur-sm"
          style={{ borderColor: '#FFE600', boxShadow: '8px 8px 0 #FF3AF2, 16px 16px 0 #00F5D4' }}
        >
          <PetCanvas pet={defaultPet()} />

          <div className="mt-5 text-center">
            <h1
              className="text-rainbow text-5xl font-black tracking-tighter uppercase"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Focus Pet
            </h1>
            <p className="mt-3 text-sm leading-snug font-bold text-white/80">
              เปลี่ยนเวลาที่ไม่ใช้หน้าจอ
              <br />
              ให้เป็นความก้าวหน้าของสัตว์เลี้ยง
            </p>
          </div>

          <div className="mt-6 space-y-3">
            <Button accent={0} className="w-full py-4" onClick={() => void signInGoogle()}>
              เข้าสู่ระบบด้วย Google
            </Button>
            <Button
              accent={1}
              variant="secondary"
              className="w-full py-4"
              onClick={() => void signInGuest()}
            >
              ลองใช้แบบผู้เยี่ยมชม
            </Button>
          </div>

          {authError && (
            <p
              className="mt-4 rounded-2xl border-2 border-dashed px-3 py-2 text-xs font-bold"
              style={{ borderColor: '#FF6B35', color: '#FF6B35' }}
            >
              {authError}
            </p>
          )}
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl">
          <Marquee text="ปลอดหน้าจอ = สัตว์เลี้ยงโต" accent={3} />
        </div>

        <p className="mt-5 text-center text-[10px] leading-relaxed font-bold tracking-wider text-white/45 uppercase">
          โครงงานวิจัย วิทยาลัยการคอมพิวเตอร์
          <br />
          ข้อมูลการใช้งานใช้เพื่อการวิเคราะห์ผลวิจัยเท่านั้น
        </p>
      </div>
    </div>
  )
}
