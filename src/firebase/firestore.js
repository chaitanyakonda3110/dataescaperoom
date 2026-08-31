import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { db } from './config';
import { generateTeamId } from '../utils/teamId';
import { EVENT_CONFIG } from '../config/eventConfig';

const TEAMS_COLLECTION = 'teams';
const GAME_STATE_DOC = 'gameState/main';

function emptyLockFields() {
  const fields = { hintPenaltySeconds: 0 };
  for (let i = 1; i <= EVENT_CONFIG.totalLocks; i += 1) {
    fields[`lock${i}Solved`] = false;
    fields[`lock${i}SolvedAt`] = null;
    fields[`lock${i}Hint1Used`] = false;
    fields[`lock${i}Hint2Used`] = false;
  }
  return fields;
}

// ---------- Teams ----------

export async function isTeamNameTaken(teamName) {
  const normalized = teamName.trim().toLowerCase();
  const q = query(collection(db, TEAMS_COLLECTION), where('teamNameLower', '==', normalized));
  const snapshot = await getDocs(q);
  return !snapshot.empty;
}

export async function registerTeam({ teamName, member1, member2, member3 }) {
  const taken = await isTeamNameTaken(teamName);
  if (taken) {
    throw new Error('A team with this name has already registered.');
  }

  // Retry on the (very unlikely) chance of a Team ID collision.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const teamId = generateTeamId();
    const ref = doc(db, TEAMS_COLLECTION, teamId);
    const existing = await getDoc(ref);
    if (existing.exists()) continue;

    const teamData = {
      teamId,
      teamName: teamName.trim(),
      teamNameLower: teamName.trim().toLowerCase(),
      member1: member1.trim(),
      member2: member2.trim(),
      member3: member3.trim(),
      registeredAt: serverTimestamp(),
      ...emptyLockFields(),
      disqualified: false,
      lastUpdated: serverTimestamp(),
    };

    await setDoc(ref, teamData);
    return teamId;
  }

  throw new Error('Could not generate a unique Team ID. Please try again.');
}

export async function getTeam(teamId) {
  const ref = doc(db, TEAMS_COLLECTION, teamId.trim().toUpperCase());
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

export function subscribeToTeam(teamId, callback) {
  const ref = doc(db, TEAMS_COLLECTION, teamId);
  return onSnapshot(ref, (snap) => {
    callback(snap.exists() ? snap.data() : null);
  });
}

export function subscribeToAllTeams(callback) {
  return onSnapshot(collection(db, TEAMS_COLLECTION), (snapshot) => {
    const teams = snapshot.docs.map((d) => d.data());
    callback(teams);
  });
}

export async function markLockSolved(teamId, lockKey) {
  const ref = doc(db, TEAMS_COLLECTION, teamId);
  await updateDoc(ref, {
    [`${lockKey}Solved`]: true,
    [`${lockKey}SolvedAt`]: serverTimestamp(),
    lastUpdated: serverTimestamp(),
  });
}

export async function useHint(teamId, lockKey, hintNumber) {
  const ref = doc(db, TEAMS_COLLECTION, teamId);
  const penaltySeconds = EVENT_CONFIG.hintPenaltyMinutes * 60;
  await updateDoc(ref, {
    [`${lockKey}Hint${hintNumber}Used`]: true,
    hintPenaltySeconds: increment(penaltySeconds),
    lastUpdated: serverTimestamp(),
  });
}

export async function resetTeamProgress(teamId) {
  const ref = doc(db, TEAMS_COLLECTION, teamId);
  await updateDoc(ref, {
    ...emptyLockFields(),
    lastUpdated: serverTimestamp(),
  });
}

export async function resetAllTeamsProgress(teams) {
  await Promise.all(teams.map((team) => resetTeamProgress(team.teamId)));
}

export async function deleteTeam(teamId) {
  const ref = doc(db, TEAMS_COLLECTION, teamId);
  await deleteDoc(ref);
}

export async function setTeamDisqualified(teamId, disqualified) {
  const ref = doc(db, TEAMS_COLLECTION, teamId);
  await updateDoc(ref, {
    disqualified,
    lastUpdated: serverTimestamp(),
  });
}

// ---------- Game state (timer) ----------

export function subscribeToGameState(callback) {
  const ref = doc(db, GAME_STATE_DOC);
  return onSnapshot(ref, (snap) => {
    callback(snap.exists() ? snap.data() : null);
  });
}

export async function ensureGameStateExists() {
  const ref = doc(db, GAME_STATE_DOC);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    const durationSeconds = EVENT_CONFIG.defaultTimerMinutes * 60;
    await setDoc(ref, {
      durationSeconds,
      remainingSeconds: durationSeconds,
      status: 'NOT_STARTED',
      startedAt: null,
      updatedAt: serverTimestamp(),
    });
  }
}

export async function setTimerDuration(minutes) {
  const ref = doc(db, GAME_STATE_DOC);
  const durationSeconds = Math.max(1, Math.round(minutes)) * 60;
  await setDoc(
    ref,
    {
      durationSeconds,
      remainingSeconds: durationSeconds,
      status: 'NOT_STARTED',
      startedAt: null,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function startTimer(currentGameState) {
  const ref = doc(db, GAME_STATE_DOC);
  const remainingSeconds =
    currentGameState?.status === 'PAUSED' || currentGameState?.status === 'NOT_STARTED'
      ? currentGameState.remainingSeconds
      : currentGameState?.durationSeconds ?? EVENT_CONFIG.defaultTimerMinutes * 60;

  await updateDoc(ref, {
    status: 'RUNNING',
    remainingSeconds,
    startedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

// Ends the event immediately, regardless of how much time was actually
// left. This deliberately reuses the exact same TIME_UP path a natural
// expiry takes (status RUNNING + a remaining time that's already elapsed)
// rather than inventing a separate "finished early" state, so every piece
// that already reacts to TIME_UP — locking Locks, the team's own screen,
// the admin's results popup, the Firestore rules' submission check — kicks
// in identically with no special-casing anywhere else in the app.
export async function finishGameNow() {
  const ref = doc(db, GAME_STATE_DOC);
  await updateDoc(ref, {
    status: 'RUNNING',
    remainingSeconds: 0,
    startedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function pauseTimer(liveRemainingSeconds) {
  const ref = doc(db, GAME_STATE_DOC);
  await updateDoc(ref, {
    status: 'PAUSED',
    remainingSeconds: Math.max(0, Math.round(liveRemainingSeconds)),
    startedAt: null,
    updatedAt: serverTimestamp(),
  });
}

export async function resetTimer(durationSeconds) {
  const ref = doc(db, GAME_STATE_DOC);
  await updateDoc(ref, {
    status: 'NOT_STARTED',
    remainingSeconds: durationSeconds,
    startedAt: null,
    updatedAt: serverTimestamp(),
  });
}
