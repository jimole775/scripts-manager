<template>
  <NodeWrapper 
    :id="id"
    title="文本输入" 
    :selected="selected" 
    :hasConnections="hasConnections" 
    @delete="onDelete"
  >
    <div class="node-body">
      <div class="type-tag">{{ data.inputType || '手动' }}</div>
      <div class="value">{{ data.text || '...' }}</div>
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
.type-tag {
  display: inline-block;
  font-size: 10px;
  background: #e6f7ff;
  color: #1890ff;
  padding: 0 4px;
  border-radius: 2px;
  margin-bottom: 4px;
}
.value {
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
