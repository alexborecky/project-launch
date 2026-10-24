import { useCallback, useEffect, useRef, useState } from 'react'
import { VOICE } from '../config'

const MUTE_KEY = 'project-hack:muted'

function readMuted() {
  try {
    return localStorage.getItem(MUTE_KEY) === '1'
  } catch {
    return false
  }
}

/** Has the user clicked or pressed a key yet? Browsers block speech until then. */
function userHasInteracted() {
  const ua = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation
  return ua ? ua.hasBeenActive : true
}

/** The "Hello, World" transmissions: random timer, mute toggle, speaking state. */
export function useVoice() {
  const [muted, setMutedState] = useState(readMuted)
  const [speaking, setSpeaking] = useState(false)
  const mutedRef = useRef(muted)
  useEffect(() => {
    mutedRef.current = muted
  }, [muted])

  const speak = useCallback(() => {
    if (mutedRef.current || !('speechSynthesis' in window) || !userHasInteracted()) return
    const synth = window.speechSynthesis
    if (synth.speaking) return
    const u = new SpeechSynthesisUtterance(VOICE.text)
    u.lang = 'en-US'
    u.pitch = VOICE.pitch
    u.rate = VOICE.rate
    const voice = synth.getVoices().find((v) => v.lang.startsWith('en'))
    if (voice) u.voice = voice
    u.onstart = () => setSpeaking(true)
    u.onend = () => setSpeaking(false)
    u.onerror = () => setSpeaking(false)
    synth.cancel()
    synth.speak(u)
  }, [])

  useEffect(() => {
    let id: ReturnType<typeof setTimeout>
    const schedule = () => {
      id = setTimeout(() => {
        speak()
        schedule()
      }, VOICE.minGapMs + Math.random() * (VOICE.maxGapMs - VOICE.minGapMs))
    }
    schedule()
    return () => clearTimeout(id)
  }, [speak])

  const setMuted = useCallback((value: boolean) => {
    setMutedState(value)
    try {
      localStorage.setItem(MUTE_KEY, value ? '1' : '0')
    } catch {
      // ignore
    }
    if (value && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      setSpeaking(false)
    }
  }, [])

  return { muted, setMuted, speaking, speak }
}
