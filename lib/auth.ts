import { supabase } from './supabase'
import { generateContactId, generateSalt } from './gemini'
import type { User, AuthMethod } from '@/types'

// ─── Register with Phone (SMS OTP) ───────────────────────────────────────────

export async function registerWithPhone(phone: string): Promise<{ error?: string }> {
  const { error } = await supabase.auth.signInWithOtp({
    phone,
    options: { channel: 'sms' },
  })
  if (error) return { error: error.message }
  return {}
}

// ─── Verify Phone OTP ─────────────────────────────────────────────────────────

export async function verifyPhoneOtp(
  phone: string,
  token: string,
  displayName: string
): Promise<{ user?: User; error?: string }> {
  const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' })
  if (error || !data.user) return { error: error?.message ?? 'Verification failed.' }

  const salt = generateSalt()

  const { data: profile, error: profileErr } = await supabase
    .from('users')
    .upsert({
      id:           data.user.id,
      displayName,
      phone,
      authMethod:   'phone' as AuthMethod,
      salt,
      isVerified:   false,
      verificationLevel: 'none',
      role:         'user',
      status:       'online',
      isBanned:     false,
      createdAt:    new Date().toISOString(),
    })
    .select()
    .single()

  if (profileErr) return { error: profileErr.message }
  return { user: profile as User }
}

// ─── Register / Login with Gmail (OAuth) ─────────────────────────────────────

export async function signInWithGoogle(): Promise<{ error?: string }> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options:  { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback` },
  })
  if (error) return { error: error.message }
  return {}
}

// ─── Post-OAuth Profile Setup ─────────────────────────────────────────────────

export async function setupGmailProfile(userId: string, email: string, displayName: string): Promise<User | null> {
  const existingProfile = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (existingProfile.data) return existingProfile.data as User

  const contactId = generateContactId()
  const salt      = generateSalt()

  const { data, error } = await supabase
    .from('users')
    .insert({
      id:           userId,
      displayName,
      email,
      contactId,
      authMethod:   'gmail' as AuthMethod,
      salt,
      isVerified:   false,
      verificationLevel: 'none',
      role:         'user',
      status:       'online',
      isBanned:     false,
      createdAt:    new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('[Auth] Profile setup failed:', error.message)
    return null
  }

  return data as User
}

// ─── Sign Out ─────────────────────────────────────────────────────────────────

export async function signOut(): Promise<void> {
  // Mark offline before logout
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    await supabase.from('users').update({ status: 'offline', lastSeen: new Date().toISOString() }).eq('id', user.id)
  }
  await supabase.auth.signOut()
}

// ─── Get Current Session User ─────────────────────────────────────────────────

export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase.from('users').select('*').eq('id', user.id).single()
  return data as User | null
}

// ─── Update Online Status ─────────────────────────────────────────────────────

export async function setUserStatus(userId: string, status: User['status']): Promise<void> {
  await supabase.from('users').update({
    status,
    ...(status === 'offline' ? { lastSeen: new Date().toISOString() } : {}),
  }).eq('id', userId)
}

// ─── Check if User is Banned ──────────────────────────────────────────────────

export async function checkBanStatus(userId: string): Promise<{
  isBanned: boolean
  banLevel?: string
  banUntil?: string
  reason?: string
}> {
  const { data } = await supabase
    .from('users')
    .select('isBanned, banLevel, banUntil')
    .eq('id', userId)
    .single()

  if (!data?.isBanned) return { isBanned: false }

  // Check if ban has expired
  if (data.banUntil && new Date(data.banUntil) < new Date()) {
    await supabase.from('users').update({ isBanned: false, banLevel: null, banUntil: null }).eq('id', userId)
    return { isBanned: false }
  }

  return { isBanned: true, banLevel: data.banLevel, banUntil: data.banUntil }
}
