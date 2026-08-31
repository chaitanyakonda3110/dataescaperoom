import { useEffect, useState } from 'react';
import { markLockSolved, useHint } from '../firebase/firestore';
import { EVENT_CONFIG } from '../config/eventConfig';
import { computeTeamRemainingSeconds } from '../utils/timerMath';
import { formatTime } from '../utils/format';
import { useToast } from '../context/ToastContext';
import ConfirmModal from './ConfirmModal';
import LockImage from './LockImage';

export default function LockModal({ lockIndex, lockData, team, teamId, gameState, onClose }) {
  const [value, setValue] = useState('');
  const [invalid, setInvalid] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [pendingHint, setPendingHint] = useState(null); // 1 | 2 | null
  const [, setTick] = useState(0);
  const { showToast } = useToast();

  // The dashboard's own Timer is hidden behind this popup while it's open,
  // so show a compact live countdown right in the header instead — same
  // server-anchored calculation, just re-rendered every second locally to
  // animate it.
  useEffect(() => {
    if (gameState?.status !== 'RUNNING') return undefined;
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [gameState?.status]);

  const remaining = computeTeamRemainingSeconds(gameState, team);
  const isTimeUp = gameState?.status === 'RUNNING' && remaining <= 0;

  const lockKey = `lock${lockIndex}`;
  const hint1Used = !!team?.[`${lockKey}Hint1Used`];
  const hint2Used = !!team?.[`${lockKey}Hint2Used`];

  async function handleUnlock(e) {
    e.preventDefault();
    if (!value.trim() || verifying) return;
    setVerifying(true);
    const isCorrect = value.trim() === (lockData?.password ?? '');
    if (isCorrect) {
      try {
        await markLockSolved(teamId, lockKey);
        showToast(`Lock ${lockIndex} unlocked!`, 'success');
        onClose();
      } catch (err) {
        showToast(err.message || 'Could not save progress. Try again.', 'error');
      }
    } else {
      setInvalid(true);
    }
    setVerifying(false);
  }

  async function confirmHint() {
    const hintNumber = pendingHint;
    setPendingHint(null);
    try {
      await useHint(teamId, lockKey, hintNumber);
      showToast(`Hint ${hintNumber} revealed — ${EVENT_CONFIG.hintPenaltyMinutes} minutes deducted.`, 'info');
    } catch (err) {
      showToast(err.message || 'Could not use hint. Try again.', 'error');
    }
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal-card modal-card--wide lock-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-card__close" onClick={onClose}>
          ×
        </button>

        <div className="lock-modal__header-row">
          <h3 className="modal-card__title lock-modal__title">LOCK {lockIndex}</h3>
          <span className={`lock-modal__timer ${isTimeUp ? 'lock-modal__timer--up' : ''}`}>
            ⏱ {isTimeUp ? "TIME'S UP" : formatTime(remaining)}
          </span>
        </div>

        <LockImage lockIndex={lockIndex} />

        <form onSubmit={handleUnlock} className="lock-modal__answer-form">
          <div className="lock-modal__answer-row">
            <input
              type="text"
              className="password-card__input"
              placeholder="ENTER PASSWORD"
              value={value}
              disabled={verifying}
              onChange={(e) => {
                setValue(e.target.value);
                if (invalid) setInvalid(false);
              }}
            />
            <button type="submit" className="btn btn--verify" disabled={verifying || !value.trim()}>
              {verifying ? '...' : 'UNLOCK'}
            </button>
          </div>
          {invalid && <span className="status-text status-text--error">INVALID PASSWORD</span>}
        </form>

        <div className="lock-modal__hints">
          <div className="lock-modal__hint">
            <button
              type="button"
              className="btn btn--warning"
              disabled={hint1Used}
              onClick={() => setPendingHint(1)}
            >
              {hint1Used ? 'HINT 1 USED' : `HINT 1 (-${EVENT_CONFIG.hintPenaltyMinutes} MIN)`}
            </button>
            {hint1Used && <p className="lock-modal__hint-text">{lockData?.hint1 || 'No hint provided.'}</p>}
          </div>

          <div className="lock-modal__hint">
            <button
              type="button"
              className="btn btn--warning"
              disabled={hint2Used}
              onClick={() => setPendingHint(2)}
            >
              {hint2Used ? 'HINT 2 USED' : `HINT 2 (-${EVENT_CONFIG.hintPenaltyMinutes} MIN)`}
            </button>
            {hint2Used && <p className="lock-modal__hint-text">{lockData?.hint2 || 'No hint provided.'}</p>}
          </div>
        </div>
      </div>

      <ConfirmModal
        open={pendingHint !== null}
        title={`USE HINT ${pendingHint}?`}
        description={`This will deduct ${EVENT_CONFIG.hintPenaltyMinutes} minutes from your team's time. This cannot be undone.`}
        confirmLabel="USE HINT"
        onConfirm={confirmHint}
        onCancel={() => setPendingHint(null)}
      />
    </div>
  );
}
