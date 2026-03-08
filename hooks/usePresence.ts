'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { supabaseBrowser } from '@/lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

// ─── Types ────────────────────────────────────────────────────────────────────

export type PresenceStatus = 'online' | 'away' | 'offline'

export interface UserPresence {
  userId:    string
  status:    PresenceStatus
  lastSeen:  string   // ISO timestamp
}

// ─── useOwnPresence ───────────────────────────────────────────────────────────

export function useOwnPresence(userId: string) {
  const supabase    = supabaseBrowser()
  const channelRef  = useRef<RealtimeChannel | null>(null)
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null)
  const statusRef   = useRef<PresenceStatus>('online')

  const broadcast = useCallback(async (status: PresenceStatus) => {
    if (!channelRef.current) return
    statusRef.current = status
    await channelRef.current.track({
      userId,
      status,
      lastSeen: new Date().toISOString(),
    })
  }, [userId])

  const persistStatus = useCallback(async (status: PresenceStatus) => {
    await supabase
      .from('users')
      .update({
        status,
        lastSeen: new Date().toISOString(),
      })
      .eq('id', userId)
  }, [userId, supabase])

  useEffect(() => {
    if (!userId) return

    const channel = supabase.channel(`presence:global`, {
      config: { presence: { key: userId } },
    })
    channelRef.current = channel
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await broadcast('online')
        await persistStatus('online')
      }
    })

    heartbeatRef.current = setInterval(async () => {
      await broadcast(statusRef.current)
    }, 30_000)

    function onVisibilityChange() {
      if (document.hidden) {
        broadcast('away')
        persistStatus('away')
      } else {
        broadcast('online')
        persistStatus('online')
      }
    }

    function onBlur()  { broadcast('away') }
    function onFocus() { broadcast('online'); persistStatus('online') }

    function onBeforeUnload() {
      persistStatus('offline')
      navigator.sendBeacon?.(
        `/api/users/presence`,
        JSON.stringify({ userId, status: 'offline' })
      )
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('blur',          onBlur)
    window.addEventListener('focus',         onFocus)
    window.addEventListener('beforeunload',  onBeforeUnload)

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current)
      broadcast('offline')
      persistStatus('offline')
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('blur',         onBlur)
      window.removeEventListener('focus',        onFocus)
      window.removeEventListener('beforeunload', onBeforeUnload)
      supabase.removeChannel(channel)
    }
  }, [userId, broadcast, persistStatus, supabase])
}

// ─── useUserPresence ──────────────────────────────────────────────────────────

export function useUserPresence(targetUserId: string): {
  status:   PresenceStatus
  lastSeen: string | null
  isOnline: boolean
} {
  const supabase     = supabaseBrowser()
  const [presence, setPresence] = useState<UserPresence>({
    userId:   targetUserId,
    status:   'offline',
    lastSeen: '',
  })

  useEffect(() => {
    if (!targetUserId) return

    supabase
      .from('users')
      .select('status, lastSeen')
      .eq('id', targetUserId)
      .single()
      .then(({ data }) => {
        if (data) {
          setPresence({
            userId:   targetUserId,
            status:   (data.status as PresenceStatus) ?? 'offline',
            lastSeen: data.lastSeen ?? '',
          })
        }
      })

    const channel = supabase.channel(`presence:global`, {
      config: { presence: { key: targetUserId } },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const entry = Object.values(state).flat().find((p: any) => p.userId === targetUserId)
        if (entry) {
          // ফাহিম ভাই, এখানে 'as unknown as' যোগ করা হয়েছে বিল্ড এরর সমাধানের জন্য।
          setPresence(entry as unknown as UserPresence)
        }
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        const entry = (newPresences as any[]).find((p: any) => p.userId === targetUserId)
        if (entry) setPresence(entry as unknown as UserPresence)
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        const entry = (leftPresences as any[]).find((p: any) => p.userId === targetUserId)
        if (entry) {
          setPresence((prev) => ({ ...prev, status: 'offline', lastSeen: entry.lastSeen }))
        }
      })
      .subscribe()

    const dbChannel = supabase
      .channel(`user-status:${targetUserId}`)
      .on(
        'postgres_changes',
        {
          event:  'UPDATE',
          schema: 'public',
          table:  'users',
          filter: `id=eq.${targetUserId}`,
        },
        (payload) => {
          const u = payload.new as { status: string; lastSeen: string }
          setPresence((prev) => ({
            ...prev,
            status:   (u.status as PresenceStatus) ?? prev.status,
            lastSeen: u.lastSeen ?? prev.lastSeen,
          }))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(dbChannel)
    }
  }, [targetUserId, supabase])

  return {
    status:   presence.status,
    lastSeen: presence.lastSeen || null,
    isOnline: presence.status === 'online',
  }
}

// ─── useGroupPresence ────────────────────────────────────────────────────────

export function useGroupPresence(participantIds: string[]): Record<string, PresenceStatus> {
  const supabase    = supabaseBrowser()
  const [statuses, setStatuses] = useState<Record<string, PresenceStatus>>({})

  useEffect(() => {
    if (!participantIds.length) return

    const channel = supabase.channel(`presence:global`)

    channel
      .on('presence', { event: 'sync' }, () => {
        const state  = channel.presenceState()
        const map: Record<string, PresenceStatus> = {}
        for (const entries of Object.values(state)) {
          for (const entry of entries as any[]) {
            if (participantIds.includes(entry.userId)) {
              map[entry.userId] = entry.status
            }
          }
        }
        for (const id of participantIds) {
          if (!map[id]) map[id] = 'offline'
        }
        setStatuses(map)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [participantIds.join(','), supabase])

  return statuses
}

// ─── formatLastSeen ───────────────────────────────────────────────────────────

export function formatLastSeen(lastSeen: string | null): string {
  if (!lastSeen) return 'Offline'
  const diff = Math.floor((Date.now() - new Date(lastSeen).getTime()) / 1000)

  if (diff < 60)      return 'Last seen just now'
  if (diff < 3600)    return `Last seen ${Math.floor(diff / 60)} min ago`
  if (diff < 8400)   return `Last seen ${Math.floor(diff / 3600)}h ago`
  if (diff < 604800)  return `Last seen ${Math.floor(diff / 86400)}d ago`
  return `Last seen ${new Date(lastSeen).toLocaleDateString('en', { month: 'short', day: 'numeric' })}`
}
