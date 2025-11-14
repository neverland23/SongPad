const telnyxClient = require('../config/telnyxClient');
const PhoneNumber = require('../models/PhoneNumber');
const Notification = require('../models/Notification');

// Simple country list; in real app, you might fetch from Telnyx country coverage API
const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'AU', name: 'Australia' },
  { code: 'JP', name: 'Japan' },
];

const getCountries = async (req, res) => {
  res.json(COUNTRIES);
};

const searchNumbers = async (req, res) => {
  const { countryCode } = req.query;

  if (!countryCode) {
    return res.status(400).json({ message: 'countryCode query param is required' });
  }

  try {
    const response = await telnyxClient.get('/available_phone_numbers', {
      params: {
        'filter[country_code]': countryCode,
        'filter[features]': 'sms,voice',
        'filter[limit]': 20,
      },
    });

    const data = response.data && response.data.data ? response.data.data : [];

    const numbers = data.map((n) => ({
      phoneNumber: n.phone_number,
      countryCode: n.country_code,
      monthlyCost: n.monthly_cost || 0,
      capabilities: n.features || [],
      raw: n,
    }));

    res.json(numbers);
  } catch (err) {
    console.error('Telnyx available numbers error', err.response?.data || err.message);
    res.status(500).json({ message: 'Error fetching available phone numbers from Telnyx' });
  }
};

const orderNumber = async (req, res) => {
  const { phoneNumber, countryCode, monthlyCost } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ message: 'phoneNumber is required' });
  }

  try {
    // Order number via Telnyx Number Orders API
    const orderResp = await telnyxClient.post('/number_orders', {
      phone_numbers: [{ phone_number: phoneNumber }],
    });

    const telnyxData = orderResp.data && orderResp.data.data ? orderResp.data.data : orderResp.data;

    const newNumber = await PhoneNumber.create({
      user: req.user._id,
      telnyxNumberId: Array.isArray(telnyxData?.phone_numbers)
        ? telnyxData.phone_numbers[0]?.id
        : undefined,
      phoneNumber,
      countryCode: countryCode || '',
      capabilities: [],
      monthlyCost: monthlyCost || 0,
      rawTelnyxData: telnyxData,
    });

    await Notification.create({
      user: req.user._id,
      type: 'number',
      title: 'Number purchased',
      message: `You purchased phone number ${phoneNumber}`,
      data: { phoneNumber },
    });

    res.status(201).json(newNumber);
  } catch (err) {
    console.error('Telnyx number order error', err.response?.data || err.message);
    res.status(500).json({ message: 'Error ordering phone number from Telnyx' });
  }
};

const listMyNumbers = async (req, res) => {
  const numbers = await PhoneNumber.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(numbers);
};

module.exports = {
  getCountries,
  searchNumbers,
  orderNumber,
  listMyNumbers,
};
