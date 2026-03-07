'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Shield, Zap, Globe, ArrowRight } from 'lucide-react'
import { getOrCreateAiChat, AI_CONTACT_PROFILE } from '@/lib/ai-contact'
import { GeminiAvatar, GoldenSparkBadge, VerifiedBadge } from '@/components/ui/BrandingAssets'
import toast from 'react-hot-toast'

interface Props {
  currentUserId: string
  compact?:      boolean
}

export default function AiContactCard({ currentUserId, compact }: Props) {
  const router              = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleOpen() {
    setLoading(true)
    const chat = await getOrCreateAiChat(currentUserId)
    setLoading(false)

    if (!chat) {
      toast.error('Could not open AI chat. Please try again.')
      return
    }

    router.push(`/chat/${chat.id}`)
  }

  if (compact) {
    // Compact version used inside ChatList (pinned at top)
    return (
      <button
        onClick={handleOpen}
        disabled={loading}
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-electric/5 transition-all border-b border-white/6 relative group"
      >
        {/* Animated gradient left border */}
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-electric to-blue-500 opacity-70" />

        {/* AI avatar */}
        <div className="relative flex-shrink-0">
          {loading
            ? <div className="w-11 h-11 rounded-full border-2 border-electric/30 border-t-electric animate-spin" />
            : <GeminiAvatar size="md" breathing={true} />
          }
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-midnight-950 shadow-[0_0_6px_#22c55e]" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-1.5 mb-0.5">
            <p className="font-display font-semibold text-sm text-white truncate">Gemini 3 Pro</p>
            <GoldenSparkBadge size="xs" />
            <VerifiedBadge size="xs" tooltip={false} />
          </div>
          <p className="text-xs text-white/40 font-body truncate">Tap to chat with your AI assistant</p>
        </div>

        {/* Electric badge */}
        <div className="flex items-center gap-1 glass rounded-full px-2 py-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <Zap className="w-2.5 h-2.5 text-electric" />
          <span className="text-[9px] font-display font-bold text-electric">AI</span>
        </div>
      </button>
    )
  }

  // Full featured card (shown on home/empty state)
  return (
    <button
      onClick={handleOpen}
      disabled={loading}
      className="w-full text-left glass-card rounded-3xl p-5 hover:border-electric/30 transition-all group relative overflow-hidden"
    >
      {/* Background glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
           style={{ background: 'radial-gradient(ellipse at 30% 50%, rgba(0,212,255,0.04) 0%, transparent 70%)' }} />

      <div className="flex items-center gap-4 relative z-10">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {loading
            ? <div className="w-14 h-14 rounded-2xl border-2 border-electric/30 border-t-electric animate-spin" />
            : <GeminiAvatar size="xl" breathing={true} />
          }
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-display font-bold text-white">Gemini 3 Pro</h3>
            <div className="flex items-center gap-1 bg-electric/10 border border-electric/25 rounded-full px-1.5 py-0.5">
              <Shield className="w-2.5 h-2.5 text-electric" fill="currentColor" />
              <span className="text-[8px] font-display font-bold text-electric uppercase tracking-wider">Official</span>
            </div>
          </div>
          <p className="text-xs text-white/45 font-body truncate">
            {AI_CONTACT_PROFILE.phone} · Contact ID #0000
          </p>
          <div className="flex items-center gap-3 mt-2">
            {[
              { icon: Zap,    label: 'No limits'    },
              { icon: Globe,  label: 'Any language' },
              { icon: Shield, label: 'E2EE'         },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1 text-[10px] text-white/35 font-body">
                <Icon className="w-3 h-3 text-electric/60" />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Arrow */}
        <ArrowRight className="w-5 h-5 text-white/20 group-hover:text-electric transition-colors flex-shrink-0" />
      </div>
    </button>
  )
}
