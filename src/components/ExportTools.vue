<script setup lang="ts">
import { ref } from 'vue'
import { useEarringStore } from '@/stores/useEarringStore'
import { earringTemplates, categoryLabels } from '@/data/earringTemplates'
import type { ComparisonSlot, Scheme } from '@/types'
import {
  Save,
  ImageDown,
  CreditCard,
  CheckCircle2,
  Sparkles,
  X,
  LayoutGrid,
  Star,
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
const compareExportOpen = ref(false)
const decisionCardOpen = ref(false)

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

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
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

    const origImg = await loadImage(store.photo!)

    const photoW = store.photoWidth
    const photoH = store.photoHeight
    const scale = store.canvasScale
    const offsetX = store.canvasOffset.x
    const offsetY = store.canvasOffset.y

    const imgDisplayW = photoW * scale
    const imgDisplayH = photoH * scale
    const imgLeft = (canvas.width - imgDisplayW) / 2 + offsetX
    const imgTop = (canvas.height - imgDisplayH) / 2 + offsetY

    const beforeX = padding
    const beforeY = padding + labelH
    ctx.fillStyle = '#0f1624'
    ctx.fillRect(beforeX, beforeY, canvas.width, canvas.height)
    ctx.drawImage(origImg, 0, 0, origImg.width, origImg.height, beforeX + imgLeft, beforeY + imgTop, imgDisplayW, imgDisplayH)

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
    ctx.fillRect(beforeX, beforeY + canvas.height - 40, canvas.width, 40)
    ctx.font = 'bold 14px Noto Sans SC, sans-serif'
    ctx.fillStyle = '#f5f0e8'
    ctx.textAlign = 'center'
    ctx.fillText('📷 原始照片', beforeX + canvas.width / 2, beforeY + canvas.height - 15)

    const afterX = padding * 2 + canvas.width
    const afterY = padding + labelH
    ctx.fillStyle = '#0f1624'
    ctx.fillRect(afterX, afterY, canvas.width, canvas.height)
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

async function exportCompareLongImage() {
  if (!store.photo) {
    alert('请先上传照片')
    return
  }

  const slots = store.workspace.slots
  if (slots.length === 0) {
    alert('没有对比方案')
    return
  }

  exportLoading.value = true
  compareExportOpen.value = false

  try {
    const padding = 30
    const titleH = 80
    const slotW = 400
    const slotH = 530
    const infoH = 140
    const cols = Math.min(slots.length, 2)
    const rows = Math.ceil(slots.length / cols)

    const outW = cols * (slotW + padding) + padding
    const outH = titleH + rows * (slotH + infoH + padding) + padding + 50

    const out = document.createElement('canvas')
    out.width = outW
    out.height = outH
    const ctx = out.getContext('2d')!

    const grd = ctx.createLinearGradient(0, 0, outW, outH)
    grd.addColorStop(0, '#1a1a2e')
    grd.addColorStop(1, '#16213e')
    ctx.fillStyle = grd
    ctx.fillRect(0, 0, outW, outH)

    ctx.strokeStyle = 'rgba(212, 165, 116, 0.15)'
    ctx.lineWidth = 1
    ctx.strokeRect(10, 10, outW - 20, outH - 20)

    ctx.font = 'bold 22px Playfair Display, Georgia, serif'
    ctx.fillStyle = '#e8c9a0'
    ctx.textAlign = 'left'
    ctx.fillText('✨ 多方案对比长图', padding, padding + 20)

    ctx.font = '11px Noto Sans SC, sans-serif'
    ctx.fillStyle = 'rgba(245, 240, 232, 0.5)'
    ctx.fillText(`共 ${slots.length} 个方案 | ${new Date().toLocaleString('zh-CN')}`, padding, padding + 45)

    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i]
      const col = i % cols
      const row = Math.floor(i / cols)
      const x = padding + col * (slotW + padding)
      const y = titleH + row * (slotH + infoH + padding)

      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
      ctx.fillRect(x, y, slotW, slotH)
      ctx.strokeStyle = 'rgba(212, 165, 116, 0.2)'
      ctx.lineWidth = 1
      ctx.strokeRect(x, y, slotW, slotH)

      if (slot.thumbnail) {
        try {
          const thumbImg = await loadImage(slot.thumbnail)
          const scale = Math.min(slotW / thumbImg.width, slotH / thumbImg.height)
          const dw = thumbImg.width * scale
          const dh = thumbImg.height * scale
          const dx = x + (slotW - dw) / 2
          const dy = y + (slotH - dh) / 2
          ctx.drawImage(thumbImg, dx, dy, dw, dh)
        } catch {
          ctx.fillStyle = 'rgba(245, 240, 232, 0.3)'
          ctx.font = '12px Noto Sans SC, sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText('缩略图不可用', x + slotW / 2, y + slotH / 2)
        }
      }

      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
      ctx.fillRect(x, y + slotH - 30, slotW, 30)
      ctx.font = 'bold 12px Noto Sans SC, sans-serif'
      ctx.fillStyle = slot.recommended ? '#fbbf24' : '#e8c9a0'
      ctx.textAlign = 'center'
      const label = slot.recommended ? `⭐ ${slot.name}` : slot.name
      ctx.fillText(label, x + slotW / 2, y + slotH - 10)

      const infoY = y + slotH + 8
      const leftT = getTemplate(slot.leftEarring.templateId)
      const rightT = getTemplate(slot.rightEarring.templateId)

      ctx.font = '11px Noto Sans SC, sans-serif'
      ctx.textAlign = 'left'

      ctx.fillStyle = '#60a5fa'
      ctx.fillText(`左耳: ${leftT.name}`, x + 8, infoY + 12)
      ctx.fillStyle = '#f472b6'
      ctx.fillText(`右耳: ${rightT.name}`, x + 8, infoY + 28)

      ctx.fillStyle = 'rgba(245, 240, 232, 0.6)'
      ctx.font = '10px Noto Sans SC, sans-serif'
      ctx.fillText(`尺寸: ${(slot.leftEarring.scale * 100).toFixed(0)}% | 长度: ${slot.leftEarring.lengthScale.toFixed(2)} | 旋转: ${slot.leftEarring.rotation.toFixed(1)}°`, x + 8, infoY + 46)
      ctx.fillText(`妆容: ${slot.effect.makeupTone} | 光线: ${slot.effect.lightingMode}${slot.effect.hairstyleOverlay ? ' | 发型遮挡' : ''}`, x + 8, infoY + 62)

      if (slot.budget || slot.materialPreference || slot.sceneNotes) {
        ctx.fillStyle = 'rgba(212, 165, 116, 0.7)'
        let noteText = ''
        if (slot.budget) noteText += `预算:${slot.budget} `
        if (slot.materialPreference) noteText += `材质:${slot.materialPreference} `
        if (slot.sceneNotes) noteText += `场景:${slot.sceneNotes}`
        ctx.fillText(noteText.trim(), x + 8, infoY + 80)
      }

      if (slot.recommended) {
        ctx.fillStyle = 'rgba(251, 191, 36, 0.15)'
        ctx.fillRect(x, y, slotW, slotH)
      }
    }

    ctx.font = '10px Noto Sans SC, sans-serif'
    ctx.fillStyle = 'rgba(245, 240, 232, 0.35)'
    ctx.textAlign = 'center'
    ctx.fillText('多方案精修对比与购买决策工作台 | 仅供参考，以实物为准', outW / 2, outH - 20)

    const link = document.createElement('a')
    link.download = `多方案对比-${Date.now()}.png`
    link.href = out.toDataURL('image/png')
    link.click()
  } finally {
    exportLoading.value = false
  }
}

async function exportDecisionCard() {
  if (!store.photo) {
    alert('请先上传照片')
    return
  }

  const recommendedSlots = store.workspace.slots.filter((s) => s.recommended)
  const slots = recommendedSlots.length > 0 ? recommendedSlots : store.workspace.slots

  if (slots.length === 0) {
    alert('没有方案可供导出')
    return
  }

  exportLoading.value = true
  decisionCardOpen.value = false

  try {
    const w = 900
    const padding = 40
    const thumbW = 260
    const thumbH = 340
    const cardH = thumbH + 200
    const cols = Math.min(slots.length, 3)
    const rows = Math.ceil(slots.length / cols)
    const headerH = 120
    const footerH = 60

    const h = headerH + rows * (cardH + padding) + footerH + padding * 2

    const canvas = document.createElement('canvas')
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

    ctx.font = 'bold 28px Playfair Display, Georgia, serif'
    ctx.fillStyle = '#e8c9a0'
    ctx.textAlign = 'center'
    ctx.fillText('💎 Purchase Decision Card', w / 2, padding + 30)

    ctx.font = '13px Noto Sans SC, sans-serif'
    ctx.fillStyle = 'rgba(245, 240, 232, 0.6)'
    ctx.fillText('购买决策卡 — 多方案精修对比', w / 2, padding + 58)

    ctx.font = '11px Noto Sans SC, sans-serif'
    ctx.fillStyle = 'rgba(245, 240, 232, 0.4)'
    ctx.fillText(`${new Date().toLocaleString('zh-CN')} | 推荐方案: ${recommendedSlots.length}/${store.workspace.slots.length}`, w / 2, padding + 80)

    ctx.strokeStyle = 'rgba(212, 165, 116, 0.1)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(padding, headerH)
    ctx.lineTo(w - padding, headerH)
    ctx.stroke()

    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i]
      const col = i % cols
      const row = Math.floor(i / cols)
      const slotWidth = (w - padding * 2 - (cols - 1) * 16) / cols
      const x = padding + col * (slotWidth + 16)
      const y = headerH + padding + row * (cardH + padding)

      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)'
      ctx.fillRect(x, y, slotWidth, cardH)
      ctx.strokeStyle = slot.recommended ? 'rgba(251, 191, 36, 0.4)' : 'rgba(212, 165, 116, 0.15)'
      ctx.lineWidth = 1
      ctx.strokeRect(x, y, slotWidth, cardH)

      if (slot.recommended) {
        ctx.fillStyle = 'rgba(251, 191, 36, 0.06)'
        ctx.fillRect(x, y, slotWidth, cardH)
      }

      const thumbScale = Math.min((slotWidth - 20) / thumbW, thumbH / thumbH)
      const dw = thumbW * thumbScale
      const dh = thumbH * thumbScale
      const dx = x + (slotWidth - dw) / 2
      const dy = y + 10

      if (slot.thumbnail) {
        try {
          const thumbImg = await loadImage(slot.thumbnail)
          ctx.fillStyle = '#0f1624'
          ctx.fillRect(dx, dy, dw, dh)
          ctx.drawImage(thumbImg, dx, dy, dw, dh)
        } catch {
          ctx.fillStyle = '#0f1624'
          ctx.fillRect(dx, dy, dw, dh)
        }
      } else {
        ctx.fillStyle = '#0f1624'
        ctx.fillRect(dx, dy, dw, dh)
      }

      const infoY = dy + dh + 14
      const leftT = getTemplate(slot.leftEarring.templateId)
      const rightT = getTemplate(slot.rightEarring.templateId)

      ctx.font = 'bold 13px Noto Sans SC, sans-serif'
      ctx.fillStyle = slot.recommended ? '#fbbf24' : '#e8c9a0'
      ctx.textAlign = 'center'
      ctx.fillText(slot.recommended ? `⭐ ${slot.name}` : slot.name, x + slotWidth / 2, infoY)

      ctx.font = '10px Noto Sans SC, sans-serif'
      ctx.textAlign = 'left'
      ctx.fillStyle = '#60a5fa'
      ctx.fillText(`左: ${leftT.name} (${categoryLabels[leftT.category]})`, x + 10, infoY + 20)
      ctx.fillStyle = '#f472b6'
      ctx.fillText(`右: ${rightT.name} (${categoryLabels[rightT.category]})`, x + 10, infoY + 36)

      ctx.fillStyle = 'rgba(245, 240, 232, 0.6)'
      ctx.font = '9px Noto Sans SC, sans-serif'
      ctx.fillText(`尺:${(slot.leftEarring.scale * 100).toFixed(0)}% 长:${slot.leftEarring.lengthScale.toFixed(2)} 角:${slot.leftEarring.rotation.toFixed(1)}°`, x + 10, infoY + 52)
      ctx.fillText(`妆:${slot.effect.makeupTone} 光:${slot.effect.lightingMode}${slot.effect.hairstyleOverlay ? ' 发型' : ''}`, x + 10, infoY + 66)

      if (slot.budget || slot.materialPreference || slot.sceneNotes) {
        ctx.fillStyle = 'rgba(212, 165, 116, 0.7)'
        ctx.font = '9px Noto Sans SC, sans-serif'
        let noteLine = ''
        if (slot.budget) noteLine += `💰${slot.budget} `
        if (slot.materialPreference) noteLine += `🔩${slot.materialPreference} `
        if (slot.sceneNotes) noteLine += `📍${slot.sceneNotes}`
        ctx.fillText(noteLine.trim(), x + 10, infoY + 82)
      }
    }

    ctx.font = '10px Noto Sans SC, sans-serif'
    ctx.fillStyle = 'rgba(245, 240, 232, 0.35)'
    ctx.textAlign = 'center'
    ctx.fillText('多方案精修对比与购买决策工作台 | 仅供参考，以实物为准', w / 2, h - footerH + 20)

    const link = document.createElement('a')
    link.download = `购买决策卡-${Date.now()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  } finally {
    exportLoading.value = false
  }
}
</script>

<template>
  <div class="flex gap-2 flex-wrap">
    <button
      @click="openSaveModal"
      :disabled="!store.photo"
      class="py-2 px-3 rounded-xl bg-gold/15 hover:bg-gold/25 text-gold-light text-xs font-medium flex items-center justify-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors border border-gold/20"
    >
      <Save class="w-3.5 h-3.5" />
      保存方案
    </button>
    <button
      @click="exportCompareImage"
      :disabled="!store.photo || exportLoading"
      class="py-2 px-3 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 text-xs font-medium flex items-center justify-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors border border-blue-500/20"
    >
      <ImageDown v-if="!exportLoading" class="w-3.5 h-3.5" />
      <Sparkles v-else class="w-3.5 h-3.5 animate-spin" />
      导出对比
    </button>
    <button
      @click="openPurchaseCard"
      :disabled="!store.photo"
      class="py-2 px-3 rounded-xl bg-rose/15 hover:bg-rose/25 text-rose text-xs font-medium flex items-center justify-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors border border-rose/20"
    >
      <CreditCard class="w-3.5 h-3.5" />
      购买参考
    </button>
    <button
      @click="compareExportOpen = true"
      :disabled="!store.photo || exportLoading"
      class="py-2 px-3 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 text-xs font-medium flex items-center justify-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors border border-purple-500/20"
    >
      <LayoutGrid class="w-3.5 h-3.5" />
      对比长图
    </button>
    <button
      @click="decisionCardOpen = true"
      :disabled="!store.photo || exportLoading"
      class="py-2 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-medium flex items-center justify-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors border border-amber-500/20"
    >
      <Star class="w-3.5 h-3.5" />
      决策卡
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

  <Teleport to="body">
    <div
      v-if="compareExportOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      @click.self="compareExportOpen = false"
    >
      <div class="bg-bg-panel rounded-2xl border border-purple-500/20 w-full max-w-lg animate-fade-in shadow-2xl overflow-hidden">
        <div class="px-5 py-4 border-b border-gold/10 flex items-center justify-between">
          <h3 class="text-base font-display text-purple-300 flex items-center gap-2">
            <LayoutGrid class="w-5 h-5" />
            导出对比长图
          </h3>
          <button
            @click="compareExportOpen = false"
            class="p-1.5 rounded-lg hover:bg-white/10 text-ivory-muted transition-colors"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
        <div class="p-5">
          <p class="text-xs text-ivory-muted/70 mb-3">
            将当前 {{ store.workspace.slots.length }} 个对比方案导出为长图，包含每个方案的缩略图、耳饰参数、妆容光线及备注信息。
          </p>
          <div class="space-y-2 mb-4">
            <div
              v-for="(slot, idx) in store.workspace.slots"
              :key="slot.id"
              class="flex items-center gap-2 text-xs p-2 rounded-lg bg-white/5"
            >
              <span class="text-ivory-muted/60">#{{ idx + 1 }}</span>
              <span class="text-ivory">{{ slot.name }}</span>
              <span class="text-blue-300/80">L:{{ getTemplate(slot.leftEarring.templateId).name }}</span>
              <span class="text-pink-300/80">R:{{ getTemplate(slot.rightEarring.templateId).name }}</span>
              <Star v-if="slot.recommended" class="w-3 h-3 text-amber-300 fill-amber-300 ml-auto" />
            </div>
          </div>
          <div class="flex gap-2">
            <button
              @click="compareExportOpen = false"
              class="flex-1 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-ivory-muted text-sm transition-colors"
            >
              取消
            </button>
            <button
              @click="exportCompareLongImage"
              :disabled="exportLoading"
              class="flex-1 py-2.5 rounded-lg bg-purple-500/80 hover:bg-purple-500 text-white font-medium text-sm flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <ImageDown v-if="!exportLoading" class="w-4 h-4" />
              <Sparkles v-else class="w-4 h-4 animate-spin" />
              导出长图
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>

  <Teleport to="body">
    <div
      v-if="decisionCardOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      @click.self="decisionCardOpen = false"
    >
      <div class="bg-bg-panel rounded-2xl border border-amber-500/20 w-full max-w-lg animate-fade-in shadow-2xl overflow-hidden">
        <div class="px-5 py-4 border-b border-gold/10 flex items-center justify-between">
          <h3 class="text-base font-display text-amber-300 flex items-center gap-2">
            <Star class="w-5 h-5" />
            导出购买决策卡
          </h3>
          <button
            @click="decisionCardOpen = false"
            class="p-1.5 rounded-lg hover:bg-white/10 text-ivory-muted transition-colors"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
        <div class="p-5">
          <p class="text-xs text-ivory-muted/70 mb-3">
            导出包含所有方案（优先推荐方案）的购买决策卡，含缩略图、款式参数、妆容光线、推荐标记与备注。
          </p>
          <div class="space-y-2 mb-4">
            <div
              v-for="(slot, idx) in store.workspace.slots"
              :key="slot.id"
              class="flex items-center gap-2 text-xs p-2 rounded-lg bg-white/5"
              :class="{ 'bg-amber-500/5 border border-amber-500/15': slot.recommended }"
            >
              <span class="text-ivory-muted/60">#{{ idx + 1 }}</span>
              <span :class="slot.recommended ? 'text-amber-300' : 'text-ivory'">{{ slot.name }}</span>
              <Star v-if="slot.recommended" class="w-3 h-3 text-amber-300 fill-amber-300" />
              <span v-if="slot.budget" class="text-green-300/80 text-[10px]">💰{{ slot.budget }}</span>
              <span v-if="slot.sceneNotes" class="text-orange-300/80 text-[10px]">📍{{ slot.sceneNotes }}</span>
            </div>
          </div>
          <div class="flex gap-2">
            <button
              @click="decisionCardOpen = false"
              class="flex-1 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-ivory-muted text-sm transition-colors"
            >
              取消
            </button>
            <button
              @click="exportDecisionCard"
              :disabled="exportLoading"
              class="flex-1 py-2.5 rounded-lg bg-amber-500/80 hover:bg-amber-500 text-bg font-medium text-sm flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <ImageDown v-if="!exportLoading" class="w-4 h-4" />
              <Sparkles v-else class="w-4 h-4 animate-spin" />
              导出决策卡
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
