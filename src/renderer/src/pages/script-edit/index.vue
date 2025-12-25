<script setup>
import { ref } from 'vue'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@vue-flow/controls/dist/style.css'
import '@vue-flow/minimap/dist/style.css'

const { onConnect, addEdges } = useVueFlow()

const nodes = ref([
  {
    id: '1',
    type: 'input',
    label: 'Start Script',
    position: { x: 250, y: 5 },
  },
  {
    id: '2',
    label: 'Process Step',
    position: { x: 100, y: 100 },
  },
  {
    id: '3',
    label: 'Another Step',
    position: { x: 400, y: 100 },
  },
  {
    id: '4',
    type: 'output',
    label: 'End',
    position: { x: 250, y: 200 },
  },
])

const edges = ref([
  { id: 'e1-2', source: '1', target: '2', animated: true },
  { id: 'e1-3', source: '1', target: '3', animated: true },
])

onConnect((params) => addEdges(params))

const onNodeClick = (event) => {
  console.log('Node clicked:', event.node)
}
</script>

<template>
  <div class="dndflow">
    <VueFlow
      v-model:nodes="nodes"
      v-model:edges="edges"
      class="basicflow"
      :default-viewport="{ zoom: 1.5 }"
      :min-zoom="0.2"
      :max-zoom="4"
      fit-view-on-init
      @node-click="onNodeClick"
    >
      <Background pattern-color="#aaa" gap="8" />
      <MiniMap />
      <Controls />
    </VueFlow>
  </div>
</template>

<style>
/* Import Vue Flow styles */
@import '@vue-flow/core/dist/style.css';
@import '@vue-flow/core/dist/theme-default.css';

.dndflow {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.basicflow {
  flex-grow: 1;
  background: #f0f2f5;
}
</style>
