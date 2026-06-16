import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
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
} from '@/types'
import { earringTemplates } from '@/data/earringTemplates'

const STORAGE_KEY = 'earring-tryon-schemes'
const WORKSPACE_KEY = 'earring-tryon-workspace'
const PHOTO_KEY = 'earring-tryon-photo'
const INSPIRATION_KEY = 'earring-tryon-inspiration'
const MATERIAL_INFO_KEY = 'earring-tryon-material-info'
const MAINTENANCE_PLANS_KEY = 'earring-tryon-maintenance-plans'

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
  }
})
