import type { WordCard } from '../../../core/contracts/types'

export function normalizeAnswer(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
}

export function isAnswerCorrect(card: WordCard, answer: string): boolean {
  const normalized = normalizeAnswer(answer)
  return [card.target, ...(card.answers ?? [])].some((accepted) => normalizeAnswer(accepted) === normalized)
}
