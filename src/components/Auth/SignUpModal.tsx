import React, { useEffect, useState } from 'react';
import { AlertCircle, Check, CheckCircle2, Lock, Mail, User, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { sendOtp, verifyOtp } from '../../lib/api.ts';

interface SignUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToSignIn: () => void;
  reason?: string;
  onSuccess?: (user: any) => void;
}

export function SignUpModal({
  isOpen,
  onClose,
  onSwitchToSignIn,
  reason,
  onSuccess,
}: SignUpModalProps) {
  const { signup, checkPasswordRules } = useAuth();
  const [step, setStep] = useState<'DETAILS' | 'OTP'>('DETAILS');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [expirySeconds, setExpirySeconds] = useState(300);
  const [simulatedNotice, setSimulatedNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const passwordRules = checkPasswordRules(password);

  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    let timer: any;
    if (step === 'OTP' && expirySeconds > 0) {
      timer = setInterval(() => setExpirySeconds((e) => e - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, expirySeconds]);

  if (!isOpen) return null;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }
    if (!passwordRules.isValid) {
      setError('Password does not meet the security criteria.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await sendOtp(email.trim().toLowerCase(), 'REGISTRATION');
      setStep('OTP');
      setCooldown(res.cooldownSeconds || 60);
      setExpirySeconds(300);
      if (res.simulatedCode) {
        setOtpCode(res.simulatedCode);
        setSimulatedNotice(`Verification code ${res.simulatedCode} dispatched to ${email} (pre-filled for test mode).`);
      } else {
        setSimulatedNotice(`Verification code dispatched to ${email}. Please check your inbox (valid 5 minutes).`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch verification email');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0) return;
    setError(null);
    setLoading(true);
    try {
      const res = await sendOtp(email.trim().toLowerCase(), 'REGISTRATION');
      setCooldown(60);
      setExpirySeconds(300);
      if (res.simulatedCode) {
        setOtpCode(res.simulatedCode);
        setSimulatedNotice(`New verification code ${res.simulatedCode} dispatched to ${email} (pre-filled for test mode).`);
      } else {
        setSimulatedNotice(`New verification code dispatched to ${email}. Please check your inbox.`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!otpCode || otpCode.trim().length !== 6) {
      setError('Please enter the 6-digit verification code sent to your email.');
      return;
    }

    setLoading(true);
    try {
      // 1. Verify OTP
      await verifyOtp(email.trim().toLowerCase(), otpCode.trim(), 'REGISTRATION');
      // 2. Register account (persists to server database)
      const user = await signup(name.trim(), email.trim().toLowerCase(), password);
      setSuccessMsg('Account registered successfully! Welcome to AeroWings.');
      setTimeout(() => {
        onClose();
        if (onSuccess) {
          onSuccess(user);
        }
      }, 800);
    } catch (err: any) {
      setError(err.message || 'Verification or registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <span className="text-xs font-bold text-blue-900 tracking-wider uppercase">Join AeroWings</span>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">Sign Up</h2>
          <p className="text-sm text-slate-500 mt-1">
            {step === 'DETAILS'
              ? 'Create your verified frequent flyer profile'
              : `Enter the 6-digit code dispatched to ${email}`}
          </p>
        </div>

        {reason && (
          <div className="mb-4 p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-start gap-2">
            <span className="font-bold">Notice:</span>
            <span>{reason}</span>
          </div>
        )}

        {error && (
          <div className={`mb-4 flex items-start gap-2.5 p-3 rounded-xl border text-xs leading-relaxed ${
            error.includes('Resend Free Sandbox')
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}>
            <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${
              error.includes('Resend Free Sandbox') ? 'text-amber-600' : 'text-rose-500'
            }`} />
            <div>
              <div className="font-bold">
                {error.includes('Resend Free Sandbox') ? 'Resend Free Sandbox Notice' : 'Verification Issue'}
              </div>
              <div className="mt-0.5">{error}</div>
            </div>
          </div>
        )}

        {simulatedNotice && (
          <div className="mb-4 flex items-start gap-2.5 p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-blue-700" />
            <span>{simulatedNotice}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {step === 'DETAILS' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Legal Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Captain Sarah Connor"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-700 focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@domain.com"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-700 focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create strong password"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-700 focus:bg-white transition-colors"
                />
              </div>

              {/* Strong Password Checklist */}
              <div className="mt-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs text-slate-600">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide block mb-1">
                  Password Requirements:
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <div className={`flex items-center gap-1.5 ${passwordRules.length ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                    <Check className={`w-3.5 h-3.5 ${passwordRules.length ? 'text-emerald-600' : 'text-slate-300'}`} />
                    <span>8+ characters</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${passwordRules.upper ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                    <Check className={`w-3.5 h-3.5 ${passwordRules.upper ? 'text-emerald-600' : 'text-slate-300'}`} />
                    <span>Uppercase (A-Z)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${passwordRules.lower ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                    <Check className={`w-3.5 h-3.5 ${passwordRules.lower ? 'text-emerald-600' : 'text-slate-300'}`} />
                    <span>Lowercase (a-z)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${passwordRules.special ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                    <Check className={`w-3.5 h-3.5 ${passwordRules.special ? 'text-emerald-600' : 'text-slate-300'}`} />
                    <span>Special char (!@#)</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-700 focus:bg-white transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !passwordRules.isValid}
              className="w-full mt-2 py-3 px-4 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-xs text-sm"
            >
              {loading ? 'Sending Verification Code...' : 'Continue to Email Verification'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyAndRegister} className="space-y-4">
            <div className="text-center py-2">
              <div className="w-12 h-12 mx-auto rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-900 mb-3 shadow-xs">
                <Mail className="w-6 h-6" />
              </div>
              <p className="text-xs text-slate-500">
                A 6-digit one-time verification password was dispatched exclusively to:
              </p>
              <p className="text-sm font-bold text-blue-950 mt-0.5 font-mono">{email}</p>
            </div>

            {simulatedNotice && (
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center gap-2 animate-in fade-in">
                <Mail className="w-4 h-4 text-blue-700 shrink-0" />
                <span className="text-[11px] font-medium leading-relaxed">{simulatedNotice}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 text-center">
                Enter 6-Digit Email OTP
              </label>
              <input
                type="text"
                maxLength={6}
                autoFocus
                required
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full tracking-[8px] text-center text-2xl font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl py-3 text-blue-950 placeholder-slate-400 focus:outline-none focus:border-blue-700 focus:bg-white transition-colors"
              />
              <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
                <span>
                  Expires in:{' '}
                  <strong className="text-slate-800">
                    {Math.floor(expirySeconds / 60)}:{(expirySeconds % 60).toString().padStart(2, '0')}
                  </strong>
                </span>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={cooldown > 0 || loading}
                  className="text-blue-900 hover:text-blue-700 font-bold disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep('DETAILS')}
                className="w-1/3 py-2.5 px-3 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading || otpCode.length !== 6}
                className="flex-1 py-2.5 px-4 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs shadow-xs"
              >
                {loading ? 'Verifying...' : 'Verify & Sign Up'}
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            Already have an account?{' '}
            <button
              onClick={onSwitchToSignIn}
              className="text-blue-900 hover:text-blue-700 font-bold transition-colors"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
