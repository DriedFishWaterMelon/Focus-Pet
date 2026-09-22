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

/**
 * v2 added the app-usage records in section 3: how often the app is opened, how
 * long each visit lasts, which screens are used, which care actions are taken,
 * and screen-free attempts that were stopped before earning anything.
 *
 * Anyone who agreed to v1 is still held to v1: the new records are collected
 * only from participants whose stored consentVersion matches this constant.
 * See acceptsCurrentConsent().
 */
export const CONSENT_VERSION = '2026-09-22.v2'

/**
 * Contact address shown on the consent sheet.
 *
 * Research ethics requires a real, monitored contact a participant can reach
 * with questions or to withdraw. This address appears on a public web page, so
 * whoever owns it should expect mail from participants — and from anyone else
 * who opens the site.
 */
export const RESEARCH_CONTACT_EMAIL: string = 'achirawat.bu@kkumail.com'

/**
 * Guards against shipping the consent sheet with no way to reach the team.
 * Typed as string above so this stays a real runtime check rather than being
 * narrowed to a constant `false` once a real address is filled in.
 */
export const CONTACT_IS_PLACEHOLDER =
  !RESEARCH_CONTACT_EMAIL.includes('@') ||
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
      'รวมถึงเซสชันที่ท่านหยุดกลางคันก่อนได้รับรางวัล เพื่อให้ทราบว่าการตั้งเป้าหมายแบบใดทำสำเร็จยาก',
      'เวลาหน้าจอรายวันที่ท่านกรอกเข้ามาเอง',
      'สถานะในเกม เช่น เลเวล ความคืบหน้า และจำนวนวันที่ทำต่อเนื่อง',
      'การใช้งานตัวแอปเอง ได้แก่ จำนวนครั้งที่เปิดแอป ระยะเวลาที่เปิดค้างไว้แต่ละครั้ง หน้าที่เข้าใช้ และจำนวนครั้งที่ให้อาหาร เล่นด้วย หรือซื้อไอเทม',
      'ว่าท่านเปิดแอปจากการแตะการแจ้งเตือนหรือเปิดเอง',
      'รหัสผู้เข้าร่วมแบบนิรนามที่ระบบออกให้อัตโนมัติ ใช้จับคู่ข้อมูลในระบบกับคำตอบแบบสอบถาม ไม่ได้ผูกกับชื่อหรืออีเมลของท่าน',
    ],
  },
  {
    heading: 'ทำไมต้องเก็บข้อมูลการใช้งานแอป',
    body: [
      'เพื่อตอบคำถามว่ากลไกใดในแอปที่ช่วยให้ลดเวลาหน้าจอได้จริง ไม่ใช่เพียงว่าผู้ใช้ลดลงหรือไม่',
      'ข้อมูลนี้เก็บเป็นจำนวนครั้งและระยะเวลารวมเท่านั้น ไม่มีการบันทึกว่าท่านกดอะไรทีละปุ่ม และไม่มีการบันทึกข้อความใด ๆ ที่ท่านพิมพ์',
      'หากท่านไม่สะดวกให้เก็บข้อมูลส่วนนี้ สามารถเลือกไม่เข้าร่วมได้ และยังใช้งานแอปได้เต็มรูปแบบเหมือนเดิม',
    ],
  },
  {
    heading: 'ข้อจำกัดที่ท่านควรทราบ',
    body: [
      'เว็บเบราว์เซอร์ไม่สามารถอ่านเวลาการใช้งานหน้าจอของมือถือได้โดยตรง เพราะเป็นข้อจำกัดด้านความปลอดภัยของระบบปฏิบัติการ',
      'ระหว่างเซสชัน ระบบดูได้เพียงว่าหน้าเว็บนี้ถูกเปิดค้างอยู่บนหน้าจอหรือไม่ ถ้าท่านล็อกหน้าจอหรือสลับไปแอปอื่น ระบบจะเห็นแค่ว่า "ไม่ได้ดูหน้านี้" แต่แยกไม่ออกว่าท่านวางมือถือลงจริง หรือไปเปิดแอปอื่นอยู่',
      'ส่วนเวลาหน้าจอรวมรายวันมาจากที่ท่านกรอกเอง ซึ่งอาจคลาดเคลื่อนได้',
      'ข้อมูลทั้งสองส่วนนี้จึงถูกแยกเก็บตามระดับความน่าเชื่อถือ เพื่อให้รายงานผลได้ตรงตามความเป็นจริง ไม่ได้ใช้ตัดสินหรือประเมินตัวท่าน',
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

/**
 * Alphabet for generated codes.
 *
 * Crockford-style: no I, L, O or U, so a code read off a screen and written on
 * a paper questionnaire cannot be confused between 1/I/L or 0/O. U is dropped
 * as well because it makes unfortunate words out of random letters.
 */
const CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTVWXYZ'

export const CODE_PREFIX = 'FP'
const CODE_LENGTH = 5

/**
 * Generates a participant code.
 *
 * Codes used to be assigned on paper and typed in, which confused people and
 * risked two participants entering the same one. The app issues them instead:
 * the participant never types anything, and the code is still short enough to
 * copy onto a questionnaire by hand.
 *
 * The space is 30^5 ≈ 24 million, so for a study of about a hundred people a
 * collision is vanishingly unlikely — and the claim is transactional anyway, so
 * the one that does happen is retried rather than silently merging two people.
 */
export function generateParticipantId(): string {
  const bytes = new Uint32Array(CODE_LENGTH)
  crypto.getRandomValues(bytes)
  let code = ''
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length]
  }
  return `${CODE_PREFIX}-${code}`
}

/** True when a code looks like one this app issued. */
export function isGeneratedId(code: string): boolean {
  return new RegExp(`^${CODE_PREFIX}-[${CODE_ALPHABET}]{${CODE_LENGTH}}$`).test(code)
}
