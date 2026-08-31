export default function LockTile({ index, solved, disabled, disabledReason, onClick }) {
  const clickable = !solved && !disabled;

  return (
    <button
      type="button"
      className={`password-card lock-tile ${solved ? 'password-card--solved' : ''} ${
        clickable ? 'lock-tile--clickable' : ''
      }`}
      onClick={clickable ? onClick : undefined}
      disabled={!clickable}
    >
      <div className="password-card__header">
        <span className="password-card__number">LOCK {index}</span>
        <span className={`password-card__badge ${solved ? 'badge--success' : 'badge--locked'}`}>
          {solved ? 'UNLOCKED' : 'LOCKED'}
        </span>
      </div>

      <div className="lock-tile__body">
        {solved ? (
          <span className="status-text status-text--success">✓ SOLVED</span>
        ) : disabled ? (
          <span className="status-text status-text--muted">{disabledReason || 'LOCKED'}</span>
        ) : (
          <span className="lock-tile__hint-text">TAP TO OPEN</span>
        )}
      </div>
    </button>
  );
}
