import { initializeApp, getApps, getApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import type { Auth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBKyKOE8X4yi2Yq5kCVX75FEH_t94gTWGY',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'itmanage-c6fe0.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'itmanage-c6fe0',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'itmanage-c6fe0.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1061998028454',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1061998028454:web:e698e983e69051df2af667',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-ZTWVEL88J9',
};

let app: FirebaseApp | null = null;
let auth: Auth | any = null;
let db: Firestore | any = null;
const googleProvider = new GoogleAuthProvider();

const hasConfigKeys = Boolean(
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== 'your-api-key-here' &&
  firebaseConfig.projectId
);

if (hasConfigKeys) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (error) {
    console.warn('Firebase initialization skipped:', error);
  }
}

export const isFirebaseConfigured = Boolean(app && db);

export { app, auth, db, googleProvider };
export default app;
