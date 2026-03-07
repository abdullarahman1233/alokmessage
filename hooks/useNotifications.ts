'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabaseBrowser } from '@/lib/supabase'
import type { AppNotification } from '@/types'

export function useNotifications(userId: string) {
  const supabase = supabaseBrowser()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unreadCount,   setUnreadCount]   = useState(0)

  const fetchNotifications = useCallback(async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('userId', userId)
      .order('createdAt', { ascending: false })
      .limit(30)
    setNotifications(data ?? [])
    setUnreadCount((data ?? []).filter((n) => !n.isRead).length)
  }, [userId, supabase])

  useEffect(() => {
    if (!userId) return
    fetchNotifications()

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'notifications',
          filter: `userId=eq.${userId}`,
        },
        (payload) => {
          const notif = payload.new as AppNotification
          setNotifications((prev) => [notif, ...prev])
          setUnreadCount((n) => n + 1)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId, supabase, fetchNotifications])

  const markAllRead = useCallback(async () => {
    await supabase
      .from('notifications')
      .update({ isRead: true })
      .eq('userId', userId)
      .eq('isRead', false)
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    setUnreadCount(0)
  }, [userId, supabase])

  const markRead = useCallback(async (notifId: string) => {
    await supabase.from('notifications').update({ isRead: true }).eq('id', notifId)
    setNotifications((prev) => prev.map((n) => n.id === notifId ? { ...n, isRead: true } : n))
    setUnreadCount((n) => Math.max(0, n - 1))
  }, [supabase])

  return { notifications, unreadCount, markAllRead, markRead, refetch: fetchNotifications }
}
