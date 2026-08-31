import { useState } from 'react';
import { formatDateTime, formatTime } from '../utils/format';
import { EVENT_CONFIG } from '../config/eventConfig';
import { computeTeamRemainingSeconds } from '../utils/timerMath';
import { resetTeamProgress, deleteTeam, setTeamDisqualified } from '../firebase/firestore';
import { useToast } from '../context/ToastContext';
import ConfirmModal from './ConfirmModal';

const CONFIRM_COPY = {
  reset: {
    title: 'RESET TEAM PROGRESS?',
    description: 'This will reset all lock and hint states for this team, including any hint time penalties.',
    confirmLabel: 'RESET',
    busyLabel: 'RESETTING...',
  },
  disqualify: {
    title: 'DISQUALIFY TEAM?',
    description: 'This team will no longer be able to submit locks. You can reinstate them later.',
    confirmLabel: 'DISQUALIFY',
    busyLabel: 'DISQUALIFYING...',
  },
  reinstate: {
    title: 'REINSTATE TEAM?',
    description: 'This team will be able to submit locks again.',
    confirmLabel: 'REINSTATE',
    busyLabel: 'REINSTATING...',
    danger: false,
  },
  delete: {
    title: 'DELETE TEAM?',
    description: 'This permanently removes the team and all of its progress. This cannot be undone.',
    confirmLabel: 'DELETE',
    busyLabel: 'DELETING...',
  },
};

export default function TeamDetailModal({ team, gameState, onClose }) {
  const [pendingAction, setPendingAction] = useState(null); // 'reset' | 'disqualify' | 'reinstate' | 'delete' | null
  const [busy, setBusy] = useState(false);
  const { showToast } = useToast();

  if (!team) return null;

  const remainingSeconds = computeTeamRemainingSeconds(gameState, team);
  const penaltyMinutes = Math.round((team.hintPenaltySeconds ?? 0) / 60);

  async function handleConfirm() {
    setBusy(true);
    try {
      if (pendingAction === 'reset') {
        await resetTeamProgress(team.teamId);
        showToast(`${team.teamName}'s progress has been reset.`, 'success');
      } else if (pendingAction === 'disqualify') {
        await setTeamDisqualified(team.teamId, true);
        showToast(`${team.teamName} has been disqualified.`, 'success');
      } else if (pendingAction === 'reinstate') {
        await setTeamDisqualified(team.teamId, false);
        showToast(`${team.teamName} has been reinstated.`, 'success');
      } else if (pendingAction === 'delete') {
        await deleteTeam(team.teamId);
        showToast(`${team.teamName} has been deleted.`, 'success');
        onClose();
      }
      setPendingAction(null);
    } catch (err) {
      showToast(err.message || 'Action failed.', 'error');
    } finally {
      setBusy(false);
    }
  }

  const confirmCopy = pendingAction ? CONFIRM_COPY[pendingAction] : null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal-card modal-card--wide" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-card__close" onClick={onClose}>
          ×
        </button>

        <h3 className="modal-card__title">
          {team.teamName}
          {team.disqualified && <span className="status-pill status-pill--disqualified team-detail-badge">DISQUALIFIED</span>}
        </h3>
        <p className="mono modal-card__team-id">{team.teamId}</p>

        <div className="team-detail-grid">
          <div>
            <span className="field-label">MEMBER 1</span>
            <p>{team.member1}</p>
          </div>
          <div>
            <span className="field-label">MEMBER 2</span>
            <p>{team.member2}</p>
          </div>
          <div>
            <span className="field-label">MEMBER 3</span>
            <p>{team.member3}</p>
          </div>
          <div>
            <span className="field-label">REGISTRATION TIME</span>
            <p>{formatDateTime(team.registeredAt)}</p>
          </div>
        </div>

        <div className="team-detail-passwords">
          {Array.from({ length: EVENT_CONFIG.totalLocks }, (_, i) => i + 1).map((n) => {
            const solved = team[`lock${n}Solved`];
            const hint1 = team[`lock${n}Hint1Used`];
            const hint2 = team[`lock${n}Hint2Used`];
            return (
              <div key={n} className="team-detail-passwords__row">
                <span>LOCK {n}</span>
                <span className="team-detail-passwords__meta">
                  {(hint1 || hint2) && (
                    <span className="status-text status-text--muted">
                      {hint1 && hint2 ? 'HINTS 1 & 2 USED' : hint1 ? 'HINT 1 USED' : 'HINT 2 USED'}
                    </span>
                  )}
                  <span className={solved ? 'status-text status-text--success' : 'status-text status-text--muted'}>
                    {solved ? 'UNLOCKED' : 'LOCKED'}
                  </span>
                </span>
              </div>
            );
          })}
        </div>

        <div className="team-detail-time">
          TIME REMAINING: <strong>{formatTime(remainingSeconds)}</strong>
          {penaltyMinutes > 0 && <span className="team-detail-time__penalty"> (−{penaltyMinutes} min from hints)</span>}
        </div>

        <div className="team-detail-actions">
          <button
            type="button"
            className="btn btn--ghost btn--full"
            onClick={() => setPendingAction('reset')}
          >
            RESET TEAM PROGRESS
          </button>
          <button
            type="button"
            className="btn btn--warning btn--full"
            onClick={() => setPendingAction(team.disqualified ? 'reinstate' : 'disqualify')}
          >
            {team.disqualified ? 'REINSTATE TEAM' : 'DISQUALIFY TEAM'}
          </button>
          <button
            type="button"
            className="btn btn--danger btn--full"
            onClick={() => setPendingAction('delete')}
          >
            DELETE TEAM
          </button>
        </div>
      </div>

      <ConfirmModal
        open={!!pendingAction}
        title={confirmCopy?.title}
        description={confirmCopy?.description}
        confirmLabel={busy ? confirmCopy?.busyLabel : confirmCopy?.confirmLabel}
        danger={confirmCopy?.danger ?? true}
        onConfirm={handleConfirm}
        onCancel={() => setPendingAction(null)}
      />
    </div>
  );
}
