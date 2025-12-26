<template>
  <NodeWrapper 
    :id="id"
    title="图片节点" 
    :selected="selected" 
    :hasConnections="hasConnections"
    :rotation="data.rotation || 0"
    @delete="onDelete"
  >
    <div class="node-body">
      <div v-if="thumbnailSrc" class="image-preview">
        <img :src="thumbnailSrc" alt="预览" loading="lazy" />
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
import { getThumbnail } from '../../utils/imageStore'

const props = defineProps(['id', 'data', 'selected'])
const { removeNodes, getConnectedEdges, findNode } = useVueFlow()

// 检查当前节点是否有连接线
const hasConnections = computed(() => {
  const node = findNode(props.id)
  if (!node) return false
  const connectedEdges = getConnectedEdges([node])
  return connectedEdges.length > 0
})

// 获取缩略图（从内存）
const thumbnailSrc = computed(() => {
  if (props.data.thumbnailId) {
    return getThumbnail(props.data.thumbnailId)
  }
  return null
})

const onDelete = () => {
  removeNodes(props.id)
}
</script>

<style scoped>
.node-body {
  contain: layout style paint;
}

.image-preview {
  will-change: transform;
  contain: layout style paint;
}

.image-preview img {
  max-width: 100%;
  max-height: 60px;
  object-fit: contain;
  image-rendering: -webkit-optimize-contrast;
  pointer-events: none;
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
