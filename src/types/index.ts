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

export type MaterialType =
  | 'sterling-silver'
  | 'gold'
  | 'rose-gold'
  | 'platinum'
  | 'titanium'
  | 'stainless-steel'
  | 'brass'
  | 'alloy'
  | 'copper'
  | 'plastic'
  | 'acrylic'
  | 'resin'
  | 'pearl'
  | 'gemstone'
  | 'wood'
  | 'leather'
  | 'other'

export const materialTypeLabels: Record<MaterialType, string> = {
  'sterling-silver': '925纯银',
  'gold': '黄金',
  'rose-gold': '玫瑰金',
  'platinum': '铂金',
  'titanium': '钛金属',
  'stainless-steel': '不锈钢',
  'brass': '黄铜',
  'alloy': '合金',
  'copper': '红铜',
  'plastic': '塑料',
  'acrylic': '亚克力',
  'resin': '树脂',
  'pearl': '珍珠',
  'gemstone': '宝石',
  'wood': '木质',
  'leather': '皮质',
  'other': '其他',
}

export type PlatingProcess =
  | 'none'
  | 'gold-plated'
  | 'rose-gold-plated'
  | 'silver-plated'
  | 'rhodium-plated'
  | 'platinum-plated'
  | 'vacuum-plated'
  | 'electroplated'
  | 'enamel'
  | 'other'

export const platingProcessLabels: Record<PlatingProcess, string> = {
  'none': '无镀层',
  'gold-plated': '镀金',
  'rose-gold-plated': '镀玫瑰金',
  'silver-plated': '镀银',
  'rhodium-plated': '镀铑',
  'platinum-plated': '镀铂金',
  'vacuum-plated': '真空镀',
  'electroplated': '电镀',
  'enamel': '珐琅',
  'other': '其他',
}

export type EarPostMaterial =
  | 'sterling-silver'
  | 'titanium'
  | 'medical-steel'
  | 'stainless-steel'
  | 'gold'
  | 'platinum'
  | 'copper'
  | 'alloy'
  | 'plastic'
  | 'other'

export const earPostMaterialLabels: Record<EarPostMaterial, string> = {
  'sterling-silver': '925纯银耳针',
  'titanium': '钛合金耳针',
  'medical-steel': '医用钢耳针',
  'stainless-steel': '不锈钢耳针',
  'gold': '黄金耳针',
  'platinum': '铂金耳针',
  'copper': '红铜耳针',
  'alloy': '合金耳针',
  'plastic': '塑料耳针',
  'other': '其他材质',
}

export type WeightRange = 'very-light' | 'light' | 'medium' | 'heavy' | 'very-heavy'

export const weightRangeLabels: Record<WeightRange, string> = {
  'very-light': '极轻 (<3g)',
  'light': '轻盈 (3-8g)',
  'medium': '适中 (8-15g)',
  'heavy': '偏重 (15-25g)',
  'very-heavy': '厚重 (>25g)',
}

export type WearingFrequency = 'daily' | 'frequent' | 'weekly' | 'occasional' | 'rare'

export const wearingFrequencyLabels: Record<WearingFrequency, string> = {
  'daily': '日常佩戴',
  'frequent': '频繁佩戴',
  'weekly': '每周佩戴',
  'occasional': '偶尔佩戴',
  'rare': '极少佩戴',
}

export type CleaningCycle = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly'

export const cleaningCycleLabels: Record<CleaningCycle, string> = {
  'daily': '每日清洁',
  'weekly': '每周清洁',
  'biweekly': '每两周清洁',
  'monthly': '每月清洁',
  'quarterly': '每季深度清洁',
}

export type RiskLevel = 'low' | 'medium' | 'high' | 'very-high'

export const riskLevelLabels: Record<RiskLevel, string> = {
  'low': '低风险',
  'medium': '中风险',
  'high': '高风险',
  'very-high': '极高风险',
}

export const riskLevelColors: Record<RiskLevel, string> = {
  'low': '#4ade80',
  'medium': '#facc15',
  'high': '#fb923c',
  'very-high': '#ef4444',
}

export const riskLevelBgColors: Record<RiskLevel, string> = {
  'low': 'rgba(74, 222, 128, 0.15)',
  'medium': 'rgba(250, 204, 21, 0.15)',
  'high': 'rgba(251, 146, 60, 0.15)',
  'very-high': 'rgba(239, 68, 68, 0.15)',
}

export interface EarringMaterialInfo {
  id: string
  schemeId: string | null
  slotId: string | null
  inspirationCardId: string | null
  name: string
  thumbnail: string
  mainMaterial: MaterialType
  platingProcess: PlatingProcess
  earPostMaterial: EarPostMaterial
  weightRange: WeightRange
  isAllergenic: boolean
  allergyNotes: string
  wearingFrequency: WearingFrequency
  cleaningCycle: CleaningCycle
  customCleaningDays: number
  lastCleanedAt: number | null
  lastWornAt: number | null
  notes: string
  createdAt: number
  updatedAt: number
}

export interface RiskAssessment {
  score: number
  level: RiskLevel
  factors: {
    name: string
    score: number
    description: string
  }[]
  warnings: string[]
}

export type PlanType = 'wear' | 'clean' | 'check' | 'repair'

export const planTypeLabels: Record<PlanType, string> = {
  'wear': '佩戴计划',
  'clean': '清洁提醒',
  'check': '检查提醒',
  'repair': '保养维修',
}

export type PlanStatus = 'pending' | 'completed' | 'delayed' | 'cancelled'

export const planStatusLabels: Record<PlanStatus, string> = {
  'pending': '待完成',
  'completed': '已完成',
  'delayed': '已延期',
  'cancelled': '已取消',
}

export interface MaintenancePlan {
  id: string
  materialInfoId: string
  type: PlanType
  title: string
  description: string
  date: string
  time: string
  status: PlanStatus
  completedAt: number | null
  originalDate: string
  scene: OutfitScene
  duration: WearingDuration
  suggestions: string[]
  createdAt: number
  updatedAt: number
}

export interface MaintenanceSuggestion {
  category: 'cleaning' | 'storage' | 'wearing' | 'allergy' | 'repair'
  title: string
  content: string
  priority: 'high' | 'medium' | 'low'
}

export type ViewMode = 'calendar' | 'list'

export type FilterType = 'all' | 'material' | 'risk' | 'date' | 'status'

export type GiftRecipient =
  | 'mother'
  | 'sister'
  | 'girlfriend'
  | 'wife'
  | 'friend'
  | 'colleague'
  | 'elder'
  | 'child'
  | 'teacher'
  | 'other'

export const giftRecipientLabels: Record<GiftRecipient, string> = {
  'mother': '妈妈',
  'sister': '姐妹',
  'girlfriend': '女朋友',
  'wife': '妻子',
  'friend': '朋友',
  'colleague': '同事',
  'elder': '长辈',
  'child': '晚辈',
  'teacher': '老师',
  'other': '其他',
}

export type BudgetRange =
  | 'under-50'
  | '50-100'
  | '100-300'
  | '300-500'
  | '500-1000'
  | '1000-3000'
  | '3000-plus'

export const budgetRangeLabels: Record<BudgetRange, string> = {
  'under-50': '50元以下',
  '50-100': '50-100元',
  '100-300': '100-300元',
  '300-500': '300-500元',
  '500-1000': '500-1000元',
  '1000-3000': '1000-3000元',
  '3000-plus': '3000元以上',
}

export type FestivalTag =
  | 'spring-festival'
  | 'valentines'
  | 'womens-day'
  | 'mothers-day'
  | 'dragon-boat'
  | 'qixi'
  | 'mid-autumn'
  | 'teachers-day'
  | 'national-day'
  | 'christmas'
  | 'new-year'
  | 'birthday'
  | 'anniversary'
  | 'graduation'
  | 'housewarming'
  | 'thank-you'
  | 'other'

export const festivalTagLabels: Record<FestivalTag, string> = {
  'spring-festival': '春节',
  'valentines': '情人节',
  'womens-day': '妇女节',
  'mothers-day': '母亲节',
  'dragon-boat': '端午节',
  'qixi': '七夕',
  'mid-autumn': '中秋节',
  'teachers-day': '教师节',
  'national-day': '国庆节',
  'christmas': '圣诞节',
  'new-year': '元旦',
  'birthday': '生日',
  'anniversary': '纪念日',
  'graduation': '毕业季',
  'housewarming': '乔迁',
  'thank-you': '答谢',
  'other': '其他',
}

export const festivalTagMonth: Record<FestivalTag, number[]> = {
  'spring-festival': [1, 2],
  'valentines': [2],
  'womens-day': [3],
  'mothers-day': [5],
  'dragon-boat': [5, 6],
  'qixi': [7, 8],
  'mid-autumn': [9, 10],
  'teachers-day': [9],
  'national-day': [10],
  'christmas': [12],
  'new-year': [1],
  'birthday': [],
  'anniversary': [],
  'graduation': [6, 7],
  'housewarming': [],
  'thank-you': [],
  'other': [],
}

export type StorageViewMode = 'card' | 'list'

export type StorageFilterField =
  | 'all'
  | 'scene'
  | 'budget'
  | 'risk'
  | 'festival'
  | 'isPaired'
  | 'suitableForGift'
  | 'isFavorite'

export interface StorageCard {
  id: string
  schemeId: string | null
  materialInfoId: string | null
  name: string
  thumbnail: string
  storageBoxNumber: string
  isPaired: boolean
  lastWornAt: number | null
  suitableForGift: boolean
  giftRecipient: GiftRecipient | ''
  budgetRange: BudgetRange | ''
  festivalTags: FestivalTag[]
  isFavorite: boolean
  notes: string
  scene: OutfitScene | ''
  leftEarring: EarringInstance
  rightEarring: EarringInstance
  effect: EffectConfig
  createdAt: number
  updatedAt: number
}

export interface StorageSuggestion {
  category: 'storage' | 'gift' | 'wear' | 'care'
  title: string
  content: string
  priority: 'high' | 'medium' | 'low'
}

export interface GiftRecommendation {
  score: number
  reasons: string[]
  suitableRecipients: GiftRecipient[]
  suitableFestivals: FestivalTag[]
  suggestions: string[]
}

export interface StorageScoreCard {
  storageScore: number
  giftScore: number
  priorityScore: number
  riskLevel: RiskLevel
  storageSuggestions: StorageSuggestion[]
  giftRecommendation: GiftRecommendation
}

export interface StorageReminder {
  id: string
  cardId: string
  cardName: string
  thumbnail: string
  type: 'wear' | 'clean' | 'gift' | 'festival'
  title: string
  content: string
  targetDate: string
  festivalTag?: FestivalTag
  createdAt: number
}
