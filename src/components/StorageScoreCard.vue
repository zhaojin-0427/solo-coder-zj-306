<script setup lang="ts">
import { computed } from 'vue'
import { useEarringStore } from '@/stores/useEarringStore'
import type { StorageCard } from '@/types'
import {
  riskLevelLabels,
  riskLevelColors,
  riskLevelBgColors,
  giftRecipientLabels,
  festivalTagLabels,
} from '@/types'
import {
  Sparkles,
  X,
  Edit3,
  ImageDown,
  Package,
  Gift,
  Star,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Shield,
} from 'lucide-vue-next'

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  cardId: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'edit'): void
  (e: 'export-card', card: StorageCard): void
}>()

const store = useEarringStore()

const card = computed<StorageCard | null>(() =>
  store.storageCards.find((c) => c.id === props.cardId) || null
)

const scoreCard = computed(() => (card.value ? store.generateStorageScoreCard(card.value) : null))

function getScoreColor(score: number) {
  if (score >= 85) return '#4ade80'
  if (score >= 70) return '#facc15'
  if (score >= 50) return '#fb923c'
  return '#ef4444'
}

function getScoreBg(score: number) {
  if (score >= 85) return 'rgba(74, 222, 128, 0.15)'
  if (score >= 70) return 'rgba(250, 204, 21, 0.15)'
  if (score >= 50) return 'rgba(251, 146, 60, 0.15)'
  return 'rgba(239, 68, 68, 0.15)'
}

function getPriorityLabel(score: number) {
  if (score >= 80) return '极高优先'
  if (score >= 60) return '高优先'
  if (score >= 40) return '中优先'
  return '普通'
}

const suggestionIcon: Record<string, any> = {
  storage: Package,
  gift: Gift,
  wear: Star,
  care: Shield,
}

const priorityColor: Record<string, string> = {
  high: '#ef4444',
  medium: '#facc15',
  low: '#4ade80',
}
</script>

<template>
  <div
    v-if="card && scoreCard"
    class="bg-bg-panel rounded-2xl border border-indigo-500/20 w-full max-w-2xl max-h-[85vh] flex flex-col animate-fade-in shadow-2xl"
  >
    <div class="px-5 py-4 border-b border-gold/10 flex items-center justify-between flex-shrink-0">
      <h3 class="text-base font-display text-indigo-200 flex items-center gap-2">
        <Sparkles class="w-5 h-5" />
        智能推荐评分卡
      </h3>
      <div class="flex items-center gap-1.5">
        <button
          @click="emit('edit')"
          class="p-1.5 rounded-lg hover:bg-indigo-500/20 text-ivory-muted hover:text-indigo-300 transition-colors"
          title="编辑收纳卡"
        >
          <Edit3 class="w-4 h-4" />
        </button>
        <button
          @click="emit('export-card', card)"
          class="p-1.5 rounded-lg hover:bg-emerald-500/20 text-ivory-muted hover:text-emerald-300 transition-colors"
          title="导出建议卡"
        >
          <ImageDown class="w-4 h-4" />
        </button>
        <button
          @click="emit('close')"
          class="p-1.5 rounded-lg hover:bg-white/10 text-ivory-muted transition-colors"
        >
          <X class="w-4 h-4" />
        </button>
      </div>
    </div>

    <div class="flex-1 min-h-0 overflow-y-auto p-5 space-y-5">
      <div class="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
        <div class="w-20 h-24 rounded-lg overflow-hidden bg-bg/50 flex-shrink-0 border border-white/10">
          <img
            v-if="card.thumbnail"
            :src="card.thumbnail"
            class="w-full h-full object-cover"
          />
          <div v-else class="w-full h-full flex items-center justify-center">
            <Package class="w-8 h-8 text-indigo-300/30" />
          </div>
        </div>
        <div class="flex-1 min-w-0">
          <h4 class="text-lg font-medium text-ivory mb-1 truncate">{{ card.name }}</h4>
          <div class="flex flex-wrap gap-1.5 mb-2">
            <span
              v-if="card.isFavorite"
              class="px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300 text-[10px] flex items-center gap-0.5"
            >
              <Star class="w-2.5 h-2.5 fill-pink-400" />
              已收藏
            </span>
            <span
              v-if="card.isPaired"
              class="px-1.5 py-0.5 rounded bg-green-500/20 text-green-300 text-[10px]"
            >
              成对
            </span>
            <span
              v-else
              class="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px]"
            >
              单只
            </span>
            <span
              v-if="card.suitableForGift"
              class="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] flex items-center gap-0.5"
            >
              <Gift class="w-2.5 h-2.5" />
              可赠礼
            </span>
          </div>
          <p v-if="card.storageBoxNumber" class="text-xs text-ivory-muted/70">
            📦 收纳盒：{{ card.storageBoxNumber }}
          </p>
          <p class="text-xs text-ivory-muted/70">
            ⚠️ 风险等级：
            <span :style="{ color: riskLevelColors[scoreCard.riskLevel] }">
              {{ riskLevelLabels[scoreCard.riskLevel] }}
            </span>
          </p>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-3">
        <div
          class="p-4 rounded-xl bg-white/5 border border-white/10 text-center"
        >
          <div class="relative w-16 h-16 mx-auto mb-2">
            <svg class="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                stroke-width="6"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                :stroke="getScoreColor(scoreCard.storageScore)"
                stroke-width="6"
                stroke-linecap="round"
                :stroke-dasharray="`${(scoreCard.storageScore / 100) * 175.9} 175.9`"
              />
            </svg>
            <span
              class="absolute inset-0 flex items-center justify-center font-bold text-base"
              :style="{ color: getScoreColor(scoreCard.storageScore) }"
            >
              {{ scoreCard.storageScore }}
            </span>
          </div>
          <p class="text-xs text-ivory-muted">收纳完善度</p>
        </div>

        <div
          class="p-4 rounded-xl bg-white/5 border border-white/10 text-center"
        >
          <div class="relative w-16 h-16 mx-auto mb-2">
            <svg class="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                stroke-width="6"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                :stroke="getScoreColor(scoreCard.giftScore)"
                stroke-width="6"
                stroke-linecap="round"
                :stroke-dasharray="`${(scoreCard.giftScore / 100) * 175.9} 175.9`"
              />
            </svg>
            <span
              class="absolute inset-0 flex items-center justify-center font-bold text-base"
              :style="{ color: getScoreColor(scoreCard.giftScore) }"
            >
              {{ scoreCard.giftScore }}
            </span>
          </div>
          <p class="text-xs text-ivory-muted">赠礼适配度</p>
        </div>

        <div
          class="p-4 rounded-xl bg-white/5 border border-white/10 text-center"
        >
          <div class="relative w-16 h-16 mx-auto mb-2">
            <svg class="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                stroke-width="6"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                :stroke="getScoreColor(scoreCard.priorityScore)"
                stroke-width="6"
                stroke-linecap="round"
                :stroke-dasharray="`${(scoreCard.priorityScore / 100) * 175.9} 175.9`"
              />
            </svg>
            <span
              class="absolute inset-0 flex items-center justify-center font-bold text-base"
              :style="{ color: getScoreColor(scoreCard.priorityScore) }"
            >
              {{ scoreCard.priorityScore }}
            </span>
          </div>
          <p class="text-xs text-ivory-muted">{{ getPriorityLabel(scoreCard.priorityScore) }}</p>
        </div>
      </div>

      <div
        class="p-4 rounded-xl border"
        :style="{
          backgroundColor: riskLevelBgColors[scoreCard.riskLevel],
          borderColor: `${riskLevelColors[scoreCard.riskLevel]}30`,
        }"
      >
        <div class="flex items-center gap-2 mb-2">
          <AlertTriangle class="w-4 h-4" :style="{ color: riskLevelColors[scoreCard.riskLevel] }" />
          <span class="text-sm font-medium" :style="{ color: riskLevelColors[scoreCard.riskLevel] }">
            敏感风险：{{ riskLevelLabels[scoreCard.riskLevel] }}
          </span>
        </div>
        <p class="text-[11px] text-ivory-muted/70">
          根据材质、重量、耳针工艺综合评估，建议结合佩戴时长做好防护措施。
        </p>
      </div>

      <div>
        <div class="flex items-center gap-1.5 mb-3">
          <TrendingUp class="w-4 h-4 text-rose-300" />
          <span class="text-sm font-medium text-rose-200">赠礼推荐理由</span>
        </div>
        <div class="space-y-2">
          <div
            v-for="(reason, idx) in scoreCard.giftRecommendation.reasons"
            :key="idx"
            class="flex items-start gap-2 p-2.5 rounded-lg bg-rose-500/5 border border-rose-500/10"
          >
            <CheckCircle2 class="w-3.5 h-3.5 text-rose-400 flex-shrink-0 mt-0.5" />
            <p class="text-xs text-ivory/80">{{ reason }}</p>
          </div>
        </div>

        <div v-if="scoreCard.giftRecommendation.suitableRecipients.length > 0" class="mt-3">
          <p class="text-[11px] text-ivory-muted/60 mb-1.5">适合赠送对象：</p>
          <div class="flex flex-wrap gap-1">
            <span
              v-for="r in scoreCard.giftRecommendation.suitableRecipients"
              :key="r"
              class="px-2 py-0.5 rounded bg-rose-500/15 text-rose-200 text-[10px] border border-rose-500/20"
            >
              {{ giftRecipientLabels[r] }}
            </span>
          </div>
        </div>

        <div v-if="scoreCard.giftRecommendation.suitableFestivals.length > 0" class="mt-2">
          <p class="text-[11px] text-ivory-muted/60 mb-1.5">适合节日场景：</p>
          <div class="flex flex-wrap gap-1">
            <span
              v-for="f in scoreCard.giftRecommendation.suitableFestivals"
              :key="f"
              class="px-2 py-0.5 rounded bg-amber-500/15 text-amber-200 text-[10px] border border-amber-500/20"
            >
              {{ festivalTagLabels[f] }}
            </span>
          </div>
        </div>

        <div v-if="scoreCard.giftRecommendation.suggestions.length > 0" class="mt-3">
          <p class="text-[11px] text-ivory-muted/60 mb-1.5">赠礼贴心建议：</p>
          <div class="space-y-1">
            <p
              v-for="(s, idx) in scoreCard.giftRecommendation.suggestions"
              :key="idx"
              class="text-[11px] text-ivory-muted/70 pl-2 border-l-2 border-rose-500/30"
            >
              {{ s }}
            </p>
          </div>
        </div>
      </div>

      <div>
        <div class="flex items-center gap-1.5 mb-3">
          <Package class="w-4 h-4 text-indigo-300" />
          <span class="text-sm font-medium text-indigo-200">收纳与佩戴建议</span>
        </div>
        <div class="space-y-2">
          <div
            v-for="(suggestion, idx) in scoreCard.storageSuggestions"
            :key="idx"
            class="p-3 rounded-lg bg-white/5 border border-white/10"
          >
            <div class="flex items-center gap-2 mb-1">
              <component
                :is="suggestionIcon[suggestion.category] || Package"
                class="w-3.5 h-3.5"
                :style="{ color: priorityColor[suggestion.priority] }"
              />
              <span class="text-xs font-medium text-ivory">{{ suggestion.title }}</span>
              <span
                class="ml-auto px-1.5 py-0.5 rounded text-[9px] font-medium"
                :style="{
                  backgroundColor: `${priorityColor[suggestion.priority]}20`,
                  color: priorityColor[suggestion.priority],
                }"
              >
                {{ suggestion.priority === 'high' ? '高' : suggestion.priority === 'medium' ? '中' : '低' }}
              </span>
            </div>
            <p class="text-[11px] text-ivory-muted/70 pl-5.5">{{ suggestion.content }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="px-5 py-4 border-t border-gold/10 flex items-center justify-end gap-2 flex-shrink-0">
      <button
        @click="emit('close')"
        class="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-ivory-muted text-sm transition-colors"
      >
        关闭
      </button>
      <button
        @click="emit('export-card', card)"
        class="px-4 py-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white text-sm font-medium flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all"
      >
        <ImageDown class="w-4 h-4" />
        导出建议卡
      </button>
    </div>
  </div>
</template>
