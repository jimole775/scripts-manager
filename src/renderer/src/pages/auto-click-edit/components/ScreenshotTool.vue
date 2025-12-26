<template>
  <div class="screenshot-overlay" @mousedown="onMouseDown" @mousemove="onMouseMove" @mouseup="onMouseUp">
    <canvas ref="canvasRef" class="screenshot-canvas"></canvas>
    
    <!-- 选区信息 -->
    <div v-if="isSelecting || hasSelection" class="selection-info" :style="infoStyle">
      {{ selectionWidth }} × {{ selectionHeight }}
    </div>
    
    <!-- 工具栏 -->
    <div v-if="hasSelection" class="toolbar" :style="toolbarStyle">
      <button @click="confirmScreenshot" class="btn-confirm">✓ 确定</button>
      <button @click="cancelScreenshot" class="btn-cancel">✕ 取消</button>
    </div>
    
    <!-- 提示文字 -->
    <div v-if="!isSelecting && !hasSelection" class="hint">
      按住鼠标左键拖动选择截图区域，按 ESC 取消
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'

const emit = defineEmits(['complete', 'cancel'])

const canvasRef = ref(null)
const isSelecting = ref(false)
const hasSelection = ref(false)
const startX = ref(0)
const startY = ref(0)
const endX = ref(0)
const endY = ref(0)

let ctx = null
let screenImageData = null
let screenImage = null  // 预加载的图片对象
let originalWindowState = null  // 保存原始窗口状态
let imageScale = 1  // 图片缩放比例
let imageOffsetX = 0  // 图片X偏移
let imageOffsetY = 0  // 图片Y偏移

const selectionWidth = computed(() => Math.abs(endX.value - startX.value))
const selectionHeight = computed(() => Math.abs(endY.value - startY.value))

const infoStyle = computed(() => {
  const x = Math.min(startX.value, endX.value)
  const y = Math.min(startY.value, endY.value)
  return {
    left: `${x}px`,
    top: `${y - 25}px`
  }
})

const toolbarStyle = computed(() => {
  const x = Math.min(startX.value, endX.value)
  const y = Math.max(startY.value, endY.value)
  return {
    left: `${x}px`,
    top: `${y + 10}px`
  }
})

onMounted(async () => {
  const canvas = canvasRef.value
  if (!canvas) return
  
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  
  ctx = canvas.getContext('2d')
  
  await captureScreen()
  
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})

const captureScreen = async () => {
  try {
    console.log('开始捕获屏幕...')
    
    // 使用 Electron 的静态截图 API
    if (window.electron && window.electron.ipcRenderer) {
      try {
        console.log('调用 CAPTURE_SCREEN API...')
        
        // 请求主进程截取全屏静态图
        const result = await window.electron.ipcRenderer.invoke('CAPTURE_SCREEN')
        
        if (result.success) {
          console.log('截图成功, 尺寸:', result.width, 'x', result.height)
          
          // 保存原始窗口状态
          originalWindowState = {
            originalBounds: result.originalBounds,
            wasFullScreen: result.wasFullScreen,
            wasMaximized: result.wasMaximized
          }
          
          screenImageData = result.imageData
          
          // 预加载图片
          screenImage = new Image()
          screenImage.onload = () => {
            console.log('图片加载成功, 尺寸:', screenImage.width, 'x', screenImage.height)
            
            // 计算缩放比例和偏移（保持宽高比，填充屏幕）
            const scaleX = window.innerWidth / screenImage.width
            const scaleY = window.innerHeight / screenImage.height
            imageScale = Math.max(scaleX, scaleY)  // 使用 max 确保填充整个屏幕
            
            const scaledWidth = screenImage.width * imageScale
            const scaledHeight = screenImage.height * imageScale
            imageOffsetX = (window.innerWidth - scaledWidth) / 2
            imageOffsetY = (window.innerHeight - scaledHeight) / 2
            
            console.log('缩放比例:', imageScale, '偏移:', imageOffsetX, imageOffsetY)
            
            // 绘制图片
            ctx.drawImage(screenImage, imageOffsetX, imageOffsetY, scaledWidth, scaledHeight)
            drawOverlay()
          }
          screenImage.onerror = (err) => {
            console.error('图片加载失败:', err)
            drawPlaceholder()
          }
          screenImage.src = screenImageData
          
          return
        } else {
          console.error('截图失败:', result.error)
        }
      } catch (err) {
        console.error('调用截图 API 失败:', err)
      }
    } else {
      console.warn('Electron API 不可用')
    }
    
    // 备用方案
    console.log('使用简化截图模式')
    drawPlaceholder()
    
  } catch (err) {
    console.error('截图初始化失败:', err)
    drawPlaceholder()
  }
}

const drawPlaceholder = () => {
  console.log('绘制占位符')
  ctx.fillStyle = '#f5f5f5'
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight)
  
  // 绘制提示文字
  ctx.fillStyle = '#333'
  ctx.font = 'bold 18px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('屏幕截图失败', window.innerWidth / 2, window.innerHeight / 2 - 40)
  
  ctx.font = '14px Arial'
  ctx.fillStyle = '#666'
  ctx.fillText('请确保授权了屏幕捕获权限', window.innerWidth / 2, window.innerHeight / 2 - 10)
  ctx.fillText('您仍然可以拖动选择区域', window.innerWidth / 2, window.innerHeight / 2 + 20)
  ctx.fillText('(保存的将是选区的尺寸信息)', window.innerWidth / 2, window.innerHeight / 2 + 50)
  
  drawOverlay()
}

const drawOverlay = () => {
  if (!ctx || !canvasRef.value) return
  
  const canvas = canvasRef.value
  
  // 先绘制完整的图片
  if (screenImage) {
    const scaledWidth = screenImage.width * imageScale
    const scaledHeight = screenImage.height * imageScale
    ctx.drawImage(screenImage, imageOffsetX, imageOffsetY, scaledWidth, scaledHeight)
  }
  
  // 绘制半透明黑色遮罩
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  
  // 如果有选区，清除选区部分的遮罩
  if (hasSelection.value || isSelecting.value) {
    const x = Math.min(startX.value, endX.value)
    const y = Math.min(startY.value, endY.value)
    const w = Math.abs(endX.value - startX.value)
    const h = Math.abs(endY.value - startY.value)
    
    // 清除选区的遮罩，显示原图
    if (screenImage) {
      // 计算选区在原图中的位置
      const srcX = (x - imageOffsetX) / imageScale
      const srcY = (y - imageOffsetY) / imageScale
      const srcW = w / imageScale
      const srcH = h / imageScale
      
      ctx.clearRect(x, y, w, h)
      ctx.drawImage(screenImage, srcX, srcY, srcW, srcH, x, y, w, h)
    } else {
      ctx.clearRect(x, y, w, h)
    }
    
    // 绘制选区边框
    ctx.strokeStyle = '#1890ff'
    ctx.lineWidth = 2
    ctx.strokeRect(x, y, w, h)
    
    // 绘制四个角的控制点
    const cornerSize = 6
    ctx.fillStyle = '#1890ff'
    ctx.fillRect(x - cornerSize / 2, y - cornerSize / 2, cornerSize, cornerSize)
    ctx.fillRect(x + w - cornerSize / 2, y - cornerSize / 2, cornerSize, cornerSize)
    ctx.fillRect(x - cornerSize / 2, y + h - cornerSize / 2, cornerSize, cornerSize)
    ctx.fillRect(x + w - cornerSize / 2, y + h - cornerSize / 2, cornerSize, cornerSize)
  }
}

const onMouseDown = (e) => {
  if (e.target !== canvasRef.value) return
  
  isSelecting.value = true
  hasSelection.value = false
  startX.value = e.clientX
  startY.value = e.clientY
  endX.value = e.clientX
  endY.value = e.clientY
}

const onMouseMove = (e) => {
  if (!isSelecting.value) return
  
  endX.value = e.clientX
  endY.value = e.clientY
  
  // 直接重绘
  drawOverlay()
}

const onMouseUp = (e) => {
  if (!isSelecting.value) return
  
  isSelecting.value = false
  endX.value = e.clientX
  endY.value = e.clientY
  
  // 如果选区太小，忽略
  if (selectionWidth.value < 10 || selectionHeight.value < 10) {
    hasSelection.value = false
    drawOverlay()
    return
  }
  
  hasSelection.value = true
  drawOverlay()
}

const confirmScreenshot = async () => {
  if (!hasSelection.value) return
  
  try {
    const x = Math.min(startX.value, endX.value)
    const y = Math.min(startY.value, endY.value)
    const w = selectionWidth.value
    const h = selectionHeight.value
    
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = w
    tempCanvas.height = h
    const tempCtx = tempCanvas.getContext('2d')
    
    if (screenImage) {
      // 计算选区在原图中的位置
      const srcX = (x - imageOffsetX) / imageScale
      const srcY = (y - imageOffsetY) / imageScale
      const srcW = w / imageScale
      const srcH = h / imageScale
      
      // 从原图中提取选区
      tempCtx.drawImage(screenImage, srcX, srcY, srcW, srcH, 0, 0, w, h)
    } else {
      // 备用方案
      tempCtx.fillStyle = '#ffffff'
      tempCtx.fillRect(0, 0, w, h)
      tempCtx.strokeStyle = '#1890ff'
      tempCtx.lineWidth = 2
      tempCtx.strokeRect(1, 1, w - 2, h - 2)
      tempCtx.fillStyle = '#666'
      tempCtx.font = '12px Arial'
      tempCtx.textAlign = 'center'
      tempCtx.fillText(`截图区域: ${w} × ${h} 像素`, w / 2, h / 2)
    }
    
    const imageData = tempCanvas.toDataURL('image/png')
    
    // 退出全屏模式
    await exitScreenshotMode()
    
    emit('complete', imageData)
  } catch (error) {
    console.error('确认截图失败:', error)
    await exitScreenshotMode()
    emit('cancel')
  }
}

const cancelScreenshot = async () => {
  await exitScreenshotMode()
  emit('cancel')
}

const exitScreenshotMode = async () => {
  if (window.electron && window.electron.ipcRenderer && originalWindowState) {
    try {
      await window.electron.ipcRenderer.invoke('EXIT_SCREENSHOT_MODE', originalWindowState)
    } catch (err) {
      console.error('退出截图模式失败:', err)
    }
  }
}

const handleKeyDown = (e) => {
  if (e.key === 'Escape') {
    cancelScreenshot()
  }
}
</script>

<style scoped>
.screenshot-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 99999;
  cursor: crosshair;
  background: #000;
}

.screenshot-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.selection-info {
  position: absolute;
  background: rgba(24, 144, 255, 0.9);
  color: white;
  padding: 4px 8px;
  border-radius: 3px;
  font-size: 12px;
  pointer-events: none;
  white-space: nowrap;
  z-index: 100001;
}

.toolbar {
  position: absolute;
  display: flex;
  gap: 8px;
  background: rgba(0, 0, 0, 0.8);
  padding: 8px;
  border-radius: 4px;
  z-index: 100001;
}

.btn-confirm,
.btn-cancel {
  padding: 6px 12px;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-confirm {
  background: #52c41a;
  color: white;
}

.btn-confirm:hover {
  background: #73d13d;
}

.btn-cancel {
  background: #ff4d4f;
  color: white;
}

.btn-cancel:hover {
  background: #ff7875;
}

.hint {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 16px 24px;
  border-radius: 8px;
  font-size: 14px;
  pointer-events: none;
  text-align: center;
  z-index: 100001;
}
</style>
