import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Shield, XCircle, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default async function BannedPage() {
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()

  let banInfo = { level: 'permanent', reason: 'Violation of platform rules.', banUntil: null as string | null }

  if (session?.user) {
    const { data } = await supabase
      .from('users')
      .select('banLevel, banUntil')
      .eq('id', session.user.id)
      .single()

    if (data) {
      banInfo.level    = data.banLevel ?? 'suspended'
      banInfo.banUntil = data.banUntil
    }
  }

  const isTemporary = !!banInfo.banUntil
  const until = banInfo.banUntil
    ? new Date(banInfo.banUntil).toLocaleDateString('en', { year: 'numeric', month: 'long', day: 'numeric' })
    : null

  return (
    <div className="min-h-dvh bg-app flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-10 blur-3xl"
             style={{ background: 'radial-gradient(circle, #ef4444, transparent)' }} />
      </div>

      <div className="w-full max-w-md text-center animate-slide-up">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-red-500/15 border-2 border-red-500/30 mb-6">
          {isTemporary
            ? <AlertTriangle className="w-10 h-10 text-red-400" />
            : <XCircle className="w-10 h-10 text-red-400" />
          }
        </div>

        <h1 className="font-display text-3xl font-bold text-white mb-2">
          {isTemporary ? 'Account Suspended' : 'Account Banned'}
        </h1>

        <p className="text-white/50 font-body text-sm leading-relaxed mb-6 max-w-sm mx-auto">
          {isTemporary
            ? `Your account has been temporarily suspended for violating Alok Message platform rules. Access will be restored on ${until}.`
            : 'Your account has been permanently banned by Alok Guard for serious and repeated violations of platform rules. This decision is final.'
          }
        </p>

        <div className="glass-card rounded-3xl p-6 text-left space-y-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-electric" />
            <span className="font-display font-bold text-white text-sm">Alok Guard — Automated Justice</span>
          </div>

          {[
            { label: 'Suspension Type', value: isTemporary ? 'Temporary Suspension' : 'Permanent Ban',   color: 'text-red-400' },
            { label: 'Penalty Level',   value: banInfo.level.replace(/_/g, ' ').toUpperCase(),            color: 'text-orange-400' },
            ...(until ? [{ label: 'Suspended Until', value: until, color: 'text-yellow-400' }] : []),
            { label: 'Appeal Process',  value: 'Email support@alokmessage.com',                           color: 'text-electric'  },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex items-start justify-between gap-4">
              <span className="text-xs text-white/40 font-body">{label}</span>
              <span className={`text-xs font-display font-semibold ${color} text-right`}>{value}</span>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          {isTemporary && (
            <div className="glass rounded-2xl p-4 text-sm text-white/50 font-body">
              Your messages and data are preserved. You will regain full access when the suspension ends.
            </div>
          )}

          <form action="/api/auth/signout" method="POST">
            <button type="submit" className="btn-glass w-full text-sm text-white/60">
              Sign Out
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
