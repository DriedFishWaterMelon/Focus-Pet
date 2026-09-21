import { initializeApp } from 'firebase/app'
import { GoogleAuthProvider, getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Firebase web config. These values are not secrets — Firebase ships them to every
// browser that loads the app — but they are read from .env so the project can be
// pointed at a separate test project without editing code. Access is controlled by
// Firestore Security Rules, not by hiding these values. See firestore.rules.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()

// Firestore layout. The Android app writes to users/{uid} already, so the web app
// reuses that path and adds the research collections underneath it.
export const paths = {
  user: (uid: string) => `users/${uid}`,
  pet: (uid: string) => `users/${uid}/state/pet`,
  inventory: (uid: string) => `users/${uid}/state/inventory`,
  achievements: (uid: string) => `users/${uid}/state/achievements`,
  sessions: (uid: string) => `users/${uid}/sessions`,
  screenTimeDays: (uid: string) => `users/${uid}/screenTimeDays`,
  surveys: (uid: string) => `users/${uid}/surveys`,
}
