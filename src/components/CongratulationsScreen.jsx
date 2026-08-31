import { formatTime } from '../utils/format';

export default function CongratulationsScreen({ teamName, timeRemaining }) {
  return (
    <div className="glass-card success-card congrats-card">
      <div className="success-card__icon congrats-card__icon">🏆</div>
      <h2 className="success-card__title">ESCAPE COMPLETE!</h2>
      <p className="success-card__desc">
        Congratulations, <strong>{teamName}</strong> — your team unlocked all 5 passwords!
      </p>
      <div className="success-card__team-id-label">TIME REMAINING WHEN YOU FINISHED</div>
      <div className="success-card__team-id">{formatTime(timeRemaining)}</div>
    </div>
  );
}
