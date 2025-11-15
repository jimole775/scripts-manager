<template>
  <!-- 主容器 -->
  <a-button @click="terminateEvent" :loading="loading">结束</a-button>
</template>
<script setup>
import { message } from 'ant-design-vue'
import { terminateScript } from '@ui/apis/uiService'

// 定义传入参数
const props = defineProps({
  module: String
})
const loading = ref(false)

// 向上传递方法
const emit = defineEmits(['success', 'failure'])
// 组件挂载时执行
onMounted(() => {
});

const terminateEvent = async () => {
  terminateScript(props.module).then((res) => {
    console.log("🚀 ~ terminateScript ~ res:", res)
    message.success(res)
    emit('success')
    loading.value = false
  }).catch((err) => {
    console.log("🚀 ~ terminateScript ~ err:", err)
    emit('failure')
    message.warning(err)
    loading.value = false
  })
}

</script>
<style lang="less" scoped>
</style>

