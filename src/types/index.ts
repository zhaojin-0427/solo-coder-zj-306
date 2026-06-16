export interface EarringTemplate {
  id: string
  name: string
  category: 'stud' | 'drop' | 'hoop' | 'tassel'
  svgContent: string
  defaultWidth: number
  defaultHeight: number
  anchorPoint: { x: number; y: number }
}

export interface EarringInstance {
  templateId: string
  side: 'left' | 'right'
  offsetX: number
  offsetY: number
  scale: number
  lengthScale: number
  rotation: number
  anchorX: number
  anchorY: number
}

export type MakeupTone = 'natural' | 'warm' | 'cool' | 'vintage'
export type LightingMode = 'natural' | 'warm' | 'cool' | 'stage'

export interface EffectConfig {
  hairstyleOverlay: boolean
  makeupTone: MakeupTone
  lightingMode: LightingMode
}

export interface Scheme {
  id: string
  name: string
  thumbnail: string
  createdAt: number
  photoData: string
  leftEarring: EarringInstance
  rightEarring: EarringInstance
  effect: EffectConfig
  recommended: boolean
  budget: string
  materialPreference: string
  sceneNotes: string
}

export interface ComparisonSlot {
  id: string
  name: string
  leftEarring: EarringInstance
  rightEarring: EarringInstance
  effect: EffectConfig
  showAnchors: boolean
  lockEffect: boolean
  thumbnail: string
  recommended: boolean
  budget: string
  materialPreference: string
  sceneNotes: string
}

export type GridMode = 2 | 3 | 4

export interface HistoryEntry {
  slotId: string
  leftEarring: EarringInstance
  rightEarring: EarringInstance
  effect: EffectConfig
  showAnchors: boolean
  lockEffect: boolean
  name: string
  recommended: boolean
  budget: string
  materialPreference: string
  sceneNotes: string
}
