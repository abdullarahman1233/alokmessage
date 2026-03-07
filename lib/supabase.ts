import { createClient } from '@supabase/supabase-js'
import { createClientComponentClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// ─── Environment Validation ───────────────────────────────────────────────────

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseService = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseAnon) {
  throw new Error('[Alok Message] Missing Supabase environment variables.')
}

// ─── Client-side Supabase (Browser) ──────────────────────────────────────────

export const supabaseBrowser = () => createClientComponentClient()

// ─── Server-side Supabase (Server Components / Route Handlers) ───────────────

export const supabaseServer = () =>
  createServerComponentClient({ cookies })

// ─── Service Role Client (Admin / AI Guard operations) ───────────────────────

export const supabaseAdmin = createClient(supabaseUrl, supabaseService, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ─── Public Client (Unauthenticated, limited access) ─────────────────────────

export const supabase = createClient(supabaseUrl, supabaseAnon)

// ─── Realtime Subscriptions Helper ───────────────────────────────────────────

export function subscribeToChat(
  chatId: string,
  onMessage: (payload: unknown) => void
) {
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
  const { error } = await supabase.storage.from(bucket).remove([path])
  if (error) {
    console.error('[Supabase Storage] Delete failed:', error.message)
    return false
  }
  return true
}
