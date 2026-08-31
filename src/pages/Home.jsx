import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import TeamRegistration from '../components/TeamRegistration';
import RegistrationSuccess from '../components/RegistrationSuccess';
import LoadingScreen from '../components/LoadingScreen';
import { EVENT_CONFIG } from '../config/eventConfig';
import { getTeam } from '../firebase/firestore';
import { isFirebaseConfigured } from '../firebase/config';

const STORAGE_KEY = 'der_team_id';

export default function Home() {
  const navigate = useNavigate();
  const [checkingSession, setCheckingSession] = useState(true);
  const [returningTeam, setReturningTeam] = useState(null);
  const [justRegistered, setJustRegistered] = useState(null);

  useEffect(() => {
    const storedTeamId = localStorage.getItem(STORAGE_KEY);
    if (!storedTeamId || !isFirebaseConfigured) {
      setCheckingSession(false);
      return;
    }
    getTeam(storedTeamId)
      .then((team) => {
        if (team) setReturningTeam(team);
      })
      .finally(() => setCheckingSession(false));
  }, []);

  function handleRegistered({ teamId, teamName }) {
    localStorage.setItem(STORAGE_KEY, teamId);
    setJustRegistered({ teamId, teamName });
  }

  function enterRoom(teamId) {
    localStorage.setItem(STORAGE_KEY, teamId);
    navigate(`/team/${teamId}`);
  }

  if (!isFirebaseConfigured) {
    return (
      <div className="page page--center">
        <Navbar showAdminLink={false} />
        <div className="glass-card firebase-warning">
          <h2>FIREBASE NOT CONFIGURED</h2>
          <p>
            This app cannot connect to a backend yet. Open{' '}
            <code>src/firebase/config.js</code> and replace the placeholder values with your
            Firebase project credentials.
          </p>
        </div>
      </div>
    );
  }

  if (checkingSession) {
    return <LoadingScreen message="Loading Data Escape Room..." />;
  }

  return (
    <div className="page">
      <Navbar />
      <main className="hero">
        <div className="hero__badges">
          <span>{EVENT_CONFIG.organization1}</span>
          <span>{EVENT_CONFIG.organization2}</span>
        </div>
        <h1 className="hero__title">{EVENT_CONFIG.eventName}</h1>
        <p className="hero__tagline">{EVENT_CONFIG.tagline}</p>
        <p className="hero__date">{EVENT_CONFIG.eventDate}</p>

        {justRegistered ? (
          <RegistrationSuccess
            teamId={justRegistered.teamId}
            teamName={justRegistered.teamName}
            onEnter={() => enterRoom(justRegistered.teamId)}
          />
        ) : returningTeam ? (
          <div className="glass-card success-card">
            <h2 className="success-card__title">WELCOME BACK</h2>
            <p className="success-card__desc">
              You're already registered as <strong>{returningTeam.teamName}</strong>.
            </p>
            <div className="success-card__team-id-label">TEAM ID</div>
            <div className="success-card__team-id">{returningTeam.teamId}</div>
            <button
              type="button"
              className="btn btn--primary btn--full"
              onClick={() => enterRoom(returningTeam.teamId)}
            >
              ENTER ESCAPE ROOM
            </button>
          </div>
        ) : (
          <TeamRegistration onRegistered={handleRegistered} />
        )}
      </main>
    </div>
  );
}
