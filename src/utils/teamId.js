// Generates a short, readable, unique-enough Team ID, e.g. "TEAM-4F82".
export function generateTeamId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no O/0/I/1 ambiguity
  let suffix = '';
  for (let i = 0; i < 4; i += 1) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `TEAM-${suffix}`;
}
