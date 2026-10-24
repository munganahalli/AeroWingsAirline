import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Check,
  CheckCircle2,
  CloudLightning,
  CloudRain,
  Download,
  Luggage,
  Mail,
  Plane,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Thermometer,
  Trash2,
  Wind,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useCurrency } from '../context/CurrencyContext.tsx';
import {
  cancelBooking,
  checkAndProtectBookingWeather,
  fetchFlightWeather,
  fetchMyBookings,
  resendBookingEmail,
} from '../lib/api.ts';
import { downloadElectronicTicketPdf } from '../lib/pdfTicket.ts';
import type { Booking } from '../types/index.ts';

export function MyBookings() {
  const { user } = useAuth();
  const { formatPrice, currency } = useCurrency();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search filter
  const [searchEmail, setSearchEmail] = useState(user?.email || '');
  const [searchPnr, setSearchPnr] = useState('');

  // Standard Cancellation modal
  const [cancelModalBooking, setCancelModalBooking] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState('Change of travel schedule');
  const [cancelling, setCancelling] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Real-Time Weather Predictor & Auto-Refund Protection Modal
  const [weatherModalBooking, setWeatherModalBooking] = useState<Booking | null>(null);
  const [weatherReport, setWeatherReport] = useState<any | null>(null);
  const [checkingWeather, setCheckingWeather] = useState(false);
  const [weatherProtectResult, setWeatherProtectResult] = useState<any | null>(null);

  // Download state
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [resendingEmailId, setResendingEmailId] = useState<string | null>(null);

  useEffect(() => {
    loadBookings(user?.email);
  }, [user]);

  const loadBookings = async (email?: string, pnr?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMyBookings(email, pnr);
      setBookings(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadBookings(searchEmail.trim() || undefined, searchPnr.trim() || undefined);
  };

  const handleDownloadTicket = async (booking: Booking) => {
    setDownloadingId(booking.id);
    try {
      await downloadElectronicTicketPdf(booking, window.location.origin, {
        code: currency.code,
        symbol: currency.symbol,
        rateFromUSD: currency.rateFromUSD,
      });
    } catch (err) {
      console.error('Failed to download ticket', err);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleRetryEmail = async (bookingId: string) => {
    setResendingEmailId(bookingId);
    try {
      const res = await resendBookingEmail(bookingId);
      setStatusMessage(`Resend email status updated: ${res.deliveryStatus}`);
      loadBookings(searchEmail || undefined, searchPnr || undefined);
    } catch (err: any) {
      setError(err.message || 'Failed to resend confirmation email.');
    } finally {
      setResendingEmailId(null);
    }
  };

  const handleConfirmCancellation = async () => {
    if (!cancelModalBooking) return;
    setCancelling(true);
    setError(null);
    try {
      const res = await cancelBooking(cancelModalBooking.id, cancelReason);
      setStatusMessage(res.message || 'Booking cancelled successfully.');
      setCancelModalBooking(null);
      loadBookings(searchEmail || undefined, searchPnr || undefined);
    } catch (err: any) {
      setError(err.message || 'Failed to cancel booking.');
    } finally {
      setCancelling(false);
    }
  };

  // Open Real-Time Weather Safety Predictor
  const handleOpenWeatherPredictor = async (booking: Booking) => {
    setWeatherModalBooking(booking);
    setWeatherProtectResult(null);
    setCheckingWeather(true);
    try {
      const report = await fetchFlightWeather(booking.flight.id);
      setWeatherReport(report);
    } catch (err: any) {
      console.error('Failed to fetch real-time weather', err);
    } finally {
      setCheckingWeather(false);
    }
  };

  // Run Real-Time Weather Check & Auto-Cancel/Refund If Bad
  const handleExecuteWeatherSafetyCheck = async (simulateAdverse = false) => {
    if (!weatherModalBooking) return;
    setCheckingWeather(true);
    setWeatherProtectResult(null);
    try {
      const result = await checkAndProtectBookingWeather(weatherModalBooking.id, simulateAdverse);
      setWeatherProtectResult(result);
      if (result.cancelled) {
        setStatusMessage(
          `Adverse Weather Alert: Flight ${weatherModalBooking.flight.flightNumber} automatically cancelled due to severe weather. Full 100% refund of $${result.refundAmount} USD (${formatPrice(result.refundAmount)}) processed to original payment method.`
        );
        loadBookings(searchEmail || undefined, searchPnr || undefined);
      }
    } catch (err: any) {
      setError(err.message || 'Weather safety check failed.');
    } finally {
      setCheckingWeather(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">My Bookings</h1>
          <p className="text-xs text-slate-500 mt-1">
            View actual database booking records, real-time weather safety predictor with automatic adverse condition refunds, and PDF electronic tickets
          </p>
        </div>

        {/* Guest Lookup Form */}
        <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            value={searchPnr}
            onChange={(e) => setSearchPnr(e.target.value.toUpperCase())}
            placeholder="PNR (e.g. AW-KL782)"
            className="w-36 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-700 focus:bg-white"
          />
          <input
            type="email"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            placeholder="Customer email"
            className="w-44 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-700 focus:bg-white"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search</span>
          </button>
        </form>
      </div>

      {statusMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Bookings List */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 text-sm flex items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-900" />
          <span>Retrieving flight reservations from persistent database...</span>
        </div>
      ) : bookings.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <Plane className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No Flight Bookings Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            No matching bookings found for the provided criteria. Try searching by your exact PNR code or customer email address.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const isConfirmed = booking.bookingStatus === 'CONFIRMED';
            const isCancelled = booking.bookingStatus === 'CANCELLED';
            const isWeatherCancelled = booking.isWeatherCancellation || (booking.cancellationReason && booking.cancellationReason.toLowerCase().includes('weather'));

            return (
              <div
                key={booking.id}
                className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-xs hover:border-blue-300 transition-colors"
              >
                {/* Top Strip */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono text-base font-extrabold text-blue-900 px-2.5 py-1 rounded bg-blue-50 border border-blue-200">
                      {booking.pnr}
                    </span>
                    <span
                      className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded ${
                        isConfirmed
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : isCancelled
                          ? 'bg-rose-50 text-rose-800 border border-rose-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {booking.bookingStatus}
                    </span>

                    {/* Weather Cancellation Special Notice Badge */}
                    {isWeatherCancelled && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-800 bg-rose-50 border border-rose-300 px-2.5 py-0.5 rounded-full">
                        <CloudLightning className="w-3.5 h-3.5 text-rose-600" />
                        <span>Adverse Weather Auto-Refunded (100% Full Refund)</span>
                      </span>
                    )}

                    <span className="text-xs text-slate-500">
                      Booked {new Date(booking.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Customer Email & Resend status badge */}
                  <div className="flex items-center gap-2 text-xs">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-slate-600 font-medium">{booking.contactEmail}</span>
                    {booking.emailDeliveryStatus === 'FAILED' ? (
                      <button
                        type="button"
                        onClick={() => handleRetryEmail(booking.id)}
                        disabled={resendingEmailId === booking.id}
                        className="text-[11px] text-amber-600 hover:text-amber-800 font-bold underline flex items-center gap-1"
                      >
                        <RefreshCw className={`w-3 h-3 ${resendingEmailId === booking.id ? 'animate-spin' : ''}`} />
                        <span>Retry Email</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-emerald-700 font-semibold">
                        ({booking.emailDeliveryStatus === 'DELIVERED' ? 'Resend: Sent' : 'Email Dispatched'})
                      </span>
                    )}
                  </div>
                </div>

                {/* Flight Routing */}
                <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4 py-2">
                  <div className="md:col-span-2 flex items-center gap-6">
                    <div>
                      <div className="text-2xl font-black text-slate-900">{booking.flight.origin.code}</div>
                      <div className="text-xs text-slate-500 truncate max-w-[120px]">{booking.flight.origin.city}</div>
                      <div className="text-[11px] text-slate-500">
                        {new Date(booking.flight.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div className="flex-1 text-center">
                      <div className="text-[11px] font-bold text-blue-900 mb-1">{booking.flight.flightNumber}</div>
                      <div className="h-0.5 bg-slate-200 w-full relative">
                        <Plane className="w-3 h-3 text-blue-900 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90" />
                      </div>
                      <div className="text-[10px] text-emerald-700 font-semibold mt-1 capitalize">
                        {booking.cabinClass} Class • {booking.flight.stops === 0 ? 'Non-Stop' : `${booking.flight.stops} Stop`}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black text-slate-900">{booking.flight.destination.code}</div>
                      <div className="text-xs text-slate-500 truncate max-w-[120px]">{booking.flight.destination.city}</div>
                      <div className="text-[11px] text-slate-500">
                        {new Date(booking.flight.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>

                  {/* Passengers & Baggage */}
                  <div className="text-xs text-slate-700 space-y-1">
                    <span className="text-slate-500 font-bold block">Travelers & Baggage:</span>
                    {booking.passengers.map((p) => (
                      <div key={p.id} className="truncate">
                        {p.title} {p.firstName} {p.lastName}{' '}
                        <span className="text-blue-900 font-mono font-bold">[{p.seatNumber ? `Seat ${p.seatNumber}` : 'Allocated'}]</span>
                        {p.baggage?.extraFeeUSD && p.baggage.extraFeeUSD > 0 ? (
                          <span className="text-[10px] text-blue-700 font-semibold ml-1">
                            (+{p.baggage.extraWeightKg}kg bag)
                          </span>
                        ) : null}
                      </div>
                    ))}
                  </div>

                  {/* Total & Action Buttons */}
                  <div className="flex flex-col items-start md:items-end justify-center gap-2">
                    <div className="text-right">
                      <div className="text-sm font-mono font-bold text-slate-900">
                        {formatPrice(booking.fareBreakdown.totalAmount)}
                      </div>
                      {currency.code !== 'USD' && (
                        <div className="text-[10px] text-slate-400 font-mono">
                          (${booking.fareBreakdown.totalAmount.toFixed(2)} USD)
                        </div>
                      )}
                      {booking.refundAmount && (
                        <div className="text-[11px] font-mono font-bold text-emerald-700 mt-0.5">
                          Refund: {formatPrice(booking.refundAmount)} (${booking.refundAmount.toFixed(2)} USD)
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                      {/* Real-Time Weather Safety Check Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenWeatherPredictor(booking)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-900 font-bold text-xs transition-colors shadow-xs"
                        title="Live weather observation and auto-refund protection"
                      >
                        <Thermometer className="w-3.5 h-3.5 text-blue-700" />
                        <span>Live Weather Check</span>
                      </button>

                      {isConfirmed && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleDownloadTicket(booking)}
                            disabled={downloadingId === booking.id}
                            className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-lg text-xs transition-colors shadow-xs"
                          >
                            {downloadingId === booking.id ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Download className="w-3.5 h-3.5" />
                            )}
                            <span>PDF Ticket</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setCancelModalBooking(booking)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-300 rounded-lg transition-colors"
                            title="Cancel Booking"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      {isCancelled && !isWeatherCancelled && (
                        <span className="text-xs text-rose-600 font-medium italic">
                          Cancelled on {new Date(booking.cancelledAt || '').toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Weather Alert Details if cancelled by adverse weather */}
                {isWeatherCancelled && booking.cancellationReason && (
                  <div className="p-3 rounded-xl bg-rose-50/80 border border-rose-200 text-rose-900 text-xs flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">Weather Protection Auto-Refund Executed</div>
                      <div className="mt-0.5">{booking.cancellationReason}</div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: REAL-TIME WEATHER PREDICTOR & AUTO-REFUND PROTECTION */}
      {weatherModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-2xl my-8 space-y-5">
            <button
              onClick={() => {
                setWeatherModalBooking(null);
                setWeatherProtectResult(null);
              }}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-900 uppercase tracking-wider">
                <Thermometer className="w-4 h-4 text-blue-800" />
                <span>Real-Time Aviation Meteorological Predictor</span>
              </div>
              <h3 className="text-xl font-black text-slate-900 mt-0.5">
                Live Flight Weather: {weatherModalBooking.flight.flightNumber} ({weatherModalBooking.flight.airline})
              </h3>
              <p className="text-xs text-slate-500">
                Route: {weatherModalBooking.flight.origin.city} ({weatherModalBooking.flight.origin.code}) → {weatherModalBooking.flight.destination.city} ({weatherModalBooking.flight.destination.code})
              </p>
            </div>

            {/* Weather Result Status Notification if action taken */}
            {weatherProtectResult && (
              <div
                className={`p-4 rounded-2xl border text-xs space-y-2 ${
                  weatherProtectResult.cancelled
                    ? 'bg-rose-50 border-rose-300 text-rose-950'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-950'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm">
                  {weatherProtectResult.cancelled ? (
                    <CloudLightning className="w-5 h-5 text-rose-600 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  )}
                  <span>
                    {weatherProtectResult.cancelled
                      ? 'Adverse Weather Detected: Ticket Automatically Cancelled & 100% Refunded'
                      : 'Weather Assessment Clear: Safe for Flight Operations'}
                  </span>
                </div>
                <p className="leading-relaxed">{weatherProtectResult.message}</p>
                {weatherProtectResult.refundAmount && (
                  <div className="p-2.5 rounded-xl bg-white/90 border border-rose-200 font-mono font-bold text-rose-800 text-xs">
                    Full 100% Refund Amount: ${weatherProtectResult.refundAmount.toFixed(2)} USD ({formatPrice(weatherProtectResult.refundAmount)}) credited to original payment method.
                  </div>
                )}
              </div>
            )}

            {/* Real-time Weather Sensor Observations Grid */}
            {checkingWeather ? (
              <div className="py-12 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-blue-900" />
                <span>Querying Open-Meteo live atmospheric sensors...</span>
              </div>
            ) : weatherReport ? (
              <div className="space-y-4">
                {/* Risk Summary Badge */}
                <div
                  className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between ${
                    weatherReport.overallRisk === 'SEVERE'
                      ? 'bg-rose-50 border-rose-200 text-rose-900'
                      : weatherReport.overallRisk === 'HIGH'
                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                      : weatherReport.overallRisk === 'MODERATE'
                      ? 'bg-blue-50 border-blue-200 text-blue-900'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold">
                    <CloudRain className="w-4 h-4" />
                    <span>Predicted Flight Risk: {weatherReport.overallRisk}</span>
                  </div>
                  <span className="font-semibold text-[11px]">
                    {weatherReport.isBadWeather ? '⚠️ Hazardous Weather Detected' : '✅ Clear Flying Conditions'}
                  </span>
                </div>

                {/* Side-by-side Airport Observations */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Origin */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">
                      Departure: {weatherReport.departureAirport.airportCode} ({weatherReport.departureAirport.city})
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-slate-900">
                        {weatherReport.departureAirport.temperatureC}°C
                      </span>
                      <span className="text-slate-500 font-medium">
                        ({weatherReport.departureAirport.temperatureF}°F)
                      </span>
                    </div>
                    <div className="font-semibold text-blue-900">
                      {weatherReport.departureAirport.condition}
                    </div>
                    <div className="space-y-1 text-[11px] text-slate-600 pt-2 border-t border-slate-200">
                      <div>Wind: {weatherReport.departureAirport.windSpeedKmh} km/h (Gusts: {weatherReport.departureAirport.windGustsKmh} km/h)</div>
                      <div>Visibility: {(weatherReport.departureAirport.visibilityMeters / 1000).toFixed(1)} km</div>
                      <div>Precipitation: {weatherReport.departureAirport.precipitationMm} mm</div>
                    </div>
                  </div>

                  {/* Destination */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">
                      Arrival: {weatherReport.arrivalAirport.airportCode} ({weatherReport.arrivalAirport.city})
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-slate-900">
                        {weatherReport.arrivalAirport.temperatureC}°C
                      </span>
                      <span className="text-slate-500 font-medium">
                        ({weatherReport.arrivalAirport.temperatureF}°F)
                      </span>
                    </div>
                    <div className="font-semibold text-blue-900">
                      {weatherReport.arrivalAirport.condition}
                    </div>
                    <div className="space-y-1 text-[11px] text-slate-600 pt-2 border-t border-slate-200">
                      <div>Wind: {weatherReport.arrivalAirport.windSpeedKmh} km/h (Gusts: {weatherReport.arrivalAirport.windGustsKmh} km/h)</div>
                      <div>Visibility: {(weatherReport.arrivalAirport.visibilityMeters / 1000).toFixed(1)} km</div>
                      <div>Precipitation: {weatherReport.arrivalAirport.precipitationMm} mm</div>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
                  <strong>Automatic Protection Policy:</strong> If adverse meteorological conditions (thunderstorms, severe wind gusts &gt;55 km/h, visibility &lt;800m, or extreme temperatures &ge;45°C) occur along your flight route, your ticket will be automatically cancelled with a guaranteed 100% instant full refund.
                </div>
              </div>
            ) : null}

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="text-[11px] text-slate-400">
                Live Observations from Open-Meteo & WMO Meteorological Stations
              </div>
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                {/* Auto Check Button */}
                <button
                  type="button"
                  disabled={checkingWeather || weatherModalBooking.bookingStatus === 'CANCELLED'}
                  onClick={() => handleExecuteWeatherSafetyCheck(false)}
                  className="flex-1 sm:flex-initial px-4 py-2 bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
                >
                  {checkingWeather ? 'Checking Weather...' : 'Run Live Weather Auto-Check'}
                </button>

                {/* Simulate Adverse Weather Test Trigger (for testing 100% refund) */}
                {weatherModalBooking.bookingStatus !== 'CANCELLED' && (
                  <button
                    type="button"
                    disabled={checkingWeather}
                    onClick={() => handleExecuteWeatherSafetyCheck(true)}
                    className="flex-1 sm:flex-initial px-3.5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-colors shadow-xs flex items-center gap-1.5"
                    title="Simulate severe adverse weather to test automatic ticket cancellation and 100% full refund"
                  >
                    <CloudLightning className="w-3.5 h-3.5" />
                    <span>Test Adverse Weather (Auto-Refund)</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: STANDARD CANCELLATION */}
      {cancelModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Cancel Booking #{cancelModalBooking.pnr}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to cancel this reservation? A cancellation notice will be automatically dispatched to{' '}
              <strong className="text-slate-900 font-semibold">{cancelModalBooking.contactEmail}</strong>.
            </p>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="text-slate-600">
                Total Paid: ${cancelModalBooking.fareBreakdown.totalAmount.toFixed(2)} USD ({formatPrice(cancelModalBooking.fareBreakdown.totalAmount)})
              </div>
              <div className="text-emerald-700 font-bold">
                Refund Due (Standard 90% fare): ${(cancelModalBooking.fareBreakdown.totalAmount * 0.9).toFixed(2)} USD ({formatPrice(cancelModalBooking.fareBreakdown.totalAmount * 0.9)})
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Reason for cancellation</label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-700"
              >
                <option value="Change of travel schedule">Change of travel schedule</option>
                <option value="Personal / Medical emergency">Personal / Medical emergency</option>
                <option value="Found alternative flight route">Found alternative flight route</option>
                <option value="Trip cancelled">Trip cancelled</option>
              </select>
            </div>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCancelModalBooking(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold"
              >
                Keep Booking
              </button>
              <button
                type="button"
                disabled={cancelling}
                onClick={handleConfirmCancellation}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
