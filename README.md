# RentNestle 🏠
### Zero Brokerage · AI-Powered · Fully Digital

India's rental portal built on **Next.js 14 + Supabase + Vercel**.

---

## Tech Stack

| Layer        | Technology                        |
|--------------|-----------------------------------|
| Frontend     | Next.js 14 (App Router), TailwindCSS |
| Backend      | Next.js API Routes (Vercel Serverless) |
| Database     | Supabase (PostgreSQL + PostGIS)   |
| Auth         | Supabase Auth — Phone OTP         |
| SMS OTP      | MSG91 (Indian provider, cheap)    |
| AI           | OpenAI GPT-4o-mini                |
| E-Sign/Stamp | Digio or Leegality                |
| Payments     | Razorpay                          |
| WhatsApp     | Meta Cloud API                    |
| Maps         | Google Maps JS API                |
| Hosting      | Vercel (free tier to start)       |

---

## Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/yourname/rentnesttle.git
cd rentnesttle
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env.local
# Fill in all values in .env.local
```

### 3. Set Up Supabase
1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → paste & run `supabase/migrations/001_initial_schema.sql`
3. Go to **Storage** → create 4 buckets:
   - `property-images` (Public)
   - `agreement-docs` (Private)
   - `hra-receipts` (Private)
   - `kyc-docs` (Private)
4. Copy your project URL and anon key to `.env.local`

### 4. Enable Phone Auth in Supabase
1. Supabase Dashboard → **Authentication → Providers**
2. Enable **Phone** provider
3. For production: set up MSG91 (see below)
4. For test mode: leave it as-is (OTP = 1234)

### 5. Run Locally
```bash
npm run dev
# Open http://localhost:3000
```

---

## SMS Setup (MSG91 — After DLT Clearance)

1. Register at [msg91.com](https://msg91.com)
2. Register your entity on [TRAI DLT portal](https://trai.gov.in/dlt)
3. Get your DLT-approved template ID
4. Set in `.env.local`:
   ```
   MSG91_API_KEY=your-key
   MSG91_SENDER_ID=RNTNES
   MSG91_TEMPLATE_ID=your-template-id
   ```
5. Change `NODE_ENV=production` in your Vercel environment

**Cost**: ~₹0.15/SMS vs Twilio's ₹1.5/SMS — 10x cheaper.

---

## Key Features & Files

### Authentication
- `src/app/auth/login/page.tsx` — OTP login UI (phone → OTP → dashboard)
- `src/app/api/auth/send-otp/route.ts` — calls MSG91
- `src/app/api/auth/verify-otp/route.ts` — verifies & creates Supabase session
- `src/lib/otp.ts` — MSG91 integration

### Properties
- `src/app/api/properties/route.ts` — GET (search + near me), POST (create)
- `src/app/list-property/page.tsx` — 4-step listing wizard with AI description
- `src/components/property/StreetView.tsx` — lazy Street View (cost efficient)

### Dashboards
- `src/app/dashboard/tenant/page.tsx` — saved homes, agreements, verification
- `src/app/dashboard/owner/page.tsx` — listings, inquiries, stats

### AI Features
- `src/app/api/ai/route.ts` — GPT-4o-mini listing description generator
- `src/app/api/whatsapp/route.ts` — WhatsApp AI bot (EN/TA/HI)
- `src/hooks/useVoiceSearch.ts` — browser voice search (en-IN/ta-IN/hi-IN)

### Verification
- `src/app/api/verification/route.ts` — state-specific police verification routing
- `src/types/index.ts` — `POLICE_VERIFICATION_STATES` map (Delhi/MH/KA/TN/UP)

### Database
- `supabase/migrations/001_initial_schema.sql` — complete schema with:
  - PostGIS for geo queries
  - Row Level Security on all tables
  - Auto-create profile on signup trigger
  - `properties_near_me(lat, lng, radius_km)` function

---

## Deployment to Vercel

```bash
npm i -g vercel
vercel
```

Set all `.env.example` values as **Environment Variables** in Vercel dashboard.

**Recommended Vercel settings:**
- Framework: Next.js
- Build Command: `npm run build`
- Root Directory: `/`

---

## PWA Setup

The app is PWA-ready. To enable "Add to Home Screen":

1. Add icons to `public/icons/` (sizes: 72, 96, 128, 144, 152, 192, 384, 512)
2. `public/manifest.json` is already configured
3. `public/sw.js` service worker is ready
4. Register SW in `src/app/layout.tsx`:
   ```tsx
   useEffect(() => {
     if ('serviceWorker' in navigator) {
       navigator.serviceWorker.register('/sw.js')
     }
   }, [])
   ```

---

## Cost Estimate (Startup Level)

| Service        | Cost/Month                |
|----------------|---------------------------|
| Vercel         | ₹0 (free tier)            |
| Supabase       | ₹0 (free tier, 500MB DB)  |
| MSG91 SMS      | ~₹150 (1,000 OTPs)        |
| OpenAI         | ~₹400 (gpt-4o-mini)       |
| WhatsApp API   | ₹0 (first 1,000 chats)    |
| Google Maps    | ~₹500 (first 200 uses free) |
| Digio (e-sign) | ~₹15–25 per signature     |
| **Total**      | **~₹1,500/month to start** |

---

## Roadmap

- [ ] Phase 1: Home page + OTP auth + property listings ← **You are here**
- [ ] Phase 2: List property wizard + AI description
- [ ] Phase 3: Digio e-sign + e-stamp integration
- [ ] Phase 4: Police verification (state-specific)
- [ ] Phase 5: WhatsApp AI bot (EN/TA/HI)
- [ ] Phase 6: HRA receipt automation
- [ ] Phase 7: Razorpay plan payments
- [ ] Phase 8: PWA + offline support

---

## License
Private — RentNestle © 2025
