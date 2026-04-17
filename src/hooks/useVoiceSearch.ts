'use client'

import { useState, useRef, useCallback } from 'react'

export type VoiceLang = 'en-IN' | 'ta-IN' | 'hi-IN'

export const VOICE_LANGS: { code: VoiceLang; label: string; flag: string }[] = [
  { code: 'en-IN', label: 'English', flag: '🇬🇧' },
  { code: 'ta-IN', label: 'தமிழ்',   flag: '🇮🇳' },
  { code: 'hi-IN', label: 'हिंदी',    flag: '🇮🇳' },
]

interface UseVoiceSearchReturn {
  isListening: boolean
  transcript: string
  error: string | null
  selectedLang: VoiceLang
  setSelectedLang: (lang: VoiceLang) => void
  startListening: () => void
  stopListening: () => void
  isSupported: boolean
}

export function useVoiceSearch(onResult?: (text: string) => void): UseVoiceSearchReturn {
  const [isListening, setIsListening]     = useState(false)
  const [transcript, setTranscript]       = useState('')
  const [error, setError]                 = useState<string | null>(null)
  const [selectedLang, setSelectedLang]   = useState<VoiceLang>('en-IN')
  const recognitionRef                    = useRef<SpeechRecognition | null>(null)

  const SpeechRecognitionAPI =
    typeof window !== 'undefined'
      ? (window.SpeechRecognition || window.webkitSpeechRecognition)
      : null

  const isSupported = !!SpeechRecognitionAPI

  const startListening = useCallback(() => {
    if (!SpeechRecognitionAPI) {
      setError('Voice search not supported in this browser')
      return
    }

    setError(null)
    setTranscript('')

    const recognition = new SpeechRecognitionAPI()
    recognition.lang            = selectedLang
    recognition.interimResults  = true
    recognition.continuous      = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => setIsListening(true)

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const text = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('')
      setTranscript(text)

      // Fire callback on final result
      if (event.results[event.results.length - 1].isFinal) {
        onResult?.(text)
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setError(event.error === 'not-allowed'
        ? 'Microphone permission denied'
        : 'Voice recognition error'
      )
      setIsListening(false)
    }

    recognition.onend = () => setIsListening(false)

    recognitionRef.current = recognition
    recognition.start()
  }, [SpeechRecognitionAPI, selectedLang, onResult])

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
