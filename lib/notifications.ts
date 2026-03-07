import { supabaseAdmin } from './supabase'
import type { AppNotification } from '@/types'

// ─── Create Notification ──────────────────────────────────────────────────────

export async function createNotification(
  userId: string,
  notification: Omit<AppNotification, 'id' | 'userId' | 'isRead' | 'createdAt'>
): Promise<void> {
  await supabaseAdmin.from('notifications').insert({
    userId,
    ...notification,
    isRead:    false,
    createdAt: new Date().toISOString(),
  })
}

// ─── Bulk Notify (Group messages etc.) ───────────────────────────────────────

export async function notifyParticipants(
  participantIds: string[],
  excludeId:      string,
  notification:   Omit<AppNotification, 'id' | 'userId' | 'isRead' | 'createdAt'>
): Promise<void> {
  const inserts = participantIds
    .filter((id) => id !== excludeId)
    .map((userId) => ({
      userId,
      ...notification,
      isRead:    false,
      createdAt: new Date().toISOString(),
    }))

  if (inserts.length) {
    await supabaseAdmin.from('notifications').insert(inserts)
  }
}

// ─── Mark as Read ─────────────────────────────────────────────────────────────

export async function markNotificationsRead(userId: string, chatId?: string): Promise<void> {
  const query = supabaseAdmin
    .from('notifications')
    .update({ isRead: true })
    .eq('userId', userId)
    .eq('isRead', false)

  if (chatId) {
    query.eq('chatId', chatId)
  }

  await query
}

// ─── Get Unread Count ─────────────────────────────────────────────────────────

export async function getUnreadCount(userId: string): Promise<number> {
  const { count } = await supabaseAdmin
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('userId', userId)
    .eq('isRead', false)

  return count ?? 0
}
