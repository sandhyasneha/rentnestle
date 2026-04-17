// ============================================================
// RentNestle — OTP Authentication via MSG91
// MSG91 is ~10x cheaper than Twilio for Indian SMS
// DLT registration required at: https://trai.gov.in/dlt
// ============================================================

const MSG91_API_KEY    = process.env.MSG91_API_KEY!
const MSG91_SENDER_ID  = process.env.MSG91_SENDER_ID!       // e.g. RNTNES
const MSG91_TEMPLATE_ID = process.env.MSG91_TEMPLATE_ID!    // DLT approved template

// In TEST MODE (before DLT clearance), we skip real SMS
const TEST_MODE = process.env.NODE_ENV !== 'production'
const TEST_OTP  = '1234'

// ── Send OTP ────────────────────────────────────────────────
export async function sendOtp(phone: string): Promise<{ success: boolean; error?: string }> {
  // Test mode: no real SMS sent, OTP is always 1234
  if (TEST_MODE) {
    console.log(`[TEST MODE] OTP for ${phone}: ${TEST_OTP}`)
    return { success: true }
  }

  try {
    const res = await fetch('https://api.msg91.com/api/v5/otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'authkey': MSG91_API_KEY,
      },
      body: JSON.stringify({
        template_id: MSG91_TEMPLATE_ID,
        mobile: `91${phone}`,     // prefix country code
        authkey: MSG91_API_KEY,
        otp_length: 4,
        otp_expiry: 10,           // minutes
      }),
    })

    const data = await res.json()
    if (data.type === 'success') return { success: true }
    return { success: false, error: data.message }
  } catch (err) {
    console.error('MSG91 error:', err)
    return { success: false, error: 'SMS service unavailable' }
  }
}

// ── Verify OTP ──────────────────────────────────────────────
export async function verifyOtp(phone: string, otp: string): Promise<{ success: boolean; error?: string }> {
  // Test mode: accept 1234
  if (TEST_MODE) {
    if (otp === TEST_OTP) return { success: true }
    return { success: false, error: 'Invalid OTP. Use 1234 in test mode.' }
  }

  try {
    const res = await fetch(
      `https://api.msg91.com/api/v5/otp/verify?authkey=${MSG91_API_KEY}&mobile=91${phone}&otp=${otp}`,
      { method: 'GET' }
    )
    const data = await res.json()
    if (data.type === 'success') return { success: true }
    return { success: false, error: 'Invalid or expired OTP' }
  } catch (err) {
    console.error('MSG91 verify error:', err)
    return { success: false, error: 'Verification failed' }
  }
}

// ── Resend OTP ──────────────────────────────────────────────
export async function resendOtp(phone: string): Promise<{ success: boolean; error?: string }> {
  if (TEST_MODE) return { success: true }

  try {
    const res = await fetch(
      `https://api.msg91.com/api/v5/otp/retry?authkey=${MSG91_API_KEY}&mobile=91${phone}&retrytype=text`,
      { method: 'GET' }
    )
    const data = await res.json()
    if (data.type === 'success') return { success: true }
    return { success: false, error: data.message }
  } catch (err) {
    return { success: false, error: 'Resend failed' }
  }
}
