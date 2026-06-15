<script setup lang="ts">
import { ref } from 'vue'
import { useEarringStore } from '@/stores/useEarringStore'
import { earringTemplates, categoryLabels } from '@/data/earringTemplates'
import {
  Save,
  ImageDown,
  CreditCard,
  CheckCircle2,
  Sparkles,
  X,
} from 'lucide-vue-next'

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  getCanvas: () => HTMLCanvasElement | null
}>()

const store = useEarringStore()
const saveModalOpen = ref(false)
const schemeName = ref('')
const purchaseCardOpen = ref(false)
const exportLoading = ref(false)

function getTemplate(id: string) {
  return earringTemplates.find((t) => t.id === id) || earringTemplates[0]
}

function generateThumbnail(): string {
  const canvas = props.getCanvas()
  if (!canvas) return ''
  const maxW = 320
  const scale = Math.min(1, maxW / canvas.width)
  const tmp = document.createElement('canvas')
  tmp.width = canvas.width * scale
  tmp.height = canvas.height * scale
  const ctx = tmp.getContext('2d')
  if (ctx) {
    ctx.drawImage(canvas, 0, 0, tmp.width, tmp.height)
  }
  return tmp.toDataURL('image/jpeg', 0.8)
}

function openSaveModal() {
  if (!store.photo) {
    alert('请先上传照片再保存方案')
    return
  }
  schemeName.value = `方案-${new Date().toLocaleDateString('zh-CN')}-${String(store.schemes.length + 1).padStart(2, '0')}`
  saveModalOpen.value = true
}

function saveScheme() {
  if (!schemeName.value.trim()) {
    alert('请输入方案名称')
    return
  }
  const thumb = generateThumbnail()
  store.saveScheme(schemeName.value.trim(), thumb)
  saveModalOpen.value = false
  schemeName.value = ''
}

async function exportCompareImage() {
  const canvas = props.getCanvas()
  if (!canvas || !store.photo) {
    alert('请先上传照片并调整耳饰')
    return
  }

  exportLoading.value = true
  try {
    const padding = 40
    const labelH = 60
    const outW = canvas.width * 2 + padding * 3
    const outH = canvas.height + padding * 2 + labelH

    const out = document.createElement('canvas')
    out.width = outW
    out.height = outH
    const ctx = out.getContext('2d')!

    const grd = ctx.createLinearGradient(0, 0, outW, outH)
    grd.addColorStop(0, '#1a1a2e')
    grd.addColorStop(1, '#16213e')
    ctx.fillStyle = grd
    ctx.fillRect(0, 0, outW, outH)

    ctx.strokeStyle = 'rgba(212, 165, 116, 0.2)'
    ctx.lineWidth = 1
    ctx.strokeRect(10, 10, outW - 20, outH - 20)

    ctx.font = 'bold 20px Playfair Display, Georgia, serif'
    ctx.fillStyle = '#e8c9a0'
    ctx.textAlign = 'left'
    ctx.fillText('✨ 耳饰试戴对比图', padding, padding + 10)

    ctx.font = '12px Noto Sans SC, sans-serif'
    ctx.fillStyle = 'rgba(245, 240, 232, 0.6)'
    ctx.fillText(`生成时间: ${new Date().toLocaleString('zh-CN')}`, padding, padding + 32)

    const origImg = new Image()
    origImg.crossOrigin = 'anonymous'
    await new Promise<void>((resolve) => {
      origImg.onload = () => resolve()
      origImg.src = store.photo!
    })

    const scaleX = canvas.width / store.photoWidth
    const scaleY = canvas.height / store.photoHeight
    const scale = Math.min(scaleX, scaleY)
    const drawW = store.photoWidth * scale
    const drawH = store.photoHeight * scale
    const drawX = (canvas.width - drawW) / 2
    const drawY = (canvas.height - drawH) / 2

    const beforeX = padding
    const beforeY = padding + labelH
    ctx.drawImage(origImg, drawX, drawY, drawW, drawH, beforeX, beforeY, canvas.width, canvas.height)

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
    ctx.fillRect(beforeX, beforeY + canvas.height - 40, canvas.width, 40)
    ctx.font = 'bold 14px Noto Sans SC, sans-serif'
    ctx.fillStyle = '#f5f0e8'
    ctx.textAlign = 'center'
    ctx.fillText('📷 原始照片', beforeX + canvas.width / 2, beforeY + canvas.height - 15)

    const afterX = padding * 2 + canvas.width
    const afterY = padding + labelH
    ctx.drawImage(canvas, afterX, afterY)

    ctx.fillStyle = 'rgba(212, 165, 116, 0.25)'
    ctx.fillRect(afterX, afterY + canvas.height - 40, canvas.width, 40)
    ctx.strokeStyle = 'rgba(212, 165, 116, 0.5)'
    ctx.lineWidth = 1
    ctx.strokeRect(afterX + 0.5, afterY + 0.5, canvas.width - 1, canvas.height - 1)

    ctx.font = 'bold 14px Noto Sans SC, sans-serif'
    ctx.fillStyle = '#e8c9a0'
    ctx.textAlign = 'center'
    ctx.fillText('💎 试戴效果', afterX + canvas.width / 2, afterY + canvas.height - 15)

    const leftT = getTemplate(store.leftEarring.templateId)
    const rightT = getTemplate(store.rightEarring.templateId)
    ctx.font = '11px Noto Sans SC, sans-serif'
    ctx.fillStyle = 'rgba(245, 240, 232, 0.7)'
    ctx.textAlign = 'right'
    const infoX = outW - padding
    const infoY = outH - 20
    ctx.fillText(
      `左耳: ${leftT.name} | 右耳: ${rightT.name} | 妆容: ${store.effect.makeupTone} | 光线: ${store.effect.lightingMode}`,
      infoX,
      infoY
    )

    const link = document.createElement('a')
    link.download = `耳饰试戴对比-${Date.now()}.png`
    link.href = out.toDataURL('image/png')
    link.click()
  } finally {
    exportLoading.value = false
  }
}

function openPurchaseCard() {
  if (!store.photo) {
    alert('请先上传照片再生成参考卡')
    return
  }
  purchaseCardOpen.value = true
}

function closePurchaseCard() {
  purchaseCardOpen.value = false
}

function downloadPurchaseCard() {
  const canvas = document.createElement('canvas')
  const w = 800
  const h = 1100
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
  ctx.strokeRect(30, 30, w - 60, h - 60)
  ctx.strokeStyle = 'rgba(212, 165, 116, 0.1)'
  ctx.lineWidth = 1
  ctx.strokeRect(40, 40, w - 80, h - 80)

  ctx.font = 'bold 36px Playfair Display, Georgia, serif'
  ctx.fillStyle = '#e8c9a0'
  ctx.textAlign = 'center'
  ctx.fillText('Earring Try-On Reference', w / 2, 100)

  ctx.font = '14px Noto Sans SC, sans-serif'
  ctx.fillStyle = 'rgba(245, 240, 232, 0.6)'
  ctx.fillText('耳饰试戴购买参考卡', w / 2, 130)

  const thumb = generateThumbnail()
  const thumbImg = new Image()
  thumbImg.onload = () => {
    const tw = 360
    const th = 450
    const tx = (w - tw) / 2
    const ty = 170

    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
    ctx.fillRect(tx - 4, ty - 4, tw + 8, th + 8)
    ctx.strokeStyle = 'rgba(212, 165, 116, 0.4)'
    ctx.lineWidth = 1
    ctx.strokeRect(tx - 4, ty - 4, tw + 8, th + 8)
    ctx.drawImage(thumbImg, tx, ty, tw, th)

    drawCardDetails(ctx, w, ty + th + 40)

    const link = document.createElement('a')
    link.download = `购买参考卡-${Date.now()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    closePurchaseCard()
  }
  thumbImg.src = thumb

  if (thumbImg.complete && thumbImg.naturalWidth > 0) {
    const tw = 360
    const th = 450
    const tx = (w - tw) / 2
    const ty = 170
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
    ctx.fillRect(tx - 4, ty - 4, tw + 8, th + 8)
    ctx.strokeStyle = 'rgba(212, 165, 116, 0.4)'
    ctx.lineWidth = 1
    ctx.strokeRect(tx - 4, ty - 4, tw + 8, th + 8)
    ctx.drawImage(thumbImg, tx, ty, tw, th)
    drawCardDetails(ctx, w, ty + th + 40)
  }
}

function drawCardDetails(ctx: CanvasRenderingContext2D, w: number, startY: number) {
  const leftT = getTemplate(store.leftEarring.templateId)
  const rightT = getTemplate(store.rightEarring.templateId)
  let y = startY

  ctx.font = 'bold 16px Noto Sans SC, sans-serif'
  ctx.fillStyle = '#e8c9a0'
  ctx.textAlign = 'left'
  ctx.fillText('📋 耳饰配置详情', 80, y)
  y += 20

  ctx.font = '12px Noto Sans SC, sans-serif'
  ctx.fillStyle = 'rgba(245, 240, 232, 0.7)'
  ctx.textAlign = 'left'

  const rows: [string, string, string][] = [
    ['左耳款式', leftT.name, `${categoryLabels[leftT.category]}`],
    ['右耳款式', rightT.name, `${categoryLabels[rightT.category]}`],
    ['左耳尺寸', `${(store.leftEarring.scale * 100).toFixed(0)}%`, `旋转 ${store.leftEarring.rotation.toFixed(1)}°`],
    ['右耳尺寸', `${(store.rightEarring.scale * 100).toFixed(0)}%`, `旋转 ${store.rightEarring.rotation.toFixed(1)}°`],
    ['妆容效果', store.effect.makeupTone, store.effect.hairstyleOverlay ? '含发型遮挡' : '无发型遮挡'],
    ['光线模式', store.effect.lightingMode, ''],
  ]

  for (const [label, value, extra] of rows) {
    y += 28
    ctx.fillStyle = 'rgba(245, 240, 232, 0.5)'
    ctx.fillText(label, 80, y)
    ctx.fillStyle = '#f5f0e8'
    ctx.fillText(value, 200, y)
    if (extra) {
      ctx.fillStyle = 'rgba(212, 165, 116, 0.8)'
      ctx.textAlign = 'right'
      ctx.fillText(extra, w - 80, y)
      ctx.textAlign = 'left'
    }
  }

  y += 40
  ctx.font = '11px Noto Sans SC, sans-serif'
  ctx.fillStyle = 'rgba(245, 240, 232, 0.4)'
  ctx.textAlign = 'center'
  ctx.fillText(`生成时间: ${new Date().toLocaleString('zh-CN')} | 仅供参考，以实物为准`, w / 2, y)

  y += 30
  ctx.fillStyle = 'rgba(212, 165, 116, 0.15)'
  ctx.fillRect(80, y - 15, w - 160, 1)
}
</script>

<template>
  <div class="flex gap-2">
    <button
      @click="openSaveModal"
      :disabled="!store.photo"
      class="flex-1 py-2 px-3 rounded-xl bg-gold/15 hover:bg-gold/25 text-gold-light text-xs font-medium flex items-center justify-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors border border-gold/20"
    >
      <Save class="w-3.5 h-3.5" />
      保存方案
    </button>
    <button
      @click="exportCompareImage"
      :disabled="!store.photo || exportLoading"
      class="flex-1 py-2 px-3 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 text-xs font-medium flex items-center justify-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors border border-blue-500/20"
    >
      <ImageDown v-if="!exportLoading" class="w-3.5 h-3.5" />
      <Sparkles v-else class="w-3.5 h-3.5 animate-spin" />
      导出对比
    </button>
    <button
      @click="openPurchaseCard"
      :disabled="!store.photo"
      class="flex-1 py-2 px-3 rounded-xl bg-rose/15 hover:bg-rose/25 text-rose text-xs font-medium flex items-center justify-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors border border-rose/20"
    >
      <CreditCard class="w-3.5 h-3.5" />
      购买参考
    </button>
  </div>

  <Teleport to="body">
    <div
      v-if="saveModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      @click.self="saveModalOpen = false"
    >
      <div class="bg-bg-panel rounded-2xl border border-gold/20 p-6 w-full max-w-md animate-fade-in shadow-2xl">
        <h3 class="text-lg font-display text-gold-light mb-4 flex items-center gap-2">
          <Save class="w-5 h-5" />
          保存试戴方案
        </h3>
        <label class="block text-xs text-ivory-muted mb-1.5">方案名称</label>
        <input
          v-model="schemeName"
          type="text"
          class="w-full px-3 py-2.5 rounded-lg bg-bg-secondary/80 border border-white/10 focus:border-gold/50 focus:outline-none text-ivory text-sm transition-colors"
          placeholder="为这个方案起个名字"
          @keyup.enter="saveScheme"
        />
        <div class="flex gap-2 mt-5">
          <button
            @click="saveModalOpen = false"
            class="flex-1 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-ivory-muted text-sm transition-colors"
          >
            取消
          </button>
          <button
            @click="saveScheme"
            class="flex-1 py-2.5 rounded-lg bg-gold hover:bg-gold-light text-bg font-medium text-sm flex items-center justify-center gap-1.5 transition-colors"
          >
            <CheckCircle2 class="w-4 h-4" />
            确认保存
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <Teleport to="body">
    <div
      v-if="purchaseCardOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      @click.self="closePurchaseCard"
    >
      <div class="bg-bg-panel rounded-2xl border border-gold/20 w-full max-w-md animate-fade-in shadow-2xl overflow-hidden">
        <div class="px-5 py-4 border-b border-gold/10 flex items-center justify-between">
          <h3 class="text-base font-display text-gold-light flex items-center gap-2">
            <CreditCard class="w-5 h-5" />
            购买参考卡预览
          </h3>
          <button
            @click="closePurchaseCard"
            class="p-1.5 rounded-lg hover:bg-white/10 text-ivory-muted transition-colors"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <div class="p-5">
          <div class="rounded-xl overflow-hidden border border-gold/15 mb-4">
            <div class="bg-gradient-to-b from-bg to-bg-secondary/80 py-6 px-4">
              <div class="text-center">
                <p class="text-gold-light font-display text-lg mb-1">Earring Try-On Reference</p>
                <p class="text-ivory-muted text-xs">耳饰试戴购买参考卡</p>
              </div>
            </div>
            <div class="p-4 space-y-2 text-xs">
              <div class="flex justify-between py-1.5 border-b border-white/5">
                <span class="text-ivory-muted/70">左耳款式</span>
                <span class="text-ivory font-medium">{{ getTemplate(store.leftEarring.templateId).name }}</span>
              </div>
              <div class="flex justify-between py-1.5 border-b border-white/5">
                <span class="text-ivory-muted/70">右耳款式</span>
                <span class="text-ivory font-medium">{{ getTemplate(store.rightEarring.templateId).name }}</span>
              </div>
              <div class="flex justify-between py-1.5 border-b border-white/5">
                <span class="text-ivory-muted/70">妆容 / 光线</span>
                <span class="text-gold-light">{{ store.effect.makeupTone }} / {{ store.effect.lightingMode }}</span>
              </div>
              <div class="flex justify-between py-1.5">
                <span class="text-ivory-muted/70">发型遮挡</span>
                <span :class="store.effect.hairstyleOverlay ? 'text-green-400' : 'text-ivory-muted'">
                  {{ store.effect.hairstyleOverlay ? '已开启' : '未开启' }}
                </span>
              </div>
            </div>
          </div>

          <p class="text-[11px] text-ivory-muted/60 text-center mb-4">
            下载后可作为购买时的参考依据
          </p>

          <div class="flex gap-2">
            <button
              @click="closePurchaseCard"
              class="flex-1 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-ivory-muted text-sm transition-colors"
            >
              关闭
            </button>
            <button
              @click="downloadPurchaseCard"
              class="flex-1 py-2.5 rounded-lg bg-rose/80 hover:bg-rose text-bg font-medium text-sm flex items-center justify-center gap-1.5 transition-colors"
            >
              <ImageDown class="w-4 h-4" />
              下载参考卡
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
