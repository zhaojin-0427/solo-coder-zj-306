import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { EarringInstance, EarringTemplate, EffectConfig, Scheme, ComparisonSlot, GridMode, HistoryEntry } from '@/types'
import { earringTemplates } from '@/data/earringTemplates'

const STORAGE_KEY = 'earring-tryon-schemes'
const WORKSPACE_KEY = 'earring-tryon-workspace'
const PHOTO_KEY = 'earring-tryon-photo'

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

  watch(schemes, (val) => saveSchemes(val), { deep: true })

  watch(workspace, (val) => saveWorkspace(val), { deep: true })

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
    })
    slot.leftEarring = entry.leftEarring
    slot.rightEarring = entry.rightEarring
    slot.effect = entry.effect
    slot.showAnchors = entry.showAnchors
    slot.lockEffect = entry.lockEffect
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
    })
    slot.leftEarring = entry.leftEarring
    slot.rightEarring = entry.rightEarring
    slot.effect = entry.effect
    slot.showAnchors = entry.showAnchors
    slot.lockEffect = entry.lockEffect
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

  function updateSlotMeta(slotId: string, meta: Partial<Pick<ComparisonSlot, 'name' | 'recommended' | 'budget' | 'materialPreference' | 'sceneNotes'>>) {
    const slot = workspace.value.slots.find((s) => s.id === slotId)
    if (slot) {
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
  }
})
