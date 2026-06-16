<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useEarringStore } from '@/stores/useEarringStore'
import { earringTemplates } from '@/data/earringTemplates'
import {
  collarTypeLabels,
  clothingColorLabels,
  clothingColorHex,
  hairLengthLabels,
  skinToneLabels,
  outfitSceneLabels,
  formalityLabels,
  wearingDurationLabels,
} from '@/types'
import type {
  OutfitInspirationCard,
  CollarType,
  ClothingColor,
  HairLength,
  SkinTone,
  OutfitScene,
  Formality,
  WearingDuration,
} from '@/types'
import {
  Palette,
  Sparkles,
  Star,
  Pencil,
  Trash2,
  Copy,
  Heart,
  Filter,
  Search,
  X,
  ChevronDown,
  Plus,
  ImageDown,
  FolderOpen,
  Clock,
  CheckCircle2,
  AlertCircle,
  Shirt,
  Scissors,
  Sun,
  MapPin,
  Briefcase,
  Timer,
  Zap,
  RefreshCw,
} from 'lucide-vue-next'

const props = defineProps<{
  getCanvas?: () => HTMLCanvasElement | null
}>()

const emit = defineEmits<{
  (e: 'export-card', card: OutfitInspirationCard): void
}>()

const store = useEarringStore()

const selectedCardId = ref<string | null>(null)
const editingCardId = ref<string | null>(null)
const editingName = ref('')
const noteCardId = ref<string | null>(null)
const editingNote = ref('')

const sortBy = ref<'score' | 'date' | 'name'>('date')
const sortOrder = ref<'asc' | 'desc'>('desc')
const filterScene = ref<'all' | OutfitScene>('all')
const filterColor = ref<'all' | ClothingColor>('all')
const filterFavorite = ref(false)
const minScore = ref(0)
const searchQuery = ref('')

const showCreateModal = ref(false)
const newCardName = ref('')

const groupByScene = ref(true)

function getTemplate(id: string) {
  return earringTemplates.find((t) => t.id === id) || earringTemplates[0]
}

function formatDate(ts: number) {
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function getScoreColor(score: number) {
  if (score >= 85) return 'text-green-400'
  if (score >= 75) return 'text-blue-400'
  if (score >= 65) return 'text-yellow-400'
  return 'text-orange-400'
}

function getScoreBg(score: number) {
  if (score >= 85) return 'bg-green-500/20'
  if (score >= 75) return 'bg-blue-500/20'
  if (score >= 65) return 'bg-yellow-500/20'
  return 'bg-orange-500/20'
}

function getScoreRingColor(score: number) {
  if (score >= 85) return '#4ade80'
  if (score >= 75) return '#60a5fa'
  if (score >= 65) return '#facc15'
  return '#fb923c'
}

const selectedCard = computed(() => {
  if (!selectedCardId.value) return null
  return store.inspirationCards.find((c) => c.id === selectedCardId.value) || null
})

const filteredCards = computed(() => {
  let result = [...store.inspirationCards]

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    result = result.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        getTemplate(c.leftEarring.templateId).name.toLowerCase().includes(q) ||
        getTemplate(c.rightEarring.templateId).name.toLowerCase().includes(q) ||
        c.matchingResult.styleTags.some((t) => t.toLowerCase().includes(q))
    )
  }

  if (filterFavorite.value) {
    result = result.filter((c) => c.isFavorite)
  }

  if (filterScene.value !== 'all') {
    result = result.filter((c) => c.outfitParams.scene === filterScene.value)
  }

  if (filterColor.value !== 'all') {
    result = result.filter((c) => c.outfitParams.clothingColor === filterColor.value)
  }

  if (minScore.value > 0) {
    result = result.filter((c) => c.matchingResult.totalScore >= minScore.value)
  }

  if (sortBy.value === 'score') {
    result.sort((a, b) =>
      sortOrder.value === 'desc'
        ? b.matchingResult.totalScore - a.matchingResult.totalScore
        : a.matchingResult.totalScore - b.matchingResult.totalScore
    )
  } else if (sortBy.value === 'date') {
    result.sort((a, b) =>
      sortOrder.value === 'desc' ? b.createdAt - a.createdAt : a.createdAt - b.createdAt
    )
  } else if (sortBy.value === 'name') {
    result.sort((a, b) =>
      sortOrder.value === 'desc' ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name)
    )
  }

  return result
})

const groupedCards = computed(() => {
  if (!groupByScene.value) {
    return [{ scene: 'all' as OutfitScene | 'all', cards: filteredCards.value }]
  }

  const scenes: (OutfitScene | 'all')[] = ['commute', 'date', 'wedding', 'dinner', 'travel', 'party', 'casual', 'business']
  const groups: { scene: OutfitScene | 'all'; cards: OutfitInspirationCard[] }[] = []

  for (const scene of scenes) {
    const sceneCards = filteredCards.value.filter((c) => c.outfitParams.scene === scene)
    if (sceneCards.length > 0) {
      groups.push({ scene, cards: sceneCards })
    }
  }

  return groups
})

function selectCard(cardId: string) {
  selectedCardId.value = selectedCardId.value === cardId ? null : cardId
}

function startRename(card: OutfitInspirationCard, e: Event) {
  e.stopPropagation()
  editingCardId.value = card.id
  editingName.value = card.name
}

function finishRename(card: OutfitInspirationCard) {
  if (editingName.value.trim()) {
    store.renameInspirationCard(card.id, editingName.value.trim())
  }
  editingCardId.value = null
}

function startEditNote(card: OutfitInspirationCard, e: Event) {
  e.stopPropagation()
  noteCardId.value = card.id
  editingNote.value = card.notes
}

function finishNote(card: OutfitInspirationCard) {
  store.updateInspirationCard(card.id, { notes: editingNote.value })
  noteCardId.value = null
}

function handleDelete(cardId: string, e: Event) {
  e.stopPropagation()
  if (confirm('确定删除此灵感卡？')) {
    store.deleteInspirationCard(cardId)
    if (selectedCardId.value === cardId) {
      selectedCardId.value = null
    }
  }
}

function handleCopy(cardId: string, e: Event) {
  e.stopPropagation()
  store.copyInspirationCard(cardId)
}

function handleFavorite(cardId: string, e: Event) {
  e.stopPropagation()
  store.toggleInspirationCardFavorite(cardId)
}

function handleExport(card: OutfitInspirationCard, e: Event) {
  e.stopPropagation()
  emit('export-card', card)
}

function handleLoadToMain(cardId: string, e: Event) {
  e.stopPropagation()
  store.loadInspirationCardToMain(cardId)
}

function updateOutfitParam<K extends keyof typeof store.activeOutfitParams>(
  field: K,
  value: (typeof store.activeOutfitParams)[K]
) {
  store.setActiveOutfitParams({ [field]: value })
  if (selectedCard.value) {
    store.updateInspirationCardOutfitParams(selectedCard.value.id, { [field]: value })
  } else {
    store.calculateActiveMatchingScore(store.leftEarring, store.rightEarring, store.effect)
  }
}

function openCreateModal() {
  if (!store.photo) {
    alert('请先上传照片并调整耳饰后再创建灵感卡')
    return
  }
  newCardName.value = `搭配灵感-${new Date().toLocaleDateString('zh-CN')}-${String(store.inspirationCards.length + 1).padStart(2, '0')}`
  showCreateModal.value = true
}

function generateCurrentThumbnail(): string {
  const canvas = props.getCanvas?.() || document.querySelector('canvas')
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
  return tmp.toDataURL('image/jpeg', 0.7)
}

function createNewCard() {
  if (!newCardName.value.trim()) {
    alert('请输入灵感卡名称')
    return
  }
  const thumbnail = generateCurrentThumbnail()
  store.createInspirationCard(
    newCardName.value.trim(),
    thumbnail,
    store.leftEarring,
    store.rightEarring,
    store.effect,
    store.activeOutfitParams
  )
  showCreateModal.value = false
  newCardName.value = ''
}

function recalculateScore() {
  if (selectedCard.value) {
    store.updateInspirationCard(selectedCard.value.id, {})
  } else {
    store.calculateActiveMatchingScore(store.leftEarring, store.rightEarring, store.effect)
  }
}

watch(
  () => [store.leftEarring, store.rightEarring, store.effect],
  () => {
    if (!selectedCard.value) {
      store.calculateActiveMatchingScore(store.leftEarring, store.rightEarring, store.effect)
    }
  },
  { deep: true, immediate: true }
)

const dimensionLabels: Record<string, string> = {
  styleMatch: '风格匹配',
  colorHarmony: '色彩和谐',
  proportionBalance: '比例平衡',
  sceneAppropriateness: '场景适配',
  comfortPracticality: '舒适实用',
}

const sceneOrder: OutfitScene[] = ['commute', 'date', 'wedding', 'dinner', 'travel', 'party', 'casual', 'business']

const colorOptions = Object.entries(clothingColorLabels) as [ClothingColor, string][]
const collarOptions = Object.entries(collarTypeLabels) as [CollarType, string][]
const hairOptions = Object.entries(hairLengthLabels) as [HairLength, string][]
const skinOptions = Object.entries(skinToneLabels) as [SkinTone, string][]
const sceneOptions = Object.entries(outfitSceneLabels) as [OutfitScene, string][]
const formalityOptions = Object.entries(formalityLabels) as [Formality, string][]
const durationOptions = Object.entries(wearingDurationLabels) as [WearingDuration, string][]
</script>

<template>
  <div class="h-full flex flex-col bg-bg-panel rounded-xl border border-gold/10 overflow-hidden">
    <div class="px-4 py-3 border-b border-gold/10 flex-shrink-0">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <Palette class="w-4 h-4 text-gold-light" />
          <h3 class="text-sm font-display tracking-wider text-gold-light">穿搭场景灵感板</h3>
          <span class="text-[10px] px-1.5 py-0.5 rounded bg-gold/15 text-gold-light">
            {{ store.inspirationCards.length }}
          </span>
        </div>
        <div class="flex items-center gap-1.5">
          <button
            @click="groupByScene = !groupByScene"
            :class="[
              'text-[10px] px-2 py-0.5 rounded-full transition-all',
              groupByScene
                ? 'bg-gold/20 text-gold-light ring-1 ring-gold/30'
                : 'text-ivory-muted/60 hover:text-ivory-muted bg-white/5',
            ]"
          >
            场景分组
          </button>
          <button
            @click="openCreateModal"
            :disabled="!store.photo"
            class="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gold/20 hover:bg-gold/30 text-gold-light text-xs font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <Plus class="w-3.5 h-3.5" />
            新建
          </button>
        </div>
      </div>

      <div class="space-y-2">
        <div class="relative">
          <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ivory-muted/50" />
          <input
            v-model="searchQuery"
            type="text"
            class="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white/5 border border-white/10 focus:border-gold/40 focus:outline-none text-ivory text-xs transition-colors"
            placeholder="搜索灵感卡名称或风格标签..."
          />
          <button
            v-if="searchQuery"
            @click="searchQuery = ''"
            class="absolute right-2 top-1/2 -translate-y-1/2 text-ivory-muted/50 hover:text-ivory-muted"
          >
            <X class="w-3 h-3" />
          </button>
        </div>

        <div class="flex items-center gap-1.5 flex-wrap">
          <button
            @click="filterFavorite = !filterFavorite"
            :class="[
              'text-[10px] px-2 py-0.5 rounded-full transition-all flex items-center gap-0.5',
              filterFavorite
                ? 'bg-rose/20 text-rose ring-1 ring-rose/30'
                : 'text-ivory-muted/60 hover:text-ivory-muted bg-white/5',
            ]"
          >
            <Heart class="w-2.5 h-2.5" :class="{ 'fill-rose': filterFavorite }" />
            收藏
          </button>
          <div class="relative">
            <select
              v-model="filterScene"
              class="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-ivory-muted border border-white/10 focus:border-gold/40 focus:outline-none appearance-none pr-6 cursor-pointer"
            >
              <option value="all">全部场景</option>
              <option v-for="[key, label] in sceneOptions" :key="key" :value="key">{{ label }}</option>
            </select>
            <ChevronDown class="absolute right-1 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-ivory-muted/50 pointer-events-none" />
          </div>
          <div class="relative">
            <select
              v-model="filterColor"
              class="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-ivory-muted border border-white/10 focus:border-gold/40 focus:outline-none appearance-none pr-6 cursor-pointer"
            >
              <option value="all">全部颜色</option>
              <option v-for="[key, label] in colorOptions" :key="key" :value="key">{{ label }}</option>
            </select>
            <ChevronDown class="absolute right-1 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-ivory-muted/50 pointer-events-none" />
          </div>
          <div class="flex items-center gap-1">
            <span class="text-[10px] text-ivory-muted/50">≥</span>
            <input
              v-model.number="minScore"
              type="range"
              min="0"
              max="100"
              step="5"
              class="w-16 h-1"
            />
            <span class="text-[10px] text-ivory-muted/60 w-6">{{ minScore }}</span>
          </div>
          <div class="flex-1" />
          <div class="flex items-center gap-0.5">
            <span class="text-[10px] text-ivory-muted/50">排序:</span>
            <select
              v-model="sortBy"
              class="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-ivory-muted border-none focus:outline-none cursor-pointer"
            >
              <option value="date">时间</option>
              <option value="score">评分</option>
              <option value="name">名称</option>
            </select>
            <button
              @click="sortOrder = sortOrder === 'desc' ? 'asc' : 'desc'"
              class="p-0.5 rounded text-ivory-muted/50 hover:text-ivory-muted transition-colors"
            >
              <ChevronDown :class="['w-3 h-3 transition-transform', sortOrder === 'asc' ? 'rotate-180' : '']" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="flex-1 flex min-h-0 overflow-hidden">
      <div class="flex-1 min-w-0 overflow-y-auto p-3 border-r border-gold/10">
        <div v-if="store.inspirationCards.length === 0" class="h-full flex flex-col items-center justify-center text-center py-8">
          <div class="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mb-3">
            <FolderOpen class="w-6 h-6 text-ivory-muted/40" />
          </div>
          <p class="text-xs text-ivory-muted/60 mb-1">暂无灵感卡</p>
          <p class="text-[10px] text-ivory-muted/40 mb-3">点击「新建」创建第一张穿搭灵感卡</p>
          <button
            @click="openCreateModal"
            :disabled="!store.photo"
            class="px-3 py-1.5 rounded-lg bg-gold/20 hover:bg-gold/30 text-gold-light text-xs font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
          >
            <Plus class="w-3.5 h-3.5" />
            创建灵感卡
          </button>
        </div>

        <div v-else-if="filteredCards.length === 0" class="h-full flex flex-col items-center justify-center text-center py-8">
          <div class="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mb-3">
            <Filter class="w-6 h-6 text-ivory-muted/40" />
          </div>
          <p class="text-xs text-ivory-muted/60 mb-1">未找到匹配的灵感卡</p>
          <p class="text-[10px] text-ivory-muted/40">尝试调整搜索条件或筛选器</p>
        </div>

        <div v-else class="space-y-4">
          <div v-for="group in groupedCards" :key="group.scene" class="space-y-2">
            <div v-if="groupByScene" class="flex items-center gap-2">
              <span class="text-[11px] font-medium text-gold-light">
                {{ group.scene === 'all' ? '全部' : outfitSceneLabels[group.scene as OutfitScene] }}
              </span>
              <span class="text-[10px] text-ivory-muted/50">({{ group.cards.length }})</span>
              <div class="flex-1 h-px bg-gold/10" />
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div
                v-for="card in group.cards"
                :key="card.id"
                @click="selectCard(card.id)"
                :class="[
                  'relative p-2.5 rounded-xl border transition-all duration-200 animate-fade-in cursor-pointer group',
                  selectedCardId === card.id
                    ? 'border-gold/40 bg-gold/10 ring-1 ring-gold/30'
                    : 'border-white/5 bg-bg-secondary/50 hover:border-gold/30 hover:bg-white/5',
                ]"
              >
                <div class="flex gap-2.5">
                  <div class="relative w-16 aspect-[3/4] rounded-lg overflow-hidden bg-black/30 flex-shrink-0 border border-white/5">
                    <img
                      v-if="card.thumbnail"
                      :src="card.thumbnail"
                      :alt="card.name"
                      class="w-full h-full object-cover"
                    />
                    <div
                      v-else
                      class="w-full h-full flex items-center justify-center text-ivory-muted/40 text-[10px]"
                    >
                      暂无图
                    </div>
                    <div
                      :class="[
                        'absolute top-1 left-1 text-[9px] px-1.5 py-0.5 rounded font-bold',
                        getScoreBg(card.matchingResult.totalScore),
                        getScoreColor(card.matchingResult.totalScore),
                      ]"
                    >
                      {{ card.matchingResult.totalScore }}
                    </div>
                    <div
                      v-if="card.isFavorite"
                      class="absolute top-1 right-1"
                    >
                      <Heart class="w-3 h-3 text-rose fill-rose" />
                    </div>
                  </div>

                  <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between gap-1">
                      <div class="min-w-0">
                        <div v-if="editingCardId === card.id" class="flex items-center gap-1">
                          <input
                            v-model="editingName"
                            class="text-[10px] px-1 py-0.5 rounded bg-black/30 border border-gold/30 text-ivory outline-none w-20"
                            @keyup.enter="finishRename(card)"
                            @blur="finishRename(card)"
                            @click.stop
                          />
                        </div>
                        <h4 v-else class="text-[11px] font-medium text-ivory truncate group-hover:text-gold-light transition-colors">
                          {{ card.name }}
                        </h4>
                        <div class="flex items-center gap-1 mt-0.5 text-[9px] text-ivory-muted/60">
                          <Clock class="w-2 h-2" />
                          {{ formatDate(card.createdAt) }}
                        </div>
                      </div>
                    </div>

                    <div class="flex items-center gap-1 mt-1.5 flex-wrap">
                      <span
                        v-for="tag in card.matchingResult.styleTags.slice(0, 3)"
                        :key="tag"
                        class="text-[8px] px-1 py-0.5 rounded bg-white/5 text-ivory-muted/70"
                      >
                        {{ tag }}
                      </span>
                    </div>

                    <div class="flex items-center gap-1 mt-1.5">
                      <div
                        class="w-2.5 h-2.5 rounded-full border border-white/20"
                        :style="{ backgroundColor: clothingColorHex[card.outfitParams.clothingColor] }"
                      />
                      <span class="text-[8px] text-ivory-muted/60">
                        {{ outfitSceneLabels[card.outfitParams.scene] }}
                      </span>
                    </div>

                    <div v-if="card.notes" class="mt-1">
                      <p class="text-[8px] text-ivory-muted/50 truncate">
                        {{ card.notes }}
                      </p>
                    </div>

                    <div class="flex items-center gap-0.5 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        @click="startRename(card, $event)"
                        class="p-0.5 rounded text-ivory-muted/50 hover:text-gold-light hover:bg-gold/10 transition-all"
                        title="重命名"
                      >
                        <Pencil class="w-2.5 h-2.5" />
                      </button>
                      <button
                        @click="handleFavorite(card.id, $event)"
                        :class="[
                          'p-0.5 rounded transition-all',
                          card.isFavorite
                            ? 'text-rose hover:bg-rose/10'
                            : 'text-ivory-muted/50 hover:text-rose hover:bg-rose/10',
                        ]"
                        :title="card.isFavorite ? '取消收藏' : '收藏'"
                      >
                        <Heart class="w-2.5 h-2.5" :class="{ 'fill-rose': card.isFavorite }" />
                      </button>
                      <button
                        @click="startEditNote(card, $event)"
                        class="p-0.5 rounded text-ivory-muted/50 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                        title="备注"
                      >
                        <Pencil class="w-2.5 h-2.5" />
                      </button>
                      <button
                        @click="handleCopy(card.id, $event)"
                        class="p-0.5 rounded text-ivory-muted/50 hover:text-green-400 hover:bg-green-500/10 transition-all"
                        title="复制"
                      >
                        <Copy class="w-2.5 h-2.5" />
                      </button>
                      <button
                        @click="handleExport(card, $event)"
                        class="p-0.5 rounded text-ivory-muted/50 hover:text-purple-400 hover:bg-purple-500/10 transition-all"
                        title="导出搭配建议卡"
                      >
                        <ImageDown class="w-2.5 h-2.5" />
                      </button>
                      <button
                        @click="handleLoadToMain(card.id, $event)"
                        class="p-0.5 rounded text-ivory-muted/50 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all"
                        title="加载到主画布"
                      >
                        <RefreshCw class="w-2.5 h-2.5" />
                      </button>
                      <div class="flex-1" />
                      <button
                        @click="handleDelete(card.id, $event)"
                        class="p-0.5 rounded text-ivory-muted/50 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        title="删除"
                      >
                        <Trash2 class="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div
                  v-if="noteCardId === card.id"
                  class="mt-2 pt-2 border-t border-white/5"
                  @click.stop
                >
                  <textarea
                    v-model="editingNote"
                    class="w-full text-[10px] px-2 py-1.5 rounded-lg bg-black/30 border border-white/10 text-ivory outline-none focus:border-gold/40 resize-none"
                    rows="2"
                    placeholder="添加备注..."
                    @blur="finishNote(card)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="w-80 flex-shrink-0 flex flex-col overflow-hidden">
        <div class="p-3 border-b border-gold/10">
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-xs font-medium text-gold-light flex items-center gap-1.5">
              <Sparkles class="w-3.5 h-3.5" />
              {{ selectedCard ? '编辑搭配参数' : '搭配评分预览' }}
            </h4>
            <button
              @click="recalculateScore"
              class="text-[10px] px-2 py-0.5 rounded bg-white/5 text-ivory-muted hover:text-ivory hover:bg-white/10 transition-colors flex items-center gap-0.5"
            >
              <RefreshCw class="w-2.5 h-2.5" />
              重新计算
            </button>
          </div>

          <div
            v-if="selectedCard || store.activeMatchingResult"
            class="mb-4"
          >
            <div class="flex items-center justify-center mb-3">
              <div class="relative w-24 h-24">
                <svg class="w-full h-full transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    stroke-width="8"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    fill="none"
                    :stroke="getScoreRingColor((selectedCard?.matchingResult || store.activeMatchingResult)?.totalScore || 0)"
                    stroke-width="8"
                    stroke-linecap="round"
                    :stroke-dasharray="`${((selectedCard?.matchingResult || store.activeMatchingResult)?.totalScore || 0) * 2.51} 251`"
                    class="transition-all duration-500"
                  />
                </svg>
                <div class="absolute inset-0 flex flex-col items-center justify-center">
                  <span
                    :class="[
                      'text-2xl font-bold font-display',
                      getScoreColor((selectedCard?.matchingResult || store.activeMatchingResult)?.totalScore || 0),
                    ]"
                  >
                    {{ (selectedCard?.matchingResult || store.activeMatchingResult)?.totalScore || 0 }}
                  </span>
                  <span class="text-[9px] text-ivory-muted/60">匹配度</span>
                </div>
              </div>
            </div>

            <div class="space-y-1.5 mb-3">
              <div
                v-for="[key, label] in Object.entries(dimensionLabels)"
                :key="key"
                class="flex items-center gap-2"
              >
                <span class="text-[10px] text-ivory-muted/70 w-16 flex-shrink-0">{{ label }}</span>
                <div class="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all duration-500"
                    :class="getScoreBg((selectedCard?.matchingResult || store.activeMatchingResult)?.dimensionScores[key as keyof typeof dimensionLabels] || 0)"
                    :style="{ width: `${(selectedCard?.matchingResult || store.activeMatchingResult)?.dimensionScores[key as keyof typeof dimensionLabels] || 0}%` }"
                  />
                </div>
                <span class="text-[10px] text-ivory-muted/70 w-6 text-right">
                  {{ (selectedCard?.matchingResult || store.activeMatchingResult)?.dimensionScores[key as keyof typeof dimensionLabels] || 0 }}
                </span>
              </div>
            </div>

            <div class="flex flex-wrap gap-1 mb-3">
              <span
                v-for="tag in (selectedCard?.matchingResult || store.activeMatchingResult)?.styleTags || []"
                :key="tag"
                class="text-[9px] px-1.5 py-0.5 rounded-full bg-gold/15 text-gold-light"
              >
                #{{ tag }}
              </span>
            </div>

            <div class="space-y-1">
              <div class="flex items-center gap-1 mb-1">
                <AlertCircle class="w-3 h-3 text-amber-400" />
                <span class="text-[10px] text-ivory-muted/70 font-medium">搭配建议</span>
              </div>
              <div
                v-for="(suggestion, idx) in (selectedCard?.matchingResult || store.activeMatchingResult)?.suggestions || []"
                :key="idx"
                class="flex items-start gap-1.5 text-[10px] text-ivory-muted/60 pl-2.5 relative"
              >
                <span class="absolute left-0 top-1 w-1 h-1 rounded-full bg-gold/50" />
                {{ suggestion }}
              </div>
            </div>
          </div>

          <div v-else class="py-8 text-center">
            <Zap class="w-8 h-8 text-ivory-muted/30 mx-auto mb-2" />
            <p class="text-[10px] text-ivory-muted/50">选择耳饰后自动计算匹配评分</p>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-3">
          <h5 class="text-[11px] font-medium text-ivory-muted mb-2.5 flex items-center gap-1">
            <Shirt class="w-3 h-3" />
            穿搭条件
          </h5>

          <div class="space-y-3">
            <div>
              <label class="text-[10px] text-ivory-muted/70 mb-1 flex items-center gap-1">
                <Shirt class="w-2.5 h-2.5" />
                服装领型
              </label>
              <div class="grid grid-cols-4 gap-1">
                <button
                  v-for="[key, label] in collarOptions"
                  :key="key"
                  @click="updateOutfitParam('collarType', key)"
                  :class="[
                    'text-[9px] py-1 rounded transition-all',
                    (selectedCard?.outfitParams || store.activeOutfitParams).collarType === key
                      ? 'bg-gold/20 text-gold-light ring-1 ring-gold/30'
                      : 'bg-white/5 text-ivory-muted/70 hover:text-ivory-muted hover:bg-white/10',
                  ]"
                >
                  {{ label }}
                </button>
              </div>
            </div>

            <div>
              <label class="text-[10px] text-ivory-muted/70 mb-1 flex items-center gap-1">
                <Palette class="w-2.5 h-2.5" />
                服装主色
              </label>
              <div class="grid grid-cols-7 gap-1">
                <button
                  v-for="[key, label] in colorOptions"
                  :key="key"
                  @click="updateOutfitParam('clothingColor', key)"
                  :title="label"
                  :class="[
                    'w-full aspect-square rounded-full transition-all relative',
                    (selectedCard?.outfitParams || store.activeOutfitParams).clothingColor === key
                      ? 'ring-2 ring-gold ring-offset-1 ring-offset-bg-panel scale-110'
                      : 'hover:scale-105',
                  ]"
                  :style="{ backgroundColor: clothingColorHex[key] }"
                >
                  <CheckCircle2
                    v-if="(selectedCard?.outfitParams || store.activeOutfitParams).clothingColor === key"
                    class="absolute inset-0 m-auto w-3 h-3"
                    :class="key === 'white' || key === 'beige' || key === 'yellow' ? 'text-bg' : 'text-white'"
                  />
                </button>
              </div>
            </div>

            <div>
              <label class="text-[10px] text-ivory-muted/70 mb-1 flex items-center gap-1">
                <Scissors class="w-2.5 h-2.5" />
                发型长度
              </label>
              <div class="grid grid-cols-5 gap-1">
                <button
                  v-for="[key, label] in hairOptions"
                  :key="key"
                  @click="updateOutfitParam('hairLength', key)"
                  :class="[
                    'text-[9px] py-1 rounded transition-all',
                    (selectedCard?.outfitParams || store.activeOutfitParams).hairLength === key
                      ? 'bg-gold/20 text-gold-light ring-1 ring-gold/30'
                      : 'bg-white/5 text-ivory-muted/70 hover:text-ivory-muted hover:bg-white/10',
                  ]"
                >
                  {{ label }}
                </button>
              </div>
            </div>

            <div>
              <label class="text-[10px] text-ivory-muted/70 mb-1 flex items-center gap-1">
                <Sun class="w-2.5 h-2.5" />
                肤色冷暖
              </label>
              <div class="grid grid-cols-3 gap-1">
                <button
                  v-for="[key, label] in skinOptions"
                  :key="key"
                  @click="updateOutfitParam('skinTone', key)"
                  :class="[
                    'text-[9px] py-1 rounded transition-all',
                    (selectedCard?.outfitParams || store.activeOutfitParams).skinTone === key
                      ? 'bg-gold/20 text-gold-light ring-1 ring-gold/30'
                      : 'bg-white/5 text-ivory-muted/70 hover:text-ivory-muted hover:bg-white/10',
                  ]"
                >
                  {{ label }}
                </button>
              </div>
            </div>

            <div>
              <label class="text-[10px] text-ivory-muted/70 mb-1 flex items-center gap-1">
                <MapPin class="w-2.5 h-2.5" />
                使用场景
              </label>
              <div class="grid grid-cols-4 gap-1">
                <button
                  v-for="[key, label] in sceneOptions"
                  :key="key"
                  @click="updateOutfitParam('scene', key)"
                  :class="[
                    'text-[9px] py-1 rounded transition-all',
                    (selectedCard?.outfitParams || store.activeOutfitParams).scene === key
                      ? 'bg-gold/20 text-gold-light ring-1 ring-gold/30'
                      : 'bg-white/5 text-ivory-muted/70 hover:text-ivory-muted hover:bg-white/10',
                  ]"
                >
                  {{ label }}
                </button>
              </div>
            </div>

            <div>
              <label class="text-[10px] text-ivory-muted/70 mb-1 flex items-center gap-1">
                <Briefcase class="w-2.5 h-2.5" />
                正式程度
              </label>
              <div class="grid grid-cols-5 gap-1">
                <button
                  v-for="[key, label] in formalityOptions"
                  :key="key"
                  @click="updateOutfitParam('formality', key)"
                  :class="[
                    'text-[9px] py-1 rounded transition-all',
                    (selectedCard?.outfitParams || store.activeOutfitParams).formality === key
                      ? 'bg-gold/20 text-gold-light ring-1 ring-gold/30'
                      : 'bg-white/5 text-ivory-muted/70 hover:text-ivory-muted hover:bg-white/10',
                  ]"
                >
                  {{ label }}
                </button>
              </div>
            </div>

            <div>
              <label class="text-[10px] text-ivory-muted/70 mb-1 flex items-center gap-1">
                <Timer class="w-2.5 h-2.5" />
                佩戴时长
              </label>
              <div class="grid grid-cols-4 gap-1">
                <button
                  v-for="[key, label] in durationOptions"
                  :key="key"
                  @click="updateOutfitParam('wearingDuration', key)"
                  :class="[
                    'text-[9px] py-1 rounded transition-all',
                    (selectedCard?.outfitParams || store.activeOutfitParams).wearingDuration === key
                      ? 'bg-gold/20 text-gold-light ring-1 ring-gold/30'
                      : 'bg-white/5 text-ivory-muted/70 hover:text-ivory-muted hover:bg-white/10',
                  ]"
                >
                  {{ label }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="p-3 border-t border-gold/10 flex-shrink-0">
          <button
            v-if="selectedCard"
            @click="handleExport(selectedCard, $event)"
            class="w-full py-2 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors border border-purple-500/20"
          >
            <ImageDown class="w-3.5 h-3.5" />
            导出搭配建议卡
          </button>
          <button
            v-else
            @click="openCreateModal"
            :disabled="!store.photo"
            class="w-full py-2 rounded-lg bg-gold/15 hover:bg-gold/25 text-gold-light text-xs font-medium flex items-center justify-center gap-1.5 transition-colors border border-gold/20 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Plus class="w-3.5 h-3.5" />
            保存为灵感卡
          </button>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="showCreateModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        @click.self="showCreateModal = false"
      >
        <div class="bg-bg-panel rounded-2xl border border-gold/20 p-6 w-full max-w-md animate-fade-in shadow-2xl">
          <h3 class="text-lg font-display text-gold-light mb-4 flex items-center gap-2">
            <Sparkles class="w-5 h-5" />
            创建穿搭灵感卡
          </h3>
          <label class="block text-xs text-ivory-muted mb-1.5">灵感卡名称</label>
          <input
            v-model="newCardName"
            type="text"
            class="w-full px-3 py-2.5 rounded-lg bg-bg-secondary/80 border border-white/10 focus:border-gold/50 focus:outline-none text-ivory text-sm transition-colors"
            placeholder="为这张灵感卡起个名字"
            @keyup.enter="createNewCard"
          />
          <p class="text-[10px] text-ivory-muted/50 mt-2 mb-4">
            将基于当前耳饰配置和穿搭条件创建灵感卡
          </p>
          <div class="flex gap-2">
            <button
              @click="showCreateModal = false"
              class="flex-1 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-ivory-muted text-sm transition-colors"
            >
              取消
            </button>
            <button
              @click="createNewCard"
              class="flex-1 py-2.5 rounded-lg bg-gold hover:bg-gold-light text-bg font-medium text-sm flex items-center justify-center gap-1.5 transition-colors"
            >
              <CheckCircle2 class="w-4 h-4" />
              确认创建
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
