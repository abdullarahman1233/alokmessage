import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import {
  Users, MessageSquare, Shield, AlertTriangle,
  TrendingUp, Ban, Briefcase, Eye,
} from 'lucide-react'
import AiGuard from '@/components/AiGuard'
import AdminReportQueue from '@/components/admin/AdminReportQueue'
import AdminBanControls from '@/components/admin/AdminBanControls'
import type { DashboardStats } from '@/types'

export default async function AdminPage() {
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  // Guard: admin only
  const { data: user } = await supabase.from('users').select('role').eq('id', session.user.id).single()
  if (!user || !['admin', 'superadmin'].includes(user.role)) redirect('/chat')

  // Fetch dashboard stats
  const [
    { count: totalUsers    },
    { count: totalMessages },
    { count: totalReports  },
    { count: pendingReports},
    { count: bannedUsers   },
    { count: businessAccts },
    { count: aiScansToday  },
    { count: threatsBlocked},
  ] = await Promise.all([
    supabase.from('users'           ).select('*', { count: 'exact', head: true }),
    supabase.from('messages'        ).select('*', { count: 'exact', head: true }),
    supabase.from('reports'         ).select('*', { count: 'exact', head: true }),
    supabase.from('reports'         ).select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('users'           ).select('*', { count: 'exact', head: true }).eq('isBanned', true),
    supabase.from('business_profiles').select('*', { count: 'exact', head: true }),
    supabase.from('ai_guard_events' ).select('*', { count: 'exact', head: true }).gte('createdAt', new Date(Date.now() - 86400_000).toISOString()),
    supabase.from('ai_guard_events' ).select('*', { count: 'exact', head: true }).in('actionTaken', ['block', 'escalate']),
  ])

  const stats: DashboardStats = {
    totalUsers:      totalUsers      ?? 0,
    activeUsers:     0,
    totalMessages:   totalMessages   ?? 0,
    totalReports:    totalReports    ?? 0,
    pendingReports:  pendingReports  ?? 0,
    bannedUsers:     bannedUsers     ?? 0,
    businessAccounts:businessAccts  ?? 0,
    aiScansToday:    aiScansToday    ?? 0,
    threatsBlocked:  threatsBlocked  ?? 0,
  }

  return (
    <div className="min-h-dvh bg-app">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-white">Admin Control Tower</h1>
            <p className="text-white/40 text-sm font-body mt-1">Real-time AI Guard · Manual Controls · Global Audit Logs</p>
          </div>
          <div className="flex items-center gap-2 glass rounded-xl px-4 py-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-display font-semibold text-green-400">Systems Nominal</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Users,         label: 'Total Users',    value: stats.totalUsers,      color: 'text-electric',   bg: 'bg-electric/10'   },
            { icon: MessageSquare, label: 'Messages',       value: stats.totalMessages,   color: 'text-blue-400',   bg: 'bg-blue-400/10'   },
            { icon: AlertTriangle, label: 'Pending Reports',value: stats.pendingReports,  color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
            { icon: Ban,           label: 'Banned Users',   value: stats.bannedUsers,     color: 'text-red-400',    bg: 'bg-red-400/10'    },
            { icon: Shield,        label: 'AI Scans Today', value: stats.aiScansToday,    color: 'text-green-400',  bg: 'bg-green-400/10'  },
            { icon: Eye,           label: 'Threats Blocked',value: stats.threatsBlocked,  color: 'text-orange-400', bg: 'bg-orange-400/10' },
            { icon: Briefcase,     label: 'Businesses',     value: stats.businessAccounts,color: 'text-violet-400', bg: 'bg-violet-400/10' },
            { icon: TrendingUp,    label: 'Total Reports',  value: stats.totalReports,    color: 'text-pink-400',   bg: 'bg-pink-400/10'   },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <div key={label} className="admin-card">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
              </div>
              <p className={`font-display text-2xl font-bold ${color}`}>{value.toLocaleString()}</p>
              <p className="text-xs text-white/40 font-body mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Main panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* AI Guard */}
          <div className="admin-card">
            <AiGuard />
          </div>

          {/* Report Queue */}
          <div className="admin-card">
            <AdminReportQueue />
          </div>
        </div>

        {/* Ban Controls */}
        <div className="admin-card">
          <AdminBanControls />
        </div>
      </div>
    </div>
  )
}
