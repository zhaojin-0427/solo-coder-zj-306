<script setup lang="ts">
import { ref, computed } from 'vue'
import { useEarringStore } from '@/stores/useEarringStore'
import { earringTemplates, categoryLabels } from '@/data/earringTemplates'
import {
  History,
  Trash2,
  Clock,
  FolderOpen,
  Search,
  Filter,
  CheckSquare,
  Square,
  Pencil,
  Star,
  X,
  Palette,
  ShieldAlert,
} from 'lucide-vue-next'
import type { Scheme } from '@/types'

const emit = defineEmits<{
  (e: 'enter-inspiration'): void
  (e: 'open-maintenance'): void
}>()

const store = useEarringStore()

function handleGenerateMaintenance(schemeId: string, e: Event) {
  e.stopPropagation()
  const materialInfo = store.createMaterialFromScheme(schemeId)
  if (materialInfo) {
    store.generatePlansForMaterial(materialInfo.id, 30)
    emit('open-maintenance')
  }
}

function handleEnterInspirationFromScheme(scheme: Scheme, e: Event) {
  e.stopPropagation()
  store.loadScheme(scheme)
  emit('enter-inspiration')
}

const searchQuery = ref('')
const filterCategory = ref<'all' | 'stud' | 'drop' | 'hoop' | 'tassel' | 'recommended'>('all')
const batchMode = ref(false)
const selectedIds = ref<Set<string>>(new Set())
const editingId = ref<string | null>(null)
const editingName = ref('')

function getTemplate(id: string) {
  return earringTemplates.find((t) => t.id === id) || earringTemplates[0]
}

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

function startRename(scheme: Scheme, e: Event) {
  e.stopPropagation()
  editingId.value = scheme.id
  editingName.value = scheme.name
}

function finishRename(scheme: Scheme) {
  if (editingName.value.trim()) {
    store.renameScheme(scheme.id, editingName.value.trim())
  }
  editingId.value = null
}

function toggleSelect(id: string, e: Event) {
  e.stopPropagation()
  if (selectedIds.value.has(id)) {
    selectedIds.value.delete(id)
  } else {
    selectedIds.value.add(id)
  }
}

function selectAll() {
  if (selectedIds.value.size === filteredSchemes.value.length) {
    selectedIds.value.clear()
  } else {
    selectedIds.value = new Set(filteredSchemes.value.map((s) => s.id))
  }
}

function batchDelete() {
  if (selectedIds.value.size === 0) return
  if (confirm(`确定删除选中的 ${selectedIds.value.size} 个方案？`)) {
    store.deleteSchemes(Array.from(selectedIds.value))
    selectedIds.value.clear()
    batchMode.value = false
  }
}

function toggleBatchMode() {
  batchMode.value = !batchMode.value
  if (!batchMode.value) {
    selectedIds.value.clear()
  }
}

const filteredSchemes = computed(() => {
  let result = store.schemes

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    result = result.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        getTemplate(s.leftEarring.templateId).name.toLowerCase().includes(q) ||
        getTemplate(s.rightEarring.templateId).name.toLowerCase().includes(q)
    )
  }

  if (filterCategory.value === 'recommended') {
    result = result.filter((s) => s.recommended)
  } else if (filterCategory.value !== 'all') {
    result = result.filter((s) => {
      const leftCat = getTemplate(s.leftEarring.templateId).category
      const rightCat = getTemplate(s.rightEarring.templateId).category
      return leftCat === filterCategory.value || rightCat === filterCategory.value
    })
  }

  return result
})

const filterOptions = [
  { key: 'all', label: '全部' },
  { key: 'recommended', label: '推荐' },
  { key: 'stud', label: '耳钉' },
  { key: 'drop', label: '耳坠' },
  { key: 'hoop', label: '圈环' },
  { key: 'tassel', label: '流苏' },
] as const
</script>

<template>
  <div class="h-full flex flex-col bg-bg-panel rounded-xl border border-gold/10">
    <div class="px-4 py-3 border-b border-gold/10">
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center gap-2">
          <History class="w-4 h-4 text-gold-light" />
          <h3 class="text-sm font-display tracking-wider text-gold-light">历史方案</h3>
          <span class="text-[10px] px-1.5 py-0.5 rounded bg-gold/15 text-gold-light">
            {{ store.schemes.length }}
          </span>
        </div>
        <button
          @click="toggleBatchMode"
          :class="[
            'p-1 rounded transition-colors',
            batchMode ? 'bg-red-500/20 text-red-300' : 'text-ivory-muted/50 hover:text-ivory-muted',
          ]"
          :title="batchMode ? '退出批量' : '批量管理'"
        >
          <CheckSquare class="w-3.5 h-3.5" />
        </button>
      </div>

      <div class="space-y-2">
        <div class="relative">
          <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ivory-muted/50" />
          <input
            v-model="searchQuery"
            type="text"
            class="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white/5 border border-white/10 focus:border-gold/40 focus:outline-none text-ivory text-xs transition-colors"
            placeholder="搜索方案名称或耳饰..."
          />
          <button
            v-if="searchQuery"
            @click="searchQuery = ''"
            class="absolute right-2 top-1/2 -translate-y-1/2 text-ivory-muted/50 hover:text-ivory-muted"
          >
            <X class="w-3 h-3" />
          </button>
        </div>

        <div class="flex items-center gap-1 overflow-x-auto">
          <button
            v-for="opt in filterOptions"
            :key="opt.key"
            @click="filterCategory = opt.key"
            :class="[
              'flex-shrink-0 text-[10px] px-2 py-0.5 rounded-full transition-all',
              filterCategory === opt.key
                ? 'bg-gold/20 text-gold-light ring-1 ring-gold/30'
                : 'text-ivory-muted/60 hover:text-ivory-muted bg-white/5',
            ]"
          >
            <span v-if="opt.key === 'recommended'" class="flex items-center gap-0.5">
              <Star class="w-2.5 h-2.5" />
              {{ opt.label }}
            </span>
            <span v-else>{{ opt.label }}</span>
          </button>
        </div>

        <div
          v-if="batchMode"
          class="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/5"
        >
          <button
            @click="selectAll"
            class="text-[10px] px-2 py-0.5 rounded bg-white/5 text-ivory-muted hover:text-ivory transition-colors flex items-center gap-1"
          >
            <CheckSquare v-if="selectedIds.size === filteredSchemes.length" class="w-3 h-3" />
            <Square v-else class="w-3 h-3" />
            全选
          </button>
          <span class="text-[10px] text-ivory-muted/60">已选 {{ selectedIds.size }} 项</span>
          <div class="flex-1" />
          <button
            @click="batchDelete"
            :disabled="selectedIds.size === 0"
            class="text-[10px] px-2 py-0.5 rounded bg-red-500/15 text-red-300 hover:bg-red-500/25 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
          >
            <Trash2 class="w-3 h-3" />
            删除选中
          </button>
        </div>
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

      <div v-else-if="filteredSchemes.length === 0" class="h-full flex flex-col items-center justify-center text-center py-8">
        <div class="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mb-3">
          <Search class="w-6 h-6 text-ivory-muted/40" />
        </div>
        <p class="text-xs text-ivory-muted/60 mb-1">未找到匹配方案</p>
        <p class="text-[10px] text-ivory-muted/40">尝试调整搜索条件或筛选器</p>
      </div>

      <div v-else class="space-y-2.5">
        <div
          v-for="scheme in filteredSchemes"
          :key="scheme.id"
          @click="batchMode ? toggleSelect(scheme.id, $event) : store.loadScheme(scheme)"
          :class="[
            'group relative p-2.5 rounded-xl border transition-all duration-200 animate-fade-in cursor-pointer',
            selectedIds.has(scheme.id)
              ? 'border-gold/40 bg-gold/10'
              : 'border-white/5 bg-bg-secondary/50 hover:border-gold/30 hover:bg-white/5',
          ]"
        >
          <div v-if="batchMode" class="absolute top-2.5 left-2.5 z-10">
            <CheckSquare v-if="selectedIds.has(scheme.id)" class="w-4 h-4 text-gold-light" />
            <Square v-else class="w-4 h-4 text-ivory-muted/40" />
          </div>

          <div :class="['flex gap-3', batchMode ? 'pl-6' : '']">
            <div class="relative w-16 h-20 rounded-lg overflow-hidden bg-black/30 flex-shrink-0 border border-white/5">
              <img
                :src="scheme.thumbnail"
                :alt="scheme.name"
                class="w-full h-full object-cover"
              />
              <div
                v-if="!batchMode"
                class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-1"
              >
                <span class="text-[9px] text-white font-medium">点击加载</span>
              </div>
            </div>

            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <div v-if="editingId === scheme.id" class="flex items-center gap-1">
                    <input
                      v-model="editingName"
                      class="text-xs px-1 py-0.5 rounded bg-black/30 border border-gold/30 text-ivory outline-none w-28"
                      @keyup.enter="finishRename(scheme)"
                      @blur="finishRename(scheme)"
                      @click.stop
                    />
                  </div>
                  <h4 v-else class="text-xs font-medium text-ivory truncate group-hover:text-gold-light transition-colors flex items-center gap-1">
                    <Star v-if="scheme.recommended" class="w-3 h-3 text-amber-300 fill-amber-300 flex-shrink-0" />
                    {{ scheme.name }}
                  </h4>
                  <div class="flex items-center gap-1 mt-0.5 text-[10px] text-ivory-muted/60">
                    <Clock class="w-2.5 h-2.5" />
                    {{ formatDate(scheme.createdAt) }}
                  </div>
                </div>
                <div v-if="!batchMode" class="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    @click="startRename(scheme, $event)"
                    class="p-1 rounded text-ivory-muted/60 hover:text-gold-light hover:bg-gold/10 transition-all"
                    title="重命名"
                  >
                    <Pencil class="w-3 h-3" />
                  </button>
                  <button
                    @click="handleGenerateMaintenance(scheme.id, $event)"
                    class="p-1 rounded text-ivory-muted/60 hover:text-emerald-300 hover:bg-emerald-500/10 transition-all"
                    title="生成保养计划"
                  >
                    <ShieldAlert class="w-3 h-3" />
                  </button>
                  <button
                    @click="handleEnterInspirationFromScheme(scheme, $event)"
                    class="p-1 rounded text-ivory-muted/60 hover:text-teal-300 hover:bg-teal-500/10 transition-all"
                    title="进入搭配工作台"
                  >
                    <Palette class="w-3 h-3" />
                  </button>
                  <button
                    @click="confirmDelete(scheme.id, $event)"
                    class="p-1 rounded text-ivory-muted/60 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    title="删除方案"
                  >
                    <Trash2 class="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div class="flex items-center gap-1.5 mt-2 flex-wrap">
                <span class="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300/80">
                  L: {{ getTemplate(scheme.leftEarring.templateId).name }}
                </span>
                <span class="text-[9px] px-1.5 py-0.5 rounded bg-pink-500/15 text-pink-300/80">
                  R: {{ getTemplate(scheme.rightEarring.templateId).name }}
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

              <div v-if="scheme.budget || scheme.materialPreference || scheme.sceneNotes" class="mt-1.5 flex items-center gap-1.5 flex-wrap">
                <span v-if="scheme.budget" class="text-[9px] px-1.5 py-0.5 rounded bg-green-500/15 text-green-300/80">
                  {{ scheme.budget }}
                </span>
                <span v-if="scheme.materialPreference" class="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300/80">
                  {{ scheme.materialPreference }}
                </span>
                <span v-if="scheme.sceneNotes" class="text-[9px] px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-300/80">
                  {{ scheme.sceneNotes }}
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
