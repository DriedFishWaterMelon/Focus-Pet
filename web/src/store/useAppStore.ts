import {
  onAuthStateChanged,
  signInAnonymously,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { create } from 'zustand'
import { auth, db, googleProvider, paths } from '../lib/firebase'
import { evaluateAchievements } from '../lib/achievements'
import {
  SICK_THRESHOLD,
  applyDecay,
  applyScreenTimePenalty,
  buyItem,
  completeFocusSession,
  completeFreeSession,
  defaultInventory,
  defaultPet,
  feedPet,
  grantItem,
  hatchNewPet,
  itemIdForRewardName,
  minutesToNextFreePoint,
  nextAttentionAt,
  playWithPet,
} from '../lib/gameLogic'
import { publishAttentionSchedule } from '../lib/notifications'
import { recordAction, resetVisit } from '../lib/telemetry'
import { logSession } from '../lib/research'
import {
  claimParticipantId,
  enrolmentFromDoc,
  recordConsent,
  recordDecline,
  recordWithdrawal,
} from '../lib/enrolment'
import { isEnrolled } from '../lib/types'
import type { SessionMode } from '../lib/types'
import type {
  Achievement,
  RestReport,
  InventoryItem,
  Pet,
  PetSpecies,
  ScreenFreeSession,
  SessionSource,
  UserProfile,
} from '../lib/types'

export interface Toast {
  id: number
  message: string
  tone: 'info' | 'success' | 'warning' | 'danger'
}

export interface Celebration {
  kind: 'session' | 'levelUp' | 'evolution' | 'achievement'
  session?: Omit<ScreenFreeSession, 'id'>
  title: string
  detail: string
  emoji: string
}

interface AppState {
  profile: UserProfile | null
  authLoading: boolean
  authError: string | null

  pet: Pet
  inventory: InventoryItem[]
  achievements: Achievement[]
  unlockedAt: Record<string, number>
  loading: boolean
  /** What happened to the pet while the app was closed. Shown once, then cleared. */
  restReport: RestReport | null

  isFocusActive: boolean
  targetMinutes: number
  remainingSeconds: number
  /** When the running session began. The timer is derived from this, not counted. */
  sessionStartedAt: number | null
  selectedTag: string
  screenOnDuringSession: boolean
  /** Which timer the Focus screen is set to. */
  sessionMode: SessionMode
  /** Seconds counted up so far in free mode. */
  elapsedSeconds: number

  celebrations: Celebration[]
  toasts: Toast[]

  listenToAuth: () => () => void
  signInGoogle: () => Promise<void>
  signInGuest: () => Promise<void>
  logOut: () => Promise<void>

  loadUserData: (uid: string) => Promise<void>
  persistPet: (pet: Pet) => Promise<void>
  persistInventory: (items: InventoryItem[]) => Promise<void>
  tickDecay: () => void
  reportScreenTime: (minutes: number) => Promise<void>

  completeOnboarding: (name: string, species: PetSpecies) => Promise<void>
  revivePet: (name: string, species: PetSpecies) => Promise<void>

  setSessionMode: (mode: SessionMode) => void
  setTargetMinutes: (minutes: number) => void
  setSelectedTag: (tag: string) => void
  startFocus: () => void
  tickFocus: () => void
  markScreenOn: () => void
  endFocus: (completed: boolean) => Promise<void>
  bankFreeSession: (minutes: number, tag: string, source: SessionSource) => Promise<void>

  feed: (item: InventoryItem) => Promise<void>
  pat: () => Promise<void>
  purchase: (itemId: string) => Promise<void>
  renamePet: (name: string) => Promise<void>
  setSpecies: (species: PetSpecies) => Promise<void>
  giveConsent: () => Promise<void>
  declineConsent: () => Promise<void>
  withdrawFromStudy: () => Promise<void>
  /** Issues a generated participant code. Takes no input — see consent.ts. */
  issueParticipantId: () => Promise<{ ok: boolean; message?: string }>

  pushToast: (message: string, tone?: Toast['tone']) => void
  dismissToast: (id: number) => void
  dismissCelebration: () => void
  dismissRestReport: () => void
}

let toastSeq = 0

export const useAppStore = create<AppState>((set, get) => ({
  profile: null,
  authLoading: true,
  authError: null,

  pet: defaultPet(),
  inventory: defaultInventory(),
  achievements: [],
  unlockedAt: {},
  loading: false,
  restReport: null,

  isFocusActive: false,
  targetMinutes: 25,
  remainingSeconds: 25 * 60,
  sessionStartedAt: null,
  selectedTag: 'Deep Work',
  screenOnDuringSession: false,
  sessionMode: 'targeted',
  elapsedSeconds: 0,

  celebrations: [],
  toasts: [],

  listenToAuth: () =>
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        set({ profile: null, authLoading: false })
        return
      }
      const userDoc = await getDoc(doc(db, paths.user(user.uid)))
      const data = userDoc.data() ?? {}
      set({
        profile: {
          uid: user.uid,
          displayName: user.displayName ?? 'Focus Guardian',
          email: user.email,
          photoUrl: user.photoURL,
          isAnonymous: user.isAnonymous,
          participantId: (data.participantId as string) ?? '',
          onboarded: Boolean(data.onboarded),
          enrolment: enrolmentFromDoc(data),
        },
        authLoading: false,
      })
      await get().loadUserData(user.uid)
    }),

  signInGoogle: async () => {
    set({ authError: null })
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (error) {
      const code = (error as { code?: string }).code ?? ''
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return
      set({ authError: (error as Error).message })
    }
  },

  signInGuest: async () => {
    set({ authError: null })
    try {
      await signInAnonymously(auth)
    } catch (error) {
      set({ authError: (error as Error).message })
    }
  },

  logOut: async () => {
    resetVisit()
    await signOut(auth)
    set({
      profile: null,
      pet: defaultPet(),
      inventory: defaultInventory(),
      achievements: [],
      unlockedAt: {},
      restReport: null,
    })
  },

  loadUserData: async (uid) => {
    set({ loading: true })
    const [petSnap, invSnap, achSnap] = await Promise.all([
      getDoc(doc(db, paths.pet(uid))),
      getDoc(doc(db, paths.inventory(uid))),
      getDoc(doc(db, paths.achievements(uid))),
    ])

    const stored = petSnap.exists() ? ({ ...defaultPet(), ...petSnap.data() } as Pet) : defaultPet()
    const inventory = invSnap.exists()
      ? ((invSnap.data().items as InventoryItem[]) ?? defaultInventory())
      : defaultInventory()
    const unlockedAt = achSnap.exists()
      ? ((achSnap.data().unlockedAt as Record<string, number>) ?? {})
      : {}

    // Catch the pet up on everything that happened while the app was closed.
    // The app was shut, so the whole gap counts as time away from the phone.
    const { pet, report } = applyDecay(stored, Date.now(), false)
    const { achievements } = evaluateAchievements(pet, unlockedAt)

    set({ pet, inventory, achievements, unlockedAt, restReport: report, loading: false })

    if (!petSnap.exists()) await setDoc(doc(db, paths.pet(uid)), pet)
    else if (report) await setDoc(doc(db, paths.pet(uid)), pet)
    if (!invSnap.exists()) await setDoc(doc(db, paths.inventory(uid)), { items: inventory })

    if (report?.recovered) {
      get().pushToast(`${pet.name} หายดีแล้ว ขอบคุณที่พักให้`, 'success')
    }
  },

  persistPet: async (pet) => {
    set({ pet })
    const { unlockedAt } = get()
    const { achievements, newlyUnlocked } = evaluateAchievements(pet, unlockedAt)

    if (newlyUnlocked.length > 0) {
      const nextUnlocked = { ...unlockedAt }
      for (const achievement of newlyUnlocked) {
        nextUnlocked[achievement.id] = achievement.unlockedAt ?? Date.now()
      }
      set({ achievements, unlockedAt: nextUnlocked })
      set((state) => ({
        celebrations: [
          ...state.celebrations,
          ...newlyUnlocked.map((achievement): Celebration => ({
            kind: 'achievement',
            title: 'ปลดล็อกความสำเร็จ',
            detail: `${achievement.name} — ${achievement.description}`,
            emoji: achievement.iconEmoji,
          })),
        ],
      }))
    } else {
      set({ achievements })
    }

    const uid = get().profile?.uid
    if (!uid) return
    await setDoc(doc(db, paths.pet(uid)), pet)

    // Tell the reminder sender when this pet will next need help. Computed by
    // gameLogic so the rule lives with the other game rules.
    void publishAttentionSchedule(uid, pet, nextAttentionAt(pet))
    if (newlyUnlocked.length > 0) {
      await setDoc(doc(db, paths.achievements(uid)), { unlockedAt: get().unlockedAt })
    }
  },

  persistInventory: async (items) => {
    set({ inventory: items })
    const uid = get().profile?.uid
    if (uid) await setDoc(doc(db, paths.inventory(uid)), { items })
  },

  /**
   * Charges the pet for time spent in the app, and heals it for time away.
   *
   * Only counts as app time while the page is actually on screen. This interval
   * keeps firing in a backgrounded tab, and billing a participant for a phone
   * sitting in their pocket would recreate the exact mistake this model exists
   * to fix.
   */
  tickDecay: () => {
    const { pet } = get()
    if (!pet.isAlive) return

    const onScreen = typeof document !== 'undefined' && document.visibilityState === 'visible'
    const wasSick = pet.health < SICK_THRESHOLD
    const { pet: next } = applyDecay(pet, Date.now(), onScreen)
    if (next.lastTickAt === pet.lastTickAt) return

    set({ pet: next })
    if (!next.isAlive) {
      get().pushToast(`${pet.name} หมดแรงไปแล้ว…`, 'danger')
      void get().persistPet(next)
    } else if (!wasSick && next.health < SICK_THRESHOLD) {
      get().pushToast(`${pet.name} เริ่มไม่ไหวแล้ว วางมือถือสักพักไหม`, 'warning')
    }
  },

  /**
   * Records a day's reported screen time and lets the pet feel it.
   *
   * Lives in the store rather than in the page because it changes the pet, and
   * it is the only place a participant's phone use outside this app can reach
   * the game at all.
   */
  reportScreenTime: async (minutes) => {
    const { pet } = get()
    const next = applyScreenTimePenalty(pet, minutes)
    if (next === pet) return
    set({ pet: next })
    await get().persistPet(next)
  },

  completeOnboarding: async (name, species) => {
    const profile = get().profile
    const pet = defaultPet({ name: name.trim() || 'Sproutly', species })
    await get().persistPet(pet)
    if (profile) {
      await setDoc(doc(db, paths.user(profile.uid)), { onboarded: true }, { merge: true })
      set({ profile: { ...profile, onboarded: true } })
    }
    get().pushToast(`ยินดีต้อนรับ ${pet.name}!`, 'success')
  },

  revivePet: async (name, species) => {
    const fresh = hatchNewPet(get().pet, name.trim() || 'Sproutly', species)
    await get().persistPet(fresh)
    await get().persistInventory(defaultInventory())
    set({ restReport: null })
    get().pushToast(`${fresh.name} ฟักออกมาแล้ว รุ่นที่ ${fresh.generation}`, 'success')
  },

  setSessionMode: (mode) => {
    if (get().isFocusActive) return
    set({ sessionMode: mode, elapsedSeconds: 0 })
  },

  setTargetMinutes: (minutes) => {
    if (get().isFocusActive) return
    set({ targetMinutes: minutes, remainingSeconds: minutes * 60 })
  },

  setSelectedTag: (tag) => set({ selectedTag: tag }),

  startFocus: () =>
    set({
      isFocusActive: true,
      sessionStartedAt: Date.now(),
      remainingSeconds: get().targetMinutes * 60,
      elapsedSeconds: 0,
      screenOnDuringSession: false,
    }),

  /**
   * Recomputes the clock from the session's start timestamp.
   *
   * It must not count its own ticks. A participant doing this correctly locks
   * their phone, and a browser throttles timers in a hidden tab to roughly once
   * a minute — iOS stops them altogether — so a counted timer would lose most
   * of a locked-phone session and report a thirty-minute break as a few
   * minutes. Deriving from wall-clock timestamps means the tab can be frozen
   * for the whole session and still come back with the right answer.
   */
  tickFocus: () => {
    const { isFocusActive, sessionMode, sessionStartedAt, targetMinutes } = get()
    if (!isFocusActive || sessionStartedAt === null) return

    const elapsed = Math.floor((Date.now() - sessionStartedAt) / 1000)

    // Free mode counts up and never ends on its own; the participant decides
    // when they are done.
    if (sessionMode === 'free') {
      set({ elapsedSeconds: elapsed })
      return
    }

    const remaining = targetMinutes * 60 - elapsed
    if (remaining <= 0) {
      set({ remainingSeconds: 0 })
      void get().endFocus(true)
      return
    }
    set({ remainingSeconds: remaining, elapsedSeconds: elapsed })
  },

  /**
   * Notes that the page was on screen during a session.
   *
   * A screen-free session is supposed to be spent with the phone down, which
   * from inside a tab looks like the page being hidden. Being visible is
   * therefore the state worth flagging: those minutes were spent looking at a
   * screen, whatever the timer says.
   */
  markScreenOn: () => {
    if (get().isFocusActive) set({ screenOnDuringSession: true })
  },

  endFocus: async (completed) => {
    const { targetMinutes, sessionStartedAt, sessionMode, selectedTag, pet, screenOnDuringSession, profile } =
      get()

    const startedAt = sessionStartedAt ?? Date.now()
    const endedAt = Date.now()
    // Measured, not counted, for the same reason tickFocus is: the tab may have
    // been frozen for most of the session, which is the desired behaviour.
    const realMinutes = Math.floor((endedAt - startedAt) / 60_000)
    // `completed` means the countdown reached zero. It is trusted over the
    // floored minute count, which can land a millisecond short of the target.
    const elapsedMinutes =
      sessionMode === 'free'
        ? realMinutes
        : completed
          ? targetMinutes
          : Math.min(targetMinutes, realMinutes)

    set({
      isFocusActive: false,
      sessionStartedAt: null,
      remainingSeconds: targetMinutes * 60,
      elapsedSeconds: 0,
    })

    // Matches the Android app: sessions under 2 minutes earn nothing. They are
    // still recorded, because an attempt that was given up on says something
    // about how hard a target was — discarding them hid every failure.
    if (elapsedMinutes < 2) {
      if (profile && isEnrolled(profile.enrolment)) {
        await logSession(profile.uid, {
          targetMinutes: sessionMode === 'free' ? 0 : targetMinutes,
          actualMinutes: elapsedMinutes,
          startTime: startedAt,
          endTime: endedAt,
          completed: false,
          abandoned: true,
          expEarned: 0,
          coinsEarned: 0,
          itemRewardName: null,
          tag: selectedTag,
          source: screenOnDuringSession ? 'web_timer_screen_on' : 'web_timer_screen_off',
          mode: sessionMode,
        })
      }
      return
    }

    const source: SessionSource = screenOnDuringSession
      ? 'web_timer_screen_on'
      : 'web_timer_screen_off'

    if (sessionMode === 'free') {
      await get().bankFreeSession(elapsedMinutes, selectedTag, source)
      return
    }

    const outcome = completeFocusSession(pet, targetMinutes, elapsedMinutes, selectedTag, source)

    if (outcome.session.itemRewardName) {
      const rewardId = itemIdForRewardName(outcome.session.itemRewardName)
      await get().persistInventory(grantItem(get().inventory, rewardId))
    }

    await get().persistPet(outcome.pet)

    const queued: Celebration[] = [
      {
        kind: 'session',
        session: outcome.session,
        title: outcome.session.completed ? 'สำเร็จแล้ว!' : 'จบเซสชัน',
        detail: `ปลอดหน้าจอไป ${outcome.session.actualMinutes} นาที`,
        emoji: outcome.session.completed ? '🎉' : '👍',
      },
    ]
    if (outcome.leveledUp) {
      queued.push({
        kind: 'levelUp',
        title: 'เลเวลอัป!',
        detail: `${outcome.pet.name} ขึ้นเป็นเลเวล ${outcome.pet.level} แล้ว`,
        emoji: '⬆️',
      })
    }
    if (outcome.evolved) {
      queued.push({
        kind: 'evolution',
        title: 'วิวัฒนาการ!',
        detail: `${outcome.pet.name} เปลี่ยนร่างเป็นขั้นใหม่แล้ว`,
        emoji: '🌟',
      })
    }
    set((state) => ({ celebrations: [...state.celebrations, ...queued] }))

    // Research data is written last and independently of the game outcome, so a
    // game-side failure can never cost us the participant's recorded session.
    //
    // Nothing is logged unless the person is actively enrolled. Someone who
    // declined, withdrew, or has not answered the consent sheet still gets the
    // full game; their behaviour simply never enters the dataset.
    if (profile && isEnrolled(profile.enrolment)) {
      await logSession(profile.uid, outcome.session)
    }
  },

  /**
   * Banks an open-ended session and celebrates only when points actually landed.
   *
   * A free session shorter than the remaining minutes of the current point pays
   * nothing on its own, but the time is still added to the lifetime total and
   * counts toward the next one — so the toast says the minutes were kept rather
   * than going silent, which would read as the app losing them.
   */
  bankFreeSession: async (minutes, tag, source) => {
    const outcome = completeFreeSession(get().pet, minutes, tag, source)
    await get().persistPet(outcome.pet)

    const queued: Celebration[] = []

    if (outcome.pointsEarned > 0) {
      queued.push({
        kind: 'session',
        session: outcome.session,
        title: `ได้ ${outcome.pointsEarned} แต้ม!`,
        detail: `ปลอดหน้าจอไป ${minutes} นาที`,
        emoji: '⭐',
      })
    } else {
      const left = minutesToNextFreePoint(outcome.pet.freeMinutesTotal)
      get().pushToast(`เก็บ ${minutes} นาทีแล้ว · อีก ${left} นาทีได้ 1 แต้ม`, 'info')
    }

    if (outcome.leveledUp) {
      queued.push({
        kind: 'levelUp',
        title: 'เลเวลอัป!',
        detail: `${outcome.pet.name} ขึ้นเป็นเลเวล ${outcome.pet.level} แล้ว`,
        emoji: '⬆️',
      })
    }
    if (outcome.evolved) {
      queued.push({
        kind: 'evolution',
        title: 'เติบโตแล้ว!',
        detail: `${outcome.pet.name} เปลี่ยนร่างเป็นขั้นใหม่`,
        emoji: '🌟',
      })
    }
    if (queued.length > 0) set((state) => ({ celebrations: [...state.celebrations, ...queued] }))

    const profile = get().profile
    if (profile && isEnrolled(profile.enrolment)) {
      await logSession(profile.uid, outcome.session)
    }
  },

  feed: async (item) => {
    const updated = feedPet(get().pet, item)
    if (!updated) {
      get().pushToast('ให้อาหารไม่ได้ตอนนี้', 'warning')
      return
    }
    await get().persistInventory(
      get()
        .inventory.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i))
        .filter((i) => i.quantity > 0),
    )
    await get().persistPet(updated)
    recordAction('feed')
    get().pushToast(`${updated.name} กิน${item.name}แล้ว`, 'success')
  },

  pat: async () => {
    const updated = playWithPet(get().pet)
    if (!updated) return
    await get().persistPet(updated)
    recordAction('pat')
  },

  purchase: async (itemId) => {
    const result = buyItem(get().pet, get().inventory, itemId)
    if (!result) {
      get().pushToast('เหรียญไม่พอ', 'warning')
      return
    }
    await get().persistInventory(result.inventory)
    await get().persistPet(result.pet)
    recordAction('purchase')
    get().pushToast('ซื้อสำเร็จ', 'success')
  },

  renamePet: async (name) => {
    const trimmed = name.trim()
    if (!trimmed) return
    await get().persistPet({ ...get().pet, name: trimmed })
    get().pushToast('เปลี่ยนชื่อแล้ว', 'success')
  },

  // Colour is cosmetic and changeable at any time. It never touches level,
  // stats or anything the research data is derived from.
  setSpecies: async (species) => {
    if (get().pet.species === species) return
    await get().persistPet({ ...get().pet, species })
    get().pushToast('เปลี่ยนสีแล้ว', 'success')
  },

  giveConsent: async () => {
    const profile = get().profile
    if (!profile) return
    const enrolment = await recordConsent(profile.uid)
    set({ profile: { ...profile, enrolment } })
  },

  declineConsent: async () => {
    const profile = get().profile
    if (!profile) return
    const enrolment = await recordDecline(profile.uid)
    set({ profile: { ...profile, enrolment } })
    get().pushToast('บันทึกแล้ว ใช้งานแอปได้ตามปกติ', 'info')
  },

  withdrawFromStudy: async () => {
    const profile = get().profile
    if (!profile) return
    const enrolment = await recordWithdrawal(profile.uid, profile.enrolment)
    set({ profile: { ...profile, enrolment } })
    get().pushToast('ถอนตัวแล้ว ระบบหยุดบันทึกข้อมูลวิจัย', 'info')
  },

  issueParticipantId: async () => {
    const profile = get().profile
    if (!profile) return { ok: false, message: 'ยังไม่ได้เข้าสู่ระบบ' }

    const result = await claimParticipantId(profile.uid, profile.enrolment)
    if (!result.ok) {
      get().pushToast(result.message, 'warning')
      return { ok: false, message: result.message }
    }

    set({
      profile: {
        ...profile,
        participantId: result.participantId,
        enrolment: { ...profile.enrolment, participantIdSetAt: Date.now() },
      },
    })
    return { ok: true }
  },

  pushToast: (message, tone = 'info') => {
    const id = ++toastSeq
    set((state) => ({ toasts: [...state.toasts, { id, message, tone }] }))
    window.setTimeout(() => get().dismissToast(id), 3500)
  },

  dismissToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),

  dismissCelebration: () => set((state) => ({ celebrations: state.celebrations.slice(1) })),

  dismissRestReport: () => set({ restReport: null }),
}))
