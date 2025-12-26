<template>
  <div class="properties-panel" v-if="node">
    <div class="panel-header">
      <h3>属性</h3>
      <div class="node-id">ID: {{ node.id }}</div>
    </div>

    <div class="form-item">
      <label>标签</label>
      <input v-model="node.label" type="text" />
    </div>

    <!-- Image Node -->
    <div v-if="node.type === 'image'" class="type-form">
      <div class="form-item">
        <label>图片</label>
        <input ref="fileInputRef" type="file" accept="image/*" @change="handleImageUpload" />
        <div v-if="thumbnailSrc" class="preview">
          <img 
            :src="thumbnailSrc" 
            @click="showImagePreview"
            class="preview-thumbnail"
          />
          <button @click="clearImage" class="btn-clear">清除</button>
        </div>
      </div>
      
      <!-- 图片信息 -->
      <div v-if="node.data.imageInfo" class="image-info">
        <div class="info-title">图片信息</div>
        <div class="info-row">
          <span class="info-label">文件名:</span>
          <span class="info-value" :title="node.data.imageName">{{ node.data.imageName }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">原图尺寸:</span>
          <span class="info-value">{{ node.data.imageInfo.originalWidth }} × {{ node.data.imageInfo.originalHeight }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">缩略图:</span>
          <span class="info-value">{{ node.data.imageInfo.thumbnailWidth }} × {{ node.data.imageInfo.thumbnailHeight }}</span>
        </div>
        <div class="info-divider"></div>
        <div class="info-row">
          <span class="info-label">原图大小:</span>
          <span class="info-value">{{ node.data.imageInfo.originalSize }} KB</span>
        </div>
        <div class="info-row">
          <span class="info-label">缩略图:</span>
          <span class="info-value thumbnail">{{ node.data.imageInfo.thumbnailSize }} KB</span>
        </div>
      </div>
    </div>

    <!-- DOM Node -->
    <div v-if="node.type === 'dom'" class="type-form">
      <div class="form-item">
        <label>选择器 (CSS/XPath)</label>
        <input v-model="node.data.selector" type="text" placeholder="#submit-btn" />
      </div>
    </div>

    <!-- Text Node -->
    <div v-if="node.type === 'text'" class="type-form">
      <div class="form-item">
        <label>输入类型</label>
        <select v-model="node.data.inputType" @change="textChangEvent">
          <option value="fixed">固定</option>
          <option value="random">随机</option>
          <option value="fixed_random">固定_随机</option>
        </select>
      </div>
      <div v-if="node.data.inputType !== 'random'" class="form-item">
        <label>值模板</label>
        <input v-model="node.data.text" type="text" />
      </div>
    </div>

    <!-- Sleep Node -->
    <div v-if="node.type === 'sleep'" class="type-form">
      <div class="form-item">
        <label>模式</label>
        <select v-model="node.data.mode" @change="onModeChange">
          <option value="fixed">固定</option>
          <option value="random">随机</option>
        </select>
      </div>
      <div class="form-item">
        <label>{{ node.data.mode === 'random' ? '最小时长 (秒)' : '时长 (秒)' }}</label>
        <input v-model.number="node.data.duration" type="number" step="0.1" min="0" />
      </div>
      <div v-if="node.data.mode === 'random'" class="form-item">
        <label>最大时长 (秒)</label>
        <input v-model.number="node.data.maxDuration" type="number" step="0.1" min="0" />
      </div>
    </div>
  </div>
  <div v-else class="properties-panel empty">
    选择一个节点以编辑属性
  </div>
  
  <!-- 图片预览弹窗 -->
  <a-modal
    v-model:open="previewVisible"
    title="图片预览"
    :footer="null"
    :width="800"
    centered
  >
    <div class="image-preview-modal">
      <div v-if="previewLoading" class="preview-loading">
        <a-spin size="large" />
        <p>加载原图中...</p>
      </div>
      <img v-else-if="previewImageSrc" :src="previewImageSrc" class="preview-image" />
      <p v-else class="preview-error">加载失败</p>
    </div>
  </a-modal>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { storeImage, deleteImage, getThumbnail, storeThumbnail, deleteThumbnail, getImage } from '../utils/imageStore'

const props = defineProps({
  selectedNode: {
    type: Object,
    default: null
  }
})

// We use a computed property that returns the node, but since we modify properties 
// on the node.data object directly, Vue Reactivity handles it.
const node = computed(() => props.selectedNode)

// 文件输入框的引用
const fileInputRef = ref(null)

// 获取缩略图（从内存）- 使用 computed 以便响应式更新
const thumbnailSrc = computed(() => {
  const thumbnailId = node.value?.data?.thumbnailId
  if (thumbnailId) {
    const src = getThumbnail(thumbnailId)
    console.log(`属性面板获取缩略图: 节点=${node.value?.id}, thumbnailId=${thumbnailId}, 结果=${src ? '成功' : '失败'}`)
    return src
  }
  return null
})

// 图片预览相关
const previewVisible = ref(false)
const previewImageSrc = ref(null)
const previewLoading = ref(false)

// 监听节点切换，清空文件输入框
watch(() => props.selectedNode?.id, () => {
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
})

// 显示图片预览
const showImagePreview = async () => {
  if (!node.value?.data?.imageId) return
  
  previewVisible.value = true
  previewLoading.value = true
  previewImageSrc.value = null
  
  try {
    // 从 IndexedDB 加载原图
    const originalImage = await getImage(node.value.data.imageId)
    previewImageSrc.value = originalImage
  } catch (error) {
    console.error('加载原图失败:', error)
  } finally {
    previewLoading.value = false
  }
}

// 处理睡眠节点模式切换
const onModeChange = () => {
  if (node.value && node.value.type === 'sleep') {
    // 根据模式设置 random 字段
    node.value.data.random = node.value.data.mode === 'random'
    
    // 如果切换到随机模式，确保有 maxDuration
    if (node.value.data.random && !node.value.data.maxDuration) {
      node.value.data.maxDuration = (node.value.data.duration || 1) + 1
    }
  }
}

const handleImageUpload = async (event) => {
  const file = event.target.files[0]
  if (file && node.value) {
    try {
      const img = new Image()
      const reader = new FileReader()
      
      reader.onload = (e) => {
        const originalImage = e.target.result
        const originalSize = (originalImage.length * 0.75 / 1024).toFixed(2)
        img.src = originalImage
        img.dataset.originalImage = originalImage
        img.dataset.originalSize = originalSize
      }
      
      img.onload = async () => {
        const originalWidth = img.width
        const originalHeight = img.height
        const originalSize = parseFloat(img.dataset.originalSize)
        const originalImage = img.dataset.originalImage
        
        // 只创建缩略图用于节点显示：最大 120px，质量 0.6
        const thumbMaxSize = 120
        let thumbWidth = originalWidth
        let thumbHeight = originalHeight
        
        if (thumbWidth > thumbHeight) {
          if (thumbWidth > thumbMaxSize) {
            thumbHeight = Math.round((thumbHeight * thumbMaxSize) / thumbWidth)
            thumbWidth = thumbMaxSize
          }
        } else {
          if (thumbHeight > thumbMaxSize) {
            thumbWidth = Math.round((thumbWidth * thumbMaxSize) / thumbHeight)
            thumbHeight = thumbMaxSize
          }
        }
        
        const thumbCanvas = document.createElement('canvas')
        const thumbCtx = thumbCanvas.getContext('2d', { alpha: false })
        thumbCanvas.width = thumbWidth
        thumbCanvas.height = thumbHeight
        
        thumbCtx.imageSmoothingEnabled = true
        thumbCtx.imageSmoothingQuality = 'medium'
        thumbCtx.drawImage(img, 0, 0, thumbWidth, thumbHeight)
        
        const thumbnail = thumbCanvas.toDataURL('image/jpeg', 0.6)
        const thumbnailSize = (thumbnail.length * 0.75 / 1024).toFixed(2)
        
        // 生成唯一的 ID
        const imageId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const thumbnailId = `thumb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        
        // 原图存储到 IndexedDB，缩略图存储到内存
        await storeImage(imageId, originalImage)
        storeThumbnail(thumbnailId, thumbnail)
        
        // 保存数据：只保存 ID 引用
        if (!node.value.data) node.value.data = {}
        node.value.data.imageId = imageId // 原图 ID（存储在 IndexedDB）
        node.value.data.thumbnailId = thumbnailId // 缩略图 ID（存储在内存）
        node.value.data.imageName = file.name
        node.value.data.imageInfo = {
          originalWidth,
          originalHeight,
          thumbnailWidth: thumbWidth,
          thumbnailHeight: thumbHeight,
          originalSize,
          thumbnailSize: parseFloat(thumbnailSize)
        }
        
        console.log(`图片处理完成:`)
        console.log(`  原图: ${originalSize}KB (${originalWidth}×${originalHeight}) - 存储在外部`)
        console.log(`  缩略图: ${thumbnailSize}KB (${thumbWidth}×${thumbHeight})`)
        console.log(`  图片ID: ${imageId}`)
      }
      
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('图片处理失败:', error)
    }
  }
}

const clearImage = () => {
  if (node.value && node.value.data) {
    // 从外部存储中删除原图和缩略图
    if (node.value.data.imageId) {
      deleteImage(node.value.data.imageId)
    }
    if (node.value.data.thumbnailId) {
      deleteThumbnail(node.value.data.thumbnailId)
    }
    node.value.data.imageId = null
    node.value.data.thumbnailId = null
    node.value.data.imageName = null
    node.value.data.imageInfo = null
  }
}

const textChangEvent = () => {
  if (node.value.data.inputType === 'random') {
    node.value.data.text = ''
  }
}

</script>

<style scoped>
.properties-panel {
  width: 250px;
  background: #fff;
  border-left: 1px solid #eee;
  padding: 15px;
  overflow-y: auto;
}
.properties-panel.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-style: italic;
}
.panel-header {
  border-bottom: 1px solid #eee;
  margin-bottom: 15px;
  padding-bottom: 10px;
}
.panel-header h3 {
  margin: 0;
  font-size: 16px;
}
.node-id {
  font-size: 10px;
  color: #999;
  margin-top: 5px;
}
.form-item {
  margin-bottom: 15px;
}
.form-item label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 5px;
}
.form-item input,
.form-item select {
  width: 100%;
  padding: 6px;
  border: 1px solid #ddd;
  border-radius: 4px;
}
.preview {
  margin-top: 10px;
  text-align: center;
}

.preview-thumbnail {
  max-width: 100%;
  border: 1px solid #eee;
  cursor: pointer;
  transition: all 0.3s;
}

.preview-thumbnail:hover {
  border-color: #1890ff;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.3);
  transform: scale(1.02);
}

.btn-clear {
  margin-top: 5px;
  font-size: 10px;
  background: #f5f5f5;
  border: 1px solid #ccc;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 3px;
}

.btn-clear:hover {
  background: #ff4d4f;
  color: white;
  border-color: #ff4d4f;
}

.image-preview-modal {
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-loading {
  text-align: center;
}

.preview-loading p {
  margin-top: 16px;
  color: #666;
}

.preview-image {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
}

.preview-error {
  color: #ff4d4f;
  text-align: center;
}

.image-info {
  background: #f9f9f9;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  padding: 10px;
  margin-top: 10px;
}

.info-title {
  font-size: 12px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
  padding-bottom: 5px;
  border-bottom: 1px solid #e8e8e8;
}

.info-divider {
  height: 1px;
  background: #e8e8e8;
  margin: 8px 0;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
  font-size: 11px;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-row.highlight {
  background: #e6f7ff;
  margin: 5px -5px 0;
  padding: 5px;
  border-radius: 3px;
}

.info-label {
  color: #666;
  font-weight: 500;
}

.info-value {
  color: #333;
  font-weight: normal;
  text-align: right;
  max-width: 60%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.info-value.compression {
  color: #1890ff;
  font-weight: 600;
}

.info-value.thumbnail {
  color: #722ed1;
  font-weight: 600;
}

.info-value.success {
  color: #52c41a;
  font-weight: 700;
  font-size: 12px;
}
</style>
