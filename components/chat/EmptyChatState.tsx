import { Shield, MessageCircle, Zap, Lock } from 'lucide-react'

export default function EmptyChatState() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 p-8 text-center max-w-sm">
      <div className="relative">
        <div className="w-20 h-20 rounded-3xl glass electric-border animate-glow-pulse flex items-center justify-center">
          <Shield className="w-10 h-10 text-electric" strokeWidth={1.5} />
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
          <MessageCircle className="w-4 h-4 text-white" fill="currentColor" />
        </div>
      </div>

      <div>
        <h2 className="font-display text-2xl font-bold text-white mb-2">Alok Message</h2>
        <p className="text-white/40 text-sm font-body leading-relaxed">
          Select a conversation from the sidebar, or start a new one. Your messages are
          protected by Alok Guard — AI-powered, 99% scam-free.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 w-full">
        {[
          { icon: Shield, label: 'AI Guard',    sub: '99% scam-free'  },
          { icon: Zap,    label: '4K Calls',    sub: 'Crystal clear'  },
          { icon: Lock,   label: 'Lossless',    sub: '100% quality'   },
        ].map(({ icon: Icon, label, sub }) => (
          <div key={label} className="glass-card rounded-2xl p-3 flex flex-col items-center gap-1.5">
            <Icon className="w-5 h-5 text-electric/80" strokeWidth={1.5} />
            <p className="text-xs font-display font-semibold text-white/70">{label}</p>
            <p className="text-[10px] text-white/30 font-body">{sub}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
