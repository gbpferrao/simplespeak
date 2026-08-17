import type { WordCard } from '../../../core/contracts/types'

export function normalizeAnswer(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFKC')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N} ]/gu, '')
    .replace(/\s+/g, ' ')
}

export function isAnswerCorrect(card: WordCard, answer: string): boolean {
  const normalized = normalizeAnswer(answer)
  if (!normalized) return false
  return [card.target, ...(card.answers ?? [])].some((accepted) => normalizeAnswer(accepted) === normalized)
}
