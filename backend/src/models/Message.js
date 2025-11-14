const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    from: { type: String, required: true },
    to:   { type: String, required: true },
    contact: { type: String, required: true }, // counterpart number for easy grouping
    body: { type: String, required: true },
    direction: { type: String, enum: ['outbound', 'inbound'], default: 'outbound' },
    status: { type: String, default: 'queued' }, // queued, sent, delivered, failed
    telnyxMessageId: { type: String },
    rawTelnyxData: { type: Object },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', messageSchema);
