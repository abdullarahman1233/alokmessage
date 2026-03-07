'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  Phone, Video, MoreVertical, ArrowLeft, Shield,
  Paperclip, Smile, Send, Info, X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { supabaseBrowser } from '@/lib/supabase'
import { useRealtimeMessages, useTypingIndicator } from '@/hooks/useRealtime'
import MessageBubble from './MessageBubble'
import MediaUpload from './MediaUpload'
import type { Chat, Message, User } from '@/types'
import { useReadReceipt, useDeliveryStatus } from '@/hooks/useReadReceipt'
import { useUserPresence, useGroupPresence, formatLastSeen } from '@/hooks/usePresence'
import { PresenceDot, PresenceBadge } from '@/components/ui/PresenceDot'

interface Props {
  chat:            Chat
  initialMessages: Message[]
  participants:    Partial<User>[]
  currentUserId:   string
}

export default function ChatWindow({ chat, initialMessages, participants, currentUserId }: Props) {
  const router  = useRouter()
  const supabase = supabaseBrowser()

  const { messages }              = useRealtimeMessages(chat.id, initialMessages)
  const { typingUsers, broadcastTyping } = useTypingIndicator(chat.id, currentUserId)

  const [input,     setInput]     = useState('')
  const [sending,   setSending]   = useState(false)
  const [showUpload,setShowUpload]= useState(false)
  const bottomRef                 = useRef<HTMLDivElement>(null)
  const inputRef                  = useRef<HTMLTextAreaElement>(null)

  // ── Presence & Read Receipts ────────────────────────────────────────────
  const [isFocused, setIsFocused] = useState(true)

  // Live presence for the other person in DMs
  const otherUserId = !chat.isGroup
    ? (chat.participants?.find((id: string) => id !== currentUserId) ?? '')
    : ''
  const { status: liveStatus, lastSeen: liveLastSeen } = useUserPresence(otherUserId)

  // Group presence map
  const groupStatuses = useGroupPresence(
    chat.isGroup ? (chat.participants ?? []).filter((id: string) => id !== currentUserId) : []
  )

  // Mark messages as read when focused; upgrade sent→delivered passively
  useReadReceipt(chat.id, currentUserId, isFocused)
  useDeliveryStatus(chat.id, currentUserId)

  // Track window/tab focus
  useEffect(() => {
    function onFocus() { setIsFocused(true)  }
    function onBlur()  { setIsFocused(false) }
    window.addEventListener('focus', onFocus)
    window.addEventListener('blur',  onBlur)
    return () => {
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('blur',  onBlur)
    }
  }, [])

  // Auto scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`
    }
  }, [input])

  const sendMessage = useCallback(async () => {
    const content = input.trim()
    if (!content || sending) return

    setSending(true)
    setInput('')

    const { error } = await supabase.from('messages').insert({
      chat_id:   chat.id,
      senderId:  currentUserId,
      content,
      type:      'text',
      status:    'sending',
      isDeleted: false,
      isEdited:  false,
      createdAt: new Date().toISOString(),
    })

    if (error) {
      toast.error('Failed to send message.')
      setInput(content)
    }

    // Update chat last activity
    await supabase.from('chats').update({ lastActivity: new Date().toISOString() }).eq('id', chat.id)
    setSending(false)
  }, [input, sending, chat.id, currentUserId, supabase])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value)
    broadcastTyping()
  }

  async function startCall(type: 'audio' | 'video') {
    router.push(`/calls/active?chatId=${chat.id}&type=${type}`)
  }

  // Find the other participant for DMs
  const otherUser = !chat.isGroup
    ? participants.find((p) => p.id !== currentUserId)
    : null

  const headerName   = chat.name ?? otherUser?.displayName ?? 'Unknown'
  const headerAvatar = chat.avatar ?? otherUser?.avatar
  // headerStatus now comes from useUserPresence for real-time updates
  const headerStatus = chat.isGroup ? 'online' : liveStatus

  const typingLabel = typingUsers.length > 0
    ? `${typingUsers.length === 1 ? 'Typing' : `${typingUsers.length} people typing`}…`
    : null

  return (
    <div className="flex flex-col h-full relative">

      {/* ── Header ───────────────────────────────────────────────────── */}
      <header className="flex items-center gap-3 px-4 py-3.5 border-b border-white/8 glass-dark flex-shrink-0 z-10">
        <button
          onClick={() => router.push('/chat')}
          className="md:hidden w-8 h-8 rounded-lg hover:bg-white/8 flex items-center justify-center text-white/50 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        {/* Avatar */}
        <div className="relative cursor-pointer" onClick={() => {}}>
          <div className="w-10 h-10 rounded-full glass overflow-hidden">
            {headerAvatar ? (
              <Image src={headerAvatar} alt={headerName} width={40} height={40} className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-500/15 to-blue-700/15 font-display font-bold text-electric">
                {headerName[0]?.toUpperCase()}
              </div>
            )}
          </div>
          {!chat.isGroup && (
            <div className="absolute -bottom-0.5 -right-0.5 border-2 border-midnight-950 rounded-full">
              <PresenceDot status={liveStatus} size="sm" />
            </div>
          )}
        </div>

        {/* Name + status */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h2 className="font-display font-semibold text-white text-sm truncate">{headerName}</h2>
            {otherUser?.verificationLevel === 'blue' && (
              <Shield className="w-3.5 h-3.5 text-electric flex-shrink-0" fill="currentColor" />
            )}
          </div>
          <p className="text-xs font-body">
            {typingLabel
              ? <span className="text-electric animate-pulse">{typingLabel}</span>
              : chat.isGroup
                ? <span className="text-white/40">{participants.length} members</span>
                : <PresenceBadge status={liveStatus} lastSeen={liveLastSeen} />
            }
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => startCall('audio')}
            className="w-9 h-9 rounded-xl hover:bg-white/8 flex items-center justify-center text-white/50 hover:text-white transition-colors"
          >
            <Phone className="w-4 h-4" />
          </button>
          <button
            onClick={() => startCall('video')}
            className="w-9 h-9 rounded-xl hover:bg-electric/15 flex items-center justify-center text-white/50 hover:text-electric transition-colors"
          >
            <Video className="w-4 h-4" />
          </button>
          <button className="w-9 h-9 rounded-xl hover:bg-white/8 flex items-center justify-center text-white/50 hover:text-white transition-colors">
            <Info className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ── Messages ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1" style={{ backgroundImage: 'var(--tw-bg-mesh-chat)' }}>
        {messages.map((msg, i) => {
          const sender    = participants.find((p) => p.id === msg.senderId)
          const isOwn     = msg.senderId === currentUserId
          const prevMsg   = messages[i - 1]
          const showAvatar = !isOwn && (
            !prevMsg || prevMsg.senderId !== msg.senderId ||
            new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() > 60_000
          )

          return (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={isOwn}
              sender={sender}
              showAvatar={showAvatar}
              allowScreenshot={chat.allowScreenshot}
            />
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* ── Input Bar ────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 p-3 border-t border-white/8 glass-dark">
        {showUpload && (
          <MediaUpload
            chatId={chat.id}
            senderId={currentUserId}
            onClose={() => setShowUpload(false)}
          />
        )}

        <div className="flex items-end gap-2">
          <button
            onClick={() => setShowUpload(!showUpload)}
            className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
              showUpload ? 'bg-electric/20 text-electric' : 'hover:bg-white/8 text-white/40 hover:text-white/70'
            }`}
          >
            {showUpload ? <X className="w-4 h-4" /> : <Paperclip className="w-4 h-4" />}
          </button>

          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              rows={1}
              placeholder="Message…"
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className="input-glass resize-none pr-10 leading-relaxed py-2.5 min-h-[42px] max-h-[120px]"
              style={{ overflow: input.split('\n').length > 2 ? 'auto' : 'hidden' }}
            />
            <button className="absolute right-3 bottom-2.5 text-white/25 hover:text-white/60 transition-colors">
              <Smile className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
              input.trim()
                ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white electric-glow shadow-electric-sm'
                : 'bg-white/6 text-white/25 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
