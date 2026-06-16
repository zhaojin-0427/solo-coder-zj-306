<script setup lang="ts">
import type { StorageReminder } from '@/types'
import { festivalTagLabels } from '@/types'
import {
  CalendarClock,
  CheckCircle2,
  Sparkles,
  Droplets,
  Gift,
  Package,
} from 'lucide-vue-next'

defineOptions({ inheritAttrs: false })

defineProps<{
  reminders: StorageReminder[]
}>()

const emit = defineEmits<{
  (e: 'mark-worn', cardId: string): void
  (e: 'select-card', cardId: string): void
}>()

function getReminderIcon(type: StorageReminder['type']) {
  switch (type) {
    case 'wear':
      return Sparkles
    case 'clean':
      return Droplets
    case 'gift':
    case 'festival':
      return Gift
    default:
      return CalendarClock
  }
}

function getReminderColor(type: StorageReminder['type']) {
  switch (type) {
    case 'wear':
      return { text: '#facc15', bg: 'rgba(250, 204, 21, 0.1)', border: 'rgba(250, 204, 21, 0.2)' }
    case 'clean':
      return { text: '#60a5fa', bg: 'rgba(96, 165, 250, 0.1)', border: 'rgba(96, 165, 250, 0.2)' }
    case 'gift':
    case 'festival':
      return { text: '#f472b6', bg: 'rgba(244, 114, 182, 0.1)', border: 'rgba(244, 114, 182, 0.2)' }
    default:
      return { text: '#a78bfa', bg: 'rgba(167, 139, 250, 0.1)', border: 'rgba(167, 139, 250, 0.2)' }
  }
}

function formatDateStr(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diff = Math.round((target.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))
  if (diff === 0) return '今天'
  if (diff === 1) return '明天'
  if (diff === -1) return '昨天'
  if (diff > 0 && diff < 30) return `${diff}天后`
  if (diff < 0 && diff > -30) return `${Math.abs(diff)}天前`
  return dateStr
}
</script>

<template>
  <div class="border-b border-white/5 flex-shrink-0 bg-indigo-500/5">
    <div class="px-4 py-2.5 flex items-center justify-between">
      <div class="flex items-center gap-1.5">
        <CalendarClock class="w-3.5 h-3.5 text-indigo-300" />
        <span class="text-xs font-medium text-indigo-200">近期提醒（30天内）</span>
        <span
          v-if="reminders.length > 0"
          class="px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[9px] font-medium"
        >
          {{ reminders.length }}
        </span>
      </div>
    </div>

    <div v-if="reminders.length === 0" class="px-4 pb-3">
      <div class="py-4 text-center rounded-xl bg-white/3 border border-dashed border-white/10">
        <Package class="w-6 h-6 text-ivory-muted/30 mx-auto mb-1" />
        <p class="text-[10px] text-ivory-muted/50">暂无提醒</p>
      </div>
    </div>

    <div v-else class="px-4 pb-3 space-y-1.5 max-h-[200px] overflow-y-auto">
      <div
        v-for="reminder in reminders"
        :key="reminder.id"
        class="group p-2.5 rounded-lg border transition-all cursor-pointer hover:scale-[1.01]"
        :style="{
          backgroundColor: getReminderColor(reminder.type).bg,
          borderColor: getReminderColor(reminder.type).border,
        }"
        @click="emit('select-card', reminder.cardId)"
      >
        <div class="flex items-start gap-2">
          <div
            class="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            :style="{ backgroundColor: getReminderColor(reminder.type).bg }"
          >
            <component
              :is="getReminderIcon(reminder.type)"
              class="w-3.5 h-3.5"
              :style="{ color: getReminderColor(reminder.type).text }"
            />
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-0.5">
              <span class="text-[11px] font-medium text-ivory truncate">{{ reminder.title }}</span>
              <span
                class="px-1 py-0.5 rounded text-[9px] flex-shrink-0"
                :style="{
                  backgroundColor: getReminderColor(reminder.type).bg,
                  color: getReminderColor(reminder.type).text,
                }"
              >
                {{ formatDateStr(reminder.targetDate) }}
              </span>
            </div>
            <p class="text-[10px] text-ivory-muted/70 line-clamp-2">{{ reminder.content }}</p>
            <div v-if="reminder.festivalTag" class="mt-1 flex items-center gap-1">
              <span class="px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-200 text-[9px]">
                {{ festivalTagLabels[reminder.festivalTag] }}
              </span>
            </div>
          </div>
          <button
            v-if="reminder.type === 'wear'"
            @click.stop="emit('mark-worn', reminder.cardId)"
            class="p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-green-500/20 text-ivory-muted hover:text-green-300 transition-all"
            title="标记今天已佩戴"
          >
            <CheckCircle2 class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
