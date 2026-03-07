import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import BusinessHub from '@/components/business/BusinessHub'

export default async function BusinessPage() {
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()

  const { data: profile } = await supabase
    .from('users')
    .select('*, businessProfile(*)')
    .eq('id', session!.user.id)
    .single()

  const hasBusiness = !!profile?.businessProfile

  if (!hasBusiness) {
    // Redirect to setup
    const { data: setupRedirect } = await supabase
      .from('business_profiles')
      .select('id')
      .eq('userId', session!.user.id)
      .single()

    return <BusinessHub profile={null} userId={session!.user.id} />
  }

  return <BusinessHub profile={profile.businessProfile} userId={session!.user.id} />
}
