import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Lock, Mail, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { requestPasswordReset, submitPasswordReset, verifyOtp } from '../../lib/api.ts';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBackToSignIn: () => void;
}

export function ForgotPasswordModal({ isOpen, onClose, onBackToSignIn }: ForgotPasswordModalProps) {
  const { checkPasswordRules } = useAuth();
  const [step, setStep] = useState<'REQUEST_EMAIL' | 'VERIFY_AND_RESET'>('REQUEST_EMAIL');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [simulatedNotice, setSimulatedNotice] = useState<string | null>(null);

  const passwordRules = checkPasswordRules(newPassword);

  if (!isOpen) return null;

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !email.includes('@')) {
      setError('Please enter a valid registered email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await requestPasswordReset(email.trim().toLowerCase());
      setStep('VERIFY_AND_RESET');
      if (res.simulatedCode) {
        setOtpCode(res.simulatedCode);
        setSimulatedNotice(`Password reset code ${res.simulatedCode} dispatched to ${email} (pre-filled for test mode).`);
      } else {
        setSimulatedNotice(res.message || `Password reset code dispatched to ${email}. Please check your inbox.`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to request reset OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (otpCode.length !== 6) {
      setError('Please enter the 6-digit verification code sent to your email.');
      return;
    }
    if (!passwordRules.isValid) {
      setError('Password does not meet the security criteria.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      // 1. Verify OTP
      await verifyOtp(email.trim().toLowerCase(), otpCode.trim(), 'PASSWORD_RESET');
      // 2. Submit new password
      const res = await submitPasswordReset(email.trim().toLowerCase(), newPassword);
      setSuccessMsg(res.message || 'Password successfully updated.');
      setTimeout(() => {
        onBackToSignIn();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please check your OTP.');
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
          <span className="text-xs font-bold text-blue-900 tracking-wider uppercase">Security Recovery</span>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">Reset Password</h2>
          <p className="text-sm text-slate-500 mt-1">
            {step === 'REQUEST_EMAIL'
              ? 'Enter your registered email to receive verification instructions'
              : `Enter the code sent to ${email} and set your new password`}
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <span>{error}</span>
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

        {step === 'REQUEST_EMAIL' ? (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Registered Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-700 focus:bg-white transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl transition-colors disabled:opacity-50 text-sm shadow-xs"
            >
              {loading ? 'Dispatching OTP...' : 'Send Reset Verification Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 text-center">
                Enter 6-Digit Email Code
              </label>
              <input
                type="text"
                maxLength={6}
                autoFocus
                required
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full tracking-[8px] text-center text-2xl font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl py-2.5 text-blue-950 placeholder-slate-400 focus:outline-none focus:border-blue-700 focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter strong password"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-700 focus:bg-white transition-colors"
                />
              </div>

              {/* Password criteria */}
              <div className="mt-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
                <div className="grid grid-cols-2 gap-1 text-[11px]">
                  <span className={passwordRules.length ? 'text-emerald-700 font-semibold' : 'text-slate-400'}>
                    ✓ 8+ chars
                  </span>
                  <span className={passwordRules.upper ? 'text-emerald-700 font-semibold' : 'text-slate-400'}>
                    ✓ Uppercase (A-Z)
                  </span>
                  <span className={passwordRules.lower ? 'text-emerald-700 font-semibold' : 'text-slate-400'}>
                    ✓ Lowercase (a-z)
                  </span>
                  <span className={passwordRules.special ? 'text-emerald-700 font-semibold' : 'text-slate-400'}>
                    ✓ Special char (!@#)
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-700 focus:bg-white transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !passwordRules.isValid}
              className="w-full py-3 px-4 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl transition-colors disabled:opacity-50 text-sm shadow-xs"
            >
              {loading ? 'Updating Password...' : 'Save New Password & Sign In'}
            </button>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <button
            onClick={onBackToSignIn}
            className="text-xs text-blue-900 hover:text-blue-700 font-bold transition-colors"
          >
            ← Return to Sign In
          </button>
        </div>
      </div>
    </div>
  );
}
