<template>
  <NodeWrapper 
    :id="id"
    :title="label || '图片节点'" 
    :selected="selected" 
    :hasConnections="hasConnections"
    :rotation="data.rotation !== undefined ? data.rotation : 2"
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
import { computed, ref, onMounted, watch } from 'vue'
import NodeWrapper from './NodeWrapper.vue'
import { useVueFlow } from '@vue-flow/core'
import { getThumbnail, restoreThumbnail } from '../../utils/imageStore'

const props = defineProps(['id', 'data', 'selected', 'label'])
const { removeNodes, getConnectedEdges, findNode } = useVueFlow()

// 缩略图源
const thumbnailSrc = ref(null)

// 检查当前节点是否有连接线
const hasConnections = computed(() => {
  const node = findNode(props.id)
  if (!node) return false
  const connectedEdges = getConnectedEdges([node])
  return connectedEdges.length > 0
})

// 加载缩略图
const loadThumbnail = async () => {
  if (!props.data?.thumbnailId) {
    thumbnailSrc.value = null
    return
  }
  
  // 先尝试从内存获取
  let thumb = getThumbnail(props.data.thumbnailId)
  
  // 如果内存中没有，且有原图ID，则从原图恢复
  if (!thumb && props.data.imageId) {
    console.log(`缩略图不存在，尝试从原图恢复: ${props.data.thumbnailId}`)
    thumb = await restoreThumbnail(props.data.imageId, props.data.thumbnailId)
  }
  
  thumbnailSrc.value = thumb
}

// 组件挂载时加载缩略图
onMounted(() => {
  loadThumbnail()
})

// 监听 thumbnailId 变化
watch(() => props.data?.thumbnailId, () => {
  loadThumbnail()
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
  max-height: 40px;
  object-fit: contain;
  image-rendering: -webkit-optimize-contrast;
  pointer-events: none;
}

.placeholder {
  color: #ccc;
  text-align: center;
  padding: 6px;
  border: 1px dashed #eee;
  font-size: 9px;
}

.info {
  margin-top: 3px;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 9px;
}
</style>
