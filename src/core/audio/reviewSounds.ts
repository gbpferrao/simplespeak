import type { RunFinishTier } from '../../features/study/domain/runSession'

type ReviewSoundKind = 'hit' | 'miss'

interface ToneStep {
  frequency: number
  at: number
  duration: number
}

const HIT_SOUND_ASSET_URLS = Array.from({ length: 11 }, (_, index) => `/audio/hits/hit-${String(index + 1).padStart(2, '0')}.mp3`)
const MISS_SOUND_ASSET_URL = '/audio/hits/miss.mp3'
const HIT_SOUND_MAX_STREAK = 8
const HIT_SOUND_MAX_DETUNE_SEMITONES = 2

let audioContext: AudioContext | null = null
let hitSoundBuffersPromise: Promise<AudioBuffer[]> | null = null
let missSoundBufferPromise: Promise<AudioBuffer> | null = null
let hitSoundStreak = 0
let hitSoundStreakEpoch = 0

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

function loadAudioBuffer(context: AudioContext, url: string): Promise<AudioBuffer> {
  return fetch(url)
    .then((response) => {
      if (!response.ok) throw new Error(`Unable to load review sound: ${url}`)
      return response.arrayBuffer()
    })
    .then((data) => context.decodeAudioData(data))
}

function getHitSoundBuffers(context: AudioContext): Promise<AudioBuffer[]> {
  if (!hitSoundBuffersPromise) {
    hitSoundBuffersPromise = Promise.all(HIT_SOUND_ASSET_URLS.map((url) => loadAudioBuffer(context, url)))
      .catch((error) => {
        hitSoundBuffersPromise = null
        throw error
      })
  }
  return hitSoundBuffersPromise
}

function getMissSoundBuffer(context: AudioContext): Promise<AudioBuffer> {
  if (!missSoundBufferPromise) {
    missSoundBufferPromise = loadAudioBuffer(context, MISS_SOUND_ASSET_URL)
      .catch((error) => {
        missSoundBufferPromise = null
        throw error
      })
  }
  return missSoundBufferPromise
}

function hitDetuneForStreak(streak: number): number {
  const normalized = Math.max(0, Math.min(1, (Math.max(1, streak) - 1) / (HIT_SOUND_MAX_STREAK - 1)))
  return normalized * HIT_SOUND_MAX_DETUNE_SEMITONES
}

function playBuffer(context: AudioContext, buffer: AudioBuffer, detuneSemitones = 0): void {
  try {
    const source = context.createBufferSource()
    source.buffer = buffer
    source.detune.setValueAtTime(detuneSemitones, context.currentTime)
    source.connect(context.destination)
    source.start()
  } catch {
    // Audio is optional presentation feedback. Review state remains primary.
  }
}

function scheduleReviewSound(context: AudioContext, kind: ReviewSoundKind): void {
  const steps: ToneStep[] = kind === 'hit'
    ? [{ frequency: 660, at: 0, duration: 0.08 }, { frequency: 880, at: 0.065, duration: 0.1 }]
    : [{ frequency: 190, at: 0, duration: 0.11 }, { frequency: 135, at: 0.08, duration: 0.13 }]
  // Equal numeric peak gain is not equal perceived loudness here: the Miss
  // fallback is lower-frequency and uses a triangle wave, so calibrate its
  // output upward to match the Hit fallback on small phone speakers.
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

function scheduleHitSound(context: AudioContext, streak: number, epoch: number): void {
  getHitSoundBuffers(context).then((buffers) => {
    if (epoch !== hitSoundStreakEpoch || context.state === 'closed' || buffers.length === 0) return
    const buffer = buffers[Math.floor(Math.random() * buffers.length)]
    if (buffer) playBuffer(context, buffer, hitDetuneForStreak(streak))
  }).catch(() => {
    scheduleReviewSound(context, 'hit')
  })
}

function scheduleMissSound(context: AudioContext): void {
  getMissSoundBuffer(context).then((buffer) => {
    if (context.state !== 'closed') playBuffer(context, buffer)
  }).catch(() => {
    scheduleReviewSound(context, 'miss')
  })
}

function runWhenAudioReady(context: AudioContext, callback: () => void): void {
  if (context.state === 'suspended') {
    void context.resume().then(callback).catch(() => undefined)
    return
  }
  callback()
}

/** Reset the Hit asset pitch progression for a new Run or completed review flow. */
export function resetHitSoundStreak(): void {
  hitSoundStreak = 0
  hitSoundStreakEpoch += 1
}

/**
 * Play a short local review cue. Audio is optional presentation feedback: an
 * unavailable, suspended, or blocked Web Audio environment must never block a
 * review event.
 */
export function playReviewSound(kind: ReviewSoundKind): void {
  const streak = kind === 'hit' ? ++hitSoundStreak : 0
  if (kind === 'miss') resetHitSoundStreak()
  const context = getAudioContext()
  if (!context || context.state === 'closed') return

  try {
    const epoch = hitSoundStreakEpoch
    runWhenAudioReady(context, () => {
      if (kind === 'hit') {
        scheduleHitSound(context, streak, epoch)
      } else {
        scheduleMissSound(context)
      }
    })
  } catch {
    // Audio is an optional cue. The learning event remains authoritative.
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

/** Play a short local completion cue selected from the final Run accuracy. */
export function playRunFinishSound(tier: RunFinishTier): void {
  const context = getAudioContext()
  if (!context || context.state === 'closed') return

  try {
    runWhenAudioReady(context, () => scheduleRunFinishSound(context, tier))
  } catch {
    // Audio is optional presentation feedback. The completed Run remains authoritative.
  }
}
