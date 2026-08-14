import type { Settings, WordCard } from '../../../core/contracts/types'

export interface ImagePromptInput {
  card: WordCard
  note: string
  description: string
  settings: Settings
  originLanguage: string
}

export interface ComposedImagePrompt {
  systemInstruction: string
  userPrompt: string
}

export function composeImagePrompt(input: ImagePromptInput): ComposedImagePrompt {
  return {
    systemInstruction: input.settings.innerPrompt,
    userPrompt: `${input.description.trim() || input.card.imagePromptSeed}\n\nTarget word: ${input.card.target}\nSelected meaning in ${input.originLanguage}: ${input.card.origin}\nPart of speech: ${input.card.partOfSpeech}\nMeaning hook: ${input.note || input.card.noteSeed}\nRendering effort: ${input.settings.effort}. Resolution: ${input.settings.resolution}. Aspect ratio: 1:1.`,
  }
}
