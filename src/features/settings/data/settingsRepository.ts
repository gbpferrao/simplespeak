import { Preferences } from '@capacitor/preferences'

const API_KEY = 'simplespeak_gemini_api_key'

function browserStorageAvailable(): boolean {
  return typeof window !== 'undefined' && Boolean(window.localStorage)
}

export async function loadApiKey(): Promise<string> {
  try {
    const result = await Preferences.get({ key: API_KEY })
    if (result.value) return result.value
  } catch {
    // Preferences is unavailable in some web-only contexts.
  }
  return browserStorageAvailable() ? window.localStorage.getItem(API_KEY) ?? '' : ''
}

export async function saveApiKey(value: string): Promise<void> {
  try {
    await Preferences.set({ key: API_KEY, value })
  } catch {
    // Browser fallback below.
  }
  if (browserStorageAvailable()) window.localStorage.setItem(API_KEY, value)
}
