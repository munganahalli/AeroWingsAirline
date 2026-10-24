import type { Airport, Booking, EmailLog, Flight, Passenger, User } from '../types/index.ts';

const BASE_URL = '/api';

export async function fetchConfig() {
  const res = await fetch(`${BASE_URL}/config`);
  if (!res.ok) throw new Error('Failed to load system config');
  return res.json();
}

export async function fetchAirports(): Promise<Airport[]> {
  const res = await fetch(`${BASE_URL}/airports`);
  if (!res.ok) throw new Error('Failed to fetch airports');
  return res.json();
}

export async function fetchFlights(params?: {
  origin?: string;
  destination?: string;
  cabinClass?: string;
  date?: string;
  passengers?: number;
}): Promise<Flight[]> {
  const url = new URL(`${BASE_URL}/flights`, window.location.origin);
  if (params?.origin) url.searchParams.set('origin', params.origin);
  if (params?.destination) url.searchParams.set('destination', params.destination);
  if (params?.cabinClass) url.searchParams.set('cabinClass', params.cabinClass);
  if (params?.date) url.searchParams.set('date', params.date);
  if (params?.passengers) url.searchParams.set('passengers', params.passengers.toString());

  const res = await fetch(url.toString());
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || `Flight search request failed with status ${res.status}`);
  }
  return Array.isArray(data) ? data : [];
}

export async function sendOtp(
  email: string,
  purpose: 'REGISTRATION' | 'LOGIN' | 'PASSWORD_RESET' | 'BOOKING_VERIFY'
) {
  const res = await fetch(`${BASE_URL}/auth/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim().toLowerCase(), purpose }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to dispatch verification code');
  return data;
}

export async function verifyOtp(email: string, code: string, purpose?: string) {
  const res = await fetch(`${BASE_URL}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim().toLowerCase(), code: code.trim(), purpose }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Invalid verification code');
  return data;
}

export async function registerUser(name: string, email: string, password: string): Promise<{ user: User }> {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Registration failed');
  return data;
}

export async function loginUser(email: string, password: string): Promise<{ user: User }> {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Authentication failed');
  return data;
}

export async function requestPasswordReset(email: string) {
  const res = await fetch(`${BASE_URL}/auth/forgot-password/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim().toLowerCase() }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Password reset request failed');
  return data;
}

export async function submitPasswordReset(email: string, newPassword: string) {
  const res = await fetch(`${BASE_URL}/auth/forgot-password/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim().toLowerCase(), newPassword }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update password');
  return data;
}

export async function createBooking(payload: {
  flightId: string;
  cabinClass: string;
  passengers: Passenger[];
  contactEmail: string;
  contactPhone: string;
  fareBreakdown: any;
  paymentMethod: string;
  otpCode: string;
  userId?: string;
  idempotencyKey?: string;
}): Promise<{ success: boolean; booking: Booking }> {
  let effectiveUserId = payload.userId;
  if (!effectiveUserId) {
    try {
      const stored = localStorage.getItem('aerowings_auth_user');
      if (stored) {
        effectiveUserId = JSON.parse(stored)?.id;
      }
    } catch {
      // ignore
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (effectiveUserId) {
    headers['x-user-id'] = effectiveUserId;
    headers['Authorization'] = `Bearer ${effectiveUserId}`;
  }

  const res = await fetch(`${BASE_URL}/bookings/create`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      ...payload,
      userId: effectiveUserId,
      contactEmail: payload.contactEmail.trim().toLowerCase(),
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Booking creation failed');
  return data;
}

export async function fetchMyBookings(email?: string, pnr?: string): Promise<Booking[]> {
  const url = new URL(`${BASE_URL}/bookings/my`, window.location.origin);
  if (email) url.searchParams.set('email', email.trim().toLowerCase());
  if (pnr) url.searchParams.set('pnr', pnr.trim().toUpperCase());

  let effectiveUserId: string | undefined;
  try {
    const stored = localStorage.getItem('aerowings_auth_user');
    if (stored) {
      effectiveUserId = JSON.parse(stored)?.id;
    }
  } catch {
    // ignore
  }

  const headers: Record<string, string> = {};
  if (effectiveUserId) {
    headers['x-user-id'] = effectiveUserId;
    headers['Authorization'] = `Bearer ${effectiveUserId}`;
    url.searchParams.set('userId', effectiveUserId);
  }

  const res = await fetch(url.toString(), { headers });
  if (!res.ok) throw new Error('Failed to retrieve bookings');
  return res.json();
}

export async function verifyTicketToken(tokenOrPnr: string) {
  const cleanInput = tokenOrPnr.trim();
  const res = await fetch(`${BASE_URL}/bookings/verify/${encodeURIComponent(cleanInput)}`);
  const data = await res.json();
  if (res.ok) return data;

  // Fallback to POST /bookings/verify
  const postRes = await fetch(`${BASE_URL}/bookings/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: cleanInput, pnr: cleanInput }),
  });
  const postData = await postRes.json();
  if (!postRes.ok) throw new Error(postData.error || data.error || 'Ticket could not be validated');
  return postData;
}

export async function cancelBooking(id: string, reason?: string): Promise<{ success: boolean; booking: Booking; message?: string }> {
  const res = await fetch(`${BASE_URL}/bookings/${id}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to cancel booking');
  return data;
}

export async function resendBookingEmail(id: string) {
  const res = await fetch(`${BASE_URL}/bookings/${id}/resend-email`, {
    method: 'POST',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to dispatch email');
  return data;
}

export async function fetchAdminStats(adminEmail?: string) {
  const headers: Record<string, string> = {};
  if (adminEmail) headers['x-admin-email'] = adminEmail;
  const res = await fetch(`${BASE_URL}/admin/stats`, { headers });
  if (!res.ok) throw new Error('Failed to retrieve admin statistics');
  return res.json();
}

export async function fetchAdminEmails(adminEmail?: string): Promise<EmailLog[]> {
  const headers: Record<string, string> = {};
  if (adminEmail) headers['x-admin-email'] = adminEmail;
  const res = await fetch(`${BASE_URL}/admin/emails`, { headers });
  if (!res.ok) throw new Error('Failed to retrieve email logs');
  return res.json();
}

export async function addAdminFlight(flightData: any, adminEmail?: string): Promise<Flight> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (adminEmail) headers['x-admin-email'] = adminEmail;
  const res = await fetch(`${BASE_URL}/admin/flights`, {
    method: 'POST',
    headers,
    body: JSON.stringify(flightData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create flight');
  return data;
}

export async function updateAdminFlight(id: string, updates: { status?: string; gate?: string }, adminEmail?: string): Promise<Flight> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (adminEmail) headers['x-admin-email'] = adminEmail;
  const res = await fetch(`${BASE_URL}/admin/flights/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(updates),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update flight');
  return data;
}

// -------------------------------------------------------------
// CURRENT EXCHANGE RATES API
// -------------------------------------------------------------
export async function fetchExchangeRates() {
  const res = await fetch(`${BASE_URL}/exchange-rates`);
  if (!res.ok) throw new Error('Failed to fetch exchange rates');
  return res.json();
}

// -------------------------------------------------------------
// WEATHER & FLIGHT WEATHER RISK APIS
// -------------------------------------------------------------
export async function fetchAirportWeather(code: string) {
  const res = await fetch(`${BASE_URL}/weather/airport/${encodeURIComponent(code.trim().toUpperCase())}`);
  if (!res.ok) throw new Error(`Failed to load weather for airport ${code}`);
  return res.json();
}

export async function fetchFlightWeather(flightId: string) {
  const res = await fetch(`${BASE_URL}/weather/flight/${encodeURIComponent(flightId.trim())}`);
  if (!res.ok) throw new Error('Failed to load flight weather risk assessment');
  return res.json();
}

export async function predictRouteWeather(origin: string, destination: string, simulateBad?: boolean) {
  const url = new URL(`${BASE_URL}/weather/predict`, window.location.origin);
  url.searchParams.set('origin', origin);
  url.searchParams.set('destination', destination);
  if (simulateBad) url.searchParams.set('simulateBad', 'true');
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Failed to predict route weather');
  return res.json();
}

export async function checkAndProtectBookingWeather(bookingId: string, forceAdverseWeather?: boolean) {
  const res = await fetch(`${BASE_URL}/weather/check-and-protect/${encodeURIComponent(bookingId)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ forceAdverseWeather: Boolean(forceAdverseWeather) }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to check weather protection');
  return data;
}

export async function runAdminWeatherProtectionSweep(simulateBad?: boolean, adminEmail?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (adminEmail) {
    headers['x-admin-email'] = adminEmail;
    headers['Authorization'] = `Bearer ${adminEmail}`;
  }
  const res = await fetch(`${BASE_URL}/admin/weather-auto-protect-all`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ simulateBad: Boolean(simulateBad) }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to execute weather protection sweep');
  return data;
}

// -------------------------------------------------------------
// ADMIN DATABASE BOOKINGS (All Database Bookings with Search, Filter & Pagination)
// -------------------------------------------------------------
export async function fetchAdminBookings(
  params?: {
    search?: string;
    bookingStatus?: string;
    paymentStatus?: string;
    airline?: string;
    route?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  },
  adminEmail?: string
) {
  const url = new URL(`${BASE_URL}/admin/bookings`, window.location.origin);
  if (params?.search) url.searchParams.set('search', params.search);
  if (params?.bookingStatus) url.searchParams.set('bookingStatus', params.bookingStatus);
  if (params?.paymentStatus) url.searchParams.set('paymentStatus', params.paymentStatus);
  if (params?.airline) url.searchParams.set('airline', params.airline);
  if (params?.route) url.searchParams.set('route', params.route);
  if (params?.startDate) url.searchParams.set('startDate', params.startDate);
  if (params?.endDate) url.searchParams.set('endDate', params.endDate);
  if (params?.sortBy) url.searchParams.set('sortBy', params.sortBy);
  if (params?.sortOrder) url.searchParams.set('sortOrder', params.sortOrder);
  if (params?.page) url.searchParams.set('page', params.page.toString());
  if (params?.limit) url.searchParams.set('limit', params.limit.toString());

  const headers: Record<string, string> = {};
  if (adminEmail) {
    headers['x-admin-email'] = adminEmail;
    headers['Authorization'] = `Bearer ${adminEmail}`;
  }

  const res = await fetch(url.toString(), { headers });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to retrieve database bookings');
  }
  return res.json();
}

export async function updateAdminBookingStatus(
  id: string,
  updates: {
    bookingStatus?: 'CONFIRMED' | 'CANCELLED' | 'PENDING';
    paymentStatus?: 'PAID' | 'PENDING' | 'REFUNDED';
    cancellationReason?: string;
  },
  adminEmail?: string
) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (adminEmail) {
    headers['x-admin-email'] = adminEmail;
    headers['Authorization'] = `Bearer ${adminEmail}`;
  }

  const res = await fetch(`${BASE_URL}/admin/bookings/${id}/status`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(updates),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update booking status');
  return data;
}

export async function fetchAdminUsers(params?: { search?: string; role?: string }, adminEmail?: string) {
  const url = new URL(`${BASE_URL}/admin/users`, window.location.origin);
  if (params?.search) url.searchParams.set('search', params.search);
  if (params?.role) url.searchParams.set('role', params.role);

  const headers: Record<string, string> = {};
  if (adminEmail) {
    headers['x-admin-email'] = adminEmail;
    headers['Authorization'] = `Bearer ${adminEmail}`;
  }

  const res = await fetch(url.toString(), { headers });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to retrieve registered users');
  }
  return res.json();
}

export async function createAdminUser(
  userData: { name: string; email: string; password: string; role: 'admin' | 'customer' },
  adminEmail?: string
) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (adminEmail) {
    headers['x-admin-email'] = adminEmail;
    headers['Authorization'] = `Bearer ${adminEmail}`;
  }

  const res = await fetch(`${BASE_URL}/admin/users`, {
    method: 'POST',
    headers,
    body: JSON.stringify(userData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create user account');
  return data;
}

export async function updateAdminUserRole(id: string, role: 'admin' | 'customer', adminEmail?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (adminEmail) {
    headers['x-admin-email'] = adminEmail;
    headers['Authorization'] = `Bearer ${adminEmail}`;
  }

  const res = await fetch(`${BASE_URL}/admin/users/${id}/role`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ role }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update user role');
  return data;
}

export async function deleteAdminUser(id: string, adminEmail?: string) {
  const headers: Record<string, string> = {};
  if (adminEmail) {
    headers['x-admin-email'] = adminEmail;
    headers['Authorization'] = `Bearer ${adminEmail}`;
  }

  const res = await fetch(`${BASE_URL}/admin/users/${id}`, {
    method: 'DELETE',
    headers,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to remove user account');
  return data;
}

// -------------------------------------------------------------
// COMPLETE AIRLINE PASSENGER RESERVATIONS ROSTER
// -------------------------------------------------------------
export async function fetchAdminPassengers(
  params?: {
    search?: string;
    bookingStatus?: string;
    airline?: string;
    cabinClass?: string;
    date?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  },
  adminEmail?: string
) {
  const url = new URL(`${BASE_URL}/admin/passengers`, window.location.origin);
  if (params?.search) url.searchParams.set('search', params.search);
  if (params?.bookingStatus) url.searchParams.set('bookingStatus', params.bookingStatus);
  if (params?.airline) url.searchParams.set('airline', params.airline);
  if (params?.cabinClass) url.searchParams.set('cabinClass', params.cabinClass);
  if (params?.date) url.searchParams.set('date', params.date);
  if (params?.sortBy) url.searchParams.set('sortBy', params.sortBy);
  if (params?.sortOrder) url.searchParams.set('sortOrder', params.sortOrder);
  if (params?.page) url.searchParams.set('page', params.page.toString());
  if (params?.limit) url.searchParams.set('limit', params.limit.toString());

  const headers: Record<string, string> = {};
  if (adminEmail) {
    headers['x-admin-email'] = adminEmail;
    headers['Authorization'] = `Bearer ${adminEmail}`;
  }

  const res = await fetch(url.toString(), { headers });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to retrieve passenger reservations roster');
  }
  return res.json();
}

// -------------------------------------------------------------
// OVERVIEW & METRICS API (Strict Database Calculation)
// -------------------------------------------------------------
export async function fetchAdminMetrics(
  params?: {
    range?: 'all' | '7d' | '30d' | '90d' | 'custom';
    startDate?: string;
    endDate?: string;
  },
  adminEmail?: string
) {
  const url = new URL(`${BASE_URL}/admin/metrics`, window.location.origin);
  if (params?.range) url.searchParams.set('range', params.range);
  if (params?.startDate) url.searchParams.set('startDate', params.startDate);
  if (params?.endDate) url.searchParams.set('endDate', params.endDate);

  const headers: Record<string, string> = {};
  if (adminEmail) {
    headers['x-admin-email'] = adminEmail;
    headers['Authorization'] = `Bearer ${adminEmail}`;
  }

  const res = await fetch(url.toString(), { headers });
  if (!res.ok) throw new Error('Failed to retrieve overview metrics');
  return res.json();
}

// -------------------------------------------------------------
// BAGGAGE POLICIES APIS
// -------------------------------------------------------------
export async function fetchAdminBaggagePolicies(adminEmail?: string) {
  const headers: Record<string, string> = {};
  if (adminEmail) headers['x-admin-email'] = adminEmail;
  const res = await fetch(`${BASE_URL}/admin/baggage-policies`, { headers });
  if (!res.ok) throw new Error('Failed to load baggage policies');
  return res.json();
}

export async function updateAdminBaggagePolicies(payload: any, adminEmail?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (adminEmail) headers['x-admin-email'] = adminEmail;
  const res = await fetch(`${BASE_URL}/admin/baggage-policies`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update baggage policies');
  return data;
}

// Development Email Test Lab API methods
export async function fetchDevEmailTemplates() {
  const res = await fetch(`${BASE_URL}/dev/email-templates`);
  if (!res.ok) throw new Error('Failed to load email templates');
  return res.json();
}

export async function testDispatchEmail(payload: {
  templateType: string;
  targetEmail: string;
  mode: 'SIMULATED' | 'REAL_RESEND_TEST_RECIPIENT';
}) {
  const res = await fetch(`${BASE_URL}/dev/test-dispatch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  return data;
}

export async function testOtpLifecycle(email?: string) {
  const res = await fetch(`${BASE_URL}/dev/test-otp-lifecycle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to test OTP lifecycle');
  return data;
}

export async function fetchRecipientAudit() {
  const res = await fetch(`${BASE_URL}/dev/recipient-mapping-audit`);
  if (!res.ok) throw new Error('Failed to load recipient mapping audit');
  return res.json();
}


