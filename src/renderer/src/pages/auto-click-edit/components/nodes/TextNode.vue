<template>
  <NodeWrapper 
    :id="id"
    :title="label || '文本输入'" 
    :selected="selected" 
    :hasConnections="hasConnections"
    :rotation="data.rotation !== undefined ? data.rotation : 2"
    @delete="onDelete"
  >
    <div class="node-body">
      <div class="type-tag">{{ textMap[data.inputType] }}</div>
      <div class="value">
        <span>{{ data.text }}</span>
        <span v-if="['random','fixed_random'].includes(data.inputType)">${x}</span>
      </div>
    </div>
  </NodeWrapper>
</template>

<script setup>
import { computed, reactive } from 'vue'
import NodeWrapper from './NodeWrapper.vue'
import { useVueFlow } from '@vue-flow/core'

const props = defineProps(['id', 'data', 'selected', 'label'])
const { removeNodes, getConnectedEdges, findNode } = useVueFlow()

const textMap = {
  fixed: '固定文本',
  random: '随机文本',
  fixed_random: '固定+随机文本',
}

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
  font-size: 9px;
  background: #e6f7ff;
  color: #1890ff;
  padding: 0 3px;
  border-radius: 2px;
  margin-bottom: 3px;
}
.value {
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 10px;
}
</style>
