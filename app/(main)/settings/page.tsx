import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()

  const { data: user } = await supabase
    .from('users')
    .select('*, businessProfile(*)')
    .eq('id', session!.user.id)
    .single()

  return <SettingsClient user={user} />
}
