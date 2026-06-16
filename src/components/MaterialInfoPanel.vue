<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useEarringStore } from '@/stores/useEarringStore'
import type { EarringMaterialInfo, MaterialType, PlatingProcess, EarPostMaterial, WeightRange, WearingFrequency, CleaningCycle } from '@/types'
import {
  materialTypeLabels,
  platingProcessLabels,
  earPostMaterialLabels,
  weightRangeLabels,
  wearingFrequencyLabels,
  cleaningCycleLabels,
} from '@/types'
import RiskScoreCard from './RiskScoreCard.vue'
import {
  X,
  Save,
  Sparkles,
  Trash2,
  CalendarDays,
  Image as ImageIcon,
} from 'lucide-vue-next'

const props = defineProps<{
  materialInfo?: EarringMaterialInfo | null
  isNew?: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved', info: EarringMaterialInfo): void
  (e: 'delete', id: string): void
  (e: 'generate-plans', id: string): void
}>()

const store = useEarringStore()

const form = ref({
  name: '',
  mainMaterial: 'sterling-silver' as MaterialType,
  platingProcess: 'none' as PlatingProcess,
  earPostMaterial: 'sterling-silver' as EarPostMaterial,
  weightRange: 'medium' as WeightRange,
  isAllergenic: false,
  allergyNotes: '',
  wearingFrequency: 'weekly' as WearingFrequency,
  cleaningCycle: 'weekly' as CleaningCycle,
  customCleaningDays: 0,
  notes: '',
})

watch(
  () => props.materialInfo,
  (info) => {
    if (info) {
      form.value = {
        name: info.name,
        mainMaterial: info.mainMaterial,
        platingProcess: info.platingProcess,
        earPostMaterial: info.earPostMaterial,
        weightRange: info.weightRange,
        isAllergenic: info.isAllergenic,
        allergyNotes: info.allergyNotes,
        wearingFrequency: info.wearingFrequency,
        cleaningCycle: info.cleaningCycle,
        customCleaningDays: info.customCleaningDays,
        notes: info.notes,
      }
    } else {
      resetForm()
    }
  },
  { immediate: true }
)

function resetForm() {
  form.value = {
    name: '',
    mainMaterial: 'sterling-silver',
    platingProcess: 'none',
    earPostMaterial: 'sterling-silver',
    weightRange: 'medium',
    isAllergenic: false,
    allergyNotes: '',
    wearingFrequency: 'weekly',
    cleaningCycle: 'weekly',
    customCleaningDays: 0,
    notes: '',
  }
}

const computedRisk = computed(() => {
  const mockInfo: EarringMaterialInfo = {
    id: 'temp',
    schemeId: null,
    slotId: null,
    inspirationCardId: null,
    name: form.value.name,
    thumbnail: '',
    mainMaterial: form.value.mainMaterial,
    platingProcess: form.value.platingProcess,
    earPostMaterial: form.value.earPostMaterial,
    weightRange: form.value.weightRange,
    isAllergenic: form.value.isAllergenic,
    allergyNotes: form.value.allergyNotes,
    wearingFrequency: form.value.wearingFrequency,
    cleaningCycle: form.value.cleaningCycle,
    customCleaningDays: form.value.customCleaningDays,
    lastCleanedAt: null,
    lastWornAt: null,
    notes: form.value.notes,
    createdAt: 0,
    updatedAt: 0,
  }
  return store.assessRisk(mockInfo)
})

const suggestions = computed(() => {
  const mockInfo: EarringMaterialInfo = {
    id: 'temp',
    schemeId: null,
    slotId: null,
    inspirationCardId: null,
    name: form.value.name,
    thumbnail: '',
    mainMaterial: form.value.mainMaterial,
    platingProcess: form.value.platingProcess,
    earPostMaterial: form.value.earPostMaterial,
    weightRange: form.value.weightRange,
    isAllergenic: form.value.isAllergenic,
    allergyNotes: form.value.allergyNotes,
    wearingFrequency: form.value.wearingFrequency,
    cleaningCycle: form.value.cleaningCycle,
    customCleaningDays: form.value.customCleaningDays,
    lastCleanedAt: null,
    lastWornAt: null,
    notes: form.value.notes,
    createdAt: 0,
    updatedAt: 0,
  }
  return store.generateMaintenanceSuggestions(mockInfo)
})

function handleSave() {
  if (!form.value.name.trim()) {
    alert('请输入耳饰名称')
    return
  }

  if (props.materialInfo && !props.isNew) {
    store.updateMaterialInfo(props.materialInfo.id, {
      ...form.value,
      name: form.value.name.trim(),
    })
    const updated = store.getMaterialInfo(props.materialInfo.id)
    if (updated) {
      emit('saved', updated)
    }
  } else {
    const newInfo = store.createMaterialInfo({
      ...form.value,
      name: form.value.name.trim(),
      thumbnail: props.materialInfo?.thumbnail || '',
      schemeId: props.materialInfo?.schemeId || null,
      slotId: props.materialInfo?.slotId || null,
      inspirationCardId: props.materialInfo?.inspirationCardId || null,
    })
    emit('saved', newInfo)
  }
}

function handleDelete() {
  if (!props.materialInfo) return
  if (confirm('确定删除此材质信息？相关的保养计划也会被删除。')) {
    store.deleteMaterialInfo(props.materialInfo.id)
    emit('delete', props.materialInfo.id)
  }
}

function handleGeneratePlans() {
  if (!props.materialInfo) return
  store.generatePlansForMaterial(props.materialInfo.id, 30)
  emit('generate-plans', props.materialInfo.id)
}

const materialTypeOptions = Object.entries(materialTypeLabels).map(([value, label]) => ({ value, label }))
const platingOptions = Object.entries(platingProcessLabels).map(([value, label]) => ({ value, label }))
const earPostOptions = Object.entries(earPostMaterialLabels).map(([value, label]) => ({ value, label }))
const weightOptions = Object.entries(weightRangeLabels).map(([value, label]) => ({ value, label }))
const frequencyOptions = Object.entries(wearingFrequencyLabels).map(([value, label]) => ({ value, label }))
const cleaningOptions = Object.entries(cleaningCycleLabels).map(([value, label]) => ({ value, label }))
</script>

<template>
  <div class="h-full flex flex-col bg-bg-panel rounded-xl border border-gold/10 overflow-hidden">
    <div class="px-4 py-3 border-b border-gold/10 flex items-center justify-between flex-shrink-0">
      <div class="flex items-center gap-2">
        <Sparkles class="w-4 h-4 text-gold-light" />
        <h3 class="text-sm font-display tracking-wider text-gold-light">
          {{ isNew ? '新增材质信息' : '材质信息详情' }}
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
      <div v-if="materialInfo?.thumbnail" class="flex justify-center">
        <div class="w-24 h-30 rounded-lg overflow-hidden border border-gold/20 bg-black/30">
          <img
            :src="materialInfo.thumbnail"
            :alt="form.name"
            class="w-full h-full object-cover"
          />
        </div>
      </div>

      <div>
        <label class="block text-xs text-ivory-muted mb-1.5">耳饰名称</label>
        <input
          v-model="form.name"
          type="text"
          class="w-full px-3 py-2 rounded-lg bg-bg-secondary/80 border border-white/10 focus:border-gold/50 focus:outline-none text-ivory text-sm transition-colors"
          placeholder="输入耳饰名称"
        />
      </div>

      <RiskScoreCard :risk="computedRisk" />

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs text-ivory-muted mb-1.5">主体材质</label>
          <select
            v-model="form.mainMaterial"
            class="w-full px-3 py-2 rounded-lg bg-bg-secondary/80 border border-white/10 focus:border-gold/50 focus:outline-none text-ivory text-sm transition-colors"
          >
            <option v-for="opt in materialTypeOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-xs text-ivory-muted mb-1.5">镀层工艺</label>
          <select
            v-model="form.platingProcess"
            class="w-full px-3 py-2 rounded-lg bg-bg-secondary/80 border border-white/10 focus:border-gold/50 focus:outline-none text-ivory text-sm transition-colors"
          >
            <option v-for="opt in platingOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs text-ivory-muted mb-1.5">耳针材质</label>
          <select
            v-model="form.earPostMaterial"
            class="w-full px-3 py-2 rounded-lg bg-bg-secondary/80 border border-white/10 focus:border-gold/50 focus:outline-none text-ivory text-sm transition-colors"
          >
            <option v-for="opt in earPostOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-xs text-ivory-muted mb-1.5">重量区间</label>
          <select
            v-model="form.weightRange"
            class="w-full px-3 py-2 rounded-lg bg-bg-secondary/80 border border-white/10 focus:border-gold/50 focus:outline-none text-ivory text-sm transition-colors"
          >
            <option v-for="opt in weightOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs text-ivory-muted mb-1.5">佩戴频率</label>
          <select
            v-model="form.wearingFrequency"
            class="w-full px-3 py-2 rounded-lg bg-bg-secondary/80 border border-white/10 focus:border-gold/50 focus:outline-none text-ivory text-sm transition-colors"
          >
            <option v-for="opt in frequencyOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-xs text-ivory-muted mb-1.5">清洁周期</label>
          <select
            v-model="form.cleaningCycle"
            class="w-full px-3 py-2 rounded-lg bg-bg-secondary/80 border border-white/10 focus:border-gold/50 focus:outline-none text-ivory text-sm transition-colors"
          >
            <option v-for="opt in cleaningOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>
      </div>

      <div class="flex items-start gap-2">
        <input
          v-model="form.isAllergenic"
          type="checkbox"
          id="allergenic"
          class="mt-0.5"
        />
        <label for="allergenic" class="text-xs text-ivory cursor-pointer">
          <span class="text-orange-300">⚠️ 易过敏</span>
          <span class="text-ivory-muted/60 ml-1">（佩戴后容易发红发痒）</span>
        </label>
      </div>

      <div v-if="form.isAllergenic">
        <label class="block text-xs text-ivory-muted mb-1.5">过敏说明</label>
        <textarea
          v-model="form.allergyNotes"
          rows="2"
          class="w-full px-3 py-2 rounded-lg bg-bg-secondary/80 border border-white/10 focus:border-gold/50 focus:outline-none text-ivory text-sm transition-colors resize-none"
          placeholder="描述过敏症状或已知过敏原..."
        />
      </div>

      <div>
        <label class="block text-xs text-ivory-muted mb-1.5">备注</label>
        <textarea
          v-model="form.notes"
          rows="2"
          class="w-full px-3 py-2 rounded-lg bg-bg-secondary/80 border border-white/10 focus:border-gold/50 focus:outline-none text-ivory text-sm transition-colors resize-none"
          placeholder="其他需要记录的信息..."
        />
      </div>

      <div class="pt-2 border-t border-white/5">
        <h4 class="text-xs font-medium text-ivory mb-2 flex items-center gap-1.5">
          <Sparkles class="w-3 h-3 text-gold-light" />
          保养建议
        </h4>
        <div class="space-y-2">
          <div
            v-for="s in suggestions"
            :key="s.title"
            class="p-2.5 rounded-lg bg-white/5 border border-white/5"
          >
            <div class="flex items-center gap-1.5 mb-1">
              <span class="text-sm">
                {{ s.category === 'cleaning' ? '🧼' : s.category === 'storage' ? '📦' : s.category === 'wearing' ? '✨' : s.category === 'allergy' ? '⚠️' : '🔧' }}
              </span>
              <span class="text-xs font-medium text-gold-light">{{ s.title }}</span>
              <span
                v-if="s.priority === 'high'"
                class="text-[9px] px-1 py-0.5 rounded bg-red-500/20 text-red-300 ml-auto"
              >
                重要
              </span>
            </div>
            <p class="text-[10px] text-ivory-muted/70 leading-relaxed">{{ s.content }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="px-4 py-3 border-t border-gold/10 flex gap-2 flex-shrink-0">
      <button
        v-if="!isNew && materialInfo"
        @click="handleDelete"
        class="px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-medium transition-colors flex items-center gap-1.5"
      >
        <Trash2 class="w-3.5 h-3.5" />
        删除
      </button>
      <button
        v-if="!isNew && materialInfo"
        @click="handleGeneratePlans"
        class="px-3 py-2 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 text-xs font-medium transition-colors flex items-center gap-1.5"
      >
        <CalendarDays class="w-3.5 h-3.5" />
        生成计划
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
