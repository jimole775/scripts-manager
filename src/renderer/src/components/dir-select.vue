<!--
 * @ Author: Rongxis
 * @ Create Time: 2025-03-10 23:38:34
 * @ Description: 目录选择
 -->

<template>
  <div class="flex items-center gap-2">
    <a-input 
      v-model:value="dirPath"
      :placeholder="placeholder"
      :disabled="disabled"
    />
    <a-button 
      @click="handleSelectDir"
      :disabled="disabled"
    >
      选择目录
    </a-button>
  </div>
</template>

<script setup>
import { selectDirectory } from '@ui/apis/uiService.js'
const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: '请选择目录'
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const dirPath = computed({
  get: () => props.modelValue,
  set: (val) => {
    emit('update:modelValue', val)
    emit('change', val)
  }
})

const handleSelectDir = async () => {
  const result = await selectDirectory()
  if (result.status === 200) {
    dirPath.value = result.data
  } else {
    console.log(result.message)
    dirPath.value = ''
  }
}
</script>
