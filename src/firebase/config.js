import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// =========================================================
// ===== FIREBASE CONFIGURATION (EDIT THIS FILE ONLY) =====
// =========================================================
//
// 1. Go to https://console.firebase.google.com
// 2. Create a new project (or use an existing one).
// 3. Project settings -> General -> "Your apps" -> Add a Web app.
// 4. Copy the firebaseConfig object it gives you and paste the
//    values below, replacing every "CHANGE_ME".
// 5. Enable Authentication -> Sign-in method -> Email/Password.
// 6. Enable Firestore Database (production mode).
// 7. Deploy firestore.rules (see README.md) to secure the data.

const firebaseConfig = {
  apiKey: 'AIzaSyApoPIA09qg77A_jViHYQIQPLfw_pcLllw',
  authDomain: 'data-escape-room-d27c7.firebaseapp.com',
  projectId: 'data-escape-room-d27c7',
  storageBucket: 'data-escape-room-d27c7.firebasestorage.app',
  messagingSenderId: '815173866627',
  appId: '1:815173866627:web:b25bf4520a6eb6df1cf7b6',
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// True once the placeholders above have been replaced with real values.
export const isFirebaseConfigured = !Object.values(firebaseConfig).some(
  (value) => typeof value === 'string' && value.includes('CHANGE_ME')
);
