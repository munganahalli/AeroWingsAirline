import fs from 'fs';
import dotenv from 'dotenv';
import type { Booking, EmailLog } from './types.ts';
import { emailLogsStore, saveStoreToDisk } from './db.ts';

export interface SendEmailResult {
  success: boolean;
  status: 'SENT' | 'SIMULATED' | 'FAILED';
  resendId?: string;
  error?: string;
  simulatedCode?: string;
  isDomainRestriction?: boolean;
  guidance?: string;
}

export const getResendConfig = () => {
  let apiKey = (process.env.RESEND_API_KEY || '').trim();
  let fromEmail = (process.env.RESEND_FROM_EMAIL || '').trim();

  // Dynamically load from .env file to support runtime updates without needing a server restart
  if (fs.existsSync('.env')) {
    try {
      const parsed = dotenv.parse(fs.readFileSync('.env', 'utf-8'));
      if (parsed.RESEND_API_KEY !== undefined && parsed.RESEND_API_KEY.trim() !== '') {
        apiKey = parsed.RESEND_API_KEY.trim();
        process.env.RESEND_API_KEY = apiKey;
      }
      if (parsed.RESEND_FROM_EMAIL !== undefined && parsed.RESEND_FROM_EMAIL.trim() !== '') {
        fromEmail = parsed.RESEND_FROM_EMAIL.trim();
        process.env.RESEND_FROM_EMAIL = fromEmail;
      }
    } catch {
      // ignore parse issues
    }
  }

  // Ensure default authorized sandbox sender if not specified
  if (!fromEmail) {
    fromEmail = 'AeroWings <onboarding@resend.dev>';
  }

  return { apiKey, fromEmail };
};

// Check if recipient is a documented Resend test address
export function isResendTestRecipient(email: string): boolean {
  const clean = email.trim().toLowerCase();
  return (
    clean === 'delivered@resend.dev' ||
    clean === 'bounced@resend.dev' ||
    clean === 'complained@resend.dev'
  );
}

// Resend provider error detector & categorization
export function parseResendError(errorMsg: string, status?: number): {
  isRestriction: boolean;
  userFriendlyMessage: string;
} {
  const lower = (errorMsg || '').toLowerCase();

  // 1. Invalid or missing API key (HTTP 401)
  if (status === 401 || lower.includes('api key is invalid') || lower.includes('unauthorized') || lower.includes('invalid api key')) {
    return {
      isRestriction: false,
      userFriendlyMessage:
        'Resend API Key Error: The configured RESEND_API_KEY is invalid, revoked, or unauthorized. Please verify your API key in .env (starts with re_).',
    };
  }

  // 2. Domain / Sandbox testing restriction (HTTP 403 / 422 with testing restriction message)
  const isRestriction =
    lower.includes('only send testing emails') ||
    lower.includes('not verified') ||
    lower.includes('verify your domain') ||
    lower.includes('sandbox') ||
    status === 403 ||
    (status === 422 && (lower.includes('domain') || lower.includes('from')));

  if (isRestriction) {
    return {
      isRestriction: true,
      userFriendlyMessage:
        'Resend Sandbox Restriction: The default sender (onboarding@resend.dev) can only send live emails to your verified Resend account owner email or delivered@resend.dev. Real delivery to customer inboxes requires adding and verifying your custom domain in Resend (resend.com/domains) and configuring RESEND_FROM_EMAIL with that domain.',
    };
  }

  // 3. Rate limiting (HTTP 429)
  if (status === 429 || lower.includes('rate limit')) {
    return {
      isRestriction: false,
      userFriendlyMessage:
        'Resend Rate Limit Exceeded: Free tier permits a maximum of 2 requests per second. Please wait a moment and try again.',
    };
  }

  return {
    isRestriction: false,
    userFriendlyMessage: errorMsg || 'Email delivery failed through Resend provider.',
  };
}

export function renderOtpEmailHtml(
  otpCode: string,
  cleanToEmail: string,
  purpose: 'REGISTRATION' | 'LOGIN' | 'PASSWORD_RESET' | 'BOOKING_VERIFY'
): { subject: string; html: string } {
  const purposeLabels: Record<string, string> = {
    REGISTRATION: 'Account Registration Verification',
    LOGIN: 'Sign In Verification',
    PASSWORD_RESET: 'Password Reset Verification',
    BOOKING_VERIFY: 'Booking Payment & Passenger Verification',
  };

  const subject = `AeroWings Verification Code: ${otpCode} [${purposeLabels[purpose] || 'Verification'}]`;

  const html = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; color: #1e293b; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      <div style="background: #002b49; padding: 28px 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">AeroWings</h1>
        <p style="margin: 4px 0 0; font-size: 13px; color: #bae6fd; letter-spacing: 1px;">PREMIER GLOBAL AIRLINES</p>
      </div>
      <div style="padding: 32px 28px; background: #ffffff;">
        <h2 style="margin: 0 0 12px; font-size: 18px; color: #0f172a; font-weight: 700;">${purposeLabels[purpose] || 'Email Verification'}</h2>
        <p style="margin: 0 0 20px; color: #475569; font-size: 14px; line-height: 1.6;">
          Please use the following 6-digit one-time verification code to proceed. This security code is valid for <strong>5 minutes</strong>.
        </p>
        <div style="background: #f8fafc; border: 2px dashed #0284c7; border-radius: 10px; padding: 22px; text-align: center; margin-bottom: 24px;">
          <span style="font-size: 34px; font-weight: 800; letter-spacing: 10px; color: #002b49; font-family: monospace;">${otpCode}</span>
        </div>
        <p style="margin: 0 0 16px; font-size: 12px; color: #64748b; line-height: 1.5;">
          • This OTP is strictly valid for single use only.<br/>
          • Dispatched directly to: <strong>${cleanToEmail}</strong><br/>
          • AeroWings customer service will never ask for your verification code.<br/>
          • If you did not initiate this request, you can safely disregard this email.
        </p>
      </div>
      <div style="padding: 16px 24px; background: #f8fafc; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
        © ${new Date().getFullYear()} AeroWings Airlines Ltd. Official Passenger Reservations.
      </div>
    </div>
  `;

  return { subject, html };
}

export async function sendOtpEmail(
  toEmail: string,
  otpCode: string,
  purpose: 'REGISTRATION' | 'LOGIN' | 'PASSWORD_RESET' | 'BOOKING_VERIFY'
): Promise<SendEmailResult> {
  const cleanToEmail = toEmail.trim().toLowerCase();
  const { apiKey, fromEmail } = getResendConfig();
  const { subject, html } = renderOtpEmailHtml(otpCode, cleanToEmail, purpose);

  const isTestAddress = isResendTestRecipient(cleanToEmail);
  const isKeyConfigured = Boolean(apiKey && !apiKey.includes('1234567890abcdef') && apiKey.startsWith('re_'));

  // Secure server logging without exposing secret code or full private customer email
  const maskedEmail = cleanToEmail.replace(/^(.)(.*)(@.*)$/, (_, a, b, c) => `${a}***${c}`);
  console.log(`[AeroWings Email Service] Attempting OTP dispatch to recipient: ${maskedEmail} (Purpose: ${purpose}, Configured: ${isKeyConfigured})`);

  if (!isKeyConfigured) {
    const errorMsg = 'RESEND_API_KEY is not configured in server environment (.env). Simulated delivery mode enabled.';
    logEmail({
      to: cleanToEmail,
      subject,
      type: 'OTP',
      status: 'SIMULATED',
      errorMessage: errorMsg,
    });
    console.log(`[AeroWings Email Service] (Dev Simulation) Dispatched OTP to ${maskedEmail}: ${otpCode}`);
    return {
      success: true,
      status: 'SIMULATED',
      simulatedCode: otpCode,
    };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [cleanToEmail],
        subject: isTestAddress ? `[Resend Sandbox Test] ${subject}` : subject,
        html,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (response.ok && data?.id) {
      logEmail({
        to: cleanToEmail,
        subject: isTestAddress ? `[Resend Test] ${subject}` : subject,
        type: 'OTP',
        status: 'SENT',
        resendId: data.id,
      });
      return { success: true, status: 'SENT', resendId: data.id };
    } else {
      const rawError = data?.message || `Resend HTTP error ${response.status}`;
      const { isRestriction, userFriendlyMessage } = parseResendError(rawError, response.status);

      // Secure logging: NEVER record the secret OTP code in error logs!
      logEmail({
        to: cleanToEmail,
        subject,
        type: 'OTP',
        status: 'FAILED',
        errorMessage: `[HTTP ${response.status}] ${rawError}`,
      });

      return {
        success: false,
        status: 'FAILED',
        error: userFriendlyMessage,
        isDomainRestriction: isRestriction,
        guidance: isRestriction
          ? 'Resend Sandbox Restriction: Default sender (onboarding@resend.dev) can only deliver to your verified Resend account owner email or delivered@resend.dev. To send to any customer email, verify your domain in Resend and update RESEND_FROM_EMAIL.'
          : undefined,
      };
    }
  } catch (err: any) {
    const errorMsg = err?.message || 'Network error calling Resend API';
    logEmail({
      to: cleanToEmail,
      subject,
      type: 'OTP',
      status: 'FAILED',
      errorMessage: `Network error: ${errorMsg}`,
    });
    return {
      success: false,
      status: 'FAILED',
      error: `Network error communicating with Resend: ${errorMsg}`,
    };
  }
}

export function renderBookingConfirmationEmailHtml(
  booking: Booking,
  appBaseUrl?: string
): { subject: string; html: string } {
  const passengerNames = booking.passengers
    .map((p) => `${p.title} ${p.firstName} ${p.lastName} (${p.seatNumber ? `Seat ${p.seatNumber}` : 'Standard Seat'})`)
    .join(', ');

  const baseUrl = appBaseUrl || process.env.APP_URL || 'http://localhost:3000';
  const verificationLink = `${baseUrl}/booking/verify/${booking.verificationToken}`;

  const subject = `Confirmed: AeroWings Flight Booking #${booking.pnr} - ${booking.flight.origin.code} to ${booking.flight.destination.code}`;

  const html = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 640px; margin: 0 auto; background: #ffffff; color: #0f172a; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 16px rgba(0,0,0,0.06);">
      <div style="background: #002b49; padding: 28px 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">AeroWings</h1>
        <p style="margin: 4px 0 0; font-size: 13px; color: #bae6fd; letter-spacing: 1px;">ELECTRONIC FLIGHT TICKET & BOOKING CONFIRMATION</p>
      </div>

      <div style="padding: 26px 28px; background: #ffffff;">
        <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <span style="font-size: 11px; color: #166534; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; display: block;">Booking Reference (PNR)</span>
            <span style="font-size: 24px; font-weight: 800; color: #002b49; letter-spacing: 2px;">${booking.pnr}</span>
          </div>
          <div style="text-align: right;">
            <span style="font-size: 12px; color: #15803d; font-weight: 700; background: #dcfce7; padding: 4px 10px; border-radius: 6px; text-transform: uppercase;">CONFIRMED</span>
          </div>
        </div>

        <h3 style="margin: 0 0 14px; font-size: 15px; color: #0f172a; font-weight: 700; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">Itinerary Details</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px;">
          <tr>
            <td style="padding: 6px 0; color: #64748b; width: 35%;">Flight Number</td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">${booking.flight.flightNumber} (${booking.flight.airline})</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Aircraft</td>
            <td style="padding: 6px 0; color: #0f172a;">${booking.flight.aircraft}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Routing</td>
            <td style="padding: 6px 0; color: #0284c7; font-weight: 700;">
              ${booking.flight.origin.city} (${booking.flight.origin.code}) → ${booking.flight.destination.city} (${booking.flight.destination.code})
            </td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Departure</td>
            <td style="padding: 6px 0; color: #0f172a;">${new Date(booking.flight.departureTime).toUTCString()} (Terminal ${booking.flight.origin.terminal || '1'})</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Arrival</td>
            <td style="padding: 6px 0; color: #0f172a;">${new Date(booking.flight.arrivalTime).toUTCString()} (Terminal ${booking.flight.destination.terminal || '2'})</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Cabin Class</td>
            <td style="padding: 6px 0; color: #0f172a; text-transform: capitalize; font-weight: 600;">${booking.cabinClass}</td>
          </tr>
        </table>

        <h3 style="margin: 0 0 12px; font-size: 15px; color: #0f172a; font-weight: 700; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">Passenger Manifest</h3>
        <p style="margin: 0 0 20px; font-size: 13px; color: #334155; line-height: 1.6;">${passengerNames}</p>

        <h3 style="margin: 0 0 12px; font-size: 15px; color: #0f172a; font-weight: 700; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">Fare Breakdown</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
          <tr>
            <td style="padding: 4px 0; color: #64748b;">Base Airfare</td>
            <td style="padding: 4px 0; color: #0f172a; text-align: right; font-mono: true;">$${booking.fareBreakdown.baseFare.toFixed(2)} USD</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #64748b;">Airport Taxes & Security Fees</td>
            <td style="padding: 4px 0; color: #0f172a; text-align: right; font-mono: true;">$${booking.fareBreakdown.taxesAndFees.toFixed(2)} USD</td>
          </tr>
          ${booking.fareBreakdown.seatSelectionFee > 0 ? `
          <tr>
            <td style="padding: 4px 0; color: #64748b;">Seat Selection Fee</td>
            <td style="padding: 4px 0; color: #0f172a; text-align: right; font-mono: true;">$${booking.fareBreakdown.seatSelectionFee.toFixed(2)} USD</td>
          </tr>` : ''}
          <tr style="border-top: 1px solid #cbd5e1; font-size: 14px; font-weight: 700;">
            <td style="padding: 10px 0; color: #002b49;">Total Paid (${booking.paymentMethod})</td>
            <td style="padding: 10px 0; color: #002b49; text-align: right;">$${booking.fareBreakdown.totalAmount.toFixed(2)} USD</td>
          </tr>
        </table>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; text-align: center; margin-top: 24px;">
          <p style="margin: 0 0 8px; font-size: 13px; color: #334155; font-weight: 600;">Verifiable Electronic Flight Ticket Link</p>
          <a href="${verificationLink}" style="display: inline-block; padding: 10px 20px; background: #002b49; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 12px; font-weight: bold;">
            View & Verify Official Ticket Online
          </a>
          <p style="margin: 8px 0 0; font-size: 11px; color: #94a3b8;">
            You can download your PDF ticket with its scannable QR code anytime from your AeroWings profile.
          </p>
        </div>
      </div>

      <div style="padding: 16px 24px; background: #f8fafc; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
        © ${new Date().getFullYear()} AeroWings Airlines. Customer Support: bookings@aerowings.com
      </div>
    </div>
  `;

  return { subject, html };
}

export async function sendBookingConfirmationEmail(booking: Booking, appBaseUrl?: string): Promise<SendEmailResult> {
  const { apiKey, fromEmail } = getResendConfig();
  const toEmail = booking.contactEmail.trim().toLowerCase();
  const { subject, html } = renderBookingConfirmationEmailHtml(booking, appBaseUrl);

  const isTestAddress = isResendTestRecipient(toEmail);
  const isKeyConfigured = Boolean(apiKey && !apiKey.includes('1234567890abcdef') && apiKey.startsWith('re_'));

  const maskedEmail = toEmail.replace(/^(.)(.*)(@.*)$/, (_, a, b, c) => `${a}***${c}`);
  console.log(`[AeroWings Email Service] Attempting booking confirmation dispatch to recipient: ${maskedEmail} (PNR: ${booking.pnr}, Configured: ${isKeyConfigured})`);

  if (!isKeyConfigured) {
    logEmail({
      to: toEmail,
      subject,
      type: 'BOOKING_CONFIRMATION',
      status: 'SIMULATED',
      errorMessage: 'RESEND_API_KEY is not configured in server environment (.env). Confirmation recorded to database.',
      pnr: booking.pnr,
    });
    console.log(`[AeroWings Email Service] (Dev Simulation) Confirmation recorded for PNR: ${booking.pnr}`);
    return {
      success: true,
      status: 'SIMULATED',
    };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        subject: isTestAddress ? `[Resend Sandbox Test] ${subject}` : subject,
        html,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (response.ok && data?.id) {
      logEmail({
        to: toEmail,
        subject: isTestAddress ? `[Resend Test] ${subject}` : subject,
        type: 'BOOKING_CONFIRMATION',
        status: 'SENT',
        resendId: data.id,
        pnr: booking.pnr,
      });
      return { success: true, status: 'SENT', resendId: data.id };
    } else {
      const rawError = data?.message || `Resend HTTP error ${response.status}`;
      const { isRestriction, userFriendlyMessage } = parseResendError(rawError, response.status);

      logEmail({
        to: toEmail,
        subject,
        type: 'BOOKING_CONFIRMATION',
        status: 'FAILED',
        errorMessage: `[HTTP ${response.status}] ${rawError}`,
        pnr: booking.pnr,
      });

      return {
        success: false,
        status: 'FAILED',
        error: userFriendlyMessage,
        isDomainRestriction: isRestriction,
        guidance: isRestriction
          ? 'Resend sandbox allows sending to your own registered email or delivered@resend.dev. To send to arbitrary customer emails, verify your domain in Resend.'
          : undefined,
      };
    }
  } catch (err: any) {
    const errorMsg = err?.message || 'Network error calling Resend';
    logEmail({
      to: toEmail,
      subject,
      type: 'BOOKING_CONFIRMATION',
      status: 'FAILED',
      errorMessage: errorMsg,
      pnr: booking.pnr,
    });
    return {
      success: false,
      status: 'FAILED',
      error: errorMsg,
    };
  }
}

export function renderCancellationEmailHtml(booking: Booking): { subject: string; html: string } {
  const subject = `Cancellation Confirmed: AeroWings Booking #${booking.pnr}`;

  const html = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; color: #1e293b; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
      <div style="background: #991b1b; padding: 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff;">AeroWings</h1>
        <p style="margin: 4px 0 0; font-size: 13px; color: #fecaca;">BOOKING CANCELLATION NOTICE</p>
      </div>
      <div style="padding: 24px 28px; background: #ffffff;">
        <h2 style="margin: 0 0 12px; font-size: 18px; color: #0f172a;">Your Booking Has Been Cancelled</h2>
        <p style="margin: 0 0 16px; color: #475569; font-size: 14px; line-height: 1.6;">
          Your flight reservation with PNR <strong>${booking.pnr}</strong> (${booking.flight.origin.code} → ${booking.flight.destination.code}) has been cancelled as requested.
        </p>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
          <p style="margin: 0 0 8px; font-size: 13px; color: #334155;"><strong>Reason:</strong> ${booking.cancellationReason || 'Customer requested online cancellation'}</p>
          <p style="margin: 0; font-size: 13px; color: #15803d; font-weight: 700;"><strong>Refund Initiated:</strong> $${(booking.refundAmount || booking.fareBreakdown.totalAmount * 0.9).toFixed(2)} USD</p>
        </div>
        <p style="margin: 0; font-size: 12px; color: #64748b;">
          Refunds are credited to the original payment method (${booking.paymentMethod}) within 5-7 business days.
        </p>
      </div>
      <div style="padding: 16px 24px; background: #f8fafc; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
        © ${new Date().getFullYear()} AeroWings Airlines Ltd.
      </div>
    </div>
  `;

  return { subject, html };
}

export async function sendCancellationEmail(booking: Booking): Promise<SendEmailResult> {
  const { apiKey, fromEmail } = getResendConfig();
  const toEmail = booking.contactEmail.trim().toLowerCase();
  const { subject, html } = renderCancellationEmailHtml(booking);

  const isTestAddress = isResendTestRecipient(toEmail);
  const isKeyConfigured = Boolean(apiKey && !apiKey.includes('1234567890abcdef') && apiKey.startsWith('re_'));

  if (!isKeyConfigured) {
    logEmail({
      to: toEmail,
      subject,
      type: 'BOOKING_CANCELLATION',
      status: 'SIMULATED',
      errorMessage: 'RESEND_API_KEY is not configured in server environment (.env). Cancellation recorded to database.',
      pnr: booking.pnr,
    });
    console.log(`[AeroWings Email Service] (Dev Simulation) Cancellation recorded for PNR: ${booking.pnr}`);
    return {
      success: true,
      status: 'SIMULATED',
    };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        subject: isTestAddress ? `[Resend Sandbox Test] ${subject}` : subject,
        html,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (response.ok && data?.id) {
      logEmail({
        to: toEmail,
        subject: isTestAddress ? `[Resend Test] ${subject}` : subject,
        type: 'BOOKING_CANCELLATION',
        status: 'SENT',
        resendId: data.id,
        pnr: booking.pnr,
      });
      return { success: true, status: 'SENT', resendId: data.id };
    } else {
      const rawError = data?.message || `Resend HTTP error ${response.status}`;
      const { isRestriction, userFriendlyMessage } = parseResendError(rawError, response.status);

      logEmail({
        to: toEmail,
        subject,
        type: 'BOOKING_CANCELLATION',
        status: 'FAILED',
        errorMessage: `[HTTP ${response.status}] ${rawError}`,
        pnr: booking.pnr,
      });

      return {
        success: false,
        status: 'FAILED',
        error: userFriendlyMessage,
        isDomainRestriction: isRestriction,
        guidance: isRestriction
          ? 'Resend sandbox allows sending to your own registered email or delivered@resend.dev. To send to arbitrary customer emails, verify your domain in Resend.'
          : undefined,
      };
    }
  } catch (err: any) {
    const errorMsg = err?.message || 'Network error calling Resend';
    logEmail({
      to: toEmail,
      subject,
      type: 'BOOKING_CANCELLATION',
      status: 'FAILED',
      errorMessage: errorMsg,
      pnr: booking.pnr,
    });
    return {
      success: false,
      status: 'FAILED',
      error: errorMsg,
    };
  }
}

function logEmail(log: Omit<EmailLog, 'id' | 'timestamp'>) {
  const record: EmailLog = {
    ...log,
    id: 'eml_' + Math.random().toString(36).substring(2, 10),
    timestamp: new Date().toISOString(),
  };
  emailLogsStore.unshift(record);
  if (emailLogsStore.length > 200) {
    emailLogsStore.pop();
  }
  saveStoreToDisk();
}
