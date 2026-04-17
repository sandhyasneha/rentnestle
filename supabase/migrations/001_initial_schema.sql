-- ============================================================
-- RentNestle — Complete Database Schema v1
-- Run in: Supabase Dashboard → SQL Editor
-- Or via CLI: supabase db push
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE user_role          AS ENUM ('tenant', 'owner', 'admin');
CREATE TYPE property_type      AS ENUM ('1bhk','2bhk','3bhk','4bhk','studio','pg','villa','commercial');
CREATE TYPE furnishing_type    AS ENUM ('unfurnished','semi_furnished','fully_furnished');
CREATE TYPE tenant_preference  AS ENUM ('family','bachelors','company_lease','any');
CREATE TYPE food_preference    AS ENUM ('veg_only','no_restriction');
CREATE TYPE property_status    AS ENUM ('draft','active','rented','inactive');
CREATE TYPE verification_status AS ENUM ('pending','basic','verified','fully_verified');
CREATE TYPE agreement_status   AS ENUM ('draft','sent','signed_tenant','signed_owner','stamped','completed');
CREATE TYPE plan_type          AS ENUM ('free','pro','gold');

-- ============================================================
-- PROFILES (extends auth.users)
-- Created automatically on OTP sign-up via trigger
-- ============================================================
CREATE TABLE public.profiles (
  id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone               TEXT UNIQUE NOT NULL,
  full_name           TEXT,
  role                user_role NOT NULL DEFAULT 'tenant',
  avatar_url          TEXT,
  plan                plan_type NOT NULL DEFAULT 'free',
  plan_expires_at     TIMESTAMPTZ,

  -- Verification flags
  aadhaar_verified    BOOLEAN DEFAULT FALSE,
  pan_verified        BOOLEAN DEFAULT FALSE,
  police_verified     BOOLEAN DEFAULT FALSE,
  verification_status verification_status DEFAULT 'pending',

  -- Location (for state-specific police verification logic)
  current_city        TEXT,
  current_state       TEXT,

  -- Preferred language for WhatsApp AI replies
  preferred_lang      TEXT DEFAULT 'en',   -- 'en' | 'ta' | 'hi'

  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PROPERTIES
-- ============================================================
CREATE TABLE public.properties (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id              UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Basics
  title                 TEXT NOT NULL,
  description           TEXT,
  property_type         property_type NOT NULL,
  monthly_rent          INTEGER NOT NULL,
  security_deposit      INTEGER DEFAULT 0,
  maintenance_charges   INTEGER DEFAULT 0,

  -- Address
  address_line1         TEXT NOT NULL,
  address_line2         TEXT,
  city                  TEXT NOT NULL,
  state                 TEXT NOT NULL,
  pincode               TEXT NOT NULL,

  -- PostGIS point — enables "find near me" queries
  location              GEOGRAPHY(POINT, 4326),

  -- Property details
  furnishing            furnishing_type DEFAULT 'unfurnished',
  floor_number          INTEGER,
  total_floors          INTEGER,
  bedrooms              INTEGER DEFAULT 1,
  bathrooms             INTEGER DEFAULT 1,
  area_sqft             INTEGER,

  -- Preferences (important for Indian rental market)
  tenant_pref           tenant_preference DEFAULT 'any',
  food_pref             food_preference DEFAULT 'no_restriction',

  -- Flexible amenities — add new ones without schema changes
  -- {"parking":true,"power_backup":true,"ac":true,"lift":false,
  --  "gym":false,"security":true,"wifi":false,"east_facing":true,
  --  "swimming_pool":false,"modular_kitchen":true}
  amenities             JSONB DEFAULT '{}',

  -- Photo URLs from Supabase Storage bucket: property-images/{property_id}/
  photos                TEXT[] DEFAULT '{}',

  -- Status
  status                property_status DEFAULT 'draft',
  is_verified           BOOLEAN DEFAULT FALSE,
  boost_level           INTEGER DEFAULT 0,  -- 0=standard, 1=boosted, 2=featured

  -- Cached Street View availability (checked once via Google API)
  has_street_view       BOOLEAN,
  street_view_lat       FLOAT,
  street_view_lng       FLOAT,

  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast filtering
CREATE INDEX idx_properties_location ON public.properties USING GIST(location);
CREATE INDEX idx_properties_city     ON public.properties(city);
CREATE INDEX idx_properties_status   ON public.properties(status);
CREATE INDEX idx_properties_owner    ON public.properties(owner_id);
CREATE INDEX idx_properties_type     ON public.properties(property_type);
CREATE INDEX idx_properties_rent     ON public.properties(monthly_rent);

-- ============================================================
-- INQUIRIES (tenant contacts owner via listing)
-- ============================================================
CREATE TABLE public.inquiries (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id   UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  tenant_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  owner_id      UUID NOT NULL REFERENCES public.profiles(id),
  message       TEXT,
  is_read       BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(property_id, tenant_id)
);

CREATE INDEX idx_inquiries_owner  ON public.inquiries(owner_id);
CREATE INDEX idx_inquiries_tenant ON public.inquiries(tenant_id);

-- ============================================================
-- AGREEMENTS
-- ============================================================
CREATE TABLE public.agreements (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id         UUID NOT NULL REFERENCES public.properties(id),
  tenant_id           UUID NOT NULL REFERENCES public.profiles(id),
  owner_id            UUID NOT NULL REFERENCES public.profiles(id),

  monthly_rent        INTEGER NOT NULL,
  security_deposit    INTEGER DEFAULT 0,
  start_date          DATE NOT NULL,
  end_date            DATE NOT NULL,
  duration_months     INTEGER DEFAULT 11,   -- 11-month Leave & Licence

  plan_type           plan_type DEFAULT 'free',
  status              agreement_status DEFAULT 'draft',

  -- Document URLs (Supabase Storage: agreement-docs/)
  draft_pdf_url       TEXT,
  stamped_pdf_url     TEXT,
  final_signed_url    TEXT,

  -- E-Stamp details (from Digio/Leegality)
  estamp_uin          TEXT,          -- unique stamp certificate number
  estamp_amount       INTEGER,       -- stamp duty in paise
  estamp_state        TEXT,

  -- E-Sign tracking
  tenant_signed_at    TIMESTAMPTZ,
  owner_signed_at     TIMESTAMPTZ,
  provider_ref_id     TEXT,          -- Digio/Leegality transaction ref

  -- Custom clauses as JSON
  clauses             JSONB DEFAULT '{}',

  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- HRA RECEIPTS (auto-generated monthly)
-- ============================================================
CREATE TABLE public.hra_receipts (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agreement_id  UUID NOT NULL REFERENCES public.agreements(id),
  tenant_id     UUID NOT NULL REFERENCES public.profiles(id),
  owner_id      UUID NOT NULL REFERENCES public.profiles(id),
  month         DATE NOT NULL,           -- first day of month
  amount        INTEGER NOT NULL,
  pdf_url       TEXT,
  sent_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TENANT VERIFICATIONS (state-specific)
-- ============================================================
CREATE TABLE public.tenant_verifications (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID NOT NULL REFERENCES public.profiles(id),
  property_id   UUID REFERENCES public.properties(id),

  -- 'aadhaar' | 'pan' | 'police' | 'background' | 'face_match'
  type          TEXT NOT NULL,
  state         TEXT,                -- matters for police verification routing
  status        TEXT DEFAULT 'pending',   -- pending|processing|completed|failed
  provider      TEXT,               -- 'digio' | 'karnataka_one' | 'tn_police' etc.
  provider_ref  TEXT,
  result        JSONB DEFAULT '{}', -- sanitized result summary only

  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TRANSACTIONS (revenue tracking per your plan)
-- ============================================================
CREATE TABLE public.transactions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id),
  type          TEXT NOT NULL,     -- 'plan_purchase'|'verify_fee'|'stamp_duty'
  amount        INTEGER NOT NULL,  -- total charged (paise, 100 paise = ₹1)
  api_cost      INTEGER DEFAULT 0,
  stamp_cost    INTEGER DEFAULT 0,
  net_revenue   INTEGER DEFAULT 0, -- amount - api_cost - stamp_cost
  plan_type     plan_type,
  razorpay_id   TEXT,
  status        TEXT DEFAULT 'pending',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SAVED PROPERTIES (tenant wishlist)
-- ============================================================
CREATE TABLE public.saved_properties (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  property_id   UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, property_id)
);

-- ============================================================
-- AUTO updated_at TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER t_profiles_upd   BEFORE UPDATE ON public.profiles   FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER t_properties_upd BEFORE UPDATE ON public.properties FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER t_agreements_upd BEFORE UPDATE ON public.agreements FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER t_verif_upd      BEFORE UPDATE ON public.tenant_verifications FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- AUTO-CREATE PROFILE ON OTP SIGN-UP
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.phone, ''),
    COALESCE((NEW.raw_app_meta_data->>'role')::user_role, 'tenant')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- GEO FUNCTION: properties near coordinates
-- Usage: SELECT * FROM properties_near_me(13.0827, 80.2707, 5)
--        (Chennai lat/lng, 5km radius)
-- ============================================================
CREATE OR REPLACE FUNCTION properties_near_me(
  lat      FLOAT,
  lng      FLOAT,
  radius_km FLOAT DEFAULT 5
)
RETURNS SETOF public.properties
LANGUAGE SQL STABLE AS $$
  SELECT * FROM public.properties
  WHERE status = 'active'
  AND ST_DWithin(
    location::geography,
    ST_MakePoint(lng, lat)::geography,
    radius_km * 1000
  )
  ORDER BY ST_Distance(
    location::geography,
    ST_MakePoint(lng, lat)::geography
  );
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agreements         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hra_receipts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_properties   ENABLE ROW LEVEL SECURITY;

-- Profiles: own record only
CREATE POLICY "own_profile"         ON public.profiles           USING (auth.uid() = id);
-- Properties: anyone can read active; owner can do everything
CREATE POLICY "read_active_props"   ON public.properties         FOR SELECT USING (status = 'active');
CREATE POLICY "owner_manage_props"  ON public.properties         USING (auth.uid() = owner_id);
-- Inquiries: tenant or owner of the property
CREATE POLICY "inquiry_parties"     ON public.inquiries          USING (auth.uid() = tenant_id OR auth.uid() = owner_id);
-- Agreements: only tenant + owner
CREATE POLICY "agreement_parties"   ON public.agreements         USING (auth.uid() = tenant_id OR auth.uid() = owner_id);
-- HRA: tenant + owner
CREATE POLICY "hra_parties"         ON public.hra_receipts       USING (auth.uid() = tenant_id OR auth.uid() = owner_id);
-- Verifications: own only
CREATE POLICY "own_verifications"   ON public.tenant_verifications USING (auth.uid() = tenant_id);
-- Transactions: own only
CREATE POLICY "own_transactions"    ON public.transactions       USING (auth.uid() = user_id);
-- Saved: own only
CREATE POLICY "own_saved"           ON public.saved_properties   USING (auth.uid() = tenant_id);

-- ============================================================
-- STORAGE BUCKETS
-- Create these manually in Supabase Dashboard → Storage:
--   1. property-images  → Public  (photos shown on listings)
--   2. agreement-docs   → Private (signed PDFs)
--   3. hra-receipts     → Private (monthly receipts)
--   4. kyc-docs         → Private (Aadhaar/PAN — strict RLS)
-- ============================================================
