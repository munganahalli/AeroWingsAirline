import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Check,
  Clock,
  CloudLightning,
  CloudRain,
  CloudSun,
  Filter,
  Luggage,
  Plane,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Thermometer,
  Wind,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useCurrency } from '../../context/CurrencyContext.tsx';
import { predictRouteWeather } from '../../lib/api.ts';
import { AirlineFilter } from '../Search/AirlineFilter.tsx';
import type { CabinClass, Flight } from '../../types/index.ts';

interface Step1Props {
  flights: Flight[];
  selectedFlight: Flight | null;
  selectedCabinClass: CabinClass;
  onSelectFlight: (flight: Flight, cabin: CabinClass) => void;
  onNext: () => void;
  onRequestSignIn?: (flight: Flight, cabin: CabinClass) => void;
}

export function Step1FlightSelection({
  flights,
  selectedFlight,
  selectedCabinClass,
  onSelectFlight,
  onNext,
  onRequestSignIn,
}: Step1Props) {
  const { user } = useAuth();
  const { formatPrice, currency } = useCurrency();
  const [filterStops, setFilterStops] = useState<'all' | 'direct'>('all');
  const [selectedAirlines, setSelectedAirlines] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'price' | 'duration' | 'departure'>('price');

  // Real-Time Route Weather Predictor State
  const [routeWeather, setRouteWeather] = useState<any | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  useEffect(() => {
    if (flights.length > 0) {
      const orig = flights[0].origin.code;
      const dest = flights[0].destination.code;
      setWeatherLoading(true);
      predictRouteWeather(orig, dest)
        .then((data) => setRouteWeather(data))
        .catch((err) => console.error('Route weather fetch error', err))
        .finally(() => setWeatherLoading(false));
    }
  }, [flights]);

  // List of airlines present in the current flight dataset
  const availableAirlinesInFlightData = useMemo(() => {
    return Array.from(new Set(flights.map((f) => f.airline)));
  }, [flights]);

  // Combined filtering: stops + airlines + cabin availability
  const filteredFlights = useMemo(() => {
    return flights
      .filter((f) => {
        // Stops filter
        if (filterStops === 'direct' && f.stops !== 0) return false;

        // Airline multi-select filter
        if (selectedAirlines.length > 0) {
          const match = selectedAirlines.some(
            (airline) => airline.trim().toLowerCase() === f.airline.trim().toLowerCase()
          );
          if (!match) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price') return a.prices[selectedCabinClass] - b.prices[selectedCabinClass];
        if (sortBy === 'departure')
          return new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime();
        return a.duration.localeCompare(b.duration);
      });
  }, [flights, filterStops, selectedAirlines, sortBy, selectedCabinClass]);

  const bottomCtaRef = React.useRef<HTMLDivElement>(null);
  const [justSelected, setJustSelected] = useState(false);

  const handleFlightSelect = (flight: Flight, cabin: CabinClass) => {
    onSelectFlight(flight, cabin);
    setJustSelected(true);
    // Smooth scroll down to bottom where next step CTA is located
    setTimeout(() => {
      bottomCtaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 60);
    // Reset attention pulse after 2.5s
    setTimeout(() => {
      setJustSelected(false);
    }, 2500);
  };

  const cabinClasses: { key: CabinClass; label: string; badge: string }[] = [
    { key: 'economy', label: 'Economy', badge: 'Standard Cabin' },
    { key: 'premiumEconomy', label: 'Premium Economy', badge: 'Extra Recline' },
    { key: 'business', label: 'Business', badge: 'Lie-Flat & Lounge' },
    { key: 'first', label: 'First Class', badge: 'Private Suite' },
  ];

  const handleProceed = () => {
    if (!selectedFlight) return;
    if (!user) {
      if (onRequestSignIn) {
        onRequestSignIn(selectedFlight, selectedCabinClass);
      }
      return;
    }
    onNext();
  };

  return (
    <div className="space-y-6 relative pb-16">
      {/* Top Filter and Info Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span>Step 1: Select Your Flight</span>
              {!user && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  Sign in required to book
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Showing {filteredFlights.length} matching schedules • Select any flight to proceed to traveler details
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* 100 Airline Filter Button */}
            <AirlineFilter
              selectedAirlines={selectedAirlines}
              onChange={setSelectedAirlines}
              availableAirlinesInFlightData={availableAirlinesInFlightData}
            />

            {/* Direct filter */}
            <div className="flex items-center p-1 bg-slate-100 border border-slate-200 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setFilterStops('all')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  filterStops === 'all'
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Stops
              </button>
              <button
                type="button"
                onClick={() => setFilterStops('direct')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  filterStops === 'direct'
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Non-Stop
              </button>
            </div>

            {/* Sort selector */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-50 border border-slate-300 text-xs text-slate-700 font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-blue-700 shadow-xs"
            >
              <option value="price">Lowest Fare</option>
              <option value="departure">Earliest Departure</option>
              <option value="duration">Shortest Duration</option>
            </select>
          </div>
        </div>

        {/* Active Filters Pill Bar (when filters applied) */}
        {(selectedAirlines.length > 0 || filterStops !== 'all') && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-500 text-[11px] font-bold">Active filters:</span>
            {selectedAirlines.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-900 border border-blue-200 text-[11px] font-medium">
                <span>Airlines ({selectedAirlines.length})</span>
                <button
                  type="button"
                  onClick={() => setSelectedAirlines([])}
                  className="hover:text-rose-700 ml-1 font-bold"
                >
                  ×
                </button>
              </span>
            )}
            {filterStops === 'direct' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-900 border border-blue-200 text-[11px] font-medium">
                <span>Non-Stop Only</span>
                <button
                  type="button"
                  onClick={() => setFilterStops('all')}
                  className="hover:text-rose-700 ml-1 font-bold"
                >
                  ×
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                setSelectedAirlines([]);
                setFilterStops('all');
              }}
              className="text-[11px] text-slate-500 hover:text-blue-900 font-bold ml-1 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Reset all
            </button>
          </div>
        )}
      </div>

      {/* Real-Time Route Weather Predictor & Adverse Weather Auto-Refund Guarantee Widget */}
      {routeWeather && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900 via-blue-950 to-slate-900 text-white shadow-md space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 pb-2 border-b border-blue-800/60">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-800 flex items-center justify-center text-amber-300">
                <Thermometer className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
                  Real-Time Meteorological Weather Predictor
                </span>
                <div className="text-[11px] text-blue-300">
                  Live temperatures & route safety monitoring • 100% auto-refund guarantee on bad weather
                </div>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-800/80 border border-blue-700 text-[11px] font-semibold text-emerald-300">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Auto-Refund Protection Active</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Origin Weather */}
            <div className="p-3 rounded-xl bg-blue-900/60 border border-blue-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-blue-300 uppercase font-bold block">
                  Departure ({routeWeather.origin.city})
                </span>
                <div className="text-lg font-black font-mono text-white mt-0.5">
                  {routeWeather.origin.temperatureC}°C <span className="text-xs font-normal text-blue-300">({routeWeather.origin.temperatureF}°F)</span>
                </div>
                <div className="text-[11px] text-blue-200 flex items-center gap-1 mt-0.5">
                  <CloudSun className="w-3 h-3 text-amber-300" />
                  <span>{routeWeather.origin.condition || routeWeather.origin.weatherCondition || 'Clear Aviation Weather'}</span>
                </div>
              </div>
              <div className="text-right text-[11px] text-blue-300 font-mono">
                <div>Wind: {routeWeather.origin.windSpeedKmh ?? routeWeather.origin.windSpeedKmH ?? 8} km/h</div>
                <div>Vis: {routeWeather.origin.visibilityMeters ? `${Math.round(routeWeather.origin.visibilityMeters / 1000)} km` : `${routeWeather.origin.visibilityKm || 10} km`}</div>
              </div>
            </div>

            {/* Destination Weather */}
            <div className="p-3 rounded-xl bg-blue-900/60 border border-blue-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-blue-300 uppercase font-bold block">
                  Arrival ({routeWeather.destination.city})
                </span>
                <div className="text-lg font-black font-mono text-white mt-0.5">
                  {routeWeather.destination.temperatureC}°C <span className="text-xs font-normal text-blue-300">({routeWeather.destination.temperatureF}°F)</span>
                </div>
                <div className="text-[11px] text-blue-200 flex items-center gap-1 mt-0.5">
                  <CloudSun className="w-3 h-3 text-amber-300" />
                  <span>{routeWeather.destination.condition || routeWeather.destination.weatherCondition || 'Clear Aviation Weather'}</span>
                </div>
              </div>
              <div className="text-right text-[11px] text-blue-300 font-mono">
                <div>Wind: {routeWeather.destination.windSpeedKmh ?? routeWeather.destination.windSpeedKmH ?? 10} km/h</div>
                <div>Vis: {routeWeather.destination.visibilityMeters ? `${Math.round(routeWeather.destination.visibilityMeters / 1000)} km` : `${routeWeather.destination.visibilityKm || 10} km`}</div>
              </div>
            </div>
          </div>

          <div className="pt-1 text-[11px] text-blue-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span>
              <strong>Weather Safety Guarantee:</strong> In the event adverse weather (thunderstorms, typhoons, low visibility) disrupts flights, our system automatically cancels reservations and processes a <strong>100% full refund</strong> with zero cancellation deductions.
            </span>
          </div>
        </div>
      )}

      {/* Flight Cards List */}
      {filteredFlights.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
            <Plane className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {selectedAirlines.length > 0
                ? 'No flights found for the selected airline'
                : 'No flights match your search criteria'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              {selectedAirlines.length > 0
                ? `None of our current schedules match the selected airline${
                    selectedAirlines.length > 1 ? 's' : ''
                  }. You can clear the airline filter to inspect all available schedules.`
                : 'Try adjusting your destination, cabin class, or date filters to find available schedules.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setSelectedAirlines([]);
              setFilterStops('all');
            }}
            className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
          >
            Show All Available Flights
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredFlights.map((flight) => {
            const isSelected = selectedFlight?.id === flight.id;
            const depTime = new Date(flight.departureTime).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });
            const arrTime = new Date(flight.arrivalTime).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });
            const depDate = new Date(flight.departureTime).toLocaleDateString([], {
              month: 'short',
              day: 'numeric',
            });

            return (
              <div
                key={flight.id}
                onClick={() => {
                  if (!isSelected) {
                    handleFlightSelect(flight, selectedCabinClass);
                  }
                }}
                className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50/70 border-blue-600 ring-2 ring-blue-500/40 shadow-md'
                    : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm'
                }`}
              >
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                  {/* Flight Schedule */}
                  <div className="flex-1 w-full">
                    <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-500 mb-3">
                      <span className="font-bold text-blue-950 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">
                        {flight.airline}
                      </span>
                      <span>•</span>
                      <span className="font-mono text-blue-800 font-bold">{flight.flightNumber}</span>
                      <span>•</span>
                      <span>{flight.aircraft}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-slate-600">
                        <Luggage className="w-3.5 h-3.5" />
                        Standard Baggage Included
                      </span>
                      {isSelected && (
                        <span className="ml-auto inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-300">
                          <Check className="w-3 h-3 text-emerald-700" />
                          <span>Currently Chosen Flight</span>
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 items-center gap-4 max-w-xl">
                      {/* Origin */}
                      <div>
                        <div className="text-2xl font-black text-slate-900 tracking-tight">{depTime}</div>
                        <div className="text-base font-bold text-blue-900">{flight.origin.code}</div>
                        <div className="text-xs text-slate-600 truncate font-medium">{flight.origin.city}</div>
                        <div className="text-[11px] text-slate-400">{depDate} • T{flight.origin.terminal || '1'}</div>
                      </div>

                      {/* Duration / Stops */}
                      <div className="text-center">
                        <div className="text-xs text-slate-500 flex items-center justify-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{flight.duration}</span>
                        </div>
                        <div className="relative my-2">
                          <div className="h-0.5 bg-slate-200 w-full" />
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-blue-800">
                            <Plane className="w-3.5 h-3.5 transform rotate-90" />
                          </div>
                        </div>
                        <span className="text-[11px] font-bold text-emerald-700">
                          {flight.stops === 0 ? 'Non-Stop' : `${flight.stops} Stop`}
                        </span>
                      </div>

                      {/* Destination */}
                      <div className="text-right">
                        <div className="text-2xl font-black text-slate-900 tracking-tight">{arrTime}</div>
                        <div className="text-base font-bold text-blue-900">{flight.destination.code}</div>
                        <div className="text-xs text-slate-600 truncate font-medium">{flight.destination.city}</div>
                        <div className="text-[11px] text-slate-400">T{flight.destination.terminal || '2'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Cabin Selection & Pricing Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full lg:w-auto">
                    {cabinClasses.map(({ key, label }) => {
                      const priceUSD = flight.prices[key];
                      const availableSeats = flight.availableSeats[key] || 0;
                      const isSoldOut = availableSeats <= 0;
                      const isCabinActive = isSelected && selectedCabinClass === key;
                      const formatted = formatPrice(priceUSD);

                      return (
                        <button
                          key={key}
                          type="button"
                          disabled={isSoldOut}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFlightSelect(flight, key);
                          }}
                          className={`p-3 rounded-xl border text-left transition-all min-w-[115px] relative ${
                            isSoldOut
                              ? 'bg-slate-100/60 border-slate-200 opacity-50 cursor-not-allowed'
                              : isCabinActive
                              ? 'bg-blue-900 text-white border-blue-950 shadow-md ring-2 ring-blue-500 scale-[1.02]'
                              : 'bg-slate-50 border-slate-200 hover:border-blue-400 text-slate-800 hover:bg-white'
                          }`}
                        >
                          <div
                            className={`text-[10px] font-bold uppercase tracking-wider truncate ${
                              isCabinActive ? 'text-blue-200' : 'text-slate-500'
                            }`}
                          >
                            {label}
                          </div>

                          <div
                            className={`text-base font-extrabold mt-1 font-mono ${
                              isCabinActive ? 'text-white' : 'text-slate-900'
                            }`}
                          >
                            {formatted}
                          </div>

                          <div
                            className={`text-[10px] mt-0.5 ${
                              isCabinActive ? 'text-blue-200' : 'text-slate-400'
                            }`}
                          >
                            {isSoldOut ? (
                              <span className="text-rose-500 font-bold">Sold Out</span>
                            ) : availableSeats <= 5 ? (
                              <span className="text-amber-500 font-semibold">{availableSeats} seats left</span>
                            ) : currency.code !== 'USD' ? (
                              `($${priceUSD} USD)`
                            ) : (
                              '/ traveler'
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Direct card proceed action when selected */}
                {isSelected && (
                  <div className="mt-4 pt-3 border-t border-blue-200 flex flex-wrap items-center justify-between gap-3 bg-white/70 p-3 rounded-xl">
                    <div className="text-xs text-blue-900 flex items-center gap-1.5 font-medium">
                      <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>
                        Flight selected! Scrolled down to next step, or proceed right here:
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleProceed();
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
                    >
                      <span>{user ? 'Continue to Traveler Details' : 'Sign In & Continue'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Continue CTA / Bottom Action Area (Target of smooth auto-scroll when selecting flight) */}
      <div
        ref={bottomCtaRef}
        id="step1-bottom-cta"
        className={`p-5 rounded-2xl border transition-all ${
          justSelected
            ? 'bg-blue-50 border-blue-500 ring-4 ring-blue-400/40 shadow-lg scale-[1.01]'
            : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            {selectedFlight ? (
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold mb-1">
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span>Ready for Next Step</span>
                </div>
                <p className="text-sm font-bold text-slate-900">
                  {selectedFlight.airline} {selectedFlight.flightNumber} • {selectedFlight.origin.code} → {selectedFlight.destination.code}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cabin: <span className="capitalize font-semibold text-blue-900">{selectedCabinClass} Class</span> • Total Airfare: <span className="font-mono font-bold text-slate-800">{formatPrice(selectedFlight.prices[selectedCabinClass])}</span> / traveler
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-bold text-slate-700">Please choose a flight from the schedule above</p>
                <p className="text-xs text-slate-400 mt-0.5">Select your preferred airline and cabin class to proceed to Seat Selection</p>
              </div>
            )}
          </div>

          <button
            type="button"
            disabled={!selectedFlight}
            onClick={handleProceed}
            className="w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-8 bg-blue-900 hover:bg-blue-800 text-white font-extrabold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md text-sm hover:scale-[1.02]"
          >
            <span>{user ? 'Continue to Seat Selection (Step 2)' : 'Sign In & Select Seats'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
