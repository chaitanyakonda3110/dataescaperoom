import { isTeamComplete } from './teamProgress';
import { deriveTeamDisplayStatus } from './timerMath';

// Single source of truth for "what state is this team in", used by both
// the admin team table and the leaderboard so they can never disagree.
// Precedence: disqualified beats everything, completed beats a running
// clock, and only then does an expired clock (with locks still open)
// count as TIME_UP.
export function getTeamStatus(team, gameState) {
  if (team.disqualified) return 'DISQUALIFIED';
  if (isTeamComplete(team)) return 'COMPLETED';
  if (deriveTeamDisplayStatus(gameState, team) === 'TIME_UP') return 'TIME_UP';
  return 'ACTIVE';
}

export const TEAM_STATUS_LABEL = {
  DISQUALIFIED: 'DISQUALIFIED',
  COMPLETED: 'COMPLETED',
  TIME_UP: 'TIME UP',
  ACTIVE: 'ACTIVE',
};
