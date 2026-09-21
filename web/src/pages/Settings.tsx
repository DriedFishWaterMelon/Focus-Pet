import { useState } from 'react'
import { Button, Card } from '../components/ui'
import { useAppStore } from '../store/useAppStore'

export function Settings() {
  const { profile, pet, renamePet, setParticipantId, logOut } = useAppStore()
  const [name, setName] = useState(pet.name)
  const [pid, setPid] = useState(profile?.participantId ?? '')

  return (
    <div className="space-y-5">
      <Card>
        <h2 className="text-base font-semibold">บัญชี</h2>
        <div className="mt-3 flex items-center gap-3">
          {profile?.photoUrl ? (
            <img src={profile.photoUrl} alt="" className="h-11 w-11 rounded-full" />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#27272a] text-lg">
              🧑
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate font-medium">{profile?.displayName}</p>
            <p className="truncate text-xs text-[#71717a]">
              {profile?.isAnonymous ? 'เข้าใช้แบบผู้เยี่ยมชม' : profile?.email}
            </p>
          </div>
        </div>
        <Button variant="ghost" className="mt-4 w-full" onClick={() => void logOut()}>
          ออกจากระบบ
        </Button>
      </Card>

      <Card>
        <h2 className="text-base font-semibold">รหัสผู้เข้าร่วมวิจัย</h2>
        <p className="mt-1 text-xs text-[#a1a1aa]">
          กรอกรหัสที่ทีมวิจัยกำหนดให้ เพื่อให้ข้อมูลของคุณถูกจับคู่กับแบบสอบถาม SAS-SV และ PSQI
          ได้อย่างถูกต้อง โดยไม่ต้องเปิดเผยชื่อจริง
        </p>
        <div className="mt-3 flex gap-2">
          <input
            value={pid}
            onChange={(e) => setPid(e.target.value)}
            placeholder="เช่น P001"
            className="flex-1 rounded-xl border border-[#3f3f46] bg-[#09090b] px-3 py-2.5 text-sm outline-none focus:border-[#0ea5e9]"
          />
          <Button onClick={() => void setParticipantId(pid)} disabled={!pid.trim()}>
            บันทึก
          </Button>
        </div>
        {profile?.participantId && (
          <p className="mt-2 text-xs text-[#10b981]">รหัสปัจจุบัน: {profile.participantId}</p>
        )}
      </Card>

      <Card>
        <h2 className="text-base font-semibold">ตั้งชื่อสัตว์เลี้ยง</h2>
        <div className="mt-3 flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            className="flex-1 rounded-xl border border-[#3f3f46] bg-[#09090b] px-3 py-2.5 text-sm outline-none focus:border-[#0ea5e9]"
          />
          <Button onClick={() => void renamePet(name)} disabled={!name.trim()}>
            เปลี่ยน
          </Button>
        </div>
      </Card>

      <Card>
        <h2 className="text-base font-semibold">เกี่ยวกับการวัดเวลาหน้าจอ</h2>
        <p className="mt-2 text-sm text-[#a1a1aa]">
          เว็บเบราว์เซอร์ไม่สามารถอ่านเวลาการใช้งานหน้าจอของมือถือได้โดยตรง
          เพราะเป็นข้อจำกัดด้านความปลอดภัยของ Android และ iOS
        </p>
        <p className="mt-2 text-sm text-[#a1a1aa]">
          เว็บนี้จึงวัดได้เฉพาะ <strong>เวลาที่คุณเปิดเซสชันปลอดหน้าจอค้างไว้ในแท็บนี้</strong>{' '}
          และถ้าคุณสลับไปแท็บอื่น ระบบจะบันทึกไว้ว่าเซสชันถูกขัดจังหวะ
          ส่วนเวลาหน้าจอรวมรายวันต้องกรอกเองจากหน้า สถิติ
        </p>
      </Card>
    </div>
  )
}
