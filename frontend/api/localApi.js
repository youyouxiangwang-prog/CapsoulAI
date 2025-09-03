// File: src/api/localApi.js
// --- FINAL, COMPLETE, AND SELF-CONTAINED VERSION ---

const API_PREFIX = import.meta.env.VITE_API_PREFIX || '/api/v1';

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => error ? prom.reject(error) : prom.resolve(token));
  failedQueue = [];
};

const redirectToLogin = () => {
  localStorage.removeItem('access_token');
  if (window.location.pathname !== '/login') {
    console.error("Session expired or refresh failed. Redirecting to login.");
    window.location.href = '/login';
  }
};

export async function apiRequest(path, options = {}) {
  const url = `${API_PREFIX}${path}`;
  
  const headers = new Headers(options.headers || {});
  // Set Content-Type for JSON body, if not already set
  if (options.body && typeof options.body === 'string' && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
  }

  // Add Authorization header from localStorage
  const token = localStorage.getItem("access_token");
  if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    let response = await fetch(url, { ...options, headers });

    // If the response is not 401, handle it normally
    if (response.status !== 401) {
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `API request failed with status ${response.status}`);
      }
      return response.status === 204 ? null : response.json();
    }

    // --- Handle 401 Unauthorized: Token Refresh Logic ---
    if (isRefreshing) {
      // If a refresh is already in progress, queue this request
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(newAccessToken => {
        headers.set('Authorization', `Bearer ${newAccessToken}`);
        // Retry the original request with the new token
        return fetch(url, { ...options, headers }).then(res => res.json());
      });
    }

    isRefreshing = true;

    try {
      // Attempt to refresh the token
      const refreshResponse = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        credentials: 'include', // Important for sending the HttpOnly refresh token cookie
      });

      if (!refreshResponse.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await refreshResponse.json();
      const newAccessToken = data.access_token;

      if (!newAccessToken) {
        throw new Error('Invalid refresh response from server');
      }
      
      // Refresh successful
      localStorage.setItem('access_token', newAccessToken);
      processQueue(null, newAccessToken);
      
      // Retry the original request with the new token
      headers.set('Authorization', `Bearer ${newAccessToken}`);
      return fetch(url, { ...options, headers }).then(res => res.json());

    } catch (error) {
      // If the refresh process fails, redirect to login
      console.error("Token refresh process failed:", error);
      processQueue(error, null);
      redirectToLogin();
      return Promise.reject(error); // Reject the promise to stop further execution
    } finally {
      isRefreshing = false;
    }

  } catch (error) {
    console.error(`Fatal error in apiRequest for ${url}:`, error);
    throw error;
  }
}

// --- ALL YOUR EXISTING API EXPORTS ---
// They will now automatically use the powerful apiRequest function above.

export const Recording = {
  list: () => apiRequest('/capture/recordings'),
  get: (id) => apiRequest(`/capture/recordings/${id}`),
  get_basic_summary: (id) => apiRequest(`/capture/recordings/${id}/basic_summary`),
  create: (data) => apiRequest('/capture/recordings', { method: 'POST', body: data }),
};

export const Todo = {
  list: () => apiRequest('/plan/todos'),
  get: (id) => apiRequest(`/capture/todos/${id}`),
  create: (data) => apiRequest('/todos', { method: 'POST', body: JSON.stringify(data) }),
};

export const CalendarEvent = {
  list: () => apiRequest('/plan/calendar-events'),
  get: (id) => apiRequest(`/capture/calendar-events/${id}`),
  create: (data) => apiRequest('/calendar-events', { method: 'POST', body: JSON.stringify(data) }),
};

export const Highlight = {
  list: () => apiRequest('/plan/highlights'),
  get: (id) => apiRequest(`/highlights/${id}`),
  create: (data) => apiRequest('/highlights', { method: 'POST', body: JSON.stringify(data) }),
};

export const Moment = {
  search: (query) => apiRequest(`/moment/search?query=${encodeURIComponent(query)}`),
  getSummary: (query) => apiRequest(`/moment/summary?query=${encodeURIComponent(query)}`),
  getDashboard: (timeframe = 'today') => apiRequest(`/moment/dashboard?timeframe=${timeframe}`),
  getAncestry: (segmentId) => apiRequest(`/moment/ancestry?segment_id=${segmentId}`),
};

export const InvokeLLM = (data) => {
  return apiRequest('/llm/invoke', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

// This function for a different service needs separate handling.
// It will NOT have automatic token refresh unless you build that logic in here too.
export const UploadFile = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  // This URL needs its own proxy rule in vite.config.js if it's on a different port.
  // Example rule: '/files': { target: 'http://localhost:5715' }
  const uploadUrl = '/files/upload'; 

  return fetch(uploadUrl, {
    method: 'POST',
    body: formData
  }).then(res => res.json());
};