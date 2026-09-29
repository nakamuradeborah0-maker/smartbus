const API_BASE_URL = 'http://localhost:5000/api';

// Helper function for API requests with auto-attached JWT token
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('gv_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'An error occurred with the request.');
  }

  return data;
}

export const api = {
  // Auth
  register: (userData) => request('/auth/register', { method: 'POST', body: userData }),
  login: (credentials) => request('/auth/login', { method: 'POST', body: credentials }),
  demoLogin: (roleKey) => request('/auth/demo-login', { method: 'POST', body: { roleKey } }),
  getMe: () => request('/auth/me'),

  // Public Tracking & Issues (Zero Auth)
  trackParcel: (trackingNumber) => request(`/parcels/track/${encodeURIComponent(trackingNumber)}`),
  submitPublicIssue: (issueData) => request('/parcels/public-issue', { method: 'POST', body: issueData }),

  // Parcels (Protected)
  getParcels: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/parcels${query ? `?${query}` : ''}`);
  },
  getParcelById: (id) => request(`/parcels/${id}`),
  createParcel: (parcelData) => request('/parcels', { method: 'POST', body: parcelData }),
  updateParcelStatus: (id, statusData) => request(`/parcels/${id}/status`, { method: 'PATCH', body: statusData }),
  assignTracker: (id, trackerId) => request(`/parcels/${id}/tracker`, { method: 'POST', body: { trackerId } }),
  reportParcelIssue: (id, issueData) => request(`/parcels/${id}/issues`, { method: 'POST', body: issueData }),
  getAllIssues: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/parcels/issues/all${query ? `?${query}` : ''}`);
  },
  updateIssue: (issueId, updateData) => request(`/parcels/issues/${issueId}`, { method: 'PATCH', body: updateData }),

  // Trips & Driver Operations
  getTrips: () => request('/trips'),
  createTrip: (tripData) => request('/trips', { method: 'POST', body: tripData }),
  confirmDeparture: (tripId) => request(`/trips/${tripId}/departure`, { method: 'PATCH' }),
  confirmArrival: (tripId) => request(`/trips/${tripId}/arrival`, { method: 'PATCH' }),
  reportTripIncident: (tripId, incidentReport) => request(`/trips/${tripId}/incident`, { method: 'PATCH', body: { incidentReport } }),
  deleteTrip: (tripId) => request(`/trips/${tripId}`, { method: 'DELETE' }),

  // Stations & Routes
  getStations: () => request('/stations'),
  createStation: (stationData) => request('/stations', { method: 'POST', body: stationData }),
  updateStation: (id, stationData) => request(`/stations/${id}`, { method: 'PATCH', body: stationData }),
  deleteStation: (id) => request(`/stations/${id}`, { method: 'DELETE' }),
  getRoutes: () => request('/routes'),
  createRoute: (routeData) => request('/routes', { method: 'POST', body: routeData }),
  updateRoute: (id, routeData) => request(`/routes/${id}`, { method: 'PATCH', body: routeData }),
  deleteRoute: (id) => request(`/routes/${id}`, { method: 'DELETE' }),

  // Users (Admin)
  getUsers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/users${query ? `?${query}` : ''}`);
  },
  createUser: (userData) => request('/users', { method: 'POST', body: userData }),
  updateUser: (id, userData) => request(`/users/${id}`, { method: 'PATCH', body: userData }),
  deleteUser: (id) => request(`/users/${id}`, { method: 'DELETE' }),

  // IoT Trackers
  getTrackers: () => request('/iot/trackers'),
  createTracker: (trackerData) => request('/iot/trackers', { method: 'POST', body: trackerData }),

  // Notifications
  getNotifications: () => request('/notifications'),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () => request('/notifications/mark-all-read', { method: 'PATCH' }),

  // Payments (CamPay)
  collectPayment: (paymentData) => request('/payment/collect', { method: 'POST', body: paymentData }),
};
