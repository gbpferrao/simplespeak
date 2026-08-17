import type { RunFinishTier } from '../../features/study/domain/runSession'

type ReviewSoundKind = 'hit' | 'miss'

interface ToneStep {
  frequency: number
  at: number
  duration: number
}

let audioContext: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const AudioContextConstructor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioContextConstructor) return null
  try {
    audioContext ??= new AudioContextConstructor()
    return audioContext
  } catch {
    return null
  }
}

function scheduleReviewSound(context: AudioContext, kind: ReviewSoundKind): void {
  const steps: ToneStep[] = kind === 'hit'
    ? [{ frequency: 660, at: 0, duration: 0.08 }, { frequency: 880, at: 0.065, duration: 0.1 }]
    : [{ frequency: 190, at: 0, duration: 0.11 }, { frequency: 135, at: 0.08, duration: 0.13 }]
  // Equal numeric peak gain is not equal perceived loudness here: the Miss
  // cue is lower-frequency and uses a triangle wave, so calibrate its output
  // upward to match the Hit cue on small phone speakers.
  const peakGain = kind === 'miss' ? 0.07 : 0.035
  const now = context.currentTime

  for (const step of steps) {
    const start = now + step.at
    const end = start + step.duration
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = kind === 'hit' ? 'sine' : 'triangle'
    oscillator.frequency.setValueAtTime(step.frequency, start)
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(peakGain, start + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, end)
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start(start)
    oscillator.stop(end + 0.02)
  }
}

function scheduleRunFinishSound(context: AudioContext, tier: RunFinishTier): void {
  const steps: Record<RunFinishTier, ToneStep[]> = {
    bad: [{ frequency: 220, at: 0, duration: 0.15 }, { frequency: 165, at: 0.13, duration: 0.2 }],
    good: [{ frequency: 523, at: 0, duration: 0.11 }, { frequency: 659, at: 0.1, duration: 0.14 }, { frequency: 784, at: 0.22, duration: 0.2 }],
    excellent: [{ frequency: 659, at: 0, duration: 0.1 }, { frequency: 784, at: 0.09, duration: 0.12 }, { frequency: 988, at: 0.19, duration: 0.13 }, { frequency: 1319, at: 0.31, duration: 0.24 }],
  }
  const now = context.currentTime
  const peakGain = tier === 'bad' ? 0.035 : 0.04
  for (const step of steps[tier]) {
    const start = now + step.at
    const end = start + step.duration
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = tier === 'bad' ? 'triangle' : 'sine'
    oscillator.frequency.setValueAtTime(step.frequency, start)
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(peakGain, start + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.0001, end)
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start(start)
    oscillator.stop(end + 0.02)
  }
}

/**
 * Play a short local review cue. Audio is optional presentation feedback: an
 * unavailable, suspended, or blocked Web Audio environment must never block a
 * review event.
 */
export function playReviewSound(kind: ReviewSoundKind): void {
  const context = getAudioContext()
  if (!context || context.state === 'closed') return

  try {
    if (context.state === 'suspended') {
      void context.resume().then(() => scheduleReviewSound(context, kind)).catch(() => undefined)
      return
    }
    scheduleReviewSound(context, kind)
  } catch {
    // Audio is an optional cue. The learning event remains authoritative.
  }
}

/** Play a short local completion cue selected from the final Run accuracy. */
export function playRunFinishSound(tier: RunFinishTier): void {
  const context = getAudioContext()
  if (!context || context.state === 'closed') return

  try {
    if (context.state === 'suspended') {
      void context.resume().then(() => scheduleRunFinishSound(context, tier)).catch(() => undefined)
      return
    }
    scheduleRunFinishSound(context, tier)
  } catch {
    // Audio is optional presentation feedback. The completed Run remains authoritative.
  }
}
