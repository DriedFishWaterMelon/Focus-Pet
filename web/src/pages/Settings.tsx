import { useState } from 'react'
import { Button, Card, SectionTitle, TextInput } from '../components/ui'
import { FloatingShapes } from '../components/Decor'
import { HAPTIC, accentAt } from '../lib/design'
import { useAppStore } from '../store/useAppStore'

export function Settings() {
  const { profile, pet, renamePet, setParticipantId, logOut } = useAppStore()
  const [name, setName] = useState(pet.name)
  const [pid, setPid] = useState(profile?.participantId ?? '')

  return (
    <div className="space-y-7">
      <section className="space-y-3">
        <SectionTitle accent={0}>บัญชี</SectionTitle>
        <Card accent={0}>
          <div className="flex items-center gap-4">
            {profile?.photoUrl ? (
              <img
                src={profile.photoUrl}
                alt=""
                className="h-14 w-14 rounded-full border-4"
                style={{ borderColor: '#FFE600' }}
              />
            ) : (
              <div
                className="flex h-14 w-14 items-center justify-center rounded-full border-4 text-2xl"
                style={{ borderColor: '#FFE600', background: '#FF3AF233' }}
              >
                <span aria-hidden>🧑</span>
              </div>
            )}
            <div className="min-w-0">
              <p
                className="truncate text-lg font-black uppercase"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {profile?.displayName}
              </p>
              <p className="truncate text-xs font-bold text-white/60">
                {profile?.isAnonymous ? 'ผู้เยี่ยมชม' : profile?.email}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <Button
              accent={0}
              variant="secondary"
              className="w-full"
              onClick={() => void logOut()}
            >
              ออกจากระบบ
            </Button>
          </div>
        </Card>
      </section>

      <section className="space-y-3">
        <SectionTitle accent={1}>รหัสผู้เข้าร่วมวิจัย</SectionTitle>
        <Card accent={1}>
          <p className="text-sm leading-snug text-white/75">
            กรอกรหัสที่ทีมวิจัยกำหนดให้ เพื่อจับคู่ข้อมูลของคุณกับแบบสอบถาม SAS-SV และ PSQI
            โดยไม่ต้องเปิดเผยชื่อจริง
          </p>
          <div className="mt-4 flex gap-2">
            <div className="flex-1">
              <TextInput accent={1} value={pid} onChange={setPid} placeholder="เช่น P001" />
            </div>
            <Button
              accent={1}
              disabled={!pid.trim()}
              vibrate={HAPTIC.success}
              onClick={() => void setParticipantId(pid)}
            >
              บันทึก
            </Button>
          </div>
          {profile?.participantId && (
            <p className="mt-3 text-xs font-black" style={{ color: accentAt(1) }}>
              ✓ รหัสปัจจุบัน: {profile.participantId}
            </p>
          )}
        </Card>
      </section>

      <section className="space-y-3">
        <SectionTitle accent={2}>ตั้งชื่อสัตว์เลี้ยง</SectionTitle>
        <Card accent={2}>
          <div className="flex gap-2">
            <div className="flex-1">
              <TextInput accent={2} value={name} onChange={setName} maxLength={20} />
            </div>
            <Button
              accent={2}
              disabled={!name.trim()}
              vibrate={HAPTIC.success}
              onClick={() => void renamePet(name)}
            >
              เปลี่ยน
            </Button>
          </div>
        </Card>
      </section>

      <section className="space-y-3">
        <SectionTitle accent={3}>เกี่ยวกับการวัดเวลาหน้าจอ</SectionTitle>
        <Card accent={3}>
          <FloatingShapes count={3} seed={44} />
          <p className="relative z-10 text-sm leading-relaxed text-white/80">
            เว็บเบราว์เซอร์ไม่สามารถอ่านเวลาการใช้งานหน้าจอของมือถือได้โดยตรง
            เพราะเป็นข้อจำกัดด้านความปลอดภัยของ Android และ iOS
          </p>
          <p className="relative z-10 mt-3 text-sm leading-relaxed text-white/80">
            เว็บนี้จึงวัดได้เฉพาะ{' '}
            <strong style={{ color: accentAt(3) }}>
              เวลาที่คุณเปิดเซสชันปลอดหน้าจอค้างไว้ในแท็บนี้
            </strong>{' '}
            ถ้าสลับไปแท็บอื่นระบบจะบันทึกว่าถูกขัดจังหวะ
            ส่วนเวลาหน้าจอรวมรายวันต้องกรอกเองจากหน้าสถิติ
          </p>
        </Card>
      </section>

      <section className="space-y-3">
        <SectionTitle accent={4}>สัตว์เลี้ยงตัวนี้</SectionTitle>
        <Card accent={4}>
          <dl className="space-y-2.5 text-sm">
            <Row label="รุ่นที่" value={String(pet.generation)} accent={4} />
            <Row
              label="เกิดเมื่อ"
              value={new Date(pet.bornAt).toLocaleDateString('th-TH')}
              accent={0}
            />
            <Row label="เลเวล" value={String(pet.level)} accent={1} />
            <Row label="นาทีปลอดหน้าจอ" value={String(pet.totalFocusMinutes)} accent={2} />
          </dl>
        </Card>
      </section>
    </div>
  )
}

function Row({ label, value, accent }: { label: string; value: string; accent: number }) {
  return (
    <div className="flex items-center justify-between border-b-2 border-dashed border-white/10 pb-2">
      <dt className="text-xs font-black tracking-widest text-white/60 uppercase">{label}</dt>
      <dd className="text-base font-black" style={{ color: accentAt(accent) }}>
        {value}
      </dd>
    </div>
  )
}
