# Alok Message — Hyper-Security Fortress

> AI-governed secure messaging. Fraud-zero ecosystem. 4K calls. Blue-verified business hub.

---

## 🗂 Project Structure

```
alok-message/
├── app/
│   ├── layout.tsx                    ← Root HTML shell, fonts, global toasts
│   ├── page.tsx                      ← Root redirect (login or /chat)
│   ├── globals.css                   ← Full design system (glassmorphism)
│   ├── auth/
│   │   ├── login/page.tsx            ← Phone + Gmail dual auth
│   │   ├── register/page.tsx         ← OTP → Profile → Rules (3-step)
│   │   └── callback/route.ts         ← Google OAuth callback
│   ├── (main)/
│   │   ├── layout.tsx                ← Auth guard + Sidebar shell
│   │   ├── chat/page.tsx             ← Chat list / empty state
│   │   ├── chat/[id]/page.tsx        ← Individual chat window
│   │   ├── calls/page.tsx            ← Call history log
│   │   ├── business/page.tsx         ← Business Hub
│   │   └── settings/page.tsx         ← User settings (add as needed)
│   ├── admin/
│   │   └── page.tsx                  ← Admin Control Tower
│   └── api/
│       ├── messages/scan/route.ts    ← AI Guard scan endpoint
│       ├── calls/create-room/route.ts← Daily.co room creation
│       └── business/create/route.ts  ← Business profile setup
├── components/
│   ├── Sidebar.tsx                   ← Main nav + chat list sidebar
│   ├── AiGuard.tsx                   ← Live AI Guard event feed
│   ├── chat/
│   │   ├── ChatList.tsx              ← Chat list rows
│   │   ├── ChatWindow.tsx            ← Real-time chat window
│   │   ├── MessageBubble.tsx         ← Message rendering
│   │   ├── MediaUpload.tsx           ← Lossless file upload
│   │   └── EmptyChatState.tsx        ← Welcome screen
│   ├── calls/
│   │   └── CallInterface.tsx         ← Daily.co 4K/HD call UI
│   ├── business/
│   │   └── BusinessHub.tsx           ← Business dashboard + setup
│   └── admin/
│       ├── AdminReportQueue.tsx      ← Report management
│       └── AdminBanControls.tsx      ← Manual ban controls
├── lib/
│   ├── supabase.ts                   ← All Supabase client instances
│   ├── gemini.ts                     ← Gemini AI Guard engine
│   └── auth.ts                       ← Auth helpers
├── hooks/
│   ├── useAuth.ts                    ← Session + presence
│   └── useRealtime.ts                ← Real-time messages + typing
├── types/index.ts                    ← All TypeScript types
├── supabase/schema.sql               ← Complete DB schema (run this first!)
├── tailwind.config.ts                ← Design tokens
└── .env.local                        ← Environment variables template
```

---

## ⚡ Setup Guide

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.local` and fill in your keys:
```bash
cp .env.local .env.local
```

Required keys:
- `NEXT_PUBLIC_SUPABASE_URL` — from Supabase project settings
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from Supabase project settings
- `SUPABASE_SERVICE_ROLE_KEY` — from Supabase project settings (keep secret)
- `GEMINI_API_KEY` — from [Google AI Studio](https://aistudio.google.com/)
- `DAILY_API_KEY` — from [Daily.co dashboard](https://dashboard.daily.co/)

### 3. Initialize Database
1. Open your **Supabase Dashboard → SQL Editor**
2. Paste and run the full contents of `supabase/schema.sql`
3. Create storage buckets: `chat-media`, `avatars`, `business-assets`

### 4. Configure Supabase Auth
In Supabase Dashboard → Authentication:
- Enable **Phone** provider (Twilio recommended)
- Enable **Google** OAuth provider
- Set redirect URL to: `http://localhost:3000/auth/callback`

### 5. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🛡 AI Guard System

The AI Guard (`lib/gemini.ts`) uses **Gemini 1.5 Pro** to scan every message:

| Threat Level | Confidence | Action |
|---|---|---|
| Safe | 0-59% | Allow |
| Suspicious | 60-75% | Warn user |
| Danger | 76-89% | Block + Read-only mode |
| Critical | 90%+ | Block + Escalate + Ban |
| Explicit | Any | Instant 30-day suspension |

**Privacy Blindspot:** Banking info, transaction numbers, and private photos are **never flagged**.

---

## 📞 Calls (Daily.co)

- **HD Audio**: Dedicated quality mode with mute/screen-share
- **4K Video**: Front/back camera, screen share, picture-in-picture
- **Group Sync**: Up to 20 participants simultaneously

---

## 🏢 Business Hub

- **Blue Verified Badge**: Auto-awarded at 200 successful sales
- **1-5 Star Reviews**: Written reviews from verified buyers
- **Analytics**: Daily/weekly/monthly sales charts with seasonal comparison
- **Screenshot Policy**: Always allowed in business chats for transaction records

---

## 🚀 Production Deployment

```bash
npm run build
npm start
```

Recommended: Deploy to **Vercel** with automatic Supabase integration.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Database + Auth | Supabase (PostgreSQL + Realtime) |
| AI Safety | Gemini 1.5 Pro |
| Video Calls | Daily.co |
| Styling | Tailwind CSS + Custom Glassmorphism |
| Mobile | Capacitor.js (add separately) |
