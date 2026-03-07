'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  User, Shield, Bell, Lock, Smartphone, Palette,
  HelpCircle, LogOut, ChevronRight, Moon, Volume2,
  Database, Trash2, Download, Eye, EyeOff, Check,
  AlertTriangle, Briefcase,
} from 'lucide-react'
import { Avatar }  from '@/components/ui/Avatar'
import { Badge }   from '@/components/ui/Badge'
import { Button }  from '@/components/ui/Button'
import { Modal }   from '@/components/ui/Modal'
import EditProfileModal from '@/components/profile/EditProfileModal'
import { supabaseBrowser } from '@/lib/supabase'
import { signOut } from '@/lib/auth'
import toast from 'react-hot-toast'
import type { User as UserType } from '@/types'

interface Props { user: UserType }

interface SettingRow {
  icon:      typeof User
  label:     string
  desc?:     string
  value?:    string | boolean
  toggle?:   boolean
  danger?:   boolean
  onClick?:  () => void
  badge?:    string
}

export default function SettingsClient({ user: initialUser }: Props) {
  const router = useRouter()
  const supabase = supabaseBrowser()

  const [user, setUser]               = useState<UserType>(initialUser)
  const [editOpen, setEditOpen]       = useState(false)
  const [deleteOpen, setDeleteOpen]   = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [loading, setLoading]         = useState(false)

  // Preferences state
  const [prefs, setPrefs] = useState({
    notifications:    true,
    soundEnabled:     true,
    readReceipts:     true,
    onlineVisible:    true,
    darkMode:         true,
    mediaAutoDownload: true,
  })

  function togglePref(key: keyof typeof prefs) {
    setPrefs((p) => ({ ...p, [key]: !p[key] }))
    toast.success(`${key} ${!prefs[key] ? 'enabled' : 'disabled'}.`)
  }

  async function handleLogout() {
    await signOut()
    router.push('/auth/login')
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== user.displayName) {
      toast.error(`Type your display name "${user.displayName}" to confirm.`)
      return
    }
    setLoading(true)
    // Mark account for deletion
    await supabase.from('users').update({ isBanned: true, banLevel: 'permanent' }).eq('id', user.id)
    await signOut()
    router.push('/auth/login')
  }

  async function handleExportData() {
    toast.success('Data export started. You\'ll receive a link via email.')
  }

  const PROFILE_SECTION: SettingRow[] = [
    {
      icon: User, label: 'Edit Profile',
      desc: 'Name, bio, nickname, photos',
      onClick: () => setEditOpen(true),
    },
    {
      icon: Briefcase, label: 'Business Profile',
      desc: user.businessProfile ? 'Manage your business' : 'Set up business account',
      onClick: () => router.push('/business'),
      badge: user.businessProfile ? 'Active' : undefined,
    },
  ]

  const PRIVACY_SECTION: SettingRow[] = [
    {
      icon: Eye, label: 'Online Status Visible',
      desc: 'Others can see when you\'re online',
      toggle: true, value: prefs.onlineVisible,
      onClick: () => togglePref('onlineVisible'),
    },
    {
      icon: Check, label: 'Read Receipts',
      desc: 'Show when you\'ve read messages',
      toggle: true, value: prefs.readReceipts,
      onClick: () => togglePref('readReceipts'),
    },
    {
      icon: Lock, label: 'Two-Factor Auth',
      desc: 'Extra security for your account',
      badge: 'Recommended',
    },
  ]

  const NOTIFICATION_SECTION: SettingRow[] = [
    {
      icon: Bell, label: 'Push Notifications',
      toggle: true, value: prefs.notifications,
      onClick: () => togglePref('notifications'),
    },
    {
      icon: Volume2, label: 'Notification Sounds',
      toggle: true, value: prefs.soundEnabled,
      onClick: () => togglePref('soundEnabled'),
    },
  ]

  const STORAGE_SECTION: SettingRow[] = [
    {
      icon: Database, label: 'Media Auto-Download',
      desc: 'Save photos and videos automatically',
      toggle: true, value: prefs.mediaAutoDownload,
      onClick: () => togglePref('mediaAutoDownload'),
    },
    {
      icon: Download, label: 'Export My Data',
      desc: 'Download all chats and media',
      onClick: handleExportData,
    },
  ]

  const DANGER_SECTION: SettingRow[] = [
    {
      icon: Trash2, label: 'Delete Account',
      desc: 'Permanently remove your account and all data',
      danger: true,
      onClick: () => setDeleteOpen(true),
    },
  ]

  function SectionHeader({ label }: { label: string }) {
    return (
      <p className="text-xs font-display font-semibold text-white/35 uppercase tracking-widest px-1 mb-2 mt-6 first:mt-0">
        {label}
      </p>
    )
  }

  function SettingItem({ row }: { row: SettingRow }) {
    const Icon = row.icon
    return (
      <button
        onClick={row.onClick}
        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left transition-all ${
          row.danger
            ? 'hover:bg-red-500/10'
            : 'glass-card hover:border-white/20'
        } mb-1.5`}
      >
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
          row.danger ? 'bg-red-500/15' : 'bg-white/8'
        }`}>
          <Icon className={`w-4.5 h-4.5 ${row.danger ? 'text-red-400' : 'text-white/60'}`} strokeWidth={1.5} />
        </div>

        <div className="flex-1 min-w-0">
          <p className={`text-sm font-display font-semibold ${row.danger ? 'text-red-400' : 'text-white/90'}`}>
            {row.label}
          </p>
          {row.desc && <p className="text-xs text-white/35 font-body mt-0.5 truncate">{row.desc}</p>}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {row.badge && <Badge variant="electric">{row.badge}</Badge>}
          {row.toggle ? (
            <div className={`w-10 h-5.5 rounded-full transition-all duration-200 relative ${
              row.value ? 'bg-electric' : 'bg-white/15'
            }`}>
              <div className={`absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white transition-all duration-200 shadow-sm ${
                row.value ? 'left-[calc(100%-1.25rem)]' : 'left-0.5'
              }`} />
            </div>
          ) : (
            !row.danger && <ChevronRight className="w-4 h-4 text-white/25" />
          )}
        </div>
      </button>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">

      {/* Header */}
      <div className="p-6 border-b border-white/8 flex-shrink-0">
        <h2 className="font-display text-xl font-bold text-white">Settings</h2>
        <p className="text-sm text-white/40 font-body mt-0.5">Account, privacy, and preferences</p>
      </div>

      <div className="flex-1 p-5 max-w-xl">

        {/* Profile card */}
        <div
          className="glass-card rounded-3xl p-5 flex items-center gap-4 cursor-pointer hover:border-electric/20 transition-all mb-6"
          onClick={() => router.push(`/profile/${user.id}`)}
        >
          <Avatar src={user.avatar} name={user.displayName} size="lg" status={user.status} verified={user.verificationLevel === 'blue'} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="font-display font-bold text-white truncate">{user.displayName}</h3>
              {user.verificationLevel === 'blue' && <Badge variant="verified" dot>Verified</Badge>}
            </div>
            <p className="text-sm text-white/40 font-mono truncate">{user.contactId ?? user.phone}</p>
            {user.bio && <p className="text-xs text-white/35 font-body mt-1 truncate">{user.bio}</p>}
          </div>
          <ChevronRight className="w-4 h-4 text-white/25 flex-shrink-0" />
        </div>

        {/* Profile */}
        <SectionHeader label="Profile" />
        {PROFILE_SECTION.map((r) => <SettingItem key={r.label} row={r} />)}

        {/* Privacy */}
        <SectionHeader label="Privacy & Security" />
        {PRIVACY_SECTION.map((r) => <SettingItem key={r.label} row={r} />)}

        {/* Notifications */}
        <SectionHeader label="Notifications" />
        {NOTIFICATION_SECTION.map((r) => <SettingItem key={r.label} row={r} />)}

        {/* Storage */}
        <SectionHeader label="Storage & Data" />
        {STORAGE_SECTION.map((r) => <SettingItem key={r.label} row={r} />)}

        {/* Help */}
        <SectionHeader label="Support" />
        <button className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl glass-card hover:border-white/20 transition-all mb-1.5">
          <div className="w-9 h-9 rounded-xl bg-white/8 flex items-center justify-center">
            <HelpCircle className="w-4.5 h-4.5 text-white/60" strokeWidth={1.5} />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-display font-semibold text-white/90">Help & Support</p>
            <p className="text-xs text-white/35 font-body mt-0.5">Report bugs and get help</p>
          </div>
          <ChevronRight className="w-4 h-4 text-white/25" />
        </button>

        {/* Version */}
        <div className="flex items-center justify-center gap-2 py-4">
          <Shield className="w-3.5 h-3.5 text-electric/40" />
          <p className="text-xs text-white/20 font-body">Alok Message v1.0.0 — Hyper-Security Fortress 2026</p>
        </div>

        {/* Danger Zone */}
        <SectionHeader label="Account" />
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl glass-card hover:border-white/20 transition-all mb-1.5"
        >
          <div className="w-9 h-9 rounded-xl bg-white/8 flex items-center justify-center">
            <LogOut className="w-4.5 h-4.5 text-white/60" strokeWidth={1.5} />
          </div>
          <p className="text-sm font-display font-semibold text-white/90 flex-1 text-left">Sign Out</p>
        </button>

        {DANGER_SECTION.map((r) => <SettingItem key={r.label} row={r} />)}
      </div>

      {/* Edit profile modal */}
      <EditProfileModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        user={user}
        onUpdate={(updated) => setUser((p) => ({ ...p, ...updated }))}
      />

      {/* Delete account modal */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Account"
        subtitle="This action is permanent and cannot be undone."
        size="sm"
      >
        <div className="space-y-4 mt-4">
          <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-300/80 font-body space-y-1">
              <p>• All your messages will be deleted</p>
              <p>• Your contact ID will be permanently retired</p>
              <p>• Business profile and reviews will be removed</p>
              <p>• This cannot be recovered</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-display font-semibold text-white/50 uppercase tracking-widest mb-2">
              Type your display name to confirm
            </label>
            <input
              type="text"
              placeholder={user.displayName}
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              className="input-glass"
            />
          </div>

          <div className="flex gap-3">
            <Button variant="glass"  fullWidth onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button
              variant="danger"
              fullWidth
              loading={loading}
              disabled={deleteConfirm !== user.displayName}
              onClick={handleDeleteAccount}
              icon={<Trash2 className="w-4 h-4" />}
            >
              Delete Forever
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
