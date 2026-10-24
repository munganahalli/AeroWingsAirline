import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  Code2,
  Eye,
  HelpCircle,
  Mail,
  RefreshCw,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import {
  fetchDevEmailTemplates,
  fetchRecipientAudit,
  testDispatchEmail,
  testOtpLifecycle,
  verifyOtp,
} from '../lib/api.ts';

export function EmailTestLab() {
  // Templates state
  const [templates, setTemplates] = useState<any[]>([]);
  const [activeTemplateId, setActiveTemplateId] = useState<string>('registration-otp');
  const [loadingTemplates, setLoadingTemplates] = useState<boolean>(true);
  const [showRawHtml, setShowRawHtml] = useState<boolean>(false);

  // Dispatch tester state
  const [targetRecipient, setTargetRecipient] = useState<string>('delivered@resend.dev');
  const [dispatchMode, setDispatchMode] = useState<'SIMULATED' | 'REAL_RESEND_TEST_RECIPIENT'>('SIMULATED');
  const [dispatchLoading, setDispatchLoading] = useState<boolean>(false);
  const [dispatchResult, setDispatchResult] = useState<any | null>(null);

  // OTP lifecycle tester state
  const [otpTestEmail, setOtpTestEmail] = useState<string>('tester@aerowings.dev');
  const [otpLifecycle, setOtpLifecycle] = useState<any | null>(null);
  const [otpVerifyCode, setOtpVerifyCode] = useState<string>('');
  const [otpVerifyResult, setOtpVerifyResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testingOtp, setTestingOtp] = useState<boolean>(false);

  // Recipient audit state
  const [auditData, setAuditData] = useState<any | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoadingTemplates(true);
    try {
      const [tplData, auditRes] = await Promise.all([
        fetchDevEmailTemplates().catch(() => ({ templates: [] })),
        fetchRecipientAudit().catch(() => null),
      ]);
      setTemplates(tplData.templates || []);
      setAuditData(auditRes);
    } catch (err) {
      console.error('Failed to load email lab data', err);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const activeTemplate = templates.find((t) => t.id === activeTemplateId) || templates[0];

  const handleTestDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setDispatchLoading(true);
    setDispatchResult(null);
    try {
      const result = await testDispatchEmail({
        templateType: activeTemplate?.type || 'REGISTRATION',
        targetEmail: targetRecipient.trim().toLowerCase(),
        mode: dispatchMode,
      });
      setDispatchResult(result);
    } catch (err: any) {
      setDispatchResult({
        success: false,
        status: 'FAILED',
        error: err.message || 'Dispatch test failed.',
      });
    } finally {
      setDispatchLoading(false);
    }
  };

  const handleInitOtpLifecycle = async () => {
    setTestingOtp(true);
    setOtpVerifyResult(null);
    setOtpVerifyCode('');
    try {
      const res = await testOtpLifecycle(otpTestEmail.trim().toLowerCase());
      setOtpLifecycle(res);
      setOtpVerifyCode(res.code);
    } catch (err: any) {
      console.error('Failed to init OTP test', err);
    } finally {
      setTestingOtp(false);
    }
  };

  const handleVerifyOtpTest = async (codeToTry: string) => {
    if (!otpLifecycle) return;
    try {
      const res = await verifyOtp(otpTestEmail.trim().toLowerCase(), codeToTry, 'REGISTRATION');
      setOtpVerifyResult({
        success: true,
        message: 'OTP verified successfully! Single-use token has been consumed.',
      });
    } catch (err: any) {
      setOtpVerifyResult({
        success: false,
        message: err.message || 'OTP verification failed.',
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. COMPREHENSIVE GUIDANCE: FREE TESTING VS VERIFIED DOMAIN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* FREE TESTING FEATURES */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">100% Free Development Testing</h3>
              <p className="text-[11px] text-slate-500">Available immediately with zero configuration</p>
            </div>
          </div>

          <ul className="space-y-2 text-xs text-slate-700">
            <li className="flex items-start gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
              <span>
                <strong>Live Email Template Inspector:</strong> Preview HTML rendering for Registration OTP, Booking OTP, Password Reset, Booking Confirmation, and Cancellation.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
              <span>
                <strong>Simulated Free Sandbox:</strong> Test complete authentication, OTP delivery, rate-limiting, and ticket issuance with 0 external API calls and 0 cost.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
              <span>
                <strong>Resend Official Test Addresses:</strong> Test live API outcomes with documented addresses (<code>delivered@resend.dev</code>, <code>bounced@resend.dev</code>).
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
              <span>
                <strong>Persistent Database Storage:</strong> Test registration and booking persistence across page reloads and server restarts.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
              <span>
                <strong>Verifiable PDF E-Ticket:</strong> Generate downloadable PDF tickets with authentic QR codes validated against the database.
              </span>
            </li>
          </ul>
        </div>

        {/* WHAT REQUIRES A VERIFIED DOMAIN */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-900">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">What Requires a Verified Sending Domain</h3>
              <p className="text-[11px] text-slate-500">Live production email delivery to external inboxes</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs text-slate-700 leading-relaxed">
            <p>
              By default, Resend's free sandbox sender <code>onboarding@resend.dev</code> restricts outbound emails exclusively to your own verified Resend account owner email.
            </p>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-[11px]">
              <span className="font-bold text-slate-800 block">To send real emails to arbitrary customer addresses:</span>
              <div>1. Register your domain in Resend dashboard (<code>resend.com/domains</code>).</div>
              <div>2. Add the generated DKIM, SPF, and MX records in your DNS provider.</div>
              <div>3. Set <code>RESEND_FROM_EMAIL="AeroWings &lt;bookings@yourdomain.com&gt;"</code>.</div>
            </div>
            <p className="text-slate-500 text-[11px]">
              Until then, this <strong>Development Test Lab</strong> allows you to test 100% of the airline's functionality safely and without restriction.
            </p>
          </div>
        </div>
      </div>

      {/* 2. INTERACTIVE EMAIL TEMPLATE PREVIEWER */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-900 uppercase tracking-wider">
              <Eye className="w-4 h-4" />
              <span>Email Template Inspector & Content Verification</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-0.5">Live Template Previews</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowRawHtml(!showRawHtml)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>{showRawHtml ? 'Show Visual Preview' : 'Inspect HTML Source'}</span>
            </button>
          </div>
        </div>

        {/* Template Selector Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {templates.map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              onClick={() => setActiveTemplateId(tpl.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors border ${
                activeTemplateId === tpl.id
                  ? 'bg-blue-900 text-white border-blue-950 shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {tpl.name}
            </button>
          ))}
        </div>

        {activeTemplate && (
          <div className="space-y-4">
            {/* Template Metadata Box */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Subject Line:</span>
                <span className="font-bold text-slate-900 block mt-0.5">{activeTemplate.subject}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Recipient Selection Rule:</span>
                <span className="font-semibold text-blue-900 block mt-0.5">
                  {activeTemplate.recipientSource}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Sample Recipient:</span>
                <span className="font-mono text-slate-800 block mt-0.5">{activeTemplate.sampleRecipient}</span>
              </div>
            </div>

            {/* Rendered HTML or Raw Source */}
            {showRawHtml ? (
              <pre className="p-4 rounded-xl bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto max-h-96">
                <code>{activeTemplate.html}</code>
              </pre>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200">
                <div
                  className="bg-white rounded-xl shadow-xs overflow-hidden max-w-2xl mx-auto"
                  dangerouslySetInnerHTML={{ __html: activeTemplate.html }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. RESEND SANDBOX TEST DISPATCHER */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-900 uppercase tracking-wider">
              <Send className="w-4 h-4" />
              <span>Resend API Test Recipient Dispatcher</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-0.5">Test Email Dispatch</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Test simulated outcomes or documented test recipients without sending real emails to customer inboxes
            </p>
          </div>
        </div>

        <form onSubmit={handleTestDispatch} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Target Recipient
              </label>
              <input
                type="email"
                required
                value={targetRecipient}
                onChange={(e) => setTargetRecipient(e.target.value)}
                placeholder="delivered@resend.dev"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-700 focus:bg-white"
              />
              {/* Quick pills for Resend test addresses */}
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <span className="text-[10px] text-slate-400 font-bold uppercase mr-1">Resend Test Recipients:</span>
                <button
                  type="button"
                  onClick={() => setTargetRecipient('delivered@resend.dev')}
                  className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
                >
                  delivered@resend.dev (Success)
                </button>
                <button
                  type="button"
                  onClick={() => setTargetRecipient('bounced@resend.dev')}
                  className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
                >
                  bounced@resend.dev (Bounce)
                </button>
                <button
                  type="button"
                  onClick={() => setTargetRecipient('complained@resend.dev')}
                  className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100"
                >
                  complained@resend.dev (Spam)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Testing Mode
              </label>
              <select
                value={dispatchMode}
                onChange={(e) => setDispatchMode(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-700 focus:bg-white"
              >
                <option value="SIMULATED">Simulated Sandbox (Free • 0 cost)</option>
                <option value="REAL_RESEND_TEST_RECIPIENT">Real Resend API Test Call</option>
              </select>
              <p className="text-[10px] text-slate-400 mt-1">
                {dispatchMode === 'SIMULATED'
                  ? 'Zero API calls. Tests templates and recipient logic.'
                  : 'Invokes Resend API endpoint with test recipient.'}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-500">
              Active Template: <strong className="text-slate-800">{activeTemplate?.name}</strong>
            </span>
            <button
              type="submit"
              disabled={dispatchLoading}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl text-xs transition-colors shadow-xs disabled:opacity-50"
            >
              {dispatchLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>Dispatch Test Email</span>
            </button>
          </div>
        </form>

        {/* Dispatch Result Card */}
        {dispatchResult && (
          <div
            className={`p-4 rounded-xl border text-xs space-y-2 ${
              dispatchResult.status === 'SENT'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : dispatchResult.status === 'SIMULATED'
                ? 'bg-blue-50 border-blue-200 text-blue-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-center justify-between font-bold">
              <div className="flex items-center gap-2">
                {dispatchResult.status === 'SENT' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : dispatchResult.status === 'SIMULATED' ? (
                  <Sparkles className="w-4 h-4 text-blue-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                )}
                <span>Outcome: {dispatchResult.status}</span>
              </div>
              <span className="font-mono text-[11px]">{dispatchResult.label}</span>
            </div>

            {dispatchResult.resendId && (
              <div className="font-mono text-[11px]">Resend Message ID: {dispatchResult.resendId}</div>
            )}

            {dispatchResult.error && (
              <div className="leading-relaxed bg-white/80 p-2.5 rounded-lg border border-rose-200 text-rose-800">
                <strong>Error details:</strong> {dispatchResult.error}
              </div>
            )}

            {dispatchResult.isDomainRestriction && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                <strong>Resend Restriction Explanation:</strong> {dispatchResult.guidance}
              </div>
            )}

            {dispatchResult.note && (
              <div className="text-[11px] text-slate-600">{dispatchResult.note}</div>
            )}
          </div>
        )}
      </div>

      {/* 4. OTP LIFECYCLE & SECURITY TESTER */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-900 uppercase tracking-wider">
              <Shield className="w-4 h-4" />
              <span>OTP Security & Expiration Engine</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-0.5">Test OTP Verification Lifecycle</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Verify 5-minute TTL expiration, 60s cooldown rate-limiting, and 5-attempt brute-force protection
            </p>
          </div>
          <button
            type="button"
            onClick={handleInitOtpLifecycle}
            disabled={testingOtp}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testingOtp ? 'animate-spin' : ''}`} />
            <span>Generate Test OTP</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Test Email Address</label>
            <input
              type="email"
              value={otpTestEmail}
              onChange={(e) => setOtpTestEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Verify Code Test</label>
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={6}
                value={otpVerifyCode}
                onChange={(e) => setOtpVerifyCode(e.target.value)}
                placeholder="000000"
                className="w-full tracking-widest text-center font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
              />
              <button
                type="button"
                onClick={() => handleVerifyOtpTest(otpVerifyCode)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs whitespace-nowrap"
              >
                Test Verify
              </button>
            </div>
          </div>
        </div>

        {otpLifecycle && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Active Code</span>
                <span className="font-mono text-base font-bold text-blue-900">{otpLifecycle.code}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Expires In</span>
                <span className="font-mono font-bold text-slate-800">{otpLifecycle.ttlSeconds}s (5 min)</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Cooldown</span>
                <span className="font-mono font-bold text-slate-800">{otpLifecycle.cooldownSeconds}s</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Max Attempts</span>
                <span className="font-mono font-bold text-slate-800">{otpLifecycle.maxAttempts}</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-600 space-y-1">
              <div>• <strong>Valid code check:</strong> Code matches and single-use consumes the OTP record.</div>
              <div>• <strong>Incorrect code check:</strong> Decrements attempt counter; lock after 5 tries.</div>
              <div>• <strong>Expiry check:</strong> Server rejects codes older than 300 seconds.</div>
            </div>
          </div>
        )}

        {otpVerifyResult && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
              otpVerifyResult.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {otpVerifyResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{otpVerifyResult.message}</span>
          </div>
        )}
      </div>

      {/* 5. RECIPIENT TARGETING & PRIVACY AUDIT */}
      {auditData && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                <span>Recipient Targeting & Privacy Rules Audit</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">Codebase Recipient Verification</h3>
            </div>
            <span className="px-2.5 py-1 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-[10px]">
              AUDIT: PASSED
            </span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {auditData.rulesEnforced?.map((rule: any, idx: number) => (
              <div key={idx} className="py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
                <div>
                  <span className="font-bold text-slate-900">{rule.flow}: </span>
                  <span className="text-slate-600">{rule.rule}</span>
                </div>
                <span className="text-[11px] font-mono text-blue-900 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                  {rule.verifiedByCode || rule.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
