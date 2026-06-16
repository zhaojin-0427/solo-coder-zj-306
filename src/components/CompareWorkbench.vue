<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useEarringStore } from '@/stores/useEarringStore'
import { earringTemplates, categoryLabels } from '@/data/earringTemplates'
import type { ComparisonSlot, GridMode, MakeupTone, LightingMode, EarringInstance } from '@/types'
import {
  LayoutGrid,
  Undo2,
  Redo2,
  Copy,
  Star,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Sparkles,
  Sun,
  ChevronDown,
  Check,
  BookmarkPlus,
  Pencil,
  SlidersHorizontal,
  Palette,
} from 'lucide-vue-next'

const emit = defineEmits<{
  (e: 'enter-inspiration'): void
}>()

const store = useEarringStore()

function handleEnterInspirationFromSlot(slotId: string) {
  store.loadSlotToMain(slotId)
  emit('enter-inspiration')
}

const expandedSlotId = ref<string | null>(null)
const noteSlotId = ref<string | null>(null)
const templateDropdownSlotId = ref<string | null>(null)
const templateDropdownSide = ref<'left' | 'right' | 'both'>('both')
const fineTuneSlotId = ref<string | null>(null)
const fineTuneSide = ref<'left' | 'right'>('left')

function toggleFineTune(slotId: string) {
  if (fineTuneSlotId.value === slotId) {
    fineTuneSlotId.value = null
  } else {
    fineTuneSlotId.value = slotId
    fineTuneSide.value = 'left'
  }
}

function handleSlotSliderChange(
  slotId: string,
  side: 'left' | 'right',
  field: keyof EarringInstance,
  value: number
) {
  store.updateSlotEarring(slotId, side, { [field]: value })
}

function getFieldDisplay(field: keyof EarringInstance, value: number): string {
  if (field === 'scale') return (value * 100).toFixed(0) + '%'
  if (field === 'lengthScale') return (value * 100).toFixed(0) + '%'
  if (field === 'rotation') return value.toFixed(1) + '°'
  if (field === 'offsetY') return (value > 0 ? '↓' : value < 0 ? '↑' : '—') + Math.abs(value).toFixed(0) + 'px'
  if (field === 'offsetX') return (value > 0 ? '→' : value < 0 ? '←' : '—') + Math.abs(value).toFixed(0) + 'px'
  if (field === 'anchorX' || field === 'anchorY') return (value * 100).toFixed(1) + '%'
  return String(value)
}

const lightingFilters: Record<string, string> = {
  natural: 'none',
  warm: 'sepia(0.15) saturate(1.2) brightness(1.05)',
  cool: 'hue-rotate(-10deg) saturate(1.1) brightness(1.02)',
  stage: 'contrast(1.2) saturate(1.3) brightness(1.1)',
}

const makeupFilters: Record<string, string> = {
  natural: 'none',
  warm: 'sepia(0.1) hue-rotate(5deg)',
  cool: 'hue-rotate(-5deg) saturate(0.95)',
  vintage: 'sepia(0.25) contrast(0.95) brightness(0.98)',
}

function getTemplate(id: string) {
  return earringTemplates.find((t) => t.id === id) || earringTemplates[0]
}

function getCombinedFilter(effect: { makeupTone: string; lightingMode: string }) {
  const lf = lightingFilters[effect.lightingMode] || 'none'
  const mf = makeupFilters[effect.makeupTone] || 'none'
  if (lf === 'none' && mf === 'none') return 'none'
  if (lf === 'none') return mf
  if (mf === 'none') return lf
  return `${lf} ${mf}`
}

const gridColsClass = computed(() => {
  const mode = store.workspace.gridMode
  if (mode === 2) return 'grid-cols-2'
  if (mode === 3) return 'grid-cols-3'
  return 'grid-cols-2'
})

const gridRowsClass = computed(() => {
  const mode = store.workspace.gridMode
  if (mode === 4) return 'grid-rows-2'
  return 'grid-rows-1'
})

const canvasRefs = ref<Map<string, HTMLCanvasElement>>(new Map())
const containerRefs = ref<Map<string, HTMLDivElement>>(new Map())
const loadedImage = ref<HTMLImageElement | null>(null)
const svgImageCache = ref<Map<string, HTMLImageElement>>(new Map())

function preloadSvg(templateId: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (svgImageCache.value.has(templateId)) {
      resolve(svgImageCache.value.get(templateId)!)
      return
    }
    const template = getTemplate(templateId)
    const svgBlob = new Blob([template.svgContent], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      svgImageCache.value.set(templateId, img)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(null)
    }
    img.src = url
  })
}

function drawEarring(
  ctx: CanvasRenderingContext2D,
  earring: EarringInstance,
  imgDisplayW: number,
  imgDisplayH: number,
  imgLeft: number,
  imgTop: number
) {
  const template = getTemplate(earring.templateId)
  const cachedImg = svgImageCache.value.get(earring.templateId)
  if (!cachedImg) {
    preloadSvg(earring.templateId)
    return
  }

  const anchorX = imgLeft + earring.anchorX * imgDisplayW + earring.offsetX
  const anchorY = imgTop + earring.anchorY * imgDisplayH + earring.offsetY
  const baseScale = Math.min(imgDisplayW, imgDisplayH) / 600
  const finalScaleX = baseScale * earring.scale
  const finalScaleY = baseScale * earring.scale * earring.lengthScale
  const w = template.defaultWidth * finalScaleX
  const h = template.defaultHeight * finalScaleY

  ctx.save()
  ctx.translate(anchorX, anchorY)
  ctx.rotate((earring.rotation * Math.PI) / 180)
  const anchorRatioX = template.anchorPoint.x / template.defaultWidth
  const anchorRatioY = template.anchorPoint.y / template.defaultHeight
  ctx.drawImage(cachedImg, -w * anchorRatioX, -h * anchorRatioY, w, h)
  ctx.restore()
}

function renderSlot(slot: ComparisonSlot) {
  const canvas = canvasRefs.value.get(slot.id)
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  if (!store.photo || !loadedImage.value) {
    ctx.fillStyle = '#0f1624'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = 'rgba(212, 165, 116, 0.4)'
    ctx.font = '13px Noto Sans SC, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('请先上传照片', canvas.width / 2, canvas.height / 2)
    return
  }

  const photoW = store.photoWidth
  const photoH = store.photoHeight
  const scale = Math.min(canvas.width / photoW, canvas.height / photoH)
  const imgDisplayW = photoW * scale
  const imgDisplayH = photoH * scale
  const imgLeft = (canvas.width - imgDisplayW) / 2
  const imgTop = (canvas.height - imgDisplayH) / 2

  const combinedFilter = getCombinedFilter(slot.effect)
  ctx.filter = combinedFilter
  ctx.drawImage(loadedImage.value, imgLeft, imgTop, imgDisplayW, imgDisplayH)
  ctx.filter = 'none'

  if (slot.effect.hairstyleOverlay) {
    ctx.save()
    ctx.globalAlpha = 0.35
    const gradient = ctx.createRadialGradient(
      imgLeft + imgDisplayW * 0.5,
      imgTop + imgDisplayH * 0.15,
      imgDisplayW * 0.1,
      imgLeft + imgDisplayW * 0.5,
      imgTop + imgDisplayH * 0.15,
      imgDisplayW * 0.55
    )
    gradient.addColorStop(0, 'rgba(30, 20, 15, 0.9)')
    gradient.addColorStop(0.6, 'rgba(30, 20, 15, 0.5)')
    gradient.addColorStop(1, 'rgba(30, 20, 15, 0)')
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.ellipse(
      imgLeft + imgDisplayW * 0.5,
      imgTop + imgDisplayH * 0.12,
      imgDisplayW * 0.48,
      imgDisplayH * 0.28,
      0, 0, Math.PI * 2
    )
    ctx.fill()
    ctx.restore()
  }

  drawEarring(ctx, slot.leftEarring, imgDisplayW, imgDisplayH, imgLeft, imgTop)
  drawEarring(ctx, slot.rightEarring, imgDisplayW, imgDisplayH, imgLeft, imgTop)

  if (slot.showAnchors) {
    const drawAnchor = (x: number, y: number, color: string, label: string) => {
      const ax = imgLeft + x * imgDisplayW
      const ay = imgTop + y * imgDisplayH
      ctx.save()
      ctx.beginPath()
      ctx.arc(ax, ay, 6, 0, Math.PI * 2)
      ctx.fillStyle = color + '30'
      ctx.fill()
      ctx.strokeStyle = color
      ctx.lineWidth = 1.5
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(ax, ay, 2, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.fill()
      ctx.font = 'bold 9px Noto Sans SC'
      ctx.fillStyle = color
      ctx.textAlign = 'center'
      ctx.fillText(label, ax, ay - 10)
      ctx.restore()
    }
    drawAnchor(slot.leftEarring.anchorX, slot.leftEarring.anchorY, '#60a5fa', 'L')
    drawAnchor(slot.rightEarring.anchorX, slot.rightEarring.anchorY, '#f472b6', 'R')
  }

  const thumb = canvas.toDataURL('image/jpeg', 0.6)
  store.updateSlotThumbnail(slot.id, thumb)
}

function renderAllSlots() {
  for (const slot of store.workspace.slots) {
    renderSlot(slot)
  }
}

function resizeAllCanvases() {
  for (const slot of store.workspace.slots) {
    const container = containerRefs.value.get(slot.id)
    const canvas = canvasRefs.value.get(slot.id)
    if (!container || !canvas) continue
    const rect = container.getBoundingClientRect()
    canvas.width = rect.width
    canvas.height = rect.height
  }
  nextTick(() => renderAllSlots())
}

function setCanvasRef(slotId: string, el: any) {
  if (el) canvasRefs.value.set(slotId, el as HTMLCanvasElement)
}

function setContainerRef(slotId: string, el: any) {
  if (el) containerRefs.value.set(slotId, el as HTMLDivElement)
}

watch(
  () => store.photo,
  (newPhoto) => {
    if (!newPhoto) {
      loadedImage.value = null
      return
    }
    const img = new Image()
    img.onload = () => {
      loadedImage.value = img
      nextTick(() => {
        resizeAllCanvases()
      })
    }
    img.src = newPhoto
  },
  { immediate: true }
)

watch(
  () => [store.workspace.slots, loadedImage.value],
  () => {
    nextTick(() => renderAllSlots())
  },
  { deep: true }
)

watch(
  () => store.workspace.gridMode,
  () => {
    nextTick(() => {
      resizeAllCanvases()
    })
  }
)

onMounted(() => {
  nextTick(() => {
    resizeAllCanvases()
  })
  if (store.photo) {
    const img = new Image()
    img.onload = () => {
      loadedImage.value = img
      nextTick(() => {
        resizeAllCanvases()
      })
    }
    img.src = store.photo
  }
  window.addEventListener('resize', resizeAllCanvases)
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeAllCanvases)
})

function toggleExpand(slotId: string) {
  expandedSlotId.value = expandedSlotId.value === slotId ? null : slotId
}

function toggleNotes(slotId: string) {
  noteSlotId.value = noteSlotId.value === slotId ? null : slotId
}

function openTemplateDropdown(slotId: string, side: 'left' | 'right' | 'both') {
  if (templateDropdownSlotId.value === slotId && templateDropdownSide.value === side) {
    templateDropdownSlotId.value = null
  } else {
    templateDropdownSlotId.value = slotId
    templateDropdownSide.value = side
  }
}

function selectTemplateForSlot(slotId: string, templateId: string) {
  store.setSlotTemplate(slotId, templateId, templateDropdownSide.value)
  templateDropdownSlotId.value = null
}

function handleCopyToSlot(sourceId: string, targetId: string) {
  store.copySlotToSlot(sourceId, targetId)
}

function handleCopyCurrentToSlot(slotId: string) {
  store.copyCurrentToSlot(slotId)
}

function handleApplyGlobalEffect(slotId: string) {
  store.applyGlobalEffectToSlot(slotId)
}

function handleUndo() {
  store.undo()
}

function handleRedo() {
  store.redo()
}
</script>

<template>
  <div class="bg-bg-panel rounded-xl border border-gold/10">
    <div class="px-4 py-3 border-b border-gold/10 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <LayoutGrid class="w-4 h-4 text-gold-light" />
        <h3 class="text-sm font-display tracking-wider text-gold-light">方案对比工作台</h3>
      </div>
      <div class="flex items-center gap-2">
        <div class="flex items-center bg-white/5 rounded-lg p-0.5">
          <button
            v-for="mode in ([2, 3, 4] as GridMode[])"
            :key="mode"
            @click="store.setGridMode(mode)"
            :class="[
              'px-2.5 py-1 rounded-md text-[11px] font-medium transition-all',
              store.workspace.gridMode === mode
                ? 'bg-gold/20 text-gold-light shadow-sm'
                : 'text-ivory-muted hover:text-ivory',
            ]"
          >
            {{ mode }}宫格
          </button>
        </div>
        <div class="w-px h-4 bg-white/10" />
        <button
          @click="handleUndo"
          :disabled="store.undoStack.length === 0"
          class="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-ivory-muted hover:text-ivory disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="撤销"
        >
          <Undo2 class="w-3.5 h-3.5" />
        </button>
        <button
          @click="handleRedo"
          :disabled="store.redoStack.length === 0"
          class="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-ivory-muted hover:text-ivory disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="重做"
        >
          <Redo2 class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>

    <div class="p-3">
      <div :class="['grid gap-3', gridColsClass, gridRowsClass]">
        <div
          v-for="(slot, idx) in store.workspace.slots"
          :key="slot.id"
          class="relative rounded-xl border border-white/5 bg-bg-secondary/50 overflow-hidden group"
          :class="{ 'ring-2 ring-gold/40': expandedSlotId === slot.id }"
        >
          <div
            :ref="(el: any) => setContainerRef(slot.id, el)"
            class="relative aspect-[3/4] bg-black/30"
          >
            <canvas
              :ref="(el: any) => setCanvasRef(slot.id, el)"
              class="block w-full h-full"
            />

            <div class="absolute top-2 left-2 flex items-center gap-1">
              <span class="text-[10px] px-1.5 py-0.5 rounded bg-black/50 text-ivory-muted backdrop-blur-sm">
                #{{ idx + 1 }}
              </span>
              <input
                :value="slot.name"
                @change="store.updateSlotMeta(slot.id, { name: ($event.target as HTMLInputElement).value }, true)"
                class="text-[10px] px-1.5 py-0.5 rounded bg-black/50 text-ivory border-none outline-none w-20 backdrop-blur-sm"
              />
            </div>

            <div v-if="slot.recommended" class="absolute top-2 right-2">
              <span class="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/30 text-amber-200 backdrop-blur-sm flex items-center gap-0.5">
                <Star class="w-2.5 h-2.5 fill-amber-300" />
                推荐
              </span>
            </div>

            <div v-if="slot.lockEffect" class="absolute bottom-2 right-2">
              <span class="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/30 text-purple-200 backdrop-blur-sm flex items-center gap-0.5">
                <Lock class="w-2.5 h-2.5" />
                锁定效果
              </span>
            </div>
          </div>

          <div class="p-2.5 space-y-2">
            <div class="flex items-center gap-1.5">
              <div class="flex-1 relative">
                <button
                  @click="openTemplateDropdown(slot.id, 'left')"
                  class="w-full text-[10px] px-2 py-1 rounded bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 transition-colors flex items-center justify-between"
                >
                  <span>L: {{ getTemplate(slot.leftEarring.templateId).name }}</span>
                  <ChevronDown class="w-2.5 h-2.5" />
                </button>
                <div
                  v-if="templateDropdownSlotId === slot.id && templateDropdownSide === 'left'"
                  class="absolute z-20 left-0 mt-1 w-40 max-h-48 overflow-y-auto rounded-lg bg-bg-panel border border-gold/20 shadow-xl py-1"
                >
                  <button
                    v-for="t in earringTemplates"
                    :key="t.id"
                    @click="selectTemplateForSlot(slot.id, t.id)"
                    :class="[
                      'w-full px-2.5 py-1.5 text-[10px] text-left flex items-center gap-2 hover:bg-white/5 transition-colors',
                      slot.leftEarring.templateId === t.id ? 'text-gold-light bg-gold/10' : 'text-ivory-muted',
                    ]"
                  >
                    <span class="w-3 h-3" v-html="t.svgContent.slice(0, 50)" />
                    <span>{{ t.name }}</span>
                    <Check v-if="slot.leftEarring.templateId === t.id" class="w-3 h-3 ml-auto" />
                  </button>
                </div>
              </div>
              <div class="flex-1 relative">
                <button
                  @click="openTemplateDropdown(slot.id, 'right')"
                  class="w-full text-[10px] px-2 py-1 rounded bg-pink-500/10 text-pink-300 hover:bg-pink-500/20 transition-colors flex items-center justify-between"
                >
                  <span>R: {{ getTemplate(slot.rightEarring.templateId).name }}</span>
                  <ChevronDown class="w-2.5 h-2.5" />
                </button>
                <div
                  v-if="templateDropdownSlotId === slot.id && templateDropdownSide === 'right'"
                  class="absolute z-20 right-0 mt-1 w-40 max-h-48 overflow-y-auto rounded-lg bg-bg-panel border border-gold/20 shadow-xl py-1"
                >
                  <button
                    v-for="t in earringTemplates"
                    :key="t.id"
                    @click="selectTemplateForSlot(slot.id, t.id)"
                    :class="[
                      'w-full px-2.5 py-1.5 text-[10px] text-left flex items-center gap-2 hover:bg-white/5 transition-colors',
                      slot.rightEarring.templateId === t.id ? 'text-gold-light bg-gold/10' : 'text-ivory-muted',
                    ]"
                  >
                    <span class="w-3 h-3" v-html="t.svgContent.slice(0, 50)" />
                    <span>{{ t.name }}</span>
                    <Check v-if="slot.rightEarring.templateId === t.id" class="w-3 h-3 ml-auto" />
                  </button>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-1">
              <button
                @click="store.toggleSlotAnchors(slot.id)"
                :class="[
                  'p-1 rounded text-[10px] transition-colors',
                  slot.showAnchors ? 'bg-gold/20 text-gold-light' : 'bg-white/5 text-ivory-muted hover:text-ivory',
                ]"
                title="显示/隐藏锚点"
              >
                <Eye v-if="slot.showAnchors" class="w-3 h-3" />
                <EyeOff v-else class="w-3 h-3" />
              </button>
              <button
                @click="store.toggleSlotLockEffect(slot.id)"
                :class="[
                  'p-1 rounded text-[10px] transition-colors',
                  slot.lockEffect ? 'bg-purple-500/20 text-purple-300' : 'bg-white/5 text-ivory-muted hover:text-ivory',
                ]"
                :title="slot.lockEffect ? '解锁效果同步' : '锁定当前效果'"
              >
                <Lock v-if="slot.lockEffect" class="w-3 h-3" />
                <Unlock v-else class="w-3 h-3" />
              </button>
              <button
                @click="handleApplyGlobalEffect(slot.id)"
                :class="[
                  'p-1 rounded text-[10px] transition-colors',
                  slot.lockEffect ? 'bg-white/5 text-ivory-muted/30 cursor-not-allowed' : 'bg-white/5 text-ivory-muted hover:text-ivory',
                ]"
                :title="slot.lockEffect ? '效果已锁定' : '应用全局妆容与光线'"
                :disabled="slot.lockEffect"
              >
                <Sparkles class="w-3 h-3" />
              </button>
              <button
                @click="handleCopyCurrentToSlot(slot.id)"
                class="p-1 rounded text-[10px] bg-white/5 text-ivory-muted hover:text-ivory transition-colors"
                title="从主画布复制当前配置"
              >
                <Copy class="w-3 h-3" />
              </button>
              <button
                @click="toggleFineTune(slot.id)"
                :class="[
                  'p-1 rounded text-[10px] transition-colors',
                  fineTuneSlotId === slot.id ? 'bg-cyan-500/20 text-cyan-300' : 'bg-white/5 text-ivory-muted hover:text-ivory',
                ]"
                title="独立微调：高度/长度/尺寸/角度/锚点"
              >
                <SlidersHorizontal class="w-3 h-3" />
              </button>
              <div class="flex-1" />
              <button
                @click="store.updateSlotMeta(slot.id, { recommended: !slot.recommended }, true)"
                :class="[
                  'p-1 rounded text-[10px] transition-colors',
                  slot.recommended ? 'bg-amber-500/20 text-amber-300' : 'bg-white/5 text-ivory-muted hover:text-amber-300',
                ]"
                title="标记推荐购买"
              >
                <Star class="w-3 h-3" :class="{ 'fill-amber-300': slot.recommended }" />
              </button>
              <button
                @click="toggleNotes(slot.id)"
                :class="[
                  'p-1 rounded text-[10px] transition-colors',
                  noteSlotId === slot.id ? 'bg-gold/20 text-gold-light' : 'bg-white/5 text-ivory-muted hover:text-ivory',
                ]"
                title="购买备注"
              >
                <Pencil class="w-3 h-3" />
              </button>
            </div>

            <div v-if="fineTuneSlotId === slot.id" class="p-2 rounded-lg bg-white/5 border border-cyan-500/10">
              <div class="flex items-center gap-1 mb-2">
                <button
                  @click="fineTuneSide = 'left'"
                  :class="[
                    'text-[10px] px-2 py-0.5 rounded transition-colors',
                    fineTuneSide === 'left' ? 'bg-blue-500/20 text-blue-300' : 'text-ivory-muted hover:text-ivory',
                  ]"
                >
                  左耳
                </button>
                <button
                  @click="fineTuneSide = 'right'"
                  :class="[
                    'text-[10px] px-2 py-0.5 rounded transition-colors',
                    fineTuneSide === 'right' ? 'bg-pink-500/20 text-pink-300' : 'text-ivory-muted hover:text-ivory',
                  ]"
                >
                  右耳
                </button>
              </div>

              <div class="space-y-1.5">
                <div class="space-y-0.5">
                  <div class="flex items-center justify-between">
                    <span class="text-[10px] text-ivory-muted/70">高度</span>
                    <span class="text-[10px] text-gold font-mono tabular-nums">
                      {{ getFieldDisplay('offsetY', fineTuneSide === 'left' ? slot.leftEarring.offsetY : slot.rightEarring.offsetY) }}
                    </span>
                  </div>
                  <input
                    type="range"
                    :value="fineTuneSide === 'left' ? slot.leftEarring.offsetY : slot.rightEarring.offsetY"
                    min="-60"
                    max="60"
                    step="1"
                    @input="handleSlotSliderChange(slot.id, fineTuneSide, 'offsetY', Number(($event.target as HTMLInputElement).value))"
                    class="w-full"
                  />
                </div>

                <div class="space-y-0.5">
                  <div class="flex items-center justify-between">
                    <span class="text-[10px] text-ivory-muted/70">长度缩放</span>
                    <span class="text-[10px] text-gold font-mono tabular-nums">
                      {{ getFieldDisplay('lengthScale', fineTuneSide === 'left' ? slot.leftEarring.lengthScale : slot.rightEarring.lengthScale) }}
                    </span>
                  </div>
                  <input
                    type="range"
                    :value="fineTuneSide === 'left' ? slot.leftEarring.lengthScale : slot.rightEarring.lengthScale"
                    min="0.5"
                    max="2.5"
                    step="0.01"
                    @input="handleSlotSliderChange(slot.id, fineTuneSide, 'lengthScale', Number(($event.target as HTMLInputElement).value))"
                    class="w-full"
                  />
                </div>

                <div class="space-y-0.5">
                  <div class="flex items-center justify-between">
                    <span class="text-[10px] text-ivory-muted/70">整体尺寸</span>
                    <span class="text-[10px] text-gold font-mono tabular-nums">
                      {{ getFieldDisplay('scale', fineTuneSide === 'left' ? slot.leftEarring.scale : slot.rightEarring.scale) }}
                    </span>
                  </div>
                  <input
                    type="range"
                    :value="fineTuneSide === 'left' ? slot.leftEarring.scale : slot.rightEarring.scale"
                    min="0.5"
                    max="2.5"
                    step="0.01"
                    @input="handleSlotSliderChange(slot.id, fineTuneSide, 'scale', Number(($event.target as HTMLInputElement).value))"
                    class="w-full"
                  />
                </div>

                <div class="space-y-0.5">
                  <div class="flex items-center justify-between">
                    <span class="text-[10px] text-ivory-muted/70">旋转角度</span>
                    <span class="text-[10px] text-gold font-mono tabular-nums">
                      {{ getFieldDisplay('rotation', fineTuneSide === 'left' ? slot.leftEarring.rotation : slot.rightEarring.rotation) }}
                    </span>
                  </div>
                  <input
                    type="range"
                    :value="fineTuneSide === 'left' ? slot.leftEarring.rotation : slot.rightEarring.rotation"
                    min="-45"
                    max="45"
                    step="0.5"
                    @input="handleSlotSliderChange(slot.id, fineTuneSide, 'rotation', Number(($event.target as HTMLInputElement).value))"
                    class="w-full"
                  />
                </div>

                <div class="flex items-center gap-2">
                  <div class="flex-1 space-y-0.5">
                    <div class="flex items-center justify-between">
                      <span class="text-[10px] text-ivory-muted/70">水平位置</span>
                      <span class="text-[10px] text-gold font-mono tabular-nums">
                        {{ getFieldDisplay('offsetX', fineTuneSide === 'left' ? slot.leftEarring.offsetX : slot.rightEarring.offsetX) }}
                      </span>
                    </div>
                    <input
                      type="range"
                      :value="fineTuneSide === 'left' ? slot.leftEarring.offsetX : slot.rightEarring.offsetX"
                      min="-60"
                      max="60"
                      step="1"
                      @input="handleSlotSliderChange(slot.id, fineTuneSide, 'offsetX', Number(($event.target as HTMLInputElement).value))"
                      class="w-full"
                    />
                  </div>
                </div>

                <div class="pt-1 border-t border-white/5 space-y-1.5">
                  <p class="text-[9px] text-ivory-muted/50">锚点位置（耳洞坐标）</p>
                  <div class="space-y-0.5">
                    <div class="flex items-center justify-between">
                      <span class="text-[10px] text-ivory-muted/70">X 坐标</span>
                      <span class="text-[10px] text-gold font-mono tabular-nums">
                        {{ getFieldDisplay('anchorX', fineTuneSide === 'left' ? slot.leftEarring.anchorX : slot.rightEarring.anchorX) }}
                      </span>
                    </div>
                    <input
                      type="range"
                      :value="fineTuneSide === 'left' ? slot.leftEarring.anchorX : slot.rightEarring.anchorX"
                      min="0"
                      max="1"
                      step="0.01"
                      @input="handleSlotSliderChange(slot.id, fineTuneSide, 'anchorX', Number(($event.target as HTMLInputElement).value))"
                      class="w-full"
                    />
                  </div>
                  <div class="space-y-0.5">
                    <div class="flex items-center justify-between">
                      <span class="text-[10px] text-ivory-muted/70">Y 坐标</span>
                      <span class="text-[10px] text-gold font-mono tabular-nums">
                        {{ getFieldDisplay('anchorY', fineTuneSide === 'left' ? slot.leftEarring.anchorY : slot.rightEarring.anchorY) }}
                      </span>
                    </div>
                    <input
                      type="range"
                      :value="fineTuneSide === 'left' ? slot.leftEarring.anchorY : slot.rightEarring.anchorY"
                      min="0"
                      max="1"
                      step="0.01"
                      @input="handleSlotSliderChange(slot.id, fineTuneSide, 'anchorY', Number(($event.target as HTMLInputElement).value))"
                      class="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-1 text-[9px] text-ivory-muted/60">
              <span>妆:{{ slot.effect.makeupTone }}</span>
              <span>光:{{ slot.effect.lightingMode }}</span>
              <span v-if="slot.effect.hairstyleOverlay">发型</span>
              <span>尺:{{ (slot.leftEarring.scale * 100).toFixed(0) }}%</span>
              <span>旋:{{ slot.leftEarring.rotation.toFixed(1) }}°</span>
            </div>

            <div v-if="noteSlotId === slot.id" class="space-y-1.5 p-2 rounded-lg bg-white/5 border border-white/5">
              <div>
                <label class="text-[9px] text-ivory-muted/70">预算</label>
                <input
                  :value="slot.budget"
                  @change="store.updateSlotMeta(slot.id, { budget: ($event.target as HTMLInputElement).value }, true)"
                  class="w-full text-[10px] px-2 py-1 rounded bg-black/30 border border-white/10 text-ivory outline-none focus:border-gold/40"
                  placeholder="如：500-1000元"
                />
              </div>
              <div>
                <label class="text-[9px] text-ivory-muted/70">材质偏好</label>
                <input
                  :value="slot.materialPreference"
                  @change="store.updateSlotMeta(slot.id, { materialPreference: ($event.target as HTMLInputElement).value }, true)"
                  class="w-full text-[10px] px-2 py-1 rounded bg-black/30 border border-white/10 text-ivory outline-none focus:border-gold/40"
                  placeholder="如：18K金、银、玫瑰金"
                />
              </div>
              <div>
                <label class="text-[9px] text-ivory-muted/70">佩戴场景</label>
                <input
                  :value="slot.sceneNotes"
                  @change="store.updateSlotMeta(slot.id, { sceneNotes: ($event.target as HTMLInputElement).value }, true)"
                  class="w-full text-[10px] px-2 py-1 rounded bg-black/30 border border-white/10 text-ivory outline-none focus:border-gold/40"
                  placeholder="如：日常、婚礼、晚宴"
                />
              </div>
              <div class="flex gap-1.5">
                <button
                  @click="store.saveSlotAsScheme(slot.id)"
                  class="flex-1 py-1 text-[9px] rounded bg-gold/15 text-gold-light hover:bg-gold/25 transition-colors flex items-center justify-center gap-1"
                >
                  <BookmarkPlus class="w-2.5 h-2.5" />
                  保存到方案库
                </button>
                <button
                  @click="store.loadSlotToMain(slot.id)"
                  class="flex-1 py-1 text-[9px] rounded bg-blue-500/15 text-blue-300 hover:bg-blue-500/25 transition-colors"
                >
                  加载到主画布
                </button>
              </div>
              <div class="flex gap-1.5 mt-1.5">
                <button
                  @click="handleEnterInspirationFromSlot(slot.id)"
                  class="flex-1 py-1 text-[9px] rounded bg-teal-500/15 text-teal-300 hover:bg-teal-500/25 transition-colors flex items-center justify-center gap-1"
                >
                  <Palette class="w-2.5 h-2.5" />
                  进入搭配工作台
                </button>
              </div>
            </div>

            <div v-if="store.workspace.gridMode > 2" class="flex items-center gap-1">
              <span class="text-[9px] text-ivory-muted/50">复制到:</span>
              <button
                v-for="(target, tIdx) in store.workspace.slots.filter((s) => s.id !== slot.id)"
                :key="target.id"
                @click="handleCopyToSlot(slot.id, target.id)"
                class="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-ivory-muted hover:text-ivory hover:bg-white/10 transition-colors"
              >
                #{{ tIdx >= idx ? tIdx + 2 : tIdx + 1 }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
