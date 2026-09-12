<script setup>
import SystemSymbol from './SystemSymbol.vue'
defineOptions({ inheritAttrs: false })
defineProps({ modelValue: { type: String, default: '' } })
const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <span class="datum-eingabe">
    <input
      v-bind="$attrs"
      type="date"
      :value="modelValue"
      @input="emit('update:modelValue', $event.target.value)"
    />
    <SystemSymbol name="kalender" />
  </span>
</template>
