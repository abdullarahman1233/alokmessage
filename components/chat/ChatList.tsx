'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { Users, VolumeX, Pin } from 'lucide-react'
import { VerifiedBadge } from '@/components/ui/BrandingAssets'
import { PresenceDot } from '@/components/ui/PresenceDot'
import AiContactCard from '@/components/ai/AiContactCard'
import { AI_CONTACT_ID } from '@/lib/ai-contact'
import type { Chat } from '@/types'

interface Props {
  chats:         Chat[]
  currentUserId: string
}

export default function ChatList({ chats, currentUserId }: Props) {
  const pathname = usePathname()

  // AI chat is always shown as the pinned card — exclude from regular list
  const regularChats = chats.filter(
    (c) => !c.participants?.includes(AI_CONTACT_ID) && !(c as any).isAiChat
  )

  return (
    <div className="flex flex-col">

      {/* ── Pinned AI Contact — globally visible to every user ── */}
      <AiContactCard currentUserId={currentUserId} compact />

      {/* ── Regular chats ─────────────────────────────────────── */}
      <div className="divide-y divide-white/4">
        {regularChats.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 px-6">
            <p className="text-white/25 text-sm text-center font-body">
              No conversations yet. Start one!
            </p>
          </div>
        )}

        {regularChats.map((chat) => {
          const isActive = pathname === `/chat/${chat.id}`
          const lastMsg  = chat.lastMessage

          return (
            <Link
              key={chat.id}
              href={`/chat/${chat.id}`}
              className={`flex items-center gap-3 px-4 py-3.5 transition-all duration-150 hover:bg-white/5 relative ${
                isActive
                  ? 'bg-electric/8 border-l-2 border-electric'
                  : 'border-l-2 border-transparent'
              }`}
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-11 h-11 rounded-full glass overflow-hidden">
                  {chat.avatar ? (
                    <Image
                      src={chat.avatar}
                      alt={chat.name ?? 'Chat'}
                      width={44}
                      height={44}
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-500/15 to-blue-700/15 text-base font-display font-bold text-electric/80">
                      {chat.isGroup
                        ? <Users className="w-5 h-5" />
                        : (chat.name?.[0] ?? '?').toUpperCase()
                      }
                    </div>
                  )}
                </div>

                {chat.unreadCount > 0 ? (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-electric text-midnight-950 text-[10px] font-display font-bold flex items-center justify-center px-1">
                    {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                  </span>
                ) : !chat.isGroup && (
                  <div className="absolute -bottom-0.5 -right-0.5 border-2 border-midnight-950 rounded-full">
                    <PresenceDot
                      status={(chat as any).participantStatus ?? 'offline'}
                      size="sm"
                    />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <p className={`font-display font-semibold text-sm truncate ${
                      chat.unreadCount > 0 ? 'text-white' : 'text-white/80'
                    }`}>
                      {chat.name ?? 'Unknown'}
                    </p>
                    {chat.isMuted  && <VolumeX className="w-3 h-3 text-white/25 flex-shrink-0" />}
                    {chat.isPinned && <Pin     className="w-3 h-3 text-electric/50 flex-shrink-0" />}
                  </div>
                  <span className="text-[10px] text-white/30 font-body flex-shrink-0 ml-2">
                    {chat.lastActivity
                      ? formatDistanceToNow(new Date(chat.lastActivity), { addSuffix: false })
                      : ''}
                  </span>
                </div>

                <p className={`text-xs truncate font-body ${
                  chat.unreadCount > 0 ? 'text-white/60 font-medium' : 'text-white/30'
                }`}>
                  {lastMsg?.isDeleted
                    ? <em>Message deleted</em>
                    : lastMsg?.type !== 'text'
                      ? `📎 ${lastMsg?.type ?? 'Media'}`
                      : lastMsg?.content ?? 'Start a conversation'
                  }
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
