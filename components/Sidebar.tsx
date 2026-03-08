'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import {
  MessageCircle, Phone, Briefcase, Settings,
  Shield, Search, Plus, LogOut, ChevronDown,
} from 'lucide-react'
import { signOut } from '@/lib/auth'
import ChatList from '@/components/chat/ChatList'
import NotificationBell from '@/components/notifications/NotificationBell'
import NewChatModal from '@/components/chat/NewChatModal'
import type { User, Chat } from '@/types'

interface Props {
  user: User
  // Pass in chats from parent server component for SSR
  chats?: Chat[]
}

const NAV_ITEMS = [
  { href: '/chat',     icon: MessageCircle, label: 'Chats'    },
  { href: '/calls',    icon: Phone,         label: 'Calls'    },
  { href: '/business', icon: Briefcase,     label: 'Business' },
  { href: '/settings', icon: Settings,      label: 'Settings' },
]

export default function Sidebar({ user, chats = [] }: Props) {
  const pathname         = usePathname()
  const [search, setSearch]           = useState('')
  const [showProfile, setShowProfile] = useState(false)
  const [newChatOpen, setNewChatOpen] = useState(false)

  const activeSection = pathname.split('/')[1] ?? 'chat'

  async function handleLogout() {
    await signOut()
    window.location.href = '/auth/login'
  }

  return (
    <aside className="sidebar flex flex-col h-dvh relative z-20">

      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl glass electric-border flex items-center justify-center">
            <Shield className="w-4 h-4 text-electric" />
          </div>
          <span className="font-display font-bold text-white text-sm">Alok Message</span>
        </div>

        <div className="flex items-center gap-1">
          <NotificationBell userId={user.id} />
          <button
            onClick={() => setNewChatOpen(true)}
            className="w-8 h-8 rounded-lg hover:bg-white/8 flex items-center justify-center transition-colors text-white/40 hover:text-white/70"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Nav Tabs */}
      <div className="flex px-3 py-2 gap-1 border-b border-white/6">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const section = href.replace('/', '')
          const isActive = activeSection === section || pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl text-[10px] font-display font-semibold transition-all duration-200 ${
                isActive
                  ? 'text-electric bg-electric/10 electric-border'
                  : 'text-white/35 hover:text-white/70 hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" strokeWidth={isActive ? 2 : 1.5} />
              {label}
            </Link>
          )
        })}
      </div>

      {/* Search */}
      {(pathname.startsWith('/chat') || pathname === '/') && (
        <div className="px-3 py-3 border-b border-white/6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
            <input
              type="search"
              placeholder="Search chats or contacts…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-glass pl-9 py-2 text-sm"
            />
          </div>
        </div>
      )}

      {/* Chat List (only on chat section) */}
      <div className="flex-1 overflow-y-auto">
        {pathname.startsWith('/chat') ? (
          <ChatList
            chats={chats.filter((c) =>
              !search ||
              c.name?.toLowerCase().includes(search.toLowerCase()) ||
              c.lastMessage?.content?.toLowerCase().includes(search.toLowerCase())
            )}
            currentUserId={user.id}
          />
        ) : (
          <div className="p-4 text-center text-white/20 text-xs font-body mt-8">
            Switch to Chats tab to browse conversations.
          </div>
        )}
      </div>

      {/* User Profile Footer */}
      <div className="border-t border-white/6">
        <button
          onClick={() => setShowProfile(!showProfile)}
          className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 transition-colors"
        >
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-9 h-9 rounded-full glass electric-border overflow-hidden">
              {user.avatar ? (
                <Image src={user.avatar} alt={user.displayName} width={36} height={36} className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-400/20 to-blue-600/20 text-sm font-display font-bold text-electric">
                  {user.displayName?.[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-midnight-950 status-${user.status ?? 'online'}`} />
          </div>

          {/* Name */}
          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center gap-1.5">
              <p className="font-display font-semibold text-sm text-white truncate">{user.displayName}</p>
              {user.verificationLevel === 'blue' && (
                <Shield className="w-3.5 h-3.5 text-electric flex-shrink-0" fill="currentColor" />
              )}
            </div>
            <p className="text-xs text-white/35 font-mono truncate">
              {user.contactId ?? user.phone}
            </p>
          </div>

          <ChevronDown className={`w-3.5 h-3.5 text-white/30 flex-shrink-0 transition-transform ${showProfile ? 'rotate-180' : ''}`} />
        </button>

        {/* Profile dropdown */}
        {showProfile && (
          <div className="px-3 pb-3 space-y-1 animate-slide-up">
            <Link
              href="/settings"
              className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/8 text-sm text-white/60 hover:text-white/90 font-body transition-colors"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-red-500/10 text-sm text-white/40 hover:text-red-400 font-body transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        )}
      </div>
      {/* New Chat Modal */}
      <NewChatModal
        open={newChatOpen}
        onClose={() => setNewChatOpen(false)}
        currentUserId={user.id}
      />
    </aside>
  )
}
