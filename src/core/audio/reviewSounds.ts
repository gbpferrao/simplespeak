import type { RunFinishTier } from '../../features/study/domain/runSession'

type ReviewSoundKind = 'hit' | 'miss'

interface ToneStep {
  frequency: number
  at: number
  duration: number
}

let audioContext: AudioContext | null = null

interface RunPadState {
  context: AudioContext
  oscillator: OscillatorNode
  gain: GainNode
  level: number
  timer: number
}

const RUN_PAD_INTERVAL_MS = 720
const RUN_PAD_MIN_GAIN = 0.0015
const RUN_PAD_GAIN_RANGE = 0.0165

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
  const peakGain = 0.035
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

let runPadState: RunPadState | null = null
let runPadRequest = 0

function clampRunPadLevel(level: number): number {
  return Math.max(0, Math.min(1, level))
}

function runPadGainFor(level: number): number {
  return RUN_PAD_MIN_GAIN + clampRunPadLevel(level) * RUN_PAD_GAIN_RANGE
}

function scheduleRunPadBeat(state: RunPadState): void {
  if (state.context.state === 'closed') return
  const now = state.context.currentTime
  const oscillator = state.context.createOscillator()
  const gain = state.context.createGain()
  const peakGain = 0.0025 + state.level * 0.0105
  const end = now + 0.16
  oscillator.type = 'sine'
  oscillator.frequency.setValueAtTime(196, now)
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(peakGain, now + 0.025)
  gain.gain.exponentialRampToValueAtTime(0.0001, end)
  oscillator.connect(gain)
  gain.connect(state.context.destination)
  oscillator.start(now)
  oscillator.stop(end + 0.02)
}

function beginRunPad(context: AudioContext, level: number, request: number): void {
  if (request !== runPadRequest || context.state === 'closed') return

  try {
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(130.81, context.currentTime)
    gain.gain.setValueAtTime(0.0001, context.currentTime)
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start()

    const state: RunPadState = {
      context,
      oscillator,
      gain,
      level: clampRunPadLevel(level),
      timer: window.setInterval(() => scheduleRunPadBeat(state), RUN_PAD_INTERVAL_MS),
    }
    runPadState = state
    setRunPadVolume(level)
    scheduleRunPadBeat(state)
  } catch {
    // The pad is optional presentation feedback. Review state remains primary.
  }
}

/** Start the low, repeating Run pad. A failed or blocked context is harmless. */
export function startRunPad(level = 0): void {
  stopRunPad()
  const context = getAudioContext()
  if (!context || context.state === 'closed') return
  const request = ++runPadRequest

  try {
    if (context.state === 'suspended') {
      void context.resume().then(() => beginRunPad(context, level, request)).catch(() => undefined)
      return
    }
    beginRunPad(context, level, request)
  } catch {
    // The pad is optional presentation feedback. Review state remains primary.
  }
}

/** Adjust pad loudness without changing the Run or learning state. */
export function setRunPadVolume(level: number): void {
  const state = runPadState
  if (!state || state.context.state === 'closed') return
  const nextLevel = clampRunPadLevel(level)
  state.level = nextLevel

  try {
    const now = state.context.currentTime
    state.gain.gain.cancelScheduledValues(now)
    state.gain.gain.setTargetAtTime(runPadGainFor(nextLevel), now, 0.08)
  } catch {
    // The pad is optional presentation feedback. Review state remains primary.
  }
}

/** Stop and release all nodes owned by the active Run pad. */
export function stopRunPad(): void {
  runPadRequest += 1
  const state = runPadState
  runPadState = null
  if (!state) return

  window.clearInterval(state.timer)
  try {
    const now = state.context.currentTime
    state.gain.gain.cancelScheduledValues(now)
    state.gain.gain.setTargetAtTime(0.0001, now, 0.04)
    state.oscillator.stop(now + 0.16)
    window.setTimeout(() => {
      state.oscillator.disconnect()
      state.gain.disconnect()
    }, 220)
  } catch {
    try {
      state.oscillator.disconnect()
      state.gain.disconnect()
    } catch {
      // Audio cleanup is best effort.
    }
  }
}
