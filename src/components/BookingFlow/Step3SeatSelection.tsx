import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Info,
  Sparkles,
  User,
  Users,
} from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext.tsx';
import type { CabinClass, Passenger } from '../../types/index.ts';

interface Step3Props {
  cabinClass: CabinClass;
  passengers: Passenger[];
  selectedSeats: Record<string, string>; // passengerId -> seatNumber
  onSelectSeat: (passengerId: string, seatNumber: string, fee: number) => void;
  onNext: () => void;
  onBack: () => void;
}

interface SeatDef {
  number: string;
  row: number;
  col: string;
  isExtraLegroom?: boolean;
  fee: number;
  type: 'window' | 'aisle' | 'standard';
  isOccupied: boolean;
}

export function Step3SeatSelection({
  cabinClass,
  passengers,
  selectedSeats,
  onSelectSeat,
  onNext,
  onBack,
}: Step3Props) {
  const { formatPrice } = useCurrency();
  const [activePaxIndex, setActivePaxIndex] = useState<number>(0);
  const currentPax = passengers[activePaxIndex] || passengers[0];

  // Aircraft seat rows based on cabin class
  const rows =
    cabinClass === 'first' || cabinClass === 'business'
      ? [1, 2, 3, 4, 5]
      : cabinClass === 'premiumEconomy'
      ? [6, 7, 8, 9, 10, 11]
      : [12, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];

  const columns =
    cabinClass === 'first' || cabinClass === 'business'
      ? ['A', 'C', 'D', 'F']
      : ['A', 'B', 'C', 'D', 'E', 'F'];

  const occupiedSeats = new Set(['1A', '2D', '4C', '7B', '8C', '14A', '15F', '17C', '19D', '21B']);

  const getSeatDef = (row: number, col: string): SeatDef => {
    const number = `${row}${col}`;
    const isWindow = col === 'A' || col === 'F';
    const isAisle = col === 'C' || col === 'D';
    const isExtraLegroom = row === 1 || row === 6 || row === 12 || row === 17;
    const fee = isExtraLegroom ? 35 : isWindow || isAisle ? 15 : 0;
    return {
      number,
      row,
      col,
      isExtraLegroom,
      fee,
      type: isWindow ? 'window' : isAisle ? 'aisle' : 'standard',
      isOccupied: occupiedSeats.has(number),
    };
  };

  const handleSeatClick = (seat: SeatDef) => {
    if (seat.isOccupied) return;
    // Check if another passenger in our group already chose this seat
    const alreadyChosenBy = Object.entries(selectedSeats).find(
      ([paxId, sNum]) => sNum === seat.number && paxId !== currentPax.id
    );
    if (alreadyChosenBy) return;

    onSelectSeat(currentPax.id, seat.number, seat.fee);

    // If there is another passenger without a seat, move to them after a short delay
    const unassignedPaxIndex = passengers.findIndex(
      (p, idx) => idx !== activePaxIndex && !selectedSeats[p.id]
    );
    if (unassignedPaxIndex !== -1) {
      setTimeout(() => {
        setActivePaxIndex(unassignedPaxIndex);
      }, 250);
    }
  };

  // Quick Auto-assign best seats for all travelers
  const handleAutoAssignAll = () => {
    const assignedSoFar = { ...selectedSeats };
    passengers.forEach((pax) => {
      if (!assignedSoFar[pax.id]) {
        for (const rowNum of rows) {
          for (const col of columns) {
            const seat = getSeatDef(rowNum, col);
            const isTaken =
              seat.isOccupied || Object.values(assignedSoFar).includes(seat.number);
            if (!isTaken) {
              assignedSoFar[pax.id] = seat.number;
              onSelectSeat(pax.id, seat.number, seat.fee);
              return;
            }
          }
        }
      }
    });
  };

  const allAssigned = passengers.every((p) => Boolean(selectedSeats[p.id]));

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-900 border border-blue-200 text-xs font-bold mb-1">
            <span>Step 2 of 5</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Select Aircraft Seats</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Choose your preferred seat on the interactive aircraft map for each passenger
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleAutoAssignAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 text-xs font-bold transition-colors shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-700" />
            <span>Auto-Assign Seats</span>
          </button>
        </div>
      </div>

      {/* Seat Pricing & Status Legend */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-blue-900 text-white flex items-center justify-center font-bold text-[9px]">
              <Check className="w-3 h-3 stroke-[3]" />
            </div>
            <span className="text-slate-800 font-semibold">Active Traveler Seat</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-emerald-600 text-white flex items-center justify-center font-bold text-[9px]">
              ✓
            </div>
            <span className="text-slate-700 font-medium">Other Group Member</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-slate-50 border border-slate-300" />
            <span className="text-slate-600">Standard ($0)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-amber-50 border border-amber-300" />
            <span className="text-slate-600">Window / Aisle (+{formatPrice(15)})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-indigo-50 border border-indigo-300" />
            <span className="text-slate-600">Extra Legroom (+{formatPrice(35)})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-slate-200 border border-slate-200 opacity-60" />
            <span className="text-slate-400">Occupied</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>Click any available seat to assign</span>
        </div>
      </div>

      {/* Passenger Selector Tabs */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
          <span className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-blue-900" />
            <span>Select Passenger to Assign Seat:</span>
          </span>
          <span className="text-slate-500 font-normal">
            {Object.keys(selectedSeats).length} of {passengers.length} seated
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {passengers.map((pax, idx) => {
            const seat = selectedSeats[pax.id];
            const isActive = idx === activePaxIndex;
            return (
              <button
                key={pax.id}
                type="button"
                onClick={() => setActivePaxIndex(idx)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                  isActive
                    ? 'bg-blue-900 text-white border-blue-950 shadow-md ring-2 ring-blue-500/30'
                    : seat
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isActive
                      ? 'bg-blue-800 text-white'
                      : seat
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {idx + 1}
                </div>
                <span>
                  {pax.firstName
                    ? `${pax.firstName} ${pax.lastName || ''}`
                    : `Passenger #${idx + 1}`}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    isActive
                      ? 'bg-blue-800 text-blue-100'
                      : seat
                      ? 'bg-emerald-200 text-emerald-900'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {seat ? `Seat ${seat}` : 'Select Seat'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Aircraft Fuselage Layout */}
      <div className="max-w-2xl mx-auto relative px-2 sm:px-6">
        {/* Left Wing Decoration (Desktop) */}
        <div className="hidden lg:block absolute left-[-45px] top-[280px] w-12 h-36 bg-gradient-to-r from-transparent to-slate-200 border-y border-l border-slate-300 rounded-l-2xl shadow-xs pointer-events-none">
          <div className="w-1.5 h-1.5 rounded-full bg-rose-500 absolute left-2 top-2 animate-pulse" />
        </div>

        {/* Right Wing Decoration (Desktop) */}
        <div className="hidden lg:block absolute right-[-45px] top-[280px] w-12 h-36 bg-gradient-to-l from-transparent to-slate-200 border-y border-r border-slate-300 rounded-r-2xl shadow-xs pointer-events-none">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 absolute right-2 top-2 animate-pulse" />
        </div>

        {/* Fuselage Container */}
        <div className="p-6 sm:p-8 rounded-[40px] bg-white border-2 border-slate-300 shadow-xl relative overflow-hidden">
          {/* Cockpit / Flight Deck Nose */}
          <div className="w-40 h-16 mx-auto -mt-6 mb-6 rounded-t-full bg-gradient-to-b from-slate-200 to-slate-100 border-t-2 border-x-2 border-slate-300 flex flex-col items-center justify-center shadow-inner">
            <div className="flex gap-2 mb-1">
              <div className="w-6 h-3 bg-slate-700/80 rounded-t-xs" />
              <div className="w-6 h-3 bg-slate-700/80 rounded-t-xs" />
            </div>
            <span className="text-[10px] uppercase font-extrabold text-slate-500 tracking-widest">
              Flight Deck
            </span>
          </div>

          {/* Cabin Category Badge */}
          <div className="text-center mb-6">
            <span className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold uppercase tracking-wider">
              {cabinClass === 'first'
                ? 'First Class Suite Cabin'
                : cabinClass === 'business'
                ? 'Business Class Cabin'
                : cabinClass === 'premiumEconomy'
                ? 'Premium Economy Cabin'
                : 'Main Economy Cabin'}
            </span>
          </div>

          {/* Column Header Letters */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4 pb-2 border-b border-slate-200 text-xs font-bold text-slate-600">
            {/* Left group column letters */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              {columns.slice(0, columns.length / 2).map((col) => (
                <div key={col} className="w-10 sm:w-11 text-center font-mono">
                  {col}
                </div>
              ))}
            </div>

            {/* Aisle Spacer */}
            <div className="w-8 sm:w-12 text-center text-[10px] font-extrabold text-slate-400 tracking-wider">
              AISLE
            </div>

            {/* Right group column letters */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              {columns.slice(columns.length / 2).map((col) => (
                <div key={col} className="w-10 sm:w-11 text-center font-mono">
                  {col}
                </div>
              ))}
            </div>
          </div>

          {/* Emergency Exit Row Notice */}
          <div className="flex items-center justify-between text-[10px] font-bold text-emerald-800 bg-emerald-50 px-4 py-1.5 rounded-lg border border-emerald-200 mb-4">
            <span>◀ EMERGENCY EXIT</span>
            <span>EMERGENCY EXIT ▶</span>
          </div>

          {/* Seat Rows Grid */}
          <div className="space-y-3">
            {rows.map((rowNum) => {
              const isExitRow = rowNum === 17;
              return (
                <div key={rowNum} className="space-y-1">
                  <div className="flex items-center justify-center gap-2 sm:gap-3">
                    {/* Left Group */}
                    <div className="flex items-center gap-2 sm:gap-2.5">
                      {columns.slice(0, columns.length / 2).map((col) => {
                        const seat = getSeatDef(rowNum, col);
                        const isCurrentPaxSeat = selectedSeats[currentPax.id] === seat.number;
                        const otherPaxWithSeat = Object.entries(selectedSeats).find(
                          ([paxId, sNum]) => sNum === seat.number && paxId !== currentPax.id
                        );
                        const isTakenByOther = Boolean(otherPaxWithSeat);
                        const isClickable = !seat.isOccupied && !isTakenByOther;

                        return (
                          <button
                            key={seat.number}
                            type="button"
                            disabled={!isClickable}
                            onClick={() => handleSeatClick(seat)}
                            title={`Seat ${seat.number} (${seat.type}) - ${
                              seat.fee > 0 ? `+${formatPrice(seat.fee)}` : 'Standard Included'
                            }`}
                            className={`w-10 sm:w-11 h-12 rounded-xl text-xs font-mono font-bold transition-all flex flex-col items-center justify-center border shadow-xs relative ${
                              isCurrentPaxSeat
                                ? 'bg-blue-900 text-white border-blue-950 ring-2 ring-blue-500 scale-105 shadow-md'
                                : isTakenByOther
                                ? 'bg-emerald-600 text-white border-emerald-700 cursor-not-allowed opacity-90'
                                : seat.isOccupied
                                ? 'bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed opacity-60'
                                : seat.isExtraLegroom
                                ? 'bg-indigo-50/70 hover:bg-indigo-100 border-indigo-200 text-indigo-950 hover:border-indigo-400'
                                : seat.type === 'window' || seat.type === 'aisle'
                                ? 'bg-amber-50/60 hover:bg-amber-100 border-amber-200 text-amber-950 hover:border-amber-400'
                                : 'bg-slate-50 hover:bg-blue-50 border-slate-300 text-slate-800 hover:border-blue-600'
                            }`}
                          >
                            <span>{seat.number}</span>
                            {isCurrentPaxSeat ? (
                              <Check className="w-3 h-3 text-blue-200 stroke-[3] mt-0.5" />
                            ) : isTakenByOther ? (
                              <span className="text-[8px] font-sans font-bold">Group</span>
                            ) : seat.fee > 0 && !seat.isOccupied ? (
                              <span className="text-[8px] font-sans font-semibold opacity-75">
                                +{formatPrice(seat.fee)}
                              </span>
                            ) : (
                              <span className="text-[8px] font-sans text-slate-400 font-normal">
                                $0
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Aisle Row Number */}
                    <div className="w-8 sm:w-12 text-center text-xs font-mono font-extrabold text-slate-500">
                      {rowNum}
                    </div>

                    {/* Right Group */}
                    <div className="flex items-center gap-2 sm:gap-2.5">
                      {columns.slice(columns.length / 2).map((col) => {
                        const seat = getSeatDef(rowNum, col);
                        const isCurrentPaxSeat = selectedSeats[currentPax.id] === seat.number;
                        const otherPaxWithSeat = Object.entries(selectedSeats).find(
                          ([paxId, sNum]) => sNum === seat.number && paxId !== currentPax.id
                        );
                        const isTakenByOther = Boolean(otherPaxWithSeat);
                        const isClickable = !seat.isOccupied && !isTakenByOther;

                        return (
                          <button
                            key={seat.number}
                            type="button"
                            disabled={!isClickable}
                            onClick={() => handleSeatClick(seat)}
                            title={`Seat ${seat.number} (${seat.type}) - ${
                              seat.fee > 0 ? `+${formatPrice(seat.fee)}` : 'Standard Included'
                            }`}
                            className={`w-10 sm:w-11 h-12 rounded-xl text-xs font-mono font-bold transition-all flex flex-col items-center justify-center border shadow-xs relative ${
                              isCurrentPaxSeat
                                ? 'bg-blue-900 text-white border-blue-950 ring-2 ring-blue-500 scale-105 shadow-md'
                                : isTakenByOther
                                ? 'bg-emerald-600 text-white border-emerald-700 cursor-not-allowed opacity-90'
                                : seat.isOccupied
                                ? 'bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed opacity-60'
                                : seat.isExtraLegroom
                                ? 'bg-indigo-50/70 hover:bg-indigo-100 border-indigo-200 text-indigo-950 hover:border-indigo-400'
                                : seat.type === 'window' || seat.type === 'aisle'
                                ? 'bg-amber-50/60 hover:bg-amber-100 border-amber-200 text-amber-950 hover:border-amber-400'
                                : 'bg-slate-50 hover:bg-blue-50 border-slate-300 text-slate-800 hover:border-blue-600'
                            }`}
                          >
                            <span>{seat.number}</span>
                            {isCurrentPaxSeat ? (
                              <Check className="w-3 h-3 text-blue-200 stroke-[3] mt-0.5" />
                            ) : isTakenByOther ? (
                              <span className="text-[8px] font-sans font-bold">Group</span>
                            ) : seat.fee > 0 && !seat.isOccupied ? (
                              <span className="text-[8px] font-sans font-semibold opacity-75">
                                +{formatPrice(seat.fee)}
                              </span>
                            ) : (
                              <span className="text-[8px] font-sans text-slate-400 font-normal">
                                $0
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {isExitRow && (
                    <div className="flex items-center justify-between text-[9px] font-bold text-emerald-800 bg-emerald-50/80 px-4 py-1 rounded border border-emerald-200 my-1">
                      <span>◀ OVERWING EXIT</span>
                      <span>OVERWING EXIT ▶</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Aircraft Tail Fin */}
          <div className="w-28 h-8 mx-auto mt-8 rounded-b-xl bg-slate-100 border-b-2 border-x border-slate-300 flex items-center justify-center">
            <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
              Aft Galley & Lavatories
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-slate-200">
        <button
          type="button"
          onClick={onBack}
          className="w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-6 border border-slate-300 hover:border-slate-400 text-slate-700 hover:text-slate-900 font-bold rounded-xl transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Flight Selection (Step 1)</span>
        </button>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {!allAssigned && (
            <span className="text-xs text-amber-700 font-medium hidden sm:inline">
              Note: Unassigned seats will be automatically assigned at check-in.
            </span>
          )}
          <button
            type="button"
            onClick={onNext}
            className="w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-8 bg-blue-900 hover:bg-blue-800 text-white font-extrabold rounded-xl transition-all shadow-md text-sm hover:scale-[1.02]"
          >
            <span>Continue to Traveler Details (Step 3)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
