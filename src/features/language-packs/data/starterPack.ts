import type { LanguagePack } from '../../../core/contracts/types'
import starterPackData from './en-ptbr-foundations-v1.json'

// The JSON file is the bounded, replaceable language-pack data source.
// Learning state, notes, generated images, and settings live elsewhere.
export const starterPack = starterPackData satisfies LanguagePack
