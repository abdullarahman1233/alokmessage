'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { supabaseBrowser } from '@/lib/supabase'
import type { Message, Chat } from '@/types'

// ─── Real-time Messages ───────────────────────────────────────────────────────

export function useRealtimeMessages(chatId: string, initialMessages: Message[] = []) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const supabase = supabaseBrowser()

  const addMessage = useCallback((msg: Message) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev
      return [...prev, msg]
    })
  }, [])

  useEffect(() => {
    if (!chatId) return

    const channel = supabase
      .channel(`messages:${chatId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
        (payload) => addMessage(payload.new as Message)
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
        (payload) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === (payload.new as Message).id ? (payload.new as Message) : m))
          )
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [chatId, supabase, addMessage])

  return { messages, setMessages }
}

// ─── Real-time Chat List ──────────────────────────────────────────────────────

export function useRealtimeChats(userId: string, initialChats: Chat[] = []) {
  const [chats, setChats] = useState<Chat[]>(initialChats)
  const supabase = supabaseBrowser()

  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel(`chats:${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chats' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const chat = payload.new as Chat
            if (chat.participants?.includes(userId)) {
              setChats((prev) => [chat, ...prev])
            }
          } else if (payload.eventType === 'UPDATE') {
            setChats((prev) =>
              prev.map((c) => (c.id === (payload.new as Chat).id ? (payload.new as Chat) : c))
            )
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId, supabase])

  return { chats, setChats }
}

// ─── Typing Indicator ─────────────────────────────────────────────────────────

export function useTypingIndicator(chatId: string, userId: string) {
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const supabase    = supabaseBrowser()
  const timerRef    = useRef<NodeJS.Timeout>()

  const broadcastTyping = useCallback(async () => {
    await supabase.channel(`typing:${chatId}`).send({
      type:    'broadcast',
      event:   'typing',
      payload: { userId },
    })
  }, [chatId, userId, supabase])

  useEffect(() => {
    const channel = supabase
      .channel(`typing:${chatId}`)
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.userId === userId) return
        setTypingUsers((prev) => [...new Set([...prev, payload.userId])])
        clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => {
          setTypingUsers((prev) => prev.filter((id) => id !== payload.userId))
        }, 3000)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      clearTimeout(timerRef.current)
    }
  }, [chatId, userId, supabase])

  return { typingUsers, broadcastTyping }
}
