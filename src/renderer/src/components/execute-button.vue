<template><!-- 主容器 -->
<a-button @click="execution" :loading="loading">执行</a-button></template>
<script setup>
import { execScript, openModal } from '@ui/apis/uiService'
// 定义传入参数
const props = defineProps({
  module: String
})
const loading = ref(false)

// 向上传递方法
const emit = defineEmits(['start', 'finish'])
// 组件挂载时执行
onMounted(() => {
});
const execution = async () => {
  emit('start')
  loading.value = true
  await openModal(props.module)
  execScript(props.module).then((e) => {
    console.log("🚀 ~ execution ~ e:", e)
    emit('finish')
    loading.value = false
  }).catch((err) => {
    console.log("🚀 ~ execution ~ err:", err)
    emit('finish')
    loading.value = false
  })
}
</script>
<style lang="less" scoped></style>
