import { useState } from 'react';
import { setTimerDuration, startTimer, pauseTimer, resetTimer, finishGameNow } from '../firebase/firestore';
import { computeRemainingSeconds } from '../utils/timerMath';
import { useToast } from '../context/ToastContext';
import ConfirmModal from './ConfirmModal';

export default function AdminTimerControl({ gameState }) {
  const [minutes, setMinutes] = useState(
    gameState?.durationSeconds ? Math.round(gameState.durationSeconds / 60) : 45
  );
  const [busy, setBusy] = useState(false);
  const [confirmFinishOpen, setConfirmFinishOpen] = useState(false);
  const { showToast } = useToast();

  const status = gameState?.status ?? 'NOT_STARTED';

  async function run(action, successMessage) {
    setBusy(true);
    try {
      await action();
      showToast(successMessage, 'success');
    } catch (err) {
      showToast(err.message || 'Timer action failed.', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function handleFinishGame() {
    setConfirmFinishOpen(false);
    await run(() => finishGameNow(), "Game finished — every team's time is now up.");
  }

  return (
    <div className="glass-card admin-timer-control">
      <h3 className="admin-panel__title">TIMER CONTROL</h3>

      <div className="admin-timer-control__duration">
        <label htmlFor="duration">DURATION</label>
        <div className="admin-timer-control__duration-row">
          <input
            id="duration"
            type="number"
            min={1}
            max={240}
            className="text-input text-input--number"
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value))}
          />
          <span>MINUTES</span>
        </div>
      </div>

      <div className="admin-timer-control__buttons">
        <button
          type="button"
          className="btn btn--ghost"
          disabled={busy || minutes < 1}
          onClick={() => run(() => setTimerDuration(minutes), `Timer set to ${minutes} minutes.`)}
        >
          SET TIMER
        </button>
        <button
          type="button"
          className="btn btn--primary"
          disabled={busy || status === 'RUNNING'}
          onClick={() => run(() => startTimer(gameState), 'Timer started.')}
        >
          START
        </button>
        <button
          type="button"
          className="btn btn--warning"
          disabled={busy || status !== 'RUNNING'}
          onClick={() =>
            run(() => pauseTimer(computeRemainingSeconds(gameState)), 'Timer paused.')
          }
        >
          PAUSE
        </button>
        <button
          type="button"
          className="btn btn--danger"
          disabled={busy}
          onClick={() =>
            run(
              () => resetTimer(gameState?.durationSeconds ?? minutes * 60),
              'Timer reset.'
            )
          }
        >
          RESET
        </button>
        <button
          type="button"
          className="btn btn--danger"
          disabled={busy || status === 'NOT_STARTED'}
          onClick={() => setConfirmFinishOpen(true)}
        >
          FINISH GAME
        </button>
      </div>

      <div className="admin-timer-control__status">
        CURRENT STATE: <strong>{status.replace('_', ' ')}</strong>
      </div>

      <ConfirmModal
        open={confirmFinishOpen}
        title="FINISH GAME NOW?"
        description="This ends the event immediately for every team, no matter how much time is actually left on the clock. Locks close instantly for everyone, and the results popup will appear. This cannot be undone."
        confirmLabel="FINISH GAME"
        onConfirm={handleFinishGame}
        onCancel={() => setConfirmFinishOpen(false)}
      />
    </div>
  );
}
