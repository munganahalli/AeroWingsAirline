import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  ArrowRightLeft,
  Calendar,
  CheckCircle2,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { AirportSearchSelector } from './Search/AirportSearchSelector.tsx';
import { CabinSelector } from './Search/CabinSelector.tsx';
import { TravelersSelector } from './Search/TravelersSelector.tsx';
import type { Airport, CabinClass, TravelerCounts } from '../types/index.ts';
import heroAircraftImg from '../assets/images/aerowings_hero_sky.jpg';

export type TripType = 'oneWay' | 'roundTrip' | 'multiCity';

interface MultiCityFlightLeg {
  id: string;
  origin: string;
  destination: string;
  date: string;
}

interface HeroSearchProps {
  airports?: Airport[];
  onSearch: (params: {
    origin: string;
    destination: string;
    cabinClass: CabinClass;
    travelers: number;
    travelerCounts: TravelerCounts;
    date: string;
    tripType?: TripType;
    returnDate?: string;
    multiCityLegs?: MultiCityFlightLeg[];
  }) => void;
  initialValues?: {
    origin?: string;
    destination?: string;
    cabinClass?: CabinClass;
    travelerCounts?: TravelerCounts;
    date?: string;
  };
}

export function HeroSearch({ onSearch, initialValues }: HeroSearchProps) {
  const [tripType, setTripType] = useState<TripType>('oneWay');
  const [origin, setOrigin] = useState<string>(initialValues?.origin || 'DEL');
  const [destination, setDestination] = useState<string>(initialValues?.destination || 'BOM');
  const [cabinClass, setCabinClass] = useState<CabinClass>(initialValues?.cabinClass || 'economy');
  const [travelerCounts, setTravelerCounts] = useState<TravelerCounts>(
    initialValues?.travelerCounts || { adults: 1, children: 0, infants: 0 }
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  const [departureDate, setDepartureDate] = useState(() => {
    if (initialValues?.date) return initialValues.date;
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });

  const [returnDate, setReturnDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 9);
    return d.toISOString().split('T')[0];
  });

  // Multi-City flight legs state
  const [multiCityLegs, setMultiCityLegs] = useState<MultiCityFlightLeg[]>([
    {
      id: 'leg-1',
      origin: 'DEL',
      destination: 'DXB',
      date: (() => {
        const d = new Date();
        d.setDate(d.getDate() + 2);
        return d.toISOString().split('T')[0];
      })(),
    },
    {
      id: 'leg-2',
      origin: 'DXB',
      destination: 'LHR',
      date: (() => {
        const d = new Date();
        d.setDate(d.getDate() + 6);
        return d.toISOString().split('T')[0];
      })(),
    },
  ]);

  const handleSwap = () => {
    if (!origin || !destination) return;
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
    setValidationError(null);
  };

  const handleAddMultiCityLeg = () => {
    if (multiCityLegs.length >= 4) {
      setValidationError('You can search up to 4 flight legs in a single multi-city itinerary.');
      return;
    }
    const lastLeg = multiCityLegs[multiCityLegs.length - 1];
    const prevDate = new Date(lastLeg.date || Date.now());
    prevDate.setDate(prevDate.getDate() + 3);
    const nextDate = prevDate.toISOString().split('T')[0];

    setMultiCityLegs([
      ...multiCityLegs,
      {
        id: `leg-${Date.now()}`,
        origin: lastLeg.destination || 'LHR',
        destination: 'DEL',
        date: nextDate,
      },
    ]);
    setValidationError(null);
  };

  const handleRemoveMultiCityLeg = (index: number) => {
    if (multiCityLegs.length <= 2) {
      setValidationError('Multi-city itineraries must contain at least 2 flight legs.');
      return;
    }
    setMultiCityLegs(multiCityLegs.filter((_, i) => i !== index));
    setValidationError(null);
  };

  const handleUpdateMultiCityLeg = (
    index: number,
    field: 'origin' | 'destination' | 'date',
    value: string
  ) => {
    const updated = [...multiCityLegs];
    updated[index] = { ...updated[index], [field]: value };
    setMultiCityLegs(updated);
    setValidationError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const totalTravelers = travelerCounts.adults + travelerCounts.children + travelerCounts.infants;
    if (travelerCounts.adults < 1) {
      setValidationError('At least one adult passenger (12+) is required for booking.');
      return;
    }

    if (travelerCounts.infants > travelerCounts.adults) {
      setValidationError('Each infant must be accompanied by at least one adult.');
      return;
    }

    if (tripType === 'multiCity') {
      for (let i = 0; i < multiCityLegs.length; i++) {
        const leg = multiCityLegs[i];
        if (!leg.origin || !leg.destination) {
          setValidationError(`Flight Leg ${i + 1}: Please select both Origin and Destination airports.`);
          return;
        }
        if (leg.origin.toUpperCase() === leg.destination.toUpperCase()) {
          setValidationError(`Flight Leg ${i + 1}: Origin and destination cannot be identical.`);
          return;
        }
      }
      // For multi-city, search the first leg's route
      const firstLeg = multiCityLegs[0];
      onSearch({
        origin: firstLeg.origin,
        destination: firstLeg.destination,
        cabinClass,
        travelers: totalTravelers,
        travelerCounts,
        date: firstLeg.date,
        tripType,
        multiCityLegs,
      });
      return;
    }

    // One Way or Round Trip
    if (!origin || !destination) {
      setValidationError('Please select both Origin and Destination airports.');
      return;
    }

    if (origin.toUpperCase() === destination.toUpperCase()) {
      setValidationError('Origin and destination airports cannot be identical. Please select different airports.');
      return;
    }

    if (tripType === 'roundTrip') {
      if (!returnDate) {
        setValidationError('Please select a return date for your round trip flight.');
        return;
      }
      if (new Date(returnDate) < new Date(departureDate)) {
        setValidationError('Return date must be on or after your departure date.');
        return;
      }
    }

    onSearch({
      origin,
      destination,
      cabinClass,
      travelers: totalTravelers,
      travelerCounts,
      date: departureDate,
      tripType,
      returnDate: tripType === 'roundTrip' ? returnDate : undefined,
    });
  };

  return (
    <div className="relative">
      {/* Hero Visual Section with aircraft photo */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-blue-950 shadow-lg min-h-[360px] flex items-center">
        {/* Background aircraft photo with measured airline gradient */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src={heroAircraftImg}
            alt="AeroWings airliner cruising above clouds"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/assets/images/aerowings_hero_sky.jpg';
            }}
            className="w-full h-full object-cover object-[center_35%] opacity-90 sm:opacity-95 transform scale-105 transition-transform duration-700 hover:scale-100"
          />
          {/* Measured dual-layer scrim: preserves aircraft visibility while ensuring high-contrast text */}
          <div className="absolute inset-0 bg-gradient-to-t from-blue-950/92 via-blue-950/45 to-blue-950/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-950/60 via-transparent to-blue-950/60" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-10 sm:py-14 text-center space-y-3.5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/90 border border-blue-200 text-xs font-bold text-blue-950 shadow-xs backdrop-blur-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
            <span>Official AeroWings Flight Reservations • Verified OTP & E-Tickets</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight hero-title">
            Your Journey Begins Here
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-blue-100 max-w-2xl mx-auto leading-relaxed font-medium">
            Discover destinations worldwide, compare flight options, and book your next journey with ease and confidence
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-2 text-xs text-blue-100">
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              294 Global Destinations
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              100 Filterable Airlines
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Multi-Currency & Instant E-Ticket
            </span>
          </div>
        </div>
      </div>

      {/* Flight Search Strip Floating Card */}
      <div className="relative z-20 -mt-10 max-w-5xl mx-auto px-4 sm:px-6">
        <form
          onSubmit={handleSubmit}
          className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xl space-y-4"
        >
          {validationError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Top Options Bar: Trip Types, Cabin Class & Travelers */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-100">
            {/* Trip Type Selector (One Way, Round Trip, Multi-City) */}
            <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/80 self-start">
              <button
                type="button"
                onClick={() => {
                  setTripType('oneWay');
                  setValidationError(null);
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  tripType === 'oneWay'
                    ? 'bg-white text-blue-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                One Way
              </button>
              <button
                type="button"
                onClick={() => {
                  setTripType('roundTrip');
                  setValidationError(null);
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  tripType === 'roundTrip'
                    ? 'bg-white text-blue-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Round Trip
              </button>
              <button
                type="button"
                onClick={() => {
                  setTripType('multiCity');
                  setValidationError(null);
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  tripType === 'multiCity'
                    ? 'bg-white text-blue-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Multi-City
              </button>
            </div>

            {/* Cabin Class & Travelers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full md:w-auto">
              <div className="sm:w-44">
                <CabinSelector
                  value={cabinClass}
                  onChange={(c) => setCabinClass(c)}
                  label="Cabin Class"
                />
              </div>
              <div className="sm:w-56">
                <TravelersSelector
                  value={travelerCounts}
                  onChange={(t) => setTravelerCounts(t)}
                />
              </div>
            </div>
          </div>

          {/* STANDARD (ONE WAY & ROUND TRIP) INPUTS */}
          {tripType !== 'multiCity' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
              {/* From (Origin) */}
              <div className={tripType === 'roundTrip' ? 'lg:col-span-3' : 'lg:col-span-4'}>
                <AirportSearchSelector
                  label="From (Origin)"
                  value={origin}
                  onChange={(code) => {
                    setOrigin(code);
                    setValidationError(null);
                  }}
                  disabledAirportCode={destination}
                  placeholder="Select origin airport..."
                  iconColor="text-blue-900"
                />
              </div>

              {/* Swap Button */}
              <div className="flex lg:col-span-1 justify-center pb-0.5">
                <button
                  type="button"
                  onClick={handleSwap}
                  className="w-full sm:w-auto p-2.5 rounded-xl bg-slate-100 hover:bg-blue-50 border border-slate-300 hover:border-blue-300 text-slate-700 hover:text-blue-900 transition-colors shadow-xs flex items-center justify-center gap-1.5"
                  title="Swap Origin & Destination"
                  aria-label="Swap Origin & Destination"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  <span className="lg:hidden text-xs font-bold">Swap</span>
                </button>
              </div>

              {/* To (Destination) */}
              <div className={tripType === 'roundTrip' ? 'lg:col-span-3' : 'lg:col-span-4'}>
                <AirportSearchSelector
                  label="To (Destination)"
                  value={destination}
                  onChange={(code) => {
                    setDestination(code);
                    setValidationError(null);
                  }}
                  disabledAirportCode={origin}
                  placeholder="Select destination airport..."
                  iconColor="text-emerald-700"
                />
              </div>

              {/* Departure Date */}
              <div className={tripType === 'roundTrip' ? 'lg:col-span-2' : 'lg:col-span-3'}>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1 tracking-wide">
                  Departure Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="date"
                    value={departureDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-2.5 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-700 focus:bg-white"
                  />
                </div>
              </div>

              {/* Return Date (Shown exclusively for Round Trip) */}
              {tripType === 'roundTrip' && (
                <div className="lg:col-span-3">
                  <label className="block text-[11px] font-bold text-blue-900 uppercase mb-1 tracking-wide flex items-center justify-between">
                    <span>Return Date</span>
                    <span className="text-[10px] text-blue-600 font-normal">Round Trip</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 w-4 h-4 text-blue-700" />
                    <input
                      type="date"
                      value={returnDate}
                      min={departureDate || new Date().toISOString().split('T')[0]}
                      onChange={(e) => setReturnDate(e.target.value)}
                      className="w-full bg-blue-50/50 border border-blue-300 rounded-xl pl-9 pr-2.5 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-700 focus:bg-white"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MULTI-CITY FLIGHT LEGS BUILDER */}
          {tripType === 'multiCity' && (
            <div className="space-y-3 pt-1">
              <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Multi-City Flight Segments ({multiCityLegs.length} Legs)</span>
                <span className="text-[11px] text-slate-500 font-normal">Add up to 4 flight legs</span>
              </div>

              {multiCityLegs.map((leg, index) => (
                <div
                  key={leg.id}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
                >
                  <div className="sm:col-span-1 flex items-center justify-center sm:justify-start pb-2">
                    <span className="w-7 h-7 rounded-lg bg-blue-900 text-white flex items-center justify-center font-bold text-xs">
                      {index + 1}
                    </span>
                  </div>

                  {/* Origin */}
                  <div className="sm:col-span-4">
                    <AirportSearchSelector
                      label={`Flight ${index + 1}: From`}
                      value={leg.origin}
                      onChange={(code) => handleUpdateMultiCityLeg(index, 'origin', code)}
                      disabledAirportCode={leg.destination}
                      placeholder="Origin airport..."
                      iconColor="text-blue-900"
                    />
                  </div>

                  {/* Destination */}
                  <div className="sm:col-span-4">
                    <AirportSearchSelector
                      label={`Flight ${index + 1}: To`}
                      value={leg.destination}
                      onChange={(code) => handleUpdateMultiCityLeg(index, 'destination', code)}
                      disabledAirportCode={leg.origin}
                      placeholder="Destination airport..."
                      iconColor="text-emerald-700"
                    />
                  </div>

                  {/* Date */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1 tracking-wide">
                      Date
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-2.5 top-3 w-3.5 h-3.5 text-slate-500" />
                      <input
                        type="date"
                        value={leg.date}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => handleUpdateMultiCityLeg(index, 'date', e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-2 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-700"
                      />
                    </div>
                  </div>

                  {/* Remove Button */}
                  <div className="sm:col-span-1 flex justify-end pb-1">
                    {multiCityLegs.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMultiCityLeg(index)}
                        className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Remove Flight Segment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {multiCityLegs.length < 4 && (
                <button
                  type="button"
                  onClick={handleAddMultiCityLeg}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors border border-slate-300"
                >
                  <Plus className="w-3.5 h-3.5 text-slate-600" />
                  <span>Add Another Flight Leg</span>
                </button>
              )}
            </div>
          )}

          {/* Submit Action Bar */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
            <div className="text-xs text-slate-500 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live real-time inventory from 100 filterable airlines</span>
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto py-3 px-8 bg-blue-900 hover:bg-blue-800 text-white font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 shadow-md text-sm hover:scale-[1.02]"
            >
              <Search className="w-4 h-4" />
              <span>
                {tripType === 'multiCity'
                  ? `Search ${multiCityLegs.length}-Leg Itinerary`
                  : tripType === 'roundTrip'
                  ? 'Search Round Trip Flights'
                  : 'Search Flights'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
