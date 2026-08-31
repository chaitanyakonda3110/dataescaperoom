import { formatTime } from '../utils/format';

export default function DisqualifiedScreen({ teamName, timeRemaining }) {
  return (
    <div className="glass-card success-card disqualified-card">
      <div className="success-card__icon disqualified-card__icon">✕</div>
      <h2 className="success-card__title disqualified-card__title">TEAM DISQUALIFIED</h2>
      <p className="success-card__desc">
        <strong>{teamName}</strong>, your team has been disqualified. Password submissions are closed.
      </p>
      <div className="success-card__team-id-label">TIME REMAINING WHEN DISQUALIFIED</div>
      <div className="success-card__team-id disqualified-card__time">{formatTime(timeRemaining)}</div>
    </div>
  );
}
