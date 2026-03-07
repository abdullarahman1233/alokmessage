// ─── Auth & User ─────────────────────────────────────────────────────────────

export type AuthMethod = 'phone' | 'gmail'

export interface User {
  id: string
  displayName: string
  avatar?: string
  authMethod: AuthMethod
  phone?: string
  email?: string
  /** 4-digit random contact ID for Gmail users: e.g. "#4829" */
  contactId?: string
  bio?: string
  isVerified: boolean
  verificationLevel: 'none' | 'blue'   // Blue = 200+ sales
  businessProfile?: BusinessProfile
  role: 'user' | 'admin' | 'superadmin'
  status: 'online' | 'away' | 'offline'
  lastSeen?: string
  createdAt: string
  isBanned: boolean
  banLevel?: BanLevel
  banUntil?: string
  passwordHash?: string  // bcrypt hashed
  salt?: string          // 8-char salt
  deviceId?: string
  ipAddress?: string
}

// ─── Chat & Messages ──────────────────────────────────────────────────────────

export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'file' | 'sticker' | 'system'
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed'

export interface Message {
  id: string
  chatId: string
  senderId: string
  content: string
  type: MessageType
  status: MessageStatus
  mediaUrl?: string
  mediaSize?: number
  mediaMimeType?: string
  replyToId?: string
  isDeleted: boolean
  isEdited: boolean
  aiScanResult?: AiScanResult
  createdAt: string
  editedAt?: string
}

export interface Chat {
  id: string
  name?: string
  isGroup: boolean
  avatar?: string
  participants: string[]  // user IDs
  admins?: string[]
  lastMessage?: Message
  lastActivity: string
  isMuted: boolean
  isArchived: boolean
  isPinned: boolean
  unreadCount: number
  allowScreenshot: boolean
  createdAt: string
}

// ─── AI Guard ─────────────────────────────────────────────────────────────────

export type ThreatLevel = 'safe' | 'suspicious' | 'danger' | 'critical'

export interface AiScanResult {
  threatLevel: ThreatLevel
  confidence: number         // 0–100
  reasons: string[]
  isPhishing: boolean
  isFraud: boolean
  isExplicit: boolean
  isBankingInfo: boolean     // IGNORED by AI (privacy blindspot)
  action: 'allow' | 'warn' | 'block' | 'escalate'
  scannedAt: string
}

export type BanLevel = 'readonly' | 'suspended_7d' | 'suspended_15d' | 'suspended_30d' | 'permanent'

export interface BanRecord {
  id: string
  userId: string
  level: BanLevel
  reason: string
  issuedBy: 'ai' | 'admin'
  aiConfidence?: number
  reportId?: string
  createdAt: string
  expiresAt?: string
}

export interface Report {
  id: string
  reporterId: string
  reportedUserId: string
  chatId?: string
  messageId?: string
  reason: ReportReason
  description?: string
  evidence?: string[]
  status: 'pending' | 'ai_reviewing' | 'action_taken' | 'dismissed'
  aiVerdict?: AiScanResult
  adminNotes?: string
  createdAt: string
  resolvedAt?: string
}

export type ReportReason =
  | 'spam'
  | 'phishing'
  | 'fraud'
  | 'harassment'
  | 'explicit_content'
  | 'impersonation'
  | 'other'

// ─── Business ─────────────────────────────────────────────────────────────────

export interface BusinessProfile {
  id: string
  userId: string
  businessName: string
  category: string
  description: string
  website?: string
  address?: string
  logo?: string
  isVerified: boolean
  verifiedBadge: boolean   // Auto at 200 sales
  totalSales: number
  successfulSales: number
  rating: number           // 1–5 stars
  reviewCount: number
  reviews: Review[]
  analytics: BusinessAnalytics
  allowsScreenshots: boolean  // always true for records
  createdAt: string
}

export interface Review {
  id: string
  businessId: string
  reviewerId: string
  reviewerName: string
  reviewerAvatar?: string
  rating: number   // 1–5
  text?: string
  createdAt: string
}

export interface BusinessAnalytics {
  dailySales: DailyStat[]
  weeklySales: WeeklyStat[]
  monthlySales: MonthlyStat[]
  totalRevenue: number
  avgOrderValue: number
  conversionRate: number
  topProducts: string[]
  seasonalComparison: SeasonalStat[]
}

export interface DailyStat  { date: string; sales: number; revenue: number }
export interface WeeklyStat { week: string; sales: number; revenue: number }
export interface MonthlyStat{ month: string; sales: number; revenue: number }
export interface SeasonalStat{ season: string; currentYear: number; lastYear: number }

// ─── Calls ────────────────────────────────────────────────────────────────────

export type CallType    = 'audio' | 'video'
export type CallStatus  = 'ringing' | 'active' | 'ended' | 'missed' | 'declined'
export type CallQuality = 'hd' | '4k'

export interface Call {
  id: string
  chatId: string
  initiatorId: string
  participants: string[]
  type: CallType
  quality: CallQuality
  status: CallStatus
  dailyRoomUrl?: string
  dailyRoomName?: string
  isScreenSharing: boolean
  isMuted: boolean
  cameraFacing: 'front' | 'back'
  duration?: number  // seconds
  startedAt?: string
  endedAt?: string
  createdAt: string
}

// ─── Notifications ────────────────────────────────────────────────────────────

export interface AppNotification {
  id: string
  userId: string
  type: 'message' | 'call' | 'mention' | 'system' | 'business'
  title: string
  body: string
  avatarUrl?: string
  chatId?: string
  isRead: boolean
  createdAt: string
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export interface AuditLog {
  id: string
  adminId: string
  action: string
  targetId?: string
  targetType?: 'user' | 'chat' | 'message'
  metadata?: Record<string, unknown>
  ipAddress: string
  createdAt: string
}

export interface DashboardStats {
  totalUsers: number
  activeUsers: number
  totalMessages: number
  totalReports: number
  pendingReports: number
  bannedUsers: number
  businessAccounts: number
  aiScansToday: number
  threatsBlocked: number
}
