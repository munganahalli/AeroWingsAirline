import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, MapPin, Plane, Search, X } from 'lucide-react';
import { AIRPORTS_CATALOGUE, type AirportData } from '../../data/airportsCatalogue.ts';

interface AirportSearchSelectorProps {
  label: string;
  value: string; // airport code
  onChange: (airportCode: string) => void;
  disabledAirportCode?: string; // e.g. counterpart origin or destination
  placeholder?: string;
  iconColor?: string;
}

export function AirportSearchSelector({
  label,
  value,
  onChange,
  disabledAirportCode,
  placeholder = 'Select airport...',
  iconColor = 'text-blue-800',
}: AirportSearchSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'domestic' | 'international'>('all');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const id = useId();

  // Find currently selected airport object
  const selectedAirport = useMemo(() => {
    return AIRPORTS_CATALOGUE.find((a) => a.code.toUpperCase() === (value || '').toUpperCase());
  }, [value]);

  // Filtered airports based on search query and category tab
  const filteredAirports = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return AIRPORTS_CATALOGUE.filter((airport) => {
      // Tab filter
      if (activeTab === 'domestic' && airport.category !== 'domestic') return false;
      if (activeTab === 'international' && airport.category !== 'international') return false;

      // Query filter
      if (!q) return true;
      return (
        airport.code.toLowerCase().includes(q) ||
        airport.city.toLowerCase().includes(q) ||
        airport.name.toLowerCase().includes(q) ||
        airport.country.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, activeTab]);

  const [highlightedIndex, setHighlightedIndex] = useState(0);

  // Reset highlight on query or tab change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchQuery, activeTab]);

  // Handle click outside & Escape key & Arrow navigation
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
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex((prev) => Math.min(prev + 1, filteredAirports.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const item = filteredAirports[highlightedIndex];
        if (item && item.code.toUpperCase() !== (disabledAirportCode || '').toUpperCase()) {
          handleSelect(item.code);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    // Focus search input on open
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, filteredAirports, highlightedIndex, disabledAirportCode]);

  const handleSelect = (code: string) => {
    if (code === disabledAirportCode) return;
    onChange(code);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <label
        htmlFor={`selector-${id}`}
        className="block text-[11px] font-bold text-slate-700 uppercase mb-1 tracking-wide"
      >
        {label}
      </label>

      {/* Trigger Button */}
      <button
        id={`selector-${id}`}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between bg-slate-50 border rounded-xl pl-3 pr-3 py-2.5 text-left transition-all shadow-xs ${
          isOpen
            ? 'border-blue-600 ring-2 ring-blue-500/20 bg-white'
            : 'border-slate-300 hover:border-blue-400 focus:outline-none focus:border-blue-700 focus:bg-white'
        }`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="shrink-0">
            <MapPin className={`w-4 h-4 ${iconColor}`} />
          </div>
          <div className="min-w-0">
            {selectedAirport ? (
              <div className="flex items-center gap-2 truncate">
                <span className="font-extrabold text-blue-950 font-mono text-sm">
                  {selectedAirport.code}
                </span>
                <span className="text-slate-700 font-semibold text-xs truncate">
                  {selectedAirport.city}
                </span>
                <span className="text-slate-400 text-[11px] shrink-0">
                  • {selectedAirport.country}
                </span>
              </div>
            ) : (
              <span className="text-slate-400 text-xs font-normal">{placeholder}</span>
            )}
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
            isOpen ? 'rotate-180 text-blue-800' : ''
          }`}
        />
      </button>

      {/* Searchable Dropdown Popover */}
      {isOpen && (
        <div
          className="absolute left-0 mt-1.5 w-full sm:w-[380px] max-w-[95vw] bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
          style={{ minWidth: '320px' }}
        >
          {/* Search Header */}
          <div className="p-3 bg-slate-50/80 border-b border-slate-200 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search city, code, or airport..."
                className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-700 font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Category Filter Tabs */}
            <div className="flex items-center gap-1 text-[11px]">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`flex-1 py-1 px-2 rounded-lg font-bold transition-colors ${
                  activeTab === 'all'
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                All (294)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('domestic')}
                className={`flex-1 py-1 px-2 rounded-lg font-bold transition-colors ${
                  activeTab === 'domestic'
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                India Domestic (95)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('international')}
                className={`flex-1 py-1 px-2 rounded-lg font-bold transition-colors ${
                  activeTab === 'international'
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                International (199)
              </button>
            </div>
          </div>

          {/* Results List */}
          <div
            ref={listRef}
            className="max-h-72 overflow-y-auto divide-y divide-slate-100 overscroll-contain"
          >
            {filteredAirports.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                <Plane className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                No matching airports found for "{searchQuery}".
              </div>
            ) : (
              filteredAirports.map((airport, index) => {
                const isSelected = airport.code.toUpperCase() === (value || '').toUpperCase();
                const isDisabled = airport.code.toUpperCase() === (disabledAirportCode || '').toUpperCase();
                const isHighlighted = index === highlightedIndex;

                return (
                  <button
                    key={airport.code}
                    type="button"
                    disabled={isDisabled}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    onClick={() => handleSelect(airport.code)}
                    className={`w-full flex items-center justify-between p-2.5 text-left transition-colors text-xs ${
                      isSelected
                        ? 'bg-blue-50 text-blue-950 font-bold'
                        : isHighlighted
                        ? 'bg-blue-50/70 text-blue-900 font-semibold'
                        : isDisabled
                        ? 'bg-slate-100/70 text-slate-400 cursor-not-allowed opacity-60'
                        : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-11 text-center py-1 rounded-md text-[11px] font-black font-mono shrink-0 ${
                          isSelected
                            ? 'bg-blue-900 text-white'
                            : isDisabled
                            ? 'bg-slate-200 text-slate-400'
                            : 'bg-slate-200/70 text-blue-950'
                        }`}
                      >
                        {airport.code}
                      </span>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 truncate">
                          {airport.city}
                          <span className="font-normal text-slate-500 text-[11px]">
                            {' '}— {airport.country}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {airport.name}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5 pl-2">
                      {airport.category === 'domestic' ? (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-sm bg-amber-50 text-amber-700 border border-amber-200/60 uppercase">
                          Domestic
                        </span>
                      ) : (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-sm bg-blue-50 text-blue-700 border border-blue-200/60 uppercase">
                          Int'l
                        </span>
                      )}
                      {isSelected && <Check className="w-3.5 h-3.5 text-blue-700 shrink-0" />}
                      {isDisabled && (
                        <span className="text-[9px] text-slate-400 italic">Selected</span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer stats */}
          <div className="p-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
            <span>Showing {filteredAirports.length} destinations</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="font-bold text-blue-900 hover:text-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
