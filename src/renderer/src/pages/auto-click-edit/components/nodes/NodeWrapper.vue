<template>
  <div class="custom-node-wrapper" :class="{ selected: selected }">
    <div class="node-header">
      <span class="node-title">{{ title }}</span>
      <div class="header-actions">
        <button class="rotate-btn" @click.stop="onRotate" title="逆时针旋转连接点">↻</button>
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
  data: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['delete'])

// 获取 VueFlow 实例
const { updateNodeInternals, updateNodeData } = useVueFlow()

// 连接点位置状态：0=bottom, 1=left, 2=right (跳过 top)
// 默认输出在右侧(2)，输入在左侧
const rotationState = ref(props.data?.rotation ?? 2)

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
  // 逆时针旋转：bottom(0) -> left(1) -> right(2) -> bottom(0)
  rotationState.value = (rotationState.value + 1) % 3
  
  // 更新节点数据以便持久化
  if (props.id) {
    updateNodeData(props.id, { rotation: rotationState.value })
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
  background: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  min-width: 150px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: all 0.2s;
}

.custom-node-wrapper.selected {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.node-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 8px;
  background: #f5f5f5;
  border-bottom: 1px solid #eee;
  border-radius: 4px 4px 0 0;
}

.node-title {
  font-weight: bold;
  font-size: 12px;
}

.header-actions {
  display: flex;
  gap: 4px;
  align-items: center;
}

.rotate-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  color: #999;
  font-size: 16px;
  line-height: 1;
  padding: 0 4px;
  font-weight: bold;
}

.rotate-btn:hover {
  color: #1890ff;
}

.delete-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  color: #999;
  font-size: 16px;
  line-height: 1;
  padding: 0 4px;
}

.delete-btn:hover {
  color: #ff4d4f;
}

.node-content {
  padding: 8px;
  font-size: 12px;
}

/* Output Labels */
.output-labels {
  position: absolute;
  display: flex;
  gap: 8px;
  pointer-events: none;
  z-index: 1;
}

.output-labels-bottom {
  bottom: -18px;
  left: 50%;
  transform: translateX(-50%);
  flex-direction: row;
  justify-content: center;
  width: 100%;
}

.output-labels-left {
  left: -40px;
  top: 50%;
  transform: translateY(-50%);
  flex-direction: column;
  align-items: flex-end;
}

.output-labels-right {
  right: -40px;
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
  white-space: nowrap;
}

.handle-label.success { color: #52c41a; }
.handle-label.fail { color: #ff4d4f; }

/* Override Vue Flow Handle styles */
.vue-flow__handle {
  width: 8px;
  height: 8px;
}

.handle-input {
  background: #1890ff;
}

.handle-success {
  background: #52c41a;
}

.handle-fail {
  background: #ff4d4f;
}
</style>
