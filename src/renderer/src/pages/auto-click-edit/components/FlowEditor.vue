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
import { ref, watch, markRaw } from 'vue'
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

const { addNodes, project, onConnect, addEdges, removeEdges } = useVueFlow()

// Local state synced with props
const nodes = ref([])
const edges = ref([])

// Sync props to local
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    nodes.value = newVal.nodes || []
    edges.value = newVal.edges || []
  }
}, { immediate: true, deep: true })

// Sync local to props (basic debounce or just on change)
watch([nodes, edges], () => {
  emit('update:modelValue', {
    nodes: nodes.value,
    edges: edges.value
  })
}, { deep: true })

// Register Node Types
const nodeTypes = {
  image: markRaw(ImageNode),
  dom: markRaw(DomNode),
  text: markRaw(TextNode),
  sleep: markRaw(SleepNode)
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

  const newNode = {
    id: `${type}-${Date.now()}`,
    type,
    position,
    label: `${type} node`,
    data: { label: `${type} node` }, // Initialize data
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
