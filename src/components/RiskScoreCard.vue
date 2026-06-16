<script setup lang="ts">
import { computed } from 'vue'
import type { RiskAssessment } from '@/types'
import { riskLevelLabels, riskLevelColors, riskLevelBgColors } from '@/types'
import { AlertTriangle, Shield, Info } from 'lucide-vue-next'

const props = defineProps<{
  risk: RiskAssessment
  compact?: boolean
}>()

const scoreColor = computed(() => riskLevelColors[props.risk.level])
const scoreBgColor = computed(() => riskLevelBgColors[props.risk.level])

const strokeDashoffset = computed(() => {
  const circumference = 2 * Math.PI * 40
  return circumference - (props.risk.score / 100) * circumference
})
</script>

<template>
  <div
    :class="[
      'rounded-xl border transition-all',
      compact ? 'p-3' : 'p-4',
      'border-white/10 bg-bg-panel/80',
    ]"
  >
    <div class="flex items-center gap-3">
      <div class="relative flex-shrink-0">
        <svg :width="compact ? 60 : 80" :height="compact ? 60 : 80" class="transform -rotate-90">
          <circle
            :cx="compact ? 30 : 40"
            :cy="compact ? 30 : 40"
            :r="compact ? 25 : 35"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            :stroke-width="compact ? 5 : 7"
          />
          <circle
            :cx="compact ? 30 : 40"
            :cy="compact ? 30 : 40"
            :r="compact ? 25 : 35"
            fill="none"
            :stroke="scoreColor"
            :stroke-width="compact ? 5 : 7"
            stroke-linecap="round"
            :stroke-dasharray="compact ? 157 : 220"
            :stroke-dashoffset="compact ? strokeDashoffset * 0.625 : strokeDashoffset"
          />
        </svg>
        <div class="absolute inset-0 flex flex-col items-center justify-center">
          <span
            :class="[
              'font-bold font-display',
              compact ? 'text-lg' : 'text-2xl',
            ]"
            :style="{ color: scoreColor }"
          >
            {{ risk.score }}
          </span>
          <span v-if="!compact" class="text-[9px] text-ivory-muted/60">过敏风险</span>
        </div>
      </div>

      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-1.5 mb-1">
          <AlertTriangle v-if="risk.level === 'high' || risk.level === 'very-high'" class="w-3.5 h-3.5 text-orange-400" />
          <Shield v-else class="w-3.5 h-3.5 text-green-400" />
          <span
            class="text-xs font-medium"
            :style="{ color: scoreColor }"
          >
            {{ riskLevelLabels[risk.level] }}
          </span>
        </div>
        <p v-if="!compact && risk.warnings.length > 0" class="text-[10px] text-ivory-muted/70 line-clamp-2">
          {{ risk.warnings[0] }}
        </p>
        <p v-if="!compact && risk.warnings.length === 0" class="text-[10px] text-ivory-muted/70">
          材质安全，可放心佩戴
        </p>
      </div>
    </div>

    <div v-if="!compact" class="mt-3 pt-3 border-t border-white/5">
      <div class="flex items-center gap-1 mb-2">
        <Info class="w-3 h-3 text-ivory-muted/50" />
        <span class="text-[10px] text-ivory-muted/60">风险构成</span>
      </div>
      <div class="space-y-1.5">
        <div
          v-for="factor in risk.factors.slice(0, 4)"
          :key="factor.name"
          class="flex items-center gap-2"
        >
          <span class="text-[10px] text-ivory-muted/60 w-16 flex-shrink-0">{{ factor.name }}</span>
          <div class="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div
              class="h-full rounded-full transition-all"
              :style="{
                width: `${factor.score}%`,
                backgroundColor: factor.score >= 50 ? '#fb923c' : factor.score >= 25 ? '#facc15' : '#4ade80',
              }"
            />
          </div>
          <span class="text-[10px] text-ivory-muted/50 w-7 text-right">{{ factor.score }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
