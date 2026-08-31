export default function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = 'CONFIRM',
  cancelLabel = 'CANCEL',
  danger = true,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    // stopPropagation here matters when this is nested inside another
    // modal's own overlay (e.g. LockModal, TeamDetailModal) — without it, a
    // click on this modal's buttons bubbles up and triggers the parent
    // overlay's click-outside-to-close handler, closing both at once.
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
      <div className="modal-card">
        <h3 className="modal-card__title">{title}</h3>
        {description && <p className="modal-card__desc">{description}</p>}
        <div className="modal-card__actions">
          <button type="button" className="btn btn--ghost" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={danger ? 'btn btn--danger' : 'btn btn--primary'}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
