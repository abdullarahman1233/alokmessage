'use client'

import { useState } from 'react'
import { Flag, Shield, AlertTriangle, CheckCircle } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { supabaseBrowser } from '@/lib/supabase'
import toast from 'react-hot-toast'
import type { ReportReason } from '@/types'

interface Props {
  open:             boolean
  onClose:          () => void
  reportedUserId:   string
  reportedName:     string
  reporterId:       string
  chatId?:          string
  messageId?:       string
}

const REASONS: Array<{ value: ReportReason; label: string; desc: string; icon: string }> = [
  { value: 'spam',             label: 'Spam',             desc: 'Unwanted repetitive messages',       icon: '🚫' },
  { value: 'phishing',         label: 'Phishing',         desc: 'Malicious links or fake sites',      icon: '🎣' },
  { value: 'fraud',            label: 'Fraud / Scam',     desc: 'Financial deception or fake offers', icon: '💸' },
  { value: 'harassment',       label: 'Harassment',       desc: 'Threats, abuse, or bullying',        icon: '⚠️' },
  { value: 'explicit_content', label: 'Explicit Content', desc: 'Sexual or graphic material',         icon: '🔞' },
  { value: 'impersonation',    label: 'Impersonation',    desc: 'Pretending to be someone else',      icon: '🎭' },
  { value: 'other',            label: 'Other',            desc: 'Describe in your own words',         icon: '📋' },
]

export default function ReportModal({ open, onClose, reportedUserId, reportedName, reporterId, chatId, messageId }: Props) {
  const supabase              = supabaseBrowser()
  const [reason,   setReason] = useState<ReportReason | null>(null)
  const [desc,     setDesc]   = useState('')
  const [loading,  setLoading]= useState(false)
  const [submitted,setSubmitted] = useState(false)

  async function handleSubmit() {
    if (!reason) { toast.error('Please select a reason.'); return }
    setLoading(true)

    const { error } = await supabase.from('reports').insert({
      reporterId,
      reportedUserId,
      chatId:    chatId ?? null,
      messageId: messageId ?? null,
      reason,
      description: desc.trim() || null,
      status:    'pending',
      createdAt: new Date().toISOString(),
    })

    setLoading(false)

    if (error) {
      toast.error('Failed to submit report.')
      return
    }

    setSubmitted(true)
  }

  function handleClose() {
    onClose()
    setTimeout(() => { setReason(null); setDesc(''); setSubmitted(false) }, 300)
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={submitted ? undefined : `Report ${reportedName}`}
      subtitle={submitted ? undefined : 'Alok Guard reviews all reports fairly with AI + human oversight.'}
      size="md"
    >
      {submitted ? (
        <div className="flex flex-col items-center py-8 gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-green-500/15 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <div>
            <h3 className="font-display font-bold text-white text-lg mb-1">Report Submitted</h3>
            <p className="text-sm text-white/50 font-body max-w-xs">
              Alok Guard has received your report and will begin AI review immediately.
              Thank you for keeping the platform safe.
            </p>
          </div>
          <div className="flex items-center gap-2 glass rounded-xl px-4 py-2.5 mt-2">
            <Shield className="w-4 h-4 text-electric" />
            <span className="text-xs font-display font-semibold text-electric">AI Review in Progress</span>
          </div>
          <Button variant="glass" fullWidth onClick={handleClose} className="mt-2">Close</Button>
        </div>
      ) : (
        <div className="space-y-4 mt-4">
          {/* Reason grid */}
          <div className="space-y-1.5">
            {REASONS.map((r) => (
              <button
                key={r.value}
                onClick={() => setReason(r.value)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all ${
                  reason === r.value
                    ? 'bg-red-500/15 border border-red-500/30'
                    : 'glass hover:bg-white/8'
                }`}
              >
                <span className="text-lg flex-shrink-0">{r.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-display font-semibold ${reason === r.value ? 'text-red-400' : 'text-white/80'}`}>
                    {r.label}
                  </p>
                  <p className="text-xs text-white/35 font-body">{r.desc}</p>
                </div>
                <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all ${
                  reason === r.value ? 'border-red-400 bg-red-400' : 'border-white/20'
                }`}>
                  {reason === r.value && <div className="w-full h-full rounded-full scale-50 bg-white" />}
                </div>
              </button>
            ))}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-display font-semibold text-white/50 uppercase tracking-widest mb-2">
              Additional Details (Optional)
            </label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="input-glass resize-none"
              rows={3}
              placeholder="Provide any additional context that will help Alok Guard review this report…"
              maxLength={500}
            />
            <p className="text-[10px] text-white/25 font-body mt-1 text-right">{desc.length}/500</p>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 glass rounded-xl p-3">
            <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-white/50 font-body">
              Filing false reports violates platform rules and may result in restrictions on your own account.
            </p>
          </div>

          <div className="flex gap-3 pt-1">
            <Button variant="glass"  fullWidth onClick={handleClose}>Cancel</Button>
            <Button
              variant="danger"
              fullWidth
              loading={loading}
              disabled={!reason}
              onClick={handleSubmit}
              icon={<Flag className="w-4 h-4" />}
            >
              Submit Report
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
