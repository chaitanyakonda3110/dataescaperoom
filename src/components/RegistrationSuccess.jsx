export default function RegistrationSuccess({ teamId, teamName, onEnter }) {
  return (
    <div className="glass-card success-card">
      <div className="success-card__icon">✓</div>
      <h2 className="success-card__title">TEAM REGISTERED</h2>
      <p className="success-card__desc">Your team has been registered successfully.</p>

      <div className="success-card__team-name">{teamName}</div>

      <div className="success-card__team-id-label">TEAM ID</div>
      <div className="success-card__team-id">{teamId}</div>

      <button type="button" className="btn btn--primary btn--full" onClick={onEnter}>
        ENTER ESCAPE ROOM
      </button>
    </div>
  );
}
