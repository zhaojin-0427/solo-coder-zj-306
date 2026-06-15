import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { EarringInstance, EarringTemplate, EffectConfig, Scheme } from '@/types'
import { earringTemplates } from '@/data/earringTemplates'

const STORAGE_KEY = 'earring-tryon-schemes'

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

export const useEarringStore = defineStore('earring', () => {
  const photo = ref<string | null>(null)
  const photoWidth = ref(0)
  const photoHeight = ref(0)
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

  watch(schemes, (val) => saveSchemes(val), { deep: true })

  function setPhoto(dataUrl: string, width: number, height: number) {
    photo.value = dataUrl
    photoWidth.value = width
    photoHeight.value = height
    showAnchors.value = true
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
    setPhoto,
    setAnchor,
    selectTemplate,
    updateEarring,
    updateEffect,
    saveScheme,
    loadScheme,
    deleteScheme,
    resetAnchors,
    resetEarring,
  }
})
