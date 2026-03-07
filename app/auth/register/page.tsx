'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Shield, CheckCircle, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { verifyPhoneOtp } from '@/lib/auth'

type Step = 'otp' | 'profile' | 'rules'

export default function RegisterPage() {
  const router       = useRouter()
  const params       = useSearchParams()
  const phone        = params.get('phone') ?? ''
  const initialStep  = (params.get('step') as Step) ?? 'otp'

  const [step, setStep]                 = useState<Step>(initialStep)
  const [otp,  setOtp]                  = useState(['', '', '', '', '', ''])
  const [displayName, setDisplayName]   = useState('')
  const [rulesAccepted, setRulesAccepted] = useState(false)
  const [loading, setLoading]           = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Auto-focus first OTP box
  useEffect(() => {
    if (step === 'otp') inputRefs.current[0]?.focus()
  }, [step])

  function handleOtpChange(i: number, val: string) {
    if (!/^[0-9]?$/.test(val)) return
    const next = [...otp]
    next[i] = val
    setOtp(next)
    if (val && i < 5) inputRefs.current[i + 1]?.focus()
  }

  function handleOtpKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otp[i] && i > 0) inputRefs.current[i - 1]?.focus()
  }

  async function handleVerifyOtp() {
    const code = otp.join('')
    if (code.length < 6) { toast.error('Enter the 6-digit OTP.'); return }

    setLoading(true)
    const { error } = await verifyPhoneOtp(phone, code, 'temp')
    setLoading(false)

    if (error) { toast.error(error); return }
    setStep('profile')
  }

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!displayName.trim()) { toast.error('Display name is required.'); return }
    setStep('rules')
  }

  async function handleRulesAccept() {
    if (!rulesAccepted) {
      toast('Please accept responsibility for platform rules.', { icon: '⚠️' })
      return
    }
    toast.success('Welcome to Alok Message!')
    router.push('/chat')
  }

  function handleSkipRules() {
    toast('You have accepted User-Responsibility mode.', { icon: '🛡️' })
    router.push('/chat')
  }

  return (
    <div className="min-h-dvh bg-app flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none"
           style={{ background: 'radial-gradient(ellipse, rgba(0,212,255,0.05) 0%, transparent 70%)' }} />

      <div className="w-full max-w-md animate-slide-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl glass electric-border mb-4">
            <Shield className="w-7 h-7 text-electric" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white">Create Account</h1>
          <p className="text-white/40 text-sm mt-1">
            {step === 'otp'     && 'Enter the OTP sent to your phone'}
            {step === 'profile' && 'Set up your profile'}
            {step === 'rules'   && 'Platform Rules — Required Reading'}
          </p>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {(['otp', 'profile', 'rules'] as Step[]).map((s, i) => (
            <div key={s} className="flex-1 h-1 rounded-full overflow-hidden bg-white/10">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width:      step === s ? '50%' : ['otp', 'profile', 'rules'].indexOf(step) > i ? '100%' : '0%',
                  background: 'linear-gradient(90deg, #00d4ff, #0077be)',
                }}
              />
            </div>
          ))}
        </div>

        <div className="glass-card rounded-3xl p-8">

          {/* STEP 1: OTP */}
          {step === 'otp' && (
            <div className="space-y-6">
              <p className="text-white/60 text-sm text-center font-body">
                Code sent to <span className="text-electric font-semibold">{phone}</span>
              </p>

              <div className="flex gap-3 justify-center">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="w-12 h-14 text-center text-xl font-display font-bold rounded-xl glass electric-border text-white focus:outline-none focus:shadow-[0_0_0_2px_rgba(0,212,255,0.4)] transition-all"
                  />
                ))}
              </div>

              <button
                onClick={handleVerifyOtp}
                disabled={loading || otp.join('').length < 6}
                className="btn-primary w-full disabled:opacity-50"
              >
                {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" /> : 'Verify OTP'}
              </button>

              <p className="text-center text-xs text-white/30 font-body">
                Didn't receive it?{' '}
                <button className="text-electric hover:underline">Resend OTP</button>
              </p>
            </div>
          )}

          {/* STEP 2: Profile */}
          {step === 'profile' && (
            <form onSubmit={handleProfileSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-display font-semibold text-white/50 uppercase tracking-widest mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  placeholder="Your full name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="input-glass focus-ring"
                  required
                  autoFocus
                  maxLength={40}
                />
              </div>

              <div className="glass rounded-xl p-4 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-electric flex-shrink-0 mt-0.5" />
                <p className="text-sm text-white/60 font-body">
                  Your unique <span className="text-electric font-semibold">Contact ID</span> has been auto-generated.
                  Others can find you without sharing your phone number.
                </p>
              </div>

              <button type="submit" className="btn-primary w-full">
                Continue
              </button>
            </form>
          )}

          {/* STEP 3: Rules */}
          {step === 'rules' && (
            <div className="space-y-5">
              <div className="glass rounded-2xl p-5 max-h-56 overflow-y-auto space-y-3 text-sm text-white/60 font-body">
                {[
                  '🚫 No phishing, scam links, or fraud of any kind. AI Guard monitors 24/7.',
                  '🔞 No sexual, explicit, or adult content. Instant 30-day suspension.',
                  '🤝 Respect all users. Harassment = escalating suspensions.',
                  '🏢 Business accounts must provide honest product/service information.',
                  '📸 Screenshots are allowed in business chats for transaction records only.',
                  '🔒 Never share others\' private banking information or personal photos.',
                  '⚠️ Repeated violations result in permanent IP and Device ID ban.',
                  '✅ Alok Guard reviews all reports fairly with AI + human oversight.',
                ].map((rule, i) => (
                  <p key={i} className="flex items-start gap-2 leading-relaxed">{rule}</p>
                ))}
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <div
                  onClick={() => setRulesAccepted(!rulesAccepted)}
                  className={`w-5 h-5 rounded flex-shrink-0 mt-0.5 border-2 transition-all cursor-pointer flex items-center justify-center ${
                    rulesAccepted ? 'bg-electric border-electric' : 'border-white/30'
                  }`}
                >
                  {rulesAccepted && <CheckCircle className="w-3 h-3 text-midnight-950" />}
                </div>
                <span className="text-sm text-white/70 font-body">
                  I have read and agree to the Alok Message platform rules.
                </span>
              </label>

              <div className="flex gap-3">
                <button
                  onClick={handleSkipRules}
                  className="btn-glass flex-1 text-sm"
                >
                  Skip (User-Responsibility)
                </button>
                <button
                  onClick={handleRulesAccept}
                  disabled={!rulesAccepted}
                  className="btn-primary flex-1 text-sm disabled:opacity-40"
                >
                  Accept & Enter
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs text-white/25 font-body">
                <AlertTriangle className="w-3.5 h-3.5" />
                Skipping means you accept full responsibility for any violations.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
