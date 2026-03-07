import { Shield } from 'lucide-react'

export default function Loading() {
  return (
    <div className="min-h-dvh bg-app flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl glass electric-border animate-glow-pulse flex items-center justify-center">
            <Shield className="w-8 h-8 text-electric" />
          </div>
          {/* Spinner ring */}
          <div className="absolute -inset-1.5 rounded-3xl border-2 border-transparent border-t-electric animate-spin" />
        </div>
        <p className="text-white/30 text-sm font-body animate-pulse">Loading Alok Message…</p>
      </div>
    </div>
  )
}
