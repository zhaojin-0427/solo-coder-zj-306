<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useEarringStore } from '@/stores/useEarringStore'
import type { MaintenancePlan, PlanType, PlanStatus, OutfitScene, WearingDuration } from '@/types'
import {
  planTypeLabels,
  planStatusLabels,
  outfitSceneLabels,
  wearingDurationLabels,
  materialTypeLabels,
} from '@/types'
import {
  X,
  Save,
  Trash2,
  CheckCircle,
  Clock,
  Calendar,
} from 'lucide-vue-next'

const props = defineProps<{
  plan?: MaintenancePlan | null
  materialInfoId?: string
  isNew?: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved', plan: MaintenancePlan): void
  (e: 'delete', id: string): void
  (e: 'complete', id: string): void
  (e: 'delay', id: string): void
}>()

const store = useEarringStore()

const form = ref({
  title: '',
  type: 'wear' as PlanType,
  description: '',
  date: store.formatDate(new Date()),
  time: '09:00',
  scene: 'casual' as OutfitScene,
  duration: 'medium' as WearingDuration,
  status: 'pending' as PlanStatus,
})

watch(
  () => props.plan,
  (p) => {
    if (p) {
      form.value = {
        title: p.title,
        type: p.type,
        description: p.description,
        date: p.date,
        time: p.time,
        scene: p.scene,
        duration: p.duration,
        status: p.status,
      }
    } else {
      resetForm()
    }
  },
  { immediate: true }
)

function resetForm() {
  form.value = {
    title: '',
    type: 'wear',
    description: '',
    date: store.formatDate(new Date()),
    time: '09:00',
    scene: 'casual',
    duration: 'medium',
    status: 'pending',
  }
}

const materialInfo = computed(() => {
  const id = props.plan?.materialInfoId || props.materialInfoId
  if (!id) return null
  return store.getMaterialInfo(id)
})

function handleSave() {
  if (!form.value.title.trim()) {
    alert('请输入计划标题')
    return
  }

  const materialId = props.plan?.materialInfoId || props.materialInfoId
  if (!materialId) {
    alert('缺少材质信息')
    return
  }

  if (props.plan && !props.isNew) {
    store.updateMaintenancePlan(props.plan.id, {
      ...form.value,
      title: form.value.title.trim(),
    })
    const updated = store.maintenancePlans.find((p) => p.id === props.plan!.id)
    if (updated) {
      emit('saved', updated)
    }
  } else {
    const newPlan = store.createMaintenancePlan({
      ...form.value,
      title: form.value.title.trim(),
      materialInfoId: materialId,
    })
    emit('saved', newPlan)
  }
}

function handleDelete() {
  if (!props.plan) return
  if (confirm('确定删除此计划？')) {
    store.deleteMaintenancePlan(props.plan.id)
    emit('delete', props.plan.id)
  }
}

function handleComplete() {
  if (!props.plan) return
  store.completeMaintenancePlan(props.plan.id)
  emit('complete', props.plan.id)
}

function handleDelay() {
  if (!props.plan) return
  store.delayMaintenancePlan(props.plan.id, 1)
  emit('delay', props.plan.id)
}

const typeOptions = Object.entries(planTypeLabels).map(([value, label]) => ({ value, label }))
const sceneOptions = Object.entries(outfitSceneLabels).map(([value, label]) => ({ value, label }))
const durationOptions = Object.entries(wearingDurationLabels).map(([value, label]) => ({ value, label }))

const typeIcons: Record<PlanType, string> = {
  wear: '👂',
  clean: '🧼',
  check: '🔍',
  repair: '🔧',
}
</script>

<template>
  <div class="h-full flex flex-col bg-bg-panel rounded-xl border border-gold/10 overflow-hidden">
    <div class="px-4 py-3 border-b border-gold/10 flex items-center justify-between flex-shrink-0">
      <div class="flex items-center gap-2">
        <span class="text-lg">{{ typeIcons[form.type] }}</span>
        <h3 class="text-sm font-display tracking-wider text-gold-light">
          {{ isNew ? '新增计划' : '计划详情' }}
        </h3>
      </div>
      <button
        @click="emit('close')"
        class="p-1.5 rounded-lg hover:bg-white/10 text-ivory-muted transition-colors"
      >
        <X class="w-4 h-4" />
      </button>
    </div>

    <div class="flex-1 overflow-y-auto p-4 space-y-4">
      <div v-if="materialInfo" class="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
        <div v-if="materialInfo.thumbnail" class="w-10 h-12 rounded overflow-hidden bg-black/30 flex-shrink-0">
          <img :src="materialInfo.thumbnail" :alt="materialInfo.name" class="w-full h-full object-cover" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-xs font-medium text-ivory truncate">{{ materialInfo.name }}</p>
          <p class="text-[10px] text-ivory-muted/60">
            {{ materialTypeLabels[materialInfo.mainMaterial] }}
          </p>
        </div>
      </div>

      <div>
        <label class="block text-xs text-ivory-muted mb-1.5">计划标题</label>
        <input
          v-model="form.title"
          type="text"
          class="w-full px-3 py-2 rounded-lg bg-bg-secondary/80 border border-white/10 focus:border-gold/50 focus:outline-none text-ivory text-sm transition-colors"
          placeholder="输入计划标题"
        />
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs text-ivory-muted mb-1.5">计划类型</label>
          <select
            v-model="form.type"
            class="w-full px-3 py-2 rounded-lg bg-bg-secondary/80 border border-white/10 focus:border-gold/50 focus:outline-none text-ivory text-sm transition-colors"
          >
            <option v-for="opt in typeOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>

        <div v-if="form.type === 'wear'">
          <label class="block text-xs text-ivory-muted mb-1.5">使用场景</label>
          <select
            v-model="form.scene"
            class="w-full px-3 py-2 rounded-lg bg-bg-secondary/80 border border-white/10 focus:border-gold/50 focus:outline-none text-ivory text-sm transition-colors"
          >
            <option v-for="opt in sceneOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs text-ivory-muted mb-1.5">日期</label>
          <div class="relative">
            <Calendar class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ivory-muted/50" />
            <input
              v-model="form.date"
              type="date"
              class="w-full pl-8 pr-3 py-2 rounded-lg bg-bg-secondary/80 border border-white/10 focus:border-gold/50 focus:outline-none text-ivory text-sm transition-colors"
            />
          </div>
        </div>

        <div>
          <label class="block text-xs text-ivory-muted mb-1.5">时间</label>
          <div class="relative">
            <Clock class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ivory-muted/50" />
            <input
              v-model="form.time"
              type="time"
              class="w-full pl-8 pr-3 py-2 rounded-lg bg-bg-secondary/80 border border-white/10 focus:border-gold/50 focus:outline-none text-ivory text-sm transition-colors"
            />
          </div>
        </div>
      </div>

      <div v-if="form.type === 'wear'">
        <label class="block text-xs text-ivory-muted mb-1.5">佩戴时长</label>
        <select
          v-model="form.duration"
          class="w-full px-3 py-2 rounded-lg bg-bg-secondary/80 border border-white/10 focus:border-gold/50 focus:outline-none text-ivory text-sm transition-colors"
        >
          <option v-for="opt in durationOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>

      <div>
        <label class="block text-xs text-ivory-muted mb-1.5">描述 / 备注</label>
        <textarea
          v-model="form.description"
          rows="3"
          class="w-full px-3 py-2 rounded-lg bg-bg-secondary/80 border border-white/10 focus:border-gold/50 focus:outline-none text-ivory text-sm transition-colors resize-none"
          placeholder="添加计划描述或备注..."
        />
      </div>

      <div v-if="!isNew && plan" class="pt-2 border-t border-white/5">
        <div class="flex items-center gap-2 text-xs">
          <span class="text-ivory-muted/60">当前状态：</span>
          <span
            :class="[
              'px-2 py-0.5 rounded text-[10px]',
              plan.status === 'completed'
                ? 'bg-green-500/20 text-green-300'
                : plan.status === 'delayed'
                ? 'bg-orange-500/20 text-orange-300'
                : plan.status === 'cancelled'
                ? 'bg-gray-500/20 text-gray-300'
                : 'bg-blue-500/20 text-blue-300',
            ]"
          >
            {{ planStatusLabels[plan.status] }}
          </span>
        </div>
      </div>

      <div v-if="plan?.suggestions && plan.suggestions.length > 0" class="pt-2 border-t border-white/5">
        <h4 class="text-xs font-medium text-ivory mb-2">💡 温馨提示</h4>
        <div class="space-y-1.5">
          <p
            v-for="(tip, idx) in plan.suggestions.slice(0, 3)"
            :key="idx"
            class="text-[10px] text-ivory-muted/70 pl-3 relative"
          >
            <span class="absolute left-0 top-0">•</span>
            {{ tip }}
          </p>
        </div>
      </div>
    </div>

    <div class="px-4 py-3 border-t border-gold/10 flex gap-2 flex-shrink-0">
      <button
        v-if="!isNew && plan && plan.status !== 'completed'"
        @click="handleComplete"
        class="px-3 py-2 rounded-lg bg-green-500/15 hover:bg-green-500/25 text-green-300 text-xs font-medium transition-colors flex items-center gap-1.5"
      >
        <CheckCircle class="w-3.5 h-3.5" />
        完成
      </button>
      <button
        v-if="!isNew && plan && plan.status !== 'completed'"
        @click="handleDelay"
        class="px-3 py-2 rounded-lg bg-orange-500/15 hover:bg-orange-500/25 text-orange-300 text-xs font-medium transition-colors flex items-center gap-1.5"
      >
        <Clock class="w-3.5 h-3.5" />
        延期1天
      </button>
      <button
        v-if="!isNew && plan"
        @click="handleDelete"
        class="px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-medium transition-colors flex items-center gap-1.5"
      >
        <Trash2 class="w-3.5 h-3.5" />
        删除
      </button>
      <div class="flex-1" />
      <button
        @click="emit('close')"
        class="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-ivory-muted text-sm transition-colors"
      >
        取消
      </button>
      <button
        @click="handleSave"
        class="px-4 py-2 rounded-lg bg-gold hover:bg-gold-light text-bg font-medium text-sm flex items-center gap-1.5 transition-colors"
      >
        <Save class="w-3.5 h-3.5" />
        保存
      </button>
    </div>
  </div>
</template>
