// ============================================================
// RentNestle — TypeScript Types
// Auto-generate from Supabase: npx supabase gen types typescript
// ============================================================

export type UserRole = 'tenant' | 'owner' | 'admin'
export type PropertyType = '1bhk' | '2bhk' | '3bhk' | '4bhk' | 'studio' | 'pg' | 'villa' | 'commercial'
export type FurnishingType = 'unfurnished' | 'semi_furnished' | 'fully_furnished'
export type TenantPreference = 'family' | 'bachelors' | 'company_lease' | 'any'
export type FoodPreference = 'veg_only' | 'no_restriction'
export type PropertyStatus = 'draft' | 'active' | 'rented' | 'inactive'
export type VerificationStatus = 'pending' | 'basic' | 'verified' | 'fully_verified'
export type AgreementStatus = 'draft' | 'sent' | 'signed_tenant' | 'signed_owner' | 'stamped' | 'completed'
export type PlanType = 'free' | 'pro' | 'gold'
export type PreferredLang = 'en' | 'ta' | 'hi'

// ============================================================
// DATABASE ROW TYPES
// ============================================================

export interface Profile {
  id: string
  phone: string
  full_name: string | null
  role: UserRole
  avatar_url: string | null
  plan: PlanType
  plan_expires_at: string | null
  aadhaar_verified: boolean
  pan_verified: boolean
  police_verified: boolean
  verification_status: VerificationStatus
  current_city: string | null
  current_state: string | null
  preferred_lang: PreferredLang
  created_at: string
  updated_at: string
}

export interface Amenities {
  parking?: boolean
  power_backup?: boolean
  ac?: boolean
  lift?: boolean
  gym?: boolean
  security?: boolean
  wifi?: boolean
  east_facing?: boolean
  swimming_pool?: boolean
  modular_kitchen?: boolean
  piped_gas?: boolean
  club_house?: boolean
  [key: string]: boolean | undefined
}

export interface Property {
  id: string
  owner_id: string
  title: string
  description: string | null
  property_type: PropertyType
  monthly_rent: number
  security_deposit: number
  maintenance_charges: number
  address_line1: string
  address_line2: string | null
  city: string
  state: string
  pincode: string
  location: { type: 'Point'; coordinates: [number, number] } | null  // [lng, lat]
  furnishing: FurnishingType
  floor_number: number | null
  total_floors: number | null
  bedrooms: number
  bathrooms: number
  area_sqft: number | null
  tenant_pref: TenantPreference
  food_pref: FoodPreference
  amenities: Amenities
  photos: string[]
  status: PropertyStatus
  is_verified: boolean
  boost_level: number
  has_street_view: boolean | null
  street_view_lat: number | null
  street_view_lng: number | null
  created_at: string
  updated_at: string
  // Joined fields (optional)
  owner?: Profile
}

export interface Inquiry {
  id: string
  property_id: string
  tenant_id: string
  owner_id: string
  message: string | null
  is_read: boolean
  created_at: string
  tenant?: Profile
  property?: Property
}

export interface Agreement {
  id: string
  property_id: string
  tenant_id: string
  owner_id: string
  monthly_rent: number
  security_deposit: number
  start_date: string
  end_date: string
  duration_months: number
  plan_type: PlanType
  status: AgreementStatus
  draft_pdf_url: string | null
  stamped_pdf_url: string | null
  final_signed_url: string | null
  estamp_uin: string | null
  estamp_amount: number | null
  estamp_state: string | null
  tenant_signed_at: string | null
  owner_signed_at: string | null
  provider_ref_id: string | null
  clauses: Record<string, string>
  created_at: string
  updated_at: string
  property?: Property
  tenant?: Profile
  owner?: Profile
}

export interface HraReceipt {
  id: string
  agreement_id: string
  tenant_id: string
  owner_id: string
  month: string
  amount: number
  pdf_url: string | null
  sent_at: string | null
  created_at: string
}

export interface TenantVerification {
  id: string
  tenant_id: string
  property_id: string | null
  type: 'aadhaar' | 'pan' | 'police' | 'background' | 'face_match'
  state: string | null
  status: 'pending' | 'processing' | 'completed' | 'failed'
  provider: string | null
  provider_ref: string | null
  result: Record<string, unknown>
  created_at: string
  updated_at: string
}

// ============================================================
// PLAN FEATURES (used in UI plan cards)
// ============================================================

export interface TenantPlan {
  id: PlanType
  name: string
  price: number | null   // null = free
  features: {
    brokerage: string
    contacts: string
    verification: string
    legal: string
    hra: string
    earlyAccess: boolean
  }
}

export interface OwnerPlan {
  id: PlanType
  name: string
  price: number | null
  features: {
    visibility: string
    inquiries: string
    photography: string
    screening: string
    legal: string
    support: string
  }
}

// ============================================================
// API REQUEST/RESPONSE TYPES
// ============================================================

export interface SendOtpRequest {
  phone: string        // 10 digits
  countryCode: string  // '+91'
  role: UserRole
}

export interface VerifyOtpRequest {
  phone: string
  otp: string
  role: UserRole
}

export interface CreatePropertyRequest {
  title: string
  property_type: PropertyType
  monthly_rent: number
  security_deposit?: number
  address_line1: string
  city: string
  state: string
  pincode: string
  lat: number
  lng: number
  furnishing: FurnishingType
  bedrooms: number
  bathrooms: number
  area_sqft?: number
  tenant_pref: TenantPreference
  food_pref: FoodPreference
  amenities: Amenities
}

export interface SearchFilters {
  city?: string
  property_type?: PropertyType
  min_rent?: number
  max_rent?: number
  furnishing?: FurnishingType
  tenant_pref?: TenantPreference
  food_pref?: FoodPreference
  lat?: number
  lng?: number
  radius_km?: number
  page?: number
  limit?: number
}

// ============================================================
// STATE-SPECIFIC POLICE VERIFICATION ROUTING
// ============================================================

export const POLICE_VERIFICATION_STATES: Record<string, {
  available: boolean
  portal: string
  method: 'online' | 'offline' | 'hybrid'
}> = {
  'delhi': {
    available: true,
    portal: 'https://www.delhipolice.gov.in/',
    method: 'online'
  },
  'maharashtra': {
    available: true,
    portal: 'https://mahapolice.gov.in/',
    method: 'online'
  },
  'karnataka': {
    available: true,
    portal: 'https://karnatakaone.gov.in/',
    method: 'online'
  },
  'tamil_nadu': {
    available: true,
    portal: 'https://eservices.tn.gov.in/',
    method: 'online'
  },
  'uttar_pradesh': {
    available: true,
    portal: 'https://uppolice.gov.in/',
    method: 'online'
  },
  'telangana': {
    available: true,
    portal: 'https://ts.gov.in/',
    method: 'hybrid'
  },
}

export type StateKey = keyof typeof POLICE_VERIFICATION_STATES
