<template>
<div class="progress-position" :class="progressStore.isCompleted && 'completed'">
  <a-progress trailColor="unset" :percent="progressStore.percent" :status="progressStore.status" :size="2"
    :stroke-color="progressStore.strokeColor" :type="progressStore.type" :show-info="false" />
</div>
</template>

<script setup>
import { useProgress } from '@ui/stores/progress';
import { onMounted, onUnmounted } from 'vue';
const ipcRenderer = computed(() => window.electron.ipcRenderer);
const progressStore = useProgress();
progressStore.mountEventListeners();

watch(() => progressStore.percent, (newValue, oldValue) => {
  console.log('progress-bar percent', newValue)
})
watch(() => progressStore.isCompleted, (newValue, oldValue) => {
  console.log('progress-bar isCompleted', newValue)
})
</script>
<style lang="less" scoped>
// 进度条置顶显示
.progress-position {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
  width: 100%;
  height: 2px;

  .ant-progress {
    margin: 0;
    height: 2px;
    line-height: 3;
  }
}

// 进度条置顶显示
:deep(.ant-progress .ant-progress-inner) {
  vertical-align: top;
}

.completed {
  transition: opacity 1s ease;
  opacity: 0;
}
</style>
