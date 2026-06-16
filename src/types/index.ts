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

export type CollarType = 'crew' | 'v-neck' | 'turtleneck' | 'collared' | 'off-shoulder' | 'sweatheart' | 'halter' | 'hoodie'
export type ClothingColor = 'white' | 'black' | 'gray' | 'navy' | 'beige' | 'red' | 'pink' | 'blue' | 'green' | 'yellow' | 'purple' | 'brown' | 'gold' | 'silver'
export type HairLength = 'super-short' | 'short' | 'medium' | 'long' | 'extra-long'
export type SkinTone = 'cool' | 'warm' | 'neutral'
export type OutfitScene = 'commute' | 'date' | 'wedding' | 'dinner' | 'travel' | 'party' | 'casual' | 'business'
export type Formality = 'casual' | 'smart-casual' | 'business-casual' | 'semi-formal' | 'formal'
export type WearingDuration = 'short' | 'medium' | 'long' | 'all-day'

export interface OutfitParams {
  collarType: CollarType
  clothingColor: ClothingColor
  hairLength: HairLength
  skinTone: SkinTone
  scene: OutfitScene
  formality: Formality
  wearingDuration: WearingDuration
}

export interface MatchingResult {
  totalScore: number
  dimensionScores: {
    styleMatch: number
    colorHarmony: number
    proportionBalance: number
    sceneAppropriateness: number
    comfortPracticality: number
  }
  styleTags: string[]
  suggestions: string[]
}

export interface OutfitInspirationCard {
  id: string
  name: string
  createdAt: number
  thumbnail: string
  schemeId: string | null
  leftEarring: EarringInstance
  rightEarring: EarringInstance
  effect: EffectConfig
  outfitParams: OutfitParams
  matchingResult: MatchingResult
  isFavorite: boolean
  notes: string
}

export const collarTypeLabels: Record<CollarType, string> = {
  'crew': '圆领',
  'v-neck': 'V领',
  'turtleneck': '高领',
  'collared': '翻领',
  'off-shoulder': '露肩',
  'sweatheart': '心形领',
  'halter': '挂脖领',
  'hoodie': '连帽',
}

export const clothingColorLabels: Record<ClothingColor, string> = {
  'white': '白色',
  'black': '黑色',
  'gray': '灰色',
  'navy': '藏青',
  'beige': '米色',
  'red': '红色',
  'pink': '粉色',
  'blue': '蓝色',
  'green': '绿色',
  'yellow': '黄色',
  'purple': '紫色',
  'brown': '棕色',
  'gold': '金色',
  'silver': '银色',
}

export const clothingColorHex: Record<ClothingColor, string> = {
  'white': '#ffffff',
  'black': '#1a1a2e',
  'gray': '#6b7280',
  'navy': '#1e3a5f',
  'beige': '#d4c4a8',
  'red': '#dc2626',
  'pink': '#ec4899',
  'blue': '#3b82f6',
  'green': '#22c55e',
  'yellow': '#eab308',
  'purple': '#a855f7',
  'brown': '#92400e',
  'gold': '#d4a574',
  'silver': '#c0c0c0',
}

export const hairLengthLabels: Record<HairLength, string> = {
  'super-short': '超短发',
  'short': '短发',
  'medium': '中发',
  'long': '长发',
  'extra-long': '超长',
}

export const skinToneLabels: Record<SkinTone, string> = {
  'cool': '冷皮',
  'warm': '暖皮',
  'neutral': '中性皮',
}

export const outfitSceneLabels: Record<OutfitScene, string> = {
  'commute': '通勤',
  'date': '约会',
  'wedding': '婚礼',
  'dinner': '晚宴',
  'travel': '旅行',
  'party': '派对',
  'casual': '休闲',
  'business': '商务',
}

export const formalityLabels: Record<Formality, string> = {
  'casual': '休闲',
  'smart-casual': '休闲商务',
  'business-casual': '商务休闲',
  'semi-formal': '半正式',
  'formal': '正式',
}

export const wearingDurationLabels: Record<WearingDuration, string> = {
  'short': '2小时内',
  'medium': '2-4小时',
  'long': '4-8小时',
  'all-day': '全天佩戴',
}
