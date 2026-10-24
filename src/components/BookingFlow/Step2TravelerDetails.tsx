import React, { useState } from 'react';
import { AlertCircle, ArrowLeft, ArrowRight, Luggage, Mail, Phone, Plus, Trash2, User } from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext.tsx';
import type { CabinClass, Flight, Passenger } from '../../types/index.ts';

interface Step2Props {
  passengers: Passenger[];
  contactEmail: string;
  contactPhone: string;
  cabinClass: CabinClass;
  flight: Flight | null;
  onUpdatePassengers: (passengers: Passenger[]) => void;
  onUpdateContact: (email: string, phone: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const BAGGAGE_OPTIONS = [
  { id: 'none', title: 'None (Standard Included Only)', weight: 0, feeUSD: 0 },
  { id: 'bag_extra_15kg', title: 'Additional Checked Bag (up to 15 kg)', weight: 15, feeUSD: 35 },
  { id: 'bag_extra_23kg', title: 'Standard International Extra Bag (up to 23 kg)', weight: 23, feeUSD: 50 },
  { id: 'bag_extra_32kg', title: 'Heavy Weight Bag Upgrade (up to 32 kg)', weight: 32, feeUSD: 75 },
  { id: 'bag_sports_gear', title: 'Specialty Sporting Equipment / Musical Gear', weight: 25, feeUSD: 45 },
];

export function Step2TravelerDetails({
  passengers,
  contactEmail,
  contactPhone,
  cabinClass,
  flight,
  onUpdatePassengers,
  onUpdateContact,
  onNext,
  onBack,
}: Step2Props) {
  const { formatPrice, currency } = useCurrency();
  const [error, setError] = useState<string | null>(null);

  const isDomestic =
    flight?.origin.country?.toLowerCase() === 'india' &&
    flight?.destination.country?.toLowerCase() === 'india';

  const defaultCabinText =
    cabinClass === 'first'
      ? '2 Cabin Bags (18 kg) + Personal Item'
      : cabinClass === 'business'
      ? '2 Cabin Bags (14 kg) + Personal Item'
      : cabinClass === 'premiumEconomy'
      ? '1 Cabin Bag (10 kg) + Personal Item'
      : '1 Cabin Bag (7 kg) + Personal Item';

  const defaultCheckedText = isDomestic
    ? cabinClass === 'business'
      ? '35 kg (2 Pieces) Included'
      : cabinClass === 'premiumEconomy'
      ? '25 kg (1 Piece) Included'
      : '15 kg (1 Piece) Included'
    : cabinClass === 'first'
    ? '3x 32 kg (96 kg total) Included'
    : cabinClass === 'business'
    ? '2x 32 kg (64 kg total) Included'
    : cabinClass === 'premiumEconomy'
    ? '2x 23 kg (46 kg total) Included'
    : '23 kg (1 Piece) Included';

  const handlePassengerChange = (index: number, field: keyof Passenger, value: any) => {
    const updated = [...passengers];
    updated[index] = { ...updated[index], [field]: value };
    onUpdatePassengers(updated);
  };

  const handleBaggageChange = (index: number, optionId: string) => {
    const opt = BAGGAGE_OPTIONS.find((b) => b.id === optionId) || BAGGAGE_OPTIONS[0];
    const updated = [...passengers];
    updated[index] = {
      ...updated[index],
      baggage: {
        cabinAllowance: defaultCabinText,
        checkedAllowance: defaultCheckedText,
        extraOptionId: opt.id !== 'none' ? opt.id : undefined,
        extraOptionTitle: opt.id !== 'none' ? opt.title : undefined,
        extraWeightKg: opt.weight > 0 ? opt.weight : undefined,
        extraFeeUSD: opt.feeUSD > 0 ? opt.feeUSD : 0,
      },
    };
    onUpdatePassengers(updated);
  };

  const handleAddPassenger = () => {
    const newPax: Passenger = {
      id: 'pax_' + Math.random().toString(36).substring(2, 9),
      title: 'Mr',
      firstName: '',
      lastName: '',
      dateOfBirth: '1995-01-01',
      gender: 'male',
      passportNumber: '',
      nationality: 'United States',
      mealPreference: 'regular',
      baggage: {
        cabinAllowance: defaultCabinText,
        checkedAllowance: defaultCheckedText,
        extraFeeUSD: 0,
      },
    };
    onUpdatePassengers([...passengers, newPax]);
  };

  const handleRemovePassenger = (index: number) => {
    if (passengers.length <= 1) return;
    const updated = passengers.filter((_, i) => i !== index);
    onUpdatePassengers(updated);
  };

  const handleProceed = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate Contact Email
    if (!contactEmail || !contactEmail.includes('@') || !contactEmail.includes('.')) {
      setError(
        'Please provide a valid primary contact email address. Your 6-digit email OTP and electronic booking confirmation will be sent here.'
      );
      return;
    }

    // Validate each passenger
    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i];
      if (!p.firstName.trim() || !p.lastName.trim()) {
        setError(`Please enter the full legal name for Passenger #${i + 1} matching their travel identification.`);
        return;
      }
      if (!p.passportNumber.trim()) {
        setError(`Please enter the passport or official ID number for Passenger #${i + 1}.`);
        return;
      }
    }

    onNext();
  };

  return (
    <form onSubmit={handleProceed} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
        <div>
          <span className="text-xs font-bold text-blue-900 tracking-wider uppercase">Step 3 of 5</span>
          <h2 className="text-xl font-bold text-slate-900 mt-0.5">Traveler & Baggage Details</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Names must match official passport or government travel identification exactly
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddPassenger}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-lg text-xs font-bold transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Traveler</span>
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Primary Contact Information */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-xs">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-sm font-bold text-blue-900">
          <Mail className="w-4 h-4" />
          <span>Primary Contact & Booking Recipient (Dispatched Exclusively to You)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Contact Email Address <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={contactEmail}
                onChange={(e) => onUpdateContact(e.target.value, contactPhone)}
                placeholder="customer@domain.com"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-700 focus:bg-white transition-colors"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Your 6-digit email OTP and electronic booking confirmation will be sent directly to this address.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => onUpdateContact(contactEmail, e.target.value)}
                placeholder="+1 (555) 019-2834"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-700 focus:bg-white transition-colors"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              For operational flight schedule alerts and departure gate updates.
            </p>
          </div>
        </div>
      </div>

      {/* Passengers List with Baggage Selection */}
      <div className="space-y-4">
        {passengers.map((pax, index) => {
          const selectedOptionId = pax.baggage?.extraOptionId || 'none';
          return (
            <div key={pax.id} className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <User className="w-4 h-4 text-blue-900" />
                  <span>Passenger #{index + 1} ({index === 0 ? 'Primary Traveler' : 'Additional Traveler'})</span>
                </div>
                {passengers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemovePassenger(index)}
                    className="text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Title</label>
                  <select
                    value={pax.title}
                    onChange={(e) => handlePassengerChange(index, 'title', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-700 focus:bg-white"
                  >
                    <option value="Mr">Mr</option>
                    <option value="Mrs">Mrs</option>
                    <option value="Ms">Ms</option>
                    <option value="Dr">Dr</option>
                    <option value="Prof">Prof</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    First Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={pax.firstName}
                    onChange={(e) => handlePassengerChange(index, 'firstName', e.target.value)}
                    placeholder="e.g. Elena"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-700 focus:bg-white"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Last Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={pax.lastName}
                    onChange={(e) => handlePassengerChange(index, 'lastName', e.target.value)}
                    placeholder="e.g. Rostova"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-700 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    required
                    value={pax.dateOfBirth}
                    onChange={(e) => handlePassengerChange(index, 'dateOfBirth', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-700 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
                  <select
                    value={pax.gender}
                    onChange={(e) => handlePassengerChange(index, 'gender', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-700 focus:bg-white"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other / Non-Binary</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Passport / Travel ID <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={pax.passportNumber}
                    onChange={(e) => handlePassengerChange(index, 'passportNumber', e.target.value.toUpperCase())}
                    placeholder="e.g. A92830192"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 font-mono focus:outline-none focus:border-blue-700 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Meal Preference</label>
                  <select
                    value={pax.mealPreference}
                    onChange={(e) => handlePassengerChange(index, 'mealPreference', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-700 focus:bg-white"
                  >
                    <option value="regular">Standard Gourmet</option>
                    <option value="vegetarian">Vegetarian (Lacto-Ovo)</option>
                    <option value="vegan">Strict Vegan</option>
                    <option value="halal">Halal Certified</option>
                    <option value="kosher">Kosher</option>
                    <option value="diabetic">Diabetic Friendly</option>
                  </select>
                </div>
              </div>

              {/* BAGGAGE ALLOWANCE & EXTRA BAGGAGE SELECTION */}
              <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-200">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                    <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center text-blue-900">
                      <Luggage className="w-3.5 h-3.5" />
                    </div>
                    <span>Select Baggage for {pax.firstName || `Passenger #${index + 1}`}</span>
                  </div>
                  <div className="text-[11px] text-emerald-800 font-bold bg-emerald-100/70 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    Included: {defaultCheckedText}
                  </div>
                </div>

                {/* Complimentary Allowance Info */}
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-700">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-900">Complimentary Cabin:</span>
                    <span>{defaultCabinText}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-900">Complimentary Checked:</span>
                    <span className="text-emerald-700 font-bold">{defaultCheckedText}</span>
                  </div>
                </div>

                {/* Additional Baggage Selectable Cards */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                    Select Extra Baggage Option:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {BAGGAGE_OPTIONS.map((opt) => {
                      const isSelected = selectedOptionId === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleBaggageChange(index, opt.id)}
                          className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                            isSelected
                              ? 'bg-blue-900 text-white border-blue-950 shadow-xs ring-2 ring-blue-500/40'
                              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span
                                className={`text-[10px] font-bold uppercase tracking-wider ${
                                  isSelected ? 'text-blue-200' : 'text-slate-500'
                                }`}
                              >
                                {opt.weight > 0 ? `+${opt.weight} kg Piece` : 'Included'}
                              </span>
                              {isSelected && (
                                <span className="text-[9px] bg-blue-700 text-white px-1.5 py-0.2 rounded font-bold">
                                  Selected
                                </span>
                              )}
                            </div>
                            <div
                              className={`text-xs font-bold mt-0.5 leading-snug ${
                                isSelected ? 'text-white' : 'text-slate-900'
                              }`}
                            >
                              {opt.title}
                            </div>
                          </div>
                          <div className="pt-2 mt-2 border-t border-slate-200/40 flex items-center justify-between">
                            <span
                              className={`text-xs font-mono font-black ${
                                isSelected ? 'text-emerald-300' : 'text-blue-900'
                              }`}
                            >
                              {opt.feeUSD === 0 ? 'FREE' : `+${formatPrice(opt.feeUSD)}`}
                            </span>
                            {opt.feeUSD > 0 && currency.code !== 'USD' && (
                              <span
                                className={`text-[10px] font-mono ${
                                  isSelected ? 'text-blue-200' : 'text-slate-400'
                                }`}
                              >
                                (+${opt.feeUSD} USD)
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {pax.baggage?.extraFeeUSD && pax.baggage.extraFeeUSD > 0 ? (
                  <div className="p-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-950 text-xs font-medium flex items-center justify-between">
                    <span>
                      Selected: <strong>{pax.baggage.extraOptionTitle}</strong> (+{pax.baggage.extraWeightKg} kg)
                    </span>
                    <span className="font-mono font-bold text-blue-900">
                      +{formatPrice(pax.baggage.extraFeeUSD)} (+${pax.baggage.extraFeeUSD} USD)
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-slate-200">
        <button
          type="button"
          onClick={onBack}
          className="w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-5 border border-slate-300 hover:border-slate-400 text-slate-700 hover:text-slate-900 font-semibold rounded-xl transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Seat Selection</span>
        </button>

        <button
          type="submit"
          className="w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-6 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl transition-colors shadow-xs text-sm"
        >
          <span>Continue to Booking Confirmation</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
}
