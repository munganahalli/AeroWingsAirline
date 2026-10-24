import React, { useState } from 'react';
import {
  ArrowRight,
  Calendar,
  ChevronRight,
  Compass,
  Filter,
  MapPin,
  Plane,
  Sparkles,
} from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext.tsx';

export interface TravelOptionCard {
  id: string;
  city: string;
  country: string;
  originCode: string;
  originCity: string;
  destCode: string;
  destCity: string;
  dates: string;
  flightType: 'Direct' | '1 Stop';
  tripType: 'Return' | 'One way';
  airline: string;
  basePriceUSD: number;
  imageUrl: string;
  category: 'domestic' | 'international' | 'deal';
}

const TRAVEL_PACKAGES: TravelOptionCard[] = [
  {
    id: 'pkg-hubli',
    city: 'Hubli',
    country: 'India',
    originCode: 'BLR',
    originCity: 'Bengaluru',
    destCode: 'HBX',
    destCity: 'Hubballi / Hubli',
    dates: '16 May - 23 May',
    flightType: 'Direct',
    tripType: 'Return',
    airline: 'Fly91',
    basePriceUSD: 42,
    imageUrl: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=800&q=80',
    category: 'domestic',
  },
  {
    id: 'pkg-goa',
    city: 'Goa',
    country: 'India',
    originCode: 'DEL',
    originCity: 'Delhi',
    destCode: 'GOX',
    destCity: 'North Goa (Mopa)',
    dates: '18 May - 25 May',
    flightType: 'Direct',
    tripType: 'Return',
    airline: 'IndiGo',
    basePriceUSD: 72,
    imageUrl: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80',
    category: 'domestic',
  },
  {
    id: 'pkg-srinagar',
    city: 'Srinagar / Kashmir',
    country: 'India',
    originCode: 'DEL',
    originCity: 'Delhi',
    destCode: 'SXR',
    destCity: 'Srinagar',
    dates: '01 Jun - 08 Jun',
    flightType: 'Direct',
    tripType: 'Return',
    airline: 'Air India',
    basePriceUSD: 85,
    imageUrl: 'https://images.unsplash.com/photo-1598091383021-15ddea10925d?auto=format&fit=crop&w=800&q=80',
    category: 'domestic',
  },
  {
    id: 'pkg-abudhabi',
    city: 'Abu Dhabi',
    country: 'United Arab Emirates',
    originCode: 'BLR',
    originCity: 'Bengaluru',
    destCode: 'AUH',
    destCity: 'Abu Dhabi',
    dates: '23 May - 30 May',
    flightType: 'Direct',
    tripType: 'Return',
    airline: 'Etihad Airways',
    basePriceUSD: 95,
    imageUrl: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80',
    category: 'deal',
  },
  {
    id: 'pkg-muscat',
    city: 'Muscat',
    country: 'Oman',
    originCode: 'BLR',
    originCity: 'Bengaluru',
    destCode: 'MCT',
    destCity: 'Muscat',
    dates: '15 Jun - 22 Jun',
    flightType: 'Direct',
    tripType: 'Return',
    airline: 'Oman Air',
    basePriceUSD: 102,
    imageUrl: 'https://images.unsplash.com/photo-1578895101407-16013a77d5ec?auto=format&fit=crop&w=800&q=80',
    category: 'deal',
  },
  {
    id: 'pkg-dubai',
    city: 'Dubai',
    country: 'United Arab Emirates',
    originCode: 'BOM',
    originCity: 'Mumbai',
    destCode: 'DXB',
    destCity: 'Dubai',
    dates: '05 Jun - 12 Jun',
    flightType: 'Direct',
    tripType: 'Return',
    airline: 'Emirates',
    basePriceUSD: 170,
    imageUrl: 'https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=800&q=80',
    category: 'deal',
  },
  {
    id: 'pkg-singapore',
    city: 'Singapore',
    country: 'Singapore',
    originCode: 'DEL',
    originCity: 'Delhi',
    destCode: 'SIN',
    destCity: 'Singapore',
    dates: '12 Jun - 19 Jun',
    flightType: 'Direct',
    tripType: 'Return',
    airline: 'Singapore Airlines',
    basePriceUSD: 205,
    imageUrl: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=800&q=80',
    category: 'deal',
  },
  {
    id: 'pkg-bangkok',
    city: 'Bangkok',
    country: 'Thailand',
    originCode: 'CCU',
    originCity: 'Kolkata',
    destCode: 'BKK',
    destCity: 'Bangkok (Suvarnabhumi)',
    dates: '20 Jun - 27 Jun',
    flightType: 'Direct',
    tripType: 'Return',
    airline: 'Thai Airways',
    basePriceUSD: 135,
    imageUrl: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=800&q=80',
    category: 'deal',
  },
  {
    id: 'pkg-colombo',
    city: 'Colombo',
    country: 'Sri Lanka',
    originCode: 'MAA',
    originCity: 'Chennai',
    destCode: 'CMB',
    destCity: 'Colombo',
    dates: '18 May - 25 May',
    flightType: 'Direct',
    tripType: 'Return',
    airline: 'SriLankan Airlines',
    basePriceUSD: 84,
    imageUrl: 'https://images.unsplash.com/photo-1588598198321-9735fd52455b?auto=format&fit=crop&w=800&q=80',
    category: 'deal',
  },
  {
    id: 'pkg-maldives',
    city: 'Malé / Maldives',
    country: 'Maldives',
    originCode: 'BLR',
    originCity: 'Bengaluru',
    destCode: 'MLE',
    destCity: 'Malé (Velana)',
    dates: '08 Jun - 15 Jun',
    flightType: 'Direct',
    tripType: 'Return',
    airline: 'Maldivian',
    basePriceUSD: 160,
    imageUrl: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=800&q=80',
    category: 'deal',
  },
  {
    id: 'pkg-bali',
    city: 'Bali / Denpasar',
    country: 'Indonesia',
    originCode: 'SIN',
    originCity: 'Singapore',
    destCode: 'DPS',
    destCity: 'Bali (Ngurah Rai)',
    dates: '14 Jun - 21 Jun',
    flightType: 'Direct',
    tripType: 'Return',
    airline: 'Garuda Indonesia',
    basePriceUSD: 145,
    imageUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80',
    category: 'deal',
  },
  {
    id: 'pkg-tokyo',
    city: 'Tokyo',
    country: 'Japan',
    originCode: 'DEL',
    originCity: 'Delhi',
    destCode: 'HND',
    destCity: 'Tokyo - Haneda',
    dates: '10 Jul - 20 Jul',
    flightType: 'Direct',
    tripType: 'Return',
    airline: 'ANA All Nippon Airways',
    basePriceUSD: 490,
    imageUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
    category: 'international',
  },
  {
    id: 'pkg-london',
    city: 'London',
    country: 'United Kingdom',
    originCode: 'DEL',
    originCity: 'Delhi',
    destCode: 'LHR',
    destCity: 'London - Heathrow',
    dates: '01 Jun - 10 Jun',
    flightType: 'Direct',
    tripType: 'Return',
    airline: 'British Airways',
    basePriceUSD: 465,
    imageUrl: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80',
    category: 'international',
  },
  {
    id: 'pkg-paris',
    city: 'Paris',
    country: 'France',
    originCode: 'DEL',
    originCity: 'Delhi',
    destCode: 'CDG',
    destCity: 'Paris - Charles de Gaulle',
    dates: '05 Jul - 15 Jul',
    flightType: 'Direct',
    tripType: 'Return',
    airline: 'Air France',
    basePriceUSD: 510,
    imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80',
    category: 'international',
  },
  {
    id: 'pkg-zurich',
    city: 'Zurich',
    country: 'Switzerland',
    originCode: 'BOM',
    originCity: 'Mumbai',
    destCode: 'ZRH',
    destCity: 'Zurich Airport',
    dates: '12 Jul - 22 Jul',
    flightType: 'Direct',
    tripType: 'Return',
    airline: 'Swiss International',
    basePriceUSD: 540,
    imageUrl: 'https://images.unsplash.com/photo-1515488764276-beab7607c1e6?auto=format&fit=crop&w=800&q=80',
    category: 'international',
  },
  {
    id: 'pkg-rome',
    city: 'Rome',
    country: 'Italy',
    originCode: 'DEL',
    originCity: 'Delhi',
    destCode: 'FCO',
    destCity: 'Rome (Fiumicino)',
    dates: '15 Jul - 25 Jul',
    flightType: 'Direct',
    tripType: 'Return',
    airline: 'ITA Airways',
    basePriceUSD: 485,
    imageUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80',
    category: 'international',
  },
  {
    id: 'pkg-newyork',
    city: 'New York',
    country: 'United States',
    originCode: 'LHR',
    originCity: 'London',
    destCode: 'JFK',
    destCity: 'New York - JFK',
    dates: '01 Aug - 10 Aug',
    flightType: 'Direct',
    tripType: 'Return',
    airline: 'AeroWings',
    basePriceUSD: 480,
    imageUrl: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80',
    category: 'international',
  },
  {
    id: 'pkg-sanfrancisco',
    city: 'San Francisco',
    country: 'United States',
    originCode: 'LHR',
    originCity: 'London',
    destCode: 'SFO',
    destCity: 'San Francisco',
    dates: '10 Aug - 20 Aug',
    flightType: 'Direct',
    tripType: 'Return',
    airline: 'United Airlines',
    basePriceUSD: 620,
    imageUrl: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=800&q=80',
    category: 'international',
  },
  {
    id: 'pkg-sydney',
    city: 'Sydney',
    country: 'Australia',
    originCode: 'SIN',
    originCity: 'Singapore',
    destCode: 'SYD',
    destCity: 'Sydney (Kingsford Smith)',
    dates: '01 Sep - 12 Sep',
    flightType: 'Direct',
    tripType: 'Return',
    airline: 'Qantas Airways',
    basePriceUSD: 520,
    imageUrl: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=800&q=80',
    category: 'international',
  },
  {
    id: 'pkg-dhaka',
    city: 'Dhaka',
    country: 'Bangladesh',
    originCode: 'DEL',
    originCity: 'Delhi',
    destCode: 'DAC',
    destCity: 'Dhaka',
    dates: '10 Jun - 17 Jun',
    flightType: 'Direct',
    tripType: 'Return',
    airline: 'Biman Bangladesh',
    basePriceUSD: 110,
    imageUrl: 'https://images.unsplash.com/photo-1608958435020-e8a7109ba809?auto=format&fit=crop&w=800&q=80',
    category: 'international',
  },
  {
    id: 'pkg-kuwait',
    city: 'Kuwait City',
    country: 'Kuwait',
    originCode: 'BLR',
    originCity: 'Bengaluru',
    destCode: 'KWI',
    destCity: 'Kuwait City',
    dates: '20 Jun - 27 Jun',
    flightType: 'Direct',
    tripType: 'Return',
    airline: 'Kuwait Airways',
    basePriceUSD: 138,
    imageUrl: 'https://images.unsplash.com/photo-1549144511-f099e773c147?auto=format&fit=crop&w=800&q=80',
    category: 'deal',
  },
];

interface TravelExploreGridProps {
  onSelectOption: (pkg: {
    origin: string;
    destination: string;
    date?: string;
  }) => void;
}

export function TravelExploreGrid({ onSelectOption }: TravelExploreGridProps) {
  const { formatPrice } = useCurrency();
  const [activeFilter, setActiveFilter] = useState<string>('all');

  // Month label calculation (e.g. "May", "June")
  const currentMonthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date());

  const filteredPackages = TRAVEL_PACKAGES.filter((pkg) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'domestic') return pkg.category === 'domestic' || pkg.country === 'India';
    if (activeFilter === 'international') return pkg.category === 'international' || pkg.country !== 'India';
    if (activeFilter === 'return') return pkg.tripType === 'Return';
    if (activeFilter === 'oneway') return pkg.tripType === 'One way';
    if (activeFilter === 'direct') return pkg.flightType === 'Direct';
    if (activeFilter === 'deals') return pkg.category === 'deal' || pkg.basePriceUSD < 150;
    if (activeFilter === 'month') return true;
    return true;
  });

  return (
    <div className="space-y-6 pt-10">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-900 border border-blue-200 text-xs font-bold mb-2">
            <Compass className="w-3.5 h-3.5 text-blue-700" />
            <span>Featured Travel Destinations & Deals</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Explore Popular Flight Packages
          </h2>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Curated travel packages with non-stop flights across domestic India, regional getaways, and world capitals
          </p>
        </div>
      </div>

      {/* Filter Pill Buttons Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveFilter('all')}
          className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
            activeFilter === 'all'
              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
              : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400 hover:bg-slate-50'
          }`}
        >
          Show all
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('domestic')}
          className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
            activeFilter === 'domestic'
              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
              : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400 hover:bg-slate-50'
          }`}
        >
          Domestic India
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('international')}
          className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
            activeFilter === 'international'
              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
              : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400 hover:bg-slate-50'
          }`}
        >
          International Getaways
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('direct')}
          className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
            activeFilter === 'direct'
              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
              : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400 hover:bg-slate-50'
          }`}
        >
          Direct Flights
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('deals')}
          className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
            activeFilter === 'deals'
              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
              : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400 hover:bg-slate-50'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Best Deals</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('return')}
          className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
            activeFilter === 'return'
              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
              : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400 hover:bg-slate-50'
          }`}
        >
          Return
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('oneway')}
          className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
            activeFilter === 'oneway'
              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
              : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400 hover:bg-slate-50'
          }`}
        >
          One way
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('month')}
          className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
            activeFilter === 'month'
              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
              : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400 hover:bg-slate-50'
          }`}
        >
          {currentMonthName} flights from {formatPrice(42)}
        </button>
      </div>

      {/* 3-Column Card Layout Grid (Matching image_00a0bb21.png) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPackages.map((pkg) => (
          <div
            key={pkg.id}
            onClick={() =>
              onSelectOption({
                origin: pkg.originCode,
                destination: pkg.destCode,
              })
            }
            className="group cursor-pointer bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col hover:-translate-y-1"
          >
            {/* Destination Cover Photo */}
            <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-slate-100">
              <img
                src={pkg.imageUrl}
                alt={`${pkg.city}, ${pkg.country}`}
                loading="lazy"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=80';
                }}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent" />

              {/* City & Country Badge in Image */}
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <h3 className="text-2xl font-extrabold tracking-tight drop-shadow-sm">
                  {pkg.city}
                </h3>
                <p className="text-xs text-slate-200 font-medium drop-shadow-xs">
                  {pkg.country}
                </p>
              </div>

              {/* Flight Type Badge */}
              <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-slate-900/75 backdrop-blur-xs text-white text-[11px] font-bold border border-white/20">
                {pkg.flightType}
              </div>
            </div>

            {/* Card Body & Route Details */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-2.5">
                {/* Route Information */}
                <div className="text-xs text-slate-600 font-medium flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <Plane className="w-3.5 h-3.5 text-blue-900" />
                    <span>
                      {pkg.originCode} to {pkg.destCode}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {pkg.dates}
                  </div>
                </div>

                {/* Airline Name */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-semibold text-slate-700">
                    Operated by {pkg.airline}
                  </span>
                </div>
              </div>

              {/* Bottom Row: Price & Booking Action */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <div>
                  <span className="text-[11px] text-slate-500 block">Flight fare</span>
                  <div className="text-sm font-bold text-blue-950">
                    from <span className="text-lg font-extrabold text-blue-900 font-mono">{formatPrice(pkg.basePriceUSD)}</span>
                  </div>
                </div>

                <div className="inline-flex items-center gap-1 text-xs font-bold text-blue-900 group-hover:text-blue-700 group-hover:translate-x-0.5 transition-all">
                  <span>View Flights</span>
                  <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
