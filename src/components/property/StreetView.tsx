'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader } from '@googlemaps/js-api-loader'

interface StreetViewProps {
  lat: number
  lng: number
  address?: string
}

type Status = 'idle' | 'checking' | 'available' | 'unavailable' | 'loading' | 'loaded'

export default function StreetView({ lat, lng, address }: StreetViewProps) {
  const mapRef        = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<Status>('idle')

  // Step 1: Check if Street View exists at this location (cheap API call)
  useEffect(() => {
    if (status !== 'idle') return
    setStatus('checking')

    const loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY!,
      libraries: ['streetView'],
    })

    loader.load().then((google) => {
      const service = new google.maps.StreetViewService()
      service.getPanorama(
        { location: { lat, lng }, radius: 50 },
        (_data: unknown, svStatus: string) => {
          setStatus(svStatus === 'OK' ? 'available' : 'unavailable')
        }
      )
    }).catch(() => setStatus('unavailable'))
  }, [lat, lng, status])

  // Step 2: Load the full 360° panorama only when user clicks
  const loadPanorama = () => {
    if (!mapRef.current) return
    setStatus('loading')

    const loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY!,
      version: 'weekly',
    })

    loader.load().then((google) => {
      new google.maps.StreetViewPanorama(mapRef.current!, {
        position: { lat, lng },
        pov: { heading: 165, pitch: 0 },
        zoom: 1,
        addressControl: false,
        fullscreenControl: true,
        motionTracking: false,
      })
      setStatus('loaded')
    })
  }

  return (
    <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #e0e4e0' }}>
      {/* Container — always in DOM so panorama can mount into it */}
      <div
        ref={mapRef}
        style={{
          width: '100%',
          height: 300,
          background: '#f0f4f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {status === 'idle' || status === 'checking' ? (
          <div style={{ textAlign: 'center', color: '#888', fontSize: 14 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🗺️</div>
            Checking Street View...
          </div>
        ) : status === 'unavailable' ? (
          <div style={{ textAlign: 'center', color: '#888', fontSize: 14 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📍</div>
            Street View not available for this location
            {address && <div style={{ fontSize: 12, marginTop: 4 }}>{address}</div>}
          </div>
        ) : status === 'available' ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📸</div>
            <button
              onClick={loadPanorama}
              style={{
                background: '#0F6E56', color: '#fff', border: 'none',
                padding: '10px 20px', borderRadius: 10, fontWeight: 700,
                fontSize: 14, cursor: 'pointer'
              }}
            >
              View Street View
            </button>
            <div style={{ fontSize: 12, color: '#888', marginTop: 6 }}>
              360° view of the neighbourhood
            </div>
          </div>
        ) : status === 'loading' ? (
          <div style={{ color: '#888', fontSize: 14 }}>Loading 360° view...</div>
        ) : null}
      </div>
    </div>
  )
}
