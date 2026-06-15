<script setup lang="ts">
import { computed, ref } from 'vue'
import { useEarringStore } from '@/stores/useEarringStore'
import { earringTemplates, categoryLabels } from '@/data/earringTemplates'
import type { EarringTemplate } from '@/types'
import { Sparkles, Gem, CircleDot, Droplet, Wind } from 'lucide-vue-next'

const store = useEarringStore()
const activeCategory = ref<'all' | 'stud' | 'drop' | 'hoop' | 'tassel'>('all')

const categories = [
  { key: 'all', label: '全部', icon: Sparkles },
  { key: 'stud', label: '耳钉', icon: Gem },
  { key: 'drop', label: '耳坠', icon: Droplet },
  { key: 'hoop', label: '圈环', icon: CircleDot },
  { key: 'tassel', label: '流苏', icon: Wind },
] as const

const filteredTemplates = computed(() => {
  if (activeCategory.value === 'all') return earringTemplates
  return earringTemplates.filter((t) => t.category === activeCategory.value)
})

function selectTemplate(template: EarringTemplate) {
  store.selectTemplate(template)
}
</script>

<template>
  <div class="h-full flex flex-col bg-bg-panel rounded-xl border border-gold/10">
    <div class="px-4 py-3 border-b border-gold/10">
      <h3 class="text-sm font-display tracking-wider text-gold-light mb-3">耳饰素材库</h3>
      <div class="grid grid-cols-5 gap-1">
        <button
          v-for="cat in categories"
          :key="cat.key"
          @click="activeCategory = cat.key"
          :class="[
            'flex flex-col items-center gap-1 py-2 px-1 rounded-lg transition-all duration-200',
            activeCategory === cat.key
              ? 'bg-gold/20 text-gold-light ring-1 ring-gold/40'
              : 'text-ivory-muted hover:text-ivory hover:bg-white/5',
          ]"
        >
          <component :is="cat.icon" class="w-4 h-4" />
          <span class="text-[10px]">{{ cat.label }}</span>
        </button>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto p-3">
      <div class="grid grid-cols-2 gap-2">
        <button
          v-for="template in filteredTemplates"
          :key="template.id"
          @click="selectTemplate(template)"
          :class="[
            'group relative p-3 rounded-xl border transition-all duration-300 flex flex-col items-center',
            store.selectedTemplateId === template.id
              ? 'border-gold bg-gold/10 shadow-lg shadow-gold/10'
              : 'border-white/5 bg-bg-secondary/50 hover:border-gold/30 hover:bg-white/5',
          ]"
        >
          <div
            class="w-16 h-16 flex items-center justify-center mb-2 rounded-lg bg-gradient-to-br from-white/5 to-transparent"
            v-html="template.svgContent"
          />
          <span
            :class="[
              'text-xs font-medium transition-colors',
              store.selectedTemplateId === template.id ? 'text-gold-light' : 'text-ivory-muted group-hover:text-ivory',
            ]"
          >
            {{ template.name }}
          </span>
          <span class="text-[10px] text-ivory-muted/60 mt-0.5">
            {{ categoryLabels[template.category] }}
          </span>
          <div
            v-if="store.selectedTemplateId === template.id"
            class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-gold animate-pulse"
          />
        </button>
      </div>
    </div>

    <div class="px-4 py-3 border-t border-gold/10">
      <div class="text-[11px] text-ivory-muted/70 space-y-1">
        <p>💡 选择耳饰后，可在右侧面板微调</p>
        <p>🎯 点击画布标记耳洞位置更精准</p>
      </div>
    </div>
  </div>
</template>
