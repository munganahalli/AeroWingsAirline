import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import type { Booking } from '../types/index.ts';

export interface PdfCurrencyInfo {
  code: string;
  symbol: string;
  rateFromUSD: number;
}

export async function generateElectronicTicketPdf(
  booking: Booking,
  appBaseUrl?: string,
  displayCurrency?: PdfCurrencyInfo
): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const baseUrl = appBaseUrl || window.location.origin;
  const verificationUrl = `${baseUrl}/booking/verify/${booking.verificationToken}`;
  const homepageUrl = `${baseUrl}/`;

  // Generate high-resolution QR Code for ticket verification
  let verificationQrDataUrl = '';
  try {
    verificationQrDataUrl = await QRCode.toDataURL(verificationUrl, {
      margin: 1,
      width: 256,
      color: {
        dark: '#002b49',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.error('Failed to generate verification QR code for PDF', err);
  }

  // Generate homepage QR Code
  let homepageQrDataUrl = '';
  try {
    homepageQrDataUrl = await QRCode.toDataURL(homepageUrl, {
      margin: 1,
      width: 180,
      color: {
        dark: '#334155',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.error('Failed to generate homepage QR code for PDF', err);
  }

  // --- BRAND HEADER ---
  // Deep navy banner
  doc.setFillColor(0, 43, 73); // #002b49 (classic AeroWings navy)
  doc.rect(0, 0, 210, 36, 'F');

  // Accent bar
  doc.setFillColor(2, 132, 199); // #0284c7 (AeroWings sky)
  doc.rect(0, 36, 210, 2, 'F');

  // Brand Name
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('AeroWings', 16, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(186, 230, 253);
  doc.text('ELECTRONIC FLIGHT TICKET / PASSENGER RECEIPT', 16, 26);

  // Status Badge in header
  doc.setFillColor(6, 95, 70); // emerald-800
  doc.roundedRect(144, 12, 50, 12, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('CONFIRMED TICKET', 148, 20);

  // --- BOOKING REFERENCE (PNR) CARD ---
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(16, 44, 178, 26, 3, 3, 'FD');

  const rate = displayCurrency?.rateFromUSD || 1;
  const currCode = (displayCurrency?.code || 'USD').toUpperCase();
  const safeSymbolMap: Record<string, string> = {
    USD: '$',
    EUR: 'EUR',
    GBP: 'GBP',
    INR: 'INR',
    AED: 'AED',
    JPY: 'JPY',
    CAD: 'CAD',
    AUD: 'AUD',
    SGD: 'SGD',
    CHF: 'CHF',
    CNY: 'CNY',
    SAR: 'SAR',
    QAR: 'QAR',
  };
  const safeCurrencyPrefix = safeSymbolMap[currCode] || currCode;
  const formatAmount = (usdVal: number) => {
    const val = (usdVal || 0) * rate;
    const formattedNum = val.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${safeCurrencyPrefix} ${formattedNum}`;
  };

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('BOOKING REFERENCE (PNR)', 22, 52);
  doc.text('ISSUE DATE', 85, 52);
  doc.text(`TOTAL PAID (${currCode})`, 135, 52);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(0, 43, 73);
  doc.text(booking.pnr, 22, 62);

  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  const issueDate = booking.confirmedAt
    ? new Date(booking.confirmedAt).toLocaleDateString()
    : new Date().toLocaleDateString();
  doc.text(issueDate, 85, 62);

  doc.setTextColor(22, 101, 52);
  doc.text(formatAmount(booking.fareBreakdown.totalAmount), 135, 62);

  // --- ROUTE & FLIGHT INFORMATION ---
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(16, 76, 178, 52, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(0, 43, 73);
  doc.text(booking.flight.origin.code, 24, 94);
  doc.text(booking.flight.destination.code, 100, 94);

  // Airplane flight route graphic
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.5);
  doc.line(50, 91, 92, 91);
  doc.setFontSize(8);
  doc.setTextColor(2, 132, 199);
  doc.text('NON-STOP', 61, 88);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`${booking.flight.origin.city} (${booking.flight.origin.name})`, 24, 101);
  doc.text(`${booking.flight.destination.city} (${booking.flight.destination.name})`, 100, 101);

  // Flight schedule row
  const depDate = new Date(booking.flight.departureTime).toUTCString().replace('GMT', 'UTC');
  const arrDate = new Date(booking.flight.arrivalTime).toUTCString().replace('GMT', 'UTC');

  doc.setDrawColor(241, 245, 249);
  doc.line(24, 106, 186, 106);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('FLIGHT', 24, 113);
  doc.text('AIRCRAFT', 58, 113);
  doc.text('CABIN CLASS', 98, 113);
  doc.text('TERMINAL / GATE', 145, 113);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(booking.flight.flightNumber, 24, 120);
  doc.text(booking.flight.aircraft, 58, 120);
  doc.text(booking.cabinClass.toUpperCase(), 98, 120);
  doc.text(`T${booking.flight.origin.terminal || '1'} / Gate ${booking.flight.gate || 'TBD'}`, 145, 120);

  // Departure & Arrival times
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Departure: ${depDate}`, 24, 125);
  doc.text(`Arrival: ${arrDate}`, 100, 125);

  // --- PASSENGER & SEAT ASSIGNMENTS ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(0, 43, 73);
  doc.text('PASSENGER DETAILS & ASSIGNED SEATS', 16, 136);

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.rect(16, 140, 178, 8, 'FD');

  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('#', 20, 145);
  doc.text('PASSENGER NAME', 28, 145);
  doc.text('NATIONALITY', 88, 145);
  doc.text('PASSPORT / ID', 124, 145);
  doc.text('SEAT', 162, 145);
  doc.text('MEAL', 178, 145);

  let paxY = 153;
  booking.passengers.forEach((pax, index) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(`${index + 1}`, 20, paxY);

    doc.setFont('helvetica', 'bold');
    doc.text(`${pax.title} ${pax.firstName} ${pax.lastName}`, 28, paxY);

    doc.setFont('helvetica', 'normal');
    doc.text(pax.nationality || 'Unspecified', 88, paxY);
    doc.text(pax.passportNumber || 'N/A', 124, paxY);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 43, 73);
    doc.text(pax.seatNumber || 'Standard', 162, paxY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(pax.mealPreference || 'Regular', 178, paxY);

    doc.setDrawColor(241, 245, 249);
    doc.line(16, paxY + 3, 194, paxY + 3);
    paxY += 8;
  });

  // --- FARE BREAKDOWN & VERIFICATION QR CARD ---
  const lowerY = Math.max(paxY + 6, 185);

  // Fare Breakdown Box (Left)
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(16, lowerY, 110, 52, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(0, 43, 73);
  doc.text('Fare Breakdown', 22, lowerY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Base Airfare:', 22, lowerY + 16);
  doc.text(formatAmount(booking.fareBreakdown.baseFare), 78, lowerY + 16);

  doc.text('Airport Taxes & Fees:', 22, lowerY + 23);
  doc.text(formatAmount(booking.fareBreakdown.taxesAndFees), 78, lowerY + 23);

  doc.text('Seat Selection Fees:', 22, lowerY + 28);
  doc.text(formatAmount(booking.fareBreakdown.seatSelectionFee), 78, lowerY + 28);

  const hasExtraBag = booking.fareBreakdown.baggageFee && booking.fareBreakdown.baggageFee > 0;
  if (hasExtraBag) {
    doc.text('Extra Baggage Fees:', 22, lowerY + 34);
    doc.text(formatAmount(booking.fareBreakdown.baggageFee || 0), 78, lowerY + 34);
    doc.setDrawColor(226, 232, 240);
    doc.line(22, lowerY + 37, 116, lowerY + 37);
  } else {
    doc.setDrawColor(226, 232, 240);
    doc.line(22, lowerY + 33, 116, lowerY + 33);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(0, 43, 73);
  doc.text(`Total Paid (${currCode}):`, 22, lowerY + 42);
  doc.text(formatAmount(booking.fareBreakdown.totalAmount), 78, lowerY + 42);

  if (currCode !== 'USD') {
    doc.setTextColor(2, 132, 199);
    doc.setFontSize(7.5);
    doc.text(`Base Reference: $${booking.fareBreakdown.totalAmount.toFixed(2)} USD (1 USD = ${rate} ${currCode})`, 22, lowerY + 46.5);
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text(`Payment Method: ${booking.paymentMethod}`, 22, lowerY + 50);
  } else {
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text(`Payment Method: ${booking.paymentMethod}`, 22, lowerY + 48);
  }

  // Booking Verification QR Box (Right)
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(130, lowerY, 64, 52, 3, 3, 'FD');

  if (verificationQrDataUrl) {
    doc.addImage(verificationQrDataUrl, 'PNG', 147, lowerY + 3, 30, 30);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(0, 43, 73);
  doc.text('SCAN TO VERIFY TICKET', 136, lowerY + 37);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Live Airline Database Validation', 135, lowerY + 41);
  doc.text('No passwords or OTPs embedded', 135, lowerY + 45);
  doc.text(`Token: ${booking.verificationToken.substring(0, 12)}...`, 135, lowerY + 49);

  // --- SECURITY & AIRPORT INSTRUCTIONS ---
  const noticeY = lowerY + 57;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(16, noticeY, 178, 26, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(0, 43, 73);
  doc.text('IMPORTANT PASSENGER INSTRUCTIONS', 20, noticeY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(
    '1. Present this valid PDF Electronic Flight Ticket and matching Government photo ID/Passport at airport check-in.',
    20,
    noticeY + 11
  );
  const bagAllowanceMsg = booking.baggageDetails?.checkedAllowanceSummary
    ? `Baggage: ${booking.baggageDetails.cabinAllowanceSummary} | ${booking.baggageDetails.checkedAllowanceSummary}`
    : 'Baggage: 1 Cabin Bag (7kg) + Checked baggage included';
  doc.text(
    `2. ${bagAllowanceMsg}. Airport bag drop closes 60m prior, gate closes 20m prior.`,
    20,
    noticeY + 15
  );
  doc.text(`3. Official Ticket Verification Link: ${verificationUrl}`, 20, noticeY + 19);
  doc.text(
    '4. AeroWings Website: ' +
      homepageUrl +
      ' | Customer Support & Assistance: bookings@aerowings.com',
    20,
    noticeY + 23
  );

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `© ${new Date().getFullYear()} AeroWings Airlines Ltd. Verifiable digital document ID: ${booking.verificationToken}`,
    16,
    288
  );

  return doc;
}

export async function downloadElectronicTicketPdf(
  booking: Booking,
  appBaseUrl?: string,
  displayCurrency?: PdfCurrencyInfo
) {
  const doc = await generateElectronicTicketPdf(booking, appBaseUrl, displayCurrency);
  doc.save(`AeroWings_Ticket_${booking.pnr}.pdf`);
}
