import { CircleAlert } from 'lucide-react';

export default function ConfirmActionModal({
  title,
  description,
  confirmLabel = '삭제',
  onCancel,
  onConfirm,
}) {
  return (
    <div
      className="action-confirm-backdrop"
      onMouseDown={event => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <section
        className="action-confirm-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="action-confirm-title"
        aria-describedby="action-confirm-description"
      >
        <span className="action-confirm-icon">
          <CircleAlert aria-hidden="true" />
        </span>
        <h2 id="action-confirm-title">{title}</h2>
        <p id="action-confirm-description">{description}</p>
        <footer>
          <button type="button" className="action-confirm-cancel" onClick={onCancel}>
            취소
          </button>
          <button type="button" className="action-confirm-submit" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </footer>
      </section>
    </div>
  );
}
