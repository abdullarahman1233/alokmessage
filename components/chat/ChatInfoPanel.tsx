'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  X, Bell, BellOff, Archive, Pin, Trash2,
  Users, Shield, Camera, Link as LinkIcon,
  ChevronDown, ChevronUp,
} from 'lucide-react'
import { Avatar }  from '@/components/ui/Avatar'
import { Badge }   from '@/components/ui/Badge'
import { Button }  from '@/components/ui/Button'
import { supabaseBrowser } from '@/lib/supabase'
import toast from 'react-hot-toast'
import type { Chat, User } from '@/types'

interface Props {
  chat:          Chat
  participants:  Partial<User>[]
  currentUserId: string
  onClose:       () => void
}

export default function ChatInfoPanel({ chat, participants, currentUserId, onClose }: Props) {
  const supabase = supabaseBrowser()
  const [muted,    setMuted]    = useState(chat.isMuted)
  const [pinned,   setPinned]   = useState(chat.isPinned)
  const [showAll,  setShowAll]  = useState(false)

  const otherUser   = !chat.isGroup ? participants.find((p) => p.id !== currentUserId) : null
  const displayName = chat.name ?? otherUser?.displayName ?? 'Unknown'
  const displayPic  = chat.avatar ?? otherUser?.avatar

  async function toggleMute() {
    await supabase.from('chats').update({ isMuted: !muted }).eq('id', chat.id)
    setMuted(!muted)
    toast.success(muted ? 'Notifications unmuted.' : 'Chat muted.')
  }

  async function togglePin() {
    await supabase.from('chats').update({ isPinned: !pinned }).eq('id', chat.id)
    setPinned(!pinned)
    toast.success(pinned ? 'Chat unpinned.' : 'Chat pinned.')
  }

  const visibleParticipants = showAll ? participants : participants.slice(0, 5)

  return (
    <div className="flex flex-col h-full w-72 glass-dark border-l border-white/8 overflow-y-auto animate-slide-in-right">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/8">
        <h3 className="font-display font-bold text-white text-sm">
          {chat.isGroup ? 'Group Info' : 'Contact Info'}
        </h3>
        <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-white/8 flex items-center justify-center text-white/40 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Avatar */}
      <div className="flex flex-col items-center py-6 px-4 border-b border-white/8">
        <div className="relative mb-3">
          {displayPic ? (
            <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-electric/30">
              <Image src={displayPic} alt={displayName} width={80} height={80} className="object-cover" />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-full glass electric-border flex items-center justify-center">
              {chat.isGroup
                ? <Users className="w-8 h-8 text-electric/70" />
                : <span className="text-2xl font-display font-bold text-electric">{displayName[0]?.toUpperCase()}</span>
              }
            </div>
          )}
          {!chat.isGroup && otherUser?.status === 'online' && (
            <span className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-green-400 border-2 border-midnight-950" />
          )}
        </div>
        <h4 className="font-display font-bold text-white text-base">{displayName}</h4>
        {!chat.isGroup && otherUser?.contactId && (
          <p className="text-xs text-electric/70 font-mono mt-0.5">{otherUser.contactId}</p>
        )}
        {chat.isGroup && (
          <p className="text-xs text-white/40 font-body mt-0.5">{participants.length} members</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 px-4 py-4 border-b border-white/8">
        <button
          onClick={toggleMute}
          className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-xl transition-all text-xs font-display font-semibold ${
            muted ? 'bg-electric/15 text-electric' : 'glass text-white/50 hover:text-white'
          }`}
        >
          {muted ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
          {muted ? 'Unmute' : 'Mute'}
        </button>
        <button
          onClick={togglePin}
          className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-xl transition-all text-xs font-display font-semibold ${
            pinned ? 'bg-electric/15 text-electric' : 'glass text-white/50 hover:text-white'
          }`}
        >
          <Pin className="w-4 h-4" />
          {pinned ? 'Unpin' : 'Pin'}
        </button>
        <button className="flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-xl glass text-white/50 hover:text-white transition-all text-xs font-display font-semibold">
          <Archive className="w-4 h-4" />
          Archive
        </button>
      </div>

      {/* Members (groups) */}
      {chat.isGroup && (
        <div className="px-4 py-4 border-b border-white/8">
          <p className="text-xs font-display font-semibold text-white/35 uppercase tracking-widest mb-3">Members</p>
          <div className="space-y-2">
            {visibleParticipants.map((p) => (
              <div key={p.id} className="flex items-center gap-2.5">
                <Avatar src={p.avatar ?? null} name={p.displayName ?? '?'} size="sm" status={p.status} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-display font-medium text-white/85 truncate">{p.displayName}</p>
                </div>
                {chat.admins?.includes(p.id ?? '') && <Badge variant="electric">Admin</Badge>}
                {p.verificationLevel === 'blue' && <Shield className="w-3.5 h-3.5 text-electric flex-shrink-0" fill="currentColor" />}
              </div>
            ))}
          </div>
          {participants.length > 5 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="flex items-center gap-1 text-xs text-electric hover:underline font-body mt-3"
            >
              {showAll ? <><ChevronUp className="w-3 h-3" />Show less</> : <><ChevronDown className="w-3 h-3" />Show all {participants.length} members</>}
            </button>
          )}
        </div>
      )}

      {/* Screenshot policy */}
      <div className="px-4 py-4 border-b border-white/8">
        <div className="glass rounded-xl p-3 flex items-start gap-2.5">
          <Camera className="w-4 h-4 text-electric/70 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-display font-semibold text-white/70">Screenshot Policy</p>
            <p className="text-xs text-white/40 font-body mt-0.5">
              {chat.allowScreenshot
                ? 'Screenshots are allowed in this chat for record-keeping.'
                : 'Screenshots are restricted in this chat.'}
            </p>
          </div>
        </div>
      </div>

      {/* Danger */}
      <div className="px-4 py-4">
        <button className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-red-500/10 text-red-400/70 hover:text-red-400 transition-colors text-sm font-display font-medium">
          <Trash2 className="w-4 h-4" />
          Delete Chat
        </button>
      </div>
    </div>
  )
}
