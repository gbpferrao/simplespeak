export const HPM_CUE_OFFSET = 2
export const HPM_CUE_OUT_DURATION = 0.09
export const HPM_CUE_RETURN_DURATION = 0.16
export const HPM_CUE_PAUSE_MS = 120

export const HPM_CUE_CORNER_DELTAS = [
  { x: -HPM_CUE_OFFSET, y: -HPM_CUE_OFFSET },
  { x: HPM_CUE_OFFSET, y: -HPM_CUE_OFFSET },
  { x: -HPM_CUE_OFFSET, y: HPM_CUE_OFFSET },
  { x: HPM_CUE_OFFSET, y: HPM_CUE_OFFSET },
] as const

export function nextRandomCornerIndex(previousIndex: number): number {
  const cornerCount = HPM_CUE_CORNER_DELTAS.length
  const candidate = Math.floor(Math.random() * cornerCount)
  if (previousIndex < 0 || candidate !== previousIndex) return candidate
  return (previousIndex + 1 + Math.floor(Math.random() * (cornerCount - 1))) % cornerCount
}
