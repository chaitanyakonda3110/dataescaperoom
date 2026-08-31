import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from './config';

export function adminSignIn(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export function adminSignOut() {
  return signOut(auth);
}

export function subscribeToAuth(callback) {
  return onAuthStateChanged(auth, callback);
}
