// Derives the "live" remaining seconds from a gameState document.
// The source of truth is Firestore: `remainingSeconds` is a snapshot taken
// at the last SET/PAUSE/RESET action, and `startedAt` is a server timestamp
// recorded the moment the timer was last started/resumed. While RUNNING,
// every client (participant or admin) independently derives the current
// countdown from that anchor instead of trusting a local setInterval alone,
// so a page refresh or late join always reconstructs the correct time.
export function computeRemainingSeconds(gameState) {
  if (!gameState) return 0;

  const { status, remainingSeconds = 0, startedAt } = gameState;

  if (status === 'RUNNING' && startedAt) {
    const startedAtMs =
      typeof startedAt.toMillis === 'function' ? startedAt.toMillis() : startedAt;
    const elapsedSeconds = (Date.now() - startedAtMs) / 1000;
    return Math.max(0, remainingSeconds - elapsedSeconds);
  }

  return Math.max(0, remainingSeconds);
}

export function deriveDisplayStatus(gameState) {
  if (!gameState) return 'NOT_STARTED';
  const remaining = computeRemainingSeconds(gameState);
  if (gameState.status === 'RUNNING' && remaining <= 0) return 'TIME_UP';
  return gameState.status;
}

// ---------- Per-team timer (hint penalties are isolated per team) ----------
//
// There is still only ONE shared event timer (gameState/main), started/
// paused/reset by the admin for everyone at once. What's isolated per team
// is how much of that shared countdown a given team has burned through via
// hints: each hint a team uses subtracts from THEIR OWN effective time only
// (team.hintPenaltySeconds), never from the shared clock other teams see.

export function computeTeamRemainingSeconds(gameState, team) {
  const base = computeRemainingSeconds(gameState);
  const penalty = team?.hintPenaltySeconds ?? 0;
  return Math.max(0, base - penalty);
}

export function deriveTeamDisplayStatus(gameState, team) {
  if (!gameState) return 'NOT_STARTED';
  const remaining = computeTeamRemainingSeconds(gameState, team);
  if (gameState.status === 'RUNNING' && remaining <= 0) return 'TIME_UP';
  return gameState.status;
}
