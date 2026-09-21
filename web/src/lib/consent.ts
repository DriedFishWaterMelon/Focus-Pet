// Informed consent for the Focus Pet study.
//
// The consent text is versioned and stored alongside each participant's record.
// If the wording is ever revised mid-study, the export can still tell which
// version a given person actually agreed to — without that, a changed consent
// form silently invalidates the consent of everyone who enrolled before it.
//
// Bump CONSENT_VERSION whenever any statement below changes in substance.
// Fixing a typo does not need a bump; changing what data is collected, how long
// it is kept, or who can see it always does.

export const CONSENT_VERSION = '2026-09-21.v1'

/**
 * Contact address shown on the consent sheet.
 *
 * Research ethics requires a real, monitored contact a participant can reach
 * with questions or to withdraw. This placeholder must be replaced before the
 * study opens to anyone outside the team — the app surfaces a visible warning
 * while it is still unset.
 */
export const RESEARCH_CONTACT_EMAIL = 'RESEARCH_TEAM_EMAIL_NOT_SET'

export const CONTACT_IS_PLACEHOLDER =
  RESEARCH_CONTACT_EMAIL === 'RESEARCH_TEAM_EMAIL_NOT_SET'

export interface ConsentSection {
  heading: string
  body: string[]
}

export const CONSENT_SHEET: ConsentSection[] = [
  {
    heading: 'โครงงานวิจัยนี้คืออะไร',
    body: [
      'แอปพลิเคชันนี้เป็นส่วนหนึ่งของโครงงาน "แอปพลิเคชันเปลี่ยนเวลาที่ไม่ใช้หน้าจอเป็นความก้าวหน้าในเกม" สาขาวิชาวิทยาการคอมพิวเตอร์ วิทยาลัยการคอมพิวเตอร์',
      'จุดประสงค์คือศึกษาว่าการนำเวลาที่ผู้ใช้ไม่ได้ใช้หน้าจอมาเปลี่ยนเป็นความก้าวหน้าของสัตว์เลี้ยงเสมือน จะช่วยลดพฤติกรรมติดหน้าจอได้จริงหรือไม่',
    ],
  },
  {
    heading: 'ถ้าเข้าร่วม ต้องทำอะไรบ้าง',
    body: [
      'ใช้งานแอปต่อเนื่องประมาณ 4 สัปดาห์ โดยเริ่มเซสชันปลอดหน้าจอตามที่สะดวก ไม่มีจำนวนขั้นต่ำบังคับ',
      'กรอกเวลาหน้าจอรวมของแต่ละวัน โดยดูจาก Digital Wellbeing (Android) หรือ Screen Time (iOS) บนมือถือของท่านเอง',
      'ตอบแบบสอบถามก่อนเริ่มและหลังจบการทดลอง ได้แก่ แบบวัดการติดสมาร์ตโฟน (SAS-SV) และแบบวัดคุณภาพการนอนหลับ (PSQI)',
    ],
  },
  {
    heading: 'ระบบเก็บข้อมูลอะไรของท่านบ้าง',
    body: [
      'เวลาเริ่มและจบของแต่ละเซสชันปลอดหน้าจอ ระยะเวลา และประเภทกิจกรรมที่ท่านเลือก',
      'เวลาหน้าจอรายวันที่ท่านกรอกเข้ามาเอง',
      'สถานะในเกม เช่น เลเวล ความคืบหน้า และจำนวนวันที่ทำต่อเนื่อง',
      'รหัสผู้เข้าร่วมที่ทีมวิจัยกำหนดให้ ใช้จับคู่ข้อมูลในระบบกับคำตอบแบบสอบถาม',
    ],
  },
  {
    heading: 'ข้อจำกัดที่ท่านควรทราบ',
    body: [
      'เว็บเบราว์เซอร์ไม่สามารถอ่านเวลาการใช้งานหน้าจอของมือถือได้โดยตรง เพราะเป็นข้อจำกัดด้านความปลอดภัยของระบบปฏิบัติการ',
      'ระบบจึงวัดได้เฉพาะเวลาที่ท่านเปิดหน้าเซสชันค้างไว้ในเบราว์เซอร์ ส่วนเวลาหน้าจอรวมรายวันมาจากที่ท่านกรอกเอง ซึ่งอาจคลาดเคลื่อนได้',
      'ระบบจะบันทึกไว้ด้วยว่าท่านสลับไปแท็บอื่นระหว่างเซสชันหรือไม่ เพื่อแยกข้อมูลตามระดับความน่าเชื่อถือ ไม่ได้ใช้ตัดสินหรือประเมินตัวท่าน',
    ],
  },
  {
    heading: 'ระบบไม่เก็บอะไร',
    body: [
      'ไม่เก็บว่าท่านเปิดแอปอื่นใดบ้างบนมือถือ และไม่มีการเข้าถึงข้อมูลในเครื่องของท่าน',
      'ไม่เก็บตำแหน่งที่อยู่ รายชื่อผู้ติดต่อ รูปภาพ หรือข้อความใด ๆ',
      'ไฟล์ข้อมูลที่ทีมวิจัยนำไปวิเคราะห์ไม่มีชื่อจริงและอีเมลของท่าน มีเพียงรหัสผู้เข้าร่วมเท่านั้น',
    ],
  },
  {
    heading: 'ใครเห็นข้อมูลของท่าน',
    body: [
      'เฉพาะทีมวิจัยของโครงงานและอาจารย์ที่ปรึกษา',
      'ข้อมูลถูกเก็บในระบบ Cloud Firestore โดยผู้เข้าร่วมแต่ละคนเข้าถึงได้เฉพาะข้อมูลของตนเองเท่านั้น ไม่สามารถดูข้อมูลของผู้อื่นได้',
      'ผลการวิเคราะห์จะรายงานในภาพรวม ไม่มีการระบุตัวบุคคลในรายงานหรือการนำเสนอใด ๆ',
    ],
  },
  {
    heading: 'ความเสี่ยงและประโยชน์',
    body: [
      'การเข้าร่วมไม่มีความเสี่ยงทางกายภาพ ท่านอาจรู้สึกไม่สบายใจเมื่อเห็นตัวเลขเวลาหน้าจอของตนเอง ซึ่งเป็นความรู้สึกปกติ',
      'สัตว์เลี้ยงในแอปจะอ่อนแอลงหากไม่ได้รับการดูแลหลายวันติดต่อกัน และอาจ "เสียชีวิต" ในเกมได้ เป็นเพียงกลไกของเกมเท่านั้น ไม่มีผลต่อข้อมูลหรือการเข้าร่วมของท่าน',
      'ท่านอาจได้ประโยชน์จากการตระหนักรู้พฤติกรรมการใช้หน้าจอของตนเองมากขึ้น แต่ผู้วิจัยไม่รับประกันผลดังกล่าว',
    ],
  },
  {
    heading: 'สิทธิ์ของท่าน',
    body: [
      'การเข้าร่วมเป็นไปโดยสมัครใจทั้งหมด ท่านสามารถปฏิเสธได้โดยไม่มีผลเสียใด ๆ และยังใช้งานแอปได้ตามปกติ',
      'ท่านสามารถถอนตัวเมื่อใดก็ได้ผ่านหน้าตั้งค่า โดยไม่ต้องให้เหตุผล เมื่อถอนตัวแล้วระบบจะหยุดบันทึกข้อมูลเพื่อการวิจัยทันที',
      'ท่านสามารถขอให้ลบข้อมูลที่เก็บไปแล้วได้ โดยติดต่อทีมวิจัย',
    ],
  },
]

/** Statements the participant ticks individually. Ticking all enables consent. */
export const CONSENT_CHECKS = [
  'ข้าพเจ้าได้อ่านและเข้าใจข้อมูลข้างต้นแล้ว',
  'ข้าพเจ้าทราบว่าการเข้าร่วมเป็นไปโดยสมัครใจ และถอนตัวได้ตลอดเวลา',
  'ข้าพเจ้ายินยอมให้เก็บและใช้ข้อมูลการใช้งานเพื่อการวิจัยตามที่ระบุไว้',
] as const

// ---------------------------------------------------------------------------
// Participant ID
// ---------------------------------------------------------------------------

export interface IdValidation {
  ok: boolean
  /** The normalised code to store. Empty when invalid. */
  value: string
  error?: string
}

/**
 * Validates and normalises a participant code.
 *
 * Codes are assigned on paper by the research team, so the field has to survive
 * a person typing what is on their slip: stray spaces, lowercase, and the Thai
 * digits some keyboards produce. Everything is normalised to one canonical form
 * before storage, because "p001", "P001 " and "P๐๐๑" arriving as three distinct
 * codes would split one participant's data across three records.
 */
export function validateParticipantId(raw: string): IdValidation {
  const thaiDigits = '๐๑๒๓๔๕๖๗๘๙'
  const normalised = raw
    .trim()
    .replace(/[๐-๙]/g, (d) => String(thaiDigits.indexOf(d)))
    .replace(/[\s_]+/g, '-')
    .toUpperCase()

  if (normalised.length === 0) {
    return { ok: false, value: '', error: 'กรุณากรอกรหัสผู้เข้าร่วม' }
  }
  if (normalised.length < 2 || normalised.length > 16) {
    return { ok: false, value: '', error: 'รหัสต้องมีความยาว 2–16 ตัวอักษร' }
  }
  if (!/^[A-Z0-9-]+$/.test(normalised)) {
    return {
      ok: false,
      value: '',
      error: 'ใช้ได้เฉพาะตัวอักษรภาษาอังกฤษ ตัวเลข และขีดกลาง',
    }
  }
  if (!/[0-9]/.test(normalised)) {
    return { ok: false, value: '', error: 'รหัสต้องมีตัวเลขอย่างน้อยหนึ่งตัว' }
  }

  return { ok: true, value: normalised }
}
