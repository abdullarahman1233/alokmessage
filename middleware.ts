import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_ROUTES   = ['/auth/login', '/auth/register', '/auth/callback', '/banned']
const ADMIN_ROUTES    = ['/admin']

export async function middleware(req: NextRequest) {
  const res      = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const { data: { session } } = await supabase.auth.getSession()
  const path = req.nextUrl.pathname

  // ফাহিম ভাই, রুট (/) পাথে আসলে সরাসরি চ্যাটে পাঠানোর জন্য এই চেকটি যোগ করলাম
  if (path === '/') {
    return NextResponse.redirect(new URL(session ? '/chat' : '/auth/login', req.url))
  }

  // পাবলিক রুট চেক
  if (PUBLIC_ROUTES.some((r) => path.startsWith(r))) {
    // যদি সেশন থাকে এবং ইউজার আবার লগইন পেজে যেতে চায়, তাকে চ্যাটে পাঠান
    if (session) {
      return NextResponse.redirect(new URL('/chat', req.url))
    }
    return res
  }

  // সেশন না থাকলে এবং পাবলিক রুট না হলে তাকে লগইন পেজে পাঠান
  if (!session) {
    const loginUrl = new URL('/auth/login', req.url)
    // এখানে রিডাইরেক্ট লুপ এড়াতে 'next' প্যারামিটারটি সাবধানে হ্যান্ডেল করা হয়েছে
    if (path !== '/auth/login') {
      loginUrl.searchParams.set('next', path)
    }
    return NextResponse.redirect(loginUrl)
  }

  // অ্যাডমিন প্রোটেকশন
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
    /*
     * নিচের পাথগুলো বাদে সব জায়গায় মিডলওয়্যার কাজ করবে:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, icons, og-image.png (public files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|icons|og-image.png).*)',
  ],
}
