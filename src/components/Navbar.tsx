import React, { useState } from 'react';
import { Activity, ChevronDown, Globe, LogOut, Menu, Plane, RefreshCw, Shield, User as UserIcon, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useCurrency, type CurrencyCode } from '../context/CurrencyContext.tsx';
import realFlightLogo from '../assets/images/real_flight_logo.jpg';

interface NavbarProps {
  currentView: 'home' | 'booking' | 'my-bookings' | 'verify' | 'admin' | 'flight-status';
  onNavigate: (view: 'home' | 'booking' | 'my-bookings' | 'verify' | 'admin' | 'flight-status') => void;
  onOpenSignIn: () => void;
  onOpenSignUp: () => void;
}

export function Navbar({ currentView, onNavigate, onOpenSignIn, onOpenSignUp }: NavbarProps) {
  const { user, logout } = useAuth();
  const { currency, setCurrency, allCurrencies, rateSource, lastUpdated, isStale, refreshRates } = useCurrency();
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [refreshingFx, setRefreshingFx] = useState(false);
  const [logoImageError, setLogoImageError] = useState(false);

  const handleRefreshRates = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setRefreshingFx(true);
    try {
      await refreshRates();
    } finally {
      setRefreshingFx(false);
    }
  };

  const navLinks: { view: 'home' | 'booking' | 'flight-status' | 'my-bookings' | 'verify' | 'admin'; label: string; icon?: any }[] = [
    { view: 'home', label: 'Search Flights' },
    { view: 'booking', label: 'Book Flight (5 Steps)' },
    { view: 'flight-status', label: 'Live Flight Status', icon: Activity },
    { view: 'my-bookings', label: 'My Bookings' },
    { view: 'verify', label: 'Verify Ticket' },
    { view: 'admin', label: 'Admin Portal', icon: Shield },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-sm shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 px-4 sm:px-6 py-3.5">
        {/* Brand Wordmark & Live Telemetry Quick Badge */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            onClick={() => onNavigate('home')}
            className="group flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 hover:opacity-95 transition-opacity"
          >
            {/* Real Flight Logo Emblem */}
            <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl p-0.5 bg-gradient-to-br from-blue-900 via-sky-600 to-indigo-950 shadow-md shadow-blue-950/20 ring-1 ring-slate-900/10 group-hover:scale-105 transition-transform shrink-0 overflow-hidden flex items-center justify-center">
              {!logoImageError ? (
                <img
                  src={realFlightLogo}
                  alt="AeroWings Real Flight"
                  loading="eager"
                  className="w-full h-full object-cover object-center rounded-[10px]"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.src.includes('/assets/images/real_flight_logo.jpg')) {
                      target.src = '/assets/images/real_flight_logo.jpg';
                    } else {
                      setLogoImageError(true);
                    }
                  }}
                />
              ) : (
                <div className="w-full h-full rounded-[10px] bg-gradient-to-br from-blue-950 to-sky-700 flex items-center justify-center text-white">
                  <Plane className="w-5 h-5 -rotate-45" />
                </div>
              )}
              <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/30 pointer-events-none" />
            </div>

            {/* Brand Wordmark & Sub-highlight Tagline */}
            <div className="flex flex-col text-left">
              <div className="flex items-center tracking-tight leading-none text-xl sm:text-2xl font-black">
                <span className="text-slate-900">Aero</span>
                <span className="text-sky-600 font-extrabold ml-0.5">Wings</span>
              </div>
              <div className="mt-1 flex items-center gap-1 leading-none">
                <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200/90 shadow-2xs">
                  Fly Beyond Boundaries
                </span>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('flight-status')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${
              currentView === 'flight-status'
                ? 'bg-blue-900 text-white border-blue-950 shadow-xs'
                : 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
            }`}
            title="Track Current Live Flights Telemetry"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="hidden xs:inline">Live Radar</span>
            <span className="xs:hidden">Live</span>
          </button>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-xs sm:text-sm font-semibold text-slate-600">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.view;
            return (
              <button
                key={item.view}
                onClick={() => onNavigate(item.view)}
                className={`whitespace-nowrap transition-colors flex items-center gap-1.5 pb-1 border-b-2 ${
                  isActive
                    ? 'border-blue-900 text-blue-900 font-bold'
                    : 'border-transparent hover:text-blue-900'
                }`}
              >
                {Icon && <Icon className="w-3.5 h-3.5 text-slate-500" />}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Section: Currency Selector & User Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* International Currency Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setCurrencyDropdownOpen(!currencyDropdownOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold transition-colors shadow-xs"
              title="Select Display Currency"
            >
              <Globe className="w-3.5 h-3.5 text-blue-900" />
              <span>{currency.flag}</span>
              <span className="font-mono">{currency.code}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {currencyDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setCurrencyDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white border border-slate-200 shadow-2xl py-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3.5 py-2 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Select Display Currency
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium">
                        Live rates against USD
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRefreshRates}
                      title="Refresh current exchange rates"
                      className="p-1 text-slate-400 hover:text-blue-900 transition-colors"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${refreshingFx ? 'animate-spin text-blue-900' : ''}`} />
                    </button>
                  </div>

                  <div className="max-h-64 overflow-y-auto py-1">
                    {allCurrencies.map((c) => (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => {
                          setCurrency(c.code as CurrencyCode);
                          setCurrencyDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-2 text-left hover:bg-slate-50 transition-colors ${
                          currency.code === c.code ? 'bg-blue-50 text-blue-900 font-bold' : 'text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-base">{c.flag}</span>
                          <div>
                            <div className="font-semibold">{c.code} ({c.symbol})</div>
                            <div className="text-[10px] text-slate-400">{c.name}</div>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500">
                          {c.code === 'USD' ? 'Base 1.00' : `1$ = ${c.rateFromUSD}`}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="px-3.5 py-2 mt-1 border-t border-slate-100 bg-slate-50/60 rounded-b-xl space-y-1">
                    <div className="text-[10px] text-slate-600 flex items-center justify-between">
                      <span className="font-semibold">Provider:</span>
                      <span className="truncate max-w-[150px]">{rateSource}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 flex items-center justify-between">
                      <span>Updated:</span>
                      <span>{new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    {isStale && (
                      <div className="text-[9px] text-amber-700 font-medium">
                        * Operating on cached benchmark exchange rates
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User Sign In / Sign Up buttons */}
          {user ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 text-xs text-slate-800 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg">
                <UserIcon className="w-3.5 h-3.5 text-blue-900" />
                <span className="font-bold truncate max-w-[120px]">{user.name}</span>
                {user.role === 'admin' && (
                  <span className="text-[10px] text-blue-900 font-extrabold bg-blue-100 border border-blue-200 px-1.5 py-0.5 rounded">
                    ADMIN
                  </span>
                )}
              </div>
              <button
                onClick={logout}
                title="Sign Out"
                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={onOpenSignIn}
                className="px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-blue-900 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                Sign In
              </button>
              <button
                onClick={onOpenSignUp}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-xs"
              >
                Sign Up
              </button>
            </div>
          )}

          {/* Mobile Navigation Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-2 animate-in slide-in-from-top-2 duration-150">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.view;
            return (
              <button
                key={item.view}
                onClick={() => {
                  onNavigate(item.view);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs font-bold transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-900 border border-blue-200'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  {Icon && <Icon className="w-4 h-4 text-blue-800" />}
                  <span>{item.label}</span>
                </div>
              </button>
            );
          })}
          {user && (
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 px-2">
              <span className="font-semibold">Signed in as {user.name} ({user.role})</span>
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="text-rose-600 font-bold hover:underline"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
