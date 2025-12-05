import React from 'react';

function CallControlModal({ isOpen, callState, activeCall, callDuration, isMuted, onMute, onEndCall, onSendDTMF }) {
  const dialDigits = ['1','2','3','4','5','6','7','8','9','*','0','#'];

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen || callState !== 'active') return null;

  const handleDigit = (d) => {
    if (activeCall && onSendDTMF) {
      onSendDTMF(activeCall.callControlId, d);
    }
  };

  return (
    <div
      className="position-fixed"
      style={{
        bottom: '20px',
        right: 'calc((100% - 300px) / 2)',
        zIndex: 1060,
        minWidth: '300px',
        maxWidth: '400px',
      }}
    >
      <div className="card bg-slate-800 shadow-lg">
        <div className="card-body">
          <div className="mb-3 text-center">
            <h6 className="text-white mb-2">On a call</h6>
            <div className="mb-2">
              <span className="text-white fw-bold">{activeCall?.to || 'Unknown'}</span>
            </div>
            <div className="mb-3">
              <span className="text-slate-300">{formatDuration(callDuration)}</span>
            </div>
          </div>

          {/* DTMF Keypad */}
          <div className="d-grid gap-2 mb-3" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {dialDigits.map((d) => (
              <button
                key={d}
                type="button"
                className="btn btn-outline-light"
                onClick={() => handleDigit(d)}
              >
                {d}
              </button>
            ))}
          </div>

          {/* Control Buttons */}
          <div className="d-flex gap-2">
            <button
              type="button"
              className={`btn flex-fill ${isMuted ? 'btn-warning' : 'btn-outline-warning'}`}
              onClick={onMute}
            >
              {isMuted ? 'Unmute' : 'Mute'}
            </button>
            <button
              type="button"
              className="btn btn-danger flex-fill"
              onClick={onEndCall}
            >
              End Call
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CallControlModal;

