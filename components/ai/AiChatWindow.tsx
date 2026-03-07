'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Phone, Sparkles, Send, Mic,
  MicOff, Globe, Shield, Info, Zap,
} from 'lucide-react'
import { useRealtimeMessages } from '@/hooks/useRealtime'
import { supabaseBrowser } from '@/lib/supabase'
import {
  streamToAiContact, buildGeminiHistory,
  AI_CONTACT_PROFILE, AiChatHistoryItem,
} from '@/lib/ai-contact'
import AiContactBubble from './AiContactBubble'
import MessageBubble from '@/components/chat/MessageBubble'
import toast from 'react-hot-toast'
import type { Chat, Message } from '@/types'

interface Props {
  chat:            Chat
  initialMessages: Message[]
  currentUserId:   string
}

export default function AiChatWindow({ chat, initialMessages, currentUserId }: Props) {
  const router   = useRouter()
  const supabase = supabaseBrowser()

  const { messages, setMessages } = useRealtimeMessages(chat.id, initialMessages)

  const [input,        setInput]        = useState('')
  const [streaming,    setStreaming]     = useState(false)
  const [streamText,   setStreamText]   = useState('')
  const [streamMsgId,  setStreamMsgId]  = useState<string | null>(null)
  const [showInfo,     setShowInfo]     = useState(false)

  const bottomRef  = useRef<HTMLDivElement>(null)
  const inputRef   = useRef<HTMLTextAreaElement>(null)
  const streamRef  = useRef('')  // accumulate stream text without re-rendering loop

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamText])

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`
    }
  }, [input])

  const sendMessage = useCallback(async () => {
    const content = input.trim()
    if (!content || streaming) return

    setInput('')
    setStreaming(true)
    setStreamText('')
    streamRef.current = ''

    // 1. Persist user message
    const { data: userMsg } = await supabase.from('messages').insert({
      chat_id:   chat.id,
      senderId:  currentUserId,
      content,
      type:      'text',
      status:    'read',   // AI always reads instantly
      isDeleted: false,
      isEdited:  false,
      createdAt: new Date().toISOString(),
    }).select().single()

    if (userMsg) {
      setMessages((prev) => [...prev, userMsg as Message])
    }

    // 2. Build conversation history for Gemini context
    const history: AiChatHistoryItem[] = buildGeminiHistory(
      [...messages, userMsg as Message].filter(Boolean),
      currentUserId
    )

    // 3. Create a placeholder AI message for streaming
    const placeholderId = `streaming-${Date.now()}`
    setStreamMsgId(placeholderId)

    // 4. Stream response
    let finalText = ''
    await streamToAiContact(
      content,
      history,
      (chunk) => {
        streamRef.current += chunk
        setStreamText(streamRef.current)
      },
      async (fullText) => {
        finalText = fullText
        setStreaming(false)
        setStreamMsgId(null)
        setStreamText('')

        // Persist AI message
        const { data: aiMsg } = await supabase.from('messages').insert({
          chat_id:   chat.id,
          senderId:  AI_CONTACT_PROFILE.id,
          content:   fullText,
          type:      'text',
          status:    'delivered',
          isDeleted: false,
          isEdited:  false,
          createdAt: new Date().toISOString(),
        }).select().single()

        if (aiMsg) setMessages((prev) => [...prev, aiMsg as Message])

        // Update chat last activity
        await supabase.from('chats').update({ lastActivity: new Date().toISOString() }).eq('id', chat.id)
      },
      (err) => {
        setStreaming(false)
        setStreamMsgId(null)
        setStreamText('')
        toast.error(`AI response failed: ${err}`)
      }
    )
  }, [input, streaming, chat.id, currentUserId, messages, supabase, setMessages])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  function startVoiceCall() {
    router.push(`/calls/active?chatId=${chat.id}&type=audio&quality=hd&isAiCall=true`)
  }

  return (
    <div className="flex flex-col h-full relative">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="flex items-center gap-3 px-4 py-3.5 border-b border-white/8 glass-dark flex-shrink-0 z-10">
        <button onClick={() => router.push('/chat')} className="md:hidden w-8 h-8 rounded-lg hover:bg-white/8 flex items-center justify-center text-white/50 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>

        {/* AI Avatar — real Gemini avatar with breathing glow */}
        <div className="relative flex-shrink-0">
          <GeminiAvatar size="md" breathing={!streaming} />
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-midnight-950 shadow-[0_0_6px_#22c55e]" />
        </div>

        {/* Name */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h2 className="font-display font-semibold text-white text-sm">Gemini 3 Pro</h2>
            <GoldenSparkBadge size="xs" />
            <div className="flex items-center gap-1 bg-electric/10 border border-electric/20 rounded-full px-1.5 py-0.5">
              <Shield className="w-2.5 h-2.5 text-electric" fill="currentColor" />
              <span className="text-[8px] font-display font-bold text-electric uppercase tracking-wider">Official</span>
            </div>
          </div>
          <p className="text-[11px] text-white/40 font-body truncate">
            {streaming
              ? <span className="text-electric animate-pulse flex items-center gap-1"><Zap className="w-2.5 h-2.5 inline" /> Generating response…</span>
              : 'Ultra-Fast AI · Any language · No limits'
            }
          </p>
        </div>

        {/* Header actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={startVoiceCall}
            className="w-9 h-9 rounded-xl hover:bg-electric/15 flex items-center justify-center text-white/50 hover:text-electric transition-colors"
            title="Start AI voice call"
          >
            <Phone className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowInfo(!showInfo)}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${showInfo ? 'bg-electric/15 text-electric' : 'hover:bg-white/8 text-white/50 hover:text-white'}`}
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ── Info panel ──────────────────────────────────────────────────── */}
      {showInfo && (
        <div className="glass-dark border-b border-white/8 px-4 py-3 animate-slide-up">
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Globe,  label: 'Any Language',  desc: 'Auto-detects your language'  },
              { icon: Zap,    label: 'No Limits',      desc: 'Unlimited messages & length' },
              { icon: Shield, label: 'E2E Encrypted',  desc: 'Zero third-party data leak'  },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="glass rounded-xl p-2.5 text-center">
                <Icon className="w-4 h-4 text-electric mx-auto mb-1" />
                <p className="text-xs font-display font-semibold text-white/80">{label}</p>
                <p className="text-[10px] text-white/35 font-body mt-0.5">{desc}</p>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-white/30 font-body text-center mt-2">
            Virtual number: <span className="font-mono text-electric/70">{AI_CONTACT_PROFILE.phone}</span>
            {' · '}Contact ID: <span className="font-mono text-electric/70">#0000</span>
          </p>
        </div>
      )}

      {/* ── Messages ────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {messages.map((msg) => {
          const isOwn   = msg.senderId === currentUserId
          const isAi    = msg.senderId === AI_CONTACT_PROFILE.id

          if (isAi) {
            return (
              <AiContactBubble
                key={msg.id}
                content={msg.content}
                createdAt={msg.createdAt}
              />
            )
          }

          return (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={isOwn}
              sender={isAi ? AI_CONTACT_PROFILE as any : undefined}
              showAvatar={false}
              allowScreenshot={true}
            />
          )
        })}

        {/* Live streaming bubble */}
        {streaming && streamText && (
          <AiContactBubble
            key={streamMsgId ?? 'streaming'}
            content={streamText}
            isStreaming={true}
            createdAt={new Date().toISOString()}
          />
        )}

        {/* Thinking indicator (before first chunk) */}
        {streaming && !streamText && (
          <div className="flex items-start gap-2.5 pr-12">
            <GeminiLogo size="md" animated={true} />
            <div className="glass rounded-2xl rounded-tl-sm px-4 py-3 border border-electric/15">
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-electric/60 animate-bounce"
                       style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
                <span className="text-xs text-white/35 font-body ml-1">Gemini 3 Pro is thinking…</span>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Quick Prompts ────────────────────────────────────────────────── */}
      {messages.length <= 2 && !streaming && (
        <div className="px-4 pb-3">
          <p className="text-[10px] text-white/25 font-body uppercase tracking-widest mb-2">Try asking…</p>
          <div className="flex flex-wrap gap-2">
            {[
              'What can you help me with?',
              'Explain quantum computing simply',
              'Review my business idea',
              'আমাকে বাংলায় সাহায্য করো',
            ].map((prompt) => (
              <button
                key={prompt}
                onClick={() => { setInput(prompt); inputRef.current?.focus() }}
                className="text-xs glass rounded-full px-3 py-1.5 text-white/55 hover:text-electric hover:border-electric/30 transition-all font-body border border-transparent"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Input Bar ───────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 p-3 border-t border-white/8 glass-dark">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              rows={1}
              placeholder="Ask Gemini 3 Pro anything…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={streaming}
              className="input-glass resize-none pr-10 leading-relaxed py-2.5 min-h-[42px] max-h-[120px] disabled:opacity-60"
              style={{ overflow: input.split('\n').length > 2 ? 'auto' : 'hidden' }}
            />
            <div className="absolute right-2.5 bottom-2.5 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-electric/40" title="Multi-language enabled" />
            </div>
          </div>

          <button
            onClick={sendMessage}
            disabled={!input.trim() || streaming}
            className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
              input.trim() && !streaming
                ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white shadow-electric-sm'
                : 'bg-white/6 text-white/25 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        <p className="text-center text-[10px] text-white/20 font-body mt-2">
          No message limits · E2EE session · Powered by Gemini 3 Pro
        </p>
      </div>
    </div>
  )
}
