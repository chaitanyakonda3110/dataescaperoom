import { useEffect, useState } from 'react';
import { computeTeamRemainingSeconds } from '../utils/timerMath';
import { formatTime } from '../utils/format';

// Displays a live countdown derived from a Firestore-synced gameState
// document, minus this team's own hint penalty (computeTeamRemainingSeconds
// factors both in). `gameState` is expected to update via an onSnapshot
// listener upstream; this component re-renders every second in between
// snapshots purely to animate the display — the authoritative value always
// comes from the server-anchored calculation, so a refresh or late join
// never desyncs from the real countdown.
export default function Timer({ gameState, team }) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (gameState?.status !== 'RUNNING') return undefined;
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [gameState?.status]);

  const remaining = computeTeamRemainingSeconds(gameState, team);
  const status = gameState?.status ?? 'NOT_STARTED';
  const isTimeUp = status === 'RUNNING' ? remaining <= 0 : status === 'TIME_UP';

  let stateLabel = 'NOT STARTED';
  let stateClass = 'not-started';
  if (isTimeUp) {
    stateLabel = "TIME'S UP";
    stateClass = 'time-up';
  } else if (status === 'RUNNING') {
    stateLabel = 'RUNNING';
    stateClass = 'running';
  } else if (status === 'PAUSED') {
    stateLabel = 'PAUSED';
    stateClass = 'paused';
  }

  return (
    <div className={`timer-block timer-block--${stateClass}`}>
      <div className="timer-block__label">TIME REMAINING</div>
      <div className="timer-block__display" aria-live="off">
        {isTimeUp ? "TIME'S UP" : formatTime(remaining)}
      </div>
      <div className="timer-block__status-pill">{stateLabel}</div>
    </div>
  );
}
