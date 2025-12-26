<template>
  <div class="custom-node-wrapper" :class="{ selected: selected }">
    <!-- 旋转按钮 - 悬停时显示在卡片上方 -->
    <div class="rotate-label">
      <button class="rotate-btn" @click.stop="onRotate" title="顺时针旋转连接点">↻</button>
    </div>
    
    <div class="node-header">
      <span class="node-title">{{ title }}</span>
      <div class="header-actions">
        <a-popconfirm
          v-if="hasConnections"
          title="确定要删除此节点吗？"
          ok-text="确定"
          cancel-text="取消"
          @confirm="onDelete"
          @click.stop
        >
          <button class="delete-btn" @click.stop>×</button>
        </a-popconfirm>
        <button v-else class="delete-btn" @click.stop="handleDeleteClick">×</button>
      </div>
    </div>
    <div class="node-content">
      <slot></slot>
    </div>
    
    <!-- Input Handle -->
    <Handle 
      :key="`input-${rotationState}`"
      type="target" 
      :position="inputPosition" 
      class="handle-input" 
    />
    
    <!-- Output Handles with Labels -->
    <div v-if="outputPositionName === 'bottom'" class="output-labels output-labels-bottom">
      <span class="handle-label success">成功</span>
      <span class="handle-label fail">失败</span>
    </div>
    <div v-if="outputPositionName === 'left'" class="output-labels output-labels-left">
      <span class="handle-label success">成功</span>
      <span class="handle-label fail">失败</span>
    </div>
    <div v-if="outputPositionName === 'right'" class="output-labels output-labels-right">
      <span class="handle-label success">成功</span>
      <span class="handle-label fail">失败</span>
    </div>
    
    <Handle 
      :key="`success-${rotationState}`"
      id="success" 
      type="source" 
      :position="outputPosition" 
      :style="getHandleStyle('success')"
      class="handle-success handle-output-1" 
    />
    <Handle 
      :key="`fail-${rotationState}`"
      id="fail" 
      type="source" 
      :position="outputPosition" 
      :style="getHandleStyle('fail')"
      class="handle-fail handle-output-2" 
    />
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { Handle, Position, useVueFlow } from '@vue-flow/core'

const props = defineProps({
  id: {
    type: String,
    required: false
  },
  title: {
    type: String,
    default: 'Node'
  },
  selected: {
    type: Boolean,
    default: false
  },
  hasConnections: {
    type: Boolean,
    default: false
  },
  rotation: {
    type: Number,
    default: 2  // 默认值改为 2：输出在右侧，输入在左侧
  }
})

const emit = defineEmits(['delete'])

// 获取 VueFlow 实例
const { updateNodeInternals, updateNode } = useVueFlow()

// 连接点位置状态：0=bottom, 1=left, 2=right (跳过 top)
// 默认 rotation=2: 输出在右侧，输入在左侧
const rotationState = ref(props.rotation)

// 位置映射（跳过 top）
const positions = [Position.Bottom, Position.Left, Position.Right]
const positionNames = ['bottom', 'left', 'right']

// 输出连接点位置
const outputPosition = computed(() => {
  return positions[rotationState.value]
})

// 输出连接点位置名称（用于 CSS class）
const outputPositionName = computed(() => {
  return positionNames[rotationState.value]
})

// 输入连接点位置（与输出相对）
const inputPosition = computed(() => {
  // bottom(0) -> top, left(1) -> right, right(2) -> left
  const oppositeMap = [Position.Top, Position.Right, Position.Left]
  return oppositeMap[rotationState.value]
})

const onDelete = () => {
  emit('delete')
}

const handleDeleteClick = () => {
  // 如果没有连接线，直接删除
  if (!props.hasConnections) {
    onDelete()
  }
  // 如果有连接线，popconfirm 会自动处理
}

const onRotate = async () => {
  // 顺时针旋转：bottom(0) -> left(1) -> right(2) -> bottom(0)
  rotationState.value = (rotationState.value + 1) % 3
  
  // 更新节点数据以便持久化
  if (props.id) {
    updateNode(props.id, (node) => {
      return {
        ...node,
        data: {
          ...node.data,
          rotation: rotationState.value
        }
      }
    })
  }
  
  // 等待 DOM 更新后，通知 VueFlow 更新节点的连接点
  await nextTick()
  if (props.id) {
    updateNodeInternals(props.id)
  }
}

// 计算 Handle 的位置样式
const getHandleStyle = (handleId) => {
  const pos = outputPositionName.value
  const style = {}
  
  if (pos === 'bottom') {
    // 水平排列
    style.left = handleId === 'success' ? '33.33%' : '66.66%'
    style.transform = 'translateX(-50%)'
  } else if (pos === 'left' || pos === 'right') {
    // 垂直排列
    style.top = handleId === 'success' ? '33.33%' : '66.66%'
    style.transform = 'translateY(-50%)'
  }
  
  return style
}
</script>

<style scoped>
.custom-node-wrapper {
  background: #fff;
  /* border: 1px solid #ededed; */
  border: none;
  border-radius: 4px;
  width: 120px;
  max-width: 120px;
  box-shadow: 0px 3.54px 4.55px 0px #00000005, 0px 3.54px 4.55px 0px #0000000d, 0px .51px 1.01px 0px #0000001a;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 11px;
  position: relative;
}

.custom-node-wrapper:hover {
  box-shadow: 0px 3.54px 4.55px 0px #00000008, 0px 3.54px 4.55px 0px #00000010, 0px .51px 1.01px 0px #0000001f;
  transform: translateY(-1px);
}

.custom-node-wrapper.selected {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2), 0px 3.54px 4.55px 0px #00000005, 0px 3.54px 4.55px 0px #0000000d, 0px .51px 1.01px 0px #0000001a;
}

/* 旋转按钮标签 - 默认隐藏，选中时显示在卡片上方 */
.rotate-label {
  position: absolute;
  top: -24px;
  left: 50%;
  transform: translateX(-50%);
  opacity: 0;
  transition: opacity 0.2s;
  pointer-events: none;
  z-index: 2;
}

.custom-node-wrapper.selected .rotate-label {
  opacity: 1;
  pointer-events: auto;
}

.rotate-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  color: #667eea;
  font-size: 10px;
  line-height: 1;
  padding: 3px 6px;
  font-weight: 600;
  white-space: nowrap;
  transition: all 0.2s;
}

.rotate-btn:hover {
  color: #764ba2;
  transform: scale(1.1);
}

.node-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px 4px;
  background: transparent;
  border-bottom: none;
  overflow: hidden;
}

.node-title {
  font-weight: 600;
  font-size: 11px;
  color: #1e293b;
  letter-spacing: 0.01em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.header-actions {
  display: flex;
  gap: 4px;
  align-items: center;
}

.delete-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  color: #94a3b8;
  font-size: 16px;
  line-height: 1;
  padding: 0 2px;
  transition: all 0.2s;
  border-radius: 3px;
}

.delete-btn:hover {
  color: #ef4444;
  background: #fee2e2;
}

.node-content {
  padding: 0 10px 8px;
  font-size: 10px;
  color: #475569;
  overflow: hidden;
  word-wrap: break-word;
  word-break: break-word;
}

/* Output Labels - 默认隐藏，选中时显示 */
.output-labels {
  position: absolute;
  display: flex;
  gap: 8px;
  pointer-events: none;
  z-index: 1;
  opacity: 0;
  transition: opacity 0.2s;
}

.custom-node-wrapper.selected .output-labels {
  opacity: 1;
}

.output-labels-bottom {
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
  flex-direction: row;
  justify-content: center;
  width: 100%;
}

.output-labels-left {
  left: -38px;
  top: 50%;
  transform: translateY(-50%);
  flex-direction: column;
  align-items: flex-end;
}

.output-labels-right {
  right: -38px;
  top: 50%;
  transform: translateY(-50%);
  flex-direction: column;
  align-items: flex-start;
}

.output-labels-bottom .handle-label {
  flex: 1;
  text-align: center;
}

.handle-label {
  font-size: 10px;
  font-weight: 600;
  white-space: nowrap;
  padding: 2px 4px;
}

.handle-label.success { 
  color: #10b981;
}
.handle-label.fail { 
  color: #ef4444;
}

/* Override Vue Flow Handle styles */
.vue-flow__handle {
  width: 10px;
  height: 10px;
  border: 2px solid #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  transition: all 0.2s;
}

.vue-flow__handle:hover {
  transform: scale(1.3);
}

.handle-input {
  background: #3b82f6;
}

.handle-success {
  background: #10b981;
}

.handle-fail {
  background: #ef4444;
}
</style>
