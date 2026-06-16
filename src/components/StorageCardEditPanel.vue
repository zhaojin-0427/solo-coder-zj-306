<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useEarringStore } from '@/stores/useEarringStore'
import type {
  StorageCard,
  GiftRecipient,
  BudgetRange,
  FestivalTag,
  OutfitScene,
} from '@/types'
import {
  giftRecipientLabels,
  budgetRangeLabels,
  festivalTagLabels,
  outfitSceneLabels,
  materialTypeLabels,
  weightRangeLabels,
} from '@/types'
import {
  Package,
  X,
  Save,
  Heart,
  Gift,
  Calendar,
  Box,
  Sparkles,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
} from 'lucide-vue-next'

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  cardId: string | null
}>()

const emit = defineEmits<{
  (e: 'done'): void
  (e: 'open-maintenance'): void
}>()

const store = useEarringStore()

const isNew = computed(() => !props.cardId)

const existingCard = computed<StorageCard | null>(() =>
  props.cardId ? store.storageCards.find((c) => c.id === props.cardId) || null : null
)

const name = ref('')
const storageBoxNumber = ref('')
const isPaired = ref(true)
const suitableForGift = ref(false)
const giftRecipient = ref<GiftRecipient | ''>('')
const budgetRange = ref<BudgetRange | ''>('')
const festivalTags = ref<FestivalTag[]>([])
const scene = ref<OutfitScene | ''>('')
const notes = ref('')
const lastWornAt = ref<number | null>(null)
const expandedMaterial = ref(false)

watch(
  existingCard,
  (card) => {
    if (card) {
      name.value = card.name
      storageBoxNumber.value = card.storageBoxNumber
      isPaired.value = card.isPaired
      suitableForGift.value = card.suitableForGift
      giftRecipient.value = card.giftRecipient
      budgetRange.value = card.budgetRange
      festivalTags.value = [...card.festivalTags]
      scene.value = card.scene
      notes.value = card.notes
      lastWornAt.value = card.lastWornAt
    } else {
      name.value = ''
      storageBoxNumber.value = ''
      isPaired.value = true
      suitableForGift.value = false
      giftRecipient.value = ''
      budgetRange.value = ''
      festivalTags.value = []
      scene.value = ''
      notes.value = ''
      lastWornAt.value = null
    }
  },
  { immediate: true }
)

const materialInfo = computed(() =>
  existingCard.value?.materialInfoId
    ? store.materialInfoList.find((m) => m.id === existingCard.value?.materialInfoId) || null
    : null
)

const festivalOptions: FestivalTag[] = [
  'spring-festival',
  'valentines',
  'womens-day',
  'mothers-day',
  'dragon-boat',
  'qixi',
  'mid-autumn',
  'teachers-day',
  'national-day',
  'christmas',
  'new-year',
  'birthday',
  'anniversary',
  'graduation',
  'housewarming',
  'thank-you',
  'other',
]

function toggleFestival(tag: FestivalTag) {
  const idx = festivalTags.value.indexOf(tag)
  if (idx >= 0) {
    festivalTags.value.splice(idx, 1)
  } else {
    festivalTags.value.push(tag)
  }
}

function setLastWornToday() {
  lastWornAt.value = Date.now()
}

function clearLastWorn() {
  lastWornAt.value = null
}

function handleSave() {
  if (!name.value.trim()) {
    alert('请输入收纳卡名称')
    return
  }
  if (existingCard.value) {
    store.updateStorageCard(existingCard.value.id, {
      name: name.value.trim(),
      storageBoxNumber: storageBoxNumber.value.trim(),
      isPaired: isPaired.value,
      suitableForGift: suitableForGift.value,
      giftRecipient: giftRecipient.value,
      budgetRange: budgetRange.value,
      festivalTags: festivalTags.value,
      scene: scene.value,
      notes: notes.value.trim(),
      lastWornAt: lastWornAt.value,
    })
  }
  emit('done')
}

function formatDate(ts: number | null) {
  if (!ts) return '未记录'
  return new Date(ts).toLocaleDateString('zh-CN')
}
</script>

<template>
  <div class="bg-bg-panel rounded-2xl border border-indigo-500/20 w-full max-w-2xl max-h-[85vh] flex flex-col animate-fade-in shadow-2xl">
    <div class="px-5 py-4 border-b border-gold/10 flex items-center justify-between flex-shrink-0">
      <h3 class="text-base font-display text-indigo-200 flex items-center gap-2">
        <Package class="w-5 h-5" />
        {{ isNew ? '新增收纳卡' : '编辑收纳卡' }}
      </h3>
      <button
        @click="emit('done')"
        class="p-1.5 rounded-lg hover:bg-white/10 text-ivory-muted transition-colors"
      >
        <X class="w-4 h-4" />
      </button>
    </div>

    <div class="flex-1 min-h-0 overflow-y-auto p-5 space-y-5">
      <div v-if="existingCard" class="flex items-start gap-4 p-3 rounded-xl bg-white/5 border border-white/10">
        <div class="w-16 h-20 rounded-lg overflow-hidden bg-bg/50 flex-shrink-0">
          <img
            v-if="existingCard.thumbnail"
            :src="existingCard.thumbnail"
            class="w-full h-full object-cover"
          />
          <div v-else class="w-full h-full flex items-center justify-center">
            <Package class="w-6 h-6 text-indigo-300/30" />
          </div>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-xs text-ivory-muted/60 mb-0.5">耳饰缩略图</p>
          <p class="text-sm text-ivory font-medium">{{ existingCard.name }}</p>
          <p v-if="materialInfo" class="text-[10px] text-ivory-muted/50 mt-1">
            {{ materialTypeLabels[materialInfo.mainMaterial] }} ·
            {{ weightRangeLabels[materialInfo.weightRange] }}
          </p>
        </div>
      </div>

      <div>
        <label class="block text-xs text-ivory-muted mb-1.5">
          <span class="text-rose-400">*</span> 收纳卡名称
        </label>
        <input
          v-model="name"
          type="text"
          placeholder="为这副耳饰起个名字"
          class="w-full px-3 py-2.5 rounded-lg bg-bg-secondary/60 border border-white/10 focus:border-indigo-500/50 focus:outline-none text-ivory text-sm transition-colors"
        />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-xs text-ivory-muted mb-1.5">
            <Box class="w-3 h-3 inline mr-1" />
            收纳盒编号
          </label>
          <input
            v-model="storageBoxNumber"
            type="text"
            placeholder="如：A-01、左层2号"
            class="w-full px-3 py-2.5 rounded-lg bg-bg-secondary/60 border border-white/10 focus:border-indigo-500/50 focus:outline-none text-ivory text-sm transition-colors"
          />
        </div>

        <div>
          <label class="block text-xs text-ivory-muted mb-1.5">使用场景</label>
          <select
            v-model="scene"
            class="w-full px-3 py-2.5 rounded-lg bg-bg-secondary/60 border border-white/10 focus:border-indigo-500/50 focus:outline-none text-ivory text-sm transition-colors"
          >
            <option value="">未标记</option>
            <option v-for="(label, val) in outfitSceneLabels" :key="val" :value="val">
              {{ label }}
            </option>
          </select>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="p-3 rounded-xl bg-white/5 border border-white/10">
          <label class="flex items-center justify-between cursor-pointer">
            <div class="flex items-center gap-2">
              <Heart class="w-4 h-4 text-pink-400/70" />
              <span class="text-sm text-ivory">成对耳饰</span>
            </div>
            <div
              :class="[
                'relative w-10 h-5.5 rounded-full transition-colors',
                isPaired ? 'bg-indigo-500/80' : 'bg-white/10',
              ]"
              @click="isPaired = !isPaired"
            >
              <div
                :class="[
                  'absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white transition-transform',
                  isPaired ? 'translate-x-5' : 'translate-x-0.5',
                ]"
              />
            </div>
          </label>
          <p class="text-[10px] text-ivory-muted/50 mt-1">
            {{ isPaired ? '左右耳完整配对' : '单只耳饰，注意单独收纳' }}
          </p>
        </div>

        <div class="p-3 rounded-xl bg-white/5 border border-white/10">
          <label class="flex items-center justify-between cursor-pointer">
            <div class="flex items-center gap-2">
              <Gift class="w-4 h-4 text-rose-400/70" />
              <span class="text-sm text-ivory">适合送礼</span>
            </div>
            <div
              :class="[
                'relative w-10 h-5.5 rounded-full transition-colors',
                suitableForGift ? 'bg-rose-500/80' : 'bg-white/10',
              ]"
              @click="suitableForGift = !suitableForGift"
            >
              <div
                :class="[
                  'absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white transition-transform',
                  suitableForGift ? 'translate-x-5' : 'translate-x-0.5',
                ]"
              />
            </div>
          </label>
          <p class="text-[10px] text-ivory-muted/50 mt-1">
            {{ suitableForGift ? '将在赠礼推荐中优先展示' : '仅作为个人收纳' }}
          </p>
        </div>
      </div>

      <div v-if="suitableForGift" class="space-y-4 p-4 rounded-xl bg-rose-500/5 border border-rose-500/15">
        <div class="flex items-center gap-1.5">
          <Sparkles class="w-4 h-4 text-rose-300" />
          <span class="text-xs font-medium text-rose-200">赠礼规划</span>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs text-ivory-muted mb-1.5">目标赠礼对象</label>
            <select
              v-model="giftRecipient"
              class="w-full px-3 py-2.5 rounded-lg bg-bg-secondary/60 border border-white/10 focus:border-rose-500/50 focus:outline-none text-ivory text-sm transition-colors"
            >
              <option value="">未指定</option>
              <option v-for="(label, val) in giftRecipientLabels" :key="val" :value="val">
                {{ label }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-xs text-ivory-muted mb-1.5">预算区间</label>
            <select
              v-model="budgetRange"
              class="w-full px-3 py-2.5 rounded-lg bg-bg-secondary/60 border border-white/10 focus:border-rose-500/50 focus:outline-none text-ivory text-sm transition-colors"
            >
              <option value="">未设置</option>
              <option v-for="(label, val) in budgetRangeLabels" :key="val" :value="val">
                {{ label }}
              </option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-xs text-ivory-muted mb-1.5">节日标签（可多选）</label>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="tag in festivalOptions"
              :key="tag"
              @click="toggleFestival(tag)"
              :class="[
                'px-2 py-1 rounded-md text-[11px] transition-all',
                festivalTags.includes(tag)
                  ? 'bg-rose-500/30 text-rose-200 border border-rose-500/40'
                  : 'bg-white/5 text-ivory-muted/70 border border-white/10 hover:bg-white/10',
              ]"
            >
              {{ festivalTagLabels[tag] }}
            </button>
          </div>
        </div>
      </div>

      <div class="p-3 rounded-xl bg-white/5 border border-white/10">
        <div class="flex items-center justify-between cursor-pointer" @click="expandedMaterial = !expandedMaterial">
          <div class="flex items-center gap-2">
            <Calendar class="w-4 h-4 text-indigo-300/70" />
            <span class="text-sm text-ivory">最后佩戴时间</span>
          </div>
          <ChevronDown v-if="!expandedMaterial" class="w-4 h-4 text-ivory-muted/50" />
          <ChevronUp v-else class="w-4 h-4 text-ivory-muted/50" />
        </div>

        <div v-if="expandedMaterial" class="mt-3 pt-3 border-t border-white/5 space-y-3">
          <div class="flex items-center gap-2">
            <span class="text-xs text-ivory-muted/70">当前：</span>
            <span class="text-xs text-ivory font-medium">{{ formatDate(lastWornAt) }}</span>
          </div>
          <div class="flex gap-2">
            <button
              @click="setLastWornToday"
              class="px-3 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 text-xs transition-colors border border-indigo-500/30"
            >
              标记今天佩戴
            </button>
            <button
              v-if="lastWornAt"
              @click="clearLastWorn"
              class="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-ivory-muted text-xs transition-colors"
            >
              清除记录
            </button>
            <button
              v-if="existingCard?.materialInfoId"
              @click="emit('open-maintenance')"
              class="ml-auto px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 text-xs transition-colors border border-emerald-500/30 flex items-center gap-1"
            >
              <ShieldAlert class="w-3 h-3" />
              打开保养详情
            </button>
          </div>
          <p v-if="materialInfo" class="text-[10px] text-ivory-muted/50">
            关联材质信息：{{ materialTypeLabels[materialInfo.mainMaterial] }} ·
            {{ weightRangeLabels[materialInfo.weightRange] }}
          </p>
        </div>
      </div>

      <div>
        <label class="block text-xs text-ivory-muted mb-1.5">备注</label>
        <textarea
          v-model="notes"
          rows="3"
          placeholder="记录关于这副耳饰的其他信息..."
          class="w-full px-3 py-2.5 rounded-lg bg-bg-secondary/60 border border-white/10 focus:border-indigo-500/50 focus:outline-none text-ivory text-sm transition-colors resize-none"
        />
      </div>
    </div>

    <div class="px-5 py-4 border-t border-gold/10 flex items-center justify-end gap-2 flex-shrink-0">
      <button
        @click="emit('done')"
        class="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-ivory-muted text-sm transition-colors"
      >
        取消
      </button>
      <button
        v-if="!isNew"
        @click="handleSave"
        class="px-4 py-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white text-sm font-medium flex items-center gap-1.5 shadow-lg shadow-indigo-500/20 transition-all"
      >
        <Save class="w-4 h-4" />
        保存修改
      </button>
    </div>
  </div>
</template>
