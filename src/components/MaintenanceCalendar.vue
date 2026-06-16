<script setup lang="ts">
import { ref, computed } from 'vue'
import { useEarringStore } from '@/stores/useEarringStore'
import type { EarringMaterialInfo, MaintenancePlan, PlanType, PlanStatus, RiskLevel, ViewMode } from '@/types'
import {
  materialTypeLabels,
  planTypeLabels,
  planStatusLabels,
  riskLevelLabels,
  riskLevelColors,
} from '@/types'
import RiskScoreCard from './RiskScoreCard.vue'
import MaterialInfoPanel from './MaterialInfoPanel.vue'
import PlanEditPanel from './PlanEditPanel.vue'
import TodayTodoPanel from './TodayTodoPanel.vue'
import {
  Calendar,
  List,
  Plus,
  Filter,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  ImageDown,
  Settings,
  Trash2,
  CheckCircle,
  Clock,
  Gem,
} from 'lucide-vue-next'

const emit = defineEmits<{
  (e: 'close'): void
}>()

const store = useEarringStore()

const viewMode = ref<ViewMode>('calendar')
const currentMonth = ref(new Date())

const filterMaterial = ref<string>('all')
const filterType = ref<string>('all')
const filterStatus = ref<string>('all')
const filterRisk = ref<string>('all')
const showFilters = ref(false)

const selectedMaterial = ref<EarringMaterialInfo | null>(null)
const showMaterialPanel = ref(false)
const isNewMaterial = ref(false)

const selectedPlan = ref<MaintenancePlan | null>(null)
const showPlanPanel = ref(false)
const isNewPlan = ref(false)

const todayStr = computed(() => store.formatDate(new Date()))

const firstDayOfMonth = computed(() => {
  return new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth(), 1)
})

const lastDayOfMonth = computed(() => {
  return new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() + 1, 0)
})

const calendarDays = computed(() => {
  const days: { date: string; day: number; isCurrentMonth: boolean; isToday: boolean }[] = []

  const firstDay = firstDayOfMonth.value
  const startDayOfWeek = firstDay.getDay()

  const startDate = new Date(firstDay)
  startDate.setDate(startDate.getDate() - startDayOfWeek)

  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    const dateStr = store.formatDate(date)
    days.push({
      date: dateStr,
      day: date.getDate(),
      isCurrentMonth: date.getMonth() === currentMonth.value.getMonth(),
      isToday: dateStr === todayStr.value,
    })
  }

  return days
})

const weekDays = ['日', '一', '二', '三', '四', '五', '六']

function getPlansForDate(date: string): MaintenancePlan[] {
  let plans = store.getPlansForDate(date)

  if (filterMaterial.value !== 'all') {
    plans = plans.filter((p) => p.materialInfoId === filterMaterial.value)
  }
  if (filterType.value !== 'all') {
    plans = plans.filter((p) => p.type === filterType.value)
  }
  if (filterStatus.value !== 'all') {
    plans = plans.filter((p) => p.status === filterStatus.value)
  }
  if (filterRisk.value !== 'all') {
    plans = plans.filter((p) => {
      const mat = store.getMaterialInfo(p.materialInfoId)
      if (!mat) return false
      const risk = store.assessRisk(mat)
      return risk.level === filterRisk.value
    })
  }

  return plans
}

const filteredPlans = computed(() => {
  const startDate = todayStr.value
  const endDate = store.addDays(startDate, 29)
  let plans = store.getPlansForDateRange(startDate, endDate)

  if (filterMaterial.value !== 'all') {
    plans = plans.filter((p) => p.materialInfoId === filterMaterial.value)
  }
  if (filterType.value !== 'all') {
    plans = plans.filter((p) => p.type === filterType.value)
  }
  if (filterStatus.value !== 'all') {
    plans = plans.filter((p) => p.status === filterStatus.value)
  }
  if (filterRisk.value !== 'all') {
    plans = plans.filter((p) => {
      const mat = store.getMaterialInfo(p.materialInfoId)
      if (!mat) return false
      const risk = store.assessRisk(mat)
      return risk.level === filterRisk.value
    })
  }

  return plans
})

function prevMonth() {
  currentMonth.value = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() - 1, 1)
}

function nextMonth() {
  currentMonth.value = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() + 1, 1)
}

function goToToday() {
  currentMonth.value = new Date()
}

const typeIcons: Record<string, string> = {
  wear: '👂',
  clean: '🧼',
  check: '🔍',
  repair: '🔧',
}

const typeColors: Record<string, string> = {
  wear: 'bg-blue-500/20 border-blue-500/30 text-blue-300',
  clean: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300',
  check: 'bg-amber-500/20 border-amber-500/30 text-amber-300',
  repair: 'bg-orange-500/20 border-orange-500/30 text-orange-300',
}

function openMaterialDetail(material: EarringMaterialInfo) {
  selectedMaterial.value = material
  isNewMaterial.value = false
  showMaterialPanel.value = true
}

function openNewMaterial() {
  selectedMaterial.value = null
  isNewMaterial.value = true
  showMaterialPanel.value = true
}

function closeMaterialPanel() {
  showMaterialPanel.value = false
  selectedMaterial.value = null
}

function handleMaterialSaved(info: EarringMaterialInfo) {
  selectedMaterial.value = info
  isNewMaterial.value = false
  // 可以选择是否自动生成计划
}

function handleMaterialDeleted() {
  closeMaterialPanel()
}

function openPlanDetail(plan: MaintenancePlan) {
  selectedPlan.value = plan
  isNewPlan.value = false
  showPlanPanel.value = true
}

function openNewPlan(materialInfoId?: string) {
  selectedPlan.value = null
  isNewPlan.value = true
  if (materialInfoId) {
    const mat = store.getMaterialInfo(materialInfoId)
    if (mat) {
      selectedMaterial.value = mat
    }
  }
  showPlanPanel.value = true
}

function closePlanPanel() {
  showPlanPanel.value = false
  selectedPlan.value = null
}

function handlePlanSaved() {
  // 计划已保存，状态会自动响应式更新
}

function exportReminderCard(materialId: string) {
  const dataUrl = store.exportMaterialReminderCard(materialId)
  if (dataUrl) {
    const link = document.createElement('a')
    const mat = store.getMaterialInfo(materialId)
    link.download = `材质保养提醒卡-${mat?.name || '未命名'}-${Date.now()}.png`
    link.href = dataUrl
    link.click()
  }
}

function getMaterialRisk(materialId: string) {
  const mat = store.getMaterialInfo(materialId)
  if (!mat) return null
  return store.assessRisk(mat)
}

const materialOptions = computed(() => {
  return store.materialInfoList.map((m) => ({ value: m.id, label: m.name }))
})

const typeOptions = [
  { value: 'all', label: '全部类型' },
  { value: 'wear', label: '佩戴计划' },
  { value: 'clean', label: '清洁提醒' },
  { value: 'check', label: '检查提醒' },
  { value: 'repair', label: '保养维修' },
]

const statusOptions = [
  { value: 'all', label: '全部状态' },
  { value: 'pending', label: '待完成' },
  { value: 'completed', label: '已完成' },
  { value: 'delayed', label: '已延期' },
]

const riskOptions = [
  { value: 'all', label: '全部风险' },
  { value: 'low', label: '低风险' },
  { value: 'medium', label: '中风险' },
  { value: 'high', label: '高风险' },
  { value: 'very-high', label: '极高风险' },
]

function groupPlansByDate(plans: MaintenancePlan[]) {
  const groups: Record<string, MaintenancePlan[]> = {}
  for (const plan of plans) {
    if (!groups[plan.date]) {
      groups[plan.date] = []
    }
    groups[plan.date].push(plan)
  }
  return groups
}

function formatDateLabel(dateStr: string) {
  const date = store.parseDate(dateStr)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  if (dateStr === store.formatDate(today)) {
    return '今天'
  } else if (dateStr === store.formatDate(tomorrow)) {
    return '明天'
  }

  const weekDayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${date.getMonth() + 1}月${date.getDate()}日 ${weekDayNames[date.getDay()]}`
}
</script>

<template>
  <div class="h-full flex flex-col bg-bg-panel/95 backdrop-blur-md rounded-xl border border-gold/20 overflow-hidden">
    <div class="px-5 py-3 border-b border-gold/10 flex items-center justify-between flex-shrink-0">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-gold to-rose flex items-center justify-center">
          <Gem class="w-4 h-4 text-bg" />
        </div>
        <div>
          <h2 class="text-base font-display tracking-wider text-gold-light">材质保养日历</h2>
          <p class="text-[10px] text-ivory-muted/60">过敏风险评估 · 保养计划管理</p>
        </div>
      </div>
      <button
        @click="emit('close')"
        class="p-1.5 rounded-lg hover:bg-white/10 text-ivory-muted transition-colors"
      >
        <X class="w-4 h-4" />
      </button>
    </div>

    <div class="flex-1 min-h-0 flex overflow-hidden">
      <div class="w-64 flex-shrink-0 border-r border-gold/10 flex flex-col overflow-hidden">
        <div class="p-3 border-b border-white/5">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-medium text-ivory">我的耳饰</span>
            <button
              @click="openNewMaterial"
              class="p-1 rounded hover:bg-gold/20 text-gold-light transition-colors"
              title="添加耳饰"
            >
              <Plus class="w-3.5 h-3.5" />
            </button>
          </div>

          <div class="space-y-1.5 max-h-64 overflow-y-auto">
            <div
              v-for="material in store.materialInfoList"
              :key="material.id"
              @click="openMaterialDetail(material)"
              :class="[
                'group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all',
                selectedMaterial?.id === material.id
                  ? 'bg-gold/15 border border-gold/30'
                  : 'hover:bg-white/5 border border-transparent',
              ]"
            >
              <div v-if="material.thumbnail" class="w-8 h-10 rounded overflow-hidden bg-black/30 flex-shrink-0">
                <img :src="material.thumbnail" :alt="material.name" class="w-full h-full object-cover" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-[11px] font-medium text-ivory truncate">{{ material.name }}</p>
                <p class="text-[9px] text-ivory-muted/60">
                  {{ materialTypeLabels[material.mainMaterial] }}
                </p>
              </div>
              <div
                v-if="getMaterialRisk(material.id)"
                class="w-2 h-2 rounded-full flex-shrink-0"
                :style="{ backgroundColor: riskLevelColors[getMaterialRisk(material.id)!.level] }"
              />
            </div>

            <div
              v-if="store.materialInfoList.length === 0"
              class="py-4 text-center"
            >
              <p class="text-[10px] text-ivory-muted/50">暂无耳饰材质信息</p>
              <button
                @click="openNewMaterial"
                class="mt-2 text-[10px] text-gold-light hover:underline"
              >
                立即添加
              </button>
            </div>
          </div>
        </div>

        <div class="flex-1 min-h-0 overflow-hidden">
          <TodayTodoPanel @view-plan="openPlanDetail" @view-all="viewMode = 'list'" />
        </div>
      </div>

      <div class="flex-1 min-w-0 flex flex-col overflow-hidden">
        <div class="px-4 py-2.5 border-b border-gold/10 flex items-center justify-between flex-shrink-0">
          <div class="flex items-center gap-2">
            <button
              @click="viewMode = 'calendar'"
              :class="[
                'px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5',
                viewMode === 'calendar'
                  ? 'bg-gold/20 text-gold-light border border-gold/30'
                  : 'bg-white/5 text-ivory-muted hover:text-ivory hover:bg-white/10 border border-transparent',
              ]"
            >
              <Calendar class="w-3.5 h-3.5" />
              日历视图
            </button>
            <button
              @click="viewMode = 'list'"
              :class="[
                'px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5',
                viewMode === 'list'
                  ? 'bg-gold/20 text-gold-light border border-gold/30'
                  : 'bg-white/5 text-ivory-muted hover:text-ivory hover:bg-white/10 border border-transparent',
              ]"
            >
              <List class="w-3.5 h-3.5" />
              列表视图
            </button>
          </div>

          <div class="flex items-center gap-2">
            <button
              @click="showFilters = !showFilters"
              :class="[
                'px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5',
                showFilters
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'bg-white/5 text-ivory-muted hover:text-ivory hover:bg-white/10 border border-transparent',
              ]"
            >
              <Filter class="w-3.5 h-3.5" />
              筛选
            </button>
            <button
              @click="openNewPlan()"
              class="px-2.5 py-1.5 rounded-lg bg-gold/20 hover:bg-gold/30 text-gold-light text-xs font-medium transition-all flex items-center gap-1.5 border border-gold/30"
            >
              <Plus class="w-3.5 h-3.5" />
              新增计划
            </button>
          </div>
        </div>

        <div
          v-if="showFilters"
          class="px-4 py-2.5 border-b border-white/5 flex items-center gap-3 flex-wrap flex-shrink-0 bg-white/[0.02]"
        >
          <div class="flex items-center gap-1.5">
            <span class="text-[10px] text-ivory-muted/60">材质：</span>
            <select
              v-model="filterMaterial"
              class="px-2 py-1 rounded text-[11px] bg-bg-secondary/80 border border-white/10 text-ivory focus:outline-none focus:border-gold/50"
            >
              <option value="all">全部耳饰</option>
              <option v-for="opt in materialOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>

          <div class="flex items-center gap-1.5">
            <span class="text-[10px] text-ivory-muted/60">类型：</span>
            <select
              v-model="filterType"
              class="px-2 py-1 rounded text-[11px] bg-bg-secondary/80 border border-white/10 text-ivory focus:outline-none focus:border-gold/50"
            >
              <option v-for="opt in typeOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>

          <div class="flex items-center gap-1.5">
            <span class="text-[10px] text-ivory-muted/60">状态：</span>
            <select
              v-model="filterStatus"
              class="px-2 py-1 rounded text-[11px] bg-bg-secondary/80 border border-white/10 text-ivory focus:outline-none focus:border-gold/50"
            >
              <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>

          <div class="flex items-center gap-1.5">
            <span class="text-[10px] text-ivory-muted/60">风险：</span>
            <select
              v-model="filterRisk"
              class="px-2 py-1 rounded text-[11px] bg-bg-secondary/80 border border-white/10 text-ivory focus:outline-none focus:border-gold/50"
            >
              <option v-for="opt in riskOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>

          <div class="flex-1" />

          <button
            @click="filterMaterial = 'all'; filterType = 'all'; filterStatus = 'all'; filterRisk = 'all'"
            class="text-[10px] text-ivory-muted/60 hover:text-gold-light transition-colors"
          >
            重置筛选
          </button>
        </div>

        <div v-if="viewMode === 'calendar'" class="flex-1 min-h-0 overflow-hidden flex flex-col">
          <div class="px-4 py-2 flex items-center justify-between flex-shrink-0">
            <div class="flex items-center gap-2">
              <button
                @click="prevMonth"
                class="p-1 rounded hover:bg-white/10 text-ivory-muted transition-colors"
              >
                <ChevronLeft class="w-4 h-4" />
              </button>
              <span class="text-sm font-medium text-ivory">
                {{ currentMonth.getFullYear() }}年{{ currentMonth.getMonth() + 1 }}月
              </span>
              <button
                @click="nextMonth"
                class="p-1 rounded hover:bg-white/10 text-ivory-muted transition-colors"
              >
                <ChevronRight class="w-4 h-4" />
              </button>
            </div>
            <button
              @click="goToToday"
              class="px-2.5 py-1 rounded text-[11px] bg-white/5 hover:bg-white/10 text-ivory-muted transition-colors"
            >
              今天
            </button>
          </div>

          <div class="flex-1 min-h-0 overflow-y-auto p-2">
            <div class="grid grid-cols-7 gap-1 mb-1">
              <div
                v-for="day in weekDays"
                :key="day"
                class="text-center text-[10px] text-ivory-muted/50 py-1"
              >
                {{ day }}
              </div>
            </div>

            <div class="grid grid-cols-7 gap-1">
              <div
                v-for="day in calendarDays"
                :key="day.date"
                @click="selectedMaterial ? openNewPlan(selectedMaterial.id) : null"
                :class="[
                  'min-h-20 rounded-lg border p-1 transition-all',
                  day.isCurrentMonth ? 'bg-bg-secondary/30' : 'bg-white/[0.02]',
                  day.isToday ? 'border-gold/50 ring-1 ring-gold/30' : 'border-white/5',
                  'hover:border-gold/30 cursor-pointer',
                ]"
              >
                <div class="flex items-center justify-between mb-1">
                  <span
                    :class="[
                      'text-[10px] font-medium',
                      day.isToday ? 'text-gold-light bg-gold/20 px-1.5 py-0.5 rounded-full' : '',
                      day.isCurrentMonth ? 'text-ivory-muted' : 'text-ivory-muted/30',
                    ]"
                  >
                    {{ day.day }}
                  </span>
                  <span v-if="getPlansForDate(day.date).length > 0" class="text-[9px] text-ivory-muted/50">
                    {{ getPlansForDate(day.date).length }}
                  </span>
                </div>

                <div class="space-y-0.5">
                  <div
                    v-for="plan in getPlansForDate(day.date).slice(0, 3)"
                    :key="plan.id"
                    @click.stop="openPlanDetail(plan)"
                    :class="[
                      'text-[9px] px-1 py-0.5 rounded truncate border',
                      typeColors[plan.type],
                      plan.status === 'completed' ? 'opacity-50 line-through' : '',
                    ]"
                  >
                    <span class="mr-0.5">{{ typeIcons[plan.type] }}</span>
                    {{ plan.title.replace(/^.+- /, '').slice(0, 8) }}
                  </div>
                  <div
                    v-if="getPlansForDate(day.date).length > 3"
                    class="text-[9px] text-ivory-muted/40 text-center"
                  >
                    +{{ getPlansForDate(day.date).length - 3 }} 更多
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="flex-1 min-h-0 overflow-y-auto p-4">
          <div v-if="filteredPlans.length === 0" class="h-full flex flex-col items-center justify-center text-center py-12">
            <div class="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-3">
              <Calendar class="w-7 h-7 text-ivory-muted/30" />
            </div>
            <p class="text-sm text-ivory-muted/60 mb-1">暂无保养计划</p>
            <p class="text-[11px] text-ivory-muted/40 mb-3">添加耳饰材质信息并生成保养计划</p>
            <div class="flex gap-2">
              <button
                @click="openNewMaterial"
                class="px-3 py-1.5 rounded-lg bg-gold/20 hover:bg-gold/30 text-gold-light text-xs font-medium transition-colors flex items-center gap-1.5"
              >
                <Sparkles class="w-3.5 h-3.5" />
                添加耳饰
              </button>
              <button
                v-if="store.materialInfoList.length > 0"
                @click="openNewPlan()"
                class="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-ivory text-xs font-medium transition-colors flex items-center gap-1.5"
              >
                <Plus class="w-3.5 h-3.5" />
                新增计划
              </button>
            </div>
          </div>

          <div v-else class="space-y-4">
            <template v-for="(plans, date) in groupPlansByDate(filteredPlans)" :key="date">
              <div class="flex items-center gap-2">
                <div class="w-px h-px flex-1 bg-white/10" />
                <span class="text-[11px] text-ivory-muted/60 flex-shrink-0">
                  {{ formatDateLabel(date) }}
                </span>
                <div class="w-px h-px flex-1 bg-white/10" />
              </div>

              <div class="space-y-2">
                <div
                  v-for="plan in plans"
                  :key="plan.id"
                  @click="openPlanDetail(plan)"
                  :class="[
                    'group p-3 rounded-xl border transition-all cursor-pointer',
                    plan.status === 'completed'
                      ? 'bg-white/[0.02] border-white/5 opacity-60'
                      : 'bg-bg-secondary/50 border-white/5 hover:border-gold/30 hover:bg-white/5',
                  ]"
                >
                  <div class="flex items-start gap-3">
                    <div
                      :class="[
                        'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg border',
                        typeColors[plan.type],
                      ]"
                    >
                      {{ typeIcons[plan.type] }}
                    </div>

                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2">
                        <h4
                          :class="[
                            'text-sm font-medium',
                            plan.status === 'completed' ? 'text-ivory-muted line-through' : 'text-ivory group-hover:text-gold-light',
                          ]"
                        >
                          {{ plan.title }}
                        </h4>
                        <span
                          :class="[
                            'text-[9px] px-1.5 py-0.5 rounded',
                            plan.status === 'completed'
                              ? 'bg-green-500/20 text-green-300'
                              : plan.status === 'delayed'
                              ? 'bg-orange-500/20 text-orange-300'
                              : 'bg-blue-500/20 text-blue-300',
                          ]"
                        >
                          {{ planStatusLabels[plan.status] }}
                        </span>
                      </div>

                      <div class="flex items-center gap-3 mt-1">
                        <span class="flex items-center gap-1 text-[11px] text-ivory-muted/60">
                          <Clock class="w-3 h-3" />
                          {{ plan.time }}
                        </span>
                        <span class="text-[11px] text-ivory-muted/60">
                          {{ planTypeLabels[plan.type] }}
                        </span>
                        <span
                          v-if="getMaterialRisk(plan.materialInfoId)"
                          class="text-[10px]"
                          :style="{ color: riskLevelColors[getMaterialRisk(plan.materialInfoId)!.level] }"
                        >
                          {{ riskLevelLabels[getMaterialRisk(plan.materialInfoId)!.level] }}
                        </span>
                      </div>

                      <p v-if="plan.description" class="text-[11px] text-ivory-muted/50 mt-1.5 line-clamp-1">
                        {{ plan.description }}
                      </p>
                    </div>

                    <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        v-if="plan.status !== 'completed'"
                        @click.stop="store.completeMaintenancePlan(plan.id)"
                        class="p-1.5 rounded-lg hover:bg-green-500/20 text-green-400 transition-colors"
                        title="完成"
                      >
                        <CheckCircle class="w-3.5 h-3.5" />
                      </button>
                      <button
                        @click.stop="exportReminderCard(plan.materialInfoId)"
                        class="p-1.5 rounded-lg hover:bg-blue-500/20 text-blue-400 transition-colors"
                        title="导出提醒卡"
                      >
                        <ImageDown class="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>

      <div v-if="showMaterialPanel" class="w-72 flex-shrink-0 border-l border-gold/10 overflow-hidden">
        <MaterialInfoPanel
          :material-info="selectedMaterial"
          :is-new="isNewMaterial"
          @close="closeMaterialPanel"
          @saved="handleMaterialSaved"
          @delete="handleMaterialDeleted"
          @generate-plans="closeMaterialPanel"
        />
      </div>

      <div v-if="showPlanPanel" class="w-72 flex-shrink-0 border-l border-gold/10 overflow-hidden">
        <PlanEditPanel
          :plan="selectedPlan"
          :material-info-id="selectedMaterial?.id"
          :is-new="isNewPlan"
          @close="closePlanPanel"
          @saved="handlePlanSaved"
          @delete="closePlanPanel"
          @complete="closePlanPanel"
          @delay="closePlanPanel"
        />
      </div>
    </div>

    <div class="px-4 py-2 border-t border-gold/10 flex items-center justify-between flex-shrink-0">
      <p class="text-[10px] text-ivory-muted/50">
        💾 数据保存在本地浏览器 · 共 {{ store.materialInfoList.length }} 款耳饰 · {{ store.maintenancePlans.length }} 条计划
      </p>
      <div class="flex items-center gap-2">
        <span
          v-for="(color, level) in riskLevelColors"
          :key="level"
          class="flex items-center gap-1 text-[9px] text-ivory-muted/60"
        >
          <span class="w-2 h-2 rounded-full" :style="{ backgroundColor: color }" />
          {{ riskLevelLabels[level as RiskLevel] }}
        </span>
      </div>
    </div>
  </div>
</template>
