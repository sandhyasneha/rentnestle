'use client'

import { useState, useRef, useCallback } from 'react'

export type VoiceLang = 'en-IN' | 'ta-IN' | 'hi-IN'

export const VOICE_LANGS: { code: VoiceLang; label: string; flag: string }[] = [
  { code: 'en-IN', label: 'English', flag: '🇬🇧' },
  { code: 'ta-IN', label: 'தமிழ்',   flag: '🇮🇳' },
  { code: 'hi-IN', label: 'हिंदी',   flag: '🇮🇳' },
]

export function useVoiceSearch(onResult?: (text: string) => void) {
  const [isListening,    setIsListening]    = useState(false)
  const [transcript,     setTranscript]     = useState('')
  const [error,          setError]          = useState<string | null>(null)
  const [selectedLang,   setSelectedLang]   = useState<VoiceLang>('en-IN')
  const recognitionRef                      = useRef<any>(null)

  const isSupported = typeof window !== 'undefined' &&
    !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition

  const startListening = useCallback(() => {
    const SR = typeof window !== 'undefined'
      ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      : null

    if (!SR) { setError('Voice search not supported'); return }

    setError(null)
    setTranscript('')

    const recognition = new SR()
    recognition.lang           = selectedLang
    recognition.interimResults = true
    recognition.continuous     = false

    recognition.onstart = () => setIsListening(true)

    recognition.onresult = (event: any) => {
      const text = Array.from(event.results as any[])
        .map((r: any) => r[0].transcript)
        .join('')
      setTranscript(text)
      if (event.results[event.results.length - 1].isFinal) {
        onResult?.(text)
      }
    }

    recognition.onerror = (event: any) => {
      setError(event.error === 'not-allowed' ? 'Microphone permission denied' : 'Voice error')
      setIsListening(false)
    }

    recognition.onend = () => setIsListening(false)

    recognitionRef.current = recognition
    recognition.start()
  }, [selectedLang, onResult])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }, [])

  return {
    isListening,
    transcript,
    error,
    selectedLang,
    setSelectedLang,
    startListening,
    stopListening,
    isSupported,
  }
}