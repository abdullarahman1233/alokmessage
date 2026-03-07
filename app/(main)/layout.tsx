import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import Sidebar from '@/components/Sidebar'
import PresenceProvider from '@/components/PresenceProvider'

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) redirect('/auth/login')

  // Fetch user profile
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single()

  if (!profile) redirect('/auth/login')

  // Check ban status
  if (profile.isBanned && profile.banLevel === 'permanent') {
    redirect('/banned')
  }

  return (
    <div className="chat-layout">
      {/* Bootstraps real-time presence for the logged-in user */}
      <PresenceProvider userId={session.user.id} />
      <Sidebar user={profile} />
      <main className="relative flex flex-col overflow-hidden bg-app">
        {children}
      </main>
    </div>
  )
}
