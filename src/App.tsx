import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  Mail,
  Plane,
  QrCode,
  ShieldCheck,
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { CurrencyProvider, useCurrency } from './context/CurrencyContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { HeroSearch } from './components/HeroSearch.tsx';
import { StepIndicator } from './components/BookingFlow/StepIndicator.tsx';
import { Step1FlightSelection } from './components/BookingFlow/Step1FlightSelection.tsx';
import { Step2TravelerDetails } from './components/BookingFlow/Step2TravelerDetails.tsx';
import { Step3SeatSelection } from './components/BookingFlow/Step3SeatSelection.tsx';
import { Step4BookingConfirmation } from './components/BookingFlow/Step4BookingConfirmation.tsx';
import { Step5PayAndVerifyOtp } from './components/BookingFlow/Step5PayAndVerifyOtp.tsx';
import { BookingSuccessModal } from './components/BookingFlow/BookingSuccessModal.tsx';
import { MyBookings } from './components/MyBookings.tsx';
import { VerificationPage } from './components/VerificationPage.tsx';
import { AdminPortal } from './components/AdminPortal.tsx';
import { LiveFlightStatus } from './components/LiveFlightStatus.tsx';
import { SignInModal } from './components/Auth/SignInModal.tsx';
import { SignUpModal } from './components/Auth/SignUpModal.tsx';
import { ForgotPasswordModal } from './components/Auth/ForgotPasswordModal.tsx';
import { TravelExploreGrid } from './components/TravelExploreGrid.tsx';
import { fetchAirports, fetchFlights } from './lib/api.ts';
import type { Airport, Booking, BookingDraft, BookingStep, CabinClass, Flight, Passenger, TravelerCounts, User } from './types/index.ts';

function MainApp() {
  const { user } = useAuth();
  const { formatPrice } = useCurrency();

  // Navigation State
  const [currentView, setCurrentView] = useState<'home' | 'booking' | 'flight-status' | 'my-bookings' | 'verify' | 'admin'>('home');
  const [verificationTokenParam, setVerificationTokenParam] = useState<string | undefined>(undefined);

  // Auth Modals State
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [isForgotPassOpen, setIsForgotPassOpen] = useState(false);
  const [authModalReason, setAuthModalReason] = useState<string | undefined>(undefined);
  const [pendingBookingAction, setPendingBookingAction] = useState<{
    flight: Flight;
    cabin: CabinClass;
    step: BookingStep;
  } | null>(null);

  // Global Flight & Airport Data
  const [airports, setAirports] = useState<Airport[]>([]);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loadingFlights, setLoadingFlights] = useState(true);

  // 5-Step Booking Flow State (Preserves all backward navigation without data loss!)
  const [currentStep, setCurrentStep] = useState<BookingStep>(1);
  const [maxAccessibleStep, setMaxAccessibleStep] = useState<BookingStep>(1);
  const [bookingDraft, setBookingDraft] = useState<BookingDraft>({
    flight: null,
    cabinClass: 'economy',
    passengers: [
      {
        id: 'pax_1',
        title: 'Mr',
        firstName: '',
        lastName: '',
        dateOfBirth: '1995-04-12',
        gender: 'male',
        passportNumber: '',
        nationality: 'United States',
        mealPreference: 'regular',
      },
    ],
    contactEmail: user?.email || '',
    contactPhone: '',
    fareBreakdown: {
      baseFare: 480,
      taxesAndFees: 64,
      seatSelectionFee: 0,
      totalAmount: 544,
      currency: 'USD',
    },
    selectedSeats: {},
  });

  // Confirmed Booking Success & Lock State (once ticket generates, stay confirmed)
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(() => {
    try {
      const saved = localStorage.getItem('aerowings_confirmed_booking');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isBookingConfirmed, setIsBookingConfirmed] = useState<boolean>(() => {
    try {
      return Boolean(localStorage.getItem('aerowings_confirmed_booking'));
    } catch {
      return false;
    }
  });
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // Detect URL routing for QR Code verification
  useEffect(() => {
    const path = window.location.pathname;
    const match = path.match(/\/booking\/verify\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      setVerificationTokenParam(match[1]);
      setCurrentView('verify');
    }
  }, []);

  // Update contact email if user signs in
  useEffect(() => {
    if (user?.email && !bookingDraft.contactEmail) {
      setBookingDraft((prev) => ({ ...prev, contactEmail: user.email }));
    }
  }, [user]);

  // Load initial flights and airports
  useEffect(() => {
    async function loadData() {
      setLoadingFlights(true);
      try {
        const [apList, flList] = await Promise.all([fetchAirports(), fetchFlights()]);
        setAirports(apList);
        setFlights(flList);
        if (flList.length > 0 && !bookingDraft.flight) {
          setBookingDraft((prev) => ({
            ...prev,
            flight: flList[0],
            fareBreakdown: calculateFare(flList[0], prev.cabinClass, prev.passengers.length, prev.selectedSeats),
          }));
        }
      } catch (err) {
        console.error('Failed to load flight data', err);
      } finally {
        setLoadingFlights(false);
      }
    }
    loadData();
  }, []);

  // Calculate Fare Breakdown dynamically including baggage and seat selection
  const calculateFare = (
    flight: Flight | null,
    cabin: CabinClass,
    paxList: Passenger[] | number,
    seats: Record<string, string>
  ) => {
    const paxCount = Array.isArray(paxList) ? paxList.length : paxList;
    if (!flight) {
      return { baseFare: 500, taxesAndFees: 60, seatSelectionFee: 0, baggageFee: 0, totalAmount: 560, currency: 'USD' };
    }
    const basePerPax = flight.prices[cabin] || 500;
    const baseFare = basePerPax * paxCount;
    const taxesAndFees = Math.round(baseFare * 0.12);
    let seatSelectionFee = 0;
    Object.values(seats).forEach((seatNum) => {
      const row = parseInt(seatNum.replace(/\D/g, ''), 10) || 10;
      if (row === 1 || row === 5 || row === 10 || row === 14) seatSelectionFee += 35;
      else if (seatNum.endsWith('A') || seatNum.endsWith('F')) seatSelectionFee += 15;
    });

    let baggageFee = 0;
    if (Array.isArray(paxList)) {
      paxList.forEach((p) => {
        if (p.baggage?.extraFeeUSD) {
          baggageFee += Number(p.baggage.extraFeeUSD);
        }
      });
    }

    const totalAmount = baseFare + taxesAndFees + seatSelectionFee + baggageFee;
    return {
      baseFare,
      taxesAndFees,
      seatSelectionFee,
      baggageFee,
      totalAmount,
      currency: 'USD',
    };
  };

  // Step 1 Flight Selection
  const handleSelectFlight = (flight: Flight, cabin: CabinClass) => {
    setBookingDraft((prev) => {
      const newBreakdown = calculateFare(flight, cabin, prev.passengers, prev.selectedSeats);
      return {
        ...prev,
        flight,
        cabinClass: cabin,
        fareBreakdown: newBreakdown,
      };
    });
  };

  // Step 2 Update Passengers & Contact
  const handleUpdatePassengers = (passengers: Passenger[]) => {
    setBookingDraft((prev) => {
      const newBreakdown = calculateFare(prev.flight, prev.cabinClass, passengers, prev.selectedSeats);
      return {
        ...prev,
        passengers,
        fareBreakdown: newBreakdown,
      };
    });
  };

  const handleUpdateContact = (contactEmail: string, contactPhone: string) => {
    setBookingDraft((prev) => ({ ...prev, contactEmail, contactPhone }));
  };

  // Step 3 Seat Selection
  const handleSelectSeat = (passengerId: string, seatNumber: string, fee: number) => {
    setBookingDraft((prev) => {
      const updatedSeats = { ...prev.selectedSeats, [passengerId]: seatNumber };
      const updatedPax = prev.passengers.map((p) =>
        p.id === passengerId ? { ...p, seatNumber, seatFee: fee } : p
      );
      const newBreakdown = calculateFare(prev.flight, prev.cabinClass, updatedPax, updatedSeats);
      return {
        ...prev,
        selectedSeats: updatedSeats,
        passengers: updatedPax,
        fareBreakdown: newBreakdown,
      };
    });
  };

  // Handle user authentication success & resume pending booking flow
  const handleAuthSuccess = (authedUser: User) => {
    if (pendingBookingAction) {
      handleSelectFlight(pendingBookingAction.flight, pendingBookingAction.cabin);
      setBookingDraft((prev) => ({
        ...prev,
        contactEmail: authedUser.email || prev.contactEmail,
      }));
      setCurrentView('booking');
      setCurrentStep(pendingBookingAction.step);
      setMaxAccessibleStep((prev) => Math.max(prev, pendingBookingAction.step) as BookingStep);
      setPendingBookingAction(null);
      setAuthModalReason(undefined);
    }
  };

  // Navigation across the 5 steps (Guarded by user authentication & ticket confirmation lock!)
  const goToStep = (step: BookingStep) => {
    // If ticket is already generated, lock in place: do not allow jumping back to previous steps!
    if (isBookingConfirmed && step < 5) {
      return;
    }
    if (step > 1 && !user) {
      setPendingBookingAction({
        flight: bookingDraft.flight || flights[0],
        cabin: bookingDraft.cabinClass,
        step,
      });
      setAuthModalReason('Please sign in or create an account to proceed with your flight reservation.');
      setIsSignInOpen(true);
      return;
    }
    setCurrentStep(step);
    if (step > maxAccessibleStep) {
      setMaxAccessibleStep(step);
    }
  };

  // Handle Search from Hero
  const handleHeroSearch = async (params: {
    origin: string;
    destination: string;
    cabinClass: CabinClass;
    travelers: number;
    travelerCounts: TravelerCounts;
    date: string;
  }) => {
    setIsBookingConfirmed(false);
    setLoadingFlights(true);
    try {
      const results = await fetchFlights({
        origin: params.origin,
        destination: params.destination,
        cabinClass: params.cabinClass,
        date: params.date,
        passengers: params.travelers,
      });
      setFlights(results);

      // Create passengers array matching traveler count
      const newPaxList: Passenger[] = [];
      for (let i = 0; i < params.travelers; i++) {
        newPaxList.push({
          id: `pax_${i + 1}`,
          title: 'Mr',
          firstName: i === 0 && user?.name ? user.name.split(' ')[0] : '',
          lastName: i === 0 && user?.name ? user.name.split(' ').slice(1).join(' ') : '',
          dateOfBirth: '1995-01-01',
          gender: 'male',
          passportNumber: '',
          nationality: 'United States',
          mealPreference: 'regular',
        });
      }

      const activeFlight = results.length > 0 ? results[0] : null;
      setBookingDraft((prev) => ({
        ...prev,
        flight: activeFlight,
        cabinClass: params.cabinClass,
        passengers: newPaxList,
        contactEmail: user?.email || prev.contactEmail,
        fareBreakdown: calculateFare(activeFlight, params.cabinClass, params.travelers, {}),
        selectedSeats: {},
      }));

      setCurrentView('booking');
      setCurrentStep(1);
      setMaxAccessibleStep(1);
    } catch (err) {
      console.error('Failed to search flights', err);
    } finally {
      setLoadingFlights(false);
    }
  };

  // Booking confirmed successfully in Step 5 (Locks confirmed state permanently)
  const handleBookingSuccess = (booking: Booking) => {
    setIsBookingConfirmed(true);
    setCurrentStep(5);
    setMaxAccessibleStep(5);
    setConfirmedBooking(booking);
    setIsSuccessModalOpen(true);
    try {
      localStorage.setItem('aerowings_confirmed_booking', JSON.stringify(booking));
    } catch {}
  };

  const handleSelectExplorePackage = (pkg: { origin: string; destination: string; date?: string }) => {
    handleHeroSearch({
      origin: pkg.origin,
      destination: pkg.destination,
      cabinClass: 'economy',
      travelers: 1,
      travelerCounts: { adults: 1, children: 0, infants: 0 },
      date: pkg.date || new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    });
  };

  const handleResetBookingFlow = () => {
    setIsBookingConfirmed(false);
    setConfirmedBooking(null);
    setIsSuccessModalOpen(false);
    try {
      localStorage.removeItem('aerowings_confirmed_booking');
    } catch {}
    setCurrentStep(1);
    setMaxAccessibleStep(1);
    setCurrentView('home');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Navigation Bar with Restored AeroWings Design & Multi-Currency */}
      <Navbar
        currentView={currentView}
        onNavigate={(view) => {
          setCurrentView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenSignIn={() => setIsSignInOpen(true)}
        onOpenSignUp={() => setIsSignUpOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* VIEW 1: HOME */}
        {currentView === 'home' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-12">
            <HeroSearch airports={airports} onSearch={handleHeroSearch} />

            {/* Travel Options Card Layout Grid (Components of card grid for travel options & packages) */}
            <TravelExploreGrid onSelectOption={handleSelectExplorePackage} />

            {/* Popular Routes Section */}
            <div className="space-y-6 pt-2">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-900">
                    Non-Stop Global Network
                  </span>
                  <h2 className="text-2xl font-extrabold text-slate-900 mt-0.5">Popular AeroWings Routes</h2>
                  <p className="text-xs text-slate-500">
                    Direct flights aboard Airbus A350 & Boeing 787 Dreamliner fleet
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setCurrentView('flight-status')}
                    className="text-xs font-bold text-blue-900 hover:text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Track Live Flights</span>
                  </button>
                  <button
                    onClick={() => {
                      setCurrentView('booking');
                      setCurrentStep(1);
                    }}
                    className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1 transition-colors"
                  >
                    <span>Flight Schedules</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {flights.slice(0, 3).map((flight) => (
                  <div
                    key={flight.id}
                    className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 transition-all flex flex-col justify-between space-y-4 shadow-xs hover:shadow-md group"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                        <span className="font-mono text-blue-900 font-bold">{flight.flightNumber}</span>
                        <span>{flight.duration} • Direct</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-2xl font-black text-slate-900">{flight.origin.code}</div>
                          <div className="text-xs text-slate-500">{flight.origin.city}</div>
                        </div>
                        <div className="flex flex-col items-center px-4">
                          <Plane className="w-4 h-4 text-blue-700 group-hover:translate-x-1 transition-transform" />
                          <span className="text-[10px] text-slate-400 mt-1">{flight.aircraft.split(' ')[0]}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-black text-slate-900">{flight.destination.code}</div>
                          <div className="text-xs text-slate-500">{flight.destination.city}</div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Fares starting from</span>
                        <span className="text-base font-extrabold text-blue-950 font-mono">
                          {formatPrice(flight.prices.economy)}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          if (!user) {
                            setPendingBookingAction({ flight, cabin: 'economy', step: 2 });
                            setAuthModalReason('Please sign in or create an account to proceed with your flight reservation.');
                            setIsSignInOpen(true);
                            return;
                          }
                          handleSelectFlight(flight, 'economy');
                          setCurrentView('booking');
                          setCurrentStep(2);
                          setMaxAccessibleStep(2);
                        }}
                        className="px-3.5 py-1.5 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
                      >
                        Book Flight
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Aviation Security & Quality Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-900 mb-3">
                  <Mail className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Email OTP Authentication</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Fast and cryptographically secure email OTPs with 5-minute single-use expiry. Dispatched directly to customer email via Resend.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-900 mb-3">
                  <QrCode className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Electronic PDF Tickets</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Download valid PDF e-tickets equipped with authentic scannable QR codes linking to real airline database verification endpoints.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-900 mb-3">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Strict 5-Step Integrity</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Structured 5-step booking journey with full review before payment. Backward navigation preserves all passenger data and seat selections.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: 5-STEP BOOKING FLOW */}
        {currentView === 'booking' && (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
            {/* Step Indicator */}
            <StepIndicator
              currentStep={currentStep}
              onStepClick={goToStep}
              maxAccessibleStep={maxAccessibleStep}
              isConfirmed={isBookingConfirmed}
            />

            {/* STEP 1: Flight Selection */}
            {currentStep === 1 && (
              <Step1FlightSelection
                flights={flights}
                selectedFlight={bookingDraft.flight}
                selectedCabinClass={bookingDraft.cabinClass}
                onSelectFlight={handleSelectFlight}
                onNext={() => goToStep(2)}
                onRequestSignIn={(fl, cb) => {
                  setPendingBookingAction({ flight: fl, cabin: cb, step: 2 });
                  setAuthModalReason('Please sign in or create an account to proceed with your flight reservation.');
                  setIsSignInOpen(true);
                }}
              />
            )}

            {/* STEP 2: Seat Selection (Now Step 2, with 'Continue to Traveler Details' below it) */}
            {currentStep === 2 && (
              <Step3SeatSelection
                cabinClass={bookingDraft.cabinClass}
                passengers={bookingDraft.passengers}
                selectedSeats={bookingDraft.selectedSeats}
                onSelectSeat={handleSelectSeat}
                onNext={() => goToStep(3)}
                onBack={() => goToStep(1)}
              />
            )}

            {/* STEP 3: Traveler & Baggage Details */}
            {currentStep === 3 && (
              <Step2TravelerDetails
                passengers={bookingDraft.passengers}
                contactEmail={bookingDraft.contactEmail}
                contactPhone={bookingDraft.contactPhone}
                cabinClass={bookingDraft.cabinClass}
                flight={bookingDraft.flight}
                onUpdatePassengers={handleUpdatePassengers}
                onUpdateContact={handleUpdateContact}
                onNext={() => goToStep(4)}
                onBack={() => goToStep(2)}
              />
            )}

            {/* STEP 4: Booking Confirmation (Review before payment; pending notice) */}
            {currentStep === 4 && (
              <Step4BookingConfirmation
                flight={bookingDraft.flight!}
                cabinClass={bookingDraft.cabinClass}
                passengers={bookingDraft.passengers}
                contactEmail={bookingDraft.contactEmail}
                contactPhone={bookingDraft.contactPhone}
                fareBreakdown={bookingDraft.fareBreakdown}
                onNext={() => goToStep(5)}
                onBack={() => goToStep(3)}
              />
            )}

            {/* STEP 5: Pay & Verify OTP (Locks confirmed ticket permanently once generated) */}
            {currentStep === 5 && (
              <Step5PayAndVerifyOtp
                draft={bookingDraft}
                confirmedBooking={confirmedBooking}
                onBookingSuccess={handleBookingSuccess}
                onBack={() => goToStep(4)}
                onBookAnotherFlight={handleResetBookingFlow}
                onViewMyBookings={() => setCurrentView('my-bookings')}
              />
            )}
          </div>
        )}

        {/* VIEW 3: LIVE FLIGHT STATUS */}
        {currentView === 'flight-status' && (
          <LiveFlightStatus
            onSelectFlightForBooking={(fl, cb) => {
              handleSelectFlight(fl, cb);
              setCurrentView('booking');
              setCurrentStep(2);
              setMaxAccessibleStep(2);
            }}
          />
        )}

        {/* VIEW 4: MY BOOKINGS */}
        {currentView === 'my-bookings' && <MyBookings />}

        {/* VIEW 5: QR CODE TICKET VERIFICATION */}
        {currentView === 'verify' && (
          <VerificationPage
            initialToken={verificationTokenParam}
            onNavigateHome={() => setCurrentView('home')}
          />
        )}

        {/* VIEW 6: ADMIN PORTAL */}
        {currentView === 'admin' && <AdminPortal />}
      </main>

      {/* Booking Confirmed Success Modal (Closing modal does not wipe confirmed ticket!) */}
      {isSuccessModalOpen && confirmedBooking && (
        <BookingSuccessModal
          booking={confirmedBooking}
          onClose={() => setIsSuccessModalOpen(false)}
          onViewMyBookings={() => {
            setIsSuccessModalOpen(false);
            setCurrentView('my-bookings');
          }}
        />
      )}

      {/* Authentication Modals */}
      <SignInModal
        isOpen={isSignInOpen}
        reason={authModalReason}
        onSuccess={handleAuthSuccess}
        onClose={() => {
          setIsSignInOpen(false);
          setAuthModalReason(undefined);
        }}
        onSwitchToSignUp={() => {
          setIsSignInOpen(false);
          setIsSignUpOpen(true);
        }}
        onOpenForgotPassword={() => {
          setIsSignInOpen(false);
          setIsForgotPassOpen(true);
        }}
      />

      <SignUpModal
        isOpen={isSignUpOpen}
        reason={authModalReason}
        onSuccess={handleAuthSuccess}
        onClose={() => {
          setIsSignUpOpen(false);
          setAuthModalReason(undefined);
        }}
        onSwitchToSignIn={() => {
          setIsSignUpOpen(false);
          setIsSignInOpen(true);
        }}
      />

      <ForgotPasswordModal
        isOpen={isForgotPassOpen}
        onClose={() => setIsForgotPassOpen(false)}
        onBackToSignIn={() => {
          setIsForgotPassOpen(false);
          setIsSignInOpen(true);
        }}
      />

      {/* Clean AeroWings Footer */}
      <footer className="mt-16 border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-blue-950">AeroWings Airlines</span>
            <span>•</span>
            <span>Global Passenger Reservations & Fleet Management</span>
          </div>
          <div>
            © {new Date().getFullYear()} AeroWings Ltd. Direct Resend Integration. Zero SMS dependencies.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CurrencyProvider>
        <MainApp />
      </CurrencyProvider>
    </AuthProvider>
  );
}
