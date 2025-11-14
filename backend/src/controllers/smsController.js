const telnyxClient = require('../config/telnyxClient');
const Message = require('../models/Message');
const Notification = require('../models/Notification');

const sendSms = async (req, res) => {
  const { from, to, text } = req.body;

  if (!from || !to || !text) {
    return res.status(400).json({ message: 'from, to and text are required' });
  }

  try {
    const payload = {
      from,
      to,
      text,
    };

    // Optionally attach messaging profile
    if (process.env.TELNYX_MESSAGING_PROFILE_ID) {
      payload.messaging_profile_id = process.env.TELNYX_MESSAGING_PROFILE_ID;
    }

    const response = await telnyxClient.post('/messages', payload);

    const msgData = response.data && response.data.data ? response.data.data : response.data;

    const contact = to;

    const msg = await Message.create({
      user: req.user._id,
      from,
      to,
      contact,
      body: text,
      direction: 'outbound',
      status: msgData.status || 'queued',
      telnyxMessageId: msgData.id,
      rawTelnyxData: msgData,
    });

    await Notification.create({
      user: req.user._id,
      type: 'sms',
      title: 'SMS sent',
      message: `SMS sent to ${to}`,
      data: { from, to },
    });

    res.status(201).json(msg);
  } catch (err) {
    console.error('Telnyx send message error', err.response?.data || err.message);
    res.status(500).json({ message: 'Error sending SMS via Telnyx' });
  }
};

const listContacts = async (req, res) => {
  const contacts = await Message.find({ user: req.user._id }).distinct('contact');
  res.json(contacts);
};

const getConversation = async (req, res) => {
  const { contact } = req.query;
  if (!contact) {
    return res.status(400).json({ message: 'contact query param is required' });
  }

  const messages = await Message.find({
    user: req.user._id,
    contact,
  }).sort({ createdAt: 1 });

  res.json(messages);
};

// Webhook handler for inbound SMS from Telnyx
const smsWebhookHandler = async (req, res) => {
  try {
    const event = req.body;
    const eventType = event?.data?.event_type;
    const payload = event?.data?.payload;

    if (!payload) {
      return res.status(200).json({ received: true });
    }

    if (eventType === 'message.received' || eventType === 'message.finalized') {
      const from = payload.from;
      const to = payload.to;
      const text = payload.text || payload.body || '';

      const contact = from;

      const msg = await Message.create({
        user: null, // Unknown user; wire this up according to your tenancy model
        from,
        to,
        contact,
        body: text,
        direction: 'inbound',
        status: payload.status || 'received',
        telnyxMessageId: payload.id,
        rawTelnyxData: payload,
      });

      await Notification.create({
        user: null,
        type: 'sms',
        title: 'Incoming SMS',
        message: `SMS from ${from}: ${text.slice(0, 80)}`,
        data: { from, to },
      });
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('SMS webhook error', err.message);
    res.status(200).json({ received: true });
  }
};

module.exports = {
  sendSms,
  listContacts,
  getConversation,
  smsWebhookHandler,
};
