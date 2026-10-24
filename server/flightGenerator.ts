import { AIRLINES_CATALOGUE } from '../src/data/airlinesCatalogue.ts';
import type { Airport, Flight } from './types.ts';

// Deterministic hash to generate consistent flight numbers & schedules per route
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// Generate airline IATA-like prefix
function getAirlinePrefix(airlineName: string): string {
  const customMap: Record<string, string> = {
    'AeroWings': 'AW',
    'IndiGo': '6E',
    'Air India': 'AI',
    'Air India Express': 'IX',
    'Akasa Air': 'QP',
    'SpiceJet': 'SG',
    'Star Air': 'S5',
    'Alliance Air': '9I',
    'Fly91': '2E',
    'FlyBig': 'S9',
    'Shankh Air': 'SK',
    'Singapore Airlines': 'SQ',
    'Qatar Airways': 'QR',
    'Cathay Pacific Airways': 'CX',
    'ANA All Nippon Airways': 'NH',
    'Turkish Airlines': 'TK',
    'Emirates': 'EK',
    'Air France': 'AF',
    'Hainan Airlines': 'HU',
    'Japan Airlines': 'JL',
    'Korean Air': 'KE',
    'EVA Air': 'BR',
    'Qantas Airways': 'QF',
    'STARLUX Airlines': 'JX',
    'Lufthansa': 'LH',
    'Saudia': 'SV',
    'Iberia': 'IB',
    'Air Canada': 'AC',
    'Virgin Atlantic': 'VS',
    'Swiss International Air Lines': 'LX',
    'Thai Airways': 'TG',
    'United Airlines': 'UA',
    'Delta Air Lines': 'DL',
    'American Airlines': 'AA',
    'British Airways': 'BA',
    'Etihad Airways': 'EY',
    'KLM Royal Dutch Airlines': 'KL',
    'Malaysia Airlines': 'MH',
    'Garuda Indonesia': 'GA',
    'Asiana Airlines': 'OZ',
    'Air New Zealand': 'NZ',
    'Bangkok Airways': 'PG',
    'Austrian Airlines': 'OS',
    'Finnair': 'AY',
    'Gulf Air': 'GF',
    'Oman Air': 'WY',
    'Kuwait Airways': 'KU',
    'Jazeera Airways': 'J9',
    'Air Arabia': 'G9',
    'flydubai': 'FZ',
    'SriLankan Airlines': 'UL',
    'Biman Bangladesh Airlines': 'BG',
    'Maldivian': 'Q2',
    'AirAsia': 'AK',
    'Scoot': 'TR',
    'VietJet Air': 'VJ',
    'Vietnam Airlines': 'VN',
    'Philippine Airlines': 'PR',
    'Cebu Pacific': '5J',
    'China Eastern Airlines': 'MU',
    'China Southern Airlines': 'CZ',
    'Air China': 'CA',
    'Xiamen Air': 'MF',
    'Shenzhen Airlines': 'ZH',
    'China Airlines': 'CI',
    'Hong Kong Airlines': 'HX',
    'Mahan Air': 'W5',
    'Flynas': 'XY',
    'Egyptair': 'MS',
    'Ethiopian Airlines': 'ET',
    'Kenya Airways': 'KQ',
    'South African Airways': 'SA',
    'Royal Moroccan Airlines': 'AT',
    'Air Mauritius': 'MK',
    'Brussels Airlines': 'SN',
    'Scandinavian Airlines (SAS)': 'SK',
    'TAP Air Portugal': 'TP',
    'LOT Polish Airlines': 'LO',
    'Aer Lingus': 'EI',
    'Ryanair': 'FR',
    'EasyJet': 'U2',
    'Wizz Air': 'W6',
    'Condor': 'DE',
    'ITA Airways': 'AZ',
    'Air Baltic': 'BT',
    'Icelandair': 'FI',
    'Southwest Airlines': 'WN',
    'Alaska Airlines': 'AS',
    'JetBlue Airways': 'B6',
    'Spirit Airlines': 'NK',
    'Frontier Airlines': 'F9',
    'Hawaiian Airlines': 'HA',
    'Air Canada Rouge': 'RV',
    'WestJet': 'WS',
    'LATAM Airlines': 'LA',
    'Avianca': 'AV',
    'Copa Airlines': 'CM',
    'Aeromexico': 'AM',
    'Volaris': 'Y4',
    'Fiji Airways': 'FJ',
    'Air Astana': 'KC',
  };

  if (customMap[airlineName]) return customMap[airlineName];
  const words = airlineName.split(' ');
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return airlineName.slice(0, 2).toUpperCase();
}

// Generate base fleet aircraft suited to route
function getAircraftForRoute(isDomestic: boolean, index: number): string {
  if (isDomestic) {
    const domesticFleet = [
      'Airbus A321neo',
      'Boeing 737 MAX 8',
      'Airbus A320neo',
      'Boeing 737-800',
      'Embraer E195-E2',
      'ATR 72-600',
    ];
    return domesticFleet[index % domesticFleet.length];
  }
  const intlFleet = [
    'Airbus A350-900',
    'Boeing 787-9 Dreamliner',
    'Boeing 777-300ER',
    'Airbus A350-1000',
    'Airbus A330-900neo',
    'Boeing 787-10 Dreamliner',
  ];
  return intlFleet[index % intlFleet.length];
}

/**
 * Generate 100 flights covering all 100 airlines in AIRLINES_CATALOGUE
 */
export function generate100AirlinesFlights(allAirports: Airport[]): Flight[] {
  const flights: Flight[] = [];
  const baseTime = Date.now() + 86400000 * 2; // 2 days from now

  const popularDomestic = allAirports.filter((a) => a.category === 'domestic');
  const popularIntl = allAirports.filter((a) => a.category === 'international');

  const defaultDelhi = popularDomestic.find((a) => a.code === 'DEL') || popularDomestic[0];
  const defaultMumbai = popularDomestic.find((a) => a.code === 'BOM') || popularDomestic[1];
  const defaultBengaluru = popularDomestic.find((a) => a.code === 'BLR') || popularDomestic[2];
  const defaultLondon = popularIntl.find((a) => a.code === 'LHR') || popularIntl[0];
  const defaultDubai = popularIntl.find((a) => a.code === 'DXB') || popularIntl[1];
  const defaultSingapore = popularIntl.find((a) => a.code === 'SIN') || popularIntl[2];
  const defaultNewYork = popularIntl.find((a) => a.code === 'JFK') || popularIntl[3];

  AIRLINES_CATALOGUE.forEach((airline, index) => {
    const isDomesticCarrier = airline.group === 'domestic_india';
    let origin: Airport;
    let destination: Airport;
    // CRITICAL: 80% are NON-STOP (stops: 0), 20% are 1-stop
    const stops = (index % 5 === 4) ? 1 : 0;
    let duration = '2h 15m';
    let basePrice = 85;

    if (isDomesticCarrier) {
      if (airline.name.includes('Fly91') || airline.name.includes('Star Air')) {
        // Specific regional routes (like Hubli / Belagavi)
        const hubli = allAirports.find((a) => a.code === 'HBX') || defaultMumbai;
        origin = defaultBengaluru;
        destination = hubli;
        duration = '1h 15m';
        basePrice = 42;
      } else if (index % 4 === 0) {
        origin = defaultDelhi;
        destination = defaultMumbai;
        duration = stops === 0 ? '2h 10m' : '4h 15m';
        basePrice = 85 + (index % 5) * 8;
      } else if (index % 4 === 1) {
        origin = defaultBengaluru;
        destination = defaultDelhi;
        duration = stops === 0 ? '2h 45m' : '4h 50m';
        basePrice = 92 + (index % 5) * 6;
      } else if (index % 4 === 2) {
        origin = defaultMumbai;
        destination = defaultDelhi;
        duration = stops === 0 ? '2h 15m' : '4h 20m';
        basePrice = 89 + (index % 5) * 7;
      } else {
        const altDest = popularDomestic[(index * 7) % popularDomestic.length];
        origin = defaultDelhi;
        destination = altDest.code !== defaultDelhi.code ? altDest : defaultMumbai;
        duration = stops === 0 ? '1h 50m' : '4h 10m';
        basePrice = 75 + (index % 6) * 10;
      }
    } else {
      // International Carriers: Distribute between Domestic-to-International and International-to-International!
      const intlType = index % 3; // 0 = Domestic to International, 1 = International to International, 2 = Return
      const auh = allAirports.find((a) => a.code === 'AUH') || defaultDubai;
      const mct = allAirports.find((a) => a.code === 'MCT') || defaultDubai;
      const dac = allAirports.find((a) => a.code === 'DAC') || defaultSingapore;
      const kwi = allAirports.find((a) => a.code === 'KWI') || defaultDubai;
      const cmb = allAirports.find((a) => a.code === 'CMB') || defaultSingapore;
      const hnd = allAirports.find((a) => a.code === 'HND') || defaultSingapore;
      const cdg = allAirports.find((a) => a.code === 'CDG') || defaultLondon;
      const fra = allAirports.find((a) => a.code === 'FRA') || defaultLondon;

      if (intlType === 0) {
        // Domestic to International (e.g. BLR to AUH, BLR to MCT, DEL to DAC, BLR to KWI, MAA to CMB, DEL to LHR)
        const d2iPairs: [Airport, Airport, string, number][] = [
          [defaultBengaluru, auh, '3h 45m', 95], // BLR -> AUH
          [defaultBengaluru, mct, '3h 30m', 102], // BLR -> MCT
          [defaultDelhi, dac, '2h 30m', 110], // DEL -> DAC
          [defaultBengaluru, kwi, '4h 45m', 138], // BLR -> KWI
          [defaultDelhi, cmb, '3h 35m', 84], // DEL -> CMB
          [defaultDelhi, defaultLondon, '9h 15m', 465], // DEL -> LHR
          [defaultMumbai, defaultDubai, '3h 25m', 170], // BOM -> DXB
          [defaultDelhi, defaultSingapore, '5h 30m', 205], // DEL -> SIN
        ];
        const pair = d2iPairs[index % d2iPairs.length];
        origin = pair[0];
        destination = pair[1];
        duration = stops === 0 ? pair[2] : `${parseInt(pair[2], 10) + 2}h 40m`;
        basePrice = pair[3];
      } else if (intlType === 1) {
        // International to International (e.g. JFK to LHR, LHR to DXB, DXB to SIN, SIN to HND, CDG to JFK)
        const i2iPairs: [Airport, Airport, string, number][] = [
          [defaultNewYork, defaultLondon, '7h 10m', 480], // JFK -> LHR
          [defaultLondon, defaultDubai, '7h 00m', 520], // LHR -> DXB
          [defaultDubai, defaultSingapore, '7h 35m', 460], // DXB -> SIN
          [defaultSingapore, hnd, '6h 45m', 510], // SIN -> HND
          [cdg, defaultNewYork, '8h 20m', 530], // CDG -> JFK
          [defaultLondon, fra, '1h 35m', 125], // LHR -> FRA
          [fra, defaultNewYork, '8h 40m', 560], // FRA -> JFK
        ];
        const pair = i2iPairs[index % i2iPairs.length];
        origin = pair[0];
        destination = pair[1];
        duration = stops === 0 ? pair[2] : `${parseInt(pair[2], 10) + 3}h 15m`;
        basePrice = pair[3];
      } else {
        // International to Domestic Inbound (e.g. LHR to DEL, DXB to BOM, SIN to DEL)
        const hubs = [defaultLondon, defaultDubai, defaultSingapore, defaultNewYork, auh];
        const selHub = hubs[index % hubs.length];
        origin = selHub;
        destination = (index % 2 === 0) ? defaultDelhi : defaultMumbai;
        duration = selHub.code === 'DXB' || selHub.code === 'AUH' ? '3h 40m' : '8h 30m';
        basePrice = 280 + (index % 10) * 20;
      }
    }

    const prefix = getAirlinePrefix(airline.name);
    const flightNum = `${prefix}-${100 + index * 7 + (index % 9)}`;
    const departureOffsetHours = 5 + (index * 0.75) % 18; // spread between 05:00 and 23:00
    const depTime = new Date(baseTime + departureOffsetHours * 3600000 + ((index * 17) % 60) * 60000);
    const durationHours = parseInt(duration, 10) || 3;
    const durationMins = parseInt(duration.split(' ')[1] || '0', 10) || 15;
    const arrTime = new Date(depTime.getTime() + (durationHours * 60 + durationMins) * 60000);

    const economyPrice = Math.round(basePrice);
    const premEcoPrice = Math.round(economyPrice * 1.6);
    const bizPrice = Math.round(economyPrice * 3.2);
    const firstPrice = Math.round(economyPrice * 5.8);

    flights.push({
      id: `fl-catalog-${index + 1}-${airline.id}`,
      flightNumber: flightNum,
      airline: airline.name,
      aircraft: getAircraftForRoute(isDomesticCarrier, index),
      origin,
      destination,
      departureTime: depTime.toISOString(),
      arrivalTime: arrTime.toISOString(),
      duration,
      stops,
      prices: {
        economy: economyPrice,
        premiumEconomy: premEcoPrice,
        business: bizPrice,
        first: firstPrice,
      },
      availableSeats: {
        economy: 35 + (index * 3) % 55,
        premiumEconomy: 12 + (index * 2) % 16,
        business: 8 + (index % 12),
        first: 2 + (index % 6),
      },
      status: 'SCHEDULED',
      gate: `T${origin.terminal || '1'}-${10 + (index % 30)}`,
    });
  });

  return flights;
}

/**
 * Generates rich, realistic flight options between ANY origin and destination from the 294 places.
 * Crucially guarantees ALL 100 AIRLINES are represented (100 flights total),
 * with 80% NON-STOP (stops: 0) flights alongside 20% 1-stop flights!
 */
export function generateRouteFlights(
  origin: Airport,
  destination: Airport,
  departureDateStr?: string
): Flight[] {
  const isDomestic =
    origin.country.toLowerCase() === 'india' && destination.country.toLowerCase() === 'india';

  const results: Flight[] = [];

  // Determine base departure date
  let baseDate: Date;
  if (departureDateStr && !isNaN(new Date(departureDateStr).getTime())) {
    baseDate = new Date(departureDateStr);
  } else {
    baseDate = new Date(Date.now() + 86400000 * 2); // 2 days from today
  }

  // Calculate base duration in minutes based on route type
  let baseDurationMinutes = 120; // 2 hours default
  if (isDomestic) {
    if (origin.city.toLowerCase() === destination.city.toLowerCase()) {
      baseDurationMinutes = 60;
    } else {
      const codePair = (origin.code + destination.code).toUpperCase();
      baseDurationMinutes = 75 + (hashString(codePair) % 95); // 75m to 170m (1h15m to 2h50m)
    }
  } else {
    // International route estimation
    const isGulf = ['DXB', 'AUH', 'DOH', 'BAH', 'KWI', 'MCT', 'JED', 'RUH'].includes(destination.code) ||
                   ['DXB', 'AUH', 'DOH', 'BAH', 'KWI', 'MCT', 'JED', 'RUH'].includes(origin.code);
    const isSEAsia = ['SIN', 'BKK', 'KUL', 'DPS', 'CGK', 'HAN', 'SGN', 'MNL'].includes(destination.code) ||
                     ['SIN', 'BKK', 'KUL', 'DPS', 'CGK', 'HAN', 'SGN', 'MNL'].includes(origin.code);
    const isEurope = ['LHR', 'CDG', 'FRA', 'AMS', 'MAD', 'BCN', 'FCO', 'MXP', 'ZUR', 'VIE'].includes(destination.code) ||
                     ['LHR', 'CDG', 'FRA', 'AMS', 'MAD', 'BCN', 'FCO', 'MXP', 'ZUR', 'VIE'].includes(origin.code);
    const isAmericas = ['JFK', 'EWR', 'ORD', 'LAX', 'SFO', 'MIA', 'YYZ', 'YVR'].includes(destination.code) ||
                       ['JFK', 'EWR', 'ORD', 'LAX', 'SFO', 'MIA', 'YYZ', 'YVR'].includes(origin.code);

    if (isGulf) {
      baseDurationMinutes = 200 + (hashString(origin.code + destination.code) % 40); // ~3h 30m
    } else if (isSEAsia) {
      baseDurationMinutes = 310 + (hashString(origin.code + destination.code) % 50); // ~5h 20m
    } else if (isEurope) {
      baseDurationMinutes = 520 + (hashString(origin.code + destination.code) % 80); // ~9h 00m
    } else if (isAmericas) {
      baseDurationMinutes = 840 + (hashString(origin.code + destination.code) % 100); // ~14h 30m
    } else {
      baseDurationMinutes = 360 + (hashString(origin.code + destination.code) % 240); // ~6h to 10h
    }
  }

  // GENERATE EXACTLY 100 FLIGHTS COVERING ALL 100 AIRLINES IN AIRLINES_CATALOGUE
  AIRLINES_CATALOGUE.forEach((airline, index) => {
    const prefix = getAirlinePrefix(airline.name);
    const routeHash = hashString(origin.code + destination.code + airline.id + index);
    const flightNum = `${prefix}-${200 + (routeHash % 790)}`;

    // Stagger departure time across the day from 05:00 to 23:45
    const totalMinutesInFlightWindow = 18.5 * 60; // 05:00 to 23:30 (1110 minutes)
    const minuteOffset = Math.floor((index / 100) * totalMinutesInFlightWindow) + ((index * 7) % 15);
    const depHour = 5 + Math.floor(minuteOffset / 60);
    const depMin = minuteOffset % 60;

    const depDate = new Date(baseDate);
    depDate.setHours(depHour, depMin, 0, 0);

    // CRITICAL: Exactly 80% are NON-STOP (stops: 0), 20% are 1-stop
    // When index % 5 === 4, it's 1-stop; otherwise it is Non-Stop!
    const isDirect = index % 5 !== 4;
    const stops = isDirect ? 0 : 1;

    // Flight duration calculation
    const flightDurationMins = isDirect
      ? baseDurationMinutes + ((index * 3) % 20) - 10
      : baseDurationMinutes + 120 + ((index * 7) % 45); // 1-stop adds layover time

    const durHours = Math.floor(flightDurationMins / 60);
    const durMins = flightDurationMins % 60;
    const durationStr = `${durHours}h ${durMins.toString().padStart(2, '0')}m`;

    const arrDate = new Date(depDate.getTime() + flightDurationMins * 60000);

    // Pricing calculation
    let baseEcon: number;
    if (isDomestic) {
      baseEcon = 68 + ((index * 7 + (routeHash % 30)) % 55); // ~$68 - $123 USD
    } else {
      baseEcon = 240 + ((index * 13 + (routeHash % 150)) % 450); // ~$240 - $690 USD
    }

    if (!isDirect) {
      baseEcon = Math.round(baseEcon * 0.88); // 1-stop discount
    }

    const economyPrice = Math.round(baseEcon);
    const premEcoPrice = Math.round(economyPrice * 1.55);
    const bizPrice = Math.round(economyPrice * 3.1);
    const firstPrice = Math.round(economyPrice * 5.5);

    const gateNumber = 1 + ((routeHash + index) % 45);

    results.push({
      id: `fl-${origin.code.toLowerCase()}-${destination.code.toLowerCase()}-${airline.id}`,
      flightNumber: flightNum,
      airline: airline.name,
      aircraft: getAircraftForRoute(isDomestic, index),
      origin,
      destination,
      departureTime: depDate.toISOString(),
      arrivalTime: arrDate.toISOString(),
      duration: durationStr,
      stops,
      prices: {
        economy: economyPrice,
        premiumEconomy: premEcoPrice,
        business: bizPrice,
        first: firstPrice,
      },
      availableSeats: {
        economy: 30 + ((index * 5) % 65),
        premiumEconomy: 10 + ((index * 3) % 22),
        business: 6 + (index % 16),
        first: 2 + (index % 6),
      },
      status: 'SCHEDULED',
      gate: `T${origin.terminal || '1'}-G${gateNumber}`,
    });
  });

  return results;
}
