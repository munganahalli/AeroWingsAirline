import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Filter, Plane, Search, X } from 'lucide-react';
import { AIRLINES_CATALOGUE } from '../../data/airlinesCatalogue.ts';

interface AirlineFilterProps {
  selectedAirlines: string[]; // airline names or IDs
  onChange: (airlines: string[]) => void;
  availableAirlinesInFlightData?: string[]; // to display matching badges
}

export function AirlineFilter({
  selectedAirlines,
  onChange,
  availableAirlinesInFlightData,
}: AirlineFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const id = useId();

  // Filter airlines by search query
  const filteredDomestic = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return AIRLINES_CATALOGUE.filter(
      (a) =>
        a.group === 'domestic_india' &&
        (!q || a.name.toLowerCase().includes(q) || a.country.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  const filteredInternational = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return AIRLINES_CATALOGUE.filter(
      (a) =>
        a.group === 'international_global' &&
        (!q || a.name.toLowerCase().includes(q) || a.country.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  // Click outside and Escape listener
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

    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const toggleAirline = (airlineName: string) => {
    if (selectedAirlines.includes(airlineName)) {
      onChange(selectedAirlines.filter((name) => name !== airlineName));
    } else {
      onChange([...selectedAirlines, airlineName]);
    }
  };

  const handleSelectAll = () => {
    const allNames = AIRLINES_CATALOGUE.map((a) => a.name);
    onChange(allNames);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      {/* Trigger Button */}
      <button
        id={`airline-filter-btn-${id}`}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs border ${
          selectedAirlines.length > 0
            ? 'bg-blue-900 text-white border-blue-950 shadow-sm'
            : 'bg-white text-slate-700 border-slate-300 hover:border-blue-400 hover:bg-slate-50'
        }`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <Plane className="w-3.5 h-3.5" />
        <span>Airlines</span>
        {selectedAirlines.length > 0 ? (
          <span className="px-1.5 py-0.2 bg-blue-700 text-white text-[10px] rounded-full font-extrabold">
            {selectedAirlines.length}
          </span>
        ) : (
          <span className="text-[11px] font-normal text-slate-500">All (100)</span>
        )}
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Popover Filter Menu */}
      {isOpen && (
        <div
          className="absolute left-0 mt-2 w-80 sm:w-96 max-w-[95vw] bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
          style={{ minWidth: '300px' }}
        >
          {/* Header */}
          <div className="p-3 bg-slate-50/90 border-b border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-blue-900" />
                  Filter by Airline
                </h4>
                <p className="text-[10px] text-slate-500">
                  {selectedAirlines.length === 0
                    ? 'Showing flights from all airlines'
                    : `${selectedAirlines.length} airline${selectedAirlines.length > 1 ? 's' : ''} selected`}
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="font-bold text-blue-900 hover:text-blue-700 px-2 py-0.5 rounded-md hover:bg-blue-50 transition-colors"
                >
                  Select All
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="font-bold text-slate-600 hover:text-rose-600 px-2 py-0.5 rounded-md hover:bg-slate-100 transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by airline name or country..."
                className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-7 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-700"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* List with 2 Sections */}
          <div className="max-h-72 overflow-y-auto p-2 space-y-3 overscroll-contain">
            {/* Section 1: Indian Domestic & Regional Carriers */}
            {filteredDomestic.length > 0 && (
              <div>
                <div className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-blue-950 bg-blue-50/80 rounded-md mb-1 border border-blue-100 flex items-center justify-between">
                  <span>Indian Domestic & Regional Carriers</span>
                  <span className="text-blue-700 font-mono">({filteredDomestic.length})</span>
                </div>
                <div className="space-y-0.5">
                  {filteredDomestic.map((airline) => {
                    const isChecked = selectedAirlines.includes(airline.name);
                    const hasLiveFlights = availableAirlinesInFlightData?.includes(airline.name);

                    return (
                      <label
                        key={airline.id}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                          isChecked ? 'bg-blue-50/70 text-blue-950 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleAirline(airline.name)}
                            className="rounded text-blue-900 focus:ring-blue-700 w-3.5 h-3.5"
                          />
                          <span className="truncate">{airline.name}</span>
                        </div>
                        {hasLiveFlights && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            Available
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Section 2: International Airlines — Global Top 90 */}
            {filteredInternational.length > 0 && (
              <div>
                <div className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-800 bg-slate-100 rounded-md mb-1 border border-slate-200 flex items-center justify-between">
                  <span>International Airlines — Global Top 90</span>
                  <span className="text-slate-600 font-mono">({filteredInternational.length})</span>
                </div>
                <div className="space-y-0.5">
                  {filteredInternational.map((airline) => {
                    const isChecked = selectedAirlines.includes(airline.name);
                    const hasLiveFlights = availableAirlinesInFlightData?.includes(airline.name);

                    return (
                      <label
                        key={airline.id}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                          isChecked ? 'bg-blue-50/70 text-blue-950 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleAirline(airline.name)}
                            className="rounded text-blue-900 focus:ring-blue-700 w-3.5 h-3.5"
                          />
                          <span className="truncate">{airline.name}</span>
                          <span className="text-[10px] text-slate-400 truncate">({airline.country})</span>
                        </div>
                        {hasLiveFlights && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            Available
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {filteredDomestic.length === 0 && filteredInternational.length === 0 && (
              <div className="py-6 text-center text-xs text-slate-500">
                No airlines found matching "{searchQuery}".
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <span className="text-[10px] text-slate-500">
              {selectedAirlines.length} of 100 selected
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="py-1 px-3 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-lg text-xs transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
