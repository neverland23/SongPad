const API_BASE =
  window.location.origin.includes('localhost')
    ? 'http://localhost:5000/api'
    : window.location.origin + '/api';

const getToken = () => localStorage.getItem('voip_token');

const authHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

async function apiRequest(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...authHeaders(),
    ...(options.headers || {}),
  };

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const message = data?.message || res.statusText;
    throw new Error(message);
  }

  return data;
}
