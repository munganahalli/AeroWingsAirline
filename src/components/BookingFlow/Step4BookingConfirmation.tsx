import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CloudRain,
  Clock,
  Luggage,
  Mail,
  Plane,
  ShieldAlert,
  User,
} from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext.tsx';
import { fetchFlightWeather } from '../../lib/api.ts';
import type { CabinClass, FareBreakdown, Flight, Passenger } from '../../types/index.ts';

interface Step4Props {
  flight: Flight;
  cabinClass: CabinClass;
  passengers: Passenger[];
  contactEmail: string;
  contactPhone: string;
  fareBreakdown: FareBreakdown;
  onNext: () => void;
  onBack: () => void;
}

export function Step4BookingConfirmation({
  flight,
  cabinClass,
  passengers,
  contactEmail,
  contactPhone,
  fareBreakdown,
  onNext,
  onBack,
}: Step4Props) {
  const { formatPrice, currency } = useCurrency();
  const [weatherReport, setWeatherReport] = useState<any | null>(null);

  useEffect(() => {
    if (flight?.id) {
      fetchFlightWeather(flight.id)
        .then((data) => setWeatherReport(data))
        .catch(() => {});
    }
  }, [flight?.id]);

  const depTime = new Date(flight.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const arrTime = new Date(flight.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const depDate = new Date(flight.departureTime).toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const isDomestic =
    flight.origin.country?.toLowerCase() === 'india' && flight.destination.country?.toLowerCase() === 'india';
  const defaultCabinText =
    cabinClass === 'first'
      ? '2 Cabin Bags (18 kg) + Personal Item'
      : cabinClass === 'business'
      ? '2 Cabin Bags (14 kg) + Personal Item'
      : cabinClass === 'premiumEconomy'
      ? '1 Cabin Bag (10 kg) + Personal Item'
      : '1 Cabin Bag (7 kg) + Personal Item';

  const defaultCheckedText = isDomestic
    ? cabinClass === 'business'
      ? '35 kg (2 Pieces) Included'
      : cabinClass === 'premiumEconomy'
      ? '25 kg (1 Piece) Included'
      : '15 kg (1 Piece) Included'
    : cabinClass === 'first'
    ? '3x 32 kg (96 kg total) Included'
    : cabinClass === 'business'
    ? '2x 32 kg (64 kg total) Included'
    : cabinClass === 'premiumEconomy'
    ? '2x 23 kg (46 kg total) Included'
    : '23 kg (1 Piece) Included';

  return (
    <div className="space-y-6">
      {/* Prominent Pending status notification */}
      <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 shadow-xs">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-bold text-amber-950">
            Booking Review & Pending Payment Notice
          </h3>
          <p className="text-xs text-amber-800 mt-1 leading-relaxed">
            Please carefully review your flight schedule, passenger details, assigned seats, baggage selections, and customer contact information below.
            <strong className="text-amber-950 font-bold block mt-1">
              Notice: Your booking remains in PENDING status until simulated payment authorization and email OTP verification are completed in Step 5.
            </strong>
          </p>
        </div>
      </div>

      {/* Flight Overview Card */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-900">Selected Itinerary</span>
            <h3 className="text-lg font-bold text-slate-900 mt-0.5">
              {flight.origin.city} ({flight.origin.code}) to {flight.destination.city} ({flight.destination.code})
            </h3>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-xs text-slate-500 block">{depDate}</span>
            <span className="text-xs font-bold text-slate-700 capitalize">{cabinClass} Class • {flight.aircraft}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-6 py-2">
          {/* Departure */}
          <div>
            <span className="text-xs text-slate-500">Departure</span>
            <div className="text-2xl font-black text-slate-900">{depTime}</div>
            <div className="text-sm font-bold text-blue-900">{flight.origin.name} ({flight.origin.code})</div>
            <div className="text-xs text-slate-500">Terminal {flight.origin.terminal || '1'}</div>
          </div>

          {/* Route Graphic */}
          <div className="text-center">
            <div className="text-xs text-slate-500 flex items-center justify-center gap-1.5 mb-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{flight.duration}</span>
              <span>•</span>
              <span className="text-emerald-700 font-semibold">{flight.stops === 0 ? 'Non-Stop' : `${flight.stops} Stop`}</span>
            </div>
            <div className="relative my-2">
              <div className="h-0.5 bg-slate-200 w-full" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-blue-700">
                <Plane className="w-4 h-4 transform rotate-90" />
              </div>
            </div>
            <span className="text-xs text-slate-600 font-mono font-semibold">{flight.flightNumber} ({flight.airline})</span>
          </div>

          {/* Arrival */}
          <div className="text-left md:text-right">
            <span className="text-xs text-slate-500">Arrival</span>
            <div className="text-2xl font-black text-slate-900">{arrTime}</div>
            <div className="text-sm font-bold text-blue-900">{flight.destination.name} ({flight.destination.code})</div>
            <div className="text-xs text-slate-500">Terminal {flight.destination.terminal || '2'}</div>
          </div>
        </div>
      </div>

      {/* Weather-Risk Advisory Section (Requirement 9) */}
      {weatherReport && (
        <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wide">
              <CloudRain className="w-4 h-4 text-blue-800" />
              <span>Live Meteorological Route Advisory (Open-Meteo)</span>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                weatherReport.overallRisk === 'SEVERE'
                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                  : weatherReport.overallRisk === 'HIGH'
                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                  : weatherReport.overallRisk === 'MODERATE'
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}
            >
              {weatherReport.overallRisk} RISK
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase">
                {flight.origin.code} ({flight.origin.city}): {weatherReport.departureAirport.temperatureC}°C
              </span>
              <div className="font-semibold text-slate-800">{weatherReport.departureAirport.condition}</div>
              <div className="text-[11px] text-slate-500">
                Wind: {weatherReport.departureAirport.windSpeedKmh} km/h (Gusts: {weatherReport.departureAirport.windGustsKmh} km/h) • Vis: {(weatherReport.departureAirport.visibilityMeters / 1000).toFixed(1)} km
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase">
                {flight.destination.code} ({flight.destination.city}): {weatherReport.arrivalAirport.temperatureC}°C
              </span>
              <div className="font-semibold text-slate-800">{weatherReport.arrivalAirport.condition}</div>
              <div className="text-[11px] text-slate-500">
                Wind: {weatherReport.arrivalAirport.windSpeedKmh} km/h (Gusts: {weatherReport.arrivalAirport.windGustsKmh} km/h) • Vis: {(weatherReport.arrivalAirport.visibilityMeters / 1000).toFixed(1)} km
              </div>
            </div>
          </div>
          <p className="text-[10px] text-slate-400">
            * {weatherReport.disclaimer}
          </p>
        </div>
      )}

      {/* Passengers & Seats Review */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          Travelers & Seat Assignments ({passengers.length})
        </h3>
        <div className="divide-y divide-slate-100">
          {passengers.map((pax, index) => (
            <div key={pax.id} className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold">
                  {index + 1}
                </div>
                <div>
                  <span className="font-bold text-slate-900 text-sm">
                    {pax.title} {pax.firstName} {pax.lastName}
                  </span>
                  <div className="text-slate-500 mt-0.5">
                    ID: {pax.passportNumber} • {pax.nationality} • Meal: {pax.mealPreference}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-right">
                <span className="font-mono font-bold text-blue-900 px-2 py-0.5 rounded bg-blue-50 border border-blue-200">
                  {pax.seatNumber ? `Seat ${pax.seatNumber}` : 'Standard Allocated'}
                </span>
                {pax.baggage?.extraFeeUSD && pax.baggage.extraFeeUSD > 0 ? (
                  <span className="text-[11px] text-blue-700 font-semibold bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                    +${pax.baggage.extraFeeUSD} {pax.baggage.extraOptionTitle || 'Extra Bag'}
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Baggage Policy & Selections Review (Requirement 10) */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-sm font-bold text-slate-900">
          <Luggage className="w-4 h-4 text-blue-900" />
          <span>Baggage Policy & Selections</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="font-bold text-slate-900 block">Complimentary Included Allowance</span>
            <div>• Cabin: {defaultCabinText}</div>
            <div>• Checked: {defaultCheckedText}</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="font-bold text-slate-900 block">Additional Baggage Add-ons</span>
            {fareBreakdown.baggageFee && fareBreakdown.baggageFee > 0 ? (
              <div className="text-blue-900 font-semibold">
                Total extra baggage fee: ${fareBreakdown.baggageFee.toFixed(2)} USD ({formatPrice(fareBreakdown.baggageFee)})
              </div>
            ) : (
              <div className="text-emerald-700 font-semibold">No extra baggage requested (Zero extra charges)</div>
            )}
          </div>
        </div>
      </div>

      {/* Primary Customer Email Notice */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-900 shrink-0">
            <Mail className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs text-slate-500">Verified Booking Confirmation & Ticket Recipient</span>
            <div className="text-sm font-semibold text-slate-900 font-mono mt-0.5">{contactEmail}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Phone: {contactPhone || 'Not provided'}
            </p>
          </div>
        </div>
      </div>

      {/* Multi-Currency Fare Breakdown */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Fare Summary
          </h3>
          <span className="text-xs font-semibold text-slate-500">
            Display Currency: <strong className="text-blue-950 font-bold">{currency.code} ({currency.symbol})</strong>
          </span>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-600">
            <span>Base Airfare ({passengers.length} passenger{passengers.length > 1 ? 's' : ''})</span>
            <span className="font-mono font-semibold">
              {formatPrice(fareBreakdown.baseFare)} {currency.code !== 'USD' && `($${fareBreakdown.baseFare.toFixed(2)} USD)`}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-600">
            <span>Airport Security, Regulatory & Taxes</span>
            <span className="font-mono font-semibold">
              {formatPrice(fareBreakdown.taxesAndFees)} {currency.code !== 'USD' && `($${fareBreakdown.taxesAndFees.toFixed(2)} USD)`}
            </span>
          </div>

          {fareBreakdown.seatSelectionFee > 0 && (
            <div className="flex items-center justify-between text-slate-600">
              <span>Seat Selection & Extra Legroom Fees</span>
              <span className="font-mono font-semibold">
                {formatPrice(fareBreakdown.seatSelectionFee)} {currency.code !== 'USD' && `($${fareBreakdown.seatSelectionFee.toFixed(2)} USD)`}
              </span>
            </div>
          )}

          {fareBreakdown.baggageFee !== undefined && fareBreakdown.baggageFee > 0 && (
            <div className="flex items-center justify-between text-slate-600">
              <span>Additional Checked Baggage Fees</span>
              <span className="font-mono font-semibold text-blue-900">
                {formatPrice(fareBreakdown.baggageFee)} {currency.code !== 'USD' && `($${fareBreakdown.baggageFee.toFixed(2)} USD)`}
              </span>
            </div>
          )}

          <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-base font-bold text-slate-900">
            <div>
              <span className="text-blue-950 font-black">Total Pending Amount</span>
              <span className="block text-[11px] text-slate-500 font-normal">
                Settled in USD: ${fareBreakdown.totalAmount.toFixed(2)} USD
              </span>
            </div>
            <div className="text-right">
              <span className="text-blue-950 font-mono text-xl font-black">
                {formatPrice(fareBreakdown.totalAmount)}
              </span>
              {currency.code !== 'USD' && (
                <span className="block text-xs font-mono text-slate-500">
                  (${fareBreakdown.totalAmount.toFixed(2)} USD)
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Buttons (Backward works cleanly without clearing state!) */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 py-3 px-5 border border-slate-300 hover:border-slate-400 text-slate-700 hover:text-slate-900 font-semibold rounded-xl transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Traveler Details</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="flex items-center gap-2 py-3 px-6 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl transition-colors shadow-xs text-sm"
        >
          <span>Proceed to Pay & Verify OTP (Step 5)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
