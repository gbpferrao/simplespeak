export interface Clock {
  now(): number
}

export const systemClock: Clock = {
  now: () => Date.now(),
}

export const DAY_MS = 24 * 60 * 60 * 1000
