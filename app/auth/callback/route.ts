import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { setupGmailProfile } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code  = searchParams.get('code')
  const next  = searchParams.get('next') ?? '/chat'

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      const email       = data.user.email!
      const displayName = data.user.user_metadata?.full_name ?? email.split('@')[0]
      await setupGmailProfile(data.user.id, email, displayName)
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=callback_failed`)
}
