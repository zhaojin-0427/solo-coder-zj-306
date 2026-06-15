<script setup lang="ts">
import { useEarringStore } from '@/stores/useEarringStore'
import { earringTemplates } from '@/data/earringTemplates'
import {
  ArrowLeftRight,
  RefreshCw,
  Copy,
  Eye,
  EyeOff,
} from 'lucide-vue-next'
import EarringSlider from './EarringSlider.vue'

const store = useEarringStore()

function getTemplate(id: string) {
  return earringTemplates.find((t) => t.id === id) || earringTemplates[0]
}

function syncLeftToRight() {
  const left = store.leftEarring
  store.updateEarring('right', {
    offsetX: -left.offsetX,
    offsetY: left.offsetY,
    scale: left.scale,
    rotation: -left.rotation,
  })
}

function syncRightToLeft() {
  const right = store.rightEarring
  store.updateEarring('left', {
    offsetX: -right.offsetX,
    offsetY: right.offsetY,
    scale: right.scale,
    rotation: -right.rotation,
  })
}
</script>

<template>
  <div class="h-full flex flex-col bg-bg-panel rounded-xl border border-gold/10">
    <div class="px-4 py-3 border-b border-gold/10 flex items-center justify-between">
      <h3 class="text-sm font-display tracking-wider text-gold-light">左右校准面板</h3>
      <button
        @click="store.showAnchors = !store.showAnchors"
        :class="[
          'p-1.5 rounded-lg transition-colors',
          store.showAnchors ? 'bg-gold/20 text-gold-light' : 'bg-white/5 text-ivory-muted hover:text-ivory',
        ]"
        :title="store.showAnchors ? '隐藏锚点' : '显示锚点'"
      >
        <Eye v-if="store.showAnchors" class="w-4 h-4" />
        <EyeOff v-else class="w-4 h-4" />
      </button>
    </div>

    <div class="flex-1 overflow-y-auto p-4 space-y-5">
      <div
        class="p-3 rounded-xl border border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent"
        :class="{ 'opacity-50': !store.photo }"
      >
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <div class="w-2 h-2 rounded-full bg-blue-400" />
            <span class="text-sm font-medium text-blue-200">左耳</span>
          </div>
          <span class="text-[11px] text-ivory-muted">
            {{ getTemplate(store.leftEarring.templateId).name }}
          </span>
        </div>

        <div class="space-y-3">
          <EarringSlider
            side="left"
            label="高度 (上下)"
            key="offsetY"
            :min="-60"
            :max="60"
            :step="1"
          />
          <EarringSlider
            side="left"
            label="长度 (左右)"
            key="offsetX"
            :min="-60"
            :max="60"
            :step="1"
          />
          <EarringSlider
            side="left"
            label="尺寸缩放"
            key="scale"
            :min="0.3"
            :max="3"
            :step="0.05"
          />
          <EarringSlider
            side="left"
            label="角度旋转"
            key="rotation"
            :min="-45"
            :max="45"
            :step="0.5"
          />
        </div>

        <div class="flex gap-2 mt-3">
          <button
            @click="store.resetEarring('left')"
            :disabled="!store.photo"
            class="flex-1 py-1.5 text-[11px] rounded-lg bg-white/5 hover:bg-white/10 text-ivory-muted hover:text-ivory disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1"
          >
            <RefreshCw class="w-3 h-3" />
            重置
          </button>
          <button
            @click="syncLeftToRight"
            :disabled="!store.photo"
            class="flex-1 py-1.5 text-[11px] rounded-lg bg-white/5 hover:bg-white/10 text-ivory-muted hover:text-ivory disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1"
          >
            <Copy class="w-3 h-3" />
            镜像到右
          </button>
        </div>
      </div>

      <div class="flex justify-center">
        <button
          @click="() => { syncLeftToRight(); syncRightToLeft() }"
          :disabled="!store.photo"
          class="p-2 rounded-full bg-gold/10 hover:bg-gold/20 text-gold-light disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="对称对齐"
        >
          <ArrowLeftRight class="w-4 h-4" />
        </button>
      </div>

      <div
        class="p-3 rounded-xl border border-pink-500/20 bg-gradient-to-br from-pink-500/5 to-transparent"
        :class="{ 'opacity-50': !store.photo }"
      >
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <div class="w-2 h-2 rounded-full bg-pink-400" />
            <span class="text-sm font-medium text-pink-200">右耳</span>
          </div>
          <span class="text-[11px] text-ivory-muted">
            {{ getTemplate(store.rightEarring.templateId).name }}
          </span>
        </div>

        <div class="space-y-3">
          <EarringSlider
            side="right"
            label="高度 (上下)"
            key="offsetY"
            :min="-60"
            :max="60"
            :step="1"
          />
          <EarringSlider
            side="right"
            label="长度 (左右)"
            key="offsetX"
            :min="-60"
            :max="60"
            :step="1"
          />
          <EarringSlider
            side="right"
            label="尺寸缩放"
            key="scale"
            :min="0.3"
            :max="3"
            :step="0.05"
          />
          <EarringSlider
            side="right"
            label="角度旋转"
            key="rotation"
            :min="-45"
            :max="45"
            :step="0.5"
          />
        </div>

        <div class="flex gap-2 mt-3">
          <button
            @click="store.resetEarring('right')"
            :disabled="!store.photo"
            class="flex-1 py-1.5 text-[11px] rounded-lg bg-white/5 hover:bg-white/10 text-ivory-muted hover:text-ivory disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1"
          >
            <RefreshCw class="w-3 h-3" />
            重置
          </button>
          <button
            @click="syncRightToLeft"
            :disabled="!store.photo"
            class="flex-1 py-1.5 text-[11px] rounded-lg bg-white/5 hover:bg-white/10 text-ivory-muted hover:text-ivory disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1"
          >
            <Copy class="w-3 h-3" />
            镜像到左
          </button>
        </div>
      </div>

      <div
        v-if="store.photo"
        class="p-3 rounded-xl bg-bg-secondary/50 border border-gold/10"
      >
        <div class="text-[11px] text-gold/80 font-medium mb-2">💡 适配脸部不对称技巧</div>
        <ul class="text-[10px] text-ivory-muted/70 space-y-1 leading-relaxed">
          <li>• 高低耳：调节双耳「高度」滑块</li>
          <li>• 前后位：调节「长度」滑块远离/靠近脸部</li>
          <li>• 耳型差异：单独调节「尺寸缩放」</li>
          <li>• 倾斜脸：微调「角度旋转」保持视觉平衡</li>
        </ul>
      </div>
    </div>
  </div>
</template>
