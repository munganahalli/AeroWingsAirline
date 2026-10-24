import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  DollarSign,
  Download,
  Plane,
  QrCode,
  RefreshCw,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext.tsx';
import { verifyTicketToken } from '../lib/api.ts';
import { downloadElectronicTicketPdf } from '../lib/pdfTicket.ts';

interface VerificationPageProps {
  initialToken?: string;
  onNavigateHome: () => void;
}

export function VerificationPage({ initialToken, onNavigateHome }: VerificationPageProps) {
  const { formatPrice, currency } = useCurrency();
  const [tokenInput, setTokenInput] = useState(initialToken || '');
  const [loading, setLoading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifiedData, setVerifiedData] = useState<any | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  useEffect(() => {
    if (initialToken) {
      handleLookup(initialToken);
    }
  }, [initialToken]);

  useEffect(() => {
    if (verifiedData?.verificationToken) {
      const url = `${window.location.origin}/booking/verify/${verifiedData.verificationToken}`;
      QRCode.toDataURL(url, {
        margin: 1,
        width: 256,
        color: { dark: '#002b49', light: '#ffffff' },
      })
        .then((dataUrl) => setQrCodeDataUrl(dataUrl))
        .catch(() => {});
    }
  }, [verifiedData]);

  const handleLookup = async (tokenToVerify?: string) => {
    const input = (tokenToVerify || tokenInput).trim();
    if (!input) {
      setError('Please provide a valid electronic ticket verification token or Booking Reference (PNR).');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await verifyTicketToken(input);
      setVerifiedData(data);
    } catch (err: any) {
      setError(err.message || 'Ticket could not be verified in the AeroWings database.');
      setVerifiedData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!verifiedData) return;
    setDownloadingPdf(true);
    try {
      // Reconstruct booking object for PDF generator if rawBooking not directly present
      const bookingToPrint = verifiedData.rawBooking || {
        ...verifiedData,
        passengers: verifiedData.passengers.map((p: any, idx: number) => ({
          id: `pax_${idx + 1}`,
          title: 'Mr',
          firstName: p.name?.split(' ')[0] || 'Passenger',
          lastName: p.name?.split(' ').slice(1).join(' ') || '',
          dateOfBirth: '1995-01-01',
          gender: 'male',
          passportNumber: 'CONFIRMED',
          nationality: 'Global',
          seatNumber: p.seatNumber,
          mealPreference: 'Regular',
        })),
      };
      await downloadElectronicTicketPdf(bookingToPrint, window.location.origin, {
        code: currency.code,
        symbol: currency.symbol,
        rateFromUSD: currency.rateFromUSD,
      });
    } catch (err) {
      console.error('Failed to generate PDF', err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8 animate-in fade-in duration-200">
      {/* Page Title */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-bold text-blue-900 shadow-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
          <span>Official Airline Electronic Gate Validation</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Verify Flight Ticket
        </h1>
        <p className="text-sm text-slate-500 max-w-lg mx-auto">
          Scan the QR code printed on your AeroWings E-Ticket or enter your Booking Reference (PNR) or cryptographic ticket token below
        </p>
      </div>

      {/* Lookup Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLookup();
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <QrCode className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Enter PNR (e.g. AW-KL782) or Ticket Token"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-700 focus:bg-white transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl transition-colors disabled:opacity-50 text-sm shadow-xs"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>Validate Ticket</span>
          </button>
        </form>

        <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100 gap-2">
          <span>Quick validation samples:</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setTokenInput('AW-KL782');
                handleLookup('AW-KL782');
              }}
              className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 font-mono text-[11px] font-semibold text-blue-900 transition-colors"
            >
              PNR: AW-KL782
            </button>
            <button
              type="button"
              onClick={() => {
                setTokenInput('c0a8019b882f4d1e90ac128790ba45f129c7b91a');
                handleLookup('c0a8019b882f4d1e90ac128790ba45f129c7b91a');
              }}
              className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 font-mono text-[11px] font-semibold text-blue-900 transition-colors"
            >
              Token: c0a8019b...
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-xs animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-rose-900">Ticket Verification Unsuccessful</div>
            <div className="mt-0.5 leading-relaxed">{error}</div>
          </div>
        </div>
      )}

      {/* Verified Ticket Card */}
      {verifiedData && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-6 animate-in zoom-in-95 duration-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0 shadow-xs">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                  Cryptographically Validated
                </span>
                <h3 className="text-xl font-extrabold text-slate-900">Authentic AeroWings Ticket</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-blue-900 font-mono font-bold">PNR: {verifiedData.pnr}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:items-end gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                    verifiedData.bookingStatus === 'CONFIRMED'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {verifiedData.bookingStatus}
                </span>
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={downloadingPdf}
                  className="flex items-center gap-1.5 px-3 py-1 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-md text-xs transition-colors shadow-xs"
                >
                  {downloadingPdf ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span>Download PDF</span>
                </button>
              </div>
              <div className="text-[11px] text-slate-500">
                Issued: {verifiedData.confirmedAt ? new Date(verifiedData.confirmedAt).toLocaleDateString() : 'Active'}
              </div>
            </div>
          </div>

          {/* Cryptographic Token Reference */}
          {verifiedData.verificationToken && (
            <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
              <div className="truncate">
                <span className="font-bold text-blue-900 block text-[10px] uppercase tracking-wider">
                  Verification Security Token
                </span>
                <span className="font-mono font-bold text-slate-800 truncate block max-w-sm sm:max-w-md">
                  {verifiedData.verificationToken}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(verifiedData.verificationToken);
                  setCopiedToken(true);
                  setTimeout(() => setCopiedToken(false), 2000);
                }}
                className="flex items-center gap-1 px-2.5 py-1 bg-white border border-blue-300 text-blue-900 font-bold rounded-lg hover:bg-blue-100 transition-colors shrink-0 shadow-xs text-xs"
              >
                {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedToken ? 'Copied' : 'Copy Token'}</span>
              </button>
            </div>
          )}

          {/* Route Overview */}
          <div className="grid grid-cols-3 items-center gap-4 py-2">
            <div>
              <div className="text-3xl font-black text-slate-900">{verifiedData.origin.code}</div>
              <div className="text-xs font-bold text-blue-900">{verifiedData.origin.city}</div>
              <div className="text-[11px] text-slate-500">Terminal {verifiedData.origin.terminal || '1'}</div>
            </div>

            <div className="text-center">
              <div className="text-xs text-slate-600 font-bold mb-1">
                {verifiedData.flightNumber} ({verifiedData.airline})
              </div>
              <div className="relative my-2">
                <div className="h-0.5 bg-slate-200 w-full" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-blue-900">
                  <Plane className="w-4 h-4 rotate-90" />
                </div>
              </div>
              <span className="text-[11px] text-emerald-700 font-bold">Valid for Travel</span>
            </div>

            <div className="text-right">
              <div className="text-3xl font-black text-slate-900">{verifiedData.destination.code}</div>
              <div className="text-xs font-bold text-blue-900">{verifiedData.destination.city}</div>
              <div className="text-[11px] text-slate-500">Terminal {verifiedData.destination.terminal || '2'}</div>
            </div>
          </div>

          {/* Verified Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block">Cabin Class</span>
              <span className="font-bold text-slate-900 capitalize mt-0.5 block">{verifiedData.cabinClass}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block">Aircraft</span>
              <span className="font-bold text-slate-900 mt-0.5 block truncate">{verifiedData.aircraft}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block">Gate</span>
              <span className="font-bold text-blue-900 font-mono mt-0.5 block">{verifiedData.gate}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block">Seats</span>
              <span className="font-bold text-slate-900 font-mono mt-0.5 block">{verifiedData.seats?.join(', ')}</span>
            </div>
          </div>

          {/* Converted Ticket Fare Breakdown */}
          {verifiedData.fareBreakdown && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <span className="text-slate-700 font-bold block mb-1">
                Verified Fare & Payment Receipt ({currency.code}):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <span className="text-slate-500 block text-[11px]">Base Fare</span>
                  <span className="font-mono font-bold text-slate-800">
                    {formatPrice(verifiedData.fareBreakdown.baseFare)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Taxes & Fees</span>
                  <span className="font-mono font-bold text-slate-800">
                    {formatPrice(verifiedData.fareBreakdown.taxesAndFees)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Total Paid Amount</span>
                  <span className="font-mono font-black text-blue-950 text-sm">
                    {formatPrice(verifiedData.fareBreakdown.totalAmount)}
                  </span>
                  {currency.code !== 'USD' && (
                    <span className="text-[10px] text-slate-400 block">
                      (${verifiedData.fareBreakdown.totalAmount.toFixed(2)} USD)
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Baggage Details */}
          {verifiedData.baggageDetails && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <span className="font-bold text-slate-800 uppercase tracking-wide block">Baggage Allowances & Add-ons</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                <div>
                  <strong className="text-slate-900">Cabin Allowance: </strong>
                  {verifiedData.baggageDetails.cabinAllowanceSummary || '1 Cabin Bag Included'}
                </div>
                <div>
                  <strong className="text-slate-900">Checked Allowance: </strong>
                  {verifiedData.baggageDetails.checkedAllowanceSummary || 'Standard Baggage Included'}
                </div>
              </div>
              {verifiedData.fareBreakdown?.baggageFee && verifiedData.fareBreakdown.baggageFee > 0 && (
                <div className="text-blue-900 font-bold pt-1 border-t border-slate-200">
                  Prepaid Baggage Fee: {formatPrice(verifiedData.fareBreakdown.baggageFee)}
                </div>
              )}
            </div>
          )}

          {/* Authorized Traveler Manifest */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
            <span className="text-slate-700 font-bold block mb-1">
              Authorized Traveler Manifest ({verifiedData.passengerCount}):
            </span>
            <div className="flex flex-wrap gap-2">
              {verifiedData.passengers && verifiedData.passengers.length > 0 ? (
                verifiedData.passengers.map((p: any, idx: number) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded bg-white border border-slate-300 text-slate-800 font-bold font-mono text-[11px] shadow-xs"
                  >
                    {p.name} ({p.seatNumber})
                  </span>
                ))
              ) : (
                verifiedData.passengerInitials?.map((init: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded bg-white border border-slate-300 text-slate-800 font-bold font-mono text-[11px] shadow-xs"
                  >
                    {init}
                  </span>
                ))
              )}
            </div>
            <p className="text-[10px] text-slate-500 pt-2 border-t border-slate-200 mt-2">
              * Validated live against the authentic AeroWings operational database. Verified without transmitting passwords or customer credentials.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
