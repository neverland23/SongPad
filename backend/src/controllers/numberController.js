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
  const { countryCode, features, type, limit } = req.query;

  if (!countryCode) {
    return res.status(400).json({ message: 'countryCode query param is required' });
  }

  try {
    const params = {
      'filter[country_code]': countryCode,
    };

    // Add features filter if provided
    if (features) {
      const featuresArray = typeof features === 'string' ? features.split(',') : features;
      if (Array.isArray(featuresArray) && featuresArray.length > 0) {
        // Telnyx API accepts features as comma-separated string or multiple filter params
        params['filter[features]'] = featuresArray.join(',');
      }
    }

    // Add type filter if provided
    if (type) {
      params['filter[phone_number_type]'] = type;
    }

    // Add limit if provided
    if (limit) {
      const limitNum = parseInt(limit, 10);
      if (!isNaN(limitNum) && limitNum > 0) {
        params['filter[limit]'] = limitNum;
      }
    }

    const response = await telnyxClient.get('/available_phone_numbers', {
      params,
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
  const { phoneNumber, countryCode, monthlyCost, rawNumberDetails } = req.body;

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
      rawNumberDetails: rawNumberDetails || null,
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
  try {
    // Fetch numbers from database filtered by user ID
    const numbers = await PhoneNumber.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    // Transform database records to match the UI format and fetch number order details
    const transformedNumbers = await Promise.all(
      numbers.map(async (num) => {
        // Use rawNumberDetails if available (contains full phone number details from search)
        // Otherwise fall back to rawTelnyxData or construct from basic fields
        const rawNumberDetails = num.rawNumberDetails || {};
        
        // Extract features - could be array of objects {name: "voice"} or array of strings
        let features = rawNumberDetails.features || [];
        if (features.length > 0 && typeof features[0] === 'string') {
          features = features.map((f) => ({ name: f }));
        }
        if (features.length === 0 && num.capabilities && num.capabilities.length > 0) {
          features = num.capabilities.map((cap) => ({ name: cap }));
        }
        
        let phone_number_status = null;
        let phone_number_connection_id = null;

        // Fetch phone number resource using phone number as filter parameter
        if (num.phoneNumber) {
          try {
            const phoneNumbersResponse = await telnyxClient.get('/phone_numbers', {
              params: {
                'filter[phone_number]': num.phoneNumber,
              },
            });

            const phoneNumbers = phoneNumbersResponse.data?.data || [];
            
            if (phoneNumbers.length > 0) {
              const phoneNumberResource = phoneNumbers[0];
              phone_number_status = phoneNumberResource.status || null;
              phone_number_connection_id = phoneNumberResource.connection_id || null;
            }
          } catch (phoneErr) {
            console.warn(`Failed to fetch phone number details for ${num.phoneNumber}:`, phoneErr.message);
            // Continue without phone number details if fetch fails
          }
        }
        
        return {
          _id: num._id,
          phone_number: num.phoneNumber,
          phone_number_id: num.telnyxNumberId,
          phone_number_status: phone_number_status,
          phone_number_connection_id: phone_number_connection_id,
          region_information: rawNumberDetails.region_information || [],
          features: features,
          cost_information: rawNumberDetails.cost_information || {
            monthly_cost: num.monthlyCost?.toString() || '0',
            currency: 'USD',
          },
          status: 'active', // Default status for database records
          created_at: num.createdAt,
          createdAt: num.createdAt,
        };
      })
    );
    // Transform database records to match the UI format
    const transformedNumbers = numbers.map((num) => {
      // Use rawNumberDetails if available (contains full phone number details from search)
      // Otherwise fall back to rawTelnyxData or construct from basic fields
      const rawNumberDetails = num.rawNumberDetails || {};
      
      // Extract features - could be array of objects {name: "voice"} or array of strings
      let features = rawNumberDetails.features || [];
      if (features.length > 0 && typeof features[0] === 'string') {
        features = features.map((f) => ({ name: f }));
      }
      if (features.length === 0 && num.capabilities && num.capabilities.length > 0) {
        features = num.capabilities.map((cap) => ({ name: cap }));
      }
      
      return {
        _id: num._id,
        phone_number: num.phoneNumber,
        phone_number_id: num.telnyxNumberId,
        region_information: rawNumberDetails.region_information || [],
        features: features,
        cost_information: rawNumberDetails.cost_information || {
          monthly_cost: num.monthlyCost?.toString() || '0',
          currency: 'USD',
        },
        status: 'active', // Default status for database records
        created_at: num.createdAt,
        createdAt: num.createdAt,
      };
    });

    res.json(transformedNumbers);
  } catch (err) {
    console.error('List my numbers error', err);
    res.status(500).json({ message: 'Error fetching your numbers' });
  }
};

const enableVoiceCall = async (req, res) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ message: 'phoneNumber is required' });
  }

  const connectionId = process.env.TELNYX_CONNECTION_ID;

  if (!connectionId) {
    return res.status(500).json({ message: 'TELNYX_CONNECTION_ID is not configured' });
  }

  try {
    // Fetch the phone number resource using phone number as filter parameter
    const phoneNumbersResponse = await telnyxClient.get('/phone_numbers', {
      params: {
        'filter[phone_number]': phoneNumber,
      },
    });

    const phoneNumbers = phoneNumbersResponse.data?.data || [];
    
    if (phoneNumbers.length === 0) {
      return res.status(404).json({ message: 'Phone number not found' });
    }

    // Get the phone number resource (should be first result)
    const phoneNumberResource = phoneNumbers[0];
    const phoneNumberResourceId = phoneNumberResource.id;

    if (!phoneNumberResourceId) {
      return res.status(400).json({ message: 'Phone number ID not found in response' });
    }

    // Assign the phone number to the connection using the phone number ID
    await telnyxClient.patch(`/phone_numbers/${phoneNumberResourceId}`, {
      connection_id: connectionId,
    });

    await Notification.create({
      user: req.user._id,
      type: 'number',
      title: 'Voice call enabled',
      message: `Voice call has been enabled for ${phoneNumber}`,
      data: { phoneNumber, connectionId, phoneNumberResourceId },
    });

    res.json({ message: 'Voice call enabled successfully' });
  } catch (err) {
    console.error('Enable voice call error', err.response?.data || err.message);
    
    if (err.response?.status === 404) {
      return res.status(404).json({ message: 'Phone number not found' });
    }
    
    res.status(500).json({ message: 'Error enabling voice call' });
  }
};

const deleteNumber = async (req, res) => {
  const { phoneNumber } = req.params;

  if (!phoneNumber) {
    return res.status(400).json({ message: 'phoneNumber is required' });
  }

  try {
    // First, fetch the phone number resource using phoneNumber as filter parameter
    const phoneNumbersResponse = await telnyxClient.get('/phone_numbers', {
      params: {
        'filter[phone_number]': phoneNumber,
      },
    });

    const phoneNumbers = phoneNumbersResponse.data?.data || [];
    
    if (phoneNumbers.length === 0) {
      return res.status(404).json({ message: 'Phone number not found' });
    }

    // Get the phone number resource (should be first result)
    const phoneNumberResource = phoneNumbers[0];

    // Check the status from the response
    const status = phoneNumberResource.status;

    // If the status is not active, return error message
    if (status !== 'active') {
      return res.status(400).json({ 
        message: 'This phone number is still not assigned to your account, after it\'s assigned, you can delete it.' 
      });
    }

    // Get the id from the response
    const phoneNumberResourceId = phoneNumberResource.id;

    if (!phoneNumberResourceId) {
      return res.status(400).json({ message: 'Phone number ID not found in response' });
    }

    // If status is active, use that id to continue to delete phone number
    await telnyxClient.delete(`/phone_numbers/${phoneNumberResourceId}`);

    // Also remove from database
    await PhoneNumber.deleteOne({
      user: req.user._id,
      phoneNumber: phoneNumber,
    });

    await Notification.create({
      user: req.user._id,
      type: 'number',
      title: 'Number deleted',
      message: `Phone number has been deleted`,
      data: { phoneNumber, phoneNumberResourceId },
    });

    res.json({ message: 'Phone number deleted successfully' });
  } catch (err) {
    console.error('Telnyx delete number error', err.response?.data || err.message);
    
    // Handle specific error cases
    if (err.response?.status === 404) {
      return res.status(404).json({ message: 'Phone number not found' });
    }
    
    res.status(500).json({ message: 'Error deleting phone number from Telnyx' });
  }
};

module.exports = {
  getCountries,
  searchNumbers,
  orderNumber,
  listMyNumbers,
  enableVoiceCall,
  deleteNumber,
};
