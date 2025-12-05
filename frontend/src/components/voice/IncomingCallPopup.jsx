import React from 'react';

function IncomingCallPopup({ call, onAccept, onDecline }) {
  if (!call) return null;

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        zIndex: 9999,
      }}
    >
      <div className="card bg-dark" style={{ minWidth: '300px', maxWidth: '400px' }}>
        <div className="card-body text-center p-4">
          <div className="mb-3">
            <i className="bi bi-telephone-fill text-primary" style={{ fontSize: '3rem' }}></i>
          </div>
          <h5 className="card-title text-white mb-2">Incoming Call</h5>
          <p className="text-white-50 mb-4">{call.from || 'Unknown'}</p>
          <div className="d-flex gap-2 justify-content-center">
            <button
              type="button"
              className="btn btn-success btn-lg"
              onClick={onAccept}
              style={{ minWidth: '100px' }}
            >
              <i className="bi bi-telephone-fill me-2"></i>
              Accept
            </button>
            <button
              type="button"
              className="btn btn-danger btn-lg"
              onClick={onDecline}
              style={{ minWidth: '100px' }}
            >
              <i className="bi bi-telephone-x-fill me-2"></i>
              Decline
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default IncomingCallPopup;

