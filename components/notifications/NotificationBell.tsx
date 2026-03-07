'use client'

import { useState } from 'react'
import { Bell, MessageCircle, Phone, Briefcase, Shield, CheckCheck } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useNotifications } from '@/hooks/useNotifications'
import type { AppNotification } from '@/types'

interface Props { userId: string }

const TYPE_CONFIG: Record<AppNotification['type'], { icon: typeof Bell; color: string; bg: string }> = {
  message:  { icon: MessageCircle, color: 'text-electric',    bg: 'bg-electric/10'   },
  call:     { icon: Phone,         color: 'text-green-400',   bg: 'bg-green-400/10'  },
  mention:  { icon: Bell,          color: 'text-yellow-400',  bg: 'bg-yellow-400/10' },
  system:   { icon: Shield,        color: 'text-white/60',    bg: 'bg-white/8'       },
  business: { icon: Briefcase,     color: 'text-violet-400',  bg: 'bg-violet-400/10' },
}

export default function NotificationBell({ userId }: Props) {
  const { notifications, unreadCount, markAllRead, markRead } = useNotifications(userId)
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-8 h-8 rounded-lg hover:bg-white/8 flex items-center justify-center transition-colors text-white/50 hover:text-white relative"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full bg-electric text-midnight-950 text-[9px] font-display font-bold flex items-center justify-center px-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 w-80 glass-card rounded-2xl overflow-hidden z-40 animate-slide-up shadow-glass-lg">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-white/60" />
                <span className="text-sm font-display font-bold text-white">Notifications</span>
                {unreadCount > 0 && (
                  <span className="bg-electric/20 text-electric text-[10px] font-display font-bold px-1.5 py-0.5 rounded-full border border-electric/30">
                    {unreadCount}
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-electric hover:underline font-display flex items-center gap-1"
                >
                  <CheckCheck className="w-3 h-3" />
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
              {notifications.length === 0 && (
                <div className="py-10 text-center">
                  <Bell className="w-8 h-8 text-white/15 mx-auto mb-2" />
                  <p className="text-xs text-white/25 font-body">All caught up!</p>
                </div>
              )}

              {notifications.map((notif) => {
                const cfg  = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.system
                const Icon = cfg.icon
                return (
                  <button
                    key={notif.id}
                    onClick={() => { markRead(notif.id); setOpen(false) }}
                    className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors ${
                      !notif.isRead ? 'bg-electric/3' : ''
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${cfg.bg}`}>
                      <Icon className={`w-4 h-4 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-body leading-snug ${!notif.isRead ? 'text-white' : 'text-white/65'}`}>
                        <span className="font-display font-semibold">{notif.title}</span>
                        {' '}{notif.body}
                      </p>
                      <p className="text-[10px] text-white/30 font-body mt-0.5">
                        {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    {!notif.isRead && (
                      <div className="w-2 h-2 rounded-full bg-electric flex-shrink-0 mt-1.5" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
