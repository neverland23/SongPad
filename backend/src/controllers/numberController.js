const telnyxClient = require('../config/telnyxClient');
const PhoneNumber = require('../models/PhoneNumber');
const Notification = require('../models/Notification');

// Fallback list of countries supported by Telnyx
// Used when the API endpoint is not available
const FALLBACK_COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'AT', name: 'Austria' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },
  { code: 'FI', name: 'Finland' },
  { code: 'PL', name: 'Poland' },
  { code: 'IE', name: 'Ireland' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'SG', name: 'Singapore' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'TW', name: 'Taiwan' },
  { code: 'MX', name: 'Mexico' },
  { code: 'BR', name: 'Brazil' },
  { code: 'AR', name: 'Argentina' },
  { code: 'CL', name: 'Chile' },
  { code: 'CO', name: 'Colombia' },
  { code: 'PE', name: 'Peru' },
  { code: 'IN', name: 'India' },
  { code: 'TH', name: 'Thailand' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'PH', name: 'Philippines' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'VN', name: 'Vietnam' },
  { code: 'ZA', name: 'South Africa' },
];

const getCountries = async (req, res) => {
  try {
    // Try the API endpoint first
    const response = await telnyxClient.get('/available_phone_number_countries');
    
    const countriesData = response.data?.data || [];
    
    // Transform API response to match expected structure
    const countries = countriesData
      .map((country) => {
        const countryCode = country.country_code;
        const countryName = country.country_name;
        
        if (!countryCode) return null;
        
        return {
          code: countryCode,
          name: countryName || countryCode,
        };
      })
      .filter(Boolean) // Remove any null entries
      .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically by name
    
    // If we got valid data from API, return it
    if (countries.length > 0) {
      return res.json(countries);
    }
    
    // Fallback to static list if API returns empty
    res.json(FALLBACK_COUNTRIES);
  } catch (err) {
    // If endpoint doesn't exist (404) or other error, use fallback list
    console.warn('Telnyx available countries endpoint not available, using fallback list', err.response?.status || err.message);
    res.json(FALLBACK_COUNTRIES);
  }
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

    res.json(data);
  } catch (err) {
    res.json([]);
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
