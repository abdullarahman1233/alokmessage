'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabaseBrowser } from '@/lib/supabase'
import { setUserStatus } from '@/lib/auth'
import type { User } from '@/types'

export function useAuth() {
  const [user, setUser]         = useState<User | null>(null)
  const [loading, setLoading]   = useState(true)
  const supabase                = supabaseBrowser()

  const fetchProfile = useCallback(async (authUserId: string) => {
    const { data } = await supabase.from('users').select('*').eq('id', authUserId).single()
    setUser(data as User | null)
  }, [supabase])

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id)
        setUserStatus(session.user.id, 'online')
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await fetchProfile(session.user.id)
        await setUserStatus(session.user.id, 'online')
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
      }
    })

    // Set offline on page unload
    const handleUnload = () => {
      if (user?.id) setUserStatus(user.id, 'offline')
    }
    window.addEventListener('beforeunload', handleUnload)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('beforeunload', handleUnload)
    }
  }, [fetchProfile, supabase, user?.id])

  return { user, loading, isAuthenticated: !!user }
}
