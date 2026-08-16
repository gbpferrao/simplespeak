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
    userPrompt: `${input.description.trim() || input.card.imagePrompt || `A clear, memorable 1:1 visual mnemonic for “${input.card.target}”, meaning “${input.card.origin}”. Show one concrete scene, no written words, no labels, no letters.`}\n\nTarget word: ${input.card.target}\nSelected meaning in ${input.originLanguage}: ${input.card.origin}\nPart of speech: ${input.card.partOfSpeech}\nMeaning hook: ${input.note || input.card.note || `Meaning: ${input.card.origin}.`}\nThinking level: ${input.settings.effort}. Image size: ${input.settings.resolution}. Aspect ratio: 1:1.`,
 }
}
