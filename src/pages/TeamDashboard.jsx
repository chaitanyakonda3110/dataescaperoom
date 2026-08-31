import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Timer from '../components/Timer';
import ProgressBar from '../components/ProgressBar';
import LockTile from '../components/LockTile';
import LockModal from '../components/LockModal';
import LoadingScreen from '../components/LoadingScreen';
import CongratulationsScreen from '../components/CongratulationsScreen';
import DisqualifiedScreen from '../components/DisqualifiedScreen';
import { subscribeToTeam, subscribeToGameState, setTeamDisqualified } from '../firebase/firestore';
import { computeTeamRemainingSeconds, deriveTeamDisplayStatus } from '../utils/timerMath';
import { solvedCount as countSolved, isTeamComplete } from '../utils/teamProgress';
import { useLockdown } from '../hooks/useLockdown';
import { EVENT_CONFIG } from '../config/eventConfig';
import { LOCKS } from '../config/locks';
import { useToast } from '../context/ToastContext';

export default function TeamDashboard() {
  const { teamId: rawTeamId } = useParams();
  const teamId = rawTeamId.trim().toUpperCase();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [team, setTeam] = useState(undefined); // undefined = loading, null = not found
  const [gameState, setGameState] = useState(null);
  const [frozenRemaining, setFrozenRemaining] = useState(null);
  const [openLockIndex, setOpenLockIndex] = useState(null);

  useEffect(() => {
    const unsubTeam = subscribeToTeam(teamId, setTeam);
    const unsubGame = subscribeToGameState(setGameState);
    return () => {
      unsubTeam();
      unsubGame();
    };
  }, [teamId]);

  const completed = team ? isTeamComplete(team) : false;
  const disqualified = !!team?.disqualified;
  const gameOver = completed || disqualified;
  const displayStatus = deriveTeamDisplayStatus(gameState, team);
  const remaining = computeTeamRemainingSeconds(gameState, team);

  // Locks can only be opened/submitted while the admin has the shared timer
  // actively RUNNING and THIS team's own effective time (shared timer minus
  // their own hint penalties) hasn't run out — not before it's started, not
  // while paused, not once their time is up, and never once the team has
  // finished or been disqualified.
  const canSubmit = !!team && !gameOver && displayStatus === 'RUNNING';

  // Freeze the displayed "time remaining" the moment a team's game ends
  // (finished or disqualified), so their own screen visually stops
  // counting down against them even though the shared event timer keeps
  // running for everyone else still playing.
  useEffect(() => {
    if (gameOver && frozenRemaining === null) {
      setFrozenRemaining(remaining);
    }
  }, [gameOver, frozenRemaining, remaining]);

  const handleViolation = useCallback(async () => {
    try {
      await setTeamDisqualified(teamId, true);
      showToast('You left the escape room screen — your team has been disqualified.', 'error');
    } catch (err) {
      // Best-effort — but log it. A silent failure here (e.g. a Firestore
      // rules rejection) means the whole anti-cheat feature does nothing
      // while looking like it's working, which is exactly the kind of bug
      // that's invisible until someone actually tests it live.
      console.error('Failed to record lockdown violation:', err);
    }
  }, [teamId, showToast]);

  useLockdown({
    active: canSubmit,
    onViolation: handleViolation,
  });

  // If submissions close while a lock's popup is open (time runs out, the
  // team gets disqualified, etc.) don't leave it open and answerable.
  useEffect(() => {
    if (!canSubmit && openLockIndex !== null) {
      setOpenLockIndex(null);
    }
  }, [canSubmit, openLockIndex]);

  if (team === undefined) {
    return <LoadingScreen message="Loading your team..." />;
  }

  if (team === null) {
    return (
      <div className="page page--center">
        <Navbar showAdminLink={false} />
        <div className="glass-card firebase-warning">
          <h2>TEAM NOT FOUND</h2>
          <p>We couldn't find a team with ID "{teamId}". Please register again.</p>
          <button type="button" className="btn btn--primary" onClick={() => navigate('/')}>
            BACK TO REGISTRATION
          </button>
        </div>
      </div>
    );
  }

  let statusBanner = null;
  let statusReason = null;
  if (displayStatus === 'TIME_UP') {
    statusBanner = "TIME'S UP — locks are now closed.";
    statusReason = "TIME'S UP";
  } else if (displayStatus === 'NOT_STARTED') {
    statusBanner = 'WAITING FOR THE ADMIN TO START THE TIMER — locks are closed until then.';
    statusReason = 'NOT STARTED';
  } else if (displayStatus === 'PAUSED') {
    statusBanner = 'TIMER PAUSED BY ADMIN — locks are closed.';
    statusReason = 'PAUSED';
  }

  const solved = countSolved(team);

  return (
    <div className="page">
      <Navbar showAdminLink={false} />
      <main className="dashboard">
        <h1 className="dashboard__title">{EVENT_CONFIG.eventName}</h1>
        <div className="dashboard__team-info">
          <span>
            TEAM: <strong>{team.teamName}</strong>
          </span>
          <span className="mono">
            TEAM ID: <strong>{team.teamId}</strong>
          </span>
        </div>

        {completed ? (
          <CongratulationsScreen
            teamName={team.teamName}
            timeRemaining={frozenRemaining ?? remaining}
          />
        ) : disqualified ? (
          <DisqualifiedScreen teamName={team.teamName} timeRemaining={frozenRemaining ?? remaining} />
        ) : (
          <>
            <Timer gameState={gameState} team={team} />
            <ProgressBar solvedCount={solved} total={EVENT_CONFIG.totalLocks} />

            {canSubmit && (
              <div className="lockdown-warning">
                STAY ON THIS SCREEN — switching tabs or windows will disqualify your team.
              </div>
            )}

            {statusBanner && <div className="time-up-banner">{statusBanner}</div>}

            <div className="password-grid">
              {Array.from({ length: EVENT_CONFIG.totalLocks }, (_, i) => i + 1).map((n) => (
                <LockTile
                  key={n}
                  index={n}
                  solved={team[`lock${n}Solved`]}
                  disabled={!canSubmit}
                  disabledReason={statusReason}
                  onClick={() => setOpenLockIndex(n)}
                />
              ))}
            </div>
          </>
        )}
      </main>

      {openLockIndex !== null && (
        <LockModal
          lockIndex={openLockIndex}
          lockData={LOCKS[`lock${openLockIndex}`]}
          team={team}
          teamId={teamId}
          onClose={() => setOpenLockIndex(null)}
        />
      )}
    </div>
  );
}
