const BASE_URL = '/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function request(url: string, options: RequestInit = {}): Promise<any> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${url}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Bir hata oluştu');
  return data;
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (data: { name: string; email: string; password: string; role: string }) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  me: () => request('/auth/me'),

  // Listings
  getListings: (params?: string) => request(`/listings${params ? `?${params}` : ''}`),
  getListing: (id: string) => request(`/listings?id=${id}`),
  createListing: (data: Record<string, unknown>) =>
    request('/listings', { method: 'POST', body: JSON.stringify(data) }),
  updateListing: (id: string, data: Record<string, unknown>) =>
    request('/listings', { method: 'PUT', body: JSON.stringify({ id, ...data }) }),
  deleteListing: (id: string) =>
    request(`/listings?id=${id}`, { method: 'DELETE' }),

  // Bookings
  getBookings: (params?: string) => request(`/bookings${params ? `?${params}` : ''}`),
  getBookedDates: (listingId: string) => request(`/bookings?listingId=${listingId}`),
  createBooking: (data: Record<string, unknown>) =>
    request('/bookings', { method: 'POST', body: JSON.stringify(data) }),
  updateBooking: (id: string, status: string) =>
    request('/bookings', { method: 'PUT', body: JSON.stringify({ id, status }) }),

  // Reviews
  getReviews: (listingId: string) => request(`/reviews?listingId=${listingId}`),
  createReview: (data: Record<string, unknown>) =>
    request('/reviews', { method: 'POST', body: JSON.stringify(data) }),

  // Payments
  processPayment: (data: Record<string, unknown>) =>
    request('/payments', { method: 'POST', body: JSON.stringify(data) }),

  // Conversations & Messages
  getConversations: () => request('/conversations'),
  createConversation: (data: { participantId?: string; type?: string }) =>
    request('/conversations', { method: 'POST', body: JSON.stringify(data) }),
  getMessages: (conversationId: string) =>
    request(`/messages?conversationId=${conversationId}`),
  sendMessage: (conversationId: string, content: string) =>
    request('/messages', { method: 'POST', body: JSON.stringify({ conversationId, content }) }),
  markRead: (conversationId: string) =>
    request('/messages', { method: 'PUT', body: JSON.stringify({ conversationId }) }),

  // Favorites
  getFavorites: () => request('/favorites'),
  getFavoriteIds: () => request('/favorites?idsOnly=true'),
  addFavorite: (listingId: string) =>
    request('/favorites', { method: 'POST', body: JSON.stringify({ listingId }) }),
  removeFavorite: (listingId: string) =>
    request(`/favorites?listingId=${listingId}`, { method: 'DELETE' }),

  // Host
  getHostStats: () => request('/host/stats'),

  // Subscriptions
  purchaseSubscription: (plan: string) =>
    request('/subscriptions', { method: 'POST', body: JSON.stringify({ plan }) }),

  // Admin
  getAdminUsers: () => request('/admin/users'),
  updateAdminUser: (id: string, data: Record<string, unknown>) =>
    request('/admin/users', { method: 'PUT', body: JSON.stringify({ id, ...data }) }),
  getAdminStats: () => request('/admin/stats'),
  updateSubscription: (userId: string, plan: string) =>
    request('/admin/subscriptions', { method: 'PUT', body: JSON.stringify({ userId, plan }) }),
};
