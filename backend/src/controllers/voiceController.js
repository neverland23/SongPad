const telnyxClient = require('../config/telnyxClient');
const CallLog = require('../models/CallLog');
const Notification = require('../models/Notification');

const initiateCall = async (req, res) => {
  const { from, to } = req.body;

  if (!from || !to) {
    return res.status(400).json({ message: 'from and to are required' });
  }

  try {
    const payload = {
      connection_id: process.env.TELNYX_CONNECTION_ID,
      to,
      from,
      timeout_secs: 30,
    };

    const response = await telnyxClient.post('/calls', payload);

    const callData = response.data && response.data.data ? response.data.data : response.data;

    const log = await CallLog.create({
      user: req.user._id,
      from,
      to,
      status: callData.status || 'initiated',
      direction: 'outbound',
      telnyxCallLegId: callData.call_leg_id,
      rawTelnyxData: callData,
    });

    await Notification.create({
      user: req.user._id,
      type: 'call',
      title: 'Outbound call started',
      message: `Call to ${to} started`,
      data: { from, to },
    });

    res.status(201).json(log);
  } catch (err) {
    console.error('Telnyx call create error', err.response?.data || err.message);
    res.status(500).json({ message: 'Error initiating call with Telnyx' });
  }
};

const listCallLogs = async (req, res) => {
  const logs = await CallLog.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(100);
  res.json(logs);
};

// Webhook handler for Telnyx call events
const voiceWebhookHandler = async (req, res) => {
  try {
    const event = req.body;

    // Basic parsing; adjust according to actual Telnyx webhook payload structure
    const eventType = event?.data?.event_type;
    const payload = event?.data?.payload;

    if (!payload) {
      return res.status(200).json({ received: true });
    }

    const telnyxCallLegId = payload.call_leg_id || payload.call_control_id;
    const from = payload.from || payload.caller_id_number;
    const to = payload.to || payload.callee_id_number;

    // Try to find existing call log
    const log = await CallLog.findOne({ telnyxCallLegId });

    if (log) {
      if (payload.duration_secs) {
        log.durationSeconds = payload.duration_secs;
      }
      if (eventType === 'call.answered') {
        log.status = 'answered';
      } else if (eventType === 'call.hangup') {
        log.status = 'completed';
      } else if (eventType === 'call.failed') {
        log.status = 'failed';
      }
      log.rawTelnyxData = payload;
      await log.save();

      await Notification.create({
        user: log.user,
        type: 'call',
        title: `Call ${log.status}`,
        message: `Call ${from} -> ${to} ${log.status}`,
        data: { from, to, status: log.status },
      });
    } else if (payload.direction === 'incoming') {
      // inbound call
      const newLog = await CallLog.create({
        user: null, // unknown user; in a multi-tenant app, map via phone number
        from,
        to,
        direction: 'inbound',
        status: 'initiated',
        telnyxCallLegId,
        rawTelnyxData: payload,
      });

      await Notification.create({
        user: null,
        type: 'call',
        title: 'Incoming call',
        message: `Incoming call ${from} -> ${to}`,
        data: { from, to },
      });
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('Voice webhook error', err.message);
    res.status(200).json({ received: true });
  }
};

module.exports = {
  initiateCall,
  listCallLogs,
  voiceWebhookHandler,
};
