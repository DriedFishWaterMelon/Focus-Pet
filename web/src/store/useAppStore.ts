import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInAnonymously,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { create } from 'zustand'
import { auth, db, googleProvider, paths } from '../lib/firebase'
import {
  completeFocusSession,
  defaultInventory,
  defaultPet,
  feedPet,
  itemIdForRewardName,
  playWithPet,
} from '../lib/gameLogic'
import { logSession } from '../lib/research'
import type { InventoryItem, Pet, ScreenFreeSession, SessionSource, UserProfile } from '../lib/types'

interface AppState {
  // Auth
  profile: UserProfile | null
  authLoading: boolean
  authError: string | null

  // Game
  pet: Pet
  inventory: InventoryItem[]
  loading: boolean

  // Focus session
  isFocusActive: boolean
  targetMinutes: number
  remainingSeconds: number
  selectedTag: string
  /** True once the participant has switched tabs or minimised during this session. */
  leftTabDuringSession: boolean
  celebration: Omit<ScreenFreeSession, 'id'> | null

  listenToAuth: () => () => void
  signInGoogle: () => Promise<void>
  signInGuest: () => Promise<void>
  logOut: () => Promise<void>

  loadUserData: (uid: string) => Promise<void>
  persistPet: (pet: Pet) => Promise<void>
  persistInventory: (items: InventoryItem[]) => Promise<void>

  setTargetMinutes: (minutes: number) => void
  setSelectedTag: (tag: string) => void
  startFocus: () => void
  tickFocus: () => void
  markLeftTab: () => void
  endFocus: (completed: boolean) => Promise<void>
  dismissCelebration: () => void

  feed: (item: InventoryItem) => Promise<void>
  pat: () => Promise<void>
  renamePet: (name: string) => Promise<void>
  setParticipantId: (id: string) => Promise<void>
}

export const useAppStore = create<AppState>((set, get) => ({
  profile: null,
  authLoading: true,
  authError: null,

  pet: defaultPet(),
  inventory: defaultInventory(),
  loading: false,

  isFocusActive: false,
  targetMinutes: 25,
  remainingSeconds: 25 * 60,
  selectedTag: 'Deep Work',
  leftTabDuringSession: false,
  celebration: null,

  listenToAuth: () =>
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        set({ profile: null, authLoading: false })
        return
      }
      const userDoc = await getDoc(doc(db, paths.user(user.uid)))
      const participantId = (userDoc.data()?.participantId as string) ?? ''
      set({
        profile: {
          uid: user.uid,
          displayName: user.displayName ?? 'Focus Guardian',
          email: user.email,
          photoUrl: user.photoURL,
          isAnonymous: user.isAnonymous,
          participantId,
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
      // Closing the popup is a normal user action, not an error worth showing.
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
    await signOut(auth)
    set({ profile: null, pet: defaultPet(), inventory: defaultInventory() })
  },

  loadUserData: async (uid) => {
    set({ loading: true })
    const [petSnap, invSnap] = await Promise.all([
      getDoc(doc(db, paths.pet(uid))),
      getDoc(doc(db, paths.inventory(uid))),
    ])

    const pet = petSnap.exists() ? ({ ...defaultPet(), ...petSnap.data() } as Pet) : defaultPet()
    const inventory = invSnap.exists()
      ? ((invSnap.data().items as InventoryItem[]) ?? defaultInventory())
      : defaultInventory()

    if (!petSnap.exists()) await setDoc(doc(db, paths.pet(uid)), pet)
    if (!invSnap.exists()) await setDoc(doc(db, paths.inventory(uid)), { items: inventory })

    set({ pet, inventory, loading: false })
  },

  persistPet: async (pet) => {
    set({ pet })
    const uid = get().profile?.uid
    if (uid) await setDoc(doc(db, paths.pet(uid)), pet)
  },

  persistInventory: async (items) => {
    set({ inventory: items })
    const uid = get().profile?.uid
    if (uid) await setDoc(doc(db, paths.inventory(uid)), { items })
  },

  setTargetMinutes: (minutes) => {
    if (get().isFocusActive) return
    set({ targetMinutes: minutes, remainingSeconds: minutes * 60 })
  },

  setSelectedTag: (tag) => set({ selectedTag: tag }),

  startFocus: () =>
    set({
      isFocusActive: true,
      remainingSeconds: get().targetMinutes * 60,
      leftTabDuringSession: false,
    }),

  tickFocus: () => {
    const { remainingSeconds, isFocusActive } = get()
    if (!isFocusActive) return
    if (remainingSeconds <= 1) {
      void get().endFocus(true)
      return
    }
    set({ remainingSeconds: remainingSeconds - 1 })
  },

  markLeftTab: () => {
    if (get().isFocusActive) set({ leftTabDuringSession: true })
  },

  endFocus: async (completed) => {
    const { targetMinutes, remainingSeconds, selectedTag, pet, leftTabDuringSession, profile } = get()

    const elapsedMinutes = completed
      ? targetMinutes
      : Math.floor((targetMinutes * 60 - remainingSeconds) / 60)

    set({ isFocusActive: false, remainingSeconds: targetMinutes * 60 })

    // Matches the Android app: sessions under 2 minutes earn nothing.
    if (elapsedMinutes < 2) return

    const source: SessionSource = leftTabDuringSession
      ? 'web_timer_interrupted'
      : 'web_timer_verified'

    const { session, pet: updatedPet } = completeFocusSession(
      pet,
      targetMinutes,
      elapsedMinutes,
      selectedTag,
      source,
    )

    // Grant the reward item, matching the Android reward roll.
    let inventory = get().inventory
    if (session.itemRewardName) {
      const rewardId = itemIdForRewardName(session.itemRewardName)
      inventory = inventory.map((item) =>
        item.id === rewardId ? { ...item, quantity: item.quantity + 1 } : item,
      )
      await get().persistInventory(inventory)
    }

    await get().persistPet(updatedPet)
    set({ celebration: session })

    if (profile) await logSession(profile.uid, session)
  },

  dismissCelebration: () => set({ celebration: null }),

  feed: async (item) => {
    const updated = feedPet(get().pet, item)
    if (!updated) return
    await get().persistInventory(
      get().inventory.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i)),
    )
    await get().persistPet(updated)
  },

  pat: async () => {
    await get().persistPet(playWithPet(get().pet))
  },

  renamePet: async (name) => {
    const trimmed = name.trim()
    if (!trimmed) return
    await get().persistPet({ ...get().pet, name: trimmed })
  },

  setParticipantId: async (id) => {
    const profile = get().profile
    if (!profile) return
    const participantId = id.trim()
    await setDoc(
      doc(db, paths.user(profile.uid)),
      { participantId, consentedAt: Date.now() },
      { merge: true },
    )
    set({ profile: { ...profile, participantId } })
  },
}))

export { GoogleAuthProvider }
