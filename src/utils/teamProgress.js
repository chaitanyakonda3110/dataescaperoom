import { EVENT_CONFIG } from '../config/eventConfig';

export function solvedCount(team) {
  let count = 0;
  for (let i = 1; i <= EVENT_CONFIG.totalLocks; i += 1) {
    if (team[`lock${i}Solved`]) count += 1;
  }
  return count;
}

export function isTeamComplete(team) {
  return solvedCount(team) === EVENT_CONFIG.totalLocks;
}
