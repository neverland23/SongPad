const axios = require('axios');

const telnyxClient = axios.create({
  baseURL: 'https://api.telnyx.com/v2',
  timeout: 10000,
});

// Attach API key on each request from env
telnyxClient.interceptors.request.use((config) => {
  const apiKey = process.env.TELNYX_API_KEY;
  if (!apiKey) {
    console.warn('TELNYX_API_KEY is not set. Telnyx API calls will fail.');
  } else {
    config.headers['Authorization'] = `Bearer ${apiKey}`;
    config.headers['Content-Type'] = 'application/json';
    config.headers['Accept'] = 'application/json';
  }
  return config;
});

module.exports = telnyxClient;
