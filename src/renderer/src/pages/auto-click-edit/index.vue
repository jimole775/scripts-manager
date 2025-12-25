<template>
  <div class="page-container">
    <!-- Header / Tabs -->
    <div class="tabs-header">
      <div 
        v-for="script in scripts" 
        :key="script.id"
        class="tab-item"
        :class="{ active: activeScriptId === script.id }"
        @click="switchTab(script.id)"
      >
        {{ script.name }}
        <span v-if="scripts.length > 1" class="close-tab" @click.stop="closeTab(script.id)">×</span>
      </div>
      <div class="add-tab" @click="addNewScript">+</div>
    </div>

    <!-- Main Content -->
    <div class="editor-body">
      <!-- Sidebar -->
      <div class="left-panel">
        <Sidebar />
      </div>

      <!-- Canvas -->
      <div class="center-panel">
        <FlowEditor 
          v-if="currentScript"
          v-model="currentScript.content"
          @selection-change="onSelectionChange"
        />
        <div v-else class="no-script">
          No script selected
        </div>

        <!-- Floating Buttons -->
        <div class="floating-actions">
          <button class="action-btn save" @click="saveConfig">Save</button>
          <button class="action-btn execute" @click="executeScript">Execute</button>
        </div>
      </div>

      <!-- Properties -->
      <div class="right-panel">
        <PropertiesPanel :selected-node="selectedNode" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import Sidebar from './components/Sidebar.vue'
import FlowEditor from './components/FlowEditor.vue'
import PropertiesPanel from './components/PropertiesPanel.vue'

// State
const scripts = ref([])
const activeScriptId = ref(null)
const selectedNode = ref(null)

const currentScript = computed(() => {
  return scripts.value.find(s => s.id === activeScriptId.value)
})

// Lifecycle
onMounted(() => {
  loadScripts()
  if (scripts.value.length === 0) {
    addNewScript()
  }
})

// Methods
const addNewScript = () => {
  const newId = Date.now().toString()
  const newScript = {
    id: newId,
    name: `脚本 ${scripts.value.length + 1}`,
    content: {
      nodes: [
        { 
          id: 'start-node', 
          type: 'input', // Standard input node as start
          label: '开始', 
          position: { x: 250, y: 50 },
          deletable: false,
          data: { label: '开始' },
          dragHandle: '.drag-handle'
        }
      ],
      edges: []
    }
  }
  scripts.value.push(newScript)
  activeScriptId.value = newId
}

const switchTab = (id) => {
  activeScriptId.value = id
  selectedNode.value = null
}

const closeTab = (id) => {
  const index = scripts.value.findIndex(s => s.id === id)
  if (index !== -1) {
    scripts.value.splice(index, 1)
    if (activeScriptId.value === id) {
      if (scripts.value.length > 0) {
        activeScriptId.value = scripts.value[Math.max(0, index - 1)].id
      } else {
        activeScriptId.value = null
      }
    }
  }
}

const onSelectionChange = (node) => {
  selectedNode.value = node
}

const saveConfig = () => {
  // Save to localStorage or File
  localStorage.setItem('auto-click-scripts', JSON.stringify(scripts.value))
  
  // Also export as JSON file for the runner
  if (currentScript.value) {
    const dataStr = JSON.stringify(currentScript.value.content, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentScript.value.name.replace(/\s+/g, '_')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }
  
  alert('Scripts saved!')
}

const executeScript = () => {
  // In a real implementation, this would call the backend
  // console.log('Executing:', currentScript.value)
  
  // Send to Main Process (Mock)
  // window.electron.ipcRenderer.send('run-auto-click', currentScript.value.content)
  
  alert('Execution started! (Mock)\nCheck console for logic.')
  console.log('Script Content:', JSON.stringify(currentScript.value.content, null, 2))
}

const loadScripts = () => {
  const saved = localStorage.getItem('auto-click-scripts')
  if (saved) {
    try {
      scripts.value = JSON.parse(saved)
      if (scripts.value.length > 0) {
        activeScriptId.value = scripts.value[0].id
      }
    } catch (e) {
      console.error('Failed to load scripts', e)
    }
  }
}

// Watch for changes to auto-save (optional)
watch(scripts, () => {
  localStorage.setItem('auto-click-scripts', JSON.stringify(scripts.value))
}, { deep: true })

</script>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.tabs-header {
  display: flex;
  background: #f0f2f5;
  padding: 4px 4px 0;
  border-bottom: 1px solid #ddd;
  height: 40px;
}

.tab-item {
  padding: 8px 16px;
  background: #e6e6e6;
  border: 1px solid #ddd;
  border-bottom: none;
  border-radius: 4px 4px 0 0;
  margin-right: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.tab-item.active {
  background: #fff;
  font-weight: bold;
  border-bottom: 1px solid #fff;
  margin-bottom: -1px;
  z-index: 1;
}

.close-tab {
  font-size: 14px;
  color: #999;
}
.close-tab:hover {
  color: #ff4d4f;
}

.add-tab {
  padding: 8px 12px;
  cursor: pointer;
  font-weight: bold;
  color: #666;
}
.add-tab:hover {
  background: #e6e6e6;
  border-radius: 4px;
}

.editor-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.left-panel {
  width: 200px;
  border-right: 1px solid #eee;
}

.center-panel {
  flex: 1;
  position: relative;
  background: #fafafa;
}

.right-panel {
  width: 250px;
  border-left: 1px solid #eee;
}

.floating-actions {
  position: absolute;
  bottom: 20px;
  right: 20px;
  display: flex;
  gap: 10px;
  z-index: 10;
}

.action-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  color: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.action-btn.save {
  background: #1890ff;
}
.action-btn.execute {
  background: #52c41a;
}
.action-btn:hover {
  opacity: 0.9;
}

.no-script {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #999;
}
</style>
