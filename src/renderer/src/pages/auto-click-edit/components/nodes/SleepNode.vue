<template>
  <NodeWrapper 
    :id="id"
    :title="label || '睡眠'" 
    :selected="selected" 
    :hasConnections="hasConnections"
    :rotation="data.rotation !== undefined ? data.rotation : 2"
    @delete="onDelete"
  >
    <div class="node-body">
      <div class="time">
        {{ timeDisplay }}
      </div>
    </div>
  </NodeWrapper>
</template>

<script setup>
import { computed } from 'vue'
import NodeWrapper from './NodeWrapper.vue'
import { useVueFlow } from '@vue-flow/core'

const props = defineProps(['id', 'data', 'selected', 'label'])
const { removeNodes, getConnectedEdges, findNode } = useVueFlow()

// 检查当前节点是否有连接线
const hasConnections = computed(() => {
  const node = findNode(props.id)
  if (!node) return false
  const connectedEdges = getConnectedEdges([node])
  return connectedEdges.length > 0
})

// 计算显示的时间文本
const timeDisplay = computed(() => {
  const duration = props.data.duration || 0
  const maxDuration = props.data.maxDuration || duration
  
  if (props.data.random) {
    return `${duration}~${maxDuration} 秒`
  } else {
    return `${duration} 秒`
  }
})

const onDelete = () => {
  removeNodes(props.id)
}
</script>

<style scoped>
.node-body {
  text-align: center;
  margin-top: -2px;
}
.time {
  font-size: 12px;
  font-weight: bold;
  color: #fa8c16;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
}
.random-badge {
  font-size: 8px;
  background: #fff7e6;
  border: 1px solid #ffd591;
  padding: 0 2px;
  border-radius: 2px;
}
</style>
