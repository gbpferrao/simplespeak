import { Haptics, ImpactStyle } from '@capacitor/haptics'

/** Request the smallest platform impact for a successful review. */
export function playHitHaptic(): void {
  try {
    void Haptics.impact({ style: ImpactStyle.Light }).catch(() => undefined)
  } catch {
    // Haptics are optional presentation feedback and must never block review.
  }
}
