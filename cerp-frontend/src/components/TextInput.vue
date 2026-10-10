<script setup>
import { onMounted, ref } from 'vue'

defineProps({
  modelValue: String,
  inputPlaceholder: String
})

defineEmits(['update:modelValue'])

const input = ref(null)

onMounted(() => {
  if (input.value.hasAttribute('autofocus')) {
    input.value.focus()
  }
})

defineExpose({ focus: () => input.value.focus() })
</script>

<template>
  <input
    ref="input"
    class="inputFeild"
    :value="modelValue"
    :placeholder="inputPlaceholder"
    @input="$emit('update:modelValue', $event.target.value)"
  />
</template>
