import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, category, desc } = await req.json()

  const { data, error } = await supabaseAdmin.from('business_profiles').insert({
    userId:            session.user.id,
    businessName:      name,
    category,
    description:       desc,
    isVerified:        false,
    verifiedBadge:     false,
    totalSales:        0,
    successfulSales:   0,
    rating:            0,
    reviewCount:       0,
    reviews:           [],
    allowsScreenshots: true,
    analytics: {
      dailySales:         [],
      weeklySales:        [],
      monthlySales:       [],
      totalRevenue:       0,
      avgOrderValue:      0,
      conversionRate:     0,
      topProducts:        [],
      seasonalComparison: [],
    },
    createdAt: new Date().toISOString(),
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Link to user
  await supabaseAdmin.from('users').update({ businessProfile: data.id }).eq('id', session.user.id)

  return NextResponse.json({ business: data })
}
