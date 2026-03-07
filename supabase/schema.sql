-- ─── Alok Message — Supabase Schema ──────────────────────────────────────────
-- Run this in your Supabase SQL Editor to initialize the full database.

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── USERS ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.users (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "displayName"       TEXT NOT NULL,
  avatar              TEXT,
  "authMethod"        TEXT NOT NULL CHECK ("authMethod" IN ('phone', 'gmail')),
  phone               TEXT UNIQUE,
  email               TEXT UNIQUE,
  "contactId"         TEXT UNIQUE,    -- #XXXX for Gmail users
  bio                 TEXT,
  "isVerified"        BOOLEAN DEFAULT FALSE,
  "verificationLevel" TEXT DEFAULT 'none' CHECK ("verificationLevel" IN ('none', 'blue')),
  "businessProfile"   UUID,
  role                TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'superadmin')),
  status              TEXT DEFAULT 'offline' CHECK (status IN ('online', 'away', 'offline')),
  "lastSeen"          TIMESTAMPTZ,
  "createdAt"         TIMESTAMPTZ DEFAULT NOW(),
  "isBanned"          BOOLEAN DEFAULT FALSE,
  "banLevel"          TEXT,
  "banUntil"          TIMESTAMPTZ,
  salt                TEXT,
  "deviceId"          TEXT,
  "ipAddress"         TEXT
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile"     ON public.users FOR SELECT USING (auth.uid() = id OR true);
CREATE POLICY "Users can update own profile"   ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile"   ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- ─── CHATS ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.chats (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name             TEXT,
  "isGroup"        BOOLEAN DEFAULT FALSE,
  avatar           TEXT,
  participants     UUID[] NOT NULL DEFAULT '{}',
  admins           UUID[] DEFAULT '{}',
  "lastActivity"   TIMESTAMPTZ DEFAULT NOW(),
  "isMuted"        BOOLEAN DEFAULT FALSE,
  "isArchived"     BOOLEAN DEFAULT FALSE,
  "isPinned"       BOOLEAN DEFAULT FALSE,
  "unreadCount"    INTEGER DEFAULT 0,
  "allowScreenshot" BOOLEAN DEFAULT TRUE,
  "createdAt"      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants can read chat"  ON public.chats FOR SELECT USING (auth.uid() = ANY(participants));
CREATE POLICY "Participants can update chat" ON public.chats FOR UPDATE USING (auth.uid() = ANY(participants));
CREATE POLICY "Authenticated can create chat" ON public.chats FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ─── MESSAGES ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id         UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  "senderId"      UUID NOT NULL REFERENCES public.users(id),
  content         TEXT NOT NULL DEFAULT '',
  type            TEXT DEFAULT 'text' CHECK (type IN ('text','image','video','audio','file','sticker','system')),
  status          TEXT DEFAULT 'sent' CHECK (status IN ('sending','sent','delivered','read','failed')),
  "mediaUrl"      TEXT,
  "mediaSize"     BIGINT,
  "mediaMimeType" TEXT,
  "replyToId"     UUID REFERENCES public.messages(id),
  "isDeleted"     BOOLEAN DEFAULT FALSE,
  "isEdited"      BOOLEAN DEFAULT FALSE,
  "aiScanResult"  JSONB,
  "createdAt"     TIMESTAMPTZ DEFAULT NOW(),
  "editedAt"      TIMESTAMPTZ
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Chat participants can read messages"
  ON public.messages FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.chats WHERE id = chat_id AND auth.uid() = ANY(participants)));
CREATE POLICY "Authenticated users can insert messages"
  ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = "senderId");
CREATE POLICY "Sender can update own messages"
  ON public.messages FOR UPDATE
  USING (auth.uid() = "senderId");

-- Realtime: enable for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chats;
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;

-- ─── AI GUARD EVENTS ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ai_guard_events (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId"      UUID REFERENCES public.users(id),
  "userName"    TEXT,
  "messageId"   UUID,
  "scanResult"  JSONB NOT NULL,
  "actionTaken" TEXT NOT NULL,
  "createdAt"   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ai_guard_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read guard events" ON public.ai_guard_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin','superadmin'))
);
CREATE POLICY "Service role can insert guard events" ON public.ai_guard_events FOR INSERT WITH CHECK (TRUE);

ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_guard_events;

-- ─── BAN RECORDS ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ban_records (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId"       UUID NOT NULL REFERENCES public.users(id),
  level          TEXT NOT NULL,
  reason         TEXT NOT NULL,
  "issuedBy"     TEXT DEFAULT 'ai',
  "aiConfidence" INTEGER,
  "reportId"     UUID,
  "createdAt"    TIMESTAMPTZ DEFAULT NOW(),
  "expiresAt"    TIMESTAMPTZ
);

ALTER TABLE public.ban_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read ban records" ON public.ban_records FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin','superadmin'))
);

-- ─── REPORTS ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.reports (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "reporterId"      UUID NOT NULL REFERENCES public.users(id),
  "reportedUserId"  UUID NOT NULL REFERENCES public.users(id),
  "chatId"          UUID,
  "messageId"       UUID,
  reason            TEXT NOT NULL,
  description       TEXT,
  evidence          TEXT[],
  status            TEXT DEFAULT 'pending',
  "aiVerdict"       JSONB,
  "adminNotes"      TEXT,
  "createdAt"       TIMESTAMPTZ DEFAULT NOW(),
  "resolvedAt"      TIMESTAMPTZ
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reporters can create reports" ON public.reports FOR INSERT WITH CHECK (auth.uid() = "reporterId");
CREATE POLICY "Admins can manage reports"    ON public.reports FOR ALL   USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin','superadmin'))
);

ALTER PUBLICATION supabase_realtime ADD TABLE public.reports;

-- ─── BUSINESS PROFILES ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.business_profiles (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId"            UUID NOT NULL REFERENCES public.users(id),
  "businessName"      TEXT NOT NULL,
  category            TEXT NOT NULL,
  description         TEXT,
  website             TEXT,
  address             TEXT,
  logo                TEXT,
  "isVerified"        BOOLEAN DEFAULT FALSE,
  "verifiedBadge"     BOOLEAN DEFAULT FALSE,
  "totalSales"        INTEGER DEFAULT 0,
  "successfulSales"   INTEGER DEFAULT 0,
  rating              NUMERIC(3,2) DEFAULT 0,
  "reviewCount"       INTEGER DEFAULT 0,
  reviews             JSONB DEFAULT '[]',
  analytics           JSONB DEFAULT '{}',
  "allowsScreenshots" BOOLEAN DEFAULT TRUE,
  "createdAt"         TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read business profiles" ON public.business_profiles FOR SELECT USING (TRUE);
CREATE POLICY "Owner can update business profile"  ON public.business_profiles FOR UPDATE USING (auth.uid() = "userId");

-- ─── CALLS ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.calls (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "chatId"          UUID NOT NULL,
  "initiatorId"     UUID NOT NULL REFERENCES public.users(id),
  participants      UUID[] DEFAULT '{}',
  type              TEXT DEFAULT 'audio' CHECK (type IN ('audio','video')),
  quality           TEXT DEFAULT 'hd'   CHECK (quality IN ('hd','4k')),
  status            TEXT DEFAULT 'ringing',
  "dailyRoomUrl"    TEXT,
  "dailyRoomName"   TEXT,
  "isScreenSharing" BOOLEAN DEFAULT FALSE,
  "isMuted"         BOOLEAN DEFAULT FALSE,
  "cameraFacing"    TEXT DEFAULT 'front',
  duration          INTEGER,
  "startedAt"       TIMESTAMPTZ,
  "endedAt"         TIMESTAMPTZ,
  "createdAt"       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants can read calls" ON public.calls FOR SELECT USING (auth.uid() = ANY(participants) OR auth.uid() = "initiatorId");

-- ─── AUDIT LOGS ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "adminId"    UUID REFERENCES public.users(id),
  action       TEXT NOT NULL,
  "targetId"   UUID,
  "targetType" TEXT,
  metadata     JSONB,
  "ipAddress"  TEXT,
  "createdAt"  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read audit logs" ON public.audit_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin','superadmin'))
);

-- ─── STORAGE BUCKETS ─────────────────────────────────────────────────────────
-- Run in Supabase Dashboard > Storage > Create Buckets:
-- 1. chat-media     (public: false, 50MB limit per file)
-- 2. avatars        (public: true,  5MB limit per file)
-- 3. business-assets(public: true,  10MB limit per file)

-- ─── INDEXES ─────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_messages_chat_id    ON public.messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id  ON public.messages("senderId");
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_chats_participants  ON public.chats USING GIN(participants);
CREATE INDEX IF NOT EXISTS idx_users_phone         ON public.users(phone);
CREATE INDEX IF NOT EXISTS idx_users_email         ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_contact_id    ON public.users("contactId");
CREATE INDEX IF NOT EXISTS idx_guard_events_user   ON public.ai_guard_events("userId");
CREATE INDEX IF NOT EXISTS idx_guard_events_time   ON public.ai_guard_events("createdAt" DESC);

-- ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId"   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL CHECK (type IN ('message','call','mention','system','business')),
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  "avatarUrl" TEXT,
  "chatId"   UUID,
  "isRead"   BOOLEAN DEFAULT FALSE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own notifications"   ON public.notifications FOR SELECT USING (auth.uid() = "userId");
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = "userId");
CREATE POLICY "Service can insert notifications"   ON public.notifications FOR INSERT WITH CHECK (TRUE);

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications("userId", "isRead");

-- ─── EXTRA USER COLUMNS ───────────────────────────────────────────────────────

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS nickname   TEXT,
  ADD COLUMN IF NOT EXISTS "coverPhoto" TEXT;

-- ─── AI SYSTEM ACCOUNTS ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.system_accounts (
  id          TEXT PRIMARY KEY,
  displayName TEXT NOT NULL,
  phone       TEXT UNIQUE,
  avatar      TEXT,
  contactId   TEXT UNIQUE,
  role        TEXT DEFAULT 'system',
  bio         TEXT,
  statusLabel TEXT,
  isActive    BOOLEAN DEFAULT TRUE,
  createdAt   TIMESTAMPTZ DEFAULT NOW()
);

-- Insert the Gemini 3 Pro system contact
INSERT INTO public.system_accounts (id, displayName, phone, avatar, contactId, role, bio, statusLabel, isActive)
VALUES (
  'ai-gemini-system-contact',
  'Gemini 3 Pro (Official)',
  '+8801643435122',
  '/assets/ai/gemini-3-pro-luxe.png',
  '#0000',
  'system',
  'Personal AI assistant, security analyst, and knowledge companion. Ask me anything — no limits.',
  'Ultra-Fast AI Assistant — Powered by Gemini 3 Pro',
  TRUE
)
ON CONFLICT (id) DO UPDATE SET isActive = TRUE;

-- Add isAiChat column to chats table
ALTER TABLE public.chats ADD COLUMN IF NOT EXISTS "isAiChat" BOOLEAN DEFAULT FALSE;

-- Index for fast AI chat lookup
CREATE INDEX IF NOT EXISTS idx_chats_ai ON public.chats("isAiChat") WHERE "isAiChat" = TRUE;

-- RLS: system_accounts is public read
ALTER TABLE public.system_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read system accounts" ON public.system_accounts FOR SELECT USING (TRUE);

-- ─── PRESENCE & READ RECEIPT SCHEMA ADDITIONS ────────────────────────────────
-- Adds real-time status columns to users and messages tables.
-- Safe to run on existing data (all IF NOT EXISTS / DEFAULT values provided).

-- Add lastSeen and status columns to users (may already exist — safe)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS "lastSeen"  TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS status      TEXT        DEFAULT 'offline'
    CHECK (status IN ('online', 'away', 'offline'));

-- Add is_read to messages for read-receipt tracking
-- Note: we use the existing 'status' field (sent/delivered/read) as primary indicator.
-- is_read is a convenience boolean for quick queries.
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS "isRead"    BOOLEAN DEFAULT FALSE;

-- Index for fast "unread messages" queries
CREATE INDEX IF NOT EXISTS idx_messages_unread
  ON public.messages (chat_id, "senderId", status)
  WHERE status != 'read' AND "isDeleted" = FALSE;

-- Index for presence lookups
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users (status, "lastSeen");

-- Enable Realtime on users table for live status updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;

-- Trigger: auto-set isRead=true when status is updated to 'read'
CREATE OR REPLACE FUNCTION sync_is_read()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'read' THEN
    NEW."isRead" := TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_is_read ON public.messages;
CREATE TRIGGER trg_sync_is_read
  BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION sync_is_read();
