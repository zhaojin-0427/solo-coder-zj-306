<script setup lang="ts">
import { computed } from 'vue'
import { useEarringStore } from '@/stores/useEarringStore'

interface Props {
  side: 'left' | 'right'
  label: string
  field: 'offsetY' | 'offsetX' | 'scale' | 'lengthScale' | 'rotation'
  min: number
  max: number
  step: number
}

const props = defineProps<Props>()
const store = useEarringStore()

const value = computed(() => {
  const earring = props.side === 'left' ? store.leftEarring : store.rightEarring
  return earring[props.field]
})

const displayValue = computed(() => {
  if (props.field === 'scale') return (value.value * 100).toFixed(0) + '%'
  if (props.field === 'lengthScale') return (value.value * 100).toFixed(0) + '%'
  if (props.field === 'rotation') return value.value.toFixed(1) + '°'
  if (props.field === 'offsetY') return (value.value > 0 ? '↓' : value.value < 0 ? '↑' : '—') + Math.abs(value.value).toFixed(0) + 'px'
  if (props.field === 'offsetX') return (value.value > 0 ? '→' : value.value < 0 ? '←' : '—') + Math.abs(value.value).toFixed(0) + 'px'
  return String(value.value)
})

function update(val: number) {
  store.updateEarring(props.side, { [props.field]: val })
}

const effectiveMin = computed(() => (props.field === 'scale' ? props.min : props.min))
const effectiveMax = computed(() => (props.field === 'scale' ? props.max : props.max))
</script>

<template>
  <div class="space-y-1">
    <div class="flex items-center justify-between">
      <span class="text-[11px] text-ivory-muted/80">{{ label }}</span>
      <span class="text-[11px] text-gold font-mono tabular-nums">{{ displayValue }}</span>
    </div>
    <input
      type="range"
      :value="value"
      :min="effectiveMin"
      :max="effectiveMax"
      :step="step"
      @input="update(Number(($event.target as HTMLInputElement).value))"
    />
  </div>
</template>
