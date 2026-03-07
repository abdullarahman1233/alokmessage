'use client'

import { useEffect, useCallback, useRef } from 'react'
import { supabaseBrowser } from '@/lib/supabase'

// ─── useReadReceipt ───────────────────────────────────────────────────────────
//
// Responsibilities:
//  1. Mark all unread messages in a chat as 'read' when the window is focused.
//  2. Listen for incoming messages and mark them read immediately if focused.
//  3. Update the chat's unreadCount to 0.
//
// Does NOT touch AI Guard, Business, or Gemini message records.

export function useReadReceipt(
  chatId:        string,
  currentUserId: string,
  isFocused:     boolean,
) {
  const supabase   = supabaseBrowser()
  const pending    = useRef(false)        // debounce guard
  const timerRef   = useRef<NodeJS.Timeout | null>(null)

  const markAllRead = useCallback(async () => {
    if (pending.current) return
    pending.current = true

    // ── 1. Bulk-update messages: set status='read' for all unread inbound ──
    await supabase
      .from('messages')
      .update({ status: 'read' })
      .eq('chat_id', chatId)
      .neq('senderId', currentUserId)   // only messages from others
      .neq('status', 'read')            // skip already-read ones
      .eq('isDeleted', false)

    // ── 2. Reset unread counter on the chat row ────────────────────────────
    await supabase
      .from('chats')
      .update({ unreadCount: 0 })
      .eq('id', chatId)

    pending.current = false
  }, [chatId, currentUserId, supabase])

  // ── Mark read when focused ─────────────────────────────────────────────────
  useEffect(() => {
    if (!chatId || !currentUserId) return
    if (!isFocused) return

    // Small debounce (200ms) to batch rapid focus events
    timerRef.current = setTimeout(() => { markAllRead() }, 200)
    return () => { clearTimeout(timerRef.current!) }
  }, [isFocused, chatId, currentUserId, markAllRead])

  // ── Mark any NEW incoming message read immediately if window is open ───────
  useEffect(() => {
    if (!chatId || !currentUserId) return

    const channel = supabase
      .channel(`read-receipt:${chatId}:${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        async (payload) => {
          const msg = payload.new as { senderId: string; id: string }
          // Only mark if: it's from another user AND we're in the window
          if (msg.senderId !== currentUserId && isFocused) {
            await supabase
              .from('messages')
              .update({ status: 'read' })
              .eq('id', msg.id)
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [chatId, currentUserId, isFocused, supabase])
}

// ─── useDeliveryStatus ────────────────────────────────────────────────────────
//
// Upgrades 'sent' → 'delivered' for messages you sent,
// as soon as the recipient's device comes online.
//
// This runs as a passive background listener in the sender's ChatWindow.

export function useDeliveryStatus(
  chatId:        string,
  currentUserId: string,
) {
  const supabase = supabaseBrowser()

  useEffect(() => {
    if (!chatId || !currentUserId) return

    // Listen for recipient coming online via presence
    const channel = supabase
      .channel(`delivery:${chatId}`)
      .on(
        'postgres_changes',
        {
          event:  'UPDATE',
          schema: 'public',
          table:  'users',
        },
        async (payload) => {
          const user = payload.new as { id: string; status: string }
          if (user.status !== 'online') return

          // Upgrade sent → delivered for messages in this chat to this user
          await supabase
            .from('messages')
            .update({ status: 'delivered' })
            .eq('chat_id', chatId)
            .eq('senderId', currentUserId)
            .eq('status', 'sent')
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [chatId, currentUserId, supabase])
}
