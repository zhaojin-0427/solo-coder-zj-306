<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useEarringStore } from '@/stores/useEarringStore'
import type {
  StorageCard,
  StorageViewMode,
  StorageFilterField,
  StorageReminder,
  OutfitScene,
  BudgetRange,
  FestivalTag,
  RiskLevel,
} from '@/types'
import {
  outfitSceneLabels,
  budgetRangeLabels,
  festivalTagLabels,
  riskLevelLabels,
  riskLevelColors,
  riskLevelBgColors,
  giftRecipientLabels,
  materialTypeLabels,
  weightRangeLabels,
} from '@/types'
import { earringTemplates, categoryLabels } from '@/data/earringTemplates'
import {
  Package,
  Heart,
  Edit3,
  Copy,
  Trash2,
  ImageDown,
  Grid3X3,
  List,
  Search,
  Filter,
  Plus,
  X,
  ChevronDown,
  ChevronRight,
  Star,
  Sparkles,
  CalendarClock,
  Gift,
  Layers,
  AlertCircle,
  CheckCircle2,
  Pencil,
  Eye,
} from 'lucide-vue-next'
import StorageCardEditPanel from './StorageCardEditPanel.vue'
import StorageScoreCard from './StorageScoreCard.vue'
import StorageReminderPanel from './StorageReminderPanel.vue'

defineOptions({ inheritAttrs: false })

const emit = defineEmits<{
  (e: 'open-maintenance'): void
  (e: 'export-card', card: StorageCard): void
}>()

const store = useEarringStore()

const viewMode = ref<StorageViewMode>('card')
const filterField = ref<StorageFilterField>('all')
const filterValue = ref('')
const searchQuery = ref('')
const selectedCardId = ref<string | null>(null)
const showEditPanel = ref(false)
const showScoreCard = ref(false)
const showReminderPanel = ref(true)
const showAddFromHistory = ref(false)
const editingCardId = ref<string | null>(null)
const renameInput = ref('')
const renameCardId = ref<string | null>(null)
const expandedFilters = ref(false)

const filteredCards = computed(() => {
  let list = [...store.storageCards]

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    list = list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.storageBoxNumber.toLowerCase().includes(q) ||
        c.notes.toLowerCase().includes(q)
    )
  }

  if (filterField.value !== 'all' && filterValue.value) {
    switch (filterField.value) {
      case 'scene':
        list = list.filter((c) => c.scene === filterValue.value)
        break
      case 'budget':
        list = list.filter((c) => c.budgetRange === filterValue.value)
        break
      case 'risk': {
        list = list.filter((c) => {
          const materialInfo = c.materialInfoId
            ? store.materialInfoList.find((m) => m.id === c.materialInfoId)
            : null
          if (!materialInfo) return filterValue.value === 'low'
          const risk = store.assessRisk(materialInfo, 'medium')
          return risk.level === filterValue.value
        })
        break
      }
      case 'festival':
        list = list.filter((c) => c.festivalTags.includes(filterValue.value as FestivalTag))
        break
      case 'isPaired':
        list = list.filter((c) => (filterValue.value === 'yes' ? c.isPaired : !c.isPaired))
        break
      case 'suitableForGift':
        list = list.filter((c) => (filterValue.value === 'yes' ? c.suitableForGift : !c.suitableForGift))
        break
      case 'isFavorite':
        list = list.filter((c) => (filterValue.value === 'yes' ? c.isFavorite : !c.isFavorite))
        break
    }
  }

  return list.sort((a, b) => {
    if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1
    const pa = store.calculatePriorityScore(a)
    const pb = store.calculatePriorityScore(b)
    if (pa !== pb) return pb - pa
    return b.createdAt - a.createdAt
  })
})

const reminders = computed<StorageReminder[]>(() => store.generateStorageReminders(30))

const favoriteCount = computed(() => store.storageCards.filter((c) => c.isFavorite).length)
const giftReadyCount = computed(() => store.storageCards.filter((c) => c.suitableForGift).length)
const unpairedCount = computed(() => store.storageCards.filter((c) => !c.isPaired).length)

function getTemplate(id: string) {
  return earringTemplates.find((t) => t.id === id) || earringTemplates[0]
}

function getCardRisk(card: StorageCard): RiskLevel {
  const materialInfo = card.materialInfoId
    ? store.materialInfoList.find((m) => m.id === card.materialInfoId)
    : null
  if (!materialInfo) return 'low'
  return store.assessRisk(materialInfo, 'medium').level
}

function openEditPanel(card?: StorageCard) {
  if (card) {
    editingCardId.value = card.id
  } else {
    editingCardId.value = null
  }
  showEditPanel.value = true
}

function handleEditDone() {
  showEditPanel.value = false
  editingCardId.value = null
}

function handleSelectCard(id: string) {
  selectedCardId.value = selectedCardId.value === id ? null : id
}

function startRename(card: StorageCard, e: Event) {
  e.stopPropagation()
  renameCardId.value = card.id
  renameInput.value = card.name
}

function confirmRename() {
  if (renameCardId.value && renameInput.value.trim()) {
    store.renameStorageCard(renameCardId.value, renameInput.value.trim())
  }
  renameCardId.value = null
  renameInput.value = ''
}

function cancelRename() {
  renameCardId.value = null
  renameInput.value = ''
}

function toggleFavorite(id: string, e: Event) {
  e.stopPropagation()
  store.toggleStorageCardFavorite(id)
}

function copyCard(id: string, e: Event) {
  e.stopPropagation()
  store.copyStorageCard(id)
}

function deleteCard(id: string, e: Event) {
  e.stopPropagation()
  if (confirm('确定要删除这张收纳卡片吗？')) {
    store.deleteStorageCard(id)
    if (selectedCardId.value === id) {
      selectedCardId.value = null
    }
  }
}

function exportCard(card: StorageCard, e: Event) {
  e.stopPropagation()
  emit('export-card', card)
}

function markWornToday(id: string, e?: Event) {
  e?.stopPropagation()
  store.markStorageCardWornToday(id)
}

function openScoreCard(card: StorageCard, e: Event) {
  e.stopPropagation()
  selectedCardId.value = card.id
  showScoreCard.value = true
}

function addFromSchemes() {
  showAddFromHistory.value = true
}

function addFromScheme(schemeId: string) {
  const card = store.createStorageCardFromScheme(schemeId)
  if (card) {
    selectedCardId.value = card.id
    showAddFromHistory.value = false
  }
}

function addFromMaterial(materialInfoId: string) {
  const card = store.createStorageCardFromMaterial(materialInfoId)
  if (card) {
    selectedCardId.value = card.id
    showAddFromHistory.value = false
  }
}

function addEmptyCard() {
  if (!store.photo) {
    alert('请先上传照片并试戴耳饰，然后保存方案后再添加收纳卡。\n或从已有方案/保养计划一键生成。')
    showAddFromHistory.value = true
    return
  }
  alert('请先保存当前方案，再从"从历史方案生成"中添加。')
  showAddFromHistory.value = true
}

const filterValueOptions = computed(() => {
  switch (filterField.value) {
    case 'scene':
      return Object.entries(outfitSceneLabels).map(([v, l]) => ({ value: v, label: l }))
    case 'budget':
      return Object.entries(budgetRangeLabels).map(([v, l]) => ({ value: v, label: l }))
    case 'risk':
      return Object.entries(riskLevelLabels).map(([v, l]) => ({ value: v, label: l }))
    case 'festival':
      return Object.entries(festivalTagLabels).map(([v, l]) => ({ value: v, label: l }))
    case 'isPaired':
    case 'suitableForGift':
    case 'isFavorite':
      return [
        { value: 'yes', label: '是' },
        { value: 'no', label: '否' },
      ]
    default:
      return []
  }
})

watch(filterField, () => {
  filterValue.value = ''
})

function formatDate(ts: number | null) {
  if (!ts) return '暂无'
  const d = new Date(ts)
  return d.toLocaleDateString('zh-CN')
}

function daysSince(ts: number | null) {
  if (!ts) return '未佩戴'
  const days = Math.floor((Date.now() - ts) / (1000 * 60 * 60 * 24))
  return days === 0 ? '今天' : `${days}天前`
}
</script>

<template>
  <div class="h-full flex flex-col bg-bg-panel rounded-2xl border border-gold/10 overflow-hidden">
    <div class="px-5 py-4 border-b border-gold/10 flex items-center justify-between flex-shrink-0">
      <div class="flex items-center gap-2.5">
        <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Package class="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 class="text-base font-display text-indigo-200 leading-tight">Earring Storage & Gift</h2>
          <p class="text-[10px] text-ivory-muted/60">耳饰收纳 · 赠礼规划 · 智能提醒</p>
        </div>
      </div>
      <div class="flex items-center gap-1.5">
        <div
          class="flex items-center gap-1 px-2 py-1 rounded-lg bg-pink-500/10 text-pink-300 text-[10px] border border-pink-500/20"
          :title="`${favoriteCount}个收藏`"
        >
          <Heart class="w-3 h-3 fill-pink-400" />
          {{ favoriteCount }}
        </div>
        <div
          class="flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-500/10 text-rose-300 text-[10px] border border-rose-500/20"
          :title="`${giftReadyCount}个可送礼`"
        >
          <Gift class="w-3 h-3" />
          {{ giftReadyCount }}
        </div>
        <div
          class="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/10 text-amber-300 text-[10px] border border-amber-500/20"
          :title="`${unpairedCount}个单只`"
        >
          <AlertCircle class="w-3 h-3" />
          {{ unpairedCount }}
        </div>
        <button
          @click="showReminderPanel = !showReminderPanel"
          :class="[
            'p-2 rounded-lg transition-colors relative',
            showReminderPanel ? 'bg-indigo-500/20 text-indigo-300' : 'bg-white/5 hover:bg-white/10 text-ivory-muted',
          ]"
          :title="`${reminders.length}条提醒`"
        >
          <CalendarClock class="w-4 h-4" />
          <span
            v-if="reminders.length > 0"
            class="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] flex items-center justify-center font-medium"
          >
            {{ reminders.length }}
          </span>
        </button>
      </div>
    </div>

    <StorageReminderPanel
      v-if="showReminderPanel"
      :reminders="reminders"
      @mark-worn="markWornToday"
      @select-card="handleSelectCard"
    />

    <div class="px-4 py-3 border-b border-white/5 flex items-center gap-2 flex-wrap flex-shrink-0 bg-bg-secondary/30">
      <div class="relative flex-1 min-w-[160px]">
        <Search class="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-ivory-muted/50" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索名称/收纳盒/备注..."
          class="w-full pl-8 pr-3 py-2 rounded-lg bg-bg-secondary/60 border border-white/10 focus:border-indigo-500/50 focus:outline-none text-ivory text-xs transition-colors"
        />
      </div>

      <div class="flex items-center gap-1.5">
        <button
          @click="expandedFilters = !expandedFilters"
          :class="[
            'p-2 rounded-lg transition-colors flex items-center gap-1',
            expandedFilters || filterField !== 'all'
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
              : 'bg-white/5 hover:bg-white/10 text-ivory-muted border border-white/10',
          ]"
        >
          <Filter class="w-3.5 h-3.5" />
        </button>
        <select
          v-if="expandedFilters"
          v-model="filterField"
          class="px-2.5 py-2 rounded-lg bg-bg-secondary/60 border border-white/10 focus:border-indigo-500/50 focus:outline-none text-ivory text-xs"
        >
          <option value="all">全部</option>
          <option value="scene">场景</option>
          <option value="budget">预算</option>
          <option value="risk">风险等级</option>
          <option value="festival">节日</option>
          <option value="isPaired">是否成对</option>
          <option value="suitableForGift">适合送礼</option>
          <option value="isFavorite">已收藏</option>
        </select>
        <select
          v-if="expandedFilters && filterField !== 'all'"
          v-model="filterValue"
          class="px-2.5 py-2 rounded-lg bg-bg-secondary/60 border border-white/10 focus:border-indigo-500/50 focus:outline-none text-ivory text-xs"
        >
          <option value="">选择筛选值</option>
          <option v-for="opt in filterValueOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
        <button
          v-if="expandedFilters && (filterField !== 'all' || filterValue)"
          @click="filterField = 'all'; filterValue = ''"
          class="px-2 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-ivory-muted text-xs transition-colors"
        >
          <X class="w-3.5 h-3.5" />
        </button>
      </div>

      <div class="flex items-center gap-1 ml-auto">
        <div class="flex bg-bg-secondary/60 rounded-lg p-0.5 border border-white/10">
          <button
            @click="viewMode = 'card'"
            :class="[
              'p-1.5 rounded-md transition-colors',
              viewMode === 'card' ? 'bg-indigo-500/30 text-indigo-200' : 'text-ivory-muted hover:text-ivory',
            ]"
            title="卡片视图"
          >
            <Grid3X3 class="w-3.5 h-3.5" />
          </button>
          <button
            @click="viewMode = 'list'"
            :class="[
              'p-1.5 rounded-md transition-colors',
              viewMode === 'list' ? 'bg-indigo-500/30 text-indigo-200' : 'text-ivory-muted hover:text-ivory',
            ]"
            title="列表视图"
          >
            <List class="w-3.5 h-3.5" />
          </button>
        </div>
        <button
          @click="addEmptyCard"
          class="px-3 py-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white text-xs font-medium flex items-center gap-1.5 shadow-lg shadow-indigo-500/20 transition-all"
        >
          <Plus class="w-3.5 h-3.5" />
          添加
        </button>
        <button
          @click="addFromSchemes"
          class="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-ivory-muted hover:text-ivory text-xs flex items-center gap-1.5 border border-white/10 transition-colors"
          title="从历史方案/保养计划生成"
        >
          <Layers class="w-3.5 h-3.5" />
          历史生成
        </button>
      </div>
    </div>

    <div class="flex-1 min-h-0 overflow-y-auto p-4">
      <div v-if="filteredCards.length === 0" class="h-full flex flex-col items-center justify-center text-center py-12">
        <div class="w-20 h-20 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-4 border border-indigo-500/20">
          <Package class="w-10 h-10 text-indigo-300/50" />
        </div>
        <p class="text-sm text-ivory-muted mb-1">暂无收纳卡片</p>
        <p class="text-xs text-ivory-muted/50 mb-4">点击右上角"添加"或"历史生成"开始规划</p>
        <div class="flex gap-2">
          <button
            @click="addEmptyCard"
            class="px-4 py-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white text-xs font-medium flex items-center gap-1.5 shadow-lg shadow-indigo-500/20 transition-all"
          >
            <Plus class="w-3.5 h-3.5" />
            手动添加
          </button>
          <button
            @click="addFromSchemes"
            class="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-ivory-muted hover:text-ivory text-xs flex items-center gap-1.5 border border-white/10 transition-colors"
          >
            <Layers class="w-3.5 h-3.5" />
            从历史生成
          </button>
        </div>
      </div>

      <div v-else-if="viewMode === 'card'" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        <div
          v-for="card in filteredCards"
          :key="card.id"
          @click="handleSelectCard(card.id)"
          :class="[
            'group relative rounded-xl border overflow-hidden cursor-pointer transition-all duration-200',
            selectedCardId === card.id
              ? 'border-indigo-400/50 bg-indigo-500/10 ring-2 ring-indigo-400/30 shadow-xl shadow-indigo-500/10'
              : 'border-white/10 bg-bg-secondary/50 hover:border-indigo-500/30 hover:bg-bg-secondary',
          ]"
        >
          <div class="absolute top-2 left-2 right-2 flex items-start justify-between z-10">
            <div class="flex items-center gap-1">
              <button
                v-if="card.isFavorite"
                @click="toggleFavorite(card.id, $event)"
                class="p-1 rounded-md bg-black/40 backdrop-blur-sm text-pink-400 hover:text-pink-300 transition-colors"
                title="取消收藏"
              >
                <Heart class="w-3 h-3 fill-pink-400" />
              </button>
              <span
                v-if="card.suitableForGift"
                class="px-1.5 py-0.5 rounded-md bg-rose-500/80 text-white text-[9px] font-medium flex items-center gap-0.5"
              >
                <Gift class="w-2.5 h-2.5" />
                赠礼
              </span>
            </div>
            <div class="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                @click="openScoreCard(card, $event)"
                class="p-1.5 rounded-md bg-black/40 backdrop-blur-sm text-ivory-muted hover:text-yellow-300 hover:bg-black/60 transition-colors"
                title="推荐评分"
              >
                <Sparkles class="w-3 h-3" />
              </button>
              <button
                @click="openEditPanel(card)"
                class="p-1.5 rounded-md bg-black/40 backdrop-blur-sm text-ivory-muted hover:text-indigo-300 hover:bg-black/60 transition-colors"
                title="编辑"
              >
                <Edit3 class="w-3 h-3" />
              </button>
              <button
                @click="startRename(card, $event)"
                class="p-1.5 rounded-md bg-black/40 backdrop-blur-sm text-ivory-muted hover:text-green-300 hover:bg-black/60 transition-colors"
                title="重命名"
              >
                <Pencil class="w-3 h-3" />
              </button>
              <button
                @click="copyCard(card.id, $event)"
                class="p-1.5 rounded-md bg-black/40 backdrop-blur-sm text-ivory-muted hover:text-blue-300 hover:bg-black/60 transition-colors"
                title="复制"
              >
                <Copy class="w-3 h-3" />
              </button>
              <button
                @click="exportCard(card, $event)"
                class="p-1.5 rounded-md bg-black/40 backdrop-blur-sm text-ivory-muted hover:text-emerald-300 hover:bg-black/60 transition-colors"
                title="导出建议卡"
              >
                <ImageDown class="w-3 h-3" />
              </button>
              <button
                @click="deleteCard(card.id, $event)"
                class="p-1.5 rounded-md bg-black/40 backdrop-blur-sm text-ivory-muted hover:text-rose-400 hover:bg-black/60 transition-colors"
                title="删除"
              >
                <Trash2 class="w-3 h-3" />
              </button>
            </div>
          </div>

          <div class="aspect-[4/5] bg-bg/50 flex items-center justify-center relative overflow-hidden">
            <img
              v-if="card.thumbnail"
              :src="card.thumbnail"
              :alt="card.name"
              class="w-full h-full object-cover"
            />
            <div
              v-else
              class="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-900/30 to-purple-900/30"
            >
              <Package class="w-12 h-12 text-indigo-300/30" />
            </div>
            <div
              class="absolute bottom-2 left-2 right-2 flex items-end justify-between gap-2"
            >
              <div class="flex items-center gap-1 flex-wrap">
                <span
                  v-if="card.storageBoxNumber"
                  class="px-1.5 py-0.5 rounded bg-black/50 backdrop-blur-sm text-white text-[9px] font-mono"
                >
                  📦 {{ card.storageBoxNumber }}
                </span>
                <span
                  v-if="card.scene"
                  class="px-1.5 py-0.5 rounded bg-indigo-500/60 text-white text-[9px]"
                >
                  {{ outfitSceneLabels[card.scene as OutfitScene] }}
                </span>
                <span
                  v-if="card.budgetRange"
                  class="px-1.5 py-0.5 rounded bg-emerald-500/60 text-white text-[9px]"
                >
                  💰{{ budgetRangeLabels[card.budgetRange as BudgetRange] }}
                </span>
              </div>
              <span
                :style="{
                  backgroundColor: riskLevelBgColors[getCardRisk(card)],
                  color: riskLevelColors[getCardRisk(card)],
                }"
                class="px-1.5 py-0.5 rounded text-[9px] font-medium"
              >
                {{ riskLevelLabels[getCardRisk(card)] }}
              </span>
            </div>
          </div>

          <div class="p-2.5">
            <div v-if="renameCardId === card.id" class="flex items-center gap-1 mb-1.5">
              <input
                v-model="renameInput"
                @keyup.enter="confirmRename"
                @keyup.esc="cancelRename"
                @blur="confirmRename"
                type="text"
                class="flex-1 px-2 py-1 rounded-md bg-bg border border-indigo-500/40 text-ivory text-xs focus:outline-none"
                autofocus
              />
              <button
                @click="confirmRename"
                class="p-1 rounded-md bg-green-500/20 text-green-300 hover:bg-green-500/30 transition-colors"
              >
                <CheckCircle2 class="w-3 h-3" />
              </button>
              <button
                @click="cancelRename"
                class="p-1 rounded-md bg-white/10 text-ivory-muted hover:bg-white/20 transition-colors"
              >
                <X class="w-3 h-3" />
              </button>
            </div>
            <h3
              v-else
              class="text-xs font-medium text-ivory truncate mb-1.5 group-hover:text-indigo-200 transition-colors"
              :title="card.name"
            >
              {{ card.isPaired ? '🎀 ' : '💠 ' }}{{ card.name }}
            </h3>
            <div class="flex items-center justify-between text-[10px] text-ivory-muted/70">
              <div class="flex items-center gap-2">
                <span
                  :class="card.isPaired ? 'text-green-400/80' : 'text-amber-400/80'"
                  :title="card.isPaired ? '成对' : '单只'"
                >
                  {{ card.isPaired ? '成对' : '单只' }}
                </span>
                <span class="text-ivory-muted/40">|</span>
                <span :title="`最后佩戴: ${formatDate(card.lastWornAt)}`">
                  {{ daysSince(card.lastWornAt) }}
                </span>
              </div>
              <div class="flex items-center gap-0.5">
                <span
                  v-for="f in card.festivalTags.slice(0, 2)"
                  :key="f"
                  class="text-rose-300/70"
                  :title="festivalTagLabels[f]"
                >
                  {{ festivalTagLabels[f as FestivalTag].slice(0, 2) }}
                </span>
                <span v-if="card.festivalTags.length > 2" class="text-ivory-muted/50">
                  +{{ card.festivalTags.length - 2 }}
                </span>
              </div>
            </div>
            <div v-if="card.giftRecipient || card.notes" class="mt-1.5 pt-1.5 border-t border-white/5 text-[10px]">
              <div v-if="card.giftRecipient" class="text-rose-300/80 truncate">
                🎯 {{ giftRecipientLabels[card.giftRecipient as keyof typeof giftRecipientLabels] }}
              </div>
              <div v-if="card.notes" class="text-ivory-muted/50 truncate" :title="card.notes">
                📝 {{ card.notes }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="space-y-2">
        <div
          v-for="card in filteredCards"
          :key="card.id"
          @click="handleSelectCard(card.id)"
          :class="[
            'group flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200',
            selectedCardId === card.id
              ? 'border-indigo-400/50 bg-indigo-500/10 ring-2 ring-indigo-400/30'
              : 'border-white/10 bg-bg-secondary/50 hover:border-indigo-500/30 hover:bg-bg-secondary',
          ]"
        >
          <div class="w-16 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-bg/50">
            <img
              v-if="card.thumbnail"
              :src="card.thumbnail"
              :alt="card.name"
              class="w-full h-full object-cover"
            />
            <div
              v-else
              class="w-full h-full flex items-center justify-center"
            >
              <Package class="w-6 h-6 text-indigo-300/30" />
            </div>
          </div>

          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <Heart
                v-if="card.isFavorite"
                class="w-3 h-3 text-pink-400 fill-pink-400 flex-shrink-0"
              />
              <Gift
                v-if="card.suitableForGift"
                class="w-3 h-3 text-rose-400 flex-shrink-0"
              />
              <h3
                v-if="renameCardId !== card.id"
                class="text-sm font-medium text-ivory truncate group-hover:text-indigo-200 transition-colors"
                :title="card.name"
              >
                {{ card.isPaired ? '🎀 ' : '💠 ' }}{{ card.name }}
              </h3>
              <div v-else class="flex items-center gap-1 flex-1 min-w-0">
                <input
                  v-model="renameInput"
                  @keyup.enter="confirmRename"
                  @keyup.esc="cancelRename"
                  @blur="confirmRename"
                  type="text"
                  class="flex-1 min-w-0 px-2 py-1 rounded-md bg-bg border border-indigo-500/40 text-ivory text-xs focus:outline-none"
                  autofocus
                />
              </div>
            </div>
            <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-ivory-muted/70">
              <span v-if="card.storageBoxNumber" class="flex items-center gap-0.5">
                📦 {{ card.storageBoxNumber }}
              </span>
              <span :class="card.isPaired ? 'text-green-400/80' : 'text-amber-400/80'">
                {{ card.isPaired ? '成对' : '单只' }}
              </span>
              <span v-if="card.scene" class="text-indigo-300/80">
                {{ outfitSceneLabels[card.scene as OutfitScene] }}
              </span>
              <span v-if="card.budgetRange" class="text-emerald-300/80">
                💰{{ budgetRangeLabels[card.budgetRange as BudgetRange] }}
              </span>
              <span>
                📅 {{ daysSince(card.lastWornAt) }}
              </span>
              <span
                :style="{
                  backgroundColor: riskLevelBgColors[getCardRisk(card)],
                  color: riskLevelColors[getCardRisk(card)],
                }"
                class="px-1.5 py-0.5 rounded"
              >
                {{ riskLevelLabels[getCardRisk(card)] }}
              </span>
              <span v-if="card.festivalTags.length > 0" class="text-rose-300/70">
                🎉 {{ card.festivalTags.map((f) => festivalTagLabels[f]).join('、') }}
              </span>
              <span v-if="card.giftRecipient" class="text-rose-300/80">
                🎯 {{ giftRecipientLabels[card.giftRecipient as keyof typeof giftRecipientLabels] }}
              </span>
            </div>
            <p v-if="card.notes" class="text-[10px] text-ivory-muted/50 truncate mt-0.5" :title="card.notes">
              📝 {{ card.notes }}
            </p>
          </div>

          <div class="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <button
              @click="markWornToday(card.id, $event)"
              class="p-1.5 rounded-lg bg-white/5 hover:bg-green-500/20 text-ivory-muted hover:text-green-300 transition-colors"
              title="标记今天佩戴"
            >
              <CheckCircle2 class="w-3.5 h-3.5" />
            </button>
            <button
              @click="openScoreCard(card, $event)"
              class="p-1.5 rounded-lg bg-white/5 hover:bg-yellow-500/20 text-ivory-muted hover:text-yellow-300 transition-colors"
              title="推荐评分"
            >
              <Sparkles class="w-3.5 h-3.5" />
            </button>
            <button
              @click="openEditPanel(card)"
              class="p-1.5 rounded-lg bg-white/5 hover:bg-indigo-500/20 text-ivory-muted hover:text-indigo-300 transition-colors"
              title="编辑"
            >
              <Edit3 class="w-3.5 h-3.5" />
            </button>
            <button
              @click="startRename(card, $event)"
              class="p-1.5 rounded-lg bg-white/5 hover:bg-green-500/20 text-ivory-muted hover:text-green-300 transition-colors"
              title="重命名"
            >
              <Pencil class="w-3.5 h-3.5" />
            </button>
            <button
              @click="copyCard(card.id, $event)"
              class="p-1.5 rounded-lg bg-white/5 hover:bg-blue-500/20 text-ivory-muted hover:text-blue-300 transition-colors"
              title="复制"
            >
              <Copy class="w-3.5 h-3.5" />
            </button>
            <button
              @click="exportCard(card, $event)"
              class="p-1.5 rounded-lg bg-white/5 hover:bg-emerald-500/20 text-ivory-muted hover:text-emerald-300 transition-colors"
              title="导出建议卡"
            >
              <ImageDown class="w-3.5 h-3.5" />
            </button>
            <button
              @click="deleteCard(card.id, $event)"
              class="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-ivory-muted hover:text-rose-400 transition-colors"
              title="删除"
            >
              <Trash2 class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="showEditPanel"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in"
        @click.self="showEditPanel = false"
      >
        <StorageCardEditPanel
          :card-id="editingCardId"
          @done="handleEditDone"
          @open-maintenance="emit('open-maintenance'); showEditPanel = false"
        />
      </div>

      <div
        v-if="showScoreCard && selectedCardId"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in"
        @click.self="showScoreCard = false"
      >
        <StorageScoreCard
          :card-id="selectedCardId"
          @close="showScoreCard = false"
          @edit="() => { openEditPanel(); showScoreCard = false }"
          @export-card="(card: StorageCard) => emit('export-card', card)"
        />
      </div>

      <div
        v-if="showAddFromHistory"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in"
        @click.self="showAddFromHistory = false"
      >
        <div class="bg-bg-panel rounded-2xl border border-indigo-500/20 w-full max-w-2xl max-h-[80vh] flex flex-col animate-fade-in shadow-2xl">
          <div class="px-5 py-4 border-b border-gold/10 flex items-center justify-between flex-shrink-0">
            <h3 class="text-base font-display text-indigo-200 flex items-center gap-2">
              <Layers class="w-5 h-5" />
              从历史方案 / 保养计划生成收纳卡
            </h3>
            <button
              @click="showAddFromHistory = false"
              class="p-1.5 rounded-lg hover:bg-white/10 text-ivory-muted transition-colors"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
          <div class="flex-1 min-h-0 overflow-y-auto p-5 space-y-6">
            <div>
              <h4 class="text-sm font-medium text-ivory mb-3 flex items-center gap-1.5">
                <Star class="w-3.5 h-3.5 text-gold" />
                从已保存方案生成（{{ store.schemes.length }}个）
              </h4>
              <div v-if="store.schemes.length === 0" class="text-xs text-ivory-muted/50 py-4 text-center border border-dashed border-white/10 rounded-xl">
                暂无已保存的试戴方案
              </div>
              <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                <div
                  v-for="scheme in store.schemes"
                  :key="scheme.id"
                  @click="addFromScheme(scheme.id)"
                  class="group rounded-lg border border-white/10 bg-bg-secondary/50 hover:border-indigo-500/40 hover:bg-indigo-500/10 overflow-hidden cursor-pointer transition-all"
                >
                  <div class="aspect-square bg-bg/50">
                    <img v-if="scheme.thumbnail" :src="scheme.thumbnail" class="w-full h-full object-cover" />
                    <div v-else class="w-full h-full flex items-center justify-center">
                      <Package class="w-8 h-8 text-indigo-300/30" />
                    </div>
                  </div>
                  <div class="p-2">
                    <p class="text-[11px] text-ivory truncate group-hover:text-indigo-200 transition-colors">
                      {{ scheme.name }}
                    </p>
                    <p class="text-[9px] text-ivory-muted/50 mt-0.5">
                      {{ new Date(scheme.createdAt).toLocaleDateString('zh-CN') }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 class="text-sm font-medium text-ivory mb-3 flex items-center gap-1.5">
                <Sparkles class="w-3.5 h-3.5 text-emerald-400" />
                从保养计划生成（{{ store.materialInfoList.length }}个）
              </h4>
              <div v-if="store.materialInfoList.length === 0" class="text-xs text-ivory-muted/50 py-4 text-center border border-dashed border-white/10 rounded-xl">
                暂无保养计划中的材质信息
              </div>
              <div v-else class="space-y-1.5">
                <div
                  v-for="mat in store.materialInfoList"
                  :key="mat.id"
                  @click="addFromMaterial(mat.id)"
                  class="group flex items-center gap-3 p-2.5 rounded-lg border border-white/10 bg-bg-secondary/50 hover:border-emerald-500/40 hover:bg-emerald-500/10 cursor-pointer transition-all"
                >
                  <div class="w-10 h-10 rounded-md overflow-hidden bg-bg/50 flex-shrink-0">
                    <img v-if="mat.thumbnail" :src="mat.thumbnail" class="w-full h-full object-cover" />
                    <div v-else class="w-full h-full flex items-center justify-center">
                      <Package class="w-5 h-5 text-emerald-300/30" />
                    </div>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-xs text-ivory truncate group-hover:text-emerald-200 transition-colors">
                      {{ mat.name }}
                    </p>
                    <p class="text-[10px] text-ivory-muted/60 mt-0.5">
                      {{ materialTypeLabels[mat.mainMaterial] }} · {{ weightRangeLabels[mat.weightRange] }}
                    </p>
                  </div>
                  <ChevronRight class="w-4 h-4 text-ivory-muted/40 group-hover:text-emerald-300 transition-colors" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
