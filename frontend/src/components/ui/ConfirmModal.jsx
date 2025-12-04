import React from 'react';

function ConfirmModal({ show, title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', confirmButtonClass = 'btn-primary' }) {
  if (!show) return null;

  return (
    <div
      className="modal fade show"
      style={{ display: 'block', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      tabIndex="-1"
      role="dialog"
    >
      <div className="modal-dialog modal-dialog-centered" role="document">
        <div className="modal-content bg-slate-800 text-slate-100">
          <div className="modal-header border-secondary">
            <h5 className="modal-title">{title}</h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onCancel}
              aria-label="Close"
            />
          </div>
          <div className="modal-body">
            {typeof message === 'string' ? <p>{message}</p> : message}
          </div>
          <div className="modal-footer border-secondary">
            <button type="button" className="btn btn-outline-light" onClick={onCancel}>
              {cancelText}
            </button>
            <button type="button" className={`btn ${confirmButtonClass}`} onClick={onConfirm}>
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;

