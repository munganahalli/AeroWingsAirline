import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { AlertCircle, ChevronDown, Minus, Plus, Users, X } from 'lucide-react';
import type { TravelerCounts } from '../../types/index.ts';

interface TravelersSelectorProps {
  value: TravelerCounts;
  onChange: (counts: TravelerCounts) => void;
  maxTotal?: number;
}

export function TravelersSelector({
  value,
  onChange,
  maxTotal = 9,
}: TravelersSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const id = useId();

  const totalTravelers = value.adults + value.children + value.infants;

  // Format button label summary
  const summaryLabel = useMemo(() => {
    if (totalTravelers === 1) return '1 Adult';
    const parts: string[] = [];
    if (value.adults > 0) parts.push(`${value.adults} Adult${value.adults > 1 ? 's' : ''}`);
    if (value.children > 0) parts.push(`${value.children} Child${value.children > 1 ? 'ren' : ''}`);
    if (value.infants > 0) parts.push(`${value.infants} Infant${value.infants > 1 ? 's' : ''}`);
    return parts.join(', ') || '1 Adult';
  }, [value, totalTravelers]);

  // Click outside and Escape key listener
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Modification helpers
  const updateAdults = (delta: number) => {
    const nextAdults = value.adults + delta;
    if (nextAdults < 1) return; // Min 1 adult required
    if (delta > 0 && totalTravelers >= maxTotal) return;

    // If decreasing adults causes infants > adults, clamp infants
    const nextInfants = Math.min(value.infants, nextAdults);
    onChange({
      adults: nextAdults,
      children: value.children,
      infants: nextInfants,
    });
  };

  const updateChildren = (delta: number) => {
    const nextChildren = value.children + delta;
    if (nextChildren < 0) return;
    if (delta > 0 && totalTravelers >= maxTotal) return;

    onChange({
      adults: value.adults,
      children: nextChildren,
      infants: value.infants,
    });
  };

  const updateInfants = (delta: number) => {
    const nextInfants = value.infants + delta;
    if (nextInfants < 0) return;
    // Each infant must be accompanied by an adult (infants <= adults)
    if (nextInfants > value.adults) return;
    if (delta > 0 && totalTravelers >= maxTotal) return;

    onChange({
      adults: value.adults,
      children: value.children,
      infants: nextInfants,
    });
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <label
        htmlFor={`traveler-btn-${id}`}
        className="block text-[11px] font-bold text-slate-700 uppercase mb-1 tracking-wide"
      >
        Travelers
      </label>

      {/* Trigger Button */}
      <button
        id={`traveler-btn-${id}`}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between bg-slate-50 border rounded-xl pl-3 pr-3 py-2.5 text-left transition-all shadow-xs ${
          isOpen
            ? 'border-blue-600 ring-2 ring-blue-500/20 bg-white'
            : 'border-slate-300 hover:border-blue-400 focus:outline-none focus:border-blue-700 focus:bg-white'
        }`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Users className="w-4 h-4 text-slate-600 shrink-0" />
          <div className="truncate">
            <span className="text-xs font-bold text-slate-900 block truncate">
              {summaryLabel}
            </span>
            <span className="text-[10px] text-slate-500">
              {totalTravelers} Traveler{totalTravelers > 1 ? 's' : ''} total
            </span>
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
            isOpen ? 'rotate-180 text-blue-800' : ''
          }`}
        />
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div
          className="absolute right-0 sm:left-0 mt-1.5 w-72 sm:w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 p-4 space-y-4 animate-in fade-in zoom-in-95 duration-100"
          style={{ maxWidth: '95vw' }}
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Select Passengers
              </h4>
              <p className="text-[10px] text-slate-500">Maximum {maxTotal} travelers per reservation</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-700 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Category 1: Adults */}
          <div className="flex items-center justify-between py-1">
            <div>
              <div className="text-xs font-bold text-slate-900">Adults</div>
              <div className="text-[10px] text-slate-500">Age 12+ years</div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={value.adults <= 1}
                onClick={() => updateAdults(-1)}
                className="w-7 h-7 rounded-lg border border-slate-300 flex items-center justify-center text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Decrease adults"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-5 text-center font-bold text-sm text-slate-900 font-mono">
                {value.adults}
              </span>
              <button
                type="button"
                disabled={totalTravelers >= maxTotal}
                onClick={() => updateAdults(1)}
                className="w-7 h-7 rounded-lg border border-slate-300 flex items-center justify-center text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Increase adults"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Category 2: Children */}
          <div className="flex items-center justify-between py-1">
            <div>
              <div className="text-xs font-bold text-slate-900">Children</div>
              <div className="text-[10px] text-slate-500">Age 2–11 years</div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={value.children <= 0}
                onClick={() => updateChildren(-1)}
                className="w-7 h-7 rounded-lg border border-slate-300 flex items-center justify-center text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Decrease children"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-5 text-center font-bold text-sm text-slate-900 font-mono">
                {value.children}
              </span>
              <button
                type="button"
                disabled={totalTravelers >= maxTotal}
                onClick={() => updateChildren(1)}
                className="w-7 h-7 rounded-lg border border-slate-300 flex items-center justify-center text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Increase children"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Category 3: Infants */}
          <div className="flex items-center justify-between py-1">
            <div>
              <div className="text-xs font-bold text-slate-900">Infants</div>
              <div className="text-[10px] text-slate-500">Under 2 years (on lap)</div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={value.infants <= 0}
                onClick={() => updateInfants(-1)}
                className="w-7 h-7 rounded-lg border border-slate-300 flex items-center justify-center text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Decrease infants"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-5 text-center font-bold text-sm text-slate-900 font-mono">
                {value.infants}
              </span>
              <button
                type="button"
                disabled={value.infants >= value.adults || totalTravelers >= maxTotal}
                onClick={() => updateInfants(1)}
                className="w-7 h-7 rounded-lg border border-slate-300 flex items-center justify-center text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Increase infants"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Aviation Regulation Notice */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[10px] text-slate-600 flex items-start gap-1.5 leading-relaxed">
            <AlertCircle className="w-3.5 h-3.5 text-blue-700 shrink-0 mt-0.5" />
            <span>
              Each infant must be accompanied by at least one adult passenger (age 12+).
            </span>
          </div>

          {/* Apply / Done CTA */}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="w-full py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
          >
            Apply ({totalTravelers} Traveler{totalTravelers > 1 ? 's' : ''})
          </button>
        </div>
      )}
    </div>
  );
}
