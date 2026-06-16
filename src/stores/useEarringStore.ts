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
} from '@/types'
import { earringTemplates } from '@/data/earringTemplates'

const STORAGE_KEY = 'earring-tryon-schemes'
const WORKSPACE_KEY = 'earring-tryon-workspace'
const PHOTO_KEY = 'earring-tryon-photo'
const INSPIRATION_KEY = 'earring-tryon-inspiration'

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
  }
})
