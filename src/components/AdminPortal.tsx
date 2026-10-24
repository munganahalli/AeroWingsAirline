import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowDownUp,
  ArrowRight,
  Briefcase,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  CloudLightning,
  CloudRain,
  CreditCard,
  DollarSign,
  Download,
  Eye,
  Filter,
  Globe,
  Key,
  Luggage,
  Mail,
  Plane,
  Plus,
  Radio,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  TrendingUp,
  User,
  UserCheck,
  UserPlus,
  Users,
  Wind,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useCurrency } from '../context/CurrencyContext.tsx';
import {
  addAdminFlight,
  checkAndProtectBookingWeather,
  createAdminUser,
  deleteAdminUser,
  fetchAdminBaggagePolicies,
  fetchAdminBookings,
  fetchAdminEmails,
  fetchAdminMetrics,
  fetchAdminPassengers,
  fetchAdminUsers,
  fetchFlightWeather,
  fetchFlights,
  runAdminWeatherProtectionSweep,
  updateAdminBaggagePolicies,
  updateAdminBookingStatus,
  updateAdminFlight,
  updateAdminUserRole,
} from '../lib/api.ts';
import type { Booking, EmailLog, Flight } from '../types/index.ts';

export function AdminPortal() {
  const { user, login } = useAuth();
  const { currency, setCurrency, allCurrencies, formatPrice, convertPrice, rateSource, lastUpdated: ratesUpdated } = useCurrency();
  const isAdmin = user?.role === 'admin' || user?.email.toLowerCase() === 'akm@gmail.com' || user?.email.toLowerCase() === 'admin@aerowings.com';

  // Admin sign-in form state if not authenticated as admin (No credentials displayed or pre-filled)
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  // Active Admin Tab
  const [activeTab, setActiveTab] = useState<'metrics' | 'bookings' | 'users' | 'passengers' | 'flights' | 'baggage' | 'emails'>('bookings');

  // Real-time live connection state
  const [liveStatus, setLiveStatus] = useState<'connected' | 'reconnecting' | 'polling'>('connected');
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>(new Date().toISOString());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Weather Sweep & Auto-Refund State
  const [sweepingWeather, setSweepingWeather] = useState(false);
  const [weatherSweepMessage, setWeatherSweepMessage] = useState<string | null>(null);

  // ==========================================
  // TAB 1: ALL DATABASE BOOKINGS STATE
  // ==========================================
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsTotal, setBookingsTotal] = useState(0);
  const [bookingsPage, setBookingsPage] = useState(1);
  const [bookingsLimit, setBookingsLimit] = useState(10);
  const [bookingsTotalPages, setBookingsTotalPages] = useState(1);
  const [bookingsSummary, setBookingsSummary] = useState<any>({});
  const [bookingsLoading, setBookingsLoading] = useState(false);

  // Booking filters & search
  const [bookingSearch, setBookingSearch] = useState('');
  const [filterBookingStatus, setFilterBookingStatus] = useState('ALL');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('ALL');
  const [filterAirline, setFilterAirline] = useState('ALL');
  const [filterRoute, setFilterRoute] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [bookingSortBy, setBookingSortBy] = useState<'createdAt' | 'totalAmount' | 'departureTime' | 'pnr'>('createdAt');
  const [bookingSortOrder, setBookingSortOrder] = useState<'asc' | 'desc'>('desc');

  // Detail Modal & Status Update Modal
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [statusUpdateModalBooking, setStatusUpdateModalBooking] = useState<Booking | null>(null);
  const [newBookingStatus, setNewBookingStatus] = useState<'CONFIRMED' | 'CANCELLED' | 'PENDING'>('CONFIRMED');
  const [newPaymentStatus, setNewPaymentStatus] = useState<'PAID' | 'PENDING' | 'REFUNDED'>('PAID');
  const [statusUpdateReason, setStatusUpdateReason] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusSuccessMessage, setStatusSuccessMessage] = useState<string | null>(null);

  // ==========================================
  // TAB 2: COMPLETE PASSENGER ROSTER STATE
  // ==========================================
  const [passengers, setPassengers] = useState<any[]>([]);
  const [passengersTotal, setPassengersTotal] = useState(0);
  const [passengersBookingCount, setPassengersBookingCount] = useState(0);
  const [passengersPage, setPassengersPage] = useState(1);
  const [passengersLimit, setPassengersLimit] = useState(15);
  const [passengersTotalPages, setPassengersTotalPages] = useState(1);
  const [passengersLoading, setPassengersLoading] = useState(false);

  // Passenger filters & search
  const [passengerSearch, setPassengerSearch] = useState('');
  const [paxFilterStatus, setPaxFilterStatus] = useState('ALL');
  const [paxFilterAirline, setPaxFilterAirline] = useState('ALL');
  const [paxFilterCabin, setPaxFilterCabin] = useState('ALL');
  const [paxSortBy, setPaxSortBy] = useState('bookingCreatedAt');
  const [paxSortOrder, setPaxSortOrder] = useState<'asc' | 'desc'>('desc');

  // ==========================================
  // TAB 3: OVERVIEW & METRICS STATE
  // ==========================================
  const [metrics, setMetrics] = useState<any>(null);
  const [metricsRange, setMetricsRange] = useState<'all' | '7d' | '30d' | '90d' | 'custom'>('all');
  const [metricsCustomStart, setMetricsCustomStart] = useState('');
  const [metricsCustomEnd, setMetricsCustomEnd] = useState('');
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsReportingCurrency, setMetricsReportingCurrency] = useState<'USD' | 'SELECTED'>('USD');

  // ==========================================
  // TAB 4: FLIGHT OPERATIONS & WEATHER RISK
  // ==========================================
  const [flights, setFlights] = useState<Flight[]>([]);
  const [flightsLoading, setFlightsLoading] = useState(false);
  const [showAddFlight, setShowAddFlight] = useState(false);
  const [newFlightNumber, setNewFlightNumber] = useState('AW-408');
  const [newOrigin, setNewOrigin] = useState('DEL');
  const [newDestination, setNewDestination] = useState('LHR');
  const [newAircraft, setNewAircraft] = useState('Airbus A350-900');
  const [newEconomyPrice, setNewEconomyPrice] = useState(550);

  // Weather modal state
  const [weatherFlight, setWeatherFlight] = useState<Flight | null>(null);
  const [flightWeatherReport, setFlightWeatherReport] = useState<any | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  // ==========================================
  // TAB 5: BAGGAGE POLICIES & MANAGEMENT
  // ==========================================
  const [baggagePolicies, setBaggagePolicies] = useState<any[]>([]);
  const [baggageOptions, setBaggageOptions] = useState<any[]>([]);
  const [baggageLoading, setBaggageLoading] = useState(false);
  const [editingBaggageOption, setEditingBaggageOption] = useState<any | null>(null);

  // ==========================================
  // TAB 6: EMAIL AUDIT LOG
  // ==========================================
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [emailSearch, setEmailSearch] = useState('');

  // ==========================================
  // TAB 7: USERS & ACCOUNTS (Live Database Store)
  // ==========================================
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersSummary, setUsersSummary] = useState<any>({ total: 0, admins: 0, customers: 0 });
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'ALL' | 'admin' | 'customer'>('ALL');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'customer'>('customer');
  const [userActionLoading, setUserActionLoading] = useState(false);
  const [userActionMessage, setUserActionMessage] = useState<string | null>(null);
  const [userActionError, setUserActionError] = useState<string | null>(null);

  // Refs to allow stable SSE message handling without tearing down connections on filter change
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;
  const loadAdminBookingsRef = useRef<() => void>(() => {});
  const loadAdminPassengersRef = useRef<() => void>(() => {});
  const loadAdminMetricsRef = useRef<() => void>(() => {});
  const loadAdminFlightsRef = useRef<() => void>(() => {});
  const loadAdminUsersRef = useRef<() => void>(() => {});

  // -------------------------------------------------------------
  // SSE REAL-TIME SUBSCRIPTION (Live Booking & Operations Sync)
  // -------------------------------------------------------------
  useEffect(() => {
    if (!isAdmin) return;

    let eventSource: EventSource | null = null;
    let pollInterval: any = null;
    let isMounted = true;

    const connectSSE = () => {
      try {
        const sseUrl = `/api/admin/live-stream?adminEmail=${encodeURIComponent(user?.email || 'akm@gmail.com')}`;
        eventSource = new EventSource(sseUrl);

        eventSource.onopen = () => {
          if (isMounted) setLiveStatus('connected');
        };

        eventSource.onmessage = (e) => {
          try {
            const parsed = JSON.parse(e.data);
            if (parsed.type === 'HEARTBEAT') return;

            if (isMounted) setLastRefreshedAt(new Date().toISOString());

            // Auto-refresh queries based on active tab
            if (activeTabRef.current === 'bookings') {
              loadAdminBookingsRef.current();
            } else if (activeTabRef.current === 'users') {
              loadAdminUsersRef.current();
            } else if (activeTabRef.current === 'passengers') {
              loadAdminPassengersRef.current();
            } else if (activeTabRef.current === 'metrics') {
              loadAdminMetricsRef.current();
            } else if (activeTabRef.current === 'flights') {
              loadAdminFlightsRef.current();
            }
          } catch {
            // Ignore parse errors on heartbeat comments
          }
        };

        eventSource.onerror = () => {
          if (isMounted) setLiveStatus('reconnecting');
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          // Retry connection after 4 seconds
          setTimeout(() => {
            if (isMounted) connectSSE();
          }, 4000);
        };
      } catch {
        if (isMounted) setLiveStatus('polling');
      }
    };

    connectSSE();

    // Live background polling interval every 4 seconds to guarantee instantaneous updates
    pollInterval = setInterval(() => {
      if (isAdmin && isMounted) {
        if (activeTabRef.current === 'bookings') loadAdminBookingsRef.current();
        else if (activeTabRef.current === 'users') loadAdminUsersRef.current();
        else if (activeTabRef.current === 'metrics') loadAdminMetricsRef.current();
      }
    }, 4000);

    return () => {
      isMounted = false;
      if (eventSource) eventSource.close();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [isAdmin, user?.email]);

  // Tab & Filters Reactivity
  useEffect(() => {
    if (isAdmin && activeTab === 'bookings') {
      loadAdminBookings();
    }
  }, [isAdmin, activeTab, bookingsPage, bookingsLimit, bookingSearch, filterBookingStatus, filterPaymentStatus, filterAirline, filterRoute, filterStartDate, filterEndDate, bookingSortBy, bookingSortOrder]);

  useEffect(() => {
    if (isAdmin && activeTab === 'passengers') {
      loadAdminPassengers();
    }
  }, [isAdmin, activeTab, passengersPage, passengersLimit, passengerSearch, paxFilterStatus, paxFilterAirline, paxFilterCabin, paxSortBy, paxSortOrder]);

  useEffect(() => {
    if (isAdmin && activeTab === 'metrics') {
      loadAdminMetrics();
    }
  }, [isAdmin, activeTab, metricsRange, metricsCustomStart, metricsCustomEnd]);

  useEffect(() => {
    if (isAdmin && activeTab === 'users') {
      loadAdminUsers();
    }
  }, [isAdmin, activeTab, userSearch, userRoleFilter]);

  useEffect(() => {
    if (isAdmin) {
      if (activeTab === 'flights') loadAdminFlights();
      else if (activeTab === 'baggage') loadAdminBaggage();
      else if (activeTab === 'emails') loadAdminEmails();
      else if (activeTab === 'users') loadAdminUsers();
    }
  }, [isAdmin, activeTab]);

  // ==========================================
  // DATA LOADERS
  // ==========================================
  const loadAdminBookings = async (silent = false) => {
    if (!silent) setBookingsLoading(true);
    try {
      const data = await fetchAdminBookings(
        {
          search: bookingSearch || undefined,
          bookingStatus: filterBookingStatus !== 'ALL' ? filterBookingStatus : undefined,
          paymentStatus: filterPaymentStatus !== 'ALL' ? filterPaymentStatus : undefined,
          airline: filterAirline !== 'ALL' ? filterAirline : undefined,
          route: filterRoute || undefined,
          startDate: filterStartDate || undefined,
          endDate: filterEndDate || undefined,
          sortBy: bookingSortBy,
          sortOrder: bookingSortOrder,
          page: bookingsPage,
          limit: bookingsLimit,
        },
        user?.email
      );

      setBookings(data.bookings || []);
      setBookingsTotal(data.total || 0);
      setBookingsTotalPages(data.totalPages || 1);
      setBookingsSummary(data.summary || {});
      setLastRefreshedAt(new Date().toISOString());
    } catch (err) {
      console.error('Failed to load admin bookings', err);
    } finally {
      if (!silent) setBookingsLoading(false);
    }
  };

  const loadAdminPassengers = async (silent = false) => {
    if (!silent) setPassengersLoading(true);
    try {
      const data = await fetchAdminPassengers(
        {
          search: passengerSearch || undefined,
          bookingStatus: paxFilterStatus !== 'ALL' ? paxFilterStatus : undefined,
          airline: paxFilterAirline !== 'ALL' ? paxFilterAirline : undefined,
          cabinClass: paxFilterCabin !== 'ALL' ? paxFilterCabin : undefined,
          sortBy: paxSortBy,
          sortOrder: paxSortOrder,
          page: passengersPage,
          limit: passengersLimit,
        },
        user?.email
      );

      setPassengers(data.passengers || []);
      setPassengersTotal(data.total || 0);
      setPassengersBookingCount(data.bookingCount || 0);
      setPassengersTotalPages(data.totalPages || 1);
      setLastRefreshedAt(new Date().toISOString());
    } catch (err) {
      console.error('Failed to load passenger roster', err);
    } finally {
      if (!silent) setPassengersLoading(false);
    }
  };

  const loadAdminMetrics = async (silent = false) => {
    if (!silent) setMetricsLoading(true);
    try {
      const data = await fetchAdminMetrics(
        {
          range: metricsRange,
          startDate: metricsRange === 'custom' ? metricsCustomStart : undefined,
          endDate: metricsRange === 'custom' ? metricsCustomEnd : undefined,
        },
        user?.email
      );
      setMetrics(data);
      setLastRefreshedAt(new Date().toISOString());
    } catch (err) {
      console.error('Failed to load overview metrics', err);
    } finally {
      if (!silent) setMetricsLoading(false);
    }
  };

  const loadAdminFlights = async () => {
    setFlightsLoading(true);
    try {
      const data = await fetchFlights();
      setFlights(data);
      setLastRefreshedAt(new Date().toISOString());
    } catch (err) {
      console.error('Failed to load flights', err);
    } finally {
      setFlightsLoading(false);
    }
  };

  const loadAdminBaggage = async () => {
    setBaggageLoading(true);
    try {
      const data = await fetchAdminBaggagePolicies(user?.email);
      setBaggagePolicies(data.policies || []);
      setBaggageOptions(data.options || []);
      setLastRefreshedAt(new Date().toISOString());
    } catch (err) {
      console.error('Failed to load baggage policies', err);
    } finally {
      setBaggageLoading(false);
    }
  };

  const loadAdminEmails = async () => {
    try {
      const data = await fetchAdminEmails(user?.email);
      setEmailLogs(data);
      setLastRefreshedAt(new Date().toISOString());
    } catch (err) {
      console.error('Failed to load email logs', err);
    }
  };

  const loadAdminUsers = async (silent = false) => {
    if (!silent) setUsersLoading(true);
    try {
      const data = await fetchAdminUsers(
        {
          search: userSearch || undefined,
          role: userRoleFilter !== 'ALL' ? userRoleFilter : undefined,
        },
        user?.email
      );
      setAdminUsers(data.users || []);
      setUsersTotal(data.total || 0);
      setUsersSummary(data.summary || { total: 0, admins: 0, customers: 0 });
      setLastRefreshedAt(new Date().toISOString());
    } catch (err) {
      console.error('Failed to load registered users store', err);
    } finally {
      if (!silent) setUsersLoading(false);
    }
  };

  // Wire up live refs so SSE & periodic polling invoke latest loaders without re-renders
  loadAdminBookingsRef.current = () => loadAdminBookings(true);
  loadAdminPassengersRef.current = () => loadAdminPassengers(true);
  loadAdminMetricsRef.current = () => loadAdminMetrics(true);
  loadAdminFlightsRef.current = () => loadAdminFlights();
  loadAdminUsersRef.current = () => loadAdminUsers(true);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (activeTab === 'bookings') await loadAdminBookings();
      else if (activeTab === 'users') await loadAdminUsers();
      else if (activeTab === 'passengers') await loadAdminPassengers();
      else if (activeTab === 'metrics') await loadAdminMetrics();
      else if (activeTab === 'flights') await loadAdminFlights();
      else if (activeTab === 'baggage') await loadAdminBaggage();
      else if (activeTab === 'emails') await loadAdminEmails();
    } finally {
      setIsRefreshing(false);
    }
  };

  // -------------------------------------------------------------
  // USER ACCOUNTS MANAGEMENT ACTIONS
  // -------------------------------------------------------------
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserActionLoading(true);
    setUserActionError(null);
    setUserActionMessage(null);
    try {
      await createAdminUser(
        {
          name: newUserName.trim(),
          email: newUserEmail.trim(),
          password: newUserPassword,
          role: newUserRole,
        },
        user?.email
      );
      setUserActionMessage(`User account for ${newUserName} created successfully.`);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('customer');
      setTimeout(() => {
        setShowAddUserModal(false);
        setUserActionMessage(null);
      }, 1000);
      loadAdminUsers();
    } catch (err: any) {
      setUserActionError(err.message || 'Failed to create user account');
    } finally {
      setUserActionLoading(false);
    }
  };

  const handleChangeUserRole = async (targetUserId: string, targetUserEmail: string, currentRole: 'admin' | 'customer') => {
    const nextRole = currentRole === 'admin' ? 'customer' : 'admin';
    const confirmPrompt = window.confirm(
      `Are you sure you want to change ${targetUserEmail}'s role from ${currentRole.toUpperCase()} to ${nextRole.toUpperCase()}?`
    );
    if (!confirmPrompt) return;
    try {
      await updateAdminUserRole(targetUserId, nextRole, user?.email);
      loadAdminUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to update user role');
    }
  };

  const handleDeleteUser = async (targetUserId: string, targetUserEmail: string) => {
    if (targetUserEmail.toLowerCase() === user?.email.toLowerCase()) {
      alert('You cannot delete your own active administrator account.');
      return;
    }
    const confirmPrompt = window.confirm(
      `Are you sure you want to permanently delete user account ${targetUserEmail}? This action cannot be undone.`
    );
    if (!confirmPrompt) return;
    try {
      await deleteAdminUser(targetUserId, user?.email);
      loadAdminUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to delete user account');
    }
  };

  // -------------------------------------------------------------
  // STATUS UPDATE WORKFLOW
  // -------------------------------------------------------------
  const handleOpenStatusModal = (booking: Booking) => {
    setStatusUpdateModalBooking(booking);
    setNewBookingStatus(booking.bookingStatus);
    setNewPaymentStatus(booking.paymentStatus);
    setStatusUpdateReason(booking.cancellationReason || '');
    setStatusSuccessMessage(null);
  };

  const handleSaveStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusUpdateModalBooking) return;
    setStatusUpdating(true);
    try {
      const res = await updateAdminBookingStatus(
        statusUpdateModalBooking.id,
        {
          bookingStatus: newBookingStatus,
          paymentStatus: newPaymentStatus,
          cancellationReason: statusUpdateReason || undefined,
        },
        user?.email
      );

      setStatusSuccessMessage(`Status updated to ${newBookingStatus} (${newPaymentStatus}) successfully.`);
      setTimeout(() => {
        setStatusUpdateModalBooking(null);
        loadAdminBookings();
        if (selectedBooking?.id === statusUpdateModalBooking.id) {
          setSelectedBooking(res.booking);
        }
      }, 700);
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    } finally {
      setStatusUpdating(false);
    }
  };

  // -------------------------------------------------------------
  // WEATHER REPORT INSPECTOR
  // -------------------------------------------------------------
  const handleInspectWeather = async (flight: Flight) => {
    setWeatherFlight(flight);
    setWeatherLoading(true);
    try {
      const report = await fetchFlightWeather(flight.id);
      setFlightWeatherReport(report);
    } catch (err: any) {
      console.error('Failed to load weather report', err);
      setFlightWeatherReport(null);
    } finally {
      setWeatherLoading(false);
    }
  };

  // -------------------------------------------------------------
  // CREATE NEW FLIGHT SCHEDULE
  // -------------------------------------------------------------
  const handleCreateFlight = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await addAdminFlight(
        {
          flightNumber: newFlightNumber,
          aircraft: newAircraft,
          originCode: newOrigin,
          destinationCode: newDestination,
          prices: {
            economy: Number(newEconomyPrice),
            premiumEconomy: Math.round(Number(newEconomyPrice) * 1.6),
            business: Math.round(Number(newEconomyPrice) * 3.2),
            first: Math.round(Number(newEconomyPrice) * 6),
          },
        },
        user?.email
      );
      setFlights([created, ...flights]);
      setShowAddFlight(false);
    } catch (err) {
      console.error('Failed to create flight', err);
    }
  };

  const handleFlightStatusChange = async (flightId: string, status: string) => {
    try {
      await updateAdminFlight(flightId, { status }, user?.email);
      setFlights((prev) => prev.map((f) => (f.id === flightId ? { ...f, status: status as any } : f)));
    } catch (err) {
      console.error('Failed to update flight status', err);
    }
  };

  // -------------------------------------------------------------
  // ADMIN AUTHENTICATION FORM (For Restricted Access)
  // -------------------------------------------------------------
  const handleAdminSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!adminEmail.trim() || !adminPassword) {
      setAuthError('Please enter both administrator email and password.');
      return;
    }
    setLoggingIn(true);
    try {
      const loggedUser = await login(adminEmail.trim().toLowerCase(), adminPassword);
      if (loggedUser.role !== 'admin') {
        setAuthError('Access restricted: Authorized administrator account credentials required.');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Administrator authentication failed. Please verify credentials.');
    } finally {
      setLoggingIn(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-6">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-900 mb-3 shadow-xs">
              <Shield className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-900">Restricted Operations</span>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">Admin Portal Sign In</h2>
            <p className="text-xs text-slate-500 mt-1">
              Authorized AeroWings flight operations and system administrators only
            </p>
          </div>

          {authError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleAdminSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Admin Email</label>
              <input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="name@domain.com"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-700 focus:bg-white transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Admin Password</label>
              <input
                type="password"
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-700 focus:bg-white transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loggingIn}
              className="w-full py-3 px-4 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl transition-colors disabled:opacity-50 text-sm shadow-xs"
            >
              {loggingIn ? 'Authenticating Admin...' : 'Sign In as Administrator'}
            </button>
          </form>

          <p className="text-[11px] text-center text-slate-400">
            Administrative sessions are securely authenticated and audited server-side.
          </p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // REVENUE & CURRENCY CONVERSION REPORTING HELPER
  // -------------------------------------------------------------
  const displayRevenue = (usdVal: number) => {
    if (currency.code !== 'USD') {
      const converted = convertPrice(usdVal);
      return `${currency.symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency.code}`;
    }
    return `$${usdVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;
  };

  const handleAdminWeatherSweep = async (simulateBad = false) => {
    setSweepingWeather(true);
    setWeatherSweepMessage(null);
    try {
      const res = await runAdminWeatherProtectionSweep(simulateBad, user?.email);
      setWeatherSweepMessage(res.message);
      loadAdminBookings();
      loadAdminMetrics();
      loadAdminFlights();
    } catch (err: any) {
      alert(err.message || 'Weather protection sweep failed');
    } finally {
      setSweepingWeather(false);
    }
  };

  const handleSingleBookingWeatherCheck = async (booking: Booking, simulateAdverse = false) => {
    try {
      const res = await checkAndProtectBookingWeather(booking.id, simulateAdverse);
      if (res.cancelled) {
        alert(`Adverse Weather Alert! Flight ${booking.flight.flightNumber} has been automatically cancelled due to adverse weather. Full 100% refund of $${res.refundAmount} USD (${formatPrice(res.refundAmount)}) credited to customer database.`);
      } else {
        alert(`Weather Clear! Flight ${booking.flight.flightNumber} (${booking.flight.origin.code} → ${booking.flight.destination.code}) cleared with safe meteorological conditions.`);
      }
      loadAdminBookings();
      loadAdminMetrics();
    } catch (err: any) {
      alert(err.message || 'Weather check failed');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Header with Realtime Connection Status & Last Refresh */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-blue-900 font-bold tracking-wider uppercase">
            <ShieldCheck className="w-4 h-4 text-blue-800" />
            <span>AeroWings Airline Flight Operations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">Admin Portal</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real database reservations roster, flight dispatch, weather risk, and live revenue analytics
          </p>
        </div>

        {/* Live Status Indicator & Refresh CTA */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Connection status pill */}
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-xs ${
              liveStatus === 'connected'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : liveStatus === 'reconnecting'
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-blue-50 border-blue-200 text-blue-900'
            }`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                liveStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span>
              {liveStatus === 'connected'
                ? 'Live SSE Connected'
                : liveStatus === 'reconnecting'
                ? 'Reconnecting Live Stream...'
                : 'Polling Mode Active'}
            </span>
          </div>

          <div className="text-[11px] text-slate-500 hidden sm:block">
            Refreshed: <span className="font-mono font-medium">{new Date(lastRefreshedAt).toLocaleTimeString()}</span>
          </div>

          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 shadow-xs transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-900' : ''}`} />
            <span>Refresh Now</span>
          </button>
        </div>
      </div>

      {/* Admin Multi-Currency Converter Bar */}
      <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-900 shrink-0">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Admin Financial Conversion Currency
              </span>
              <span className="px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-900 font-mono text-[10px] font-bold">
                {currency.code} ({currency.symbol}) Active
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Live Exchange: <span className="font-mono font-bold text-slate-800">1 USD = {currency.rateFromUSD} {currency.code}</span> ({currency.name}). All database metrics, bookings & refunds convert live.
            </p>
          </div>
        </div>

        {/* Currency selection buttons */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 border border-slate-200 rounded-xl">
          {allCurrencies.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => {
                setCurrency(c.code as any);
                setMetricsReportingCurrency('SELECTED');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                currency.code === c.code
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-200/70'
              }`}
            >
              <span>{c.flag}</span>
              <span className="font-mono">{c.code}</span>
              <span className="text-[10px] opacity-80 font-normal">({c.symbol})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Weather Sweep Notification if triggered */}
      {weatherSweepMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{weatherSweepMessage}</span>
          </div>
          <button
            onClick={() => setWeatherSweepMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Production-Facing Admin Navigation Tabs (Requirement 5: Unwanted sections eradicated!) */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 border border-slate-200 rounded-2xl overflow-x-auto shadow-xs">
        <button
          onClick={() => setActiveTab('bookings')}
          className={`px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'bookings'
              ? 'bg-blue-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>All Database Bookings</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-800 text-blue-100 font-mono">
            {bookingsSummary.totalCount ?? bookingsTotal}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'users'
              ? 'bg-blue-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Registered Users & Accounts</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-800 font-mono">
            {usersSummary.total || adminUsers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('passengers')}
          className={`px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'passengers'
              ? 'bg-blue-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Passenger Reservations Roster</span>
          {passengersTotal > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-800 font-mono">
              {passengersTotal}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('metrics')}
          className={`px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'metrics'
              ? 'bg-blue-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Overview & Metrics</span>
        </button>

        <button
          onClick={() => setActiveTab('flights')}
          className={`px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'flights'
              ? 'bg-blue-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <Plane className="w-3.5 h-3.5" />
          <span>Flight Operations & Weather Risk</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-800 font-mono">
            {flights.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('baggage')}
          className={`px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'baggage'
              ? 'bg-blue-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <Luggage className="w-3.5 h-3.5" />
          <span>Baggage Policies & Fees</span>
        </button>

        <button
          onClick={() => setActiveTab('emails')}
          className={`px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'emails'
              ? 'bg-blue-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Email Audit Logs</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* SECTION 1: ALL DATABASE BOOKINGS (Requirement 1) */}
      {/* ========================================================= */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          {/* Summary KPI Strip for Bookings */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Bookings</span>
              <div className="text-xl font-black text-slate-900 font-mono mt-0.5">{bookingsSummary.totalCount ?? bookingsTotal}</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Confirmed</span>
              <div className="text-xl font-black text-emerald-800 font-mono mt-0.5">{bookingsSummary.confirmedCount ?? 0}</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Pending</span>
              <div className="text-xl font-black text-amber-800 font-mono mt-0.5">{bookingsSummary.pendingCount ?? 0}</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">Cancelled</span>
              <div className="text-xl font-black text-rose-800 font-mono mt-0.5">{bookingsSummary.cancelledCount ?? 0}</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">Refunded</span>
              <div className="text-xl font-black text-blue-800 font-mono mt-0.5">{bookingsSummary.refundedCount ?? 0}</div>
            </div>
          </div>

          {/* Search, Filter & Controls Panel */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 items-center">
              {/* Search Bar */}
              <div className="lg:col-span-4 relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={bookingSearch}
                  onChange={(e) => {
                    setBookingSearch(e.target.value);
                    setBookingsPage(1);
                  }}
                  placeholder="Search PNR, name, email, flight..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-700 focus:bg-white"
                />
                {bookingSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setBookingSearch('');
                      setBookingsPage(1);
                    }}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Booking Status Filter */}
              <div className="lg:col-span-2">
                <select
                  value={filterBookingStatus}
                  onChange={(e) => {
                    setFilterBookingStatus(e.target.value);
                    setBookingsPage(1);
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-700"
                >
                  <option value="ALL">All Booking Statuses</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="PENDING">PENDING</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              {/* Payment Status Filter */}
              <div className="lg:col-span-2">
                <select
                  value={filterPaymentStatus}
                  onChange={(e) => {
                    setFilterPaymentStatus(e.target.value);
                    setBookingsPage(1);
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-700"
                >
                  <option value="ALL">All Payments</option>
                  <option value="PAID">PAID</option>
                  <option value="PENDING">PENDING</option>
                  <option value="REFUNDED">REFUNDED</option>
                </select>
              </div>

              {/* Airline Filter */}
              <div className="lg:col-span-2">
                <select
                  value={filterAirline}
                  onChange={(e) => {
                    setFilterAirline(e.target.value);
                    setBookingsPage(1);
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-700"
                >
                  <option value="ALL">All Airlines</option>
                  <option value="AeroWings">AeroWings</option>
                  <option value="IndiGo">IndiGo</option>
                  <option value="Air India">Air India</option>
                  <option value="Emirates">Emirates</option>
                  <option value="British Airways">British Airways</option>
                  <option value="Singapore Airlines">Singapore Airlines</option>
                </select>
              </div>

              {/* Sort By Selector */}
              <div className="lg:col-span-2 flex items-center gap-1.5">
                <select
                  value={bookingSortBy}
                  onChange={(e) => setBookingSortBy(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-700"
                >
                  <option value="createdAt">Date Booked</option>
                  <option value="totalAmount">Amount</option>
                  <option value="departureTime">Departure</option>
                  <option value="pnr">PNR Code</option>
                </select>
                <button
                  type="button"
                  onClick={() => setBookingSortOrder(bookingSortOrder === 'asc' ? 'desc' : 'asc')}
                  className="p-2 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 shrink-0"
                  title={`Order: ${bookingSortOrder.toUpperCase()}`}
                >
                  <ArrowDownUp className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Date Filters Row */}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Booked between:</span>
                <input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => {
                    setFilterStartDate(e.target.value);
                    setBookingsPage(1);
                  }}
                  className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs"
                />
                <span className="text-slate-400">to</span>
                <input
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => {
                    setFilterEndDate(e.target.value);
                    setBookingsPage(1);
                  }}
                  className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs"
                />
                {(filterStartDate || filterEndDate || bookingSearch || filterBookingStatus !== 'ALL' || filterPaymentStatus !== 'ALL' || filterAirline !== 'ALL') && (
                  <button
                    type="button"
                    onClick={() => {
                      setBookingSearch('');
                      setFilterBookingStatus('ALL');
                      setFilterPaymentStatus('ALL');
                      setFilterAirline('ALL');
                      setFilterRoute('');
                      setFilterStartDate('');
                      setFilterEndDate('');
                      setBookingsPage(1);
                    }}
                    className="text-xs font-bold text-rose-600 hover:text-rose-800 ml-2"
                  >
                    Reset Filters
                  </button>
                )}
              </div>

              <div className="text-[11px] text-slate-500">
                Displaying {bookings.length} of {bookingsTotal} database records
              </div>
            </div>
          </div>

          {/* Bookings Table / Responsive View */}
          {bookingsLoading ? (
            <div className="p-16 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2 bg-white rounded-2xl border border-slate-200">
              <RefreshCw className="w-5 h-5 animate-spin text-blue-900" />
              <span>Querying persistent database bookings repository...</span>
            </div>
          ) : bookings.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <Briefcase className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">No Database Bookings Match Query</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No matching customer booking records found. Clear search filters or create a new booking through the customer portal.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 uppercase font-bold text-[11px]">
                      <th className="py-3.5 px-4">PNR / ID</th>
                      <th className="py-3.5 px-4">Customer & Contact</th>
                      <th className="py-3.5 px-4">Flight & Schedule</th>
                      <th className="py-3.5 px-4">Cabin & Seats</th>
                      <th className="py-3.5 px-4">Baggage</th>
                      <th className="py-3.5 px-4 text-right">Fare & Payment</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bookings.map((b) => {
                      const isConfirmed = b.bookingStatus === 'CONFIRMED';
                      const isCancelled = b.bookingStatus === 'CANCELLED';
                      const isPaid = b.paymentStatus === 'PAID';
                      const formattedDate = new Date(b.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
                      const formattedTime = new Date(b.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                      return (
                        <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* PNR & ID */}
                          <td className="py-3.5 px-4">
                            <span className="font-mono font-black text-sm text-blue-900 block">{b.pnr}</span>
                            <span className="text-[10px] text-slate-400 font-mono block truncate max-w-[90px]">{b.id}</span>
                            <span className="text-[10px] text-slate-500 mt-0.5 block">{formattedDate} {formattedTime}</span>
                          </td>

                          {/* Customer & Contact */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 truncate max-w-[150px]">{b.customerName || 'Registered Customer'}</div>
                            <div className="text-[11px] text-slate-500 font-mono truncate max-w-[150px]">{b.contactEmail}</div>
                            {b.contactPhone && <div className="text-[10px] text-slate-400 truncate">{b.contactPhone}</div>}
                          </td>

                          {/* Flight & Schedule */}
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                              <span className="text-blue-900 font-bold">{b.flight.origin.code}</span>
                              <span className="text-slate-400">→</span>
                              <span className="text-blue-900 font-bold">{b.flight.destination.code}</span>
                              <span className="font-mono text-[11px] text-slate-500">({b.flight.flightNumber})</span>
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              {b.flight.airline} • {b.flight.aircraft}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Dep: {new Date(b.flight.departureTime).toLocaleDateString([], { month: 'short', day: 'numeric' })} {new Date(b.flight.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>

                          {/* Cabin & Seats */}
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-800 capitalize text-xs">{b.cabinClass} Class</div>
                            <div className="text-[11px] text-slate-600 mt-0.5">
                              {b.passengers.length} Passenger{b.passengers.length > 1 ? 's' : ''}
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {b.passengers.map((p, idx) => (
                                <span key={idx} className="font-mono text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-semibold">
                                  {p.seatNumber || 'Unassigned'}
                                </span>
                              ))}
                            </div>
                          </td>

                          {/* Baggage */}
                          <td className="py-3.5 px-4 text-xs">
                            <span className="text-slate-700 block text-[11px]">
                              {b.baggageDetails?.checkedAllowanceSummary || 'Standard Included'}
                            </span>
                            {b.fareBreakdown.baggageFee && b.fareBreakdown.baggageFee > 0 ? (
                              <span className="text-[10px] text-blue-700 font-semibold font-mono block mt-0.5">
                                +{formatPrice(b.fareBreakdown.baggageFee)} Extra Bag
                              </span>
                            ) : (
                              <span className="text-[10px] text-emerald-700 font-medium">Included</span>
                            )}
                          </td>

                          {/* Fare & Payment */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="font-mono font-bold text-sm text-slate-900">
                              {formatPrice(b.fareBreakdown.totalAmount)}
                            </div>
                            {currency.code !== 'USD' && (
                              <div className="text-[10px] font-mono text-slate-400">
                                (${b.fareBreakdown.totalAmount.toFixed(2)} USD)
                              </div>
                            )}
                            <div className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[130px] ml-auto">
                              {b.paymentMethod}
                            </div>
                            {b.refundAmount && (
                              <div className="text-[10px] text-rose-600 font-mono font-semibold">
                                Refund: {formatPrice(b.refundAmount)}
                              </div>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="space-y-1 inline-block">
                              <span
                                className={`block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                  isConfirmed
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : isCancelled
                                    ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                                }`}
                              >
                                {b.bookingStatus}
                              </span>
                              <span
                                className={`block px-2 py-0.2 rounded text-[9px] font-mono font-semibold uppercase ${
                                  isPaid
                                    ? 'text-emerald-700'
                                    : b.paymentStatus === 'REFUNDED'
                                    ? 'text-rose-700'
                                    : 'text-amber-700'
                                }`}
                              >
                                {b.paymentStatus}
                              </span>
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setSelectedBooking(b)}
                              className="px-2.5 py-1 text-xs font-semibold text-blue-900 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200/60"
                              title="View full booking & passenger details"
                            >
                              Details
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenStatusModal(b)}
                              className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-300"
                              title="Authorized status updates"
                            >
                              Update Status
                            </button>
                            {b.bookingStatus === 'CONFIRMED' && (
                              <button
                                type="button"
                                onClick={() => handleSingleBookingWeatherCheck(b)}
                                className="px-2.5 py-1 text-xs font-semibold text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors border border-amber-300 inline-flex items-center gap-1"
                                title="Check real-time weather and auto-refund 100% if adverse"
                              >
                                <CloudRain className="w-3 h-3 text-amber-700" />
                                <span>Weather Auto-Check</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Friendly Card View for Bookings */}
              <div className="md:hidden divide-y divide-slate-100">
                {bookings.map((b) => (
                  <div key={b.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono font-black text-base text-blue-900 block">{b.pnr}</span>
                        <span className="text-[11px] text-slate-500 font-bold">{b.customerName}</span>
                        <div className="text-[10px] text-slate-400 font-mono">{b.contactEmail}</div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            b.bookingStatus === 'CONFIRMED'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : b.bookingStatus === 'CANCELLED'
                              ? 'bg-rose-50 text-rose-800 border border-rose-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {b.bookingStatus}
                        </span>
                        <div className="font-mono font-bold text-xs text-slate-900 mt-1">
                          {formatPrice(b.fareBreakdown.totalAmount)}
                        </div>
                        {currency.code !== 'USD' && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            (${b.fareBreakdown.totalAmount.toFixed(2)} USD)
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                      <div>
                        <span className="font-bold text-blue-900">{b.flight.origin.code} → {b.flight.destination.code}</span>
                        <span className="text-slate-500 text-[11px] block">{b.flight.flightNumber} ({b.flight.airline})</span>
                      </div>
                      <div className="text-right text-[11px] text-slate-600">
                        <span className="capitalize font-semibold block">{b.cabinClass}</span>
                        <span>{b.passengers.length} traveler{b.passengers.length > 1 ? 's' : ''}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setSelectedBooking(b)}
                        className="px-3 py-1.5 text-xs font-semibold text-blue-900 bg-blue-50 rounded-lg border border-blue-200"
                      >
                        Inspect Details
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenStatusModal(b)}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg border border-slate-300"
                      >
                        Update Status
                      </button>
                      {b.bookingStatus === 'CONFIRMED' && (
                        <button
                          type="button"
                          onClick={() => handleSingleBookingWeatherCheck(b)}
                          className="px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 rounded-lg border border-amber-300 flex items-center gap-1"
                          title="Check real-time weather and auto-refund 100% if adverse"
                        >
                          <CloudRain className="w-3 h-3 text-amber-700" />
                          <span>Weather Check</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              <div className="p-3 bg-slate-50/80 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-500">
                  <span>Page {bookingsPage} of {bookingsTotalPages}</span>
                  <span>•</span>
                  <span>Total {bookingsTotal} reservations</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-500">Rows per page:</span>
                    <select
                      value={bookingsLimit}
                      onChange={(e) => {
                        setBookingsLimit(Number(e.target.value));
                        setBookingsPage(1);
                      }}
                      className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-800"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={bookingsPage <= 1}
                      onClick={() => setBookingsPage((p) => Math.max(1, p - 1))}
                      className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      aria-label="Previous Page"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={bookingsPage >= bookingsTotalPages}
                      onClick={() => setBookingsPage((p) => Math.min(bookingsTotalPages, p + 1))}
                      className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      aria-label="Next Page"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 2: PASSENGER RESERVATIONS ROSTER (Requirement 2) */}
      {/* ========================================================= */}
      {activeTab === 'passengers' && (
        <div className="space-y-4">
          {/* Passenger Roster Search and Filter Header */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-900" />
                  <span>Complete Passenger Reservations Manifest</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Direct database records representing {passengersTotal} passenger manifests across {passengersBookingCount} distinct flight bookings
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-blue-900 bg-blue-50 border border-blue-200 px-3 py-1 rounded-xl font-mono">
                  {passengersTotal} Passengers • {passengersBookingCount} Bookings
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 items-center">
              <div className="lg:col-span-4 relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={passengerSearch}
                  onChange={(e) => {
                    setPassengerSearch(e.target.value);
                    setPassengersPage(1);
                  }}
                  placeholder="Search passenger name, PNR, passport..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-700 focus:bg-white"
                />
                {passengerSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setPassengerSearch('');
                      setPassengersPage(1);
                    }}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="lg:col-span-2">
                <select
                  value={paxFilterStatus}
                  onChange={(e) => {
                    setPaxFilterStatus(e.target.value);
                    setPassengersPage(1);
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-700"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="PENDING">PENDING</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <div className="lg:col-span-2">
                <select
                  value={paxFilterCabin}
                  onChange={(e) => {
                    setPaxFilterCabin(e.target.value);
                    setPassengersPage(1);
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-700"
                >
                  <option value="ALL">All Cabin Classes</option>
                  <option value="economy">Economy</option>
                  <option value="premiumEconomy">Premium Economy</option>
                  <option value="business">Business</option>
                  <option value="first">First Class</option>
                </select>
              </div>

              <div className="lg:col-span-2">
                <select
                  value={paxFilterAirline}
                  onChange={(e) => {
                    setPaxFilterAirline(e.target.value);
                    setPassengersPage(1);
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-700"
                >
                  <option value="ALL">All Airlines</option>
                  <option value="AeroWings">AeroWings</option>
                  <option value="IndiGo">IndiGo</option>
                  <option value="Air India">Air India</option>
                  <option value="Emirates">Emirates</option>
                  <option value="British Airways">British Airways</option>
                  <option value="Singapore Airlines">Singapore Airlines</option>
                </select>
              </div>

              <div className="lg:col-span-2 flex items-center gap-1.5">
                <select
                  value={paxSortBy}
                  onChange={(e) => setPaxSortBy(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-700"
                >
                  <option value="bookingCreatedAt">Booking Date</option>
                  <option value="fullName">Passenger Name</option>
                  <option value="departureTime">Travel Date</option>
                  <option value="flightNumber">Flight Number</option>
                  <option value="pnr">PNR Reference</option>
                </select>
                <button
                  type="button"
                  onClick={() => setPaxSortOrder(paxSortOrder === 'asc' ? 'desc' : 'asc')}
                  className="p-2 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 shrink-0"
                  title={`Order: ${paxSortOrder.toUpperCase()}`}
                >
                  <ArrowDownUp className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Passenger Manifest Table */}
          {passengersLoading ? (
            <div className="p-16 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2 bg-white rounded-2xl border border-slate-200">
              <RefreshCw className="w-5 h-5 animate-spin text-blue-900" />
              <span>Compiling passenger reservations roster from database...</span>
            </div>
          ) : passengers.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <Users className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">No Passenger Manifests Found</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No passenger records matched the active filters. Try resetting search filters.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 uppercase font-bold text-[11px]">
                      <th className="py-3.5 px-4">Passenger Name</th>
                      <th className="py-3.5 px-4">PNR / Booking</th>
                      <th className="py-3.5 px-4">Travel ID / Passport</th>
                      <th className="py-3.5 px-4">Flight & Routing</th>
                      <th className="py-3.5 px-4">Travel Date</th>
                      <th className="py-3.5 px-4">Cabin & Seat</th>
                      <th className="py-3.5 px-4">Baggage</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4">Contact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {passengers.map((p, idx) => (
                      <tr key={`${p.bookingId}_${p.passengerId}_${idx}`} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 text-sm">{p.fullName}</div>
                          <div className="text-[10px] text-slate-400 capitalize">
                            {p.gender} • DOB: {p.dateOfBirth} • {p.mealPreference}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono font-black text-blue-900 block text-xs">{p.pnr}</span>
                          <span className="text-[10px] text-slate-400 font-mono truncate max-w-[80px] block">{p.bookingId}</span>
                        </td>
                        <td className="py-3 px-4 font-mono font-medium text-slate-700">
                          <div>{p.passportNumber}</div>
                          <div className="text-[10px] text-slate-400 font-sans">{p.nationality}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">
                            {p.route} <span className="font-mono text-blue-800 font-bold">({p.flightNumber})</span>
                          </div>
                          <div className="text-[10px] text-slate-500">{p.airline}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-slate-800 font-medium">
                            {new Date(p.departureTime).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {new Date(p.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="capitalize font-semibold text-slate-900 block">{p.cabinClass}</span>
                          <span className="font-mono font-bold text-blue-900 text-xs px-1.5 py-0.2 rounded bg-blue-50 border border-blue-200">
                            Seat {p.seatNumber}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[11px] text-slate-600">
                          <div>{p.baggage?.checkedAllowance || '15/23 kg Included'}</div>
                          {p.baggage?.extraFeeUSD && p.baggage.extraFeeUSD > 0 && (
                            <div className="text-[10px] text-blue-700 font-mono font-bold">
                              +{formatPrice(p.baggage.extraFeeUSD)} {p.baggage.extraOptionTitle || 'Add-on'}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              p.bookingStatus === 'CONFIRMED'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : p.bookingStatus === 'CANCELLED'
                                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {p.bookingStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-600 truncate max-w-[130px]">
                          <div>{p.contactEmail}</div>
                          {p.contactPhone && <div className="text-[10px] text-slate-400">{p.contactPhone}</div>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Roster Pagination */}
              <div className="p-3 bg-slate-50/80 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-500">
                  <span>Page {passengersPage} of {passengersTotalPages}</span>
                  <span>•</span>
                  <span>{passengersTotal} Total Passengers</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-500">Rows:</span>
                    <select
                      value={passengersLimit}
                      onChange={(e) => {
                        setPassengersLimit(Number(e.target.value));
                        setPassengersPage(1);
                      }}
                      className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-800"
                    >
                      <option value={15}>15</option>
                      <option value={30}>30</option>
                      <option value={50}>50</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={passengersPage <= 1}
                      onClick={() => setPassengersPage((p) => Math.max(1, p - 1))}
                      className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={passengersPage >= passengersTotalPages}
                      onClick={() => setPassengersPage((p) => Math.min(passengersTotalPages, p + 1))}
                      className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 3: OVERVIEW & METRICS (Requirement 6) */}
      {/* ========================================================= */}
      {activeTab === 'metrics' && (
        <div className="space-y-6">
          {/* Top Controls: Date Range Filter & Reporting Currency */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">Time Horizon:</span>
              {(['all', '7d', '30d', '90d', 'custom'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setMetricsRange(r)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors border ${
                    metricsRange === r
                      ? 'bg-blue-900 text-white border-blue-950 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {r === 'all' ? 'All Time' : r === '7d' ? 'Last 7 Days' : r === '30d' ? 'Last 30 Days' : r === '90d' ? 'Last 90 Days' : 'Custom'}
                </button>
              ))}

              {metricsRange === 'custom' && (
                <div className="flex items-center gap-1.5 ml-2">
                  <input
                    type="date"
                    value={metricsCustomStart}
                    onChange={(e) => setMetricsCustomStart(e.target.value)}
                    className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs"
                  />
                  <span className="text-slate-400">to</span>
                  <input
                    type="date"
                    value={metricsCustomEnd}
                    onChange={(e) => setMetricsCustomEnd(e.target.value)}
                    className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs"
                  />
                </div>
              )}
            </div>

            {/* Reporting Currency Toggle (Requirement 4 & 6) */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-semibold">Reporting Currency:</span>
              <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setMetricsReportingCurrency('USD')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                    metricsReportingCurrency === 'USD' ? 'bg-white text-blue-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  USD ($ Base)
                </button>
                <button
                  type="button"
                  onClick={() => setMetricsReportingCurrency('SELECTED')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                    metricsReportingCurrency === 'SELECTED' ? 'bg-white text-blue-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  {currency.code} ({currency.symbol})
                </button>
              </div>
            </div>
          </div>

          {metricsLoading || !metrics ? (
            <div className="p-16 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2 bg-white rounded-2xl border border-slate-200">
              <RefreshCw className="w-5 h-5 animate-spin text-blue-900" />
              <span>Calculating metrics from persistent bookings dataset...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Primary KPI Grid (8 metrics defined cleanly) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Confirmed Paid Revenue */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
                    <span>Confirmed Revenue</span>
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                    {displayRevenue(metrics.successfulRevenueUSD)}
                  </div>
                  <div className="text-[11px] text-emerald-700 font-semibold">
                    From {metrics.successfulPaymentsCount} paid & confirmed reservations
                  </div>
                </div>

                {/* 2. Total Bookings */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
                    <span>Total Bookings</span>
                    <Briefcase className="w-4 h-4 text-blue-900" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                    {metrics.totalBookings}
                  </div>
                  <div className="text-[11px] text-slate-600">
                    {metrics.confirmedBookings} confirmed • {metrics.pendingBookings} pending • {metrics.cancelledBookings} cancelled
                  </div>
                </div>

                {/* 3. Total Passengers */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
                    <span>Total Passengers</span>
                    <Users className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                    {metrics.totalPassengers}
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Manifest count across underlying bookings
                  </div>
                </div>

                {/* 4. Net Revenue (After Refunds) */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
                    <span>Net Operating Revenue</span>
                    <TrendingUp className="w-4 h-4 text-blue-700" />
                  </div>
                  <div className="text-2xl font-black text-blue-950 font-mono tracking-tight">
                    {displayRevenue(metrics.netRevenueUSD)}
                  </div>
                  <div className="text-[11px] text-rose-600 font-medium">
                    {metrics.refundsCount} refunds recorded ({displayRevenue(metrics.refundsTotalUSD)})
                  </div>
                </div>
              </div>

              {/* Charts & Distributions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bookings & Revenue Trend Visualizer */}
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Bookings & Revenue Over Time</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Chronological reservation trend grouped by creation date</p>
                    </div>
                  </div>

                  {metrics.bookingsOverTime.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-400">
                      No historical bookings in selected timeframe.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {metrics.bookingsOverTime.map((item: any) => {
                        const maxRev = Math.max(...metrics.bookingsOverTime.map((m: any) => m.revenue || 1));
                        const pct = Math.max(8, Math.round((item.revenue / maxRev) * 100));
                        return (
                          <div key={item.date} className="space-y-1 text-xs">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-semibold text-slate-700">{item.date}</span>
                              <span className="font-mono text-slate-900 font-bold">
                                {item.bookings} bookings • {displayRevenue(item.revenue)}
                              </span>
                            </div>
                            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-900 rounded-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Top Frequently Booked Routes */}
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Most Booked Flight Routes</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Ranked by customer reservation volume</p>
                    </div>
                  </div>

                  {metrics.topRoutes.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-400">No route data available.</div>
                  ) : (
                    <div className="divide-y divide-slate-100 text-xs">
                      {metrics.topRoutes.map((r: any, idx: number) => (
                        <div key={r.route} className="py-2.5 flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className="w-5 text-center font-bold text-slate-400">{idx + 1}</span>
                            <div>
                              <div className="font-bold text-slate-900">{r.origin} → {r.destination}</div>
                              <div className="text-[10px] text-slate-500">{r.passengers} passengers transported</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-blue-900 block">{r.count} bookings</span>
                            <span className="font-mono text-[11px] text-slate-500">{displayRevenue(r.revenue)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Airline and Cabin Class Distributions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Airline Distribution */}
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Airline Booking Distribution</h4>
                  <div className="space-y-3">
                    {metrics.airlineDistribution.map((a: any) => (
                      <div key={a.airline} className="space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800">{a.airline}</span>
                          <span className="font-mono text-slate-700 font-bold">
                            {a.count} bookings ({a.percentage}%) • {displayRevenue(a.revenue)}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-700 rounded-full"
                            style={{ width: `${Math.max(5, a.percentage)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cabin Class Distribution */}
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Cabin Class Distribution</h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {metrics.cabinDistribution.map((c: any) => (
                      <div key={c.cabinClass} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                          {c.cabinClass}
                        </span>
                        <div className="text-xl font-bold font-mono text-slate-900">{c.count} Bookings</div>
                        <div className="text-[11px] text-slate-600 font-medium">
                          {c.passengers} seats • {displayRevenue(c.revenue)}
                        </div>
                        <div className="text-[10px] text-blue-700 font-semibold">{c.percentage}% share</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Currency disclosure note */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
                <span>
                  All database revenue amounts settled in USD. Converted reporting values calculated using {rateSource} (Last updated {new Date(ratesUpdated).toLocaleTimeString()}).
                </span>
                <span className="font-mono text-blue-900 font-semibold">Base: USD 1.00</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 4: FLIGHT OPERATIONS & WEATHER RISK (Requirement 9) */}
      {/* ========================================================= */}
      {activeTab === 'flights' && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Plane className="w-5 h-5 text-blue-900" />
                <span>Flight Operations & Weather Risk Dispatch</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Monitor live airport weather observations, weather-risk advisories, and operational flight status
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleAdminWeatherSweep(false)}
                disabled={sweepingWeather}
                className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold shadow-xs transition-colors"
                title="Run real-time weather sweep across all active routes and auto-refund affected flights"
              >
                <CloudRain className={`w-3.5 h-3.5 text-amber-700 ${sweepingWeather ? 'animate-bounce' : ''}`} />
                <span>{sweepingWeather ? 'Running Weather Sweep...' : 'Live Weather Auto-Protection Sweep'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm('Simulate adverse severe storm weather condition to verify automatic flight ticket cancellation & 100% full refund?')) {
                    handleAdminWeatherSweep(true);
                  }
                }}
                disabled={sweepingWeather}
                className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-300 rounded-xl text-xs font-bold shadow-xs transition-colors"
                title="Simulate adverse weather across database bookings and test auto-refund"
              >
                <CloudLightning className="w-3.5 h-3.5 text-rose-700" />
                <span>Test Adverse Weather Auto-Refund</span>
              </button>

              <button
                onClick={() => setShowAddFlight(!showAddFlight)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Flight Route</span>
              </button>
            </div>
          </div>

          {showAddFlight && (
            <form onSubmit={handleCreateFlight} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <h4 className="text-xs font-bold uppercase text-blue-900">Add New Flight Route</h4>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Flight Number</label>
                  <input
                    type="text"
                    value={newFlightNumber}
                    onChange={(e) => setNewFlightNumber(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Origin Code</label>
                  <input
                    type="text"
                    value={newOrigin}
                    onChange={(e) => setNewOrigin(e.target.value.toUpperCase())}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Destination Code</label>
                  <input
                    type="text"
                    value={newDestination}
                    onChange={(e) => setNewDestination(e.target.value.toUpperCase())}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Aircraft</label>
                  <input
                    type="text"
                    value={newAircraft}
                    onChange={(e) => setNewAircraft(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Base Price ($ USD)</label>
                  <input
                    type="number"
                    value={newEconomyPrice}
                    onChange={(e) => setNewEconomyPrice(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddFlight(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-900 text-white font-bold text-xs"
                >
                  Save Schedule
                </button>
              </div>
            </form>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 uppercase font-bold text-[11px]">
                  <th className="py-3 px-3">Flight</th>
                  <th className="py-3 px-3">Route</th>
                  <th className="py-3 px-3">Departure / Arrival</th>
                  <th className="py-3 px-3">Aircraft</th>
                  <th className="py-3 px-3">Base Price</th>
                  <th className="py-3 px-3">Weather Risk</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {flights.map((flight) => (
                  <tr key={flight.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3">
                      <span className="font-mono font-bold text-blue-900 block">{flight.flightNumber}</span>
                      <span className="text-[10px] text-slate-500">{flight.airline}</span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">
                        {flight.origin.code} → {flight.destination.code}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {flight.origin.city} to {flight.destination.city}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      <div>Dep: {new Date(flight.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      <div className="text-[10px] text-slate-400">Arr: {new Date(flight.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-700">{flight.aircraft}</td>
                    <td className="py-3 px-3 font-mono font-semibold text-slate-900">
                      <div>{formatPrice(flight.prices.economy)}</div>
                      {currency.code !== 'USD' && (
                        <div className="text-[10px] text-slate-400 font-normal">(${flight.prices.economy} USD)</div>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <button
                        type="button"
                        onClick={() => handleInspectWeather(flight)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 text-[11px] font-semibold transition-colors"
                      >
                        <CloudRain className="w-3.5 h-3.5 text-blue-700" />
                        <span>Live Weather</span>
                      </button>
                    </td>
                    <td className="py-3 px-3">
                      <select
                        value={flight.status}
                        onChange={(e) => handleFlightStatusChange(flight.id, e.target.value)}
                        className={`border rounded-lg px-2 py-1 text-[11px] font-bold ${
                          flight.status === 'SCHEDULED'
                            ? 'bg-blue-50 border-blue-200 text-blue-900'
                            : flight.status === 'BOARDING'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                            : flight.status === 'DELAYED'
                            ? 'bg-amber-50 border-amber-200 text-amber-900'
                            : flight.status === 'CANCELLED'
                            ? 'bg-rose-50 border-rose-200 text-rose-900'
                            : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      >
                        <option value="SCHEDULED">SCHEDULED</option>
                        <option value="BOARDING">BOARDING</option>
                        <option value="DEPARTED">DEPARTED</option>
                        <option value="DELAYED">DELAYED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleInspectWeather(flight)}
                        className="text-xs font-semibold text-blue-900 hover:underline"
                      >
                        Route Advisory
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 5: BAGGAGE POLICIES & FEES (Requirement 10) */}
      {/* ========================================================= */}
      {activeTab === 'baggage' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Luggage className="w-5 h-5 text-blue-900" />
                  <span>Configured Airline Baggage Allowances</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Standard included baggage rules by airline, route type, and cabin class
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {baggagePolicies.map((bp, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                    <span className="font-bold text-slate-900 capitalize text-sm">{bp.cabinClass} Class</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-900">
                      {bp.routeType}
                    </span>
                  </div>
                  <div className="space-y-1 text-slate-700">
                    <div>
                      <strong className="text-slate-900">Cabin Allowance: </strong>
                      {bp.cabinAllowanceText}
                    </div>
                    <div>
                      <strong className="text-slate-900">Checked Allowance: </strong>
                      {bp.checkedAllowanceText}
                    </div>
                    <div className="text-[11px] text-slate-500 pt-1">
                      Max weight: {bp.checkedMaxWeightKg} kg • Pieces: {bp.checkedMaxPieces} • Personal item: {bp.personalItemIncluded ? 'Yes' : 'No'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Baggage Addon Options */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Prepaid Additional Baggage Options & Pricing</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Available options offered to passengers during reservation with backend fee validation
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {baggageOptions.map((opt) => (
                <div key={opt.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900 font-mono block">
                      {opt.id}
                    </span>
                    <h5 className="font-bold text-slate-900 text-sm mt-0.5">{opt.title}</h5>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{opt.description}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Prepaid Fee</span>
                      <span className="font-mono font-bold text-base text-blue-950">{formatPrice(opt.priceUSD)}</span>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-600 bg-white px-2 py-1 rounded-md border border-slate-200">
                      {opt.weightLimitKg} kg limit
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 6: EMAIL AUDIT LOG */}
      {/* ========================================================= */}
      {activeTab === 'emails' && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Outbound Email Audit Trail</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Logs all customer OTPs, booking confirmations, and cancellation notices dispatched via Resend
              </p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={emailSearch}
                onChange={(e) => setEmailSearch(e.target.value)}
                placeholder="Search recipient or PNR..."
                className="bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 uppercase font-bold text-[11px]">
                  <th className="py-3 px-3">Timestamp</th>
                  <th className="py-3 px-3">Recipient</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Subject / PNR</th>
                  <th className="py-3 px-3">Delivery Status</th>
                  <th className="py-3 px-3">Resend ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {emailLogs
                  .filter((log) => !emailSearch || log.to.toLowerCase().includes(emailSearch.toLowerCase()) || log.pnr?.toLowerCase().includes(emailSearch.toLowerCase()))
                  .map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 text-slate-500 font-mono whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{log.to}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 border border-blue-200 text-blue-900">
                          {log.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 truncate max-w-xs">{log.subject}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.status === 'SENT'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : log.status === 'SIMULATED'
                              ? 'bg-blue-50 text-blue-800 border border-blue-200'
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[10px] text-slate-400 truncate max-w-[120px]">
                        {log.resendId || log.errorMessage || 'N/A'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION: REGISTERED USERS & ACCOUNTS (Live Database Store) */}
      {/* ========================================================= */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total User Accounts</span>
              <div className="text-xl font-black text-slate-900 font-mono mt-0.5">
                {usersSummary.total || adminUsers.length}
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wider block">Customer Accounts</span>
              <div className="text-xl font-black text-blue-900 font-mono mt-0.5">
                {usersSummary.customers || adminUsers.filter((u) => u.role === 'customer').length}
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">System Administrators</span>
              <div className="text-xl font-black text-purple-900 font-mono mt-0.5">
                {usersSummary.admins || adminUsers.filter((u) => u.role === 'admin').length}
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Lifetime Customer Spend</span>
              <div className="text-xl font-black text-emerald-900 font-mono mt-0.5">
                {formatPrice(adminUsers.reduce((sum, u) => sum + (u.totalSpentUSD || 0), 0))}
              </div>
            </div>
          </div>

          {/* Search, Filter, and Action Bar */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex flex-1 flex-wrap items-center gap-2.5 w-full">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search by name, email, or account ID..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-700 focus:bg-white"
                />
              </div>

              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value as any)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:border-blue-700"
              >
                <option value="ALL">All Roles</option>
                <option value="customer">Customers Only</option>
                <option value="admin">Administrators Only</option>
              </select>
            </div>

            <button
              onClick={() => {
                setShowAddUserModal(true);
                setUserActionError(null);
                setUserActionMessage(null);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors shrink-0"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register New User / Admin</span>
            </button>
          </div>

          {/* Users Table */}
          <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
            {usersLoading ? (
              <div className="py-12 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-blue-900" />
                <span>Loading live user database...</span>
              </div>
            ) : adminUsers.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                No users match the specified search or filter criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 uppercase font-bold text-[11px]">
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Email Address</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Bookings</th>
                      <th className="py-3 px-4">Lifetime Spend</th>
                      <th className="py-3 px-4">Joined Date</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {adminUsers.map((u) => {
                      const isSelf = u.email.toLowerCase() === user?.email.toLowerCase();
                      return (
                        <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-blue-900 text-white flex items-center justify-center font-bold text-xs uppercase shrink-0">
                                {u.name ? u.name.charAt(0) : 'U'}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                  <span>{u.name}</span>
                                  {isSelf && (
                                    <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                                      You
                                    </span>
                                  )}
                                </div>
                                <div className="font-mono text-[10px] text-slate-400">ID: {u.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-800 font-mono text-[11px]">{u.email}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                                u.role === 'admin'
                                  ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              <Shield className="w-2.5 h-2.5" />
                              <span className="uppercase">{u.role}</span>
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-mono font-bold text-[11px]">
                                {u.bookingCount || 0}
                              </span>
                              {u.latestBookingPnr && (
                                <span className="text-[10px] text-slate-500 font-mono">
                                  (Latest: {u.latestBookingPnr})
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">
                            {formatPrice(u.totalSpentUSD || 0)}
                          </td>
                          <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                            {new Date(u.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleChangeUserRole(u.id, u.email, u.role)}
                                title={`Switch role to ${u.role === 'admin' ? 'Customer' : 'Admin'}`}
                                className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
                              >
                                {u.role === 'admin' ? 'Demote to Customer' : 'Promote to Admin'}
                              </button>
                              {!isSelf && (
                                <button
                                  onClick={() => handleDeleteUser(u.id, u.email)}
                                  title="Delete user account"
                                  className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: ADD NEW USER / ADMINISTRATOR */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4">
            <button
              onClick={() => setShowAddUserModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-blue-900 uppercase tracking-wider">
                <UserPlus className="w-3.5 h-3.5" />
                <span>Account Provisioning</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                Register New User Account
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Create a persistent customer account or administrative login.
              </p>
            </div>

            {userActionError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{userActionError}</span>
              </div>
            )}

            {userActionMessage && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{userActionMessage}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="e.g. Elena Rostova"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="e.g. elena@aerowings.com"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Account Role</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-700"
                >
                  <option value="customer">Customer (Standard passenger bookings)</option>
                  <option value="admin">Administrator (Full operational & database access)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={userActionLoading}
                  className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl text-xs transition-colors shadow-xs disabled:opacity-50"
                >
                  {userActionLoading ? 'Creating User...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: FULL BOOKING DETAIL VIEW */}
      {/* ========================================================= */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl my-8 space-y-6">
            <button
              onClick={() => setSelectedBooking(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-900">Database Booking Record</span>
                <h3 className="text-2xl font-black text-slate-900 mt-0.5 flex items-center gap-2">
                  <span>Booking Reference: </span>
                  <span className="font-mono text-blue-900">{selectedBooking.pnr}</span>
                </h3>
                <div className="text-xs text-slate-500 font-mono mt-0.5">ID: {selectedBooking.id}</div>
              </div>

              <div className="text-right">
                <span
                  className={`inline-block px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                    selectedBooking.bookingStatus === 'CONFIRMED'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : selectedBooking.bookingStatus === 'CANCELLED'
                      ? 'bg-rose-50 text-rose-800 border border-rose-200'
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}
                >
                  {selectedBooking.bookingStatus} ({selectedBooking.paymentStatus})
                </span>
                <div className="text-[11px] text-slate-400 mt-1">
                  Booked: {new Date(selectedBooking.createdAt).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Customer & Flight Manifest Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Customer Box */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 uppercase tracking-wide block">Customer Details</span>
                <div><strong>Customer Name:</strong> {selectedBooking.customerName || 'Customer'}</div>
                <div><strong>Contact Email:</strong> <span className="font-mono">{selectedBooking.contactEmail}</span></div>
                <div><strong>Contact Phone:</strong> {selectedBooking.contactPhone || 'Not provided'}</div>
                <div><strong>Account ID:</strong> <span className="font-mono text-slate-500">{selectedBooking.userId || 'Guest'}</span></div>
              </div>

              {/* Itinerary Box */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 uppercase tracking-wide block">Flight Routing</span>
                <div>
                  <strong>Route:</strong> {selectedBooking.flight.origin.city} ({selectedBooking.flight.origin.code}) → {selectedBooking.flight.destination.city} ({selectedBooking.flight.destination.code})
                </div>
                <div><strong>Flight Number:</strong> {selectedBooking.flight.flightNumber} ({selectedBooking.flight.airline})</div>
                <div><strong>Aircraft:</strong> {selectedBooking.flight.aircraft}</div>
                <div><strong>Departure:</strong> {new Date(selectedBooking.flight.departureTime).toUTCString()}</div>
                <div><strong>Cabin Class:</strong> <span className="capitalize font-semibold">{selectedBooking.cabinClass}</span></div>
              </div>
            </div>

            {/* Passenger Manifest */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
              <span className="font-bold text-slate-900 uppercase tracking-wide block text-xs">
                Passenger Manifest & Allocated Seats ({selectedBooking.passengers.length})
              </span>
              <div className="divide-y divide-slate-100 text-xs">
                {selectedBooking.passengers.map((p, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 text-sm">
                        {p.title} {p.firstName} {p.lastName}
                      </span>
                      <div className="text-[11px] text-slate-500">
                        Passport: {p.passportNumber} • Nationality: {p.nationality} • Meal: {p.mealPreference}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-blue-900 px-2 py-0.5 rounded bg-blue-50 border border-blue-200">
                        Seat {p.seatNumber || 'Standard'}
                      </span>
                      {p.seatFee && p.seatFee > 0 && (
                        <div className="text-[10px] text-slate-400 font-mono">+{formatPrice(p.seatFee)} fee</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Baggage Details */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <span className="font-bold text-slate-900 uppercase tracking-wide block">Baggage Details & Add-ons</span>
              <div>
                <strong>Cabin Baggage:</strong> {selectedBooking.baggageDetails?.cabinAllowanceSummary || '1 Cabin Bag (7kg)'}
              </div>
              <div>
                <strong>Checked Baggage:</strong> {selectedBooking.baggageDetails?.checkedAllowanceSummary || '1 Checked Bag Included'}
              </div>
              {selectedBooking.fareBreakdown.baggageFee && selectedBooking.fareBreakdown.baggageFee > 0 ? (
                <div className="text-blue-900 font-bold">
                  Extra Baggage Total Fee: {formatPrice(selectedBooking.fareBreakdown.baggageFee)}
                </div>
              ) : (
                <div className="text-emerald-700 font-semibold">Standard Baggage Included (Zero excess fees)</div>
              )}
            </div>

            {/* Fare & Payment Breakdown */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <span className="font-bold text-slate-900 uppercase tracking-wide block">Financial Transaction Summary</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-slate-800">
                <div>Base: {formatPrice(selectedBooking.fareBreakdown.baseFare)}</div>
                <div>Taxes: {formatPrice(selectedBooking.fareBreakdown.taxesAndFees)}</div>
                <div>Seat: {formatPrice(selectedBooking.fareBreakdown.seatSelectionFee)}</div>
                <div>Baggage: {formatPrice(selectedBooking.fareBreakdown.baggageFee || 0)}</div>
              </div>
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-sm font-bold">
                <span>Total Amount Authorized:</span>
                <div className="text-right">
                  <span className="font-mono text-base text-blue-950 block">{formatPrice(selectedBooking.fareBreakdown.totalAmount)}</span>
                  {currency.code !== 'USD' && (
                    <span className="text-[10px] text-slate-400 font-normal font-mono block">
                      (${selectedBooking.fareBreakdown.totalAmount.toFixed(2)} USD)
                    </span>
                  )}
                </div>
              </div>
              <div className="text-[11px] text-slate-500 pt-1">
                Payment Method: {selectedBooking.paymentMethod} • Transaction Ref: <span className="font-mono">{selectedBooking.paymentTransactionId}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedBooking(null);
                  handleOpenStatusModal(selectedBooking);
                }}
                className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
              >
                Change Booking Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: AUTHORIZED STATUS UPDATE MODAL */}
      {/* ========================================================= */}
      {statusUpdateModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4">
            <button
              onClick={() => setStatusUpdateModalBooking(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wider block">Authorized Operational Action</span>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                Update Status for PNR #{statusUpdateModalBooking.pnr}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Customer: {statusUpdateModalBooking.contactEmail} • Flight {statusUpdateModalBooking.flight.flightNumber}
              </p>
            </div>

            {statusSuccessMessage && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{statusSuccessMessage}</span>
              </div>
            )}

            <form onSubmit={handleSaveStatusUpdate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Booking Status</label>
                <select
                  value={newBookingStatus}
                  onChange={(e) => setNewBookingStatus(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-700"
                >
                  <option value="CONFIRMED">CONFIRMED (Valid for Travel)</option>
                  <option value="PENDING">PENDING (Awaiting Review/Payment)</option>
                  <option value="CANCELLED">CANCELLED (Cancel & Process Refund)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payment Status</label>
                <select
                  value={newPaymentStatus}
                  onChange={(e) => setNewPaymentStatus(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-700"
                >
                  <option value="PAID">PAID</option>
                  <option value="PENDING">PENDING</option>
                  <option value="REFUNDED">REFUNDED</option>
                </select>
              </div>

              {newBookingStatus === 'CANCELLED' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cancellation / Refund Reason</label>
                  <input
                    type="text"
                    value={statusUpdateReason}
                    onChange={(e) => setStatusUpdateReason(e.target.value)}
                    placeholder="e.g. Flight schedule cancelled due to weather"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-700"
                  />
                  <p className="text-[11px] text-rose-600 mt-1">
                    * Cancelling will automatically record a refund and restore aircraft seat availability.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStatusUpdateModalBooking(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={statusUpdating}
                  className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl text-xs transition-colors shadow-xs disabled:opacity-50"
                >
                  {statusUpdating ? 'Updating...' : 'Commit Status Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: LIVE WEATHER RISK ASSESSMENT REPORT */}
      {/* ========================================================= */}
      {weatherFlight && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
            <button
              onClick={() => setWeatherFlight(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wider block">
                  Aviation Meteorological Intelligence
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-0.5">
                  Route Weather Risk: {weatherFlight.flightNumber} ({weatherFlight.airline})
                </h3>
                <p className="text-xs text-slate-500">
                  {weatherFlight.origin.city} ({weatherFlight.origin.code}) → {weatherFlight.destination.city} ({weatherFlight.destination.code})
                </p>
              </div>
            </div>

            {weatherLoading ? (
              <div className="py-12 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-blue-900" />
                <span>Retrieving real-time weather observations from Open-Meteo...</span>
              </div>
            ) : flightWeatherReport ? (
              <div className="space-y-4">
                {/* Risk Banner */}
                <div
                  className={`p-4 rounded-2xl border text-xs flex items-start gap-3 ${
                    flightWeatherReport.overallRisk === 'SEVERE'
                      ? 'bg-rose-50 border-rose-200 text-rose-900'
                      : flightWeatherReport.overallRisk === 'HIGH'
                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                      : flightWeatherReport.overallRisk === 'MODERATE'
                      ? 'bg-blue-50 border-blue-200 text-blue-900'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  }`}
                >
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-extrabold uppercase tracking-wide">
                      AeroWings Weather-Risk Advisory: {flightWeatherReport.overallRisk} RISK
                    </div>
                    <div className="mt-1 leading-relaxed">{flightWeatherReport.advisorySummary}</div>
                    {flightWeatherReport.operationalReviewRequired && (
                      <div className="mt-1.5 font-bold">
                        Operational Status: Flagged for airline operational review.
                      </div>
                    )}
                  </div>
                </div>

                {/* Departure & Arrival Weather Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* Departure Airport */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="font-bold text-slate-900 uppercase block text-[11px]">
                      Departure: {flightWeatherReport.departureAirport.airportCode} ({flightWeatherReport.departureAirport.city})
                    </span>
                    <div className="text-2xl font-black text-slate-900">
                      {flightWeatherReport.departureAirport.temperatureC}°C ({flightWeatherReport.departureAirport.temperatureF}°F)
                    </div>
                    <div className="text-blue-900 font-semibold">{flightWeatherReport.departureAirport.condition}</div>
                    <div className="text-slate-600 space-y-0.5 text-[11px] pt-1 border-t border-slate-200">
                      <div>Wind: {flightWeatherReport.departureAirport.windSpeedKmh} km/h (Gusts: {flightWeatherReport.departureAirport.windGustsKmh} km/h)</div>
                      <div>Precipitation: {flightWeatherReport.departureAirport.precipitationMm} mm</div>
                      <div>Visibility: {(flightWeatherReport.departureAirport.visibilityMeters / 1000).toFixed(1)} km</div>
                      <div>Humidity: {flightWeatherReport.departureAirport.relativeHumidity}% • Pressure: {flightWeatherReport.departureAirport.surfacePressureHpa} hPa</div>
                    </div>
                  </div>

                  {/* Arrival Airport */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="font-bold text-slate-900 uppercase block text-[11px]">
                      Arrival: {flightWeatherReport.arrivalAirport.airportCode} ({flightWeatherReport.arrivalAirport.city})
                    </span>
                    <div className="text-2xl font-black text-slate-900">
                      {flightWeatherReport.arrivalAirport.temperatureC}°C ({flightWeatherReport.arrivalAirport.temperatureF}°F)
                    </div>
                    <div className="text-blue-900 font-semibold">{flightWeatherReport.arrivalAirport.condition}</div>
                    <div className="text-slate-600 space-y-0.5 text-[11px] pt-1 border-t border-slate-200">
                      <div>Wind: {flightWeatherReport.arrivalAirport.windSpeedKmh} km/h (Gusts: {flightWeatherReport.arrivalAirport.windGustsKmh} km/h)</div>
                      <div>Precipitation: {flightWeatherReport.arrivalAirport.precipitationMm} mm</div>
                      <div>Visibility: {(flightWeatherReport.arrivalAirport.visibilityMeters / 1000).toFixed(1)} km</div>
                      <div>Humidity: {flightWeatherReport.arrivalAirport.relativeHumidity}% • Pressure: {flightWeatherReport.arrivalAirport.surfacePressureHpa} hPa</div>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[10px] text-slate-500 space-y-1">
                  <div><strong>Data Provider:</strong> {flightWeatherReport.departureAirport.dataSource}</div>
                  <div><strong>Notice:</strong> {flightWeatherReport.disclaimer}</div>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-rose-600">
                Weather observations temporarily unavailable for this route.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
