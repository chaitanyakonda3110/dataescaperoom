export function formatTime(totalSeconds) {
  const clamped = Math.max(0, Math.ceil(totalSeconds));
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function formatDateTime(timestamp) {
  if (!timestamp) return '—';
  const date = typeof timestamp.toDate === 'function' ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Same as formatDateTime, but down to the second — used specifically for
// the leaderboard's "reached at" column. The tiebreak sort itself already
// compares full millisecond-precision timestamps regardless of what's
// displayed, but showing only hour:minute there could make two genuinely
// different finish times look identical to anyone reading the board.
// Seconds make the ranking visibly trustworthy, not just correct under
// the hood.
export function formatDateTimeWithSeconds(timestamp) {
  if (!timestamp) return '—';
  const date = typeof timestamp.toDate === 'function' ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
