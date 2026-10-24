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

export interface OtpRecord {
  email: string;
  code: string;
  purpose: 'REGISTRATION' | 'LOGIN' | 'PASSWORD_RESET' | 'BOOKING_VERIFY';
  createdAt: number;
  expiresAt: number;
  attempts: number;
  verified: boolean;
  lastSentAt: number;
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

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'customer' | 'admin';
  createdAt: string;
}
