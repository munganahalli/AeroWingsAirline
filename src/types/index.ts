export type CabinClass = 'economy' | 'premiumEconomy' | 'business' | 'first';

export interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
  category?: 'domestic' | 'international';
  terminal?: string;
  lat?: number;
  lon?: number;
}

export interface TravelerCounts {
  adults: number;
  children: number;
  infants: number;
}

export interface Flight {
  id: string;
  flightNumber: string;
  airline: string;
  aircraft: string;
  origin: Airport;
  destination: Airport;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  stops: number;
  prices: {
    economy: number;
    premiumEconomy: number;
    business: number;
    first: number;
  };
  availableSeats: {
    economy: number;
    premiumEconomy: number;
    business: number;
    first: number;
  };
  status: 'SCHEDULED' | 'BOARDING' | 'DEPARTED' | 'DELAYED' | 'CANCELLED';
  gate?: string;
}

export interface PassengerBaggageSelection {
  cabinAllowance: string;
  checkedAllowance: string;
  extraOptionId?: string;
  extraOptionTitle?: string;
  extraWeightKg?: number;
  extraFeeUSD?: number;
}

export interface Passenger {
  id: string;
  title: 'Mr' | 'Mrs' | 'Ms' | 'Dr' | 'Prof';
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  passportNumber: string;
  nationality: string;
  mealPreference: 'regular' | 'vegetarian' | 'vegan' | 'halal' | 'kosher' | 'diabetic';
  seatNumber?: string;
  seatType?: 'standard' | 'window' | 'aisle' | 'extra_legroom';
  seatFee?: number;
  baggage?: PassengerBaggageSelection;
}

export interface FareBreakdown {
  baseFare: number;
  taxesAndFees: number;
  seatSelectionFee: number;
  baggageFee?: number;
  totalAmount: number;
  currency: string;
}

export interface BookingBaggageSummary {
  cabinAllowanceSummary: string;
  checkedAllowanceSummary: string;
  totalBaggageFeeUSD: number;
  selectedAddons: {
    passengerName: string;
    optionTitle: string;
    feeUSD: number;
  }[];
}

export interface Booking {
  id: string;
  userId?: string;
  customerName?: string;
  pnr: string;
  verificationToken: string;
  flightId: string;
  flight: Flight;
  cabinClass: CabinClass;
  passengers: Passenger[];
  contactEmail: string;
  contactPhone: string;
  fareBreakdown: FareBreakdown;
  originalCurrency?: string;
  originalAmount?: number;
  baggageDetails?: BookingBaggageSummary;
  paymentStatus: 'PAID' | 'PENDING' | 'REFUNDED';
  paymentMethod: string;
  paymentTransactionId: string;
  bookingStatus: 'CONFIRMED' | 'CANCELLED' | 'PENDING';
  createdAt: string;
  confirmedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  refundAmount?: number;
  emailConfirmationSent: boolean;
  emailConfirmationId?: string;
  emailDeliveryStatus: 'DELIVERED' | 'SIMULATED' | 'FAILED' | 'PENDING';
  emailDeliveryError?: string;
  ticketGenerated: boolean;
  isWeatherCancellation?: boolean;
  weatherAlertDetails?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin';
}

export interface EmailLog {
  id: string;
  to: string;
  subject: string;
  type: 'OTP' | 'BOOKING_CONFIRMATION' | 'BOOKING_CANCELLATION' | 'PASSWORD_RESET';
  status: 'SENT' | 'SIMULATED' | 'FAILED';
  resendId?: string;
  errorMessage?: string;
  pnr?: string;
  timestamp: string;
}

export type BookingStep = 1 | 2 | 3 | 4 | 5;

export interface BookingDraft {
  flight: Flight | null;
  cabinClass: CabinClass;
  passengers: Passenger[];
  contactEmail: string;
  contactPhone: string;
  fareBreakdown: FareBreakdown;
  selectedSeats: Record<string, string>; // passengerId -> seatNumber
  baggageSummary?: BookingBaggageSummary;
}

export interface AirportWeather {
  airportCode: string;
  airportName: string;
  city: string;
  country: string;
  temperatureC: number;
  temperatureF: number;
  condition: string;
  weatherCode: number;
  precipitationMm: number;
  precipitationProbability: number;
  windSpeedKmh: number;
  windGustsKmh: number;
  relativeHumidity: number;
  surfacePressureHpa: number;
  visibilityMeters: number;
  timestamp: string;
  dataSource: string;
  isForecast: boolean;
  isStale: boolean;
  weatherRisk: {
    level: 'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE';
    flaggedForOperationalReview: boolean;
    isAdverse: boolean;
    reason?: string;
  };
}

export interface FlightWeatherReport {
  flightId: string;
  flightNumber: string;
  airline: string;
  departureAirport: AirportWeather;
  arrivalAirport: AirportWeather;
  overallRisk: 'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE';
  operationalReviewRequired: boolean;
  isBadWeather: boolean;
  cancellationRecommended: boolean;
  advisorySummary: string;
  disclaimer: string;
}

export interface BaggageAllowance {
  cabinClass: CabinClass;
  airline: string;
  routeType: 'domestic' | 'international';
  cabinAllowanceText: string;
  checkedAllowanceText: string;
  cabinMaxWeightKg: number;
  cabinMaxPieces: number;
  checkedMaxWeightKg: number;
  checkedMaxPieces: number;
  personalItemIncluded: boolean;
}

export interface AdditionalBaggageOption {
  id: string;
  title: string;
  description: string;
  weightLimitKg: number;
  priceUSD: number;
  maxSelectablePerPax: number;
}
