const mongoose = require('mongoose');

const phoneNumberSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    telnyxNumberId: { type: String },
    phoneNumber: { type: String, required: true },
    countryCode: { type: String },
    capabilities: [{ type: String }],
    monthlyCost: { type: Number },
    rawTelnyxData: { type: Object },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PhoneNumber', phoneNumberSchema);
