import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
import CallControlModal from '../../components/voice/CallControlModal';
import DialpadModal from '../../components/voice/DialpadModal';
import Loader from '../../components/ui/Loader';
import ErrorMessage from '../../components/ui/ErrorMessage';

function VoicePage() {
  const dispatch = useAppDispatch();
  const logs = useAppSelector(selectCallLogs);
  const error = useAppSelector(selectVoiceError);
  const loadingLogs = useAppSelector((state) => state.voice.loadingLogs);
  const myNumbers = useAppSelector(selectMyNumbers);
  const [selectedPhoneNumber, setSelectedPhoneNumber] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const [callTimer, setCallTimer] = useState(null);
  const [dialpadOpen, setDialpadOpen] = useState(false);
  const [fromNumber, setFromNumber] = useState('');

  // WebRTC hook
  const {
    activeCall,
    callState,
    isMuted,
    makeCall,
    answerCall,
    hangupCall,
    sendDTMF,
    toggleMute,
    setCallState,
    setActiveCall,
    remoteAudioRef,
  } = useWebRTC();

  // WebSocket for real-time events
  const handleWebSocketMessage = useCallback((message) => {
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
      startCallTimer();
    } else if (message.type === 'CALL_ENDED' && activeCall?.callControlId === message.data.callControlId) {
      setCallState('idle');
      stopCallTimer();
      dispatch(fetchCallLogs()); // Refresh call logs
    }
  }, [activeCall, setCallState, setActiveCall, dispatch]);

  const { isConnected: wsConnected } = useWebSocket(handleWebSocketMessage);

  useEffect(() => {
    dispatch(fetchCallLogs());
    dispatch(fetchMyNumbers());
  }, [dispatch]);

  // Get user's phone numbers for identifying "Dialpad" number
  const userPhoneNumbers = useMemo(() => {
    return myNumbers
      .filter(num => num.phone_number_connection_id)
      .map(num => num.phone_number || num.phoneNumber)
      .filter(Boolean);
  }, [myNumbers]);

  // Extract unique phone numbers from call logs (the "other" party)
  const phoneNumberList = useMemo(() => {
    const numbers = new Set();
    logs.forEach(log => {
      // For outbound calls, "to" is the other party
      // For inbound calls, "from" is the other party
      const otherNumber = log.direction === 'outbound' ? log.to : log.from;
      if (otherNumber && !userPhoneNumbers.includes(otherNumber)) {
        numbers.add(otherNumber);
      }
    });
    return Array.from(numbers).sort();
  }, [logs, userPhoneNumbers]);

  // Get call logs for selected phone number
  const filteredLogs = useMemo(() => {
    if (!selectedPhoneNumber) return [];
    return logs
      .filter(log => {
        const otherNumber = log.direction === 'outbound' ? log.to : log.from;
        return otherNumber === selectedPhoneNumber;
      })
      .sort((a, b) => {
        const timeA = new Date(a.createdAt || a.created_at || 0).getTime();
        const timeB = new Date(b.createdAt || b.created_at || 0).getTime();
        return timeB - timeA; // Most recent first
      });
  }, [logs, selectedPhoneNumber]);

  // Auto-select first phone number if none selected
  useEffect(() => {
    if (!selectedPhoneNumber && phoneNumberList.length > 0) {
      setSelectedPhoneNumber(phoneNumberList[0]);
    }
  }, [phoneNumberList, selectedPhoneNumber]);

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

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    return mins === 1 ? '1 min' : `${mins} min`;
  };

  // Generate a simple hash from phone number for consistent mapping
  const hashPhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return 0;
    const cleaned = phoneNumber.replace(/\D/g, '');
    let hash = 0;
    for (let i = 0; i < cleaned.length; i++) {
      const char = cleaned.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  };

  // Generate meaningful initials from phone number
  const getInitials = (phoneNumber) => {
    if (!phoneNumber) return '??';
    
    const hash = hashPhoneNumber(phoneNumber);
    
    // Common first name initials
    const firstInitials = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
    
    // Common last name initials (slightly different distribution)
    const lastInitials = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'R', 'S', 'T', 'W', 'Y', 'Z'];
    
    // Use hash to pick consistent initials
    const firstIndex = hash % firstInitials.length;
    const secondIndex = (hash * 7) % lastInitials.length; // Different multiplier for variety
    
    return firstInitials[firstIndex] + lastInitials[secondIndex];
  };

  // Generate consistent background color from phone number
  const getAvatarColor = (phoneNumber) => {
    if (!phoneNumber) return '#64748b';
    
    const hash = hashPhoneNumber(phoneNumber);
    
    // Predefined palette of vibrant, readable colors
    const colorPalette = [
      '#3b82f6', // Blue
      '#8b5cf6', // Purple
      '#ec4899', // Pink
      '#f59e0b', // Orange
      '#10b981', // Green
      '#06b6d4', // Cyan
      '#ef4444', // Red
      '#6366f1', // Indigo
      '#14b8a6', // Teal
      '#f97316', // Orange-red
      '#84cc16', // Lime
      '#a855f7', // Purple
      '#0ea5e9', // Sky blue
      '#f43f5e', // Rose
      '#22c55e', // Green
      '#eab308', // Yellow
    ];
    
    // Use hash to pick a consistent color
    const colorIndex = hash % colorPalette.length;
    return colorPalette[colorIndex];
  };

  const getMyNumber = (log) => {
    // Determine which number is "ours" (Dialpad number)
    if (log.direction === 'outbound') {
      return log.from;
    } else {
      return log.to;
    }
  };

  const handleEndCall = async () => {
    if (activeCall) {
      try {
        await hangupCall(activeCall.callControlId);
        dispatch(fetchCallLogs()); // Refresh call logs
      } catch (err) {
        console.error('Failed to end call:', err);
      }
    }
  };

  const handleAcceptIncomingCall = async () => {
    if (!incomingCall) return;
    
    try {
      await answerCall(incomingCall.callControlId);
      setIncomingCall(null);
    } catch (err) {
      console.error('Failed to answer call:', err);
    }
  };

  const handleDeclineIncomingCall = async () => {
    if (!incomingCall) return;
    
    try {
      await hangupCall(incomingCall.callControlId);
      setIncomingCall(null);
      dispatch(fetchCallLogs());
    } catch (err) {
      console.error('Failed to decline call:', err);
    }
  };

  const handleCallClick = () => {
    if (selectedPhoneNumber) {
      setDialpadOpen(true);
    }
  };

  const handleDialpadCall = async (dial, from) => {
    try {
      await makeCall(from, dial);
      setDialpadOpen(false);
      dispatch(fetchCallLogs()); // Refresh to show new call
    } catch (err) {
      console.error('Failed to make call:', err);
    }
  };

  return (
    <section id="voiceSection" className="d-flex flex-column" style={{ height: '100%', margin: '-1rem', padding: '1rem' }}>
      {/* WebSocket connection indicator */}
      {!wsConnected && (
        <div className="alert alert-warning mb-2">
          <small>WebSocket disconnected. Real-time features may not work.</small>
        </div>
      )}

      {/* Remote Audio Element (hidden) */}
      <audio ref={remoteAudioRef} autoPlay />

      {/* Incoming Call Popup */}
      <IncomingCallPopup
        call={incomingCall}
        onAccept={handleAcceptIncomingCall}
        onDecline={handleDeclineIncomingCall}
      />

      {/* Call Control Modal - Shows during active calls */}
      <CallControlModal
        isOpen={callState === 'active'}
        callState={callState}
        activeCall={activeCall}
        callDuration={callDuration}
        isMuted={isMuted}
        onMute={toggleMute}
        onEndCall={handleEndCall}
        onSendDTMF={sendDTMF}
      />

      {/* Dialpad Modal */}
      <DialpadModal
        isOpen={dialpadOpen}
        onClose={() => setDialpadOpen(false)}
        onCall={handleDialpadCall}
        fromNumber={fromNumber}
        setFromNumber={setFromNumber}
        callState={callState}
        initialDial={selectedPhoneNumber || ''}
      />

      {/* Two Column Layout */}
      <div className="d-flex flex-grow-1" style={{ minHeight: 0 }}>
        {/* Left Sidebar - Phone Number List */}
        <div 
          className="bg-slate-800 border-end border-slate-700"
          style={{ width: '300px', minWidth: '300px', overflowY: 'auto' }}
        >
          <div className="p-3 border-bottom border-slate-700">
            <h5 className="text-white mb-0">Call History</h5>
          </div>
          
          {loadingLogs ? (
            <div className="p-3">
              <Loader label="Loading..." />
            </div>
          ) : phoneNumberList.length === 0 ? (
            <div className="p-3 text-slate-400 text-center">
              <small>No call history yet</small>
            </div>
          ) : (
            <div className="voice-history-list">
              {phoneNumberList.map((phoneNumber) => {
                const phoneLogs = logs.filter(log => {
                  const otherNumber = log.direction === 'outbound' ? log.to : log.from;
                  return otherNumber === phoneNumber;
                });
                const lastLog = phoneLogs[0]; // Most recent
                const initials = getInitials(phoneNumber);
                const avatarColor = getAvatarColor(phoneNumber);
                
                return (
                  <button
                    key={phoneNumber}
                    type="button"
                    className={`voice-history-item ${
                      selectedPhoneNumber === phoneNumber ? 'selected' : ''
                    }`}
                    onClick={() => setSelectedPhoneNumber(phoneNumber)}
                  >
                    <div className="d-flex align-items-center gap-3">
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                        style={{
                          width: '40px',
                          height: '40px',
                          backgroundColor: avatarColor,
                          fontSize: '0.875rem',
                        }}
                      >
                        {initials}
                      </div>
                      <div className="flex-grow-1 text-start">
                        <div className="fw-semibold">{phoneNumber}</div>
                        {lastLog && (
                          <div className="small text-slate-400">
                            {lastLog.direction === 'outbound' ? 'You called' : 'Called you'} • {formatTime(lastLog.createdAt || lastLog.created_at)}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Panel - Call Logs */}
        <div className="flex-grow-1 d-flex flex-column bg-slate-900" style={{ minWidth: 0 }}>
          {selectedPhoneNumber ? (
            <>
              {/* Top Bar */}
              <div className="bg-slate-800 border-bottom border-slate-700 px-4 py-3 d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-3">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                    style={{
                      width: '40px',
                      height: '40px',
                      backgroundColor: getAvatarColor(selectedPhoneNumber),
                      fontSize: '0.875rem',
                    }}
                  >
                    {getInitials(selectedPhoneNumber)}
                  </div>
                  <div>
                    <div className="text-white fw-semibold">{selectedPhoneNumber}</div>
                    <div className="text-slate-400 small">Other</div>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleCallClick}
                  disabled={callState !== 'idle'}
                >
                  Call
                </button>
              </div>

              {/* Call Logs */}
              <div className="flex-grow-1 overflow-auto px-4 py-3">
                {filteredLogs.length === 0 ? (
                  <div className="text-center text-slate-400 py-5">
                    <p>No calls with this number yet</p>
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {filteredLogs.map((log, index) => {
                      const myNum = getMyNumber(log);
                      const otherNum = log.direction === 'outbound' ? log.to : log.from;
                      const callTime = formatTime(log.createdAt || log.created_at);
                      const callDate = formatDate(log.createdAt || log.created_at);
                      const duration = formatDuration(log.durationSeconds);
                      const endTime = log.durationSeconds 
                        ? formatTime(new Date(new Date(log.createdAt || log.created_at).getTime() + (log.durationSeconds * 1000)))
                        : '';
                      const showDateHeader = index === 0 || 
                        formatDate(filteredLogs[index - 1]?.createdAt || filteredLogs[index - 1]?.created_at) !== callDate;

                      return (
                        <React.Fragment key={log._id}>
                          {showDateHeader && (
                            <div className="text-center text-slate-400 small my-2">
                              {callDate}
                            </div>
                          )}
                          <div className="d-flex gap-3">
                            <div
                              className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0"
                              style={{
                                width: '40px',
                                height: '40px',
                                backgroundColor: getAvatarColor(otherNum),
                                fontSize: '0.875rem',
                              }}
                            >
                              {getInitials(otherNum)}
                            </div>
                            <div className="flex-grow-1">
                              <div className="bg-slate-700 rounded p-3 mb-1">
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                  <div className="text-white small">{callTime}</div>
                                </div>
                                <div className="text-white mb-2">
                                  
                                  You {log.direction === 'outbound' ? 'called' : 'received call from'} {otherNum}
                                </div>
                                {duration && (
                                  <div className="text-slate-400 small">
                                    Lasted {duration} {endTime && `• Ended at ${endTime}`}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-grow-1 d-flex align-items-center justify-content-center">
              <div className="text-center text-slate-400">
                <p>Select a phone number to view call history</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <ErrorMessage message={error} />
    </section>
  );
}

export default VoicePage;
