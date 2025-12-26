<template>
  <div class="flow-editor" @drop="onDrop" @dragover="onDragOver">
    <VueFlow
      v-model:nodes="nodes"
      v-model:edges="edges"
      :node-types="nodeTypes"
      connection-mode="strict"
      @node-click="onNodeClick"
      @pane-click="onPaneClick"
      @edge-double-click="onEdgeDoubleClick"
      fit-view-on-init
      class="basic-flow"
    >
      <Background pattern-color="#aaa" gap="8" />
      <Controls />
      <MiniMap />
    </VueFlow>
  </div>
</template>

<script setup>
import { ref, watch, markRaw, onMounted } from 'vue'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'

// Custom Nodes
import ImageNode from './nodes/ImageNode.vue'
import DomNode from './nodes/DomNode.vue'
import TextNode from './nodes/TextNode.vue'
import SleepNode from './nodes/SleepNode.vue'

// Styles
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@vue-flow/controls/dist/style.css'
import '@vue-flow/minimap/dist/style.css'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:modelValue', 'selection-change'])

const { addNodes, project, onConnect, addEdges, removeEdges, onNodesChange, onEdgesChange } = useVueFlow()

// Local state synced with props
const nodes = ref([])
const edges = ref([])

// 标记是否正在内部更新，避免循环触发
let isInternalUpdate = false

// Sync props to local (只在外部变化时更新)
watch(() => props.modelValue, (newVal) => {
  if (newVal && !isInternalUpdate) {
    nodes.value = newVal.nodes || []
    edges.value = newVal.edges || []
  }
}, { immediate: true })

// 使用 VueFlow 事件监听代替 deep watch，性能更好
let emitTimer = null
const emitUpdate = () => {
  if (emitTimer) clearTimeout(emitTimer)
  emitTimer = setTimeout(() => {
    isInternalUpdate = true
    emit('update:modelValue', {
      nodes: nodes.value,
      edges: edges.value
    })
    setTimeout(() => {
      isInternalUpdate = false
    }, 0)
  }, 100)
}

// 监听节点变化（拖拽、删除、添加等）
onNodesChange(() => {
  emitUpdate()
})

// 监听边变化（连接、删除等）
onEdgesChange(() => {
  emitUpdate()
})

// Register Node Types
const nodeTypes = {
  image: markRaw(ImageNode),
  dom: markRaw(DomNode),
  text: markRaw(TextNode),
  sleep: markRaw(SleepNode)
}

// 节点类型中文名称映射
const nodeTypeLabels = {
  image: '图片',
  dom: 'DOM路径',
  text: '文本输入',
  sleep: '睡眠'
}

// Drag & Drop
const onDragOver = (event) => {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

const onDrop = (event) => {
  const type = event.dataTransfer?.getData('application/vueflow')
  if (!type) return

  const { left, top } = document.querySelector('.flow-editor').getBoundingClientRect()
  const position = project({
    x: event.clientX - left,
    y: event.clientY - top,
  })

  const label = nodeTypeLabels[type] || `${type}`
  
  const newNode = {
    id: `${type}-${Date.now()}`,
    type,
    position,
    label: label,
    data: { 
      label: label,
      rotation: 2  // 默认 rotation=2: 入口在左侧，出口在右侧
    }
  }
  
  // 为睡眠节点设置默认值
  if (type === 'sleep') {
    newNode.data.mode = 'fixed'
    newNode.data.duration = 1
  }

  addNodes([newNode])
}

// Connections
onConnect((params) => {
  addEdges([params])
})

// Selection
const onNodeClick = (event) => {
  emit('selection-change', event.node)
}

const onPaneClick = () => {
  emit('selection-change', null)
}

// Edge double click to delete
const onEdgeDoubleClick = (event) => {
  if (event.edge) {
    removeEdges([event.edge.id])
  }
}
</script>

<style scoped>
.flow-editor {
  width: 100%;
  height: 100%;
}
</style>
