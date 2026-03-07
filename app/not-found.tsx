import Link from 'next/link'
import { Shield, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-dvh bg-app flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full opacity-8 blur-3xl"
             style={{ background: 'radial-gradient(circle, #00d4ff, transparent)' }} />
      </div>

      <div className="text-center animate-slide-up">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl glass electric-border mb-6">
          <Shield className="w-10 h-10 text-electric/50" />
        </div>
        <h1 className="font-display text-7xl font-bold text-white/10 mb-2">404</h1>
        <h2 className="font-display text-2xl font-bold text-white mb-3">Page Not Found</h2>
        <p className="text-white/40 font-body text-sm mb-8 max-w-xs mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          href="/chat"
          className="btn-primary inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Alok Message
        </Link>
      </div>
    </div>
  )
}
