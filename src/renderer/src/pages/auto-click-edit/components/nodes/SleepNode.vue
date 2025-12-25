<template>
  <NodeWrapper 
    :id="id"
    title="睡眠" 
    :selected="selected" 
    :hasConnections="hasConnections" 
    @delete="onDelete"
  >
    <div class="node-body">
      <div class="time">
        {{ data.duration || 0 }} 秒
        <span v-if="data.random" class="random-badge">随</span>
      </div>
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
.time {
  font-size: 14px;
  font-weight: bold;
  color: #fa8c16;
  display: flex;
  align-items: center;
  gap: 4px;
}
.random-badge {
  font-size: 10px;
  background: #fff7e6;
  border: 1px solid #ffd591;
  padding: 0 2px;
  border-radius: 2px;
}
</style>
