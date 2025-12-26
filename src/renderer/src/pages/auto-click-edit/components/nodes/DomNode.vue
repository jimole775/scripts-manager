<template>
  <NodeWrapper 
    :id="id"
    title="DOM 路径" 
    :selected="selected" 
    :hasConnections="hasConnections"
    :rotation="data.rotation || 0"
    @delete="onDelete"
  >
    <div class="node-body">
      <div class="label">选择器:</div>
      <div class="value" :title="data.selector">{{ data.selector || '未设置' }}</div>
    </div>
  </NodeWrapper>
</template>

<script setup>
import { computed } from 'vue'
import NodeWrapper from './NodeWrapper.vue'
import { useVueFlow } from '@vue-flow/core'

const props = defineProps(['id', 'data', 'selected'])
const { removeNodes, getConnectedEdges, findNode } = useVueFlow()

// 检查当前节点是否有连接线
const hasConnections = computed(() => {
  const node = findNode(props.id)
  if (!node) return false
  const connectedEdges = getConnectedEdges([node])
  return connectedEdges.length > 0
})

const onDelete = () => {
  removeNodes(props.id)
}
</script>

<style scoped>
.label {
  color: #999;
  margin-bottom: 2px;
}
.value {
  font-family: monospace;
  background: #f0f0f0;
  padding: 2px 4px;
  border-radius: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}
</style>
