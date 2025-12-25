<template>
  <NodeWrapper 
    :id="id"
    title="图片节点" 
    :selected="selected" 
    :hasConnections="hasConnections" 
    @delete="onDelete"
  >
    <div class="node-body">
      <div v-if="data.image" class="image-preview">
        <img :src="data.image" alt="预览" />
      </div>
      <div v-else class="placeholder">
        无图片
      </div>
      <div class="info">
        {{ data.imageName || '上传图片' }}
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
.image-preview img {
  max-width: 100%;
  max-height: 60px;
  object-fit: contain;
}
.placeholder {
  color: #ccc;
  text-align: center;
  padding: 10px;
  border: 1px dashed #eee;
}
.info {
  margin-top: 4px;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
