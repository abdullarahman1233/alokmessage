import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_ROUTES   = ['/auth/login', '/auth/register', '/auth/callback', '/banned']
const ADMIN_ROUTES    = ['/admin']

export async function middleware(req: NextRequest) {
  const res      = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const { data: { session } } = await supabase.auth.getSession()

  const path = req.nextUrl.pathname

  // Allow public routes
  if (PUBLIC_ROUTES.some((r) => path.startsWith(r))) {
    // If already logged in, redirect away from auth pages
    if (session && path.startsWith('/auth')) {
      return NextResponse.redirect(new URL('/chat', req.url))
    }
    return res
  }

  // Require auth for everything else
  if (!session) {
    const loginUrl = new URL('/auth/login', req.url)
    loginUrl.searchParams.set('next', path)
    return NextResponse.redirect(loginUrl)
  }

  // Admin route protection
  if (ADMIN_ROUTES.some((r) => path.startsWith(r))) {
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (!user || !['admin', 'superadmin'].includes(user.role)) {
      return NextResponse.redirect(new URL('/chat', req.url))
    }
  }

  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|og-image.png).*)',
  ],
}
