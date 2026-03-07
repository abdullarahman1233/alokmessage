'use client'

import { useState } from 'react'
import { VerifiedBadge } from '@/components/ui/BrandingAssets'
import {
  Briefcase, Star, TrendingUp, Shield, Award,
  BarChart2, Users, ShoppingBag, Plus, CheckCircle,
} from 'lucide-react'
import type { BusinessProfile } from '@/types'

interface Props {
  profile: BusinessProfile | null
  userId:  string
}

export default function BusinessHub({ profile, userId }: Props) {
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'reviews'>('overview')

  if (!profile) {
    return <BusinessSetup userId={userId} />
  }

  const salesProgress = Math.min((profile.successfulSales / 200) * 100, 100)
  const needsForBadge = Math.max(0, 200 - profile.successfulSales)

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="p-6 border-b border-white/8">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl glass electric-border overflow-hidden flex items-center justify-center">
              {profile.logo ? (
                <img src={profile.logo} alt={profile.businessName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-display font-bold text-electric">{profile.businessName[0]}</span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="font-display font-bold text-white text-lg">{profile.businessName}</h2>
                {profile.verifiedBadge && (
                  <VerifiedBadge size="sm" tooltip={true} />
                )}
              </div>
              <p className="text-sm text-white/50 font-body">{profile.category}</p>
              <div className="flex items-center gap-1 mt-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="w-3.5 h-3.5"
                    fill={i < Math.floor(profile.rating) ? '#fcd34d' : 'transparent'}
                    stroke={i < Math.floor(profile.rating) ? '#fcd34d' : 'rgba(255,255,255,0.2)'}
                  />
                ))}
                <span className="text-xs text-white/40 font-body ml-1">({profile.reviewCount})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Blue Badge Progress */}
        {!profile.verifiedBadge && (
          <div className="mt-4 glass rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-electric/70" />
                <span className="text-xs font-display font-semibold text-white/60">Blue Verified Badge Progress</span>
              </div>
              <span className="text-xs font-mono text-electric">{profile.successfulSales}/200 sales</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${salesProgress}%`, background: 'linear-gradient(90deg, #00d4ff, #4fc3f7)' }}
              />
            </div>
            <p className="text-[10px] text-white/30 font-body mt-1.5">{needsForBadge} more successful sales for auto-verification</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/8 px-4">
        {([
          { key: 'overview',   label: 'Overview',  icon: Briefcase  },
          { key: 'analytics',  label: 'Analytics', icon: BarChart2  },
          { key: 'reviews',    label: 'Reviews',   icon: Star       },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-4 py-3.5 text-sm font-display font-medium border-b-2 transition-all ${
              activeTab === key
                ? 'border-electric text-electric'
                : 'border-transparent text-white/40 hover:text-white/70'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 p-6">

        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: ShoppingBag, label: 'Total Sales',    value: profile.totalSales,     color: 'text-white'       },
                { icon: CheckCircle, label: 'Successful',     value: profile.successfulSales, color: 'text-green-400'  },
                { icon: Users,       label: 'Reviews',        value: profile.reviewCount,     color: 'text-electric'   },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="admin-card text-center">
                  <Icon className={`w-5 h-5 mx-auto mb-2 ${color} opacity-70`} />
                  <p className={`font-display text-xl font-bold ${color}`}>{value.toLocaleString()}</p>
                  <p className="text-xs text-white/35 font-body mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            <div className="glass-card rounded-2xl p-4">
              <h4 className="font-display font-semibold text-white/80 text-sm mb-2">About</h4>
              <p className="text-sm text-white/50 font-body leading-relaxed">{profile.description}</p>
            </div>

            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="block glass-card rounded-2xl p-4 hover:border-electric/30 transition-all"
              >
                <p className="text-sm font-display font-semibold text-electric">{profile.website}</p>
                <p className="text-xs text-white/35 font-body mt-0.5">Official Website</p>
              </a>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-4">
            <div className="glass-card rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-electric" />
                <h4 className="font-display font-semibold text-white/80 text-sm">Daily Sales (Last 7 days)</h4>
              </div>
              <div className="flex items-end gap-2 h-24">
                {profile.analytics?.dailySales?.slice(-7).map((stat, i) => {
                  const max  = Math.max(...(profile.analytics?.dailySales?.map((s) => s.sales) ?? [1]))
                  const pct  = (stat.sales / max) * 100
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t-lg transition-all duration-500"
                        style={{
                          height:     `${pct}%`,
                          background: 'linear-gradient(180deg, #00d4ff, #0077be)',
                          minHeight:  '4px',
                        }}
                      />
                      <span className="text-[9px] text-white/30 font-mono">
                        {new Date(stat.date).toLocaleDateString('en', { weekday: 'short' })}
                      </span>
                    </div>
                  )
                })}
                {!profile.analytics?.dailySales?.length && (
                  <p className="text-white/25 text-sm font-body text-center w-full">No data yet</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="admin-card">
                <p className="text-xs text-white/40 font-body mb-1">Avg Order Value</p>
                <p className="font-display text-lg font-bold text-white">${profile.analytics?.avgOrderValue?.toFixed(2) ?? '0.00'}</p>
              </div>
              <div className="admin-card">
                <p className="text-xs text-white/40 font-body mb-1">Conversion Rate</p>
                <p className="font-display text-lg font-bold text-electric">{profile.analytics?.conversionRate?.toFixed(1) ?? '0'}%</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-3">
            {profile.reviews?.length === 0 && (
              <div className="text-center py-12">
                <Star className="w-10 h-10 text-white/15 mx-auto mb-3" />
                <p className="text-white/30 text-sm font-body">No reviews yet. Complete sales to earn your first review.</p>
              </div>
            )}
            {profile.reviews?.map((review) => (
              <div key={review.id} className="glass-card rounded-2xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-display font-semibold text-sm text-white">{review.reviewerName}</p>
                    <div className="flex items-center gap-0.5 mt-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="w-3 h-3" fill={i < review.rating ? '#fcd34d' : 'transparent'} stroke={i < review.rating ? '#fcd34d' : 'rgba(255,255,255,0.2)'} />
                      ))}
                    </div>
                  </div>
                  <span className="text-[10px] text-white/30 font-body">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {review.text && <p className="text-sm text-white/55 font-body leading-relaxed">{review.text}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Business Setup Form ──────────────────────────────────────────────────────

function BusinessSetup({ userId }: { userId: string }) {
  const [name,     setName]     = useState('')
  const [category, setCategory] = useState('')
  const [desc,     setDesc]     = useState('')
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    // POST to API route to create business profile
    const res = await fetch('/api/business/create', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ userId, name, category, desc }),
    })
    setLoading(false)
    if (res.ok) window.location.reload()
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl glass electric-border flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-8 h-8 text-electric" />
          </div>
          <h2 className="font-display text-2xl font-bold text-white mb-1">Open Your Business</h2>
          <p className="text-sm text-white/40 font-body">Professional. Verified. AI-Protected.</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card rounded-3xl p-8 space-y-5">
          <div>
            <label className="block text-xs font-display font-semibold text-white/50 uppercase tracking-widest mb-2">Business Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-glass focus-ring" placeholder="Your business name" required />
          </div>
          <div>
            <label className="block text-xs font-display font-semibold text-white/50 uppercase tracking-widest mb-2">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-glass focus-ring" required>
              <option value="">Select a category</option>
              {['Retail', 'Technology', 'Food & Beverage', 'Fashion', 'Services', 'Health', 'Education', 'Finance', 'Other'].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-display font-semibold text-white/50 uppercase tracking-widest mb-2">Description</label>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} className="input-glass focus-ring resize-none" rows={3} placeholder="Tell customers about your business…" required />
          </div>

          <div className="flex items-start gap-3 glass rounded-xl p-3">
            <Shield className="w-4 h-4 text-electric flex-shrink-0 mt-0.5" />
            <p className="text-xs text-white/50 font-body">
              Earn your <span className="text-electric font-semibold">Blue Verified Badge</span> automatically after 200 successful sales. Screenshots are enabled for transaction records.
            </p>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Plus className="w-4 h-4" /> Create Business</>}
          </button>
        </form>
      </div>
    </div>
  )
}
