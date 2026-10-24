import React, { useEffect, useId, useRef, useState } from 'react';
import { Armchair, Check, ChevronDown } from 'lucide-react';
import type { CabinClass } from '../../types/index.ts';

interface CabinSelectorProps {
  value: CabinClass;
  onChange: (cabin: CabinClass) => void;
  label?: string;
}

const CABIN_OPTIONS: {
  key: CabinClass;
  name: string;
  badge: string;
  description: string;
}[] = [
  {
    key: 'economy',
    name: 'Economy',
    badge: 'Standard',
    description: 'Best value fares, comfortable ergonomic seats & standard baggage',
  },
  {
    key: 'premiumEconomy',
    name: 'Premium Economy',
    badge: 'Extra Room',
    description: '38" seat pitch, deeper recline, priority boarding & premium dining',
  },
  {
    key: 'business',
    name: 'Business Class',
    badge: 'Lie-Flat Bed',
    description: 'Fully flat beds, airport lounge access, chef-curated dining & fast track',
  },
  {
    key: 'first',
    name: 'First Class',
    badge: 'Private Suite',
    description: 'Ultra-exclusive private suites, turn-down bedding & personalized service',
  },
];

export function CabinSelector({ value, onChange, label = 'Cabin Class' }: CabinSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const id = useId();

  const selectedCabin = CABIN_OPTIONS.find((c) => c.key === value) || CABIN_OPTIONS[0];

  const [highlightedIndex, setHighlightedIndex] = useState(() => {
    const idx = CABIN_OPTIONS.findIndex((c) => c.key === value);
    return idx >= 0 ? idx : 0;
  });

  useEffect(() => {
    if (!isOpen) return;

    const idx = CABIN_OPTIONS.findIndex((c) => c.key === value);
    setHighlightedIndex(idx >= 0 ? idx : 0);

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
        setHighlightedIndex((prev) => Math.min(prev + 1, CABIN_OPTIONS.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = CABIN_OPTIONS[highlightedIndex];
        if (selected) {
          handleSelect(selected.key);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, value, highlightedIndex]);

  const handleSelect = (key: CabinClass) => {
    onChange(key);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <label
        htmlFor={`cabin-btn-${id}`}
        className="block text-[11px] font-bold text-slate-700 uppercase mb-1 tracking-wide"
      >
        {label}
      </label>

      {/* Trigger Button */}
      <button
        id={`cabin-btn-${id}`}
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
          <Armchair className="w-4 h-4 text-blue-900 shrink-0" />
          <div className="truncate">
            <span className="text-xs font-bold text-slate-900 block truncate">
              {selectedCabin.name}
            </span>
            <span className="text-[10px] text-slate-500 truncate">
              {selectedCabin.badge}
            </span>
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
            isOpen ? 'rotate-180 text-blue-800' : ''
          }`}
        />
      </button>

      {/* Dropdown Box */}
      {isOpen && (
        <div
          className="absolute left-0 mt-1.5 w-72 sm:w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-100"
          style={{ maxWidth: '95vw' }}
          role="listbox"
        >
          {CABIN_OPTIONS.map((cabin, index) => {
            const isSelected = cabin.key === value;
            const isHighlighted = index === highlightedIndex;

            return (
              <button
                key={cabin.key}
                type="button"
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setHighlightedIndex(index)}
                onClick={() => handleSelect(cabin.key)}
                className={`w-full flex items-start justify-between p-2.5 rounded-xl text-left transition-colors text-xs ${
                  isSelected
                    ? 'bg-blue-50 text-blue-950 font-bold border border-blue-200'
                    : isHighlighted
                    ? 'bg-blue-50/60 text-blue-900 font-semibold border border-blue-100'
                    : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                }`}
              >
                <div className="space-y-0.5 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{cabin.name}</span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase ${
                        isSelected
                          ? 'bg-blue-900 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {cabin.badge}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-normal leading-tight">
                    {cabin.description}
                  </p>
                </div>

                {isSelected && <Check className="w-4 h-4 text-blue-800 shrink-0 mt-0.5" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
