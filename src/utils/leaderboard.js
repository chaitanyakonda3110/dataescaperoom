import { EVENT_CONFIG } from '../config/eventConfig';
import { solvedCount } from './teamProgress';

function toMillis(timestamp) {
  return typeof timestamp?.toMillis === 'function' ? timestamp.toMillis() : null;
}

// The timestamp of whichever Lock this team solved most recently — i.e.
// the moment they reached their current solved count. Used only to break
// ties between teams tied on solved count (earlier = ranked higher),
// exactly like "last accepted submission time" in a contest leaderboard.
export function lastSolvedAt(team) {
  let latest = null;
  for (let i = 1; i <= EVENT_CONFIG.totalLocks; i += 1) {
    if (!team[`lock${i}Solved`]) continue; // ignore a stray timestamp on an unsolved lock
    const ms = toMillis(team[`lock${i}SolvedAt`]);
    if (ms !== null && (latest === null || ms > latest)) {
      latest = ms;
    }
  }
  return latest;
}

// Ranks teams: active teams above disqualified teams; within each group,
// more Locks solved ranks higher; ties broken by whichever team reached
// that count first (earlier lastSolvedAt); remaining ties broken by
// registration order for a stable, deterministic result.
export function rankTeams(teams) {
  return [...teams].sort((a, b) => {
    const aDisqualified = !!a.disqualified;
    const bDisqualified = !!b.disqualified;
    if (aDisqualified !== bDisqualified) return aDisqualified ? 1 : -1;

    const solvedDiff = solvedCount(b) - solvedCount(a);
    if (solvedDiff !== 0) return solvedDiff;

    const aTime = lastSolvedAt(a);
    const bTime = lastSolvedAt(b);
    if (aTime !== bTime) {
      if (aTime === null) return 1;
      if (bTime === null) return -1;
      return aTime - bTime;
    }

    const aRegistered = toMillis(a.registeredAt) ?? 0;
    const bRegistered = toMillis(b.registeredAt) ?? 0;
    return aRegistered - bRegistered;
  });
}
