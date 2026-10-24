import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Compass,
  Filter,
  Globe2,
  MapPin,
  Navigation,
  Plane,
  Radio,
  RefreshCw,
  Search,
  ShieldCheck,
  Wind,
  X,
} from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext.tsx';
import type { CabinClass, Flight } from '../types/index.ts';

interface LiveFlightItem {
  id: string;
  flightNumber: string;
  airline: string;
  aircraft: string;
  origin: {
    code: string;
    name: string;
    city: string;
    country?: string;
    terminal?: string;
    gate?: string;
  };
  destination: {
    code: string;
    name: string;
    city: string;
    country?: string;
    terminal?: string;
    gate?: string;
  };
  scheduledDeparture: string;
  scheduledArrival: string;
  estimatedDeparture?: string;
  estimatedArrival?: string;
  duration: string;
  status: 'SCHEDULED' | 'BOARDING' | 'IN_AIR' | 'LANDED' | 'DELAYED';
  progressPercent: number;
  altitudeFt: number;
  speedKmh: number;
  headingDeg?: number;
  delayMinutes?: number;
  delayReason?: string;
  remainingMinutes?: number;
  routeCategory?: 'domestic' | 'domestic-to-international' | 'international';
  prices?: {
    economy: number;
    premiumEconomy: number;
    business: number;
    first: number;
  };
}

interface LiveFlightStatusProps {
  onSelectFlightForBooking?: (flight: Flight, cabin: CabinClass) => void;
}

export function LiveFlightStatus({ onSelectFlightForBooking }: LiveFlightStatusProps) {
  const { formatPrice } = useCurrency();
  const [flights, setFlights] = useState<LiveFlightItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'IN_AIR' | 'BOARDING' | 'SCHEDULED' | 'LANDED' | 'DELAYED'>('ALL');
  const [routeFilter, setRouteFilter] = useState<'ALL' | 'domestic' | 'domestic-to-international' | 'international'>('ALL');
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString());
  const [refreshing, setRefreshing] = useState(false);

  const fetchLiveStatus = async (query?: string) => {
    try {
      const q = query !== undefined ? query : searchQuery;
      const url = new URL('/api/flights/live-status', window.location.origin);
      if (q.trim()) {
        url.searchParams.set('search', q.trim());
      }
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error('Failed to load current flight status telemetry.');
      const data = await res.json();
      setFlights(data.flights || []);
      setError(null);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err: any) {
      setError(err.message || 'Error loading live flight tracker.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLiveStatus();
    const interval = setInterval(() => {
      fetchLiveStatus();
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLiveStatus();
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    fetchLiveStatus(searchQuery);
  };

  // Instant responsive filter across search, status tabs, and route categories
  const filteredFlights = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return flights.filter((f) => {
      // Status filter
      if (activeFilter !== 'ALL' && f.status !== activeFilter) return false;

      // Route Category filter
      if (routeFilter !== 'ALL') {
        const cat = f.routeCategory || 'international';
        if (cat !== routeFilter) return false;
      }

      // Search query filter
      if (q) {
        const matchFlight = f.flightNumber.toLowerCase().includes(q);
        const matchAirline = f.airline.toLowerCase().includes(q);
        const matchOrigCode = f.origin.code.toLowerCase().includes(q);
        const matchOrigCity = f.origin.city.toLowerCase().includes(q);
        const matchDestCode = f.destination.code.toLowerCase().includes(q);
        const matchDestCity = f.destination.city.toLowerCase().includes(q);
        if (!matchFlight && !matchAirline && !matchOrigCode && !matchOrigCity && !matchDestCode && !matchDestCity) {
          return false;
        }
      }

      return true;
    });
  }, [flights, activeFilter, routeFilter, searchQuery]);

  // Operational telemetry summary stats
  const stats = useMemo(() => {
    const inAir = flights.filter((f) => f.status === 'IN_AIR').length;
    const boarding = flights.filter((f) => f.status === 'BOARDING').length;
    const scheduled = flights.filter((f) => f.status === 'SCHEDULED').length;
    const landed = flights.filter((f) => f.status === 'LANDED').length;
    const delayed = flights.filter((f) => f.status === 'DELAYED').length;
    return { inAir, boarding, scheduled, landed, delayed, total: flights.length };
  }, [flights]);

  const getStatusBadge = (flight: LiveFlightItem) => {
    switch (flight.status) {
      case 'IN_AIR':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <span>En Route (In Air)</span>
          </span>
        );
      case 'BOARDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse" />
            <span>Gate Boarding</span>
          </span>
        );
      case 'LANDED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Arrived & Landed</span>
          </span>
        );
      case 'DELAYED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Delayed (+{flight.delayMinutes || 45}m)</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Scheduled On-Time</span>
          </span>
        );
    }
  };

  const formatHeading = (deg?: number) => {
    if (deg === undefined) return '090° E';
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round((deg % 360) / 22.5) % 16;
    return `${deg.toString().padStart(3, '0')}° ${directions[index]}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Top Banner with AeroWings Radar Title */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900 text-white relative overflow-hidden shadow-xl border border-blue-900/60">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-8">
          <Plane className="w-96 h-96 transform -rotate-12 text-white" />
        </div>

        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/70 border border-blue-700/60 text-xs font-bold text-sky-200 backdrop-blur-xs">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Live Flight Operations Telemetry • Global Satellite Feed</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
            Current Flight Live Status
          </h1>
          <p className="text-xs sm:text-sm text-blue-200/90 max-w-2xl leading-relaxed">
            Live real-time monitoring of active flights en route, boarding at gates, and scheduled departures across India domestic, domestic-to-international, and worldwide corridors.
          </p>

          {/* Quick Telemetry Metric Badges */}
          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-900/60 border border-blue-800/80 font-mono">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-blue-200">In Air:</span>
              <strong className="text-white">{stats.inAir}</strong>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-900/60 border border-blue-800/80 font-mono">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-blue-200">Boarding:</span>
              <strong className="text-white">{stats.boarding}</strong>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-900/60 border border-blue-800/80 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-blue-200">Landed:</span>
              <strong className="text-white">{stats.landed}</strong>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-900/60 border border-blue-800/80 font-mono">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span className="text-blue-200">Delayed:</span>
              <strong className="text-white">{stats.delayed}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Search, Status & Route Filtering Strip */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by flight number (e.g. AW-101, 6E-201, EK-501) or city / code (DEL, BOM, JFK, LHR, DXB)..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-24 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-700 focus:bg-white transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-20 top-2.5 text-slate-400 hover:text-slate-600 p-1"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="submit"
              className="absolute right-1.5 top-1.5 bottom-1.5 px-3.5 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-lg text-xs transition-colors shadow-xs"
            >
              Filter
            </button>
          </form>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors shadow-xs"
              title="Refresh Live Telemetry Feed"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-900' : ''}`} />
              <span>Telemetry Feed: {lastUpdated}</span>
            </button>
          </div>
        </div>

        {/* Route Filter & Status Badges */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] mr-1">Status:</span>
            {(
              [
                { id: 'ALL', label: 'All Statuses', count: stats.total },
                { id: 'IN_AIR', label: 'In Air Now', count: stats.inAir },
                { id: 'BOARDING', label: 'Boarding', count: stats.boarding },
                { id: 'SCHEDULED', label: 'Scheduled', count: stats.scheduled },
                { id: 'LANDED', label: 'Landed', count: stats.landed },
                { id: 'DELAYED', label: 'Delayed', count: stats.delayed },
              ] as const
            ).map((tab) => {
              const isSelected = activeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveFilter(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-blue-900 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isSelected ? 'bg-blue-800 text-blue-100' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Route Category Pills */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] mr-1">Route:</span>
            {[
              { id: 'ALL', label: 'All Routes' },
              { id: 'domestic', label: 'Domestic India' },
              { id: 'domestic-to-international', label: 'Domestic ✈ Intl' },
              { id: 'international', label: 'Intl ✈ Intl' },
            ].map((rc) => (
              <button
                key={rc.id}
                type="button"
                onClick={() => setRouteFilter(rc.id as any)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  routeFilter === rc.id
                    ? 'bg-sky-600 text-white font-bold shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {rc.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Flight Cards Stream */}
      {loading ? (
        <div className="p-16 text-center rounded-2xl bg-white border border-slate-200 space-y-3 shadow-xs">
          <RefreshCw className="w-8 h-8 text-blue-900 animate-spin mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">Acquiring live satellite flight telemetry...</h3>
          <p className="text-xs text-slate-500">Connecting to ADS-B radar transponders and airport departure systems</p>
        </div>
      ) : filteredFlights.length === 0 ? (
        <div className="p-16 text-center rounded-2xl bg-white border border-slate-200 space-y-3 shadow-xs">
          <Plane className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No active flights match your filter</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try resetting your search query or switching filters to view active flights across domestic and international routes.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setActiveFilter('ALL');
              setRouteFilter('ALL');
            }}
            className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredFlights.map((f) => {
            const depDateObj = new Date(f.scheduledDeparture);
            const arrDateObj = new Date(f.scheduledArrival);
            const depTime = depDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const arrTime = arrDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            // Category indicator badge
            const isD2I = f.routeCategory === 'domestic-to-international';
            const isI2I = f.routeCategory === 'international';
            const isDom = f.routeCategory === 'domestic';

            return (
              <div
                key={f.id}
                className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 transition-all shadow-xs hover:shadow-md space-y-4"
              >
                {/* Header Row: Airline, Flight Number, Aircraft, Status */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-900 to-indigo-800 border border-blue-700/40 flex items-center justify-center text-white shrink-0 shadow-xs">
                      <Plane className="w-5 h-5 -rotate-45" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-sm sm:text-base">{f.airline}</span>
                        <span className="font-mono font-bold text-blue-950 text-xs sm:text-sm px-2 py-0.5 rounded bg-blue-50 border border-blue-200">
                          {f.flightNumber}
                        </span>
                        {/* Route Tag */}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isD2I
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : isI2I
                              ? 'bg-sky-50 text-sky-700 border-sky-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {isD2I ? 'Domestic ✈ Intl' : isI2I ? 'International' : 'Domestic India'}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 block mt-0.5 font-medium">{f.aircraft}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusBadge(f)}
                  </div>
                </div>

                {/* Route & Progress Graphic */}
                <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-6 py-2">
                  {/* Departure Info */}
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Departure</span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-3xl font-black text-slate-900 tracking-tight">{f.origin.code}</span>
                      <span className="text-base font-extrabold text-blue-900 font-mono">{depTime}</span>
                    </div>
                    <div className="text-xs font-bold text-slate-800">{f.origin.city}</div>
                    <div className="text-[11px] text-slate-500 truncate max-w-[240px]">{f.origin.name}</div>
                    <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                      <span className="font-semibold text-slate-700">Terminal {f.origin.terminal || '1'}</span>
                      <span>•</span>
                      <span className="font-mono font-bold text-blue-900 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                        Gate {f.origin.gate || 'TBD'}
                      </span>
                    </div>
                  </div>

                  {/* Midflight Flight Progress Bar with Animated Plane */}
                  <div className="space-y-2 text-center px-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-600 font-mono">
                      <span>Duration: {f.duration}</span>
                      <span className="font-bold text-blue-900">
                        {f.status === 'IN_AIR'
                          ? `Arriving in ~${Math.floor((f.remainingMinutes || 60) / 60)}h ${(f.remainingMinutes || 60) % 60}m`
                          : f.status === 'BOARDING'
                          ? `Departs in ~${f.remainingMinutes || 15}m`
                          : f.status === 'DELAYED'
                          ? `Delayed ~${f.delayMinutes || 45}m`
                          : f.status}
                      </span>
                    </div>

                    {/* Progress Track */}
                    <div className="relative w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200 p-0.5">
                      <div
                        className={`h-full transition-all duration-1000 rounded-full ${
                          f.status === 'IN_AIR'
                            ? 'bg-gradient-to-r from-blue-700 via-indigo-600 to-sky-500'
                            : f.status === 'LANDED'
                            ? 'bg-emerald-500'
                            : f.status === 'BOARDING'
                            ? 'bg-amber-500'
                            : f.status === 'DELAYED'
                            ? 'bg-rose-500'
                            : 'bg-slate-300'
                        }`}
                        style={{ width: `${Math.max(8, Math.min(100, f.progressPercent))}%` }}
                      />
                    </div>

                    {/* Live In-Air Telemetry Specs */}
                    {f.status === 'IN_AIR' ? (
                      <div className="flex flex-wrap items-center justify-center gap-2.5 text-[11px] text-slate-600 font-mono pt-1">
                        <span className="flex items-center gap-1 text-slate-700">
                          <Compass className="w-3 h-3 text-sky-600" />
                          <span>Alt: {f.altitudeFt.toLocaleString()} ft</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-slate-700">
                          <Wind className="w-3 h-3 text-sky-600" />
                          <span>Spd: {f.speedKmh} km/h</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-slate-700">
                          <Navigation className="w-3 h-3 text-sky-600" />
                          <span>Hdg: {formatHeading(f.headingDeg)}</span>
                        </span>
                      </div>
                    ) : f.status === 'DELAYED' && f.delayReason ? (
                      <div className="text-[11px] text-rose-700 font-medium flex items-center justify-center gap-1 pt-1">
                        <AlertTriangle className="w-3 h-3 shrink-0 text-rose-600" />
                        <span>{f.delayReason}</span>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400 font-mono pt-1">
                        Transponder ADS-B Active • Real-time Radar Lock
                      </div>
                    )}
                  </div>

                  {/* Arrival Info */}
                  <div className="text-left md:text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Arrival</span>
                    <div className="flex items-baseline gap-2 justify-start md:justify-end mt-0.5">
                      <span className="text-base font-extrabold text-blue-900 font-mono">{arrTime}</span>
                      <span className="text-3xl font-black text-slate-900 tracking-tight">{f.destination.code}</span>
                    </div>
                    <div className="text-xs font-bold text-slate-800">{f.destination.city}</div>
                    <div className="text-[11px] text-slate-500 truncate max-w-[240px] ml-auto">{f.destination.name}</div>
                    <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-start md:justify-end gap-2">
                      <span className="font-semibold text-slate-700">Terminal {f.destination.terminal || '2'}</span>
                      <span>•</span>
                      <span className="font-mono font-bold text-blue-900 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                        Gate {f.destination.gate || 'TBD'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer details & Action */}
                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-slate-500">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Verified real-time satellite telemetry with ADS-B tracking</span>
                  </div>

                  {f.prices && onSelectFlightForBooking && (
                    <button
                      type="button"
                      onClick={() => {
                        const standardFlight: Flight = {
                          id: f.id,
                          flightNumber: f.flightNumber,
                          airline: f.airline,
                          aircraft: f.aircraft,
                          origin: {
                            code: f.origin.code,
                            name: f.origin.name,
                            city: f.origin.city,
                            country: f.origin.country || 'India',
                            category: isDom ? 'domestic' : 'international',
                            terminal: f.origin.terminal,
                          },
                          destination: {
                            code: f.destination.code,
                            name: f.destination.name,
                            city: f.destination.city,
                            country: f.destination.country || 'International',
                            category: isDom ? 'domestic' : 'international',
                            terminal: f.destination.terminal,
                          },
                          departureTime: f.scheduledDeparture,
                          arrivalTime: f.scheduledArrival,
                          duration: f.duration,
                          stops: 0,
                          prices: f.prices!,
                          availableSeats: { economy: 40, premiumEconomy: 12, business: 8, first: 4 },
                          status: 'SCHEDULED',
                          gate: f.origin.gate,
                        };
                        onSelectFlightForBooking(standardFlight, 'economy');
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold transition-all shadow-xs hover:shadow-md"
                    >
                      <span>Book From {formatPrice(f.prices.economy)}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
