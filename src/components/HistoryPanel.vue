<script setup lang="ts">
import { useEarringStore } from '@/stores/useEarringStore'
import { History, Trash2, Download, Clock, FolderOpen } from 'lucide-vue-next'
import type { Scheme } from '@/types'

const store = useEarringStore()

function formatDate(ts: number) {
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function confirmDelete(id: string, e: Event) {
  e.stopPropagation()
  if (confirm('确定删除此方案？')) {
    store.deleteScheme(id)
  }
}

defineExpose({
  store,
})
</script>

<template>
  <div class="h-full flex flex-col bg-bg-panel rounded-xl border border-gold/10">
    <div class="px-4 py-3 border-b border-gold/10 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <History class="w-4 h-4 text-gold-light" />
        <h3 class="text-sm font-display tracking-wider text-gold-light">历史方案</h3>
        <span class="text-[10px] px-1.5 py-0.5 rounded bg-gold/15 text-gold-light">
          {{ store.schemes.length }}
        </span>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto p-3">
      <div v-if="store.schemes.length === 0" class="h-full flex flex-col items-center justify-center text-center py-8">
        <div class="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mb-3">
          <FolderOpen class="w-6 h-6 text-ivory-muted/40" />
        </div>
        <p class="text-xs text-ivory-muted/60 mb-1">暂无保存的方案</p>
        <p class="text-[10px] text-ivory-muted/40">调整满意后点击「保存方案」</p>
      </div>

      <div v-else class="space-y-2.5">
        <div
          v-for="scheme in store.schemes"
          :key="scheme.id"
          @click="store.loadScheme(scheme)"
          class="group relative p-2.5 rounded-xl border border-white/5 bg-bg-secondary/50 hover:border-gold/30 hover:bg-white/5 cursor-pointer transition-all duration-200 animate-fade-in"
        >
          <div class="flex gap-3">
            <div class="relative w-16 h-20 rounded-lg overflow-hidden bg-black/30 flex-shrink-0 border border-white/5">
              <img
                :src="scheme.thumbnail"
                :alt="scheme.name"
                class="w-full h-full object-cover"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-1">
                <span class="text-[9px] text-white font-medium">点击加载</span>
              </div>
            </div>

            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <h4 class="text-xs font-medium text-ivory truncate group-hover:text-gold-light transition-colors">
                    {{ scheme.name }}
                  </h4>
                  <div class="flex items-center gap-1 mt-0.5 text-[10px] text-ivory-muted/60">
                    <Clock class="w-2.5 h-2.5" />
                    {{ formatDate(scheme.createdAt) }}
                  </div>
                </div>
                <button
                  @click="confirmDelete(scheme.id, $event)"
                  class="p-1 rounded opacity-0 group-hover:opacity-100 text-ivory-muted/60 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  title="删除方案"
                >
                  <Trash2 class="w-3 h-3" />
                </button>
              </div>

              <div class="flex items-center gap-1.5 mt-2 flex-wrap">
                <span class="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300/80">
                  L: {{ scheme.leftEarring.templateId.split('-')[0] }}
                </span>
                <span class="text-[9px] px-1.5 py-0.5 rounded bg-pink-500/15 text-pink-300/80">
                  R: {{ scheme.rightEarring.templateId.split('-')[0] }}
                </span>
                <span
                  v-if="scheme.effect.hairstyleOverlay"
                  class="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300/80"
                >
                  发型
                </span>
                <span class="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300/80">
                  {{ scheme.effect.lightingMode }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="px-4 py-2.5 border-t border-gold/10">
      <p class="text-[10px] text-ivory-muted/50 text-center">
        💾 数据保存在本地浏览器
      </p>
    </div>
  </div>
</template>
