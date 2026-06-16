<script setup lang="ts">
import { computed } from 'vue'
import { useEarringStore } from '@/stores/useEarringStore'
import type { MaintenancePlan } from '@/types'
import { planTypeLabels, planStatusLabels } from '@/types'
import {
  CheckCircle2,
  Clock,
  ChevronRight,
  CalendarClock,
  ListTodo,
} from 'lucide-vue-next'

const emit = defineEmits<{
  (e: 'view-plan', plan: MaintenancePlan): void
  (e: 'view-all'): void
}>()

const store = useEarringStore()

const todayPlans = computed(() => store.getTodayPlans())
const upcomingPlans = computed(() => store.getUpcomingPlans(3))

const typeIcons: Record<string, string> = {
  wear: '👂',
  clean: '🧼',
  check: '🔍',
  repair: '🔧',
}

function getTypeColor(type: string): string {
  switch (type) {
    case 'wear':
      return 'text-blue-300 bg-blue-500/15'
    case 'clean':
      return 'text-emerald-300 bg-emerald-500/15'
    case 'check':
      return 'text-amber-300 bg-amber-500/15'
    case 'repair':
      return 'text-orange-300 bg-orange-500/15'
    default:
      return 'text-ivory-muted bg-white/10'
  }
}

function formatTime(time: string): string {
  return time
}

function handleComplete(plan: MaintenancePlan, e: Event) {
  e.stopPropagation()
  store.completeMaintenancePlan(plan.id)
}

function handleDelay(plan: MaintenancePlan, e: Event) {
  e.stopPropagation()
  store.delayMaintenancePlan(plan.id, 1)
}
</script>

<template>
  <div class="h-full flex flex-col bg-bg-panel rounded-xl border border-gold/10 overflow-hidden">
    <div class="px-4 py-3 border-b border-gold/10 flex items-center justify-between flex-shrink-0">
      <div class="flex items-center gap-2">
        <ListTodo class="w-4 h-4 text-gold-light" />
        <h3 class="text-sm font-display tracking-wider text-gold-light">今日待办</h3>
        <span class="text-[10px] px-1.5 py-0.5 rounded-full bg-gold/15 text-gold-light">
          {{ todayPlans.length }}
        </span>
      </div>
      <button
        @click="emit('view-all')"
        class="flex items-center gap-0.5 text-[10px] text-ivory-muted/60 hover:text-gold-light transition-colors"
      >
        查看全部
        <ChevronRight class="w-3 h-3" />
      </button>
    </div>

    <div class="flex-1 overflow-y-auto p-3 space-y-2">
      <div v-if="todayPlans.length === 0" class="h-full flex flex-col items-center justify-center text-center py-8">
        <div class="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-2">
          <CalendarClock class="w-5 h-5 text-ivory-muted/40" />
        </div>
        <p class="text-xs text-ivory-muted/60 mb-1">今日暂无待办</p>
        <p class="text-[10px] text-ivory-muted/40">添加计划开始保养管理</p>
      </div>

      <template v-else>
        <div
          v-for="plan in todayPlans.slice(0, 5)"
          :key="plan.id"
          @click="emit('view-plan', plan)"
          class="group p-2.5 rounded-lg border border-white/5 bg-bg-secondary/30 hover:border-gold/30 hover:bg-white/5 transition-all cursor-pointer"
        >
          <div class="flex items-start gap-2">
            <div
              :class="[
                'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm',
                getTypeColor(plan.type),
              ]"
            >
              {{ typeIcons[plan.type] }}
            </div>

            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-1.5">
                <h4 class="text-xs font-medium text-ivory truncate group-hover:text-gold-light transition-colors">
                  {{ plan.title }}
                </h4>
              </div>
              <div class="flex items-center gap-2 mt-0.5">
                <span class="flex items-center gap-0.5 text-[10px] text-ivory-muted/60">
                  <Clock class="w-2.5 h-2.5" />
                  {{ formatTime(plan.time) }}
                </span>
                <span class="text-[9px] text-ivory-muted/40">
                  {{ planTypeLabels[plan.type] }}
                </span>
              </div>
            </div>

            <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                @click="handleComplete(plan, $event)"
                class="p-1 rounded hover:bg-green-500/20 text-green-400 transition-colors"
                title="完成"
              >
                <CheckCircle2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div v-if="plan.description" class="mt-1.5 text-[10px] text-ivory-muted/60 line-clamp-1">
            {{ plan.description }}
          </div>
        </div>

        <button
          v-if="todayPlans.length > 5"
          @click="emit('view-all')"
          class="w-full py-1.5 text-[10px] text-ivory-muted/60 hover:text-gold-light transition-colors text-center"
        >
          还有 {{ todayPlans.length - 5 }} 项待办...
        </button>
      </template>

      <div v-if="upcomingPlans.length > 0 && todayPlans.length > 0" class="pt-2 mt-2 border-t border-white/5">
        <p class="text-[10px] text-ivory-muted/50 mb-2 flex items-center gap-1">
          <Clock class="w-2.5 h-2.5" />
          即将到来
        </p>
        <div class="space-y-1.5">
          <div
            v-for="plan in upcomingPlans.filter(p => p.date !== store.formatDate(new Date())).slice(0, 3)"
            :key="plan.id"
            @click="emit('view-plan', plan)"
            class="flex items-center gap-2 p-1.5 rounded hover:bg-white/5 cursor-pointer transition-colors"
          >
            <span class="text-sm">{{ typeIcons[plan.type] }}</span>
            <span class="text-[10px] text-ivory-muted/70 flex-1 truncate">{{ plan.title }}</span>
            <span class="text-[9px] text-ivory-muted/40 flex-shrink-0">
              {{ new Date(plan.date).getMonth() + 1 }}/{{ new Date(plan.date).getDate() }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
