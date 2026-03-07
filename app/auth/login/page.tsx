'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Smartphone, Mail, ArrowRight, Shield, Zap, Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import { registerWithPhone, signInWithGoogle } from '@/lib/auth'

type AuthTab = 'phone' | 'gmail'

export default function LoginPage() {
  const router          = useRouter()
  const [tab, setTab]   = useState<AuthTab>('phone')
  const [phone, setPhone]   = useState('')
  const [loading, setLoading] = useState(false)

  async function handlePhoneSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!phone.trim()) return

    setLoading(true)
    const { error } = await registerWithPhone(phone)
    setLoading(false)

    if (error) {
      toast.error(error)
      return
    }

    toast.success('OTP sent! Check your SMS.')
    router.push(`/auth/register?phone=${encodeURIComponent(phone)}&step=otp`)
  }

  async function handleGmail() {
    setLoading(true)
    const { error } = await signInWithGoogle()
    if (error) {
      toast.error(error)
      setLoading(false)
    }
    // Redirect handled by OAuth callback
  }

  return (
    <div className="min-h-dvh bg-app flex items-center justify-center p-4 relative overflow-hidden">

      {/* Background orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full pointer-events-none"
           style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%)' }} />
      <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full pointer-events-none"
           style={{ background: 'radial-gradient(circle, rgba(156,39,176,0.05) 0%, transparent 70%)' }} />

      <div className="w-full max-w-md animate-slide-up">

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl glass electric-border animate-glow-pulse mb-4">
            <Shield className="w-8 h-8 text-electric" strokeWidth={1.5} />
          </div>
          <h1 className="font-display text-3xl font-bold text-white mb-1">Alok Message</h1>
          <p className="text-white/40 text-sm font-body">Hyper-Secure · AI-Governed · Zero Fraud</p>
        </div>

        {/* Card */}
        <div className="glass-card rounded-3xl p-8">

          {/* Tab Switch */}
          <div className="flex rounded-2xl glass p-1 mb-8 gap-1">
            {(['phone', 'gmail'] as AuthTab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium font-display transition-all duration-200 ${
                  tab === t
                    ? 'bg-gradient-to-r from-cyan-400/20 to-blue-500/20 text-electric electric-border'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                {t === 'phone' ? <Smartphone className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                {t === 'phone' ? 'Phone' : 'Gmail'}
              </button>
            ))}
          </div>

          {/* Phone Form */}
          {tab === 'phone' && (
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-display font-semibold text-white/50 uppercase tracking-widest mb-2">
                  International Phone Number
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-electric">
                    <Smartphone className="w-4 h-4" />
                  </span>
                  <input
                    type="tel"
                    placeholder="+1 555 000 0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input-glass pl-10 focus-ring"
                    required
                    autoComplete="tel"
                    autoFocus
                  />
                </div>
                <p className="text-xs text-white/30 mt-1.5 font-body">
                  An SMS OTP will be sent to verify your number.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !phone.trim()}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Send OTP <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>
          )}

          {/* Gmail Form */}
          {tab === 'gmail' && (
            <div className="space-y-4">
              <p className="text-sm text-white/50 font-body text-center">
                Sign in with your Google account. A unique 4-digit contact ID
                will be assigned to your profile.
              </p>
              <button
                onClick={handleGmail}
                disabled={loading}
                className="btn-glass w-full flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </>
                )}
              </button>
            </div>
          )}

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-xs text-white/25 font-body">New to Alok Message?</span>
            <div className="flex-1 h-px bg-white/8" />
          </div>

          <Link
            href="/auth/register"
            className="btn-glass w-full text-center text-sm block"
          >
            Create an Account
          </Link>
        </div>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-6 mt-6">
          {[
            { icon: Shield, label: '99% Scam-Free' },
            { icon: Zap,    label: '4K Calls'      },
            { icon: Lock,   label: 'Zero Data Sale' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-1.5 text-white/30 text-xs font-body">
              <Icon className="w-3.5 h-3.5 text-electric/60" />
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
