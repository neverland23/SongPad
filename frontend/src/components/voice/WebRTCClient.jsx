import React, { useEffect, useRef, useState } from 'react';
import { api } from '../../services/apiClient';

// Note: @telnyx/webrtc needs to be installed
// For now, we'll create a placeholder that can be enhanced with the actual SDK
let TelnyxRTC = null;
try {
  // This will be available after installing @telnyx/webrtc
  // TelnyxRTC = require('@telnyx/webrtc');
} catch (err) {
  console.warn('@telnyx/webrtc not installed. WebRTC features will be limited.');
}

function WebRTCClient({ username, password, onCallUpdate, onIncomingCall }) {
  const clientRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentCall, setCurrentCall] = useState(null);
  const [callState, setCallState] = useState('idle'); // idle, ringing, active
  const remoteAudioRef = useRef(null);

  useEffect(() => {
    if (!username || !password) {
      console.warn('WebRTC credentials not provided');
      return;
    }

    // Initialize Telnyx WebRTC client
    // This is a placeholder - actual implementation requires @telnyx/webrtc package
    if (TelnyxRTC) {
      const client = new TelnyxRTC.Client({
        login: username,
        password: password,
      });

      client.on('telnyx.ready', () => {
        console.log('Telnyx WebRTC client ready');
        setIsConnected(true);
      });

      client.on('telnyx.error', (error) => {
        console.error('Telnyx WebRTC error:', error);
        setIsConnected(false);
      });

      client.on('telnyx.socket.close', () => {
        console.log('Telnyx WebRTC socket closed');
        setIsConnected(false);
      });

      client.on('callUpdate', (call) => {
        console.log('Call update:', call);
        setCurrentCall(call);
        
        if (call.state === 'ringing') {
          setCallState('ringing');
          if (call.direction === 'inbound' && onIncomingCall) {
            onIncomingCall(call);
          }
        } else if (call.state === 'active') {
          setCallState('active');
          // Bind remote audio
          if (remoteAudioRef.current && call.remoteStream) {
            remoteAudioRef.current.srcObject = call.remoteStream;
          }
        } else if (call.state === 'hangup' || call.state === 'destroy') {
          setCallState('idle');
          setCurrentCall(null);
          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = null;
          }
        }

        if (onCallUpdate) {
          onCallUpdate(call);
        }
      });

      clientRef.current = client;
      client.connect();

      return () => {
        if (clientRef.current) {
          clientRef.current.disconnect();
        }
      };
    }
  }, [username, password, onCallUpdate, onIncomingCall]);

  const makeCall = async (destination) => {
    if (!clientRef.current || !isConnected) {
      throw new Error('WebRTC client not connected');
    }

    try {
      const call = clientRef.current.newCall({
        callerNumber: destination.from,
        destinationNumber: destination.to,
      });

      setCurrentCall(call);
      setCallState('ringing');
      return call;
    } catch (err) {
      console.error('Error making call:', err);
      throw err;
    }
  };

  const answerCall = () => {
    if (currentCall && callState === 'ringing') {
      currentCall.answer();
    }
  };

  const hangupCall = () => {
    if (currentCall) {
      currentCall.hangup();
      setCurrentCall(null);
      setCallState('idle');
    }
  };

  const sendDTMF = (digits) => {
    if (currentCall && callState === 'active') {
      currentCall.dtmf(digits);
    }
  };

  return {
    isConnected,
    currentCall,
    callState,
    makeCall,
    answerCall,
    hangupCall,
    sendDTMF,
    remoteAudioRef,
  };
}

export default WebRTCClient;

