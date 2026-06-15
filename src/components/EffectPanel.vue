<script setup lang="ts">
import { useEarringStore } from '@/stores/useEarringStore'
import type { MakeupTone, LightingMode } from '@/types'
import {
  Scissors,
  Sparkles,
  Sun,
  Lamp,
  Snowflake,
  Theater,
  Flower2,
  Flame,
  Droplets,
  Coffee,
} from 'lucide-vue-next'

const store = useEarringStore()

interface Option {
  key: MakeupTone | LightingMode | 'toggle'
  label: string
  icon: any
}

const makeupOptions: { key: MakeupTone; label: string; icon: any }[] = [
  { key: 'natural', label: '自然', icon: Sparkles },
  { key: 'warm', label: '暖调', icon: Flame },
  { key: 'cool', label: '冷调', icon: Droplets },
  { key: 'vintage', label: '复古', icon: Coffee },
]

const lightingOptions: { key: LightingMode; label: string; icon: any }[] = [
  { key: 'natural', label: '自然光', icon: Sun },
  { key: 'warm', label: '暖光', icon: Lamp },
  { key: 'cool', label: '冷光', icon: Snowflake },
  { key: 'stage', label: '舞台', icon: Theater },
]
</script>

<template>
  <div class="bg-bg-panel rounded-xl border border-gold/10 p-4">
    <h3 class="text-sm font-display tracking-wider text-gold-light mb-4">整体效果</h3>

    <div class="space-y-5">
      <div>
        <div class="flex items-center gap-2 mb-3">
          <div class="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center">
            <Scissors class="w-4 h-4 text-gold-light" />
          </div>
          <div>
            <div class="text-xs font-medium text-ivory">发型遮挡</div>
            <div class="text-[10px] text-ivory-muted/70">模拟两侧头发遮挡效果</div>
          </div>
          <label class="ml-auto relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              :checked="store.effect.hairstyleOverlay"
              @change="store.updateEffect({ hairstyleOverlay: ($event.target as HTMLInputElement).checked })"
              class="sr-only peer"
            />
            <div class="w-9 h-5 bg-white/10 rounded-full peer peer-checked:bg-gold/60 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full after:shadow-md"></div>
          </label>
        </div>
      </div>

      <div>
        <div class="flex items-center gap-2 mb-3">
          <div class="w-8 h-8 rounded-lg bg-rose/15 flex items-center justify-center">
            <Flower2 class="w-4 h-4 text-rose" />
          </div>
          <div>
            <div class="text-xs font-medium text-ivory">妆容色调</div>
            <div class="text-[10px] text-ivory-muted/70">匹配不同风格妆面</div>
          </div>
        </div>
        <div class="grid grid-cols-4 gap-1.5">
          <button
            v-for="opt in makeupOptions"
            :key="opt.key"
            @click="store.updateEffect({ makeupTone: opt.key })"
            :class="[
              'flex flex-col items-center gap-1 py-2 px-1 rounded-lg transition-all duration-200',
              store.effect.makeupTone === opt.key
                ? 'bg-rose/20 text-rose ring-1 ring-rose/40'
                : 'text-ivory-muted hover:text-ivory hover:bg-white/5',
            ]"
          >
            <component :is="opt.icon" class="w-3.5 h-3.5" />
            <span class="text-[10px]">{{ opt.label }}</span>
          </button>
        </div>
      </div>

      <div>
        <div class="flex items-center gap-2 mb-3">
          <div class="w-8 h-8 rounded-lg bg-amber-400/10 flex items-center justify-center">
            <Sun class="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <div class="text-xs font-medium text-ivory">光线模式</div>
            <div class="text-[10px] text-ivory-muted/70">模拟不同场景下的光照</div>
          </div>
        </div>
        <div class="grid grid-cols-4 gap-1.5">
          <button
            v-for="opt in lightingOptions"
            :key="opt.key"
            @click="store.updateEffect({ lightingMode: opt.key })"
            :class="[
              'flex flex-col items-center gap-1 py-2 px-1 rounded-lg transition-all duration-200',
              store.effect.lightingMode === opt.key
                ? 'bg-amber-400/20 text-amber-200 ring-1 ring-amber-400/40'
                : 'text-ivory-muted hover:text-ivory hover:bg-white/5',
            ]"
          >
            <component :is="opt.icon" class="w-3.5 h-3.5" />
            <span class="text-[10px]">{{ opt.label }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
