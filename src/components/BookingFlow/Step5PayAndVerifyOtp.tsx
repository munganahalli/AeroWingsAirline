import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  Download,
  Lock,
  Mail,
  Plane,
  QrCode,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useCurrency } from '../../context/CurrencyContext.tsx';
import { createBooking, sendOtp, verifyOtp } from '../../lib/api.ts';
import { downloadElectronicTicketPdf } from '../../lib/pdfTicket.ts';
import type { Booking, BookingDraft } from '../../types/index.ts';

interface Step5Props {
  draft: BookingDraft;
  confirmedBooking?: Booking | null;
  onBookingSuccess: (booking: Booking) => void;
  onBack: () => void;
  onBookAnotherFlight?: () => void;
  onViewMyBookings?: () => void;
}

export function Step5PayAndVerifyOtp({
  draft,
  confirmedBooking: propConfirmedBooking,
  onBookingSuccess,
  onBack,
  onBookAnotherFlight,
  onViewMyBookings,
}: Step5Props) {
  const { user } = useAuth();
  const { formatPrice, currency } = useCurrency();

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'aeropay' | 'wire'>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardName, setCardName] = useState('');

  // Email OTP state
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [expirySeconds, setExpirySeconds] = useState(300);
  const [simulatedNotice, setSimulatedNotice] = useState<string | null>(null);

  // Flow & error state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [idempotencyKey] = useState(() => 'bkg_' + Math.random().toString(36).substring(2, 10));

  // Confirmed booking state (Permanent state — once OTP and ticket generate, that's it!)
  const [localConfirmedBooking, setLocalConfirmedBooking] = useState<Booking | null>(null);
  const effectiveBooking = propConfirmedBooking || localConfirmedBooking;

  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [copiedPnr, setCopiedPnr] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  useEffect(() => {
    if (effectiveBooking) {
      const verificationUrl = `${window.location.origin}/booking/verify/${effectiveBooking.verificationToken}`;
      QRCode.toDataURL(verificationUrl, {
        margin: 1,
        width: 256,
        color: { dark: '#002b49', light: '#ffffff' },
      })
        .then((url) => setQrCodeDataUrl(url))
        .catch((err) => console.error('Failed to generate verification QR code', err));
    }
  }, [effectiveBooking]);

  // Cooldown countdown
  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // 5-minute expiry countdown
  useEffect(() => {
    let timer: any;
    if (otpSent && expirySeconds > 0) {
      timer = setInterval(() => setExpirySeconds((e) => e - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [otpSent, expirySeconds]);

  // Auto-send OTP on step mount to customer's exact email address ONLY if not already confirmed
  useEffect(() => {
    if (!effectiveBooking && !otpSent && draft.contactEmail) {
      handleSendOtp();
    }
  }, [effectiveBooking, draft.contactEmail]);

  const handleSendOtp = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await sendOtp(draft.contactEmail, 'BOOKING_VERIFY');
      setOtpSent(true);
      setCooldown(res.cooldownSeconds || 60);
      setExpirySeconds(300);
      if (res.simulatedCode) {
        setOtpCode(res.simulatedCode);
        setSimulatedNotice(`Verification code dispatched to ${draft.contactEmail}. (Dev Mode Code: ${res.simulatedCode})`);
      } else {
        setSimulatedNotice(`Verification code dispatched to ${draft.contactEmail}. Please check your email inbox (valid for 5 minutes).`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch verification code to your email.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayAndConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1. Validate payment details
    if (paymentMethod === 'card') {
      if (cardNumber.replace(/\s/g, '').length < 16) {
        setError('Please enter a valid 16-digit payment card number.');
        return;
      }
      if (!cardExpiry || !cardCvc || !cardName.trim()) {
        setError('Please complete all card details (Name on Card, Expiry, CVV).');
        return;
      }
    }

    // 2. Validate OTP
    if (!otpCode || otpCode.trim().length !== 6) {
      setError('Please enter the 6-digit email verification code.');
      return;
    }

    setLoading(true);
    try {
      // Step A: Verify OTP with server if not already verified
      if (!otpVerified) {
        await verifyOtp(draft.contactEmail, otpCode.trim(), 'BOOKING_VERIFY');
        setOtpVerified(true);
      }

      if (!user) {
        setError('You must sign in or create an account to complete booking payment.');
        setLoading(false);
        return;
      }

      // Step B: Submit booking creation & payment simulation
      const paymentDescriptor =
        paymentMethod === 'card'
          ? `Card ending in ${cardNumber.slice(-4) || '4242'}`
          : paymentMethod === 'aeropay'
          ? 'AeroPay Instant Flight Wallet'
          : 'Wire Transfer / Electronic Bank Transfer';

      const res = await createBooking({
        flightId: draft.flight!.id,
        cabinClass: draft.cabinClass,
        passengers: draft.passengers,
        contactEmail: draft.contactEmail,
        contactPhone: draft.contactPhone,
        fareBreakdown: draft.fareBreakdown,
        paymentMethod: paymentDescriptor,
        otpCode: otpCode.trim(),
        userId: user.id,
        idempotencyKey,
      });

      if (res.booking) {
        setLocalConfirmedBooking(res.booking);
        onBookingSuccess(res.booking);
      }
    } catch (err: any) {
      setError(err.message || 'Payment authorization or booking confirmation failed.');
    } finally {
      setLoading(false);
    }
  };

  const formattedTotal = formatPrice(draft.fareBreakdown.totalAmount);

  // ONCE TICKET IS GENERATED, DO NOT COME BACK TO PAYMENT FORM!
  if (effectiveBooking) {
    const confirmedBooking = effectiveBooking;
    const handleDownloadTicket = async () => {
      setDownloadingPdf(true);
      try {
        await downloadElectronicTicketPdf(confirmedBooking, window.location.origin, {
          code: currency.code,
          symbol: currency.symbol,
          rateFromUSD: currency.rateFromUSD,
        });
      } catch (err) {
        console.error('Failed to download ticket PDF', err);
      } finally {
        setDownloadingPdf(false);
      }
    };

    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Confirmed Header */}
        <div className="p-6 rounded-2xl bg-white border border-emerald-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <span className="text-xs font-bold text-emerald-700 tracking-wider uppercase">
                Official E-Ticket Issued & Confirmed
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                Flight Ticket Confirmed
              </h2>
              <p className="text-xs text-slate-500">
                Your reservation is permanently stored in the airline database. Confirmation sent to <strong className="text-blue-900">{confirmedBooking.contactEmail}</strong>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadTicket}
              disabled={downloadingPdf}
              className="flex items-center gap-2 py-2.5 px-4 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
            >
              {downloadingPdf ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <span>Download E-Ticket (PDF)</span>
            </button>
            <a
              href={`/booking/verify/${confirmedBooking.verificationToken}`}
              className="flex items-center gap-1.5 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors border border-slate-200"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-900" />
              <span>Verify Ticket</span>
            </a>
          </div>
        </div>

        {/* Reference & Security Token Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider block">Booking Reference (PNR)</span>
              <span className="text-xl font-black text-blue-950 font-mono tracking-wider">{confirmedBooking.pnr}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(confirmedBooking.pnr);
                setCopiedPnr(true);
                setTimeout(() => setCopiedPnr(false), 2000);
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-blue-300 text-blue-900 font-bold text-xs rounded-lg hover:bg-blue-100 transition-colors shadow-xs"
            >
              {copiedPnr ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedPnr ? 'Copied' : 'Copy PNR'}</span>
            </button>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="truncate mr-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Verification Token</span>
              <span className="text-xs font-mono font-bold text-slate-800 truncate block max-w-[240px]" title={confirmedBooking.verificationToken}>
                {confirmedBooking.verificationToken}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(confirmedBooking.verificationToken);
                setCopiedToken(true);
                setTimeout(() => setCopiedToken(false), 2000);
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-300 text-slate-700 font-bold text-xs rounded-lg hover:bg-slate-100 transition-colors shadow-xs shrink-0"
            >
              {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedToken ? 'Copied' : 'Copy Token'}</span>
            </button>
          </div>
        </div>

        {/* Boarding Pass & Converted Fare Breakdown Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-6">
          {/* Flight Details */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div>
              <span className="text-xs font-bold text-blue-900">{confirmedBooking.flight.airline}</span>
              <h3 className="text-lg font-black text-slate-900 font-mono">{confirmedBooking.flight.flightNumber}</h3>
              <span className="text-xs text-slate-500 capitalize">{confirmedBooking.cabinClass} Class • {confirmedBooking.flight.aircraft}</span>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
              <div>
                <span className="text-slate-400 block text-[10px]">Gate</span>
                <span className="font-bold text-slate-800 font-mono text-sm">{confirmedBooking.flight.gate || 'TBD'}</span>
              </div>
              <div className="h-6 w-px bg-slate-200" />
              <div>
                <span className="text-slate-400 block text-[10px]">Status</span>
                <span className="font-bold text-emerald-700 text-sm">CONFIRMED</span>
              </div>
            </div>
          </div>

          {/* Route Display */}
          <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-6 py-2">
            <div>
              <span className="text-xs text-slate-500 block">Departure</span>
              <div className="text-2xl font-black text-slate-900">{confirmedBooking.flight.origin.code}</div>
              <div className="text-xs font-bold text-blue-900">{confirmedBooking.flight.origin.city}</div>
              <div className="text-[11px] text-slate-500">{confirmedBooking.flight.origin.name}</div>
              <div className="text-[11px] text-slate-400 mt-1">Terminal {confirmedBooking.flight.origin.terminal || '1'}</div>
            </div>

            <div className="flex flex-col items-center justify-center text-center">
              <span className="text-xs text-slate-500">{confirmedBooking.flight.duration}</span>
              <div className="w-full flex items-center my-2">
                <div className="h-0.5 bg-slate-200 flex-1" />
                <div className="p-1 rounded-full bg-blue-50 border border-blue-200 mx-2 text-blue-900">
                  <Plane className="w-4 h-4 rotate-90" />
                </div>
                <div className="h-0.5 bg-slate-200 flex-1" />
              </div>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Non-Stop Confirmed
              </span>
            </div>

            <div className="text-left md:text-right">
              <span className="text-xs text-slate-500 block">Arrival</span>
              <div className="text-2xl font-black text-slate-900">{confirmedBooking.flight.destination.code}</div>
              <div className="text-xs font-bold text-blue-900">{confirmedBooking.flight.destination.city}</div>
              <div className="text-[11px] text-slate-500">{confirmedBooking.flight.destination.name}</div>
              <div className="text-[11px] text-slate-400 mt-1">Terminal {confirmedBooking.flight.destination.terminal || '2'}</div>
            </div>
          </div>

          {/* Passengers Manifest */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-xs font-bold text-slate-700 block">Confirmed Passenger Manifest</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {confirmedBooking.passengers.map((p, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900">{p.title} {p.firstName} {p.lastName}</span>
                    <span className="text-[10px] text-slate-400 block">{p.nationality} • {p.mealPreference}</span>
                  </div>
                  <span className="font-mono font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    Seat {p.seatNumber || 'Standard'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Fare Breakdown (with active Currency Conversion) & QR Code */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 border-t border-slate-100 items-center">
            <div className="md:col-span-2 space-y-2 text-xs">
              <span className="font-bold text-slate-800 block text-sm">Fare Breakdown ({currency.code})</span>
              <div className="flex justify-between text-slate-600">
                <span>Base Airfare:</span>
                <span className="font-mono font-semibold">{formatPrice(confirmedBooking.fareBreakdown.baseFare)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Airport Taxes & Fees:</span>
                <span className="font-mono font-semibold">{formatPrice(confirmedBooking.fareBreakdown.taxesAndFees)}</span>
              </div>
              {confirmedBooking.fareBreakdown.seatSelectionFee > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Seat Selection Fees:</span>
                  <span className="font-mono font-semibold">{formatPrice(confirmedBooking.fareBreakdown.seatSelectionFee)}</span>
                </div>
              )}
              {confirmedBooking.fareBreakdown.baggageFee && confirmedBooking.fareBreakdown.baggageFee > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Extra Baggage Fees:</span>
                  <span className="font-mono font-semibold">{formatPrice(confirmedBooking.fareBreakdown.baggageFee)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-bold text-slate-900">
                <span>Total Paid ({currency.code}):</span>
                <span className="font-mono text-base text-blue-950 font-black">
                  {formatPrice(confirmedBooking.fareBreakdown.totalAmount)}
                </span>
              </div>
              {currency.code !== 'USD' && (
                <div className="text-[11px] text-slate-400 text-right">
                  (USD Equivalent: ${confirmedBooking.fareBreakdown.totalAmount.toFixed(2)} USD)
                </div>
              )}
            </div>

            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
              {qrCodeDataUrl ? (
                <img src={qrCodeDataUrl} alt="Ticket Verification QR" className="w-28 h-28 object-contain" />
              ) : (
                <div className="w-28 h-28 bg-white flex items-center justify-center"><QrCode className="w-8 h-8 text-slate-400" /></div>
              )}
              <span className="text-[9px] font-mono font-bold text-blue-900 mt-1">GATE VALIDATION QR</span>
              <span className="text-[8px] text-slate-500">Scan to Verify Ticket Authenticity</span>
            </div>
          </div>
        </div>

        {/* Clean Options: Book Another Flight or View in My Bookings */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-xs text-slate-600 font-medium">
            Your flight reservation is permanently confirmed and stored in the airline database.
          </span>
          <div className="flex items-center gap-2">
            {onViewMyBookings && (
              <button
                type="button"
                onClick={onViewMyBookings}
                className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
              >
                View in My Bookings
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (onBookAnotherFlight) {
                  onBookAnotherFlight();
                } else {
                  window.location.href = '/';
                }
              }}
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs transition-colors shadow-xs"
            >
              Book Another Flight
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handlePayAndConfirm} className="space-y-6">
      {/* Step Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
        <div>
          <span className="text-xs font-bold text-blue-900 tracking-wider uppercase">Final Step 5</span>
          <h2 className="text-xl font-bold text-slate-900 mt-0.5">Pay & Verify Email OTP</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Security verification and instant electronic ticket issuance
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono font-bold text-blue-950 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg">
          <Lock className="w-3.5 h-3.5" />
          <span>Amount: {formattedTotal} (${draft.fareBreakdown.totalAmount.toFixed(2)} USD)</span>
        </div>
      </div>

      {error && (
        <div
          className={`flex items-start gap-2.5 p-3.5 rounded-xl border text-xs leading-relaxed ${
            error.includes('Resend Free Sandbox')
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}
        >
          <AlertCircle
            className={`w-4 h-4 shrink-0 mt-0.5 ${
              error.includes('Resend Free Sandbox') ? 'text-amber-600' : 'text-rose-500'
            }`}
          />
          <div>
            <div className="font-bold">
              {error.includes('Resend Free Sandbox') ? 'Resend Free Sandbox Notice' : 'Verification Issue'}
            </div>
            <div className="mt-0.5">{error}</div>
          </div>
        </div>
      )}

      {simulatedNotice && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-blue-700" />
          <span>{simulatedNotice}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN: PAYMENT METHOD */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <CreditCard className="w-4 h-4 text-blue-900" />
              <span>1. Payment Details (Simulated Gateway)</span>
            </div>
            <span className="text-[10px] text-amber-800 font-bold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
              Simulated Processing
            </span>
          </div>

          {/* Payment Method Selector */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setPaymentMethod('card')}
              className={`p-3 rounded-xl border text-left transition-all ${
                paymentMethod === 'card'
                  ? 'bg-blue-50 border-blue-600 text-blue-950 font-bold shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="text-xs">Credit/Debit</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Visa / MC / Amex</div>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('aeropay')}
              className={`p-3 rounded-xl border text-left transition-all ${
                paymentMethod === 'aeropay'
                  ? 'bg-blue-50 border-blue-600 text-blue-950 font-bold shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="text-xs">AeroPay</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Flight Wallet</div>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('wire')}
              className={`p-3 rounded-xl border text-left transition-all ${
                paymentMethod === 'wire'
                  ? 'bg-blue-50 border-blue-600 text-blue-950 font-bold shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="text-xs">Bank Wire</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Direct Transfer</div>
            </button>
          </div>

          {paymentMethod === 'card' && (
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Name on Card</label>
                <input
                  type="text"
                  required
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="e.g. Elena Rostova"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-700 focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Card Number</label>
                <div className="relative">
                  <CreditCard className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    maxLength={19}
                    value={cardNumber}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
                      setCardNumber(v);
                    }}
                    placeholder="4242 4242 4242 4242"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3.5 py-2 text-sm text-slate-900 font-mono focus:outline-none focus:border-blue-700 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Expiry Date</label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    placeholder="MM/YY"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 font-mono focus:outline-none focus:border-blue-700 focus:bg-white transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">CVV / CVC</label>
                  <input
                    type="password"
                    required
                    maxLength={4}
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, ''))}
                    placeholder="123"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 font-mono focus:outline-none focus:border-blue-700 focus:bg-white transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

          {paymentMethod === 'aeropay' && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
              <p>
                AeroPay Flight Wallet will authorize <strong>${draft.fareBreakdown.totalAmount.toFixed(2)} USD</strong> ({formattedTotal}) directly upon OTP validation.
              </p>
              <div className="flex items-center gap-2 text-emerald-700 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Wallet Connected • Zero transaction fee</span>
              </div>
            </div>
          )}

          {paymentMethod === 'wire' && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
              <p>Direct electronic bank settlement through SWIFT/ACH network.</p>
              <p className="text-slate-500">Guaranteed instant airline ticket reservation lock.</p>
            </div>
          )}

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>256-bit TLS encrypted transaction. Payment is securely processed upon OTP verification.</span>
          </div>
        </div>

        {/* RIGHT COLUMN: EMAIL OTP SECURITY VERIFICATION */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-sm font-bold text-slate-900">
            <Mail className="w-4 h-4 text-blue-900" />
            <span>2. Mandatory Customer Email Verification</span>
          </div>

          <div className="text-xs text-slate-600 leading-relaxed">
            To prevent fraud and guarantee delivery of your official Electronic Ticket, a 6-digit code was dispatched exclusively to:
            <div className="font-bold text-blue-950 font-mono text-sm mt-1.5 p-2.5 rounded-lg bg-blue-50 border border-blue-200">
              {draft.contactEmail}
            </div>
          </div>

          {simulatedNotice && (
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center gap-2 animate-in fade-in">
              <Mail className="w-4 h-4 text-blue-700 shrink-0" />
              <span className="text-[11px] font-medium leading-relaxed">{simulatedNotice}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 text-center">
              Enter 6-Digit Verification Code
            </label>
            <div className="relative">
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full tracking-[8px] text-center text-2xl font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl py-3 text-blue-950 placeholder-slate-400 focus:outline-none focus:border-blue-700 focus:bg-white transition-colors"
              />
              {otpVerified && (
                <div className="absolute right-3.5 top-3.5 text-emerald-600">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 mt-2.5">
              <span>
                Expires in:{' '}
                <strong className="text-slate-800">
                  {Math.floor(expirySeconds / 60)}:{(expirySeconds % 60).toString().padStart(2, '0')}
                </strong>
              </span>
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={cooldown > 0 || loading}
                className="text-blue-900 hover:text-blue-700 font-bold disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
              </button>
            </div>
          </div>

          {/* Security rules list */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5">
            <div className="font-bold text-slate-800 mb-1">AeroWings Email OTP Rules:</div>
            <div>✓ Valid for 5 minutes with single-use token consumption</div>
            <div>✓ Rate-limited with 60-second cooldown protection</div>
            <div>✓ Dispatched exclusively to customer's contact email</div>
            <div>✓ Confirmed booking email will be sent automatically via Resend</div>
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
          <span>Back to Booking Review</span>
        </button>

        <button
          type="submit"
          disabled={loading || otpCode.length !== 6}
          className="flex items-center gap-2 py-3 px-8 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-xs text-sm"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Processing Payment & Issuing Ticket...</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" />
              <span>Authorize & Confirm Booking ({formattedTotal})</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
