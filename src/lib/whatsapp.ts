export async function notifyOwnerWhatsApp(
  ownerPhone: string, 
  tenantName: string, 
  propertyTitle: string
) {
  const WA_TOKEN    = process.env.WHATSAPP_TOKEN!
  const WA_PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID!
  
  const message = `🏠 *New Inquiry — RentNestle*\n\n*${tenantName}* is interested in:\n📌 ${propertyTitle}\n\n👉 https://rentnestle.vercel.app/dashboard/owner`
  
  await fetch(`https://graph.facebook.com/v19.0/${WA_PHONE_ID}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${WA_TOKEN}`,
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: `91${ownerPhone}`,
      type: 'text',
      text: { body: message },
    }),
  })
}