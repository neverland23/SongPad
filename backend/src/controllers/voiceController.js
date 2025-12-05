const telnyxClient = require('../config/telnyxClient');
const CallLog = require('../models/CallLog');
const Notification = require('../models/Notification');
const PhoneNumber = require('../models/PhoneNumber');

// Call Control v2: Initiate outbound call
const initiateOutboundCall = async (req, res) => {
  const { from, to } = req.body;

  if (!from || !to) {
    return res.status(400).json({ message: 'from and to are required' });
  }

  try {
    // Find the phone number to get connection_id
    const phoneNumber = await PhoneNumber.findOne({ 
      phoneNumber: from,
      user: req.user._id 
    });

    if (!phoneNumber) {
      return res.status(404).json({ message: 'Phone number not found' });
    }

    // Get connection_id from phone number resource
    const phoneNumbersResponse = await telnyxClient.get('/phone_numbers', {
      params: {
        'filter[phone_number]': from,
      },
    });

    const phoneNumbers = phoneNumbersResponse.data?.data || [];
    if (phoneNumbers.length === 0) {
      return res.status(404).json({ message: 'Phone number not found in Telnyx' });
    }

    const connectionId = phoneNumbers[0].connection_id;
    if (!connectionId) {
      return res.status(400).json({ message: 'Phone number is not connected. Please enable voice call first.' });
    }

    // Create outbound call using Call Control v2
    const payload = {
      connection_id: connectionId,
      to,
      from,
      webhook_url: `${process.env.BACKEND_URL || 'http://localhost:3000'}/webhooks/voice`,
      webhook_url_method: 'POST',
    };

    const response = await telnyxClient.post('/calls', payload);
    const callData = response.data?.data || response.data;

    const log = await CallLog.create({
      user: req.user._id,
      from,
      to,
      status: 'initiated',
      direction: 'outbound',
      callControlId: callData.call_control_id,
      telnyxCallLegId: callData.call_leg_id,
      rawTelnyxData: callData,
    });

    await Notification.create({
      user: req.user._id,
      type: 'call',
      title: 'Outbound call started',
      message: `Call to ${to} started`,
      data: { from, to, callControlId: callData.call_control_id },
    });

    res.status(201).json(log);
  } catch (err) {
    console.error('Telnyx call create error', err.response?.data || err.message);
    res.status(500).json({ message: 'Error initiating call with Telnyx' });
  }
};

// Legacy endpoint (keep for backward compatibility)
const initiateCall = initiateOutboundCall;

const listCallLogs = async (req, res) => {
  const logs = await CallLog.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(100);
  res.json(logs);
};

// Webhook handler for Telnyx Call Control v2 events
const voiceWebhookHandler = async (req, res) => {
  try {
    const event = req.body;
    
    // Telnyx Call Control v2 webhook structure
    const eventType = event?.data?.event_type;
    const payload = event?.data?.payload || event?.data;

    if (!payload) {
      return res.status(200).json({ received: true });
    }

    const callControlId = payload.call_control_id;
    const from = payload.from || payload.caller_id_number || payload.from_number;
    const to = payload.to || payload.callee_id_number || payload.to_number;
    
    // Normalize direction: Telnyx may send 'incoming', but our model expects 'inbound'
    let direction = payload.direction || (payload.call_session_id ? 'inbound' : 'outbound');
    if (direction === 'incoming') {
      direction = 'inbound';
    }
    // Ensure direction is either 'inbound' or 'outbound'
    if (direction !== 'inbound' && direction !== 'outbound') {
      direction = payload.call_session_id ? 'inbound' : 'outbound';
    }

    // Find or create call log
    let log = await CallLog.findOne({ 
      $or: [
        { callControlId },
        { telnyxCallLegId: callControlId }
      ]
    });

    // Handle different event types
    if (eventType === 'call.initiated' || eventType === 'call.call-initiated') {
      if (!log) {
        // Try to find user by phone number
        let userId = null;
        if (direction === 'inbound') {
          const phoneNumber = await PhoneNumber.findOne({ phoneNumber: to });
          userId = phoneNumber?.user || null;
        } else {
          userId = req.user?._id || null;
        }

        log = await CallLog.create({
          user: userId,
          from,
          to,
          status: 'initiated',
          direction,
          callControlId,
          telnyxCallLegId: payload.call_leg_id || callControlId,
          rawTelnyxData: payload,
        });

        // Broadcast inbound call event via WebSocket
        if (direction === 'inbound' && userId && global.wsServer) {
          global.wsServer.sendToUser(userId.toString(), {
            type: 'INBOUND_CALL',
            data: {
              callControlId,
              from,
              to,
              callLogId: log._id.toString(),
            },
          });
        }
      }
    } else if (eventType === 'call.ringing' || eventType === 'call.call-ringing') {
      if (log) {
        log.status = 'ringing';
        await log.save();
      }
      
      // Broadcast call ringing event
      if (log?.user && global.wsServer) {
        global.wsServer.sendToUser(log.user.toString(), {
          type: 'CALL_RINGING',
          data: { callControlId, from, to },
        });
      }
    } else if (eventType === 'call.answered' || eventType === 'call.call-answered') {
      if (log) {
        log.status = 'answered';
        await log.save();
      }

      // Broadcast call answered event
      if (log?.user && global.wsServer) {
        global.wsServer.sendToUser(log.user.toString(), {
          type: 'CALL_ANSWERED',
          data: { callControlId, from, to },
        });
      }
    } else if (eventType === 'call.hangup' || eventType === 'call.call-hangup') {
      if (log) {
        log.status = 'completed';
        if (payload.duration_secs) {
          log.durationSeconds = payload.duration_secs;
        }
        await log.save();
      }
      
      // Broadcast call ended event
      if (log?.user && global.wsServer) {
        global.wsServer.sendToUser(log.user.toString(), {
          type: 'CALL_ENDED',
          data: { callControlId, from, to },
        });
      }
    } else if (eventType === 'call.failed' || eventType === 'call.call-failed') {
      if (log) {
        log.status = 'failed';
        await log.save();
      }
    }

    // Update raw data
    if (log) {
      log.rawTelnyxData = payload;
      await log.save();
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('Voice webhook error', err.message);
    res.status(200).json({ received: true });
  }
};

// Call Control v2: Answer inbound call
const answerCall = async (req, res) => {
  const { callControlId } = req.params;

  if (!callControlId) {
    return res.status(400).json({ message: 'callControlId is required' });
  }

  try {
    await telnyxClient.post(`/calls/${callControlId}/actions/answer`);
    res.json({ message: 'Call answered successfully' });
  } catch (err) {
    console.error('Answer call error', err.response?.data || err.message);
    res.status(500).json({ message: 'Error answering call' });
  }
};

// Call Control v2: Connect call to WebRTC
const connectWebRTC = async (req, res) => {
  const { callControlId } = req.params;
  const { client_state } = req.body;

  if (!callControlId) {
    return res.status(400).json({ message: 'callControlId is required' });
  }

  try {
    const payload = {
      type: 'connect_webrtc',
      client_state: client_state || '',
    };

    await telnyxClient.post(`/calls/${callControlId}/actions`, payload);
    res.json({ message: 'Call connected to WebRTC successfully' });
  } catch (err) {
    console.error('Connect WebRTC error', err.response?.data || err.message);
    res.status(500).json({ message: 'Error connecting call to WebRTC' });
  }
};

// Call Control v2: Hangup call
const hangupCall = async (req, res) => {
  const { callControlId } = req.params;

  if (!callControlId) {
    return res.status(400).json({ message: 'callControlId is required' });
  }

  try {
    await telnyxClient.post(`/calls/${callControlId}/actions/hangup`);
    
    // Update call log
    const log = await CallLog.findOne({ callControlId });
    if (log) {
      log.status = 'completed';
      await log.save();
    }
    
    res.json({ message: 'Call hung up successfully' });
  } catch (err) {
    console.error('Hangup call error', err.response?.data || err.message);
    res.status(500).json({ message: 'Error hanging up call' });
  }
};

// Call Control v2: Send DTMF
const sendDTMF = async (req, res) => {
  const { callControlId } = req.params;
  const { digits } = req.body;

  if (!callControlId || !digits) {
    return res.status(400).json({ message: 'callControlId and digits are required' });
  }

  try {
    const payload = {
      type: 'send_dtmf',
      digits,
    };

    await telnyxClient.post(`/calls/${callControlId}/actions`, payload);
    res.json({ message: 'DTMF sent successfully' });
  } catch (err) {
    console.error('Send DTMF error', err.response?.data || err.message);
    res.status(500).json({ message: 'Error sending DTMF' });
  }
};

module.exports = {
  initiateCall,
  initiateOutboundCall,
  listCallLogs,
  voiceWebhookHandler,
  answerCall,
  connectWebRTC,
  hangupCall,
  sendDTMF,
};
