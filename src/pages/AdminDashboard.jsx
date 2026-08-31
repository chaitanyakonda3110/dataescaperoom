import { useEffect, useRef, useState } from 'react';
import {
  subscribeToAllTeams,
  subscribeToGameState,
  ensureGameStateExists,
  resetAllTeamsProgress,
  finishGameNow,
} from '../firebase/firestore';
import { adminSignOut } from '../firebase/auth';
import { deriveDisplayStatus } from '../utils/timerMath';
import { isTeamComplete } from '../utils/teamProgress';
import { getTeamStatus } from '../utils/teamStatus';
import { EVENT_CONFIG } from '../config/eventConfig';
import AdminStats from '../components/AdminStats';
import AdminTimerControl from '../components/AdminTimerControl';
import Timer from '../components/Timer';
import AdminLeaderboard from '../components/AdminLeaderboard';
import AdminTeamTable from '../components/AdminTeamTable';
import TeamDetailModal from '../components/TeamDetailModal';
import ResultsModal from '../components/ResultsModal';
import ConfirmModal from '../components/ConfirmModal';
import LoadingScreen from '../components/LoadingScreen';
import { useToast } from '../context/ToastContext';

export default function AdminDashboard() {
  const [teams, setTeams] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [resetAllOpen, setResetAllOpen] = useState(false);
  const [resettingAll, setResettingAll] = useState(false);
  const [resultsModal, setResultsModal] = useState(null); // 'announce' | 'podium' | null
  const { showToast } = useToast();
  const knownCompletedIds = useRef(null); // null = not yet initialized
  const wasTimeUp = useRef(false);
  const autoFinished = useRef(false);

  useEffect(() => {
    ensureGameStateExists();
    const unsubTeams = subscribeToAllTeams(setTeams);
    const unsubGame = subscribeToGameState(setGameState);
    return () => {
      unsubTeams();
      unsubGame();
    };
  }, []);

  // Toast the admin the moment a team crosses all locks — but only for
  // teams that *become* complete after the dashboard is open, not ones
  // already finished when it loads (that first snapshot just sets the
  // baseline).
  useEffect(() => {
    if (teams === null) return;
    const currentlyCompleted = new Set(teams.filter(isTeamComplete).map((t) => t.teamId));
    if (knownCompletedIds.current === null) {
      knownCompletedIds.current = currentlyCompleted;
      return;
    }
    currentlyCompleted.forEach((teamId) => {
      if (!knownCompletedIds.current.has(teamId)) {
        const team = teams.find((t) => t.teamId === teamId);
        showToast(
          `🎉 ${team?.teamName ?? teamId} has completed all ${EVENT_CONFIG.totalLocks} locks!`,
          'success',
          7000
        );
      }
    });
    knownCompletedIds.current = currentlyCompleted;
  }, [teams, showToast]);

  // Pop the "TIME'S UP" announcement once, the moment the shared timer
  // crosses into TIME_UP — not on every render, and not again on a later
  // refresh of an already-expired timer.
  useEffect(() => {
    const isTimeUp = deriveDisplayStatus(gameState) === 'TIME_UP';
    if (isTimeUp && !wasTimeUp.current) {
      setResultsModal('announce');
    }
    wasTimeUp.current = isTimeUp;
  }, [gameState]);

  // If every registered team has already reached a terminal state (time up,
  // disqualified, or completed) while the event is still RUNNING, there's
  // no one left who could still submit a Lock — end it automatically so the
  // results popup appears without the admin needing to notice and hit
  // FINISH GAME manually. Re-arms whenever the timer is reset for a fresh
  // round (NOT_STARTED), so this can fire again next time.
  useEffect(() => {
    if (!gameState) return;
    if (gameState.status === 'NOT_STARTED') {
      autoFinished.current = false;
      return;
    }
    if (gameState.status !== 'RUNNING' || teams === null || teams.length === 0) return;

    const allTeamsDone = teams.every((team) => getTeamStatus(team, gameState) !== 'ACTIVE');
    if (allTeamsDone && !autoFinished.current) {
      autoFinished.current = true;
      finishGameNow().catch(() => {
        autoFinished.current = false; // allow a retry on the next snapshot if this write failed
      });
    }
  }, [teams, gameState]);

  if (teams === null) {
    return <LoadingScreen message="Loading admin control center..." />;
  }

  const liveSelectedTeam = selectedTeam
    ? teams.find((t) => t.teamId === selectedTeam.teamId) ?? null
    : null;

  async function handleResetAll() {
    setResettingAll(true);
    try {
      await resetAllTeamsProgress(teams);
      showToast('All teams have been reset.', 'success');
      setResetAllOpen(false);
    } catch (err) {
      showToast(err.message || 'Reset failed.', 'error');
    } finally {
      setResettingAll(false);
    }
  }

  return (
    <div className="page">
      <header className="admin-header">
        <div>
          <h1 className="admin-header__title">{EVENT_CONFIG.eventName}</h1>
          <p className="admin-header__subtitle">ADMIN CONTROL CENTER</p>
        </div>
        <button type="button" className="btn btn--ghost" onClick={() => adminSignOut()}>
          SIGN OUT
        </button>
      </header>

      <main className="admin-main">
        <AdminStats teams={teams} timerStatus={deriveDisplayStatus(gameState)} />

        <AdminTimerControl gameState={gameState} />

        <Timer gameState={gameState} />

        <AdminLeaderboard
          teams={teams}
          gameState={gameState}
          onViewResults={() => setResultsModal('podium')}
        />

        <div className="admin-panel">
          <div className="admin-panel__header">
            <h3 className="admin-panel__title">TEAMS</h3>
            <button
              type="button"
              className="btn btn--danger"
              disabled={teams.length === 0}
              onClick={() => setResetAllOpen(true)}
            >
              RESET ALL TEAMS
            </button>
          </div>
          <AdminTeamTable teams={teams} gameState={gameState} onSelectTeam={setSelectedTeam} />
        </div>
      </main>

      <TeamDetailModal
        team={liveSelectedTeam}
        gameState={gameState}
        onClose={() => setSelectedTeam(null)}
      />

      <ResultsModal
        open={resultsModal !== null}
        initialPhase={resultsModal ?? 'podium'}
        teams={teams}
        onClose={() => setResultsModal(null)}
      />

      <ConfirmModal
        open={resetAllOpen}
        title="RESET ALL TEAMS?"
        description={`This will reset lock progress for all ${teams.length} registered teams. This cannot be undone.`}
        confirmLabel={resettingAll ? 'RESETTING...' : 'RESET ALL'}
        onConfirm={handleResetAll}
        onCancel={() => setResetAllOpen(false)}
      />
    </div>
  );
}
