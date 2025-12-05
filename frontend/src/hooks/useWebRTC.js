import { useEffect, useRef, useState, useCallback } from 'react';
import { api } from '../services/apiClient';

// This hook manages WebRTC calls using Call Control v2 API
// For full WebRTC media, @telnyx/webrtc SDK should be integrated separately

export function useWebRTC() {
  const [activeCall, setActiveCall] = useState(null);
  const [callState, setCallState] = useState('idle'); // idle, ringing, active
  const [isMuted, setIsMuted] = useState(false);
  const remoteAudioRef = useRef(null);

  const makeCall = useCallback(async (from, to) => {
    try {
      const response = await api.initiateOutboundCall({ from, to });
      setActiveCall({
        callControlId: response.callControlId || response.rawTelnyxData?.call_control_id,
        from,
        to,
        callLogId: response._id,
      });
      setCallState('ringing');
      return response;
    } catch (err) {
      console.error('Error making call:', err);
      throw err;
    }
  }, []);

  const answerCall = useCallback(async (callControlId) => {
    try {
      await api.answerCall(callControlId);
      setCallState('active');
      // Connect to WebRTC if needed
      // await api.connectWebRTC(callControlId, '');
    } catch (err) {
      console.error('Error answering call:', err);
      throw err;
    }
  }, []);

  const connectWebRTC = useCallback(async (callControlId, clientState = '') => {
    try {
      await api.connectWebRTC(callControlId, clientState);
    } catch (err) {
      console.error('Error connecting WebRTC:', err);
      throw err;
    }
  }, []);

  const hangupCall = useCallback(async (callControlId) => {
    try {
      await api.hangupCall(callControlId);
      setActiveCall(null);
      setCallState('idle');
      setIsMuted(false);
    } catch (err) {
      console.error('Error hanging up call:', err);
      throw err;
    }
  }, []);

  const sendDTMF = useCallback(async (callControlId, digits) => {
    try {
      await api.sendDTMF(callControlId, digits);
    } catch (err) {
      console.error('Error sending DTMF:', err);
      throw err;
    }
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
    // TODO: Implement actual mute functionality with WebRTC SDK
  }, []);

  return {
    activeCall,
    callState,
    isMuted,
    makeCall,
    answerCall,
    connectWebRTC,
    hangupCall,
    sendDTMF,
    toggleMute,
    setActiveCall,
    setCallState,
    remoteAudioRef,
  };
}

