import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type {
  EarringInstance,
  EarringTemplate,
  EffectConfig,
  Scheme,
  ComparisonSlot,
  GridMode,
  HistoryEntry,
  OutfitInspirationCard,
  OutfitParams,
  MatchingResult,
  OutfitScene,
  EarringMaterialInfo,
  MaintenancePlan,
  RiskAssessment,
  MaintenanceSuggestion,
  MaterialType,
  PlatingProcess,
  EarPostMaterial,
  WeightRange,
  WearingFrequency,
  CleaningCycle,
  PlanType,
  PlanStatus,
  WearingDuration,
  RiskLevel,
  riskLevelLabels,
  GiftRecipient,
  BudgetRange,
  FestivalTag,
  StorageCard,
  StorageSuggestion,
  GiftRecommendation,
  StorageScoreCard,
  StorageReminder,
} from '@/types'
import {
  materialTypeLabels,
  platingProcessLabels,
  earPostMaterialLabels,
  weightRangeLabels,
  wearingFrequencyLabels,
  cleaningCycleLabels,
  planTypeLabels,
  planStatusLabels,
  wearingDurationLabels,
  outfitSceneLabels,
  giftRecipientLabels,
  budgetRangeLabels,
  festivalTagLabels,
  festivalTagMonth,
  riskLevelColors,
} from '@/types'
import { earringTemplates, categoryLabels } from '@/data/earringTemplates'

const STORAGE_KEY = 'earring-tryon-schemes'
const WORKSPACE_KEY = 'earring-tryon-workspace'
const PHOTO_KEY = 'earring-tryon-photo'
const INSPIRATION_KEY = 'earring-tryon-inspiration'
const MATERIAL_INFO_KEY = 'earring-tryon-material-info'
const MAINTENANCE_PLANS_KEY = 'earring-tryon-maintenance-plans'
const STORAGE_CARDS_KEY = 'earring-storage-cards'

function loadPhoto(): { data: string | null; width: number; height: number } {
  try {
    const raw = localStorage.getItem(PHOTO_KEY)
    if (!raw) return { data: null, width: 0, height: 0 }
    const parsed = JSON.parse(raw)
    return {
      data: parsed.data || null,
      width: parsed.width || 0,
      height: parsed.height || 0,
    }
  } catch {
    return { data: null, width: 0, height: 0 }
  }
}

function savePhoto(data: string, width: number, height: number) {
  try {
    localStorage.setItem(PHOTO_KEY, JSON.stringify({ data, width, height }))
  } catch {
    // storage full
  }
}

function createDefaultEarring(side: 'left' | 'right'): EarringInstance {
  return {
    templateId: 'stud-01',
    side,
    offsetX: 0,
    offsetY: 0,
    scale: 1,
    lengthScale: 1,
    rotation: 0,
    anchorX: side === 'left' ? 0.28 : 0.72,
    anchorY: 0.45,
  }
}

function migrateEarring(e: any): EarringInstance {
  return {
    ...e,
    lengthScale: e.lengthScale ?? 1,
  }
}

function migrateScheme(s: any): Scheme {
  return {
    ...s,
    leftEarring: migrateEarring(s.leftEarring),
    rightEarring: migrateEarring(s.rightEarring),
    recommended: s.recommended ?? false,
    budget: s.budget ?? '',
    materialPreference: s.materialPreference ?? '',
    sceneNotes: s.sceneNotes ?? '',
  }
}

function loadSchemes(): Scheme[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.map(migrateScheme) : []
  } catch {
    return []
  }
}

function saveSchemes(schemes: Scheme[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(schemes))
  } catch {
    // storage full
  }
}

function createSlot(index: number): ComparisonSlot {
  return {
    id: `slot-${Date.now()}-${index}`,
    name: `方案 ${index + 1}`,
    leftEarring: createDefaultEarring('left'),
    rightEarring: createDefaultEarring('right'),
    effect: { hairstyleOverlay: false, makeupTone: 'natural', lightingMode: 'natural' },
    showAnchors: false,
    lockEffect: false,
    thumbnail: '',
    recommended: false,
    budget: '',
    materialPreference: '',
    sceneNotes: '',
  }
}

function loadWorkspace(): { gridMode: GridMode; slots: ComparisonSlot[] } {
  try {
    const raw = localStorage.getItem(WORKSPACE_KEY)
    if (!raw) return { gridMode: 2, slots: [createSlot(0), createSlot(1)] }
    const parsed = JSON.parse(raw)
    return {
      gridMode: parsed.gridMode ?? 2,
      slots: Array.isArray(parsed.slots) ? parsed.slots : [createSlot(0), createSlot(1)],
    }
  } catch {
    return { gridMode: 2, slots: [createSlot(0), createSlot(1)] }
  }
}

function saveWorkspace(data: { gridMode: GridMode; slots: ComparisonSlot[] }) {
  try {
    localStorage.setItem(WORKSPACE_KEY, JSON.stringify(data))
  } catch {
    // storage full
  }
}

function loadInspirationCards(): OutfitInspirationCard[] {
  try {
    const raw = localStorage.getItem(INSPIRATION_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveInspirationCards(cards: OutfitInspirationCard[]) {
  try {
    localStorage.setItem(INSPIRATION_KEY, JSON.stringify(cards))
  } catch {
    // storage full
  }
}

function createDefaultOutfitParams(): OutfitParams {
  return {
    collarType: 'crew',
    clothingColor: 'white',
    hairLength: 'medium',
    skinTone: 'neutral',
    scene: 'casual',
    formality: 'smart-casual',
    wearingDuration: 'medium',
  }
}

function calculateMatchingScore(
  leftEarring: EarringInstance,
  rightEarring: EarringInstance,
  effect: EffectConfig,
  outfitParams: OutfitParams
): MatchingResult {
  const leftTemplate = earringTemplates.find((t) => t.id === leftEarring.templateId) || earringTemplates[0]
  const rightTemplate = earringTemplates.find((t) => t.id === rightEarring.templateId) || earringTemplates[0]

  const avgScale = (leftEarring.scale + rightEarring.scale) / 2
  const avgLengthScale = (leftEarring.lengthScale + rightEarring.lengthScale) / 2
  const earringSize = avgScale * avgLengthScale

  let styleMatch = 60
  let colorHarmony = 60
  let proportionBalance = 60
  let sceneAppropriateness = 60
  let comfortPracticality = 60

  const styleTags: string[] = []
  const suggestions: string[] = []

  const earringCategories = new Set([leftTemplate.category, rightTemplate.category])
  const hasStud = earringCategories.has('stud')
  const hasDrop = earringCategories.has('drop')
  const hasHoop = earringCategories.has('hoop')
  const hasTassel = earringCategories.has('tassel')

  if (hasStud) styleTags.push('简约精致')
  if (hasDrop) styleTags.push('优雅垂坠')
  if (hasHoop) styleTags.push('时尚圈环')
  if (hasTassel) styleTags.push('灵动流苏')

  const sceneFormalityMap: Record<OutfitScene, number> = {
    commute: 2,
    date: 3,
    wedding: 5,
    dinner: 5,
    travel: 1,
    party: 4,
    casual: 1,
    business: 3,
  }

  const formalityLevel: Record<string, number> = {
    casual: 1,
    'smart-casual': 2,
    'business-casual': 3,
    'semi-formal': 4,
    formal: 5,
  }

  const sceneLevel = sceneFormalityMap[outfitParams.scene]
  const formalityLevelVal = formalityLevel[outfitParams.formality]

  if (Math.abs(sceneLevel - formalityLevelVal) <= 1) {
    sceneAppropriateness += 15
  } else if (Math.abs(sceneLevel - formalityLevelVal) <= 2) {
    sceneAppropriateness += 5
  } else {
    sceneAppropriateness -= 10
    suggestions.push('场景与正式程度匹配度较低，建议调整')
  }

  if (outfitParams.scene === 'wedding' || outfitParams.scene === 'dinner') {
    if (hasDrop || hasTassel) {
      sceneAppropriateness += 15
      styleTags.push('隆重华丽')
    } else if (hasStud) {
      sceneAppropriateness += 5
      suggestions.push('隆重场合建议选择耳坠或流苏款式增加气场')
    }
  }

  if (outfitParams.scene === 'commute' || outfitParams.scene === 'business') {
    if (hasStud || hasHoop) {
      sceneAppropriateness += 15
      styleTags.push('干练专业')
    } else if (hasTassel) {
      sceneAppropriateness -= 5
      suggestions.push('商务场合流苏款式可能过于张扬，建议选择简约款式')
    }
  }

  if (outfitParams.scene === 'date' || outfitParams.scene === 'party') {
    if (hasDrop || hasHoop) {
      sceneAppropriateness += 10
      styleTags.push('浪漫吸睛')
    }
    if (effect.lightingMode === 'warm' || effect.lightingMode === 'stage') {
      sceneAppropriateness += 5
    }
  }

  if (outfitParams.scene === 'travel' || outfitParams.scene === 'casual') {
    if (hasStud || hasHoop) {
      sceneAppropriateness += 10
      styleTags.push('轻松随性')
    }
  }

  const warmColors = new Set(['beige', 'red', 'pink', 'yellow', 'brown', 'gold'])
  const coolColors = new Set(['white', 'black', 'gray', 'navy', 'blue', 'green', 'purple', 'silver'])

  const isWarmClothing = warmColors.has(outfitParams.clothingColor)
  const isCoolClothing = coolColors.has(outfitParams.clothingColor)

  if (outfitParams.skinTone === 'warm' && isWarmClothing) {
    colorHarmony += 15
    styleTags.push('暖色调和谐')
  } else if (outfitParams.skinTone === 'cool' && isCoolClothing) {
    colorHarmony += 15
    styleTags.push('冷色调和谐')
  } else if (outfitParams.skinTone === 'neutral') {
    colorHarmony += 10
    styleTags.push('中性肤色百搭')
  } else {
    colorHarmony -= 5
    suggestions.push('肤色与服装色调对比强烈，可考虑金属色耳饰过渡')
  }

  if (effect.lightingMode === 'warm' && isWarmClothing) {
    colorHarmony += 5
  } else if (effect.lightingMode === 'cool' && isCoolClothing) {
    colorHarmony += 5
  }

  if (outfitParams.clothingColor === 'gold' || outfitParams.clothingColor === 'silver') {
    colorHarmony += 5
    styleTags.push('金属感呼应')
  }

  if (outfitParams.collarType === 'off-shoulder' || outfitParams.collarType === 'halter' || outfitParams.collarType === 'sweatheart') {
    if (hasDrop || hasTassel) {
      proportionBalance += 15
      styleTags.push('肩颈线条优化')
    } else if (hasStud) {
      proportionBalance -= 5
      suggestions.push('露肩款式建议搭配垂坠感耳饰，平衡颈部留白')
    }
  }

  if (outfitParams.collarType === 'turtleneck' || outfitParams.collarType === 'hoodie') {
    if (hasDrop || hasTassel) {
      proportionBalance += 10
      styleTags.push('纵向延伸')
    }
    if (earringSize > 1.5) {
      proportionBalance += 5
    }
  }

  if (outfitParams.collarType === 'v-neck') {
    if (hasDrop) {
      proportionBalance += 10
      styleTags.push('V领呼应')
    }
  }

  if (outfitParams.collarType === 'crew' || outfitParams.collarType === 'collared') {
    if (hasStud || hasHoop) {
      proportionBalance += 10
      styleTags.push('经典平衡')
    }
  }

  const hairLengthWeight: Record<string, number> = {
    'super-short': 1.2,
    short: 1.1,
    medium: 1.0,
    long: 0.9,
    'extra-long': 0.8,
  }

  const hairFactor = hairLengthWeight[outfitParams.hairLength] || 1.0

  if (outfitParams.hairLength === 'super-short' || outfitParams.hairLength === 'short') {
    if (hasDrop || hasTassel || hasHoop) {
      proportionBalance += 10
      styleTags.push('短发突出')
    }
  }

  if (outfitParams.hairLength === 'long' || outfitParams.hairLength === 'extra-long') {
    if (earringSize * hairFactor > 1.2) {
      proportionBalance += 5
    } else {
      suggestions.push('长发建议选择尺寸稍大的耳饰，避免被头发遮挡')
    }
  }

  if (earringSize < 0.7) {
    proportionBalance -= 5
    suggestions.push('耳饰尺寸偏小，可适当放大增强存在感')
  } else if (earringSize > 1.8) {
    proportionBalance += 5
    styleTags.push('夸张醒目')
  }

  const durationWeight: Record<string, number> = {
    short: 1.2,
    medium: 1.0,
    long: 0.8,
    'all-day': 0.6,
  }

  const durWeight = durationWeight[outfitParams.wearingDuration] || 1.0

  if (outfitParams.wearingDuration === 'all-day' || outfitParams.wearingDuration === 'long') {
    if (hasStud) {
      comfortPracticality += 15
      styleTags.push('舒适持久')
    }
    if (hasTassel || earringSize > 1.5) {
      comfortPracticality -= 10
      suggestions.push('长时间佩戴建议选择轻盈的耳钉款式，减轻耳部负担')
    }
  }

  if (outfitParams.wearingDuration === 'short') {
    comfortPracticality += 10
  }

  if (effect.makeupTone === 'natural') {
    styleMatch += 5
  } else if (effect.makeupTone === 'warm' && outfitParams.skinTone === 'warm') {
    styleMatch += 10
    styleTags.push('暖妆暖皮')
  } else if (effect.makeupTone === 'cool' && outfitParams.skinTone === 'cool') {
    styleMatch += 10
    styleTags.push('冷妆冷皮')
  } else if (effect.makeupTone === 'vintage') {
    styleMatch += 5
    styleTags.push('复古氛围')
  }

  if (leftTemplate.category === rightTemplate.category) {
    styleMatch += 10
    styleTags.push('对称和谐')
  } else {
    styleTags.push('个性混搭')
    if (outfitParams.scene === 'party' || outfitParams.scene === 'date') {
      styleMatch += 5
    }
  }

  styleMatch = Math.min(100, Math.max(0, styleMatch))
  colorHarmony = Math.min(100, Math.max(0, colorHarmony))
  proportionBalance = Math.min(100, Math.max(0, proportionBalance))
  sceneAppropriateness = Math.min(100, Math.max(0, sceneAppropriateness))
  comfortPracticality = Math.min(100, Math.max(0, comfortPracticality))

  const totalScore = Math.round(
    styleMatch * 0.25 +
    colorHarmony * 0.25 +
    proportionBalance * 0.2 +
    sceneAppropriateness * 0.2 +
    comfortPracticality * 0.1
  )

  if (totalScore >= 85) {
    styleTags.unshift('绝佳搭配')
  } else if (totalScore >= 75) {
    styleTags.unshift('优秀搭配')
  } else if (totalScore >= 65) {
    styleTags.unshift('良好搭配')
  } else {
    suggestions.unshift('整体搭配有提升空间，可根据建议调整')
  }

  if (suggestions.length === 0) {
    suggestions.push('整体搭配和谐，可根据心情和场合灵活调整')
  }

  return {
    totalScore,
    dimensionScores: {
      styleMatch,
      colorHarmony,
      proportionBalance,
      sceneAppropriateness,
      comfortPracticality,
    },
    styleTags: [...new Set(styleTags)],
    suggestions,
  }
}

export const useEarringStore = defineStore('earring', () => {
  const savedPhoto = loadPhoto()
  const photo = ref<string | null>(savedPhoto.data)
  const photoWidth = ref(savedPhoto.width)
  const photoHeight = ref(savedPhoto.height)
  const leftAnchor = ref({ x: 0.28, y: 0.45 })
  const rightAnchor = ref({ x: 0.72, y: 0.45 })
  const leftEarring = ref<EarringInstance>(createDefaultEarring('left'))
  const rightEarring = ref<EarringInstance>(createDefaultEarring('right'))
  const selectedTemplateId = ref<string>('stud-01')
  const effect = ref<EffectConfig>({
    hairstyleOverlay: false,
    makeupTone: 'natural',
    lightingMode: 'natural',
  })
  const schemes = ref<Scheme[]>(loadSchemes())
  const showAnchors = ref(true)
  const canvasScale = ref(1)
  const canvasOffset = ref({ x: 0, y: 0 })

  const selectedTemplate = ref<EarringTemplate>(earringTemplates[0])

  const workspace = ref<{ gridMode: GridMode; slots: ComparisonSlot[] }>(loadWorkspace())
  const undoStack = ref<HistoryEntry[]>([])
  const redoStack = ref<HistoryEntry[]>([])
  const MAX_HISTORY = 20
  const inspirationCards = ref<OutfitInspirationCard[]>(loadInspirationCards())
  const activeOutfitParams = ref<OutfitParams>(createDefaultOutfitParams())
  const activeMatchingResult = ref<MatchingResult | null>(null)

  watch(schemes, (val) => saveSchemes(val), { deep: true })

  watch(workspace, (val) => saveWorkspace(val), { deep: true })

  watch(inspirationCards, (val) => saveInspirationCards(val), { deep: true })

  function setPhoto(dataUrl: string, width: number, height: number) {
    photo.value = dataUrl
    photoWidth.value = width
    photoHeight.value = height
    showAnchors.value = true
    savePhoto(dataUrl, width, height)
  }

  function setAnchor(side: 'left' | 'right', x: number, y: number) {
    if (side === 'left') {
      leftAnchor.value = { x, y }
      leftEarring.value.anchorX = x
      leftEarring.value.anchorY = y
    } else {
      rightAnchor.value = { x, y }
      rightEarring.value.anchorX = x
      rightEarring.value.anchorY = y
    }
  }

  function selectTemplate(template: EarringTemplate) {
    selectedTemplate.value = template
    selectedTemplateId.value = template.id
    leftEarring.value.templateId = template.id
    rightEarring.value.templateId = template.id
  }

  function updateEarring(side: 'left' | 'right', props: Partial<EarringInstance>) {
    const earring = side === 'left' ? leftEarring : rightEarring
    Object.assign(earring.value, props)
  }

  function updateEffect(props: Partial<EffectConfig>) {
    Object.assign(effect.value, props)
  }

  function saveScheme(name: string, thumbnail: string) {
    if (!photo.value) return
    const scheme: Scheme = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name,
      thumbnail,
      createdAt: Date.now(),
      photoData: photo.value,
      leftEarring: JSON.parse(JSON.stringify(leftEarring.value)),
      rightEarring: JSON.parse(JSON.stringify(rightEarring.value)),
      effect: JSON.parse(JSON.stringify(effect.value)),
      recommended: false,
      budget: '',
      materialPreference: '',
      sceneNotes: '',
    }
    schemes.value.unshift(scheme)
  }

  function loadScheme(scheme: Scheme) {
    const left = migrateEarring(scheme.leftEarring)
    const right = migrateEarring(scheme.rightEarring)
    photo.value = scheme.photoData
    leftEarring.value = left
    rightEarring.value = right
    leftAnchor.value = { x: left.anchorX, y: left.anchorY }
    rightAnchor.value = { x: right.anchorX, y: right.anchorY }
    effect.value = JSON.parse(JSON.stringify(scheme.effect))
    const tmpl = earringTemplates.find((t) => t.id === left.templateId)
    if (tmpl) {
      selectedTemplate.value = tmpl
      selectedTemplateId.value = tmpl.id
    }
    showAnchors.value = true
    const img = new Image()
    img.onload = () => {
      photoWidth.value = img.naturalWidth
      photoHeight.value = img.naturalHeight
      savePhoto(scheme.photoData, img.naturalWidth, img.naturalHeight)
    }
    img.src = scheme.photoData
  }

  function deleteScheme(id: string) {
    schemes.value = schemes.value.filter((s) => s.id !== id)
  }

  function deleteSchemes(ids: string[]) {
    const idSet = new Set(ids)
    schemes.value = schemes.value.filter((s) => !idSet.has(s.id))
  }

  function renameScheme(id: string, newName: string) {
    const scheme = schemes.value.find((s) => s.id === id)
    if (scheme) {
      scheme.name = newName
    }
  }

  function updateSchemeMeta(id: string, meta: Partial<Pick<Scheme, 'recommended' | 'budget' | 'materialPreference' | 'sceneNotes'>>) {
    const scheme = schemes.value.find((s) => s.id === id)
    if (scheme) {
      Object.assign(scheme, meta)
    }
  }

  function resetAnchors() {
    leftAnchor.value = { x: 0.28, y: 0.45 }
    rightAnchor.value = { x: 0.72, y: 0.45 }
    leftEarring.value.anchorX = 0.28
    leftEarring.value.anchorY = 0.45
    rightEarring.value.anchorX = 0.72
    rightEarring.value.anchorY = 0.45
  }

  function resetEarring(side: 'left' | 'right') {
    const anchor = side === 'left' ? leftAnchor.value : rightAnchor.value
    const earring = createDefaultEarring(side)
    earring.templateId = selectedTemplateId.value
    earring.anchorX = anchor.x
    earring.anchorY = anchor.y
    if (side === 'left') {
      leftEarring.value = earring
    } else {
      rightEarring.value = earring
    }
  }

  function setGridMode(mode: GridMode) {
    workspace.value.gridMode = mode
    const current = workspace.value.slots.length
    if (mode > current) {
      for (let i = current; i < mode; i++) {
        workspace.value.slots.push(createSlot(i))
      }
    } else if (mode < current) {
      workspace.value.slots = workspace.value.slots.slice(0, mode)
    }
  }

  function pushSlotHistory(slotId: string) {
    const slot = workspace.value.slots.find((s) => s.id === slotId)
    if (!slot) return
    undoStack.value.push({
      slotId,
      leftEarring: JSON.parse(JSON.stringify(slot.leftEarring)),
      rightEarring: JSON.parse(JSON.stringify(slot.rightEarring)),
      effect: JSON.parse(JSON.stringify(slot.effect)),
      showAnchors: slot.showAnchors,
      lockEffect: slot.lockEffect,
      name: slot.name,
      recommended: slot.recommended,
      budget: slot.budget,
      materialPreference: slot.materialPreference,
      sceneNotes: slot.sceneNotes,
    })
    if (undoStack.value.length > MAX_HISTORY) {
      undoStack.value = undoStack.value.slice(-MAX_HISTORY)
    }
    redoStack.value = []
  }

  function undo() {
    const entry = undoStack.value.pop()
    if (!entry) return
    const slot = workspace.value.slots.find((s) => s.id === entry.slotId)
    if (!slot) return
    redoStack.value.push({
      slotId: entry.slotId,
      leftEarring: JSON.parse(JSON.stringify(slot.leftEarring)),
      rightEarring: JSON.parse(JSON.stringify(slot.rightEarring)),
      effect: JSON.parse(JSON.stringify(slot.effect)),
      showAnchors: slot.showAnchors,
      lockEffect: slot.lockEffect,
      name: slot.name,
      recommended: slot.recommended,
      budget: slot.budget,
      materialPreference: slot.materialPreference,
      sceneNotes: slot.sceneNotes,
    })
    slot.leftEarring = entry.leftEarring
    slot.rightEarring = entry.rightEarring
    slot.effect = entry.effect
    slot.showAnchors = entry.showAnchors
    slot.lockEffect = entry.lockEffect
    slot.name = entry.name
    slot.recommended = entry.recommended
    slot.budget = entry.budget
    slot.materialPreference = entry.materialPreference
    slot.sceneNotes = entry.sceneNotes
  }

  function redo() {
    const entry = redoStack.value.pop()
    if (!entry) return
    const slot = workspace.value.slots.find((s) => s.id === entry.slotId)
    if (!slot) return
    undoStack.value.push({
      slotId: entry.slotId,
      leftEarring: JSON.parse(JSON.stringify(slot.leftEarring)),
      rightEarring: JSON.parse(JSON.stringify(slot.rightEarring)),
      effect: JSON.parse(JSON.stringify(slot.effect)),
      showAnchors: slot.showAnchors,
      lockEffect: slot.lockEffect,
      name: slot.name,
      recommended: slot.recommended,
      budget: slot.budget,
      materialPreference: slot.materialPreference,
      sceneNotes: slot.sceneNotes,
    })
    slot.leftEarring = entry.leftEarring
    slot.rightEarring = entry.rightEarring
    slot.effect = entry.effect
    slot.showAnchors = entry.showAnchors
    slot.lockEffect = entry.lockEffect
    slot.name = entry.name
    slot.recommended = entry.recommended
    slot.budget = entry.budget
    slot.materialPreference = entry.materialPreference
    slot.sceneNotes = entry.sceneNotes
  }

  function updateSlotEarring(slotId: string, side: 'left' | 'right', props: Partial<EarringInstance>) {
    const slot = workspace.value.slots.find((s) => s.id === slotId)
    if (!slot) return
    pushSlotHistory(slotId)
    const earring = side === 'left' ? slot.leftEarring : slot.rightEarring
    Object.assign(earring, props)
  }

  function updateSlotEffect(slotId: string, props: Partial<EffectConfig>) {
    const slot = workspace.value.slots.find((s) => s.id === slotId)
    if (!slot) return
    if (slot.lockEffect) return
    pushSlotHistory(slotId)
    Object.assign(slot.effect, props)
  }

  function setSlotTemplate(slotId: string, templateId: string, side?: 'left' | 'right' | 'both') {
    const slot = workspace.value.slots.find((s) => s.id === slotId)
    if (!slot) return
    pushSlotHistory(slotId)
    if (side === 'left') {
      slot.leftEarring.templateId = templateId
    } else if (side === 'right') {
      slot.rightEarring.templateId = templateId
    } else {
      slot.leftEarring.templateId = templateId
      slot.rightEarring.templateId = templateId
    }
  }

  function toggleSlotAnchors(slotId: string) {
    const slot = workspace.value.slots.find((s) => s.id === slotId)
    if (!slot) return
    pushSlotHistory(slotId)
    slot.showAnchors = !slot.showAnchors
  }

  function toggleSlotLockEffect(slotId: string) {
    const slot = workspace.value.slots.find((s) => s.id === slotId)
    if (!slot) return
    pushSlotHistory(slotId)
    slot.lockEffect = !slot.lockEffect
  }

  function applyGlobalEffectToSlot(slotId: string) {
    const slot = workspace.value.slots.find((s) => s.id === slotId)
    if (!slot) return
    if (slot.lockEffect) return
    pushSlotHistory(slotId)
    slot.effect = JSON.parse(JSON.stringify(effect.value))
  }

  function copySlotToSlot(sourceSlotId: string, targetSlotId: string) {
    const source = workspace.value.slots.find((s) => s.id === sourceSlotId)
    const target = workspace.value.slots.find((s) => s.id === targetSlotId)
    if (!source || !target) return
    pushSlotHistory(targetSlotId)
    target.leftEarring = JSON.parse(JSON.stringify(source.leftEarring))
    target.rightEarring = JSON.parse(JSON.stringify(source.rightEarring))
    target.effect = JSON.parse(JSON.stringify(source.effect))
    target.showAnchors = source.showAnchors
    target.lockEffect = source.lockEffect
    target.name = source.name + ' (副本)'
  }

  function copyCurrentToSlot(slotId: string) {
    const slot = workspace.value.slots.find((s) => s.id === slotId)
    if (!slot) return
    pushSlotHistory(slotId)
    slot.leftEarring = JSON.parse(JSON.stringify(leftEarring.value))
    slot.rightEarring = JSON.parse(JSON.stringify(rightEarring.value))
    slot.effect = JSON.parse(JSON.stringify(effect.value))
    slot.leftEarring.side = 'left'
    slot.rightEarring.side = 'right'
  }

  function loadSlotToMain(slotId: string) {
    const slot = workspace.value.slots.find((s) => s.id === slotId)
    if (!slot) return
    leftEarring.value = JSON.parse(JSON.stringify(slot.leftEarring))
    rightEarring.value = JSON.parse(JSON.stringify(slot.rightEarring))
    leftEarring.value.side = 'left'
    rightEarring.value.side = 'right'
    leftAnchor.value = { x: slot.leftEarring.anchorX, y: slot.leftEarring.anchorY }
    rightAnchor.value = { x: slot.rightEarring.anchorX, y: slot.rightEarring.anchorY }
    effect.value = JSON.parse(JSON.stringify(slot.effect))
    const tmpl = earringTemplates.find((t) => t.id === slot.leftEarring.templateId)
    if (tmpl) {
      selectedTemplate.value = tmpl
      selectedTemplateId.value = tmpl.id
    }
  }

  function updateSlotMeta(
    slotId: string,
    meta: Partial<Pick<ComparisonSlot, 'name' | 'recommended' | 'budget' | 'materialPreference' | 'sceneNotes'>>,
    pushHistory = false
  ) {
    const slot = workspace.value.slots.find((s) => s.id === slotId)
    if (slot) {
      if (pushHistory) {
        pushSlotHistory(slotId)
      }
      Object.assign(slot, meta)
    }
  }

  function updateSlotThumbnail(slotId: string, thumbnail: string) {
    const slot = workspace.value.slots.find((s) => s.id === slotId)
    if (slot) {
      slot.thumbnail = thumbnail
    }
  }

  function saveSlotAsScheme(slotId: string) {
    const slot = workspace.value.slots.find((s) => s.id === slotId)
    if (!slot || !photo.value) return
    const scheme: Scheme = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: slot.name,
      thumbnail: slot.thumbnail,
      createdAt: Date.now(),
      photoData: photo.value,
      leftEarring: JSON.parse(JSON.stringify(slot.leftEarring)),
      rightEarring: JSON.parse(JSON.stringify(slot.rightEarring)),
      effect: JSON.parse(JSON.stringify(slot.effect)),
      recommended: slot.recommended,
      budget: slot.budget,
      materialPreference: slot.materialPreference,
      sceneNotes: slot.sceneNotes,
    }
    schemes.value.unshift(scheme)
  }

  function setActiveOutfitParams(params: Partial<OutfitParams>) {
    Object.assign(activeOutfitParams.value, params)
  }

  function resetActiveOutfitParams() {
    activeOutfitParams.value = createDefaultOutfitParams()
  }

  function calculateActiveMatchingScore(
    leftEarring: EarringInstance,
    rightEarring: EarringInstance,
    effect: EffectConfig
  ) {
    activeMatchingResult.value = calculateMatchingScore(
      leftEarring,
      rightEarring,
      effect,
      activeOutfitParams.value
    )
    return activeMatchingResult.value
  }

  function createInspirationCard(
    name: string,
    thumbnail: string,
    leftEarring: EarringInstance,
    rightEarring: EarringInstance,
    effect: EffectConfig,
    outfitParams: OutfitParams,
    schemeId: string | null = null
  ): OutfitInspirationCard {
    const matchingResult = calculateMatchingScore(leftEarring, rightEarring, effect, outfitParams)
    const card: OutfitInspirationCard = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name,
      createdAt: Date.now(),
      thumbnail,
      schemeId,
      leftEarring: JSON.parse(JSON.stringify(leftEarring)),
      rightEarring: JSON.parse(JSON.stringify(rightEarring)),
      effect: JSON.parse(JSON.stringify(effect)),
      outfitParams: JSON.parse(JSON.stringify(outfitParams)),
      matchingResult,
      isFavorite: false,
      notes: '',
    }
    inspirationCards.value.unshift(card)
    return card
  }

  function updateInspirationCard(cardId: string, updates: Partial<OutfitInspirationCard>) {
    const card = inspirationCards.value.find((c) => c.id === cardId)
    if (card) {
      Object.assign(card, updates)
      if (updates.outfitParams || updates.leftEarring || updates.rightEarring || updates.effect) {
        card.matchingResult = calculateMatchingScore(
          card.leftEarring,
          card.rightEarring,
          card.effect,
          card.outfitParams
        )
      }
    }
  }

  function updateInspirationCardOutfitParams(cardId: string, params: Partial<OutfitParams>) {
    const card = inspirationCards.value.find((c) => c.id === cardId)
    if (card) {
      Object.assign(card.outfitParams, params)
      card.matchingResult = calculateMatchingScore(
        card.leftEarring,
        card.rightEarring,
        card.effect,
        card.outfitParams
      )
    }
  }

  function deleteInspirationCard(cardId: string) {
    inspirationCards.value = inspirationCards.value.filter((c) => c.id !== cardId)
  }

  function toggleInspirationCardFavorite(cardId: string) {
    const card = inspirationCards.value.find((c) => c.id === cardId)
    if (card) {
      card.isFavorite = !card.isFavorite
    }
  }

  function renameInspirationCard(cardId: string, newName: string) {
    const card = inspirationCards.value.find((c) => c.id === cardId)
    if (card && newName.trim()) {
      card.name = newName.trim()
    }
  }

  function copyInspirationCard(cardId: string): OutfitInspirationCard | null {
    const card = inspirationCards.value.find((c) => c.id === cardId)
    if (!card) return null
    const newCard: OutfitInspirationCard = {
      ...JSON.parse(JSON.stringify(card)),
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: card.name + ' (副本)',
      createdAt: Date.now(),
    }
    const idx = inspirationCards.value.findIndex((c) => c.id === cardId)
    inspirationCards.value.splice(idx + 1, 0, newCard)
    return newCard
  }

  function loadInspirationCardToMain(cardId: string) {
    const card = inspirationCards.value.find((c) => c.id === cardId)
    if (!card) return
    const left = migrateEarring(card.leftEarring)
    const right = migrateEarring(card.rightEarring)
    leftEarring.value = left
    rightEarring.value = right
    leftAnchor.value = { x: left.anchorX, y: left.anchorY }
    rightAnchor.value = { x: right.anchorX, y: right.anchorY }
    effect.value = JSON.parse(JSON.stringify(card.effect))
    activeOutfitParams.value = JSON.parse(JSON.stringify(card.outfitParams))
    activeMatchingResult.value = JSON.parse(JSON.stringify(card.matchingResult))
    const tmpl = earringTemplates.find((t) => t.id === left.templateId)
    if (tmpl) {
      selectedTemplate.value = tmpl
      selectedTemplateId.value = tmpl.id
    }
    showAnchors.value = true
  }

  function createInspirationFromScheme(scheme: Scheme, outfitParams?: OutfitParams): OutfitInspirationCard | null {
    if (!scheme.photoData) return null
    const params = outfitParams || createDefaultOutfitParams()
    return createInspirationCard(
      scheme.name + ' 搭配灵感',
      scheme.thumbnail,
      scheme.leftEarring,
      scheme.rightEarring,
      scheme.effect,
      params,
      scheme.id
    )
  }

  function createInspirationFromSlot(slot: ComparisonSlot, outfitParams?: OutfitParams): OutfitInspirationCard | null {
    if (!slot.thumbnail) return null
    const params = outfitParams || createDefaultOutfitParams()
    return createInspirationCard(
      slot.name + ' 搭配灵感',
      slot.thumbnail,
      slot.leftEarring,
      slot.rightEarring,
      slot.effect,
      params,
      null
    )
  }

  function loadMaterialInfo(): EarringMaterialInfo[] {
    try {
      const raw = localStorage.getItem(MATERIAL_INFO_KEY)
      if (!raw) return []
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  function saveMaterialInfoList(list: EarringMaterialInfo[]) {
    try {
      localStorage.setItem(MATERIAL_INFO_KEY, JSON.stringify(list))
    } catch {
      // storage full
    }
  }

  function loadMaintenancePlans(): MaintenancePlan[] {
    try {
      const raw = localStorage.getItem(MAINTENANCE_PLANS_KEY)
      if (!raw) return []
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  function saveMaintenancePlans(plans: MaintenancePlan[]) {
    try {
      localStorage.setItem(MAINTENANCE_PLANS_KEY, JSON.stringify(plans))
    } catch {
      // storage full
    }
  }

  const materialInfoList = ref<EarringMaterialInfo[]>(loadMaterialInfo())
  const maintenancePlans = ref<MaintenancePlan[]>(loadMaintenancePlans())

  watch(materialInfoList, (val) => saveMaterialInfoList(val), { deep: true })
  watch(maintenancePlans, (val) => saveMaintenancePlans(val), { deep: true })

  const materialAllergyRiskScores: Record<MaterialType, number> = {
    'sterling-silver': 10,
    'gold': 5,
    'rose-gold': 15,
    'platinum': 5,
    'titanium': 0,
    'stainless-steel': 15,
    'brass': 40,
    'alloy': 50,
    'copper': 45,
    'plastic': 10,
    'acrylic': 15,
    'resin': 20,
    'pearl': 5,
    'gemstone': 10,
    'wood': 20,
    'leather': 30,
    'other': 25,
  }

  const platingAllergyRiskScores: Record<PlatingProcess, number> = {
    'none': 0,
    'gold-plated': 25,
    'rose-gold-plated': 30,
    'silver-plated': 20,
    'rhodium-plated': 10,
    'platinum-plated': 10,
    'vacuum-plated': 15,
    'electroplated': 35,
    'enamel': 20,
    'other': 25,
  }

  const earPostAllergyRiskScores: Record<EarPostMaterial, number> = {
    'sterling-silver': 15,
    'titanium': 0,
    'medical-steel': 5,
    'stainless-steel': 20,
    'gold': 5,
    'platinum': 5,
    'copper': 50,
    'alloy': 55,
    'plastic': 10,
    'other': 30,
  }

  function assessRisk(materialInfo: EarringMaterialInfo, wearingDuration: WearingDuration = 'medium'): RiskAssessment {
    const factors: RiskAssessment['factors'] = []
    let totalScore = 0

    const materialScore = materialAllergyRiskScores[materialInfo.mainMaterial] || 25
    factors.push({
      name: '主体材质',
      score: materialScore,
      description: `${materialTypeLabels[materialInfo.mainMaterial]}的过敏风险`,
    })
    totalScore += materialScore * 0.3

    const platingScore = platingAllergyRiskScores[materialInfo.platingProcess] || 25
    factors.push({
      name: '镀层工艺',
      score: platingScore,
      description: `${platingProcessLabels[materialInfo.platingProcess]}的过敏风险`,
    })
    totalScore += platingScore * 0.25

    const earPostScore = earPostAllergyRiskScores[materialInfo.earPostMaterial] || 30
    factors.push({
      name: '耳针材质',
      score: earPostScore,
      description: `${earPostMaterialLabels[materialInfo.earPostMaterial]}的过敏风险`,
    })
    totalScore += earPostScore * 0.35

    const weightScores: Record<WeightRange, number> = {
      'very-light': 5,
      'light': 10,
      'medium': 20,
      'heavy': 35,
      'very-heavy': 50,
    }
    const weightScore = weightScores[materialInfo.weightRange] || 20
    factors.push({
      name: '重量负担',
      score: weightScore,
      description: `${weightRangeLabels[materialInfo.weightRange]}的耳部负担`,
    })
    totalScore += weightScore * 0.1

    if (materialInfo.isAllergenic) {
      totalScore += 20
      factors.push({
        name: '已知过敏',
        score: 100,
        description: materialInfo.allergyNotes || '用户标记为易过敏',
      })
    }

    const durationFactors: Record<WearingDuration, number> = {
      'short': 0.8,
      'medium': 1.0,
      'long': 1.3,
      'all-day': 1.6,
    }
    totalScore = totalScore * (durationFactors[wearingDuration] || 1.0)

    const finalScore = Math.min(100, Math.max(0, Math.round(totalScore)))

    let level: RiskLevel = 'low'
    if (finalScore >= 75) level = 'very-high'
    else if (finalScore >= 50) level = 'high'
    else if (finalScore >= 25) level = 'medium'

    const warnings: string[] = []
    if (materialInfo.isAllergenic) {
      warnings.push('您标记此款耳饰易过敏，建议佩戴前做好防护措施')
    }
    if (earPostScore >= 40) {
      warnings.push('耳针材质过敏风险较高，建议佩戴时间不超过4小时')
    }
    if (platingScore >= 30) {
      warnings.push('镀层工艺可能存在镍释放风险，敏感肌肤请注意')
    }
    if (weightScore >= 35) {
      warnings.push('耳饰较重，长时间佩戴可能导致耳垂拉扯变形')
    }
    if (wearingDuration === 'all-day' && finalScore >= 30) {
      warnings.push('全天佩戴建议中途摘下休息，给皮肤呼吸时间')
    }

    return {
      score: finalScore,
      level,
      factors,
      warnings,
    }
  }

  function generateMaintenanceSuggestions(materialInfo: EarringMaterialInfo): MaintenanceSuggestion[] {
    const suggestions: MaintenanceSuggestion[] = []

    const cleaningTips: Record<MaterialType, string> = {
      'sterling-silver': '使用擦银布轻轻擦拭，避免接触化学品，不佩戴时放入密封袋防止氧化',
      'gold': '用温和肥皂水清洗，软布擦干，避免与硬物摩擦',
      'rose-gold': '避免接触香水和化妆品，用软布轻轻擦拭，注意保护层',
      'platinum': '用温水加中性清洁剂清洗，软毛刷轻刷，定期抛光',
      'titanium': '用酒精棉片擦拭即可，耐腐蚀性强，保养简单',
      'stainless-steel': '用肥皂水清洗，软布擦干，避免长时间接触汗水',
      'brass': '避免接触水分和汗水，定期用铜器清洁剂保养',
      'alloy': '避免接触香水汗水，不戴时擦干存放，变色后可用擦金布尝试恢复',
      'copper': '避免接触水分，定期用柠檬汁清洁，可涂透明指甲油防氧化',
      'plastic': '用温水加肥皂清洗，避免高温和阳光直射',
      'acrylic': '用软布蘸温水擦拭，避免使用酒精等有机溶剂',
      'resin': '用软布轻轻擦拭，避免硬物刮花，远离高温',
      'pearl': '用柔软绒布擦拭，避免接触香水发胶，最后佩戴最先摘下',
      'gemstone': '用温水和软毛刷清洗，不同宝石注意不同保养方式',
      'wood': '避免长时间接触水，可用少量橄榄油擦拭保养',
      'leather': '避免水浸，定期用皮革护理油保养，避免阳光直射',
      'other': '根据实际材质选择合适的清洁保养方式',
    }

    suggestions.push({
      category: 'cleaning',
      title: '清洁方式',
      content: cleaningTips[materialInfo.mainMaterial] || '用软布轻轻擦拭',
      priority: 'high',
    })

    suggestions.push({
      category: 'storage',
      title: '收纳建议',
      content: '单独存放于首饰盒或密封袋中，避免与其他首饰摩擦刮花，保持干燥环境',
      priority: 'medium',
    })

    if (materialInfo.weightRange === 'heavy' || materialInfo.weightRange === 'very-heavy') {
      suggestions.push({
        category: 'wearing',
        title: '佩戴建议',
        content: '重量较大，建议重要场合短时间佩戴，日常可选择轻盈款式',
        priority: 'high',
      })
    }

    if (materialInfo.isAllergenic) {
      suggestions.push({
        category: 'allergy',
        title: '过敏防护',
        content: '佩戴前可在耳针处涂抹透明指甲油形成隔离层，或更换为钛合金耳针',
        priority: 'high',
      })
    }

    if (materialInfo.platingProcess !== 'none' && materialInfo.platingProcess !== 'enamel') {
      suggestions.push({
        category: 'repair',
        title: '镀层保护',
        content: '避免接触香水、发胶等化学品，洗澡游泳时摘下，延长镀层寿命',
        priority: 'medium',
      })
    }

    return suggestions
  }

  function getCleaningCycleDays(cycle: CleaningCycle, customDays?: number): number {
    const cycleDays: Record<CleaningCycle, number> = {
      'daily': 1,
      'weekly': 7,
      'biweekly': 14,
      'monthly': 30,
      'quarterly': 90,
    }
    if (cycle === 'monthly' && customDays && customDays > 0) {
      return customDays
    }
    return cycleDays[cycle] || 30
  }

  function formatDate(date: Date): string {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  function parseDate(dateStr: string): Date {
    const [y, m, d] = dateStr.split('-').map(Number)
    return new Date(y, m - 1, d)
  }

  function addDays(dateStr: string, days: number): string {
    const d = parseDate(dateStr)
    d.setDate(d.getDate() + days)
    return formatDate(d)
  }

  function createMaterialInfo(
    data: Partial<EarringMaterialInfo> & { name: string; thumbnail: string }
  ): EarringMaterialInfo {
    const now = Date.now()
    const info: EarringMaterialInfo = {
      id: 'mat-' + now.toString(36) + Math.random().toString(36).slice(2, 6),
      schemeId: data.schemeId || null,
      slotId: data.slotId || null,
      inspirationCardId: data.inspirationCardId || null,
      name: data.name,
      thumbnail: data.thumbnail,
      mainMaterial: data.mainMaterial || 'sterling-silver',
      platingProcess: data.platingProcess || 'none',
      earPostMaterial: data.earPostMaterial || 'sterling-silver',
      weightRange: data.weightRange || 'medium',
      isAllergenic: data.isAllergenic || false,
      allergyNotes: data.allergyNotes || '',
      wearingFrequency: data.wearingFrequency || 'weekly',
      cleaningCycle: data.cleaningCycle || 'weekly',
      customCleaningDays: data.customCleaningDays || 0,
      lastCleanedAt: data.lastCleanedAt || null,
      lastWornAt: data.lastWornAt || null,
      notes: data.notes || '',
      createdAt: now,
      updatedAt: now,
    }
    materialInfoList.value.unshift(info)
    return info
  }

  function updateMaterialInfo(id: string, updates: Partial<EarringMaterialInfo>) {
    const info = materialInfoList.value.find((m) => m.id === id)
    if (info) {
      Object.assign(info, updates, { updatedAt: Date.now() })
    }
  }

  function deleteMaterialInfo(id: string) {
    materialInfoList.value = materialInfoList.value.filter((m) => m.id !== id)
    maintenancePlans.value = maintenancePlans.value.filter((p) => p.materialInfoId !== id)
  }

  function getMaterialInfo(id: string): EarringMaterialInfo | undefined {
    return materialInfoList.value.find((m) => m.id === id)
  }

  function createMaintenancePlan(
    data: Partial<MaintenancePlan> & { materialInfoId: string; title: string; date: string; type: PlanType }
  ): MaintenancePlan {
    const now = Date.now()
    const plan: MaintenancePlan = {
      id: 'plan-' + now.toString(36) + Math.random().toString(36).slice(2, 6),
      materialInfoId: data.materialInfoId,
      type: data.type,
      title: data.title,
      description: data.description || '',
      date: data.date,
      time: data.time || '09:00',
      status: 'pending',
      completedAt: null,
      originalDate: data.date,
      scene: data.scene || 'casual',
      duration: data.duration || 'medium',
      suggestions: data.suggestions || [],
      createdAt: now,
      updatedAt: now,
    }
    maintenancePlans.value.push(plan)
    maintenancePlans.value.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
    return plan
  }

  function updateMaintenancePlan(id: string, updates: Partial<MaintenancePlan>) {
    const plan = maintenancePlans.value.find((p) => p.id === id)
    if (plan) {
      Object.assign(plan, updates, { updatedAt: Date.now() })
      maintenancePlans.value.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
    }
  }

  function deleteMaintenancePlan(id: string) {
    maintenancePlans.value = maintenancePlans.value.filter((p) => p.id !== id)
  }

  function completeMaintenancePlan(id: string) {
    const plan = maintenancePlans.value.find((p) => p.id === id)
    if (plan) {
      plan.status = 'completed'
      plan.completedAt = Date.now()
      plan.updatedAt = Date.now()

      if (plan.type === 'clean') {
        const materialInfo = materialInfoList.value.find((m) => m.id === plan.materialInfoId)
        if (materialInfo) {
          materialInfo.lastCleanedAt = Date.now()
          materialInfo.updatedAt = Date.now()
        }
      } else if (plan.type === 'wear') {
        const materialInfo = materialInfoList.value.find((m) => m.id === plan.materialInfoId)
        if (materialInfo) {
          materialInfo.lastWornAt = Date.now()
          materialInfo.updatedAt = Date.now()
        }
      }
    }
  }

  function delayMaintenancePlan(id: string, days: number = 1) {
    const plan = maintenancePlans.value.find((p) => p.id === id)
    if (plan) {
      plan.date = addDays(plan.date, days)
      plan.status = 'delayed'
      plan.updatedAt = Date.now()
      maintenancePlans.value.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
    }
  }

  function generatePlansForMaterial(materialInfoId: string, days: number = 30): MaintenancePlan[] {
    const materialInfo = materialInfoList.value.find((m) => m.id === materialInfoId)
    if (!materialInfo) return []

    const newPlans: MaintenancePlan[] = []
    const today = formatDate(new Date())
    const cleaningDays = getCleaningCycleDays(materialInfo.cleaningCycle, materialInfo.customCleaningDays)
    const suggestions = generateMaintenanceSuggestions(materialInfo)

    let lastCleanDate = materialInfo.lastCleanedAt
      ? formatDate(new Date(materialInfo.lastCleanedAt))
      : addDays(today, -cleaningDays)

    const frequencyDays: Record<WearingFrequency, number> = {
      'daily': 1,
      'frequent': 2,
      'weekly': 7,
      'occasional': 14,
      'rare': 30,
    }
    const wearInterval = frequencyDays[materialInfo.wearingFrequency] || 7

    for (let i = 0; i < days; i++) {
      const date = addDays(today, i)

      const daysSinceClean = Math.floor(
        (parseDate(date).getTime() - parseDate(lastCleanDate).getTime()) / (1000 * 60 * 60 * 24)
      )
      if (daysSinceClean >= cleaningDays) {
        const existing = maintenancePlans.value.find(
          (p) => p.materialInfoId === materialInfoId && p.type === 'clean' && p.date === date
        )
        if (!existing) {
          newPlans.push(
            createMaintenancePlan({
              materialInfoId,
              type: 'clean',
              title: `${materialInfo.name} - 清洁保养`,
              description: `按照${cleaningCycleLabels[materialInfo.cleaningCycle]}的周期进行清洁保养`,
              date,
              time: '20:00',
              suggestions: suggestions.filter((s) => s.category === 'cleaning').map((s) => s.content),
            })
          )
        }
        lastCleanDate = date
      }

      if (i % wearInterval === 0) {
        const existing = maintenancePlans.value.find(
          (p) => p.materialInfoId === materialInfoId && p.type === 'wear' && p.date === date
        )
        if (!existing) {
          const risk = assessRisk(materialInfo, 'medium')
          newPlans.push(
            createMaintenancePlan({
              materialInfoId,
              type: 'wear',
              title: `${materialInfo.name} - 佩戴计划`,
              description: `建议佩戴时长：${wearingDurationLabels['medium']}`,
              date,
              time: '09:00',
              scene: 'casual',
              duration: 'medium',
              suggestions: risk.warnings,
            })
          )
        }
      }
    }

    return newPlans
  }

  function getPlansForDate(date: string): MaintenancePlan[] {
    return maintenancePlans.value.filter((p) => p.date === date)
  }

  function getPlansForDateRange(startDate: string, endDate: string): MaintenancePlan[] {
    return maintenancePlans.value.filter((p) => p.date >= startDate && p.date <= endDate)
  }

  function getTodayPlans(): MaintenancePlan[] {
    const today = formatDate(new Date())
    return getPlansForDate(today).filter((p) => p.status !== 'completed')
  }

  function getUpcomingPlans(days: number = 7): MaintenancePlan[] {
    const today = formatDate(new Date())
    const endDate = addDays(today, days - 1)
    return getPlansForDateRange(today, endDate).filter((p) => p.status !== 'completed')
  }

  function getMaterialPlans(materialInfoId: string): MaintenancePlan[] {
    return maintenancePlans.value.filter((p) => p.materialInfoId === materialInfoId)
  }

  function createMaterialFromScheme(schemeId: string): EarringMaterialInfo | null {
    const scheme = schemes.value.find((s) => s.id === schemeId)
    if (!scheme) return null

    const existing = materialInfoList.value.find((m) => m.schemeId === schemeId)
    if (existing) return existing

    return createMaterialInfo({
      schemeId: scheme.id,
      name: scheme.name,
      thumbnail: scheme.thumbnail,
      mainMaterial: scheme.materialPreference ? guessMaterialType(scheme.materialPreference) : 'sterling-silver',
    })
  }

  function createMaterialFromSlot(slotId: string): EarringMaterialInfo | null {
    const slot = workspace.value.slots.find((s) => s.id === slotId)
    if (!slot) return null

    const existing = materialInfoList.value.find((m) => m.slotId === slotId)
    if (existing) return existing

    return createMaterialInfo({
      slotId: slot.id,
      name: slot.name,
      thumbnail: slot.thumbnail,
      mainMaterial: slot.materialPreference ? guessMaterialType(slot.materialPreference) : 'sterling-silver',
    })
  }

  function createMaterialFromInspiration(cardId: string): EarringMaterialInfo | null {
    const card = inspirationCards.value.find((c) => c.id === cardId)
    if (!card) return null

    const existing = materialInfoList.value.find((m) => m.inspirationCardId === cardId)
    if (existing) return existing

    return createMaterialInfo({
      inspirationCardId: card.id,
      name: card.name,
      thumbnail: card.thumbnail,
      mainMaterial: 'sterling-silver',
    })
  }

  function guessMaterialType(preference: string): MaterialType {
    const p = preference.toLowerCase()
    if (p.includes('银') || p.includes('silver')) return 'sterling-silver'
    if (p.includes('金') || p.includes('gold')) return 'gold'
    if (p.includes('玫瑰金') || p.includes('rose')) return 'rose-gold'
    if (p.includes('铂') || p.includes('白金') || p.includes('platinum')) return 'platinum'
    if (p.includes('钛') || p.includes('titanium')) return 'titanium'
    if (p.includes('钢') || p.includes('steel')) return 'stainless-steel'
    if (p.includes('铜') || p.includes('copper')) return 'copper'
    if (p.includes('合金') || p.includes('alloy')) return 'alloy'
    if (p.includes('珍珠') || p.includes('pearl')) return 'pearl'
    if (p.includes('宝石') || p.includes('钻') || p.includes('gem')) return 'gemstone'
    return 'sterling-silver'
  }

  function exportMaterialReminderCard(materialInfoId: string): string {
    const materialInfo = materialInfoList.value.find((m) => m.id === materialInfoId)
    if (!materialInfo) return ''

    const risk = assessRisk(materialInfo)
    const suggestions = generateMaintenanceSuggestions(materialInfo)
    const upcomingPlans = getPlansForDateRange(
      formatDate(new Date()),
      addDays(formatDate(new Date()), 14)
    ).filter((p) => p.materialInfoId === materialInfoId && p.status !== 'completed')

    const canvas = document.createElement('canvas')
    const w = 600
    const h = 900
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')!

    const grd = ctx.createLinearGradient(0, 0, 0, h)
    grd.addColorStop(0, '#1a1a2e')
    grd.addColorStop(0.5, '#16213e')
    grd.addColorStop(1, '#0f1624')
    ctx.fillStyle = grd
    ctx.fillRect(0, 0, w, h)

    ctx.strokeStyle = 'rgba(212, 165, 116, 0.25)'
    ctx.lineWidth = 2
    ctx.strokeRect(20, 20, w - 40, h - 40)
    ctx.strokeStyle = 'rgba(212, 165, 116, 0.1)'
    ctx.lineWidth = 1
    ctx.strokeRect(30, 30, w - 60, h - 60)

    ctx.font = 'bold 28px Playfair Display, Georgia, serif'
    ctx.fillStyle = '#e8c9a0'
    ctx.textAlign = 'center'
    ctx.fillText('Material Care Reminder', w / 2, 65)

    ctx.font = '14px Noto Sans SC, sans-serif'
    ctx.fillStyle = 'rgba(245, 240, 232, 0.6)'
    ctx.fillText('材质保养提醒卡', w / 2, 90)

    let y = 120

    const thumbW = 160
    const thumbH = 200
    const thumbX = (w - thumbW) / 2
    const thumbY = y

    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
    ctx.fillRect(thumbX - 3, thumbY - 3, thumbW + 6, thumbH + 6)
    ctx.strokeStyle = 'rgba(212, 165, 116, 0.4)'
    ctx.lineWidth = 1
    ctx.strokeRect(thumbX - 3, thumbY - 3, thumbW + 6, thumbH + 6)
    ctx.fillStyle = '#0f1624'
    ctx.fillRect(thumbX, thumbY, thumbW, thumbH)

    if (materialInfo.thumbnail) {
      const thumbImg = new Image()
      thumbImg.src = materialInfo.thumbnail
      if (thumbImg.complete && thumbImg.naturalWidth > 0) {
        const scale = Math.min(thumbW / thumbImg.width, thumbH / thumbImg.height)
        const dw = thumbImg.width * scale
        const dh = thumbImg.height * scale
        const dx = thumbX + (thumbW - dw) / 2
        const dy = thumbY + (thumbH - dh) / 2
        ctx.drawImage(thumbImg, dx, dy, dw, dh)
      }
    }

    y += thumbH + 25

    ctx.font = 'bold 18px Noto Sans SC, sans-serif'
    ctx.fillStyle = '#f5f0e8'
    ctx.textAlign = 'center'
    ctx.fillText(materialInfo.name, w / 2, y)
    y += 25

    const riskScoreX = w / 2
    const riskScoreY = y + 40
    const riskR = 35

    ctx.beginPath()
    ctx.arc(riskScoreX, riskScoreY, riskR, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(255,255,255,0.1)'
    ctx.lineWidth = 8
    ctx.stroke()

    const startAngle = -Math.PI / 2
    const endAngle = startAngle + (risk.score / 100) * Math.PI * 2
    ctx.beginPath()
    ctx.arc(riskScoreX, riskScoreY, riskR, startAngle, endAngle)
    const riskColors: Record<RiskLevel, string> = {
      'low': '#4ade80',
      'medium': '#facc15',
      'high': '#fb923c',
      'very-high': '#ef4444',
    }
    ctx.strokeStyle = riskColors[risk.level]
    ctx.lineWidth = 8
    ctx.lineCap = 'round'
    ctx.stroke()

    ctx.font = 'bold 22px Playfair Display, Georgia, serif'
    ctx.fillStyle = riskColors[risk.level]
    ctx.textAlign = 'center'
    ctx.fillText(String(risk.score), riskScoreX, riskScoreY + 7)

    ctx.font = '11px Noto Sans SC, sans-serif'
    ctx.fillStyle = 'rgba(245, 240, 232, 0.5)'
    ctx.fillText('过敏风险', riskScoreX, riskScoreY + 25)

    const riskLevelText: Record<RiskLevel, string> = {
      'low': '低风险 · 安心佩戴',
      'medium': '中风险 · 注意观察',
      'high': '高风险 · 谨慎佩戴',
      'very-high': '极高风险 · 建议更换',
    }
    ctx.font = '12px Noto Sans SC, sans-serif'
    ctx.fillStyle = riskColors[risk.level]
    ctx.fillText(riskLevelText[risk.level], w / 2, riskScoreY + 50)

    y = riskScoreY + 80

    ctx.strokeStyle = 'rgba(212, 165, 116, 0.15)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(60, y)
    ctx.lineTo(w - 60, y)
    ctx.stroke()

    y += 20

    ctx.font = 'bold 14px Noto Sans SC, sans-serif'
    ctx.fillStyle = '#e8c9a0'
    ctx.textAlign = 'left'
    ctx.fillText('📋 材质信息', 60, y)
    y += 22

    const infoRows: [string, string][] = [
      ['主体材质', materialTypeLabels[materialInfo.mainMaterial]],
      ['镀层工艺', platingProcessLabels[materialInfo.platingProcess]],
      ['耳针材质', earPostMaterialLabels[materialInfo.earPostMaterial]],
      ['重量区间', weightRangeLabels[materialInfo.weightRange]],
      ['清洁周期', cleaningCycleLabels[materialInfo.cleaningCycle]],
      ['佩戴频率', wearingFrequencyLabels[materialInfo.wearingFrequency]],
    ]

    ctx.font = '11px Noto Sans SC, sans-serif'
    for (const [label, value] of infoRows) {
      ctx.fillStyle = 'rgba(245, 240, 232, 0.5)'
      ctx.fillText(label, 70, y)
      ctx.fillStyle = '#f5f0e8'
      ctx.textAlign = 'right'
      ctx.fillText(value, w - 70, y)
      ctx.textAlign = 'left'
      y += 20
    }

    y += 10

    ctx.strokeStyle = 'rgba(212, 165, 116, 0.15)'
    ctx.beginPath()
    ctx.moveTo(60, y)
    ctx.lineTo(w - 60, y)
    ctx.stroke()

    y += 20

    ctx.font = 'bold 14px Noto Sans SC, sans-serif'
    ctx.fillStyle = '#e8c9a0'
    ctx.fillText('💡 保养建议', 60, y)
    y += 22

    ctx.font = '10px Noto Sans SC, sans-serif'
    for (const suggestion of suggestions.slice(0, 3)) {
      const iconMap: Record<string, string> = {
        'cleaning': '🧼',
        'storage': '📦',
        'wearing': '✨',
        'allergy': '⚠️',
        'repair': '🔧',
      }
      const icon = iconMap[suggestion.category] || '💡'

      ctx.fillStyle = 'rgba(245, 240, 232, 0.7)'
      const text = `${icon} ${suggestion.title}：${suggestion.content}`
      const maxWidth = w - 140
      const words = text.split('')
      let line = ''
      let lineCount = 0
      for (const word of words) {
        const testLine = line + word
        const metrics = ctx.measureText(testLine)
        if (metrics.width > maxWidth && lineCount < 1) {
          ctx.fillText(line, 70, y)
          line = word
          y += 16
          lineCount++
        } else {
          line = testLine
        }
      }
      if (lineCount < 2) {
        ctx.fillText(line, 70, y)
      }
      y += 18
    }

    if (upcomingPlans.length > 0) {
      y += 10

      ctx.strokeStyle = 'rgba(212, 165, 116, 0.15)'
      ctx.beginPath()
      ctx.moveTo(60, y)
      ctx.lineTo(w - 60, y)
      ctx.stroke()

      y += 20

      ctx.font = 'bold 14px Noto Sans SC, sans-serif'
      ctx.fillStyle = '#e8c9a0'
      ctx.fillText('📅 近期计划', 60, y)
      y += 22

      ctx.font = '10px Noto Sans SC, sans-serif'
      const planTypeIcons: Record<string, string> = {
        'wear': '👂',
        'clean': '🧼',
        'check': '🔍',
        'repair': '🔧',
      }
      for (const plan of upcomingPlans.slice(0, 3)) {
        const icon = planTypeIcons[plan.type] || '📋'
        const dateObj = parseDate(plan.date)
        const dateStr = `${dateObj.getMonth() + 1}月${dateObj.getDate()}日`

        ctx.fillStyle = 'rgba(245, 240, 232, 0.6)'
        ctx.fillText(dateStr, 70, y)
        ctx.fillStyle = '#f5f0e8'
        ctx.fillText(`${icon} ${plan.title}`, 140, y)
        y += 18
      }
    }

    y = h - 50
    ctx.font = '10px Noto Sans SC, sans-serif'
    ctx.fillStyle = 'rgba(245, 240, 232, 0.4)'
    ctx.textAlign = 'center'
    ctx.fillText(`生成时间: ${new Date().toLocaleString('zh-CN')} | 仅供参考`, w / 2, y)

    return canvas.toDataURL('image/png')
  }

  function loadStorageCards(): StorageCard[] {
    try {
      const raw = localStorage.getItem(STORAGE_CARDS_KEY)
      if (!raw) return []
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  function saveStorageCards(cards: StorageCard[]) {
    try {
      localStorage.setItem(STORAGE_CARDS_KEY, JSON.stringify(cards))
    } catch {
      // storage full
    }
  }

  const storageCards = ref<StorageCard[]>(loadStorageCards())

  watch(storageCards, (val) => saveStorageCards(val), { deep: true })

  const styleCategoryMap: Record<string, string[]> = {
    '简约精致': ['stud'],
    '优雅垂坠': ['drop'],
    '时尚圈环': ['hoop'],
    '灵动流苏': ['tassel'],
    '干练专业': ['stud', 'hoop'],
    '隆重华丽': ['drop', 'tassel'],
    '浪漫吸睛': ['drop', 'hoop'],
    '轻松随性': ['stud', 'hoop'],
    '经典平衡': ['stud', 'hoop'],
    '个性混搭': [],
    '夸张醒目': ['hoop', 'tassel'],
    '短发突出': ['drop', 'tassel', 'hoop'],
    '纵向延伸': ['drop', 'tassel'],
    'V领呼应': ['drop'],
    '肩颈线条优化': ['drop', 'tassel'],
    '舒适持久': ['stud'],
    '对称和谐': [],
  }

  function deriveStyleTagsFromCard(card: StorageCard): string[] {
    const leftT = earringTemplates.find((t) => t.id === card.leftEarring.templateId)
    const rightT = earringTemplates.find((t) => t.id === card.rightEarring.templateId)
    const tags: string[] = []
    const categories = new Set([leftT?.category, rightT?.category])
    if (categories.has('stud')) tags.push('简约精致')
    if (categories.has('drop')) tags.push('优雅垂坠')
    if (categories.has('hoop')) tags.push('时尚圈环')
    if (categories.has('tassel')) tags.push('灵动流苏')
    if (leftT?.category === rightT?.category) tags.push('对称和谐')
    if (card.scene === 'wedding' || card.scene === 'dinner') {
      tags.push('隆重华丽')
    } else if (card.scene === 'commute' || card.scene === 'business') {
      tags.push('干练专业')
    } else if (card.scene === 'date' || card.scene === 'party') {
      tags.push('浪漫吸睛')
    } else if (card.scene === 'travel' || card.scene === 'casual') {
      tags.push('轻松随性')
    }
    return [...new Set(tags)]
  }

  function guessEarringStyle(card: StorageCard): { elegance: number; trendy: number; casual: number; formal: number; romantic: number } {
    const leftT = earringTemplates.find((t) => t.id === card.leftEarring.templateId)
    const rightT = earringTemplates.find((t) => t.id === card.rightEarring.templateId)
    const avgScale = (card.leftEarring.scale + card.rightEarring.scale) / 2
    const avgLengthScale = (card.leftEarring.lengthScale + card.rightEarring.lengthScale) / 2
    let elegance = 40, trendy = 40, casual = 40, formal = 30, romantic = 40

    for (const cat of [leftT?.category, rightT?.category]) {
      if (cat === 'stud') { casual += 20; formal += 10; elegance += 10 }
      if (cat === 'drop') { elegance += 30; formal += 20; romantic += 20 }
      if (cat === 'hoop') { trendy += 30; casual += 10 }
      if (cat === 'tassel') { trendy += 25; romantic += 25; elegance += 10 }
    }

    if (avgScale > 1.3) { trendy += 15; romantic += 10 }
    if (avgLengthScale > 1.3) { elegance += 15; formal += 10 }
    if (card.scene === 'wedding' || card.scene === 'dinner') { formal += 30; elegance += 20; romantic += 10 }
    if (card.scene === 'date') { romantic += 30; elegance += 10 }
    if (card.scene === 'party') { trendy += 25; romantic += 15 }
    if (card.scene === 'business' || card.scene === 'commute') { formal += 25; casual -= 10 }
    if (card.scene === 'casual' || card.scene === 'travel') { casual += 25; formal -= 15 }

    return {
      elegance: Math.min(100, Math.max(0, elegance)),
      trendy: Math.min(100, Math.max(0, trendy)),
      casual: Math.min(100, Math.max(0, casual)),
      formal: Math.min(100, Math.max(0, formal)),
      romantic: Math.min(100, Math.max(0, romantic)),
    }
  }

  function generateStorageSuggestions(card: StorageCard): StorageSuggestion[] {
    const suggestions: StorageSuggestion[] = []
    const materialInfo = card.materialInfoId
      ? materialInfoList.value.find((m) => m.id === card.materialInfoId)
      : null
    const style = guessEarringStyle(card)
    const tags = deriveStyleTagsFromCard(card)

    if (!card.storageBoxNumber || card.storageBoxNumber.trim() === '') {
      suggestions.push({
        category: 'storage',
        title: '分配收纳盒',
        content: '建议为这副耳饰指定收纳盒编号，便于快速查找。可按材质、风格或使用频率分区存放。',
        priority: 'high',
      })
    }

    if (!card.isPaired) {
      suggestions.push({
        category: 'storage',
        title: '单只耳饰收纳',
        content: '标记为单只耳饰，建议使用带分格的收纳盒单独存放，避免与其他耳饰混淆，可用小标签标注。',
        priority: 'medium',
      })
    } else {
      suggestions.push({
        category: 'storage',
        title: '成对收纳',
        content: '成对耳饰建议使用成对卡槽或小密封袋收纳，防止丢失其中一只，保持配对完整。',
        priority: 'low',
      })
    }

    if (materialInfo) {
      const mat = materialInfo.mainMaterial
      if (['sterling-silver', 'copper', 'brass'].includes(mat)) {
        suggestions.push({
          category: 'storage',
          title: '防氧化收纳',
          content: `${materialTypeLabels[mat]}容易氧化变色，建议放入带干燥剂的密封袋或抗氧化首饰盒中单独存放。`,
          priority: 'high',
        })
      }
      if (mat === 'pearl') {
        suggestions.push({
          category: 'storage',
          title: '珍珠专用收纳',
          content: '珍珠质地娇贵，应用柔软绒布单独包裹，避免与硬物接触刮花，远离高温和化学品。',
          priority: 'high',
        })
      }
      if (mat === 'gemstone') {
        suggestions.push({
          category: 'storage',
          title: '宝石保护收纳',
          content: '宝石首饰应单独存放防止磕碰，用软布包裹后放入带衬垫的首饰盒格中。',
          priority: 'medium',
        })
      }
      if (materialInfo.weightRange === 'heavy' || materialInfo.weightRange === 'very-heavy') {
        suggestions.push({
          category: 'storage',
          title: '承重收纳',
          content: '耳饰偏重，建议悬挂式或平放在带衬垫的托盘上，避免长期悬挂导致耳针变形。',
          priority: 'medium',
        })
      }
    }

    if (style.formal >= 70 || tags.includes('隆重华丽')) {
      suggestions.push({
        category: 'storage',
        title: '贵重场合款单独存放',
        content: '此款适合隆重场合，建议单独放置在首饰盒醒目位置或专用贵重首饰层，重要时刻便于快速取用。',
        priority: 'medium',
      })
    }

    if (style.casual >= 70 || tags.includes('轻松随性') || tags.includes('简约精致')) {
      suggestions.push({
        category: 'storage',
        title: '日常款便捷收纳',
        content: '日常佩戴款式建议放置在梳妆台随手可及的收纳盘或首饰架上，方便每日搭配。',
        priority: 'low',
      })
    }

    if (card.lastWornAt) {
      const daysSince = Math.floor((Date.now() - card.lastWornAt) / (1000 * 60 * 60 * 24))
      if (daysSince >= 30) {
        suggestions.push({
          category: 'wear',
          title: '长期未佩戴提醒',
          content: `已 ${daysSince} 天未佩戴此款耳饰，不妨找个机会重新戴上它，或考虑转赠给合适的朋友。`,
          priority: 'low',
        })
      } else if (daysSince >= 14) {
        suggestions.push({
          category: 'wear',
          title: '定期佩戴建议',
          content: `已 ${daysSince} 天未佩戴，可将其纳入近一周的穿搭计划中。`,
          priority: 'low',
        })
      }
    }

    if (materialInfo) {
      const risk = assessRisk(materialInfo, 'medium')
      if (risk.score >= 40) {
        suggestions.push({
          category: 'care',
          title: '敏感款收纳提示',
          content: '此款过敏风险较高，建议收纳前用酒精棉片擦拭耳针消毒，干燥后再存放。',
          priority: 'medium',
        })
      }
    }

    suggestions.sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 }
      return order[a.priority] - order[b.priority]
    })

    return suggestions.slice(0, 6)
  }

  function generateGiftRecommendation(card: StorageCard): GiftRecommendation {
    const materialInfo = card.materialInfoId
      ? materialInfoList.value.find((m) => m.id === card.materialInfoId)
      : null
    const style = guessEarringStyle(card)
    const tags = deriveStyleTagsFromCard(card)
    const reasons: string[] = []
    const suitableRecipients: GiftRecipient[] = []
    const suitableFestivals: FestivalTag[] = []
    const suggestions: string[] = []
    let score = 0

    if (card.budgetRange === 'under-50' || card.budgetRange === '50-100') {
      score += 25
      reasons.push('预算亲民，适合作为日常小礼物')
      suitableRecipients.push('friend', 'colleague', 'child')
      suitableFestivals.push('thank-you', 'graduation')
    } else if (card.budgetRange === '100-300' || card.budgetRange === '300-500') {
      score += 35
      reasons.push('预算适中，适合大多数节日赠礼场景')
      suitableRecipients.push('girlfriend', 'sister', 'friend', 'teacher')
      suitableFestivals.push('valentines', 'womens-day', 'teachers-day', 'birthday', 'qixi')
    } else if (card.budgetRange === '500-1000' || card.budgetRange === '1000-3000') {
      score += 40
      reasons.push('预算较高，适合重要场合和亲近的人')
      suitableRecipients.push('mother', 'wife', 'elder', 'girlfriend')
      suitableFestivals.push('mothers-day', 'anniversary', 'birthday', 'mid-autumn', 'spring-festival')
    } else if (card.budgetRange === '3000-plus') {
      score += 30
      reasons.push('贵重礼物，适合最重要的纪念日或至亲')
      suitableRecipients.push('wife', 'mother', 'elder')
      suitableFestivals.push('anniversary', 'birthday', 'spring-festival')
    } else {
      score += 20
      reasons.push('尚未标注预算，完善后推荐更精准')
      suitableRecipients.push('friend', 'sister')
    }

    if (card.isPaired) {
      score += 10
      reasons.push('成对耳饰寓意圆满，赠礼更显心意')
    }

    if (style.elegance >= 60) {
      score += 8
      reasons.push('风格优雅大方，适配多数审美')
      suitableRecipients.push('mother', 'elder', 'wife')
    }
    if (style.trendy >= 60) {
      score += 8
      reasons.push('款式时尚新潮，适合年轻群体')
      suitableRecipients.push('girlfriend', 'sister', 'friend', 'child')
      suitableFestivals.push('valentines', 'qixi', 'graduation', 'birthday')
    }
    if (style.romantic >= 60) {
      score += 10
      reasons.push('浪漫气息浓厚，表达情意恰到好处')
      suitableRecipients.push('girlfriend', 'wife', 'sister')
      suitableFestivals.push('valentines', 'qixi', 'anniversary', 'birthday')
    }
    if (style.formal >= 60) {
      score += 7
      reasons.push('正式场合适用，赠礼稳重有格调')
      suitableRecipients.push('elder', 'mother', 'colleague', 'teacher')
      suitableFestivals.push('teachers-day', 'spring-festival', 'mid-autumn')
    }
    if (style.casual >= 60) {
      score += 5
      reasons.push('日常百搭款，实用性强')
      suitableRecipients.push('friend', 'colleague', 'child')
    }

    if (materialInfo) {
      const risk = assessRisk(materialInfo, 'medium')
      if (risk.score <= 20) {
        score += 10
        reasons.push('材质温和低敏，赠礼无需顾虑过敏问题')
      } else if (risk.score >= 50) {
        score -= 15
        suggestions.push('过敏风险较高，建议确认收礼人肤质后再赠，或附上备用耳针')
      }

      if (['sterling-silver', 'gold', 'rose-gold', 'platinum', 'pearl', 'gemstone'].includes(materialInfo.mainMaterial)) {
        score += 8
        reasons.push(`${materialTypeLabels[materialInfo.mainMaterial]}材质显档次，赠礼有面子`)
      }
      if (materialInfo.weightRange === 'very-light' || materialInfo.weightRange === 'light') {
        score += 5
        reasons.push('轻盈舒适，长时间佩戴无负担')
      }
    }

    if (tags.includes('隆重华丽')) {
      suitableFestivals.push('wedding' as FestivalTag, 'anniversary')
    }
    if (tags.includes('简约精致') || tags.includes('干练专业')) {
      suitableRecipients.push('colleague', 'teacher')
      suitableFestivals.push('teachers-day', 'housewarming', 'thank-you')
    }

    if (card.suitableForGift) {
      score += 10
    }

    if (card.festivalTags.length > 0) {
      score += 5
      for (const f of card.festivalTags) {
        if (!suitableFestivals.includes(f)) suitableFestivals.push(f)
      }
    }
    if (card.giftRecipient) {
      score += 5
      if (!suitableRecipients.includes(card.giftRecipient as GiftRecipient)) {
        suitableRecipients.push(card.giftRecipient as GiftRecipient)
      }
    }

    if (suggestions.length === 0) {
      suggestions.push('精美礼盒包装可提升赠礼仪式感')
      suggestions.push('附上手写贺卡，表达真挚心意')
    }

    const finalScore = Math.min(100, Math.max(0, Math.round(score)))

    return {
      score: finalScore,
      reasons: [...new Set(reasons)].slice(0, 6),
      suitableRecipients: [...new Set(suitableRecipients)].slice(0, 6),
      suitableFestivals: [...new Set(suitableFestivals)].slice(0, 8),
      suggestions: suggestions.slice(0, 4),
    }
  }

  function calculatePriorityScore(card: StorageCard): number {
    let score = 0
    if (card.isFavorite) score += 25
    const style = guessEarringStyle(card)
    const giftRec = generateGiftRecommendation(card)
    score += Math.round(giftRec.score * 0.3)

    if (card.suitableForGift) {
      const upcomingFestival = getUpcomingFestivals(60)
      const match = card.festivalTags.some((f) => upcomingFestival.some((u) => u.tag === f))
      if (match) score += 20
    }

    if (card.lastWornAt) {
      const daysSince = (Date.now() - card.lastWornAt) / (1000 * 60 * 60 * 24)
      if (daysSince >= 30) score += 15
      else if (daysSince >= 14) score += 8
    } else {
      score += 5
    }

    score += Math.round(style.formal * 0.1)
    return Math.min(100, Math.max(0, score))
  }

  function generateStorageScoreCard(card: StorageCard): StorageScoreCard {
    const materialInfo = card.materialInfoId
      ? materialInfoList.value.find((m) => m.id === card.materialInfoId)
      : null
    let riskLevel: RiskLevel = 'low'
    if (materialInfo) {
      const risk = assessRisk(materialInfo, 'medium')
      riskLevel = risk.level
    }
    return {
      storageScore: calculateStorageScore(card),
      giftScore: generateGiftRecommendation(card).score,
      priorityScore: calculatePriorityScore(card),
      riskLevel,
      storageSuggestions: generateStorageSuggestions(card),
      giftRecommendation: generateGiftRecommendation(card),
    }
  }

  function calculateStorageScore(card: StorageCard): number {
    let score = 50
    if (card.storageBoxNumber && card.storageBoxNumber.trim()) score += 15
    if (card.isPaired) score += 10
    if (card.scene) score += 8
    if (card.notes) score += 7
    if (card.materialInfoId) score += 10
    if (card.lastWornAt) score += 5
    return Math.min(100, Math.max(0, score))
  }

  function createStorageCard(
    data: Partial<StorageCard> & {
      name: string
      thumbnail: string
      leftEarring: EarringInstance
      rightEarring: EarringInstance
      effect: EffectConfig
    }
  ): StorageCard {
    const now = Date.now()
    const card: StorageCard = {
      id: 'sc-' + now.toString(36) + Math.random().toString(36).slice(2, 6),
      schemeId: data.schemeId || null,
      materialInfoId: data.materialInfoId || null,
      name: data.name,
      thumbnail: data.thumbnail,
      storageBoxNumber: data.storageBoxNumber || '',
      isPaired: data.isPaired !== undefined ? data.isPaired : true,
      lastWornAt: data.lastWornAt || null,
      suitableForGift: data.suitableForGift || false,
      giftRecipient: data.giftRecipient || '',
      budgetRange: data.budgetRange || '',
      festivalTags: data.festivalTags || [],
      isFavorite: data.isFavorite || false,
      notes: data.notes || '',
      scene: data.scene || '',
      leftEarring: JSON.parse(JSON.stringify(data.leftEarring)),
      rightEarring: JSON.parse(JSON.stringify(data.rightEarring)),
      effect: JSON.parse(JSON.stringify(data.effect)),
      createdAt: now,
      updatedAt: now,
    }
    storageCards.value.unshift(card)
    return card
  }

  function updateStorageCard(id: string, updates: Partial<StorageCard>) {
    const card = storageCards.value.find((c) => c.id === id)
    if (card) {
      Object.assign(card, updates, { updatedAt: Date.now() })
    }
  }

  function deleteStorageCard(id: string) {
    storageCards.value = storageCards.value.filter((c) => c.id !== id)
  }

  function toggleStorageCardFavorite(id: string) {
    const card = storageCards.value.find((c) => c.id === id)
    if (card) {
      card.isFavorite = !card.isFavorite
      card.updatedAt = Date.now()
    }
  }

  function renameStorageCard(id: string, newName: string) {
    const card = storageCards.value.find((c) => c.id === id)
    if (card && newName.trim()) {
      card.name = newName.trim()
      card.updatedAt = Date.now()
    }
  }

  function copyStorageCard(id: string): StorageCard | null {
    const card = storageCards.value.find((c) => c.id === id)
    if (!card) return null
    const now = Date.now()
    const newCard: StorageCard = {
      ...JSON.parse(JSON.stringify(card)),
      id: 'sc-' + now.toString(36) + Math.random().toString(36).slice(2, 6),
      name: card.name + ' (副本)',
      createdAt: now,
      updatedAt: now,
    }
    const idx = storageCards.value.findIndex((c) => c.id === id)
    storageCards.value.splice(idx + 1, 0, newCard)
    return newCard
  }

  function createStorageCardFromScheme(schemeId: string): StorageCard | null {
    const scheme = schemes.value.find((s) => s.id === schemeId)
    if (!scheme) return null
    const existing = storageCards.value.find((c) => c.schemeId === schemeId)
    if (existing) return existing
    const materialInfo = materialInfoList.value.find((m) => m.schemeId === schemeId)
    return createStorageCard({
      schemeId: scheme.id,
      materialInfoId: materialInfo?.id || null,
      name: scheme.name,
      thumbnail: scheme.thumbnail,
      leftEarring: scheme.leftEarring,
      rightEarring: scheme.rightEarring,
      effect: scheme.effect,
      budgetRange: (scheme.budget ? guessBudgetRange(scheme.budget) : '') as BudgetRange | '',
    })
  }

  function createStorageCardFromSlot(slotId: string): StorageCard | null {
    const slot = workspace.value.slots.find((s) => s.id === slotId)
    if (!slot) return null
    const existing = storageCards.value.find((c) => c.schemeId === slotId)
    if (existing) return existing
    const materialInfo = materialInfoList.value.find((m) => m.slotId === slotId)
    return createStorageCard({
      schemeId: null,
      materialInfoId: materialInfo?.id || null,
      name: slot.name,
      thumbnail: slot.thumbnail,
      leftEarring: slot.leftEarring,
      rightEarring: slot.rightEarring,
      effect: slot.effect,
      budgetRange: (slot.budget ? guessBudgetRange(slot.budget) : '') as BudgetRange | '',
    })
  }

  function createStorageCardFromMaterial(materialInfoId: string): StorageCard | null {
    const materialInfo = materialInfoList.value.find((m) => m.id === materialInfoId)
    if (!materialInfo) return null
    const existing = storageCards.value.find((c) => c.materialInfoId === materialInfoId)
    if (existing) return existing
    let leftEarring = createDefaultEarring('left')
    let rightEarring = createDefaultEarring('right')
    let effect: EffectConfig = { hairstyleOverlay: false, makeupTone: 'natural', lightingMode: 'natural' }
    if (materialInfo.schemeId) {
      const scheme = schemes.value.find((s) => s.id === materialInfo.schemeId)
      if (scheme) {
        leftEarring = scheme.leftEarring
        rightEarring = scheme.rightEarring
        effect = scheme.effect
      }
    } else if (materialInfo.inspirationCardId) {
      const card = inspirationCards.value.find((c) => c.id === materialInfo.inspirationCardId)
      if (card) {
        leftEarring = card.leftEarring
        rightEarring = card.rightEarring
        effect = card.effect
      }
    }
    return createStorageCard({
      schemeId: materialInfo.schemeId,
      materialInfoId: materialInfo.id,
      name: materialInfo.name,
      thumbnail: materialInfo.thumbnail,
      leftEarring,
      rightEarring,
      effect,
      lastWornAt: materialInfo.lastWornAt,
    })
  }

  function guessBudgetRange(text: string): BudgetRange {
    const t = text.replace(/[^\d]/g, '')
    if (!t) return '100-300'
    const n = parseInt(t, 10)
    if (n < 50) return 'under-50'
    if (n < 100) return '50-100'
    if (n < 300) return '100-300'
    if (n < 500) return '300-500'
    if (n < 1000) return '500-1000'
    if (n < 3000) return '1000-3000'
    return '3000-plus'
  }

  function getUpcomingFestivals(days: number = 60): { tag: FestivalTag; date: string; daysLeft: number }[] {
    const result: { tag: FestivalTag; date: string; daysLeft: number }[] = []
    const now = new Date()
    const todayMs = now.getTime()
    const targetMs = todayMs + days * 24 * 60 * 60 * 1000
    const festivalFixedDates: Partial<Record<FestivalTag, { month: number; day: number }>> = {
      'valentines': { month: 2, day: 14 },
      'womens-day': { month: 3, day: 8 },
      'teachers-day': { month: 9, day: 10 },
      'national-day': { month: 10, day: 1 },
      'christmas': { month: 12, day: 25 },
      'new-year': { month: 1, day: 1 },
    }
    const currentYear = now.getFullYear()
    for (const years of [currentYear, currentYear + 1]) {
      for (const [tag, md] of Object.entries(festivalFixedDates) as [FestivalTag, { month: number; day: number }][]) {
        const d = new Date(years, md.month - 1, md.day)
        const diffMs = d.getTime() - todayMs
        const daysLeft = Math.ceil(diffMs / (24 * 60 * 60 * 1000))
        if (daysLeft >= 0 && d.getTime() <= targetMs) {
          result.push({ tag, date: formatDate(d), daysLeft })
        }
      }
    }
    const monthFestivals: FestivalTag[] = Object.entries(festivalTagMonth)
      .filter(([_, months]) => {
        const targetMonths = new Set<number>()
        for (let i = 0; i < days; i++) {
          const d = new Date(todayMs + i * 24 * 60 * 60 * 1000)
          targetMonths.add(d.getMonth() + 1)
        }
        return months.some((m) => targetMonths.has(m))
      })
      .map(([tag]) => tag as FestivalTag)
    for (const tag of monthFestivals) {
      if (!result.some((r) => r.tag === tag)) {
        result.push({ tag, date: '', daysLeft: 30 })
      }
    }
    result.sort((a, b) => a.daysLeft - b.daysLeft)
    return result
  }

  function generateStorageReminders(days: number = 30): StorageReminder[] {
    const reminders: StorageReminder[] = []
    const today = new Date()
    const todayStr = formatDate(today)
    const upcomingFestivals = getUpcomingFestivals(days)

    for (const card of storageCards.value) {
      if (card.lastWornAt) {
        const daysSince = Math.floor((Date.now() - card.lastWornAt) / (1000 * 60 * 60 * 24))
        if (daysSince >= 14 && daysSince <= days) {
          reminders.push({
            id: 'rem-wear-' + card.id,
            cardId: card.id,
            cardName: card.name,
            thumbnail: card.thumbnail,
            type: 'wear',
            title: '佩戴提醒',
            content: `已 ${daysSince} 天未佩戴「${card.name}」，是时候拿出来搭配啦！`,
            targetDate: todayStr,
            createdAt: Date.now(),
          })
        }
      }

      if (card.suitableForGift) {
        for (const fest of upcomingFestivals) {
          if (card.festivalTags.includes(fest.tag) || (fest.daysLeft <= 14 && card.giftRecipient)) {
            reminders.push({
              id: `rem-gift-${card.id}-${fest.tag}`,
              cardId: card.id,
              cardName: card.name,
              thumbnail: card.thumbnail,
              type: 'festival',
              title: `${festivalTagLabels[fest.tag]}赠礼提醒`,
              content: `${festivalTagLabels[fest.tag]}临近，「${card.name}」适合作为礼物${card.giftRecipient ? '送给' + giftRecipientLabels[card.giftRecipient as GiftRecipient] : ''}`,
              targetDate: fest.date || addDays(todayStr, fest.daysLeft),
              festivalTag: fest.tag,
              createdAt: Date.now(),
            })
            break
          }
        }
      }

      const materialInfo = card.materialInfoId
        ? materialInfoList.value.find((m) => m.id === card.materialInfoId)
        : null
      if (materialInfo && materialInfo.lastCleanedAt) {
        const cleaningDays = getCleaningCycleDays(materialInfo.cleaningCycle, materialInfo.customCleaningDays)
        const daysSinceClean = Math.floor((Date.now() - materialInfo.lastCleanedAt) / (1000 * 60 * 60 * 24))
        const daysUntil = cleaningDays - daysSinceClean
        if (daysUntil >= 0 && daysUntil <= 7) {
          reminders.push({
            id: 'rem-clean-' + card.id,
            cardId: card.id,
            cardName: card.name,
            thumbnail: card.thumbnail,
            type: 'clean',
            title: '清洁保养提醒',
            content: daysUntil === 0
              ? `「${card.name}」今天该清洁保养了，延长首饰寿命！`
              : `「${card.name}」还有 ${daysUntil} 天需要清洁保养`,
            targetDate: addDays(todayStr, daysUntil),
            createdAt: Date.now(),
          })
        } else if (daysUntil < 0) {
          reminders.push({
            id: 'rem-clean-' + card.id,
            cardId: card.id,
            cardName: card.name,
            thumbnail: card.thumbnail,
            type: 'clean',
            title: '清洁保养逾期',
            content: `「${card.name}」已逾期 ${Math.abs(daysUntil)} 天未清洁，请尽快保养！`,
            targetDate: todayStr,
            createdAt: Date.now(),
          })
        }
      }
    }

    reminders.sort((a, b) => a.targetDate.localeCompare(b.targetDate))
    return reminders
  }

  function markStorageCardWornToday(id: string) {
    const card = storageCards.value.find((c) => c.id === id)
    if (card) {
      card.lastWornAt = Date.now()
      card.updatedAt = Date.now()
      if (card.materialInfoId) {
        const mat = materialInfoList.value.find((m) => m.id === card.materialInfoId)
        if (mat) {
          mat.lastWornAt = Date.now()
          mat.updatedAt = Date.now()
        }
      }
    }
  }

  function exportStorageGiftCard(cardId: string): string {
    const card = storageCards.value.find((c) => c.id === cardId)
    if (!card) return ''

    const scoreCard = generateStorageScoreCard(card)
    const giftRec = scoreCard.giftRecommendation
    const canvas = document.createElement('canvas')
    const w = 650
    const h = 1000
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')!

    const grd = ctx.createLinearGradient(0, 0, 0, h)
    grd.addColorStop(0, '#1a1a2e')
    grd.addColorStop(0.5, '#16213e')
    grd.addColorStop(1, '#0f1624')
    ctx.fillStyle = grd
    ctx.fillRect(0, 0, w, h)

    ctx.strokeStyle = 'rgba(212, 165, 116, 0.25)'
    ctx.lineWidth = 2
    ctx.strokeRect(20, 20, w - 40, h - 40)
    ctx.strokeStyle = 'rgba(212, 165, 116, 0.1)'
    ctx.lineWidth = 1
    ctx.strokeRect(30, 30, w - 60, h - 60)

    ctx.font = 'bold 28px Playfair Display, Georgia, serif'
    ctx.fillStyle = '#e8c9a0'
    ctx.textAlign = 'center'
    ctx.fillText('Storage & Gift Planner', w / 2, 65)

    ctx.font = '13px Noto Sans SC, sans-serif'
    ctx.fillStyle = 'rgba(245, 240, 232, 0.6)'
    ctx.fillText('耳饰收纳赠礼建议卡', w / 2, 90)

    let y = 120

    const thumbW = 180
    const thumbH = 230
    const thumbX = (w - thumbW) / 2
    const thumbY = y

    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
    ctx.fillRect(thumbX - 3, thumbY - 3, thumbW + 6, thumbH + 6)
    ctx.strokeStyle = 'rgba(212, 165, 116, 0.4)'
    ctx.lineWidth = 1
    ctx.strokeRect(thumbX - 3, thumbY - 3, thumbW + 6, thumbH + 6)
    ctx.fillStyle = '#0f1624'
    ctx.fillRect(thumbX, thumbY, thumbW, thumbH)

    if (card.thumbnail) {
      const thumbImg = new Image()
      thumbImg.src = card.thumbnail
      if (thumbImg.complete && thumbImg.naturalWidth > 0) {
        const scale = Math.min(thumbW / thumbImg.width, thumbH / thumbImg.height)
        const dw = thumbImg.width * scale
        const dh = thumbImg.height * scale
        const dx = thumbX + (thumbW - dw) / 2
        const dy = thumbY + (thumbH - dh) / 2
        ctx.drawImage(thumbImg, dx, dy, dw, dh)
      }
    }

    y += thumbH + 25

    ctx.font = 'bold 18px Noto Sans SC, sans-serif'
    ctx.fillStyle = '#f5f0e8'
    ctx.textAlign = 'center'
    ctx.fillText(card.name, w / 2, y)
    y += 25

    const scoreStartY = y
    const giftScoreX = w / 2
    const giftScoreY = scoreStartY + 40
    const giftR = 38

    ctx.beginPath()
    ctx.arc(giftScoreX, giftScoreY, giftR, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(255,255,255,0.1)'
    ctx.lineWidth = 8
    ctx.stroke()

    const startAngle = -Math.PI / 2
    const endAngle = startAngle + (giftRec.score / 100) * Math.PI * 2
    ctx.beginPath()
    ctx.arc(giftScoreX, giftScoreY, giftR, startAngle, endAngle)
    const getSc = (s: number) => s >= 85 ? '#4ade80' : s >= 70 ? '#facc15' : s >= 50 ? '#fb923c' : '#ef4444'
    ctx.strokeStyle = getSc(giftRec.score)
    ctx.lineWidth = 8
    ctx.lineCap = 'round'
    ctx.stroke()

    ctx.font = 'bold 24px Playfair Display, Georgia, serif'
    ctx.fillStyle = getSc(giftRec.score)
    ctx.textAlign = 'center'
    ctx.fillText(String(giftRec.score), giftScoreX, giftScoreY + 8)

    ctx.font = '11px Noto Sans SC, sans-serif'
    ctx.fillStyle = 'rgba(245, 240, 232, 0.5)'
    ctx.fillText('赠礼评分', giftScoreX, giftScoreY + 26)

    const leftT = earringTemplates.find((t) => t.id === card.leftEarring.templateId)
    const rightT = earringTemplates.find((t) => t.id === card.rightEarring.templateId)

    ctx.textAlign = 'left'
    const infoLeftX = 60
    ctx.font = '10px Noto Sans SC, sans-serif'
    ctx.fillStyle = 'rgba(148,163,184,0.7)'
    ctx.fillText('左耳款式', infoLeftX, giftScoreY - 10)
    ctx.fillStyle = '#60a5fa'
    ctx.font = 'bold 12px Noto Sans SC, sans-serif'
    ctx.fillText(`${leftT?.name || '-'}`, infoLeftX, giftScoreY + 6)
    ctx.fillStyle = 'rgba(148,163,184,0.5)'
    ctx.font = '10px Noto Sans SC, sans-serif'
    ctx.fillText(`${leftT ? categoryLabels[leftT.category] : ''}`, infoLeftX, giftScoreY + 22)

    ctx.textAlign = 'right'
    const infoRightX = w - 60
    ctx.font = '10px Noto Sans SC, sans-serif'
    ctx.fillStyle = 'rgba(148,163,184,0.7)'
    ctx.fillText('右耳款式', infoRightX, giftScoreY - 10)
    ctx.fillStyle = '#f472b6'
    ctx.font = 'bold 12px Noto Sans SC, sans-serif'
    ctx.fillText(`${rightT?.name || '-'}`, infoRightX, giftScoreY + 6)
    ctx.fillStyle = 'rgba(148,163,184,0.5)'
    ctx.font = '10px Noto Sans SC, sans-serif'
    ctx.fillText(`${rightT ? categoryLabels[rightT.category] : ''}`, infoRightX, giftScoreY + 22)

    y = giftScoreY + 60

    ctx.strokeStyle = 'rgba(212, 165, 116, 0.15)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(60, y)
    ctx.lineTo(w - 60, y)
    ctx.stroke()

    y += 20

    ctx.font = 'bold 14px Noto Sans SC, sans-serif'
    ctx.fillStyle = '#e8c9a0'
    ctx.textAlign = 'left'
    ctx.fillText('📦 收纳信息', 60, y)
    y += 22

    const storageRows: [string, string][] = [
      ['收纳盒编号', card.storageBoxNumber || '未设置'],
      ['是否成对', card.isPaired ? '是 ✓' : '否（单只）'],
      ['最后佩戴', card.lastWornAt ? new Date(card.lastWornAt).toLocaleDateString('zh-CN') : '暂无记录'],
      ['使用场景', card.scene ? outfitSceneLabels[card.scene] : '未标记'],
    ]
    ctx.font = '11px Noto Sans SC, sans-serif'
    for (const [label, value] of storageRows) {
      ctx.fillStyle = 'rgba(245, 240, 232, 0.5)'
      ctx.fillText(label, 70, y)
      ctx.fillStyle = '#f5f0e8'
      ctx.textAlign = 'right'
      ctx.fillText(value, w - 70, y)
      ctx.textAlign = 'left'
      y += 20
    }

    y += 8

    const giftRows: [string, string][] = [
      ['适合送礼', card.suitableForGift ? '是 ✓' : '否'],
      ['赠礼对象', card.giftRecipient ? giftRecipientLabels[card.giftRecipient as GiftRecipient] : '未设置'],
      ['预算区间', card.budgetRange ? budgetRangeLabels[card.budgetRange as BudgetRange] : '未设置'],
      ['节日标签', card.festivalTags.length > 0 ? card.festivalTags.map((f) => festivalTagLabels[f]).join('、') : '无'],
    ]
    ctx.font = '11px Noto Sans SC, sans-serif'
    for (const [label, value] of giftRows) {
      ctx.fillStyle = 'rgba(245, 240, 232, 0.5)'
      ctx.fillText(label, 70, y)
      ctx.fillStyle = '#f5f0e8'
      ctx.textAlign = 'right'
      let dispValue = value
      if (dispValue.length > 14) dispValue = dispValue.slice(0, 13) + '…'
      ctx.fillText(dispValue, w - 70, y)
      ctx.textAlign = 'left'
      y += 20
    }

    y += 10

    ctx.strokeStyle = 'rgba(212, 165, 116, 0.15)'
    ctx.beginPath()
    ctx.moveTo(60, y)
    ctx.lineTo(w - 60, y)
    ctx.stroke()

    y += 20

    ctx.font = 'bold 14px Noto Sans SC, sans-serif'
    ctx.fillStyle = '#e8c9a0'
    ctx.fillText('🎁 赠礼推荐理由', 60, y)
    y += 22

    ctx.font = '11px Noto Sans SC, sans-serif'
    for (const reason of giftRec.reasons.slice(0, 4)) {
      ctx.fillStyle = 'rgba(245, 240, 232, 0.7)'
      const text = `✨ ${reason}`
      const maxWidth = w - 140
      const words = text.split('')
      let line = ''
      for (const word of words) {
        const testLine = line + word
        const metrics = ctx.measureText(testLine)
        if (metrics.width > maxWidth) {
          ctx.fillText(line, 70, y)
          line = '   ' + word
          y += 18
        } else {
          line = testLine
        }
      }
      ctx.fillText(line, 70, y)
      y += 18
    }

    if (giftRec.suggestions.length > 0) {
      y += 8

      ctx.strokeStyle = 'rgba(212, 165, 116, 0.15)'
      ctx.beginPath()
      ctx.moveTo(60, y)
      ctx.lineTo(w - 60, y)
      ctx.stroke()

      y += 20

      ctx.font = 'bold 14px Noto Sans SC, sans-serif'
      ctx.fillStyle = '#e8c9a0'
      ctx.fillText('💡 贴心建议', 60, y)
      y += 22

      ctx.font = '10px Noto Sans SC, sans-serif'
      for (const suggestion of giftRec.suggestions.slice(0, 3)) {
        ctx.fillStyle = 'rgba(245, 240, 232, 0.65)'
        ctx.fillText(`• ${suggestion}`, 70, y)
        y += 16
      }
    }

    if (scoreCard.storageSuggestions.length > 0) {
      y += 8

      ctx.strokeStyle = 'rgba(212, 165, 116, 0.15)'
      ctx.beginPath()
      ctx.moveTo(60, y)
      ctx.lineTo(w - 60, y)
      ctx.stroke()

      y += 20

      ctx.font = 'bold 14px Noto Sans SC, sans-serif'
      ctx.fillStyle = '#e8c9a0'
      ctx.fillText('📋 收纳建议', 60, y)
      y += 22

      ctx.font = '10px Noto Sans SC, sans-serif'
      const topSuggestions = scoreCard.storageSuggestions.slice(0, 2)
      for (const suggestion of topSuggestions) {
        ctx.fillStyle = 'rgba(245, 240, 232, 0.65)'
        const iconMap: Record<string, string> = { storage: '📦', gift: '🎁', wear: '✨', care: '🧼' }
        const text = `${iconMap[suggestion.category] || '💡'} ${suggestion.title}：${suggestion.content}`
        const maxWidth = w - 140
        const words = text.split('')
        let line = ''
        for (const word of words) {
          const testLine = line + word
          const metrics = ctx.measureText(testLine)
          if (metrics.width > maxWidth) {
            ctx.fillText(line, 70, y)
            line = '   ' + word
            y += 15
          } else {
            line = testLine
          }
        }
        ctx.fillText(line, 70, y)
        y += 16
      }
    }

    y = h - 45
    ctx.font = '10px Noto Sans SC, sans-serif'
    ctx.fillStyle = 'rgba(245, 240, 232, 0.4)'
    ctx.textAlign = 'center'
    ctx.fillText(`生成时间: ${new Date().toLocaleString('zh-CN')} | 收纳与赠礼规划参考`, w / 2, y)

    return canvas.toDataURL('image/png')
  }

  return {
    photo,
    photoWidth,
    photoHeight,
    leftAnchor,
    rightAnchor,
    leftEarring,
    rightEarring,
    selectedTemplateId,
    selectedTemplate,
    effect,
    schemes,
    showAnchors,
    canvasScale,
    canvasOffset,
    workspace,
    undoStack,
    redoStack,
    inspirationCards,
    activeOutfitParams,
    activeMatchingResult,
    materialInfoList,
    maintenancePlans,
    setPhoto,
    setAnchor,
    selectTemplate,
    updateEarring,
    updateEffect,
    saveScheme,
    loadScheme,
    deleteScheme,
    deleteSchemes,
    renameScheme,
    updateSchemeMeta,
    resetAnchors,
    resetEarring,
    setGridMode,
    undo,
    redo,
    updateSlotEarring,
    updateSlotEffect,
    setSlotTemplate,
    toggleSlotAnchors,
    toggleSlotLockEffect,
    applyGlobalEffectToSlot,
    copySlotToSlot,
    copyCurrentToSlot,
    loadSlotToMain,
    updateSlotMeta,
    updateSlotThumbnail,
    saveSlotAsScheme,
    setActiveOutfitParams,
    resetActiveOutfitParams,
    calculateActiveMatchingScore,
    createInspirationCard,
    updateInspirationCard,
    updateInspirationCardOutfitParams,
    deleteInspirationCard,
    toggleInspirationCardFavorite,
    renameInspirationCard,
    copyInspirationCard,
    loadInspirationCardToMain,
    createInspirationFromScheme,
    createInspirationFromSlot,
    assessRisk,
    generateMaintenanceSuggestions,
    getCleaningCycleDays,
    formatDate,
    parseDate,
    addDays,
    createMaterialInfo,
    updateMaterialInfo,
    deleteMaterialInfo,
    getMaterialInfo,
    createMaintenancePlan,
    updateMaintenancePlan,
    deleteMaintenancePlan,
    completeMaintenancePlan,
    delayMaintenancePlan,
    generatePlansForMaterial,
    getPlansForDate,
    getPlansForDateRange,
    getTodayPlans,
    getUpcomingPlans,
    getMaterialPlans,
    createMaterialFromScheme,
    createMaterialFromSlot,
    createMaterialFromInspiration,
    exportMaterialReminderCard,
    storageCards,
    deriveStyleTagsFromCard,
    guessEarringStyle,
    generateStorageSuggestions,
    generateGiftRecommendation,
    calculatePriorityScore,
    generateStorageScoreCard,
    calculateStorageScore,
    createStorageCard,
    updateStorageCard,
    deleteStorageCard,
    toggleStorageCardFavorite,
    renameStorageCard,
    copyStorageCard,
    createStorageCardFromScheme,
    createStorageCardFromSlot,
    createStorageCardFromMaterial,
    getUpcomingFestivals,
    generateStorageReminders,
    markStorageCardWornToday,
    exportStorageGiftCard,
  }
})
