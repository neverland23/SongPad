const mongoose = require('mongoose');

const callLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    from: { type: String, required: true },
    to:   { type: String, required: true },
    status: { type: String, default: 'initiated' }, // initiated, ringing, answered, completed, failed
    direction: { type: String, enum: ['outbound', 'inbound'], default: 'outbound' },
    durationSeconds: { type: Number },
    telnyxCallLegId: { type: String },
    callControlId: { type: String }, // Call Control v2 call_control_id
    rawTelnyxData: { type: Object },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CallLog', callLogSchema);