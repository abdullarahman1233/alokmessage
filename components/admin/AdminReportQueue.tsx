'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, CheckCircle, XCircle, Clock, Shield } from 'lucide-react'
import { supabaseBrowser } from '@/lib/supabase'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import type { Report } from '@/types'

export default function AdminReportQueue() {
  const supabase              = supabaseBrowser()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('reports')
        .select('*')
        .in('status', ['pending', 'ai_reviewing'])
        .order('createdAt', { ascending: false })
        .limit(20)
      setReports(data ?? [])
      setLoading(false)
    }
    load()
  }, [supabase])

  async function resolve(reportId: string, action: 'action_taken' | 'dismissed') {
    const { error } = await supabase
      .from('reports')
      .update({ status: action, resolvedAt: new Date().toISOString() })
      .eq('id', reportId)

    if (error) {
      toast.error('Failed to update report.')
      return
    }

    setReports((prev) => prev.filter((r) => r.id !== reportId))
    toast.success(action === 'action_taken' ? 'Action taken.' : 'Report dismissed.')
  }

  const REASON_LABELS: Record<string, string> = {
    spam:             'Spam',
    phishing:         'Phishing',
    fraud:            'Fraud',
    harassment:       'Harassment',
    explicit_content: 'Explicit Content',
    impersonation:    'Impersonation',
    other:            'Other',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-400" />
          <h3 className="font-display font-bold text-white">Report Queue</h3>
          <span className="bg-yellow-400/15 text-yellow-400 text-[10px] font-display font-bold px-2 py-0.5 rounded-full border border-yellow-400/30">
            {reports.length} pending
          </span>
        </div>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto">
        {loading && Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="glass rounded-xl p-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg shimmer flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-1/2 shimmer rounded" />
                <div className="h-2 w-2/3 shimmer rounded" />
              </div>
            </div>
          </div>
        ))}

        {!loading && reports.length === 0 && (
          <div className="text-center py-8">
            <CheckCircle className="w-10 h-10 text-green-400/30 mx-auto mb-2" />
            <p className="text-white/25 text-sm font-body">No pending reports. Platform is healthy.</p>
          </div>
        )}

        {!loading && reports.map((report) => (
          <div key={report.id} className="glass rounded-xl p-4 hover:bg-white/5 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-display font-bold text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 rounded px-1.5 py-0.5">
                    {REASON_LABELS[report.reason] ?? report.reason}
                  </span>
                  {report.status === 'ai_reviewing' && (
                    <span className="flex items-center gap-1 text-[10px] text-electric font-display font-semibold">
                      <Shield className="w-3 h-3" />
                      AI reviewing
                    </span>
                  )}
                </div>
                {report.description && (
                  <p className="text-xs text-white/50 font-body truncate">{report.description}</p>
                )}
                <p className="text-[10px] text-white/25 font-mono mt-1">
                  <Clock className="w-2.5 h-2.5 inline mr-1" />
                  {format(new Date(report.createdAt), 'MMM d, HH:mm')}
                </p>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={() => resolve(report.id, 'action_taken')}
                  className="w-8 h-8 rounded-lg bg-red-500/15 hover:bg-red-500/25 flex items-center justify-center text-red-400 transition-colors"
                  title="Take action"
                >
                  <XCircle className="w-4 h-4" />
                </button>
                <button
                  onClick={() => resolve(report.id, 'dismissed')}
                  className="w-8 h-8 rounded-lg bg-green-500/15 hover:bg-green-500/25 flex items-center justify-center text-green-400 transition-colors"
                  title="Dismiss"
                >
                  <CheckCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
