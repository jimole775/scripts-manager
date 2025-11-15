<template><!-- 主容器 -->
  <div class="log-screen-container">
    <div class="header">
      {{ scriptName }}
      <TerminateButton :module="scriptName" />
      <!-- {{  prosLength }} -->
    </div>
    <a-list>
      <a-list-item v-for="(log, index) in logMessages" :key="index">
        {{ log }}
      </a-list-item>
    </a-list>
  </div>
</template>
<script setup>
import { storeToRefs } from 'pinia';
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { requestLogs, stopLogs } from '@modal/apis/uiService'
import { useModalStore } from '@modal/stores/modal';
const modalStore = storeToRefs(useModalStore())
// 定义传入参数
const props = defineProps({
  xxx: String
})
// 向上传递方法
const emit = defineEmits(['xxx'])

// 存储日志消息
const logMessages = ref([]);
const scriptName = computed(() => {
  return modalStore.scriptName.value
})
// const prosLength = computed(() => {
//   return modalStore.projects.value?.length || 0
// })
// const prosLength = computed(() => {
//   return modalStore.pros.value?.length || 0
// })
const ipcRenderer = computed(() => window.electron.ipcRenderer);

// 处理接收到的日志信息
const handleLogMessage = (event, preload) => {
  console.log("🚀 ~ handleLogMessage ~ message.msgs:", preload)
  logMessages.value.push(preload?.messages?.join('\n') || '未知信息');
};

// 监听 scriptName 变化
// 开启各种监听逻辑
watch(() => scriptName.value, async (newValue, oldValue) => {
  if (newValue) {
    const res = await requestLogs(newValue);
    if (res === true) {
      ipcRenderer.value.on('log-message', handleLogMessage);
    } else {
      message.warning(res)
    }
  }
})

// 组件卸载时移除监听器
onUnmounted(() => {
  ipcRenderer.value.removeListener('log-message', handleLogMessage);
  stopLogs(scriptName.value);
});

// 暴露方法
defineExpose({})
</script>
<style lang="less" scoped>
.log-screen-container {
  .header {
    margin-bottom: 16px;
  }
}
</style>
