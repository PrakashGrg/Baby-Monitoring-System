import AsyncStorage from '@react-native-async-storage/async-storage';

// ⚠️ IMPORTANT: Replace YOUR_PC_IP below with your computer's local IP address.
// Find it by running `ipconfig` (Windows) and looking for "IPv4 Address".
// Example: if ipconfig shows 192.168.18.5, use that below.
// Your phone and PC must be on the SAME Wi-Fi network for this to work.

export const API_BASE = 'http://192.168.18.254:8000/api';
export const WS_BASE  = 'ws://192.168.18.254:8000/ws';

const getToken = async () => AsyncStorage.getItem('access_token');
const headers  = async (extra = {}) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${await getToken()}`,
  ...extra,
});
const handle = async (res) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data;
};

export const authAPI = {
  login: (username, password) =>
    fetch(`${API_BASE}/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    }).then(handle),

  register: (data) =>
    fetch(`${API_BASE}/auth/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handle),

  me: async () =>
    fetch(`${API_BASE}/auth/me/`, { headers: await headers() }).then(handle),
};

export const babyAPI = {
  list:   async ()         => fetch(`${API_BASE}/babies/`, { headers: await headers() }).then(handle),
  get:    async (id)       => fetch(`${API_BASE}/babies/${id}/`, { headers: await headers() }).then(handle),
  create: async (data)     => fetch(`${API_BASE}/babies/`, { method:'POST', headers: await headers(), body: JSON.stringify(data) }).then(handle),
  update: async (id, data) => fetch(`${API_BASE}/babies/${id}/`, { method:'PATCH', headers: await headers(), body: JSON.stringify(data) }).then(handle),
  delete: async (id)       => fetch(`${API_BASE}/babies/${id}/`, { method:'DELETE', headers: await headers() }),
};

export const activityAPI = {
  list: async (babyId, params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetch(`${API_BASE}/babies/${babyId}/activities/?${q}`, { headers: await headers() }).then(handle);
  },
  summary:        async (babyId, date) => fetch(`${API_BASE}/babies/${babyId}/summary/?date=${date}`, { headers: await headers() }).then(handle),
  weeklyChart:    async (babyId)       => fetch(`${API_BASE}/babies/${babyId}/chart/weekly/`, { headers: await headers() }).then(handle),
  simulateSensor: async (babyId)       => fetch(`${API_BASE}/babies/${babyId}/sensor/simulate/`, { headers: await headers() }).then(handle),
};

export const detectionAPI = {
  simulate:    async (babyId)           => fetch(`${API_BASE}/detection/${babyId}/simulate/`, { headers: await headers() }).then(handle),
  events:      async (babyId)           => fetch(`${API_BASE}/detection/${babyId}/events/`, { headers: await headers() }).then(handle),
  detectFrame: async (babyId, frameB64) => fetch(`${API_BASE}/detection/${babyId}/frame/`, { method:'POST', headers: await headers(), body: JSON.stringify({ frame: frameB64 }) }).then(handle),
};

export const notifAPI = {
  list:          async ()              => fetch(`${API_BASE}/notifications/`, { headers: await headers() }).then(handle),
  unreadCount:   async ()              => fetch(`${API_BASE}/notifications/unread-count/`, { headers: await headers() }).then(handle),
  markRead:      async (id)            => fetch(`${API_BASE}/notifications/${id}/read/`, { method:'POST', headers: await headers() }).then(handle),
  createTest:    async (babyId)        => fetch(`${API_BASE}/notifications/test/`, { method:'POST', headers: await headers(), body: JSON.stringify({ baby_id: babyId }) }).then(handle),
  registerToken: async (token, platform='expo') => fetch(`${API_BASE}/notifications/register-token/`, { method:'POST', headers: await headers(), body: JSON.stringify({ token, platform }) }).then(handle),
};