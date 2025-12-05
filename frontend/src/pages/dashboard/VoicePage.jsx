import React, { useEffect, useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import {
  fetchCallLogs,
  selectCallLogs,
  selectVoiceError,
} from '../../features/voice/voiceSlice';
import {
  fetchMyNumbers,
  selectMyNumbers,
} from '../../features/numbers/numbersSlice';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useWebRTC } from '../../hooks/useWebRTC';
import IncomingCallPopup from '../../components/voice/IncomingCallPopup';
import Loader from '../../components/ui/Loader';
import ErrorMessage from '../../components/ui/ErrorMessage';

const dialDigits = ['1','2','3','4','5','6','7','8','9','*','0','#'];

function VoicePage() {
  const dispatch = useAppDispatch();
  const logs = useAppSelector(selectCallLogs);
  const error = useAppSelector(selectVoiceError);
  const loadingLogs = useAppSelector((state) => state.voice.loadingLogs);
  const myNumbers = useAppSelector(selectMyNumbers);
  const loadingMyNumbers = useAppSelector((state) => state.numbers.loadingMyNumbers);

  // Filter numbers to only show those with connection_id
  const numbersWithConnection = myNumbers.filter(
    (num) => num.phone_number_connection_id !== null && num.phone_number_connection_id !== undefined
  );

  const [dial, setDial] = useState('');
  const [fromNumber, setFromNumber] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [incomingCall, setIncomingCall] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const [callTimer, setCallTimer] = useState(null);

  // WebRTC hook
  const {
    activeCall,
    callState,
    isMuted,
    makeCall,
    answerCall,
    connectWebRTC,
    hangupCall,
    sendDTMF,
    toggleMute,
    setCallState,
    setActiveCall,
    remoteAudioRef,
  } = useWebRTC();

  // WebSocket for real-time events
  const handleWebSocketMessage = useCallback((message) => {
    console.log("web socket message: ", message);
    console.log("activeCall: ", activeCall);
    if (message.type === 'INBOUND_CALL') {
      setIncomingCall({
        callControlId: message.data.callControlId,
        from: message.data.from,
        to: message.data.to,
        callLogId: message.data.callLogId,
      });
      setActiveCall({
        callControlId: message.data.callControlId,
        from: message.data.from,
        to: message.data.to,
        callLogId: message.data.callLogId,
      });
    } else if (message.type === 'CALL_ANSWERED' && activeCall?.callControlId === message.data.callControlId) {
      setCallState('active');
      console.log("call answered message data: ", message.data);
      startCallTimer();
    } else if (message.type === 'CALL_ENDED' && activeCall?.callControlId === message.data.callControlId) {
      setCallState('idle');
      stopCallTimer();
    }
  }, [activeCall, setCallState]);

  const { isConnected: wsConnected } = useWebSocket(handleWebSocketMessage);

  useEffect(() => {
    dispatch(fetchCallLogs());
    dispatch(fetchMyNumbers());
  }, [dispatch]);

  // Call duration timer
  const startCallTimer = () => {
    setCallDuration(0);
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    setCallTimer(timer);
  };

  const stopCallTimer = () => {
    if (callTimer) {
      clearInterval(callTimer);
      setCallTimer(null);
    }
    setCallDuration(0);
  };

  useEffect(() => {
    if (callState === 'active' && !callTimer) {
      startCallTimer();
    } else if (callState !== 'active' && callTimer) {
      stopCallTimer();
    }
    return () => {
      if (callTimer) {
        clearInterval(callTimer);
      }
    };
  }, [callState]);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDigit = (d) => {
    if (callState === 'active' && activeCall) {
      // Send DTMF during active call
      sendDTMF(activeCall.callControlId, d);
    } else {
      // Add to dial string
      setDial((prev) => prev + d);
    }
  };

  const handleCall = async () => {
    if (!dial || !fromNumber) {
      setStatusMessage('Please enter the destination number and select your Telnyx number from the dropdown.');
      return;
    }
    if (callState !== 'idle') {
      setStatusMessage('A call is already in progress.');
      return;
    }
    
    setStatusMessage('');
    try {
      await makeCall(fromNumber, dial);
      setStatusMessage('Call initiated successfully.');
      setDial('');
    } catch (err) {
      setStatusMessage(err.message || 'Failed to initiate call.');
    }
  };

  const handleEndCall = async () => {
    console.log("activeCall: ", activeCall);
    if (activeCall) {
      try {
        await hangupCall(activeCall.callControlId);
        setStatusMessage('Call ended.');
        dispatch(fetchCallLogs()); // Refresh call logs
      } catch (err) {
        setStatusMessage(err.message || 'Failed to end call.');
      }
    }
  };

  const handleAcceptIncomingCall = async () => {
    if (!incomingCall) return;
    
    try {
      await answerCall(incomingCall.callControlId);
      // Optionally connect to WebRTC
      // await connectWebRTC(incomingCall.callControlId, '');
      setIncomingCall(null);
      setStatusMessage('Call answered.');
    } catch (err) {
      setStatusMessage(err.message || 'Failed to answer call.');
    }
  };

  const handleDeclineIncomingCall = async () => {
    if (!incomingCall) return;
    
    try {
      await hangupCall(incomingCall.callControlId);
      setIncomingCall(null);
      setStatusMessage('Call declined.');
      dispatch(fetchCallLogs());
    } catch (err) {
      setStatusMessage(err.message || 'Failed to decline call.');
    }
  };

  return (
    <section id="voiceSection">
      <h2 className="h5 mb-3">Voice Call</h2>
      
      {/* WebSocket connection indicator */}
      {!wsConnected && (
        <div className="alert alert-warning mb-3">
          <small>WebSocket disconnected. Real-time features may not work.</small>
        </div>
      )}

      {/* Incoming Call Popup */}
      <IncomingCallPopup
        call={incomingCall}
        onAccept={handleAcceptIncomingCall}
        onDecline={handleDeclineIncomingCall}
      />

      <div className="row g-4">
        <div className="col-md-4">
          <div className="card bg-slate-800">
            <div className="card-body">
              <h5 className="card-title text-white">Dialpad</h5>
              
              {/* Call Status */}
              {callState !== 'idle' && (
                <div className="mb-3 p-2 bg-dark rounded">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <small className="text-muted">Status:</small>
                      <span className="ms-2 badge bg-info">{callState}</span>
                    </div>
                    {callState === 'active' && (
                      <div>
                        <small className="text-muted">Duration:</small>
                        <span className="ms-2 text-white fw-bold">{formatDuration(callDuration)}</span>
                      </div>
                    )}
                  </div>
                  {activeCall && (
                    <div className="mt-2">
                      <small className="text-muted">To: </small>
                      <span className="text-white">{activeCall.to}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Remote Audio Element (hidden) */}
              <audio ref={remoteAudioRef} autoPlay />

              <div className="mb-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter number"
                  value={dial}
                  onChange={(e) => setDial(e.target.value)}
                  disabled={callState !== 'idle'}
                />
              </div>
              
              <div className="grid grid-cols-3 gap-2 mb-3">
                {dialDigits.map((d) => (
                  <button
                    key={d}
                    type="button"
                    className="btn btn-outline-light"
                    onClick={() => handleDigit(d)}
                    disabled={callState === 'ringing'}
                  >
                    {d}
                  </button>
                ))}
              </div>
              
              <div className="mb-3">
                <label className="form-label text-white">From Number</label>
                <select
                  className="form-select"
                  value={fromNumber}
                  onChange={(e) => setFromNumber(e.target.value)}
                  disabled={loadingMyNumbers || callState !== 'idle'}
                >
                  <option value="">Select your Telnyx number</option>
                  {numbersWithConnection.map((num) => {
                    const phoneNumber = num.phone_number || num.phoneNumber || '';
                    return (
                      <option key={num._id || phoneNumber} value={phoneNumber}>
                        {phoneNumber}
                      </option>
                    );
                  })}
                </select>
                {loadingMyNumbers && (
                  <small className="text-muted">Loading your numbers...</small>
                )}
                {!loadingMyNumbers && numbersWithConnection.length === 0 && (
                  <small className="text-warning">
                    No voice-enabled numbers available. Please enable voice call for a number first.
                  </small>
                )}
              </div>
              
              <div className="d-flex gap-2">
                {callState === 'idle' ? (
                  <button
                    type="button"
                    className="btn btn-success flex-fill"
                    onClick={handleCall}
                    disabled={!dial || !fromNumber}
                  >
                    Call
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      className={`btn ${isMuted ? 'btn-warning' : 'btn-outline-warning'} flex-fill`}
                      onClick={toggleMute}
                    >
                      {isMuted ? 'Unmute' : 'Mute'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger flex-fill"
                      onClick={handleEndCall}
                    >
                      End Call
                    </button>
                  </>
                )}
              </div>
              
              <p className="small mt-2 text-slate-300">{statusMessage}</p>
              <ErrorMessage message={error} />
            </div>
          </div>
        </div>
        
        <div className="col-md-8">
          <h5>Call Logs</h5>
          {loadingLogs && <Loader label="Loading call logs..." />}
          <div className="table-responsive">
            <table className="table table-dark table-striped" id="callLogsTable">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Status</th>
                  <th>Direction</th>
                  <th>Duration (s)</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-slate-400 small">
                      No calls found yet.
                    </td>
                  </tr>
                )}
                {logs.map((log) => (
                  <tr key={log._id}>
                    <td>{log.createdAt ? new Date(log.createdAt).toLocaleString() : ''}</td>
                    <td>{log.from}</td>
                    <td>{log.to}</td>
                    <td>{log.status}</td>
                    <td>{log.direction}</td>
                    <td>{log.durationSeconds ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

export default VoicePage;
