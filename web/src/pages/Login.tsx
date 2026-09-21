import { Button, Card } from '../components/ui'
import { PetCanvas } from '../components/PetCanvas'
import { defaultPet } from '../lib/gameLogic'
import { useAppStore } from '../store/useAppStore'

export function Login() {
  const { signInGoogle, signInGuest, authError } = useAppStore()

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <PetCanvas pet={defaultPet()} />

        <div className="mt-5 text-center">
          <h1 className="text-2xl font-bold">Focus Pet</h1>
          <p className="mt-1.5 text-sm text-[#a1a1aa]">
            เปลี่ยนเวลาที่ไม่ใช้หน้าจอ ให้เป็นความก้าวหน้าของสัตว์เลี้ยง
          </p>
        </div>

        <div className="mt-6 space-y-2.5">
          <Button className="w-full py-3" onClick={() => void signInGoogle()}>
            เข้าสู่ระบบด้วย Google
          </Button>
          <Button variant="ghost" className="w-full py-3" onClick={() => void signInGuest()}>
            ลองใช้แบบผู้เยี่ยมชม
          </Button>
        </div>

        {authError && (
          <p className="mt-4 rounded-xl bg-[#ef4444]/10 px-3 py-2 text-xs text-[#fb7185]">
            {authError}
          </p>
        )}

        <p className="mt-5 text-center text-[11px] leading-relaxed text-[#71717a]">
          โครงงานวิจัย คณะวิทยาลัยการคอมพิวเตอร์ — ข้อมูลการใช้งานของคุณ
          จะถูกนำไปใช้เพื่อการวิเคราะห์ผลการวิจัยเท่านั้น
        </p>
      </Card>
    </div>
  )
}
