<script setup lang="ts">
import { ref } from 'vue'
import PortraitCanvas from '@/components/PortraitCanvas.vue'
import EarringGallery from '@/components/EarringGallery.vue'
import CalibrationPanel from '@/components/CalibrationPanel.vue'
import EffectPanel from '@/components/EffectPanel.vue'
import HistoryPanel from '@/components/HistoryPanel.vue'
import ExportTools from '@/components/ExportTools.vue'
import CompareWorkbench from '@/components/CompareWorkbench.vue'
import { Gem, Sparkles } from 'lucide-vue-next'

const canvasRef = ref<InstanceType<typeof PortraitCanvas> | null>(null)
const mainCanvas = ref<HTMLCanvasElement | null>(null)
const showCompare = ref(false)

function onCanvasReady(canvas: HTMLCanvasElement) {
  mainCanvas.value = canvas
}

function getCanvas(): HTMLCanvasElement | null {
  return canvasRef.value?.getCanvas() || mainCanvas.value
}
</script>

<template>
  <div class="h-screen w-screen bg-gradient-to-br from-bg via-bg-secondary/80 to-bg overflow-hidden">
    <header class="h-14 border-b border-gold/10 px-6 flex items-center justify-between bg-bg/80 backdrop-blur-md flex-shrink-0">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-gold to-rose flex items-center justify-center shadow-lg shadow-gold/20">
          <Gem class="w-5 h-5 text-bg" />
        </div>
        <div>
          <h1 class="text-base font-display tracking-wider text-gold-light leading-tight">
            Earring Try-On Studio
          </h1>
          <p class="text-[10px] text-ivory-muted/60 tracking-wide">耳饰试戴 · 多方案对比 · 购买决策</p>
        </div>
      </div>

      <div class="flex items-center gap-4">
        <button
          @click="showCompare = !showCompare"
          :class="[
            'px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5',
            showCompare
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
              : 'bg-white/5 text-ivory-muted hover:text-ivory hover:bg-white/10 border border-white/10',
          ]"
        >
          <Sparkles class="w-3.5 h-3.5" />
          {{ showCompare ? '关闭对比' : '方案对比' }}
        </button>
        <div class="hidden md:flex items-center gap-1 text-[11px] text-ivory-muted/70">
          <Sparkles class="w-3.5 h-3.5 text-gold/70" />
          <span>Vue 3 · TypeScript · Canvas 渲染</span>
        </div>
        <div class="text-[10px] px-2 py-1 rounded-md bg-gold/10 text-gold-light border border-gold/20 font-mono">
          PORT: 9320
        </div>
      </div>
    </header>

    <div class="h-[calc(100vh-3.5rem)] flex gap-3 p-3 overflow-hidden">
      <aside class="w-64 flex-shrink-0 flex flex-col gap-3 overflow-hidden">
        <div class="flex-1 min-h-0">
          <EarringGallery />
        </div>
        <div class="flex-shrink-0">
          <EffectPanel />
        </div>
      </aside>

      <main class="flex-1 flex flex-col min-w-0 gap-3 overflow-hidden">
        <div :class="showCompare ? 'flex-[3] min-h-0' : 'flex-1 min-h-0'">
          <PortraitCanvas ref="canvasRef" @canvas-ready="onCanvasReady" />
        </div>
        <div v-if="showCompare" class="flex-[2] min-h-0 overflow-y-auto">
          <CompareWorkbench />
        </div>
        <div class="flex-shrink-0">
          <ExportTools :get-canvas="getCanvas" />
        </div>
      </main>

      <aside class="w-72 flex-shrink-0 flex flex-col gap-3 overflow-hidden">
        <div class="flex-[1.3] min-h-0">
          <CalibrationPanel />
        </div>
        <div class="flex-1 min-h-0">
          <HistoryPanel />
        </div>
      </aside>
    </div>
  </div>
</template>
