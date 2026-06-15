<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useEarringStore } from '@/stores/useEarringStore'
import { earringTemplates } from '@/data/earringTemplates'
import type { EarringInstance } from '@/types'
import { Upload, ZoomIn, ZoomOut, Move, RotateCcw, User } from 'lucide-vue-next'

const emit = defineEmits<{
  (e: 'canvas-ready', canvas: HTMLCanvasElement): void
}>()

const store = useEarringStore()
const canvasRef = ref<HTMLCanvasElement | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)
const draggingSide = ref<'left' | 'right' | null>(null)
const isPanning = ref(false)
const panStart = ref({ x: 0, y: 0 })
const loadedImage = ref<HTMLImageElement | null>(null)
const svgImageCache = ref<Map<string, HTMLImageElement>>(new Map())
const svgLoadingState = ref<Set<string>>(new Set())

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

const combinedFilter = computed(() => {
  const lf = lightingFilters[store.effect.lightingMode]
  const mf = makeupFilters[store.effect.makeupTone]
  if (lf === 'none' && mf === 'none') return 'none'
  if (lf === 'none') return mf
  if (mf === 'none') return lf
  return `${lf} ${mf}`
})

function getTemplate(id: string) {
  return earringTemplates.find((t) => t.id === id) || earringTemplates[0]
}

function preloadSvg(templateId: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (svgImageCache.value.has(templateId)) {
      resolve(svgImageCache.value.get(templateId)!)
      return
    }
    if (svgLoadingState.value.has(templateId)) {
      resolve(null)
      return
    }
    const template = getTemplate(templateId)
    const svgBlob = new Blob([template.svgContent], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)
    const img = new Image()
    svgLoadingState.value.add(templateId)
    img.onload = () => {
      URL.revokeObjectURL(url)
      svgImageCache.value.set(templateId, img)
      svgLoadingState.value.delete(templateId)
      requestAnimationFrame(render)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      svgLoadingState.value.delete(templateId)
      resolve(null)
    }
    img.src = url
  })
}

function handleFileSelect(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (ev) => {
    const dataUrl = ev.target?.result as string
    const img = new Image()
    img.onload = () => {
      loadedImage.value = img
      store.setPhoto(dataUrl, img.width, img.height)
      store.resetAnchors()
      store.canvasScale = 1
      store.canvasOffset = { x: 0, y: 0 }
    }
    img.src = dataUrl
  }
  reader.readAsDataURL(file)
  input.value = ''
}

function getCanvasCoords(e: MouseEvent | TouchEvent) {
  const canvas = canvasRef.value
  if (!canvas) return { x: 0, y: 0 }
  const rect = canvas.getBoundingClientRect()
  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
  const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  }
}

function handleCanvasMouseDown(e: MouseEvent) {
  if (!store.photo) return
  const coords = getCanvasCoords(e)
  const photoW = store.photoWidth
  const photoH = store.photoHeight
  const canvas = canvasRef.value!
  const scale = store.canvasScale
  const offsetX = store.canvasOffset.x
  const offsetY = store.canvasOffset.y

  const imgDisplayW = photoW * scale
  const imgDisplayH = photoH * scale
  const imgLeft = (canvas.width - imgDisplayW) / 2 + offsetX
  const imgTop = (canvas.height - imgDisplayH) / 2 + offsetY

  const photoX = (coords.x - imgLeft) / imgDisplayW
  const photoY = (coords.y - imgTop) / imgDisplayH

  if (photoX < 0 || photoX > 1 || photoY < 0 || photoY > 1) {
    isPanning.value = true
    panStart.value = { x: e.clientX - offsetX, y: e.clientY - offsetY }
    return
  }

  const leftDist = Math.abs(photoX - store.leftAnchor.x)
  const rightDist = Math.abs(photoX - store.rightAnchor.x)

  if (leftDist < rightDist) {
    draggingSide.value = 'left'
  } else {
    draggingSide.value = 'right'
  }
  store.setAnchor(draggingSide.value, photoX, photoY)
}

function handleCanvasMouseMove(e: MouseEvent) {
  if (!store.photo) return

  if (isPanning.value) {
    store.canvasOffset = {
      x: e.clientX - panStart.value.x,
      y: e.clientY - panStart.value.y,
    }
    return
  }

  if (!draggingSide.value) return
  const coords = getCanvasCoords(e)
  const photoW = store.photoWidth
  const photoH = store.photoHeight
  const canvas = canvasRef.value!
  const scale = store.canvasScale
  const offsetX = store.canvasOffset.x
  const offsetY = store.canvasOffset.y

  const imgDisplayW = photoW * scale
  const imgDisplayH = photoH * scale
  const imgLeft = (canvas.width - imgDisplayW) / 2 + offsetX
  const imgTop = (canvas.height - imgDisplayH) / 2 + offsetY

  const photoX = Math.max(0, Math.min(1, (coords.x - imgLeft) / imgDisplayW))
  const photoY = Math.max(0, Math.min(1, (coords.y - imgTop) / imgDisplayH))

  store.setAnchor(draggingSide.value, photoX, photoY)
}

function handleCanvasMouseUp() {
  draggingSide.value = null
  isPanning.value = false
}

function zoomIn() {
  store.canvasScale = Math.min(3, store.canvasScale + 0.1)
}

function zoomOut() {
  store.canvasScale = Math.max(0.3, store.canvasScale - 0.1)
}

function resetView() {
  store.canvasScale = 1
  store.canvasOffset = { x: 0, y: 0 }
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
    if (!svgLoadingState.value.has(earring.templateId)) {
      preloadSvg(earring.templateId)
    }
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

function render() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  if (!store.photo || !loadedImage.value) {
    ctx.fillStyle = '#0f1624'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    const cx = canvas.width / 2
    const cy = canvas.height / 2
    ctx.strokeStyle = 'rgba(212, 165, 116, 0.2)'
    ctx.lineWidth = 2
    ctx.setLineDash([8, 8])
    ctx.strokeRect(cx - 180, cy - 220, 360, 440)
    ctx.setLineDash([])
    ctx.fillStyle = 'rgba(212, 165, 116, 0.5)'
    ctx.font = '16px Noto Sans SC, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('上传正脸照片开始试戴', cx, cy + 6)
    return
  }

  const photoW = store.photoWidth
  const photoH = store.photoHeight
  const scale = store.canvasScale
  const offsetX = store.canvasOffset.x
  const offsetY = store.canvasOffset.y

  const imgDisplayW = photoW * scale
  const imgDisplayH = photoH * scale
  const imgLeft = (canvas.width - imgDisplayW) / 2 + offsetX
  const imgTop = (canvas.height - imgDisplayH) / 2 + offsetY

  ctx.filter = combinedFilter.value
  if (loadedImage.value) {
    ctx.drawImage(loadedImage.value, imgLeft, imgTop, imgDisplayW, imgDisplayH)
  }
  ctx.filter = 'none'

  if (store.effect.hairstyleOverlay) {
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
      0,
      0,
      Math.PI * 2
    )
    ctx.fill()

    const sideGradient = ctx.createLinearGradient(imgLeft, imgTop, imgLeft + imgDisplayW * 0.15, imgTop)
    sideGradient.addColorStop(0, 'rgba(30, 20, 15, 0.6)')
    sideGradient.addColorStop(1, 'rgba(30, 20, 15, 0)')
    ctx.fillStyle = sideGradient
    ctx.fillRect(imgLeft, imgTop + imgDisplayH * 0.1, imgDisplayW * 0.15, imgDisplayH * 0.7)

    const sideGradient2 = ctx.createLinearGradient(
      imgLeft + imgDisplayW,
      imgTop,
      imgLeft + imgDisplayW * 0.85,
      imgTop
    )
    sideGradient2.addColorStop(0, 'rgba(30, 20, 15, 0.6)')
    sideGradient2.addColorStop(1, 'rgba(30, 20, 15, 0)')
    ctx.fillStyle = sideGradient2
    ctx.fillRect(imgLeft + imgDisplayW * 0.85, imgTop + imgDisplayH * 0.1, imgDisplayW * 0.15, imgDisplayH * 0.7)
    ctx.restore()
  }

  drawEarring(ctx, store.leftEarring, imgDisplayW, imgDisplayH, imgLeft, imgTop)
  drawEarring(ctx, store.rightEarring, imgDisplayW, imgDisplayH, imgLeft, imgTop)

  if (store.showAnchors) {
    const drawAnchor = (x: number, y: number, color: string, label: string) => {
      const ax = imgLeft + x * imgDisplayW
      const ay = imgTop + y * imgDisplayH
      ctx.save()
      ctx.beginPath()
      ctx.arc(ax, ay, 10, 0, Math.PI * 2)
      ctx.fillStyle = color + '30'
      ctx.fill()
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(ax, ay, 3, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.fill()
      ctx.font = 'bold 11px Noto Sans SC'
      ctx.fillStyle = color
      ctx.textAlign = 'center'
      ctx.fillText(label, ax, ay - 16)
      ctx.restore()
    }
    drawAnchor(store.leftAnchor.x, store.leftAnchor.y, '#60a5fa', 'L 左耳')
    drawAnchor(store.rightAnchor.x, store.rightAnchor.y, '#f472b6', 'R 右耳')
  }
}

watch(
  () => store.photo,
  (newPhoto) => {
    if (!newPhoto) {
      loadedImage.value = null
      return
    }
    if (loadedImage.value?.src === newPhoto) return
    const img = new Image()
    img.onload = () => {
      loadedImage.value = img
      if (store.photoWidth === 0 || store.photoWidth !== img.width) {
        store.setPhoto(newPhoto, img.width, img.height)
      }
      requestAnimationFrame(render)
    }
    img.src = newPhoto
  },
  { immediate: true }
)

watch(
  () => [
    store.leftEarring,
    store.rightEarring,
    store.leftAnchor,
    store.rightAnchor,
    store.effect,
    store.showAnchors,
    store.canvasScale,
    store.canvasOffset,
    loadedImage.value,
  ],
  () => {
    requestAnimationFrame(render)
  },
  { deep: true }
)

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return

  const resizeCanvas = () => {
    const container = containerRef.value
    if (!container) return
    const rect = container.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    canvas.style.width = rect.width + 'px'
    canvas.style.height = rect.height + 'px'
    const ctx = canvas.getContext('2d')
    if (ctx) ctx.scale(dpr, dpr)
    canvas.width = rect.width
    canvas.height = rect.height
    requestAnimationFrame(render)
  }

  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)

  emit('canvas-ready', canvas)

  if (store.photo) {
    const img = new Image()
    img.onload = () => {
      loadedImage.value = img
      requestAnimationFrame(render)
    }
    img.src = store.photo
  }
})

defineExpose({
  render,
  getCanvas: () => canvasRef.value,
})
</script>

<template>
  <div class="h-full flex flex-col bg-bg-panel rounded-xl border border-gold/10">
    <div class="px-4 py-2.5 border-b border-gold/10 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <User class="w-4 h-4 text-gold-light" />
        <h3 class="text-sm font-display tracking-wider text-gold-light">试戴画布</h3>
      </div>
      <div class="flex items-center gap-1">
        <button
          @click="zoomOut"
          :disabled="!store.photo"
          class="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-ivory-muted hover:text-ivory disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="缩小"
        >
          <ZoomOut class="w-4 h-4" />
        </button>
        <span class="text-xs text-ivory-muted px-2 min-w-[52px] text-center">
          {{ Math.round(store.canvasScale * 100) }}%
        </span>
        <button
          @click="zoomIn"
          :disabled="!store.photo"
          class="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-ivory-muted hover:text-ivory disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="放大"
        >
          <ZoomIn class="w-4 h-4" />
        </button>
        <button
          @click="resetView"
          :disabled="!store.photo"
          class="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-ivory-muted hover:text-ivory disabled:opacity-30 disabled:cursor-not-allowed transition-colors ml-1"
          title="重置视图"
        >
          <RotateCcw class="w-4 h-4" />
        </button>
        <div class="w-px h-5 bg-white/10 mx-1" />
        <button
          @click="fileInputRef?.click()"
          class="px-3 py-1.5 rounded-lg bg-gold/20 hover:bg-gold/30 text-gold-light text-xs font-medium flex items-center gap-1.5 transition-colors"
        >
          <Upload class="w-3.5 h-3.5" />
          上传照片
        </button>
        <input
          ref="fileInputRef"
          type="file"
          accept="image/*"
          class="hidden"
          @change="handleFileSelect"
        />
      </div>
    </div>

    <div ref="containerRef" class="flex-1 relative overflow-hidden rounded-b-xl cursor-crosshair">
      <canvas
        ref="canvasRef"
        @mousedown="handleCanvasMouseDown"
        @mousemove="handleCanvasMouseMove"
        @mouseup="handleCanvasMouseUp"
        @mouseleave="handleCanvasMouseUp"
        class="block"
      />
      <div
        v-if="!store.photo"
        class="absolute inset-0 flex items-center justify-center"
      >
        <div
          class="w-80 h-96 rounded-2xl border-2 border-dashed border-gold/20 flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-bg-secondary/50 to-transparent cursor-pointer hover:border-gold/40 hover:bg-gradient-to-br hover:from-bg-secondary/70 hover:to-bg-secondary/30 transition-all duration-300 group"
          @click="fileInputRef?.click()"
        >
          <div class="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center group-hover:bg-gold/15 group-hover:scale-110 transition-all duration-300">
            <Upload class="w-7 h-7 text-gold" />
          </div>
          <div class="text-center">
            <p class="text-gold-light font-medium mb-1 group-hover:text-gold transition-colors">点击上传正脸照片</p>
            <p class="text-xs text-ivory-muted/70">支持 JPG / PNG 格式</p>
          </div>
        </div>
      </div>

      <div
        v-if="store.photo && store.showAnchors"
        class="absolute bottom-3 left-3 right-3 flex justify-between text-[11px]"
      >
        <span class="px-2 py-1 rounded bg-blue-500/20 text-blue-300 backdrop-blur-sm">
          蓝点 = 左耳锚点
        </span>
        <span class="px-2 py-1 rounded bg-pink-500/20 text-pink-300 backdrop-blur-sm">
          粉点 = 右耳锚点
        </span>
      </div>
    </div>
  </div>
</template>
