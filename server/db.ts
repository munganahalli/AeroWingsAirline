import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Airport, Booking, EmailLog, Flight, OtpRecord, User } from './types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, 'data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');

// Helper to hash passwords securely
export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_aerowings_salt_2026').digest('hex');
}

// Enforce strong password rules:
// - At least 8 characters
// - At least one uppercase letter (A-Z)
// - At least one lowercase letter (a-z)
// - At least one special character
export function validateStrongPassword(password: string): { valid: boolean; message?: string } {
  if (!password || password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter (A-Z).' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter (a-z).' };
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character (e.g. !@#$%^&*).' };
  }
  return { valid: true };
}

import { AIRPORTS_CATALOGUE } from '../src/data/airportsCatalogue.ts';
import { generate100AirlinesFlights, generateRouteFlights } from './flightGenerator.ts';

// In-memory data structures
export const otpStore = new Map<string, OtpRecord>();
export const emailLogsStore: EmailLog[] = [];
export const usersStore: User[] = [];
export const bookingsStore: Booking[] = [];
export const flightsStore: Flight[] = [];

export const AIRPORTS: Airport[] = AIRPORTS_CATALOGUE;

export function getAirport(code: string): Airport {
  const found = AIRPORTS.find((a) => a.code.toUpperCase() === code.toUpperCase());
  if (!found) {
    return {
      code,
      name: `${code} International Airport`,
      city: code,
      country: 'International',
      category: 'international',
    };
  }
  return found;
}

const INITIAL_FLIGHTS: Flight[] = [
  // ==========================================
  // FLAGSHIP INTERNATIONAL ROUTES (AeroWings)
  // ==========================================
  {
    id: 'fl-101',
    flightNumber: 'AW-101',
    airline: 'AeroWings',
    aircraft: 'Boeing 787-9 Dreamliner',
    origin: getAirport('JFK'),
    destination: getAirport('LHR'),
    departureTime: new Date(Date.now() + 86400000 * 2 + 3600000 * 8).toISOString(),
    arrivalTime: new Date(Date.now() + 86400000 * 2 + 3600000 * 15).toISOString(),
    duration: '7h 00m',
    stops: 0,
    prices: { economy: 480, premiumEconomy: 790, business: 1650, first: 3200 },
    availableSeats: { economy: 42, premiumEconomy: 14, business: 8, first: 4 },
    status: 'SCHEDULED',
    gate: 'B22',
  },
  {
    id: 'fl-102',
    flightNumber: 'AW-102',
    airline: 'AeroWings',
    aircraft: 'Airbus A350-900',
    origin: getAirport('LHR'),
    destination: getAirport('DXB'),
    departureTime: new Date(Date.now() + 86400000 * 2 + 3600000 * 11).toISOString(),
    arrivalTime: new Date(Date.now() + 86400000 * 2 + 3600000 * 18).toISOString(),
    duration: '7h 00m',
    stops: 0,
    prices: { economy: 520, premiumEconomy: 840, business: 1780, first: 3450 },
    availableSeats: { economy: 38, premiumEconomy: 18, business: 10, first: 2 },
    status: 'SCHEDULED',
    gate: 'A14',
  },
  {
    id: 'fl-103',
    flightNumber: 'AW-103',
    airline: 'AeroWings',
    aircraft: 'Boeing 777-300ER',
    origin: getAirport('DXB'),
    destination: getAirport('SIN'),
    departureTime: new Date(Date.now() + 86400000 * 3 + 3600000 * 3).toISOString(),
    arrivalTime: new Date(Date.now() + 86400000 * 3 + 3600000 * 10).toISOString(),
    duration: '7h 30m',
    stops: 0,
    prices: { economy: 460, premiumEconomy: 750, business: 1590, first: 2900 },
    availableSeats: { economy: 55, premiumEconomy: 20, business: 12, first: 6 },
    status: 'SCHEDULED',
    gate: 'C08',
  },
  {
    id: 'fl-104',
    flightNumber: 'AW-104',
    airline: 'AeroWings',
    aircraft: 'Boeing 787-9 Dreamliner',
    origin: getAirport('SIN'),
    destination: getAirport('HND'),
    departureTime: new Date(Date.now() + 86400000 * 3 + 3600000 * 12).toISOString(),
    arrivalTime: new Date(Date.now() + 86400000 * 3 + 3600000 * 19).toISOString(),
    duration: '6h 40m',
    stops: 0,
    prices: { economy: 510, premiumEconomy: 810, business: 1720, first: 3100 },
    availableSeats: { economy: 30, premiumEconomy: 12, business: 6, first: 2 },
    status: 'SCHEDULED',
    gate: 'T1-4',
  },
  {
    id: 'fl-105',
    flightNumber: 'AW-105',
    airline: 'AeroWings',
    aircraft: 'Airbus A350-1000',
    origin: getAirport('SFO'),
    destination: getAirport('LHR'),
    departureTime: new Date(Date.now() + 86400000 * 4 + 3600000 * 9).toISOString(),
    arrivalTime: new Date(Date.now() + 86400000 * 4 + 3600000 * 19).toISOString(),
    duration: '10h 30m',
    stops: 0,
    prices: { economy: 680, premiumEconomy: 1050, business: 2350, first: 4500 },
    availableSeats: { economy: 48, premiumEconomy: 16, business: 14, first: 4 },
    status: 'SCHEDULED',
    gate: 'G98',
  },
  {
    id: 'fl-106',
    flightNumber: 'AW-106',
    airline: 'AeroWings',
    aircraft: 'Boeing 787-9 Dreamliner',
    origin: getAirport('CDG'),
    destination: getAirport('JFK'),
    departureTime: new Date(Date.now() + 86400000 * 2 + 3600000 * 14).toISOString(),
    arrivalTime: new Date(Date.now() + 86400000 * 2 + 3600000 * 22).toISOString(),
    duration: '8h 20m',
    stops: 0,
    prices: { economy: 530, premiumEconomy: 870, business: 1890, first: 3600 },
    availableSeats: { economy: 25, premiumEconomy: 8, business: 4, first: 2 },
    status: 'SCHEDULED',
    gate: 'K12',
  },
  {
    id: 'fl-107',
    flightNumber: 'AW-107',
    airline: 'AeroWings',
    aircraft: 'Airbus A350-900',
    origin: getAirport('DEL'),
    destination: getAirport('LHR'),
    departureTime: new Date(Date.now() + 86400000 * 3 + 3600000 * 6).toISOString(),
    arrivalTime: new Date(Date.now() + 86400000 * 3 + 3600000 * 15).toISOString(),
    duration: '9h 15m',
    stops: 0,
    prices: { economy: 590, premiumEconomy: 920, business: 1980, first: 3800 },
    availableSeats: { economy: 62, premiumEconomy: 15, business: 10, first: 4 },
    status: 'SCHEDULED',
    gate: 'T3-18',
  },
  {
    id: 'fl-108',
    flightNumber: 'AW-108',
    airline: 'AeroWings',
    aircraft: 'Boeing 777-300ER',
    origin: getAirport('SYD'),
    destination: getAirport('SIN'),
    departureTime: new Date(Date.now() + 86400000 * 3 + 3600000 * 10).toISOString(),
    arrivalTime: new Date(Date.now() + 86400000 * 3 + 3600000 * 18).toISOString(),
    duration: '8h 25m',
    stops: 0,
    prices: { economy: 540, premiumEconomy: 860, business: 1820, first: 3400 },
    availableSeats: { economy: 40, premiumEconomy: 14, business: 8, first: 2 },
    status: 'SCHEDULED',
    gate: 'T1-52',
  },

  // ========================================================
  // INDIAN DOMESTIC & REGIONAL CARRIERS ROUTES
  // ========================================================
  {
    id: 'fl-201',
    flightNumber: '6E-201',
    airline: 'IndiGo',
    aircraft: 'Airbus A321neo',
    origin: getAirport('DEL'),
    destination: getAirport('BOM'),
    departureTime: new Date(Date.now() + 86400000 * 2 + 3600000 * 7).toISOString(),
    arrivalTime: new Date(Date.now() + 86400000 * 2 + 3600000 * 9.25).toISOString(),
    duration: '2h 15m',
    stops: 0,
    prices: { economy: 85, premiumEconomy: 140, business: 280, first: 450 },
    availableSeats: { economy: 78, premiumEconomy: 18, business: 12, first: 4 },
    status: 'SCHEDULED',
    gate: '14B',
  },
  {
    id: 'fl-202',
    flightNumber: 'AI-102',
    airline: 'Air India',
    aircraft: 'Boeing 787-8 Dreamliner',
    origin: getAirport('DEL'),
    destination: getAirport('BOM'),
    departureTime: new Date(Date.now() + 86400000 * 2 + 3600000 * 13).toISOString(),
    arrivalTime: new Date(Date.now() + 86400000 * 2 + 3600000 * 15.15).toISOString(),
    duration: '2h 10m',
    stops: 0,
    prices: { economy: 90, premiumEconomy: 155, business: 310, first: 550 },
    availableSeats: { economy: 65, premiumEconomy: 22, business: 16, first: 6 },
    status: 'SCHEDULED',
    gate: 'T3-08',
  },
  {
    id: 'fl-203',
    flightNumber: 'QP-1304',
    airline: 'Akasa Air',
    aircraft: 'Boeing 737 MAX 8',
    origin: getAirport('BLR'),
    destination: getAirport('DEL'),
    departureTime: new Date(Date.now() + 86400000 * 2 + 3600000 * 8).toISOString(),
    arrivalTime: new Date(Date.now() + 86400000 * 2 + 3600000 * 10.75).toISOString(),
    duration: '2h 45m',
    stops: 0,
    prices: { economy: 95, premiumEconomy: 160, business: 320, first: 520 },
    availableSeats: { economy: 52, premiumEconomy: 14, business: 8, first: 2 },
    status: 'SCHEDULED',
    gate: 'T2-24',
  },
  {
    id: 'fl-204',
    flightNumber: 'IX-742',
    airline: 'Air India Express',
    aircraft: 'Boeing 737-800',
    origin: getAirport('BLR'),
    destination: getAirport('DEL'),
    departureTime: new Date(Date.now() + 86400000 * 2 + 3600000 * 16).toISOString(),
    arrivalTime: new Date(Date.now() + 86400000 * 2 + 3600000 * 18.85).toISOString(),
    duration: '2h 50m',
    stops: 0,
    prices: { economy: 80, premiumEconomy: 135, business: 260, first: 420 },
    availableSeats: { economy: 45, premiumEconomy: 12, business: 6, first: 0 },
    status: 'SCHEDULED',
    gate: 'T2-11',
  },
  {
    id: 'fl-205',
    flightNumber: 'SG-8169',
    airline: 'SpiceJet',
    aircraft: 'Boeing 737-800',
    origin: getAirport('MAA'),
    destination: getAirport('CCU'),
    departureTime: new Date(Date.now() + 86400000 * 3 + 3600000 * 9).toISOString(),
    arrivalTime: new Date(Date.now() + 86400000 * 3 + 3600000 * 11.35).toISOString(),
    duration: '2h 20m',
    stops: 0,
    prices: { economy: 88, premiumEconomy: 145, business: 290, first: 480 },
    availableSeats: { economy: 60, premiumEconomy: 16, business: 8, first: 2 },
    status: 'SCHEDULED',
    gate: '04A',
  },
  {
    id: 'fl-206',
    flightNumber: 'S5-112',
    airline: 'Star Air',
    aircraft: 'Embraer E175',
    origin: getAirport('HYD'),
    destination: getAirport('GOX'),
    departureTime: new Date(Date.now() + 86400000 * 2 + 3600000 * 14).toISOString(),
    arrivalTime: new Date(Date.now() + 86400000 * 2 + 3600000 * 15.35).toISOString(),
    duration: '1h 20m',
    stops: 0,
    prices: { economy: 75, premiumEconomy: 120, business: 220, first: 380 },
    availableSeats: { economy: 36, premiumEconomy: 12, business: 4, first: 0 },
    status: 'SCHEDULED',
    gate: '02',
  },
  {
    id: 'fl-207',
    flightNumber: '9I-605',
    airline: 'Alliance Air',
    aircraft: 'ATR 72-600',
    origin: getAirport('DEL'),
    destination: getAirport('DED'),
    departureTime: new Date(Date.now() + 86400000 * 2 + 3600000 * 10).toISOString(),
    arrivalTime: new Date(Date.now() + 86400000 * 2 + 3600000 * 10.9).toISOString(),
    duration: '0h 55m',
    stops: 0,
    prices: { economy: 65, premiumEconomy: 110, business: 190, first: 310 },
    availableSeats: { economy: 28, premiumEconomy: 8, business: 2, first: 0 },
    status: 'SCHEDULED',
    gate: 'T1-02',
  },
  {
    id: 'fl-208',
    flightNumber: '2E-901',
    airline: 'Fly91',
    aircraft: 'ATR 72-600',
    origin: getAirport('GOX'),
    destination: getAirport('BLR'),
    departureTime: new Date(Date.now() + 86400000 * 2 + 3600000 * 12).toISOString(),
    arrivalTime: new Date(Date.now() + 86400000 * 2 + 3600000 * 13.25).toISOString(),
    duration: '1h 15m',
    stops: 0,
    prices: { economy: 62, premiumEconomy: 105, business: 180, first: 290 },
    availableSeats: { economy: 32, premiumEconomy: 6, business: 0, first: 0 },
    status: 'SCHEDULED',
    gate: '01',
  },

  // ========================================================
  // GLOBAL TOP 90 AIRLINES CONNECTING MAJOR GLOBAL & INDIAN HUBS
  // ========================================================
  {
    id: 'fl-301',
    flightNumber: 'EK-501',
    airline: 'Emirates',
    aircraft: 'Boeing 777-300ER',
    origin: getAirport('BOM'),
    destination: getAirport('DXB'),
    departureTime: new Date(Date.now() + 86400000 * 2 + 3600000 * 4).toISOString(),
    arrivalTime: new Date(Date.now() + 86400000 * 2 + 3600000 * 7.15).toISOString(),
    duration: '3h 10m',
    stops: 0,
    prices: { economy: 240, premiumEconomy: 420, business: 950, first: 2100 },
    availableSeats: { economy: 85, premiumEconomy: 24, business: 18, first: 6 },
    status: 'SCHEDULED',
    gate: 'T2-45',
  },
  {
    id: 'fl-302',
    flightNumber: 'SQ-403',
    airline: 'Singapore Airlines',
    aircraft: 'Airbus A350-900',
    origin: getAirport('DEL'),
    destination: getAirport('SIN'),
    departureTime: new Date(Date.now() + 86400000 * 2 + 3600000 * 9).toISOString(),
    arrivalTime: new Date(Date.now() + 86400000 * 2 + 3600000 * 14.6).toISOString(),
    duration: '5h 35m',
    stops: 0,
    prices: { economy: 310, premiumEconomy: 540, business: 1250, first: 2600 },
    availableSeats: { economy: 70, premiumEconomy: 28, business: 20, first: 4 },
    status: 'SCHEDULED',
    gate: 'T3-12',
  },
  {
    id: 'fl-303',
    flightNumber: 'QR-571',
    airline: 'Qatar Airways',
    aircraft: 'Boeing 787-9 Dreamliner',
    origin: getAirport('DEL'),
    destination: getAirport('DOH'),
    departureTime: new Date(Date.now() + 86400000 * 2 + 3600000 * 10).toISOString(),
    arrivalTime: new Date(Date.now() + 86400000 * 2 + 3600000 * 14.1).toISOString(),
    duration: '4h 05m',
    stops: 0,
    prices: { economy: 280, premiumEconomy: 490, business: 1150, first: 2400 },
    availableSeats: { economy: 58, premiumEconomy: 20, business: 14, first: 4 },
    status: 'SCHEDULED',
    gate: 'T3-15',
  },
  {
    id: 'fl-304',
    flightNumber: 'BA-142',
    airline: 'British Airways',
    aircraft: 'Boeing 777-200',
    origin: getAirport('DEL'),
    destination: getAirport('LHR'),
    departureTime: new Date(Date.now() + 86400000 * 3 + 3600000 * 3).toISOString(),
    arrivalTime: new Date(Date.now() + 86400000 * 3 + 3600000 * 12.4).toISOString(),
    duration: '9h 25m',
    stops: 0,
    prices: { economy: 620, premiumEconomy: 980, business: 2150, first: 4200 },
    availableSeats: { economy: 68, premiumEconomy: 24, business: 18, first: 6 },
    status: 'SCHEDULED',
    gate: 'T3-22',
  },
  {
    id: 'fl-305',
    flightNumber: 'LH-757',
    airline: 'Lufthansa',
    aircraft: 'Airbus A340-300',
    origin: getAirport('BOM'),
    destination: getAirport('FRA'),
    departureTime: new Date(Date.now() + 86400000 * 2 + 3600000 * 2).toISOString(),
    arrivalTime: new Date(Date.now() + 86400000 * 2 + 3600000 * 11).toISOString(),
    duration: '9h 00m',
    stops: 0,
    prices: { economy: 640, premiumEconomy: 1020, business: 2250, first: 4400 },
    availableSeats: { economy: 72, premiumEconomy: 20, business: 16, first: 4 },
    status: 'SCHEDULED',
    gate: 'T2-52',
  },
  {
    id: 'fl-306',
    flightNumber: 'AF-225',
    airline: 'Air France',
    aircraft: 'Boeing 787-9 Dreamliner',
    origin: getAirport('DEL'),
    destination: getAirport('CDG'),
    departureTime: new Date(Date.now() + 86400000 * 3 + 3600000 * 1).toISOString(),
    arrivalTime: new Date(Date.now() + 86400000 * 3 + 3600000 * 10.15).toISOString(),
    duration: '9h 10m',
    stops: 0,
    prices: { economy: 590, premiumEconomy: 940, business: 2050, first: 4100 },
    availableSeats: { economy: 64, premiumEconomy: 18, business: 14, first: 4 },
    status: 'SCHEDULED',
    gate: 'T3-19',
  },
  {
    id: 'fl-307',
    flightNumber: 'CX-698',
    airline: 'Cathay Pacific Airways',
    aircraft: 'Airbus A350-1000',
    origin: getAirport('DEL'),
    destination: getAirport('HKG'),
    departureTime: new Date(Date.now() + 86400000 * 2 + 3600000 * 22).toISOString(),
    arrivalTime: new Date(Date.now() + 86400000 * 3 + 3600000 * 3.25).toISOString(),
    duration: '5h 15m',
    stops: 0,
    prices: { economy: 360, premiumEconomy: 610, business: 1380, first: 2800 },
    availableSeats: { economy: 56, premiumEconomy: 18, business: 12, first: 4 },
    status: 'SCHEDULED',
    gate: 'T3-14',
  },
  {
    id: 'fl-308',
    flightNumber: 'NH-828',
    airline: 'ANA All Nippon Airways',
    aircraft: 'Boeing 787-9 Dreamliner',
    origin: getAirport('DEL'),
    destination: getAirport('NRT'),
    departureTime: new Date(Date.now() + 86400000 * 3 + 3600000 * 18).toISOString(),
    arrivalTime: new Date(Date.now() + 86400000 * 4 + 3600000 * 1.75).toISOString(),
    duration: '7h 45m',
    stops: 0,
    prices: { economy: 490, premiumEconomy: 820, business: 1850, first: 3600 },
    availableSeats: { economy: 50, premiumEconomy: 16, business: 10, first: 4 },
    status: 'SCHEDULED',
    gate: 'T3-20',
  },
  {
    id: 'fl-309',
    flightNumber: 'EY-218',
    airline: 'Etihad Airways',
    aircraft: 'Airbus A321neo',
    origin: getAirport('DEL'),
    destination: getAirport('AUH'),
    departureTime: new Date(Date.now() + 86400000 * 2 + 3600000 * 5).toISOString(),
    arrivalTime: new Date(Date.now() + 86400000 * 2 + 3600000 * 8.85).toISOString(),
    duration: '3h 50m',
    stops: 0,
    prices: { economy: 230, premiumEconomy: 390, business: 890, first: 1950 },
    availableSeats: { economy: 60, premiumEconomy: 16, business: 12, first: 2 },
    status: 'SCHEDULED',
    gate: 'T3-11',
  },
  {
    id: 'fl-310',
    flightNumber: 'TG-316',
    airline: 'Thai Airways',
    aircraft: 'Boeing 777-300',
    origin: getAirport('DEL'),
    destination: getAirport('BKK'),
    departureTime: new Date(Date.now() + 86400000 * 2 + 3600000 * 23).toISOString(),
    arrivalTime: new Date(Date.now() + 86400000 * 3 + 3600000 * 3.25).toISOString(),
    duration: '4h 15m',
    stops: 0,
    prices: { economy: 260, premiumEconomy: 440, business: 990, first: 2100 },
    availableSeats: { economy: 66, premiumEconomy: 20, business: 14, first: 4 },
    status: 'SCHEDULED',
    gate: 'T3-16',
  },
  {
    id: 'fl-311',
    flightNumber: 'UA-82',
    airline: 'United Airlines',
    aircraft: 'Boeing 787-9 Dreamliner',
    origin: getAirport('DEL'),
    destination: getAirport('EWR'),
    departureTime: new Date(Date.now() + 86400000 * 3 + 3600000 * 23).toISOString(),
    arrivalTime: new Date(Date.now() + 86400000 * 4 + 3600000 * 14.35).toISOString(),
    duration: '15h 20m',
    stops: 0,
    prices: { economy: 890, premiumEconomy: 1450, business: 3200, first: 5900 },
    availableSeats: { economy: 80, premiumEconomy: 30, business: 24, first: 6 },
    status: 'SCHEDULED',
    gate: 'T3-25',
  },
  {
    id: 'fl-312',
    flightNumber: 'QF-68',
    airline: 'Qantas Airways',
    aircraft: 'Airbus A330-200',
    origin: getAirport('DEL'),
    destination: getAirport('MEL'),
    departureTime: new Date(Date.now() + 86400000 * 3 + 3600000 * 14).toISOString(),
    arrivalTime: new Date(Date.now() + 86400000 * 4 + 3600000 * 2.75).toISOString(),
    duration: '12h 45m',
    stops: 0,
    prices: { economy: 780, premiumEconomy: 1290, business: 2950, first: 5200 },
    availableSeats: { economy: 60, premiumEconomy: 22, business: 16, first: 4 },
    status: 'SCHEDULED',
    gate: 'T3-23',
  },

  // ========================================================
  // ADDITIONAL EXPANDED DOMESTIC TO INTERNATIONAL FLIGHTS
  // ========================================================
  {
    id: 'fl-d2i-401',
    flightNumber: 'AW-501',
    airline: 'AeroWings',
    aircraft: 'Airbus A350-900',
    origin: getAirport('DEL'),
    destination: getAirport('DXB'),
    departureTime: new Date(Date.now() + 86400000 * 2 + 3600000 * 6).toISOString(),
    arrivalTime: new Date(Date.now() + 86400000 * 2 + 3600000 * 9.5).toISOString(),
    duration: '3h 30m',
    stops: 0,
    prices: { economy: 210, premiumEconomy: 380, business: 890, first: 1950 },
    availableSeats: { economy: 55, premiumEconomy: 18, business: 12, first: 4 },
    status: 'SCHEDULED',
    gate: 'T3-12',
  },
  {
    id: 'fl-d2i-402',
    flightNumber: 'AW-502',
    airline: 'AeroWings',
    aircraft: 'Boeing 787-9 Dreamliner',
    origin: getAirport('BOM'),
    destination: getAirport('LHR'),
    departureTime: new Date(Date.now() + 86400000 * 2 + 3600000 * 7).toISOString(),
    arrivalTime: new Date(Date.now() + 86400000 * 2 + 3600000 * 16.5).toISOString(),
    duration: '9h 30m',
    stops: 0,
    prices: { economy: 580, premiumEconomy: 910, business: 1920, first: 3750 },
    availableSeats: { economy: 48, premiumEconomy: 16, business: 10, first: 4 },
    status: 'SCHEDULED',
    gate: 'T2-42',
  },
  {
    id: 'fl-d2i-403',
    flightNumber: 'AW-503',
    airline: 'AeroWings',
    aircraft: 'Airbus A350-900',
    origin: getAirport('BLR'),
    destination: getAirport('SIN'),
    departureTime: new Date(Date.now() + 86400000 * 2 + 3600000 * 11).toISOString(),
    arrivalTime: new Date(Date.now() + 86400000 * 2 + 3600000 * 15.5).toISOString(),
    duration: '4h 30m',
    stops: 0,
    prices: { economy: 220, premiumEconomy: 390, business: 940, first: 2050 },
    availableSeats: { economy: 62, premiumEconomy: 20, business: 14, first: 2 },
    status: 'SCHEDULED',
    gate: 'T2-18',
  },
  {
    id: 'fl-d2i-404',
    flightNumber: 'AW-504',
    airline: 'AeroWings',
    aircraft: 'Boeing 787-9 Dreamliner',
    origin: getAirport('DEL'),
    destination: getAirport('HND'),
    departureTime: new Date(Date.now() + 86400000 * 3 + 3600000 * 1).toISOString(),
    arrivalTime: new Date(Date.now() + 86400000 * 3 + 3600000 * 9.2).toISOString(),
    duration: '8h 10m',
    stops: 0,
    prices: { economy: 490, premiumEconomy: 820, business: 1850, first: 3600 },
    availableSeats: { economy: 42, premiumEconomy: 14, business: 8, first: 2 },
    status: 'SCHEDULED',
    gate: 'T3-24',
  },
  {
    id: 'fl-d2i-405',
    flightNumber: 'AI-101',
    airline: 'Air India',
    aircraft: 'Boeing 777-300ER',
    origin: getAirport('DEL'),
    destination: getAirport('JFK'),
    departureTime: new Date(Date.now() + 86400000 * 3 + 3600000 * 2).toISOString(),
    arrivalTime: new Date(Date.now() + 86400000 * 3 + 3600000 * 17.5).toISOString(),
    duration: '15h 30m',
    stops: 0,
    prices: { economy: 820, premiumEconomy: 1350, business: 2950, first: 5400 },
    availableSeats: { economy: 70, premiumEconomy: 24, business: 18, first: 6 },
    status: 'SCHEDULED',
    gate: 'T3-06',
  },
  {
    id: 'fl-d2i-406',
    flightNumber: '6E-101',
    airline: 'IndiGo',
    aircraft: 'Airbus A321neo',
    origin: getAirport('BOM'),
    destination: getAirport('DXB'),
    departureTime: new Date(Date.now() + 86400000 * 2 + 3600000 * 16).toISOString(),
    arrivalTime: new Date(Date.now() + 86400000 * 2 + 3600000 * 19.3).toISOString(),
    duration: '3h 20m',
    stops: 0,
    prices: { economy: 165, premiumEconomy: 290, business: 650, first: 1200 },
    availableSeats: { economy: 85, premiumEconomy: 18, business: 8, first: 0 },
    status: 'SCHEDULED',
    gate: 'T2-15',
  },
  {
    id: 'fl-d2i-407',
    flightNumber: 'EY-204',
    airline: 'Etihad Airways',
    aircraft: 'Boeing 787-9 Dreamliner',
    origin: getAirport('BLR'),
    destination: getAirport('AUH'),
    departureTime: new Date(Date.now() + 86400000 * 2 + 3600000 * 4).toISOString(),
    arrivalTime: new Date(Date.now() + 86400000 * 2 + 3600000 * 7.75).toISOString(),
    duration: '3h 45m',
    stops: 0,
    prices: { economy: 195, premiumEconomy: 340, business: 820, first: 1750 },
    availableSeats: { economy: 58, premiumEconomy: 16, business: 12, first: 4 },
    status: 'SCHEDULED',
    gate: 'T2-22',
  },
  {
    id: 'fl-d2i-408',
    flightNumber: 'UL-122',
    airline: 'SriLankan Airlines',
    aircraft: 'Airbus A330-300',
    origin: getAirport('MAA'),
    destination: getAirport('CMB'),
    departureTime: new Date(Date.now() + 86400000 * 2 + 3600000 * 9).toISOString(),
    arrivalTime: new Date(Date.now() + 86400000 * 2 + 3600000 * 10.3).toISOString(),
    duration: '1h 20m',
    stops: 0,
    prices: { economy: 95, premiumEconomy: 170, business: 390, first: 720 },
    availableSeats: { economy: 72, premiumEconomy: 14, business: 8, first: 2 },
    status: 'SCHEDULED',
    gate: '03B',
  },

  // ========================================================
  // ADDITIONAL EXPANDED INTERNATIONAL TO INTERNATIONAL FLIGHTS
  // ========================================================
  {
    id: 'fl-i2i-601',
    flightNumber: 'AW-601',
    airline: 'AeroWings',
    aircraft: 'Boeing 787-9 Dreamliner',
    origin: getAirport('LHR'),
    destination: getAirport('JFK'),
    departureTime: new Date(Date.now() + 86400000 * 2 + 3600000 * 10).toISOString(),
    arrivalTime: new Date(Date.now() + 86400000 * 2 + 3600000 * 17.5).toISOString(),
    duration: '7h 30m',
    stops: 0,
    prices: { economy: 490, premiumEconomy: 780, business: 1680, first: 3250 },
    availableSeats: { economy: 50, premiumEconomy: 16, business: 10, first: 4 },
    status: 'SCHEDULED',
    gate: 'T2-14',
  },
  {
    id: 'fl-i2i-602',
    flightNumber: 'AW-602',
    airline: 'AeroWings',
    aircraft: 'Airbus A350-900',
    origin: getAirport('CDG'),
    destination: getAirport('HND'),
    departureTime: new Date(Date.now() + 86400000 * 3 + 3600000 * 13).toISOString(),
    arrivalTime: new Date(Date.now() + 86400000 * 4 + 3600000 * 1.5).toISOString(),
    duration: '12h 30m',
    stops: 0,
    prices: { economy: 720, premiumEconomy: 1180, business: 2650, first: 4800 },
    availableSeats: { economy: 45, premiumEconomy: 14, business: 8, first: 2 },
    status: 'SCHEDULED',
    gate: '2E-18',
  },
  {
    id: 'fl-i2i-603',
    flightNumber: 'AW-603',
    airline: 'AeroWings',
    aircraft: 'Boeing 777-300ER',
    origin: getAirport('DXB'),
    destination: getAirport('HND'),
    departureTime: new Date(Date.now() + 86400000 * 3 + 3600000 * 8).toISOString(),
    arrivalTime: new Date(Date.now() + 86400000 * 3 + 3600000 * 17.5).toISOString(),
    duration: '9h 30m',
    stops: 0,
    prices: { economy: 560, premiumEconomy: 890, business: 1950, first: 3650 },
    availableSeats: { economy: 52, premiumEconomy: 18, business: 12, first: 4 },
    status: 'SCHEDULED',
    gate: 'T3-11',
  },
  {
    id: 'fl-i2i-604',
    flightNumber: 'AW-604',
    airline: 'AeroWings',
    aircraft: 'Airbus A350-1000',
    origin: getAirport('SIN'),
    destination: getAirport('SYD'),
    departureTime: new Date(Date.now() + 86400000 * 3 + 3600000 * 20).toISOString(),
    arrivalTime: new Date(Date.now() + 86400000 * 4 + 3600000 * 3.8).toISOString(),
    duration: '7h 50m',
    stops: 0,
    prices: { economy: 480, premiumEconomy: 760, business: 1720, first: 3100 },
    availableSeats: { economy: 60, premiumEconomy: 16, business: 10, first: 4 },
    status: 'SCHEDULED',
    gate: 'T3-28',
  },
  {
    id: 'fl-i2i-605',
    flightNumber: 'BA-115',
    airline: 'British Airways',
    aircraft: 'Boeing 777-300ER',
    origin: getAirport('LHR'),
    destination: getAirport('JFK'),
    departureTime: new Date(Date.now() + 86400000 * 2 + 3600000 * 14).toISOString(),
    arrivalTime: new Date(Date.now() + 86400000 * 2 + 3600000 * 21.5).toISOString(),
    duration: '7h 30m',
    stops: 0,
    prices: { economy: 510, premiumEconomy: 840, business: 1850, first: 3600 },
    availableSeats: { economy: 65, premiumEconomy: 22, business: 16, first: 4 },
    status: 'SCHEDULED',
    gate: 'T5-B3',
  },
  {
    id: 'fl-i2i-606',
    flightNumber: 'SQ-26',
    airline: 'Singapore Airlines',
    aircraft: 'Boeing 777-300ER',
    origin: getAirport('FRA'),
    destination: getAirport('JFK'),
    departureTime: new Date(Date.now() + 86400000 * 3 + 3600000 * 8).toISOString(),
    arrivalTime: new Date(Date.now() + 86400000 * 3 + 3600000 * 16.8).toISOString(),
    duration: '8h 50m',
    stops: 0,
    prices: { economy: 560, premiumEconomy: 910, business: 2050, first: 3900 },
    availableSeats: { economy: 58, premiumEconomy: 20, business: 14, first: 4 },
    status: 'SCHEDULED',
    gate: 'T1-B24',
  },
  {
    id: 'fl-i2i-607',
    flightNumber: 'EK-354',
    airline: 'Emirates',
    aircraft: 'Airbus A380-800',
    origin: getAirport('DXB'),
    destination: getAirport('SIN'),
    departureTime: new Date(Date.now() + 86400000 * 2 + 3600000 * 3).toISOString(),
    arrivalTime: new Date(Date.now() + 86400000 * 2 + 3600000 * 10.7).toISOString(),
    duration: '7h 40m',
    stops: 0,
    prices: { economy: 470, premiumEconomy: 780, business: 1720, first: 3400 },
    availableSeats: { economy: 90, premiumEconomy: 32, business: 22, first: 8 },
    status: 'SCHEDULED',
    gate: 'T3-A12',
  },
  {
    id: 'fl-i2i-608',
    flightNumber: 'AF-6',
    airline: 'Air France',
    aircraft: 'Boeing 777-300ER',
    origin: getAirport('CDG'),
    destination: getAirport('JFK'),
    departureTime: new Date(Date.now() + 86400000 * 2 + 3600000 * 14).toISOString(),
    arrivalTime: new Date(Date.now() + 86400000 * 2 + 3600000 * 22.3).toISOString(),
    duration: '8h 20m',
    stops: 0,
    prices: { economy: 540, premiumEconomy: 880, business: 1950, first: 3800 },
    availableSeats: { economy: 60, premiumEconomy: 20, business: 14, first: 4 },
    status: 'SCHEDULED',
    gate: '2E-K32',
  },
];

// Configured administrator credentials
const DEFAULT_ADMIN: User = {
  id: 'usr_admin_ops',
  name: 'AeroWings Operations Admin',
  email: 'akm@gmail.com',
  passwordHash: hashPassword('AK8971541794M'),
  role: 'admin',
  createdAt: new Date().toISOString(),
};

const DEFAULT_CUSTOMER: User = {
  id: 'usr_customer_demo',
  name: 'Elena Rostova',
  email: 'elena.rostova@example.com',
  passwordHash: hashPassword('ElenaFly@2026!'),
  role: 'customer',
  createdAt: new Date().toISOString(),
};

export function generateSecureVerificationToken(): string {
  return crypto.randomBytes(24).toString('hex');
}

export function generatePnr(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const numbers = '23456789';
  let pnr = 'AW-';
  for (let i = 0; i < 3; i++) {
    pnr += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  for (let i = 0; i < 2; i++) {
    pnr += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }
  return pnr;
}

const SEED_BOOKING: Booking = {
  id: 'bkg-seed-01',
  pnr: 'AW-KL782',
  verificationToken: 'c0a8019b882f4d1e90ac128790ba45f129c7b91a',
  flightId: 'fl-101',
  flight: INITIAL_FLIGHTS[0],
  cabinClass: 'business',
  passengers: [
    {
      id: 'pax-01',
      title: 'Ms',
      firstName: 'Elena',
      lastName: 'Rostova',
      dateOfBirth: '1992-06-14',
      gender: 'female',
      passportNumber: 'A94829104',
      nationality: 'United States',
      mealPreference: 'regular',
      seatNumber: '4A',
      seatType: 'window',
      seatFee: 40,
    },
  ],
  contactEmail: 'elena.rostova@example.com',
  contactPhone: '+1 (555) 234-5678',
  fareBreakdown: {
    baseFare: 1650,
    taxesAndFees: 182,
    seatSelectionFee: 40,
    totalAmount: 1872,
    currency: 'USD',
  },
  paymentStatus: 'PAID',
  paymentMethod: 'Visa ending in 4242',
  paymentTransactionId: 'tx_aeropay_8492041284',
  bookingStatus: 'CONFIRMED',
  createdAt: new Date(Date.now() - 86400000).toISOString(),
  confirmedAt: new Date(Date.now() - 86400000).toISOString(),
  emailConfirmationSent: true,
  emailDeliveryStatus: 'SIMULATED',
  ticketGenerated: true,
};

// Persistence management
export function saveStoreToDisk(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const data = {
      users: usersStore,
      bookings: bookingsStore,
      flights: flightsStore,
      emailLogs: emailLogsStore,
    };
    fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist AeroWings store to disk:', err);
  }
}

export function loadStoreFromDisk(): void {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, 'utf-8');
      const data = JSON.parse(raw);
      if (Array.isArray(data.users)) {
        usersStore.length = 0;
        usersStore.push(...data.users);
      }
      if (Array.isArray(data.bookings)) {
        bookingsStore.length = 0;
        bookingsStore.push(...data.bookings);
      }
      if (Array.isArray(data.flights)) {
        flightsStore.length = 0;
        flightsStore.push(...data.flights);
      }
      if (Array.isArray(data.emailLogs)) {
        emailLogsStore.length = 0;
        emailLogsStore.push(...data.emailLogs);
      }
    }
  } catch (err) {
    console.warn('Could not read existing store file, initializing fresh store:', err);
  }

  // Ensure administrator akm@gmail.com exists with operational admin privileges
  const adminIndex = usersStore.findIndex(
    (u) =>
      u.email.toLowerCase() === 'akm@gmail.com' ||
      u.email.toLowerCase() === 'admin@aerowings.com' ||
      (u.role === 'admin' && !u.email.includes('@example.com'))
  );
  if (adminIndex >= 0) {
    usersStore[adminIndex].id = 'usr_admin_ops';
    usersStore[adminIndex].name = 'AeroWings Operations Admin';
    usersStore[adminIndex].email = 'akm@gmail.com';
    usersStore[adminIndex].passwordHash = hashPassword('AK8971541794M');
    usersStore[adminIndex].role = 'admin';
  } else {
    usersStore.push(DEFAULT_ADMIN);
  }

  // Ensure all bookings have a valid verificationToken
  for (const b of bookingsStore) {
    if (!b.verificationToken) {
      b.verificationToken = generateSecureVerificationToken();
    }
  }

  // Ensure seed customer exists
  if (!usersStore.some((u) => u.email.toLowerCase() === DEFAULT_CUSTOMER.email.toLowerCase())) {
    usersStore.push(DEFAULT_CUSTOMER);
  }

  // Ensure 100 flights representing all 100 airlines in AIRLINES_CATALOGUE exist
  const all100Flights = generate100AirlinesFlights(AIRPORTS);
  for (const f of all100Flights) {
    const existingIndex = flightsStore.findIndex(
      (existing) => existing.id === f.id || existing.airline.toLowerCase() === f.airline.toLowerCase()
    );
    if (existingIndex < 0) {
      flightsStore.push(f);
    } else {
      // update details and guarantee stops
      flightsStore[existingIndex].origin = f.origin;
      flightsStore[existingIndex].destination = f.destination;
      flightsStore[existingIndex].stops = f.stops;
    }
  }

  // Ensure seed booking exists for immediate validation testing
  if (!bookingsStore.some((b) => b.pnr === 'AW-KL782')) {
    bookingsStore.unshift(SEED_BOOKING);
  }

  saveStoreToDisk();
}

// Initialize on module load
loadStoreFromDisk();
