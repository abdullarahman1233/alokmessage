import { createClient } from '@supabase/supabase-js'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// ─── Environment Validation ───────────────────────────────────────────────────

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseService = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// ─── Client-side Supabase (Browser) ──────────────────────────────────────────

// ফাহিম ভাই, এখানে সরাসরি createClientComponentClient() কল করায় সে এনভায়রনমেন্ট ভেরিয়েবল না পেলে এরর দিচ্ছিল।
export const supabaseBrowser = () => {
  if (!supabaseUrl || !supabaseAnon) {
    console.warn('[Alok Message] Supabase keys missing in browser context.')
  }
  return createClientComponentClient()
}

// ─── Service Role Client (Admin / AI Guard operations) ───────────────────────

export const supabaseAdmin = (supabaseUrl && supabaseService)
  ? createClient(supabaseUrl, supabaseService, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : (null as any)

// ─── Public Client (Unauthenticated, limited access) ─────────────────────────

export const supabase = (supabaseUrl && supabaseAnon) 
  ? createClient(supabaseUrl, supabaseAnon)
  : (null as any)

// ─── Realtime Subscriptions Helper ───────────────────────────────────────────

export function subscribeToChat(
  chatId: string,
  onMessage: (payload: unknown) => void
) {
  if (!supabase) return () => {}
  const channel = supabase
    .channel(`chat:${chatId}`)
    .on(
      'postgres_changes',
      {
        event:  'INSERT',
        schema: 'public',
        table:  'messages',
        filter: `chat_id=eq.${chatId}`,
      },
      onMessage
    )
    .subscribe()

  return () => supabase.removeChannel(channel)
}

export function subscribeToUserPresence(
  userId: string,
  onUpdate: (payload: unknown) => void
) {
  if (!supabase) return () => {}
  const channel = supabase
    .channel(`presence:${userId}`)
    .on(
      'postgres_changes',
      {
        event:  'UPDATE',
        schema: 'public',
        table:  'users',
        filter: `id=eq.${userId}`,
      },
      onUpdate
    )
    .subscribe()

  return () => supabase.removeChannel(channel)
}

// ─── Storage Helpers ──────────────────────────────────────────────────────────

export async function uploadMedia(
  file: File,
  bucket: 'chat-media' | 'avatars' | 'business-assets',
  path: string
): Promise<string | null> {
  if (!supabase) return null
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    console.error('[Supabase Storage] Upload failed:', error.message)
    return null
  }

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path)

  return publicUrl
}

export async function deleteMedia(
  bucket: 'chat-media' | 'avatars' | 'business-assets',
  path: string
): Promise<boolean> {
  if (!supabase) return false
  const { error } = await supabase.storage.from(bucket).remove([path])
  if (error) {
    console.error('[Supabase Storage] Delete failed:', error.message)
    return false
  }
  return true
}
