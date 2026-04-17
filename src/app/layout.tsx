import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'RentNestle — Zero Brokerage Rentals',
  description: 'Find your perfect home with zero brokerage, AI-powered listings, and instant digital agreements across India.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'RentNestle',
  },
  openGraph: {
    title: 'RentNestle — Zero Brokerage Rentals India',
    description: 'AI-powered rental portal. Zero brokerage. Digital agreements.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#0F6E56',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
