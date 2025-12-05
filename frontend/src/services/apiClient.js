const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== 'undefined'
    ? (window.location.origin.includes('localhost')
        ? 'http://localhost:3000/api'
        : `${window.location.origin}/api`)
    : 'http://localhost:3000/api');

let authToken = typeof window !== 'undefined'
  ? window.localStorage.getItem('voip_token')
  : null;

export function setAuthToken(token) {
  authToken = token || null;
  if (typeof window !== 'undefined') {
    if (token) {
      window.localStorage.setItem('voip_token', token);
    } else {
      window.localStorage.removeItem('voip_token');
    }
  }
}

export function getStoredUser() {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem('voip_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredUser(user) {
  if (typeof window === 'undefined') return;
  if (!user) {
    window.localStorage.removeItem('voip_user');
  } else {
    window.localStorage.setItem('voip_user', JSON.stringify(user));
  }
}

async function request(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const message = isJson && data && data.message ? data.message : res.statusText;
    throw new Error(message);
  }

  return data;
}

function buildQuery(params = {}) {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      usp.append(key, String(value));
    }
  });
  const query = usp.toString();
  return query ? `?${query}` : '';
}

export const api = {
  // Auth
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  getMe: () => request('/auth/me'),

  // Numbers
  getCountries: () => request('/numbers/countries'),
  searchNumbers: ({ countryCode, features, type, limit }) => {
    const params = { countryCode };
    if (features && Array.isArray(features) && features.length > 0) {
      // For multiple features, we'll send them as comma-separated or multiple params
      params.features = features.join(',');
    }
    if (type) {
      params.type = type;
    }
    if (limit) {
      params.limit = limit;
    }
    return request(`/numbers/search${buildQuery(params)}`);
  },
  orderNumber: (payload) => request('/numbers/order', { method: 'POST', body: payload }),
  getMyNumbers: () => request('/numbers/mine'),
  enableVoiceCall: (phoneNumber) => request('/numbers/enable-voice', { method: 'PATCH', body: { phoneNumber } }),
  deleteNumber: (phoneNumberId) => request(`/numbers/${phoneNumberId}`, { method: 'DELETE' }),

  // Voice
  initiateCall: (payload) => request('/voice/call', { method: 'POST', body: payload }),
  initiateOutboundCall: (payload) => request('/voice/calls/outbound', { method: 'POST', body: payload }),
  getCallLogs: () => request('/voice/logs'),
  answerCall: (callControlId) => request(`/voice/calls/${callControlId}/answer`, { method: 'POST' }),
  connectWebRTC: (callControlId, clientState) => request(`/voice/calls/${callControlId}/connect-webrtc`, { method: 'POST', body: { client_state: clientState } }),
  hangupCall: (callControlId) => request(`/voice/calls/${callControlId}/hangup`, { method: 'POST' }),
  sendDTMF: (callControlId, digits) => request(`/voice/calls/${callControlId}/dtmf`, { method: 'POST', body: { digits } }),

  // SMS
  getContacts: () => request('/sms/contacts'),
  getConversation: (contact) =>
    request(`/sms/conversation${buildQuery({ contact })}`),
  sendSms: (payload) => request('/sms/send', { method: 'POST', body: payload }),

  // Notifications
  getNotifications: (params = {}) =>
    request(`/notifications${buildQuery(params)}`),
  markNotificationRead: (id) =>
    request(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () =>
    request('/notifications/mark-all-read', { method: 'PATCH' }),
};
