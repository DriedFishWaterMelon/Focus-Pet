# Focus Pet — เว็บแอป

เว็บแอปของโครงงาน "เปลี่ยนเวลาที่ไม่ใช้หน้าจอเป็นความก้าวหน้าในเกม"
ใช้ Firebase ทั้งหมด (Hosting + Firestore + Auth) อยู่ในแพ็กเกจฟรี Spark ไม่มีค่าใช้จ่าย

## เทคโนโลยีที่ใช้

| ส่วน | ใช้อะไร | ทำไม |
|---|---|---|
| Framework | React 19 + TypeScript + Vite | build ออกมาเป็นไฟล์ static ล้วน ซึ่ง Firebase Hosting แพ็กเกจฟรีรองรับ |
| State | Zustand | ตรงกับที่ระบุไว้ในข้อเสนอโครงงาน |
| CSS | Tailwind CSS v4 | |
| Database | Cloud Firestore | ใช้ชุดข้อมูลร่วมกับแอป Android ได้ |
| Auth | Firebase Auth (Google + Guest) | ใช้ Google OAuth client ตัวเดียวกับแอป Android |
| Hosting | Firebase Hosting | `firebase deploy` คำสั่งเดียวจบ |

> หมายเหตุ: ที่ไม่ใช้ Next.js เพราะ Next ต้องใช้ Firebase App Hosting
> ซึ่งบังคับให้เปิด Blaze (ต้องผูกบัตร) ส่วน Vite build เป็น static
> ใช้ Firebase Hosting ฟรีได้เลย

## ติดตั้งและรัน

```bash
cd web
npm install
cp .env.example .env    # แล้วกรอกค่าจาก Firebase Console
npm run dev             # เปิด http://localhost:5173
```

คำสั่งอื่น

```bash
npm test        # รัน unit test ของ game logic (17 เทสต์)
npm run build   # build ไป web/dist
```

## โปรเจกต์ Firebase กลางของทีม

| | |
|---|---|
| Project ID | `focus-pet-g8` |
| เว็บ | **https://focus-pet-g8.web.app** |
| Console | https://console.firebase.google.com/project/focus-pet-g8 |
| เจ้าของ | achirawat.bu@kkumail.com |
| Firestore region | `asia-southeast1` (Singapore) |

โปรเจกต์นี้คือที่เก็บข้อมูลวิจัยจริง **ข้อมูลผู้เข้าร่วมทุกคนต้องลงที่นี่ที่เดียว**
ถ้าใครสร้างโปรเจกต์ของตัวเองไว้ทดลอง ให้ใช้แค่ทดลองเท่านั้น อย่าเอาไปเก็บข้อมูลจริง

สมาชิกทีมที่ยังเข้าไม่ได้ ให้เจ้าของโปรเจกต์เพิ่มให้ที่
Console → ⚙ Project settings → **Users and permissions** → Add member → role **Editor**

## Deploy ขึ้น Firebase Hosting

ครั้งแรกครั้งเดียว

```bash
npm install -g firebase-tools
firebase login
```

> บน Windows ถ้าพิมพ์ `firebase` แล้วขึ้น "not recognized" แปลว่า
> `%APPDATA%\npm` ไม่ได้อยู่ใน PATH เพิ่มเข้าไปแล้วเปิด terminal ใหม่
> หรือใช้ `npx firebase-tools` แทนไปก่อน

จากนั้นทุกครั้งที่จะ deploy (รันจาก **โฟลเดอร์หลักของโปรเจกต์** ไม่ใช่ใน `web/`)

```bash
npm --prefix web run build
firebase deploy
```

`.firebaserc` ชี้ไป `focus-pet-g8` อยู่แล้ว จึงไม่ต้องใส่ `--project` ทุกครั้ง

ถ้าแก้ security rules ให้ deploy เฉพาะส่วนนั้นได้

```bash
firebase deploy --only firestore:rules
```

### สิ่งที่ต้องกดเองใน Console (CLI ทำแทนไม่ได้)

เปิด Authentication provider ที่
Console → **Authentication → Sign-in method** แล้วเปิด

- **Anonymous** — สำหรับปุ่ม "ลองใช้แบบผู้เยี่ยมชม"
- **Google** — สำหรับปุ่มเข้าสู่ระบบด้วย Google (ต้องเลือก support email ด้วย)

ถ้ายังไม่เปิด เว็บจะโหลดขึ้นแต่กดล็อกอินไม่ได้ทั้งสองปุ่ม

ส่วน Authorized domains ไม่ต้องทำอะไร Firebase ใส่ `focus-pet-g8.web.app` ให้อัตโนมัติ

## โครงสร้างโค้ด

```
src/
  lib/
    types.ts       โครงสร้างข้อมูล ตรงกับ Models.kt ของแอป Android
    gameLogic.ts   สูตรคำนวณ EXP/coins/level พอร์ตมาจาก PetRepository.kt
    firebase.ts    ตั้งค่า Firebase + ตำแหน่งเอกสารใน Firestore
    research.ts    บันทึกข้อมูลวิจัย + export CSV
  store/
    useAppStore.ts state กลางทั้งหมด (auth, pet, เซสชัน)
  components/      PetCanvas (วาดสัตว์เลี้ยงด้วย SVG) + UI พื้นฐาน
  pages/           Home, Focus, Stats, Inventory, Settings, Login
```

## ข้อจำกัดสำคัญที่ต้องรู้

**เว็บอ่านเวลาหน้าจอของมือถือไม่ได้** เป็นข้อจำกัดของ Android/iOS เอง ไม่ใช่ของโค้ดนี้
เว็บจึงวัดได้แค่ 2 อย่าง

1. **เวลาเซสชันที่จับบนเว็บ** — นับเวลาที่ผู้ใช้เปิดแท็บนี้ค้างไว้
   ถ้าสลับไปแท็บอื่นจะถูกบันทึกเป็น `web_timer_interrupted`
   (ตรวจด้วย Page Visibility API ซึ่งมองไม่เห็นตอนผู้ใช้เปิดแอปอื่นทับบนมือถือ)
2. **เวลาหน้าจอรายวันที่ผู้ใช้กรอกเอง** — บันทึกเป็น `self_reported`

ทุกแถวข้อมูลจะมีคอลัมน์ `source` กำกับเสมอ ว่าตัวเลขนั้นได้มาอย่างไร
ตอนวิเคราะห์ผลต้องแยกกลุ่มตามคอลัมน์นี้ และต้องเขียนข้อจำกัดนี้ไว้ในรายงานด้วย

ถ้าภายหลังทีมตัดสินใจทำแอป Android เป็นตัวเก็บข้อมูลเพิ่ม
ให้เขียนข้อมูลลง Firestore path เดียวกัน โดยใช้ `source: 'android_usage_stats'`
เว็บจะแสดงผลให้เองโดยไม่ต้องแก้อะไร

## ข้อมูลใน Firestore

```
users/{uid}
  participantId, consentedAt
  state/pet              สถานะสัตว์เลี้ยง
  state/inventory        ไอเทม
  sessions/{id}          เซสชันปลอดหน้าจอ (มี source)
  screenTimeDays/{date}  เวลาหน้าจอรายวัน (มี source)
  surveys/{id}           เผื่อไว้สำหรับ SAS-SV / PSQI
```

กติกาการเข้าถึงอยู่ใน `firestore.rules` ที่โฟลเดอร์หลัก
ผู้ใช้แต่ละคนอ่าน/เขียนได้เฉพาะข้อมูลของตัวเองเท่านั้น

**การดึงข้อมูลรวมทุกคนเพื่อวิเคราะห์** ต้องทำจาก Firebase Console
หรือใช้ service account ไม่สามารถทำจากหน้าเว็บของผู้เข้าร่วมได้ (ตามกติกาข้างบน)
ส่วนปุ่ม export CSV ในหน้าสถิติ จะได้ข้อมูลเฉพาะของผู้ใช้คนนั้น
