import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { chatId, type, quality } = await req.json()

    // Create Daily.co room
    const dailyRes = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${process.env.DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        name:       `alok-${chatId}-${Date.now()}`,
        privacy:    'private',
        properties: {
          enable_chat:          false,
          enable_screenshare:   true,
          max_participants:     type === 'group' ? 20 : 2,
          enable_people_ui:     false,
          // 4K quality config
          ...(quality === '4k' ? {
            sfu_switchover:      0.5,
            simulcast:           true,
            bandwidth_efficient: false,
          } : {
            sfu_switchover:      0.5,
            simulcast:           true,
          }),
          exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiry
        },
      }),
    })

    if (!dailyRes.ok) {
      const err = await dailyRes.json()
      return NextResponse.json({ error: err.info ?? 'Failed to create room' }, { status: 500 })
    }

    const room = await dailyRes.json()

    // Log call to DB
    const { data: call, error } = await supabaseAdmin.from('calls').insert({
      chatId,
      initiatorId:   session.user.id,
      participants:  [session.user.id],
      type,
      quality,
      status:        'ringing',
      dailyRoomUrl:  room.url,
      dailyRoomName: room.name,
      isScreenSharing: false,
      isMuted:       false,
      cameraFacing:  'front',
      createdAt:     new Date().toISOString(),
    }).select().single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ roomUrl: room.url, roomName: room.name, callId: call.id })
  } catch (err) {
    console.error('[Calls API] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
