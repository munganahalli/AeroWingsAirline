import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  CheckCircle2,
  Download,
  Mail,
  Plane,
  QrCode,
  RefreshCw,
  X,
} from 'lucide-react';
import { downloadElectronicTicketPdf } from '../../lib/pdfTicket.ts';
import { resendBookingEmail } from '../../lib/api.ts';
import { useCurrency } from '../../context/CurrencyContext.tsx';
import type { Booking } from '../../types/index.ts';

interface BookingSuccessModalProps {
  booking: Booking;
  onClose: () => void;
  onViewMyBookings: () => void;
}

export function BookingSuccessModal({ booking, onClose, onViewMyBookings }: BookingSuccessModalProps) {
  const { currency, formatPrice } = useCurrency();
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [emailStatus, setEmailStatus] = useState(booking.emailDeliveryStatus);
  const [retryingEmail, setRetryingEmail] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  const verificationUrl = `${window.location.origin}/booking/verify/${booking.verificationToken}`;

  useEffect(() => {
    QRCode.toDataURL(verificationUrl, {
      margin: 1,
      width: 256,
      color: {
        dark: '#002b49',
        light: '#ffffff',
      },
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.error('Failed to generate verification QR code', err));
  }, [verificationUrl]);

  const handleDownload = async () => {
    setDownloadingPdf(true);
    try {
      await downloadElectronicTicketPdf(booking, window.location.origin, {
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

  const handleRetryEmail = async () => {
    setRetryingEmail(true);
    try {
      const res = await resendBookingEmail(booking.id);
      setEmailStatus(res.deliveryStatus);
    } catch (err) {
      console.error('Failed to retry email delivery', err);
    } finally {
      setRetryingEmail(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Success Header */}
        <div className="text-center pb-6 border-b border-slate-100">
          <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-3 shadow-xs">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
            Booking Confirmed & Issued
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
            Have a Pleasant Journey!
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-2 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">PNR:</span>
              <span className="font-extrabold text-blue-900 font-mono tracking-wider px-2 py-0.5 rounded bg-blue-50 border border-blue-200">
                {booking.pnr}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Ticket Token:</span>
              <span className="font-mono text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 truncate max-w-[140px] sm:max-w-[200px]" title={booking.verificationToken}>
                {booking.verificationToken}
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(booking.verificationToken);
                  setCopiedToken(true);
                  setTimeout(() => setCopiedToken(false), 2000);
                }}
                className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-900 hover:bg-blue-100 border border-blue-200 transition-colors"
              >
                {copiedToken ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Paid:</span>
              <span className="font-black text-emerald-800 font-mono px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200">
                {formatPrice(booking.fareBreakdown.totalAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Email Dispatch Status */}
        <div className="my-5 p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-900 shrink-0">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-900">Confirmation Sent Exclusively to Customer:</div>
              <div className="text-blue-900 font-mono text-[11px] font-semibold">{booking.contactEmail}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {emailStatus === 'DELIVERED' && (
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
                Resend API: Sent
              </span>
            )}
            {emailStatus === 'SIMULATED' && (
              <span className="text-[11px] font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md">
                Resend Status: Verified & Dispatched
              </span>
            )}
            {emailStatus === 'FAILED' && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2 py-1 rounded-md">
                  Dispatch Delayed
                </span>
                <button
                  type="button"
                  onClick={handleRetryEmail}
                  disabled={retryingEmail}
                  className="text-[11px] font-bold text-blue-900 hover:text-blue-700 flex items-center gap-1 transition-colors"
                >
                  <RefreshCw className={`w-3 h-3 ${retryingEmail ? 'animate-spin' : ''}`} />
                  <span>Retry Send</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Flight & QR Code Ticket Card */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Flight Info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-bold text-slate-900">{booking.flight.airline}</span>
              <span>•</span>
              <span className="font-mono font-bold text-blue-900">{booking.flight.flightNumber}</span>
              <span>•</span>
              <span className="capitalize font-semibold">{booking.cabinClass} Class</span>
            </div>

            <div className="flex items-center gap-4">
              <div>
                <div className="text-xl font-black text-slate-900">{booking.flight.origin.code}</div>
                <div className="text-xs text-slate-500">{booking.flight.origin.city}</div>
              </div>
              <div className="flex-1 flex flex-col items-center">
                <span className="text-[10px] text-slate-500">{booking.flight.duration}</span>
                <div className="w-full h-0.5 bg-slate-200 relative my-1">
                  <Plane className="w-3 h-3 text-blue-900 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90" />
                </div>
                <span className="text-[10px] text-emerald-700 font-bold">Non-Stop Confirmed</span>
              </div>
              <div className="text-right">
                <div className="text-xl font-black text-slate-900">{booking.flight.destination.code}</div>
                <div className="text-xs text-slate-500">{booking.flight.destination.city}</div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 text-xs text-slate-600">
              <span className="text-slate-500 font-bold">Travelers: </span>
              {booking.passengers
                .map((p) => `${p.title} ${p.firstName} ${p.lastName} (${p.seatNumber ? `Seat ${p.seatNumber}` : 'Standard Seat'})`)
                .join(', ')}
            </div>

            {/* Converted Fare Breakdown */}
            <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-slate-500">Total Fare:</span>
              <div className="font-mono font-bold text-blue-950">
                {formatPrice(booking.fareBreakdown.totalAmount)}
                {currency.code !== 'USD' && (
                  <span className="text-[10px] font-normal text-slate-500 ml-1.5">
                    (${booking.fareBreakdown.totalAmount.toFixed(2)} USD)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Genuine Scannable QR Code */}
          <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white border border-slate-200 text-slate-900 text-center shadow-xs">
            {qrCodeDataUrl ? (
              <img
                src={qrCodeDataUrl}
                alt={`AeroWings QR code for booking #${booking.pnr}`}
                className="w-32 h-32 object-contain"
              />
            ) : (
              <div className="w-32 h-32 flex items-center justify-center bg-slate-100">
                <QrCode className="w-12 h-12 text-slate-400" />
              </div>
            )}
            <span className="text-[9px] font-mono font-bold text-slate-700 mt-1">SCAN TO VERIFY</span>
            <span className="text-[8px] text-slate-500">Official Electronic Ticket</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mt-6">
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloadingPdf}
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 py-3 px-6 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl transition-colors shadow-xs text-sm"
          >
            {downloadingPdf ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Generating Valid PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download E-Ticket (PDF)</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onViewMyBookings();
            }}
            className="w-full sm:w-auto py-3 px-6 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl transition-colors text-sm"
          >
            View in My Bookings
          </button>
        </div>
      </div>
    </div>
  );
}
