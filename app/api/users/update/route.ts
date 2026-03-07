import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'
import { z } from 'zod'

const UpdateSchema = z.object({
  displayName: z.string().min(1).max(40).optional(),
  nickname:    z.string().max(20).optional().nullable(),
  bio:         z.string().max(160).optional().nullable(),
  avatar:      z.string().url().optional().nullable(),
  coverPhoto:  z.string().url().optional().nullable(),
  status:      z.enum(['online', 'away', 'offline']).optional(),
})

export async function PATCH(req: NextRequest) {
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('users')
    .update(parsed.data)
    .eq('id', session.user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
