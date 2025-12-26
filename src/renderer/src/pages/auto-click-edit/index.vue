<template>
  <div class="page-container">
    <!-- Header / Tabs -->
    <div class="tabs-header">
      <div class="tabs-scroll-container" ref="tabsScrollContainer">
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
        <div v-if="!hasScrollbar" class="add-tab add-tab-inline" @click="addNewScript">+</div>
      </div>
      <div v-if="hasScrollbar" class="add-tab add-tab-fixed" @click="addNewScript">+</div>
    </div>

    <!-- Main Content -->
    <div class="editor-body">
      <!-- Sidebar -->
      <div class="left-panel">
        <Sidebar />
      </div>

      <!-- Canvas -->
      <div class="center-panel">
        <!-- Action Buttons - Top Left -->
        <div class="top-actions">
          <button class="action-btn import" @click="importScript">导入</button>
          <button class="action-btn save" @click="saveConfig">保存</button>
          <button class="action-btn execute" @click="executeScript">执行</button>
        </div>

        <FlowEditor 
          v-if="currentScript"
          :key="activeScriptId"
          v-model="currentScript.content"
          @selection-change="onSelectionChange"
        />
        <div v-else class="no-script">
          No script selected
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
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import Sidebar from './components/Sidebar.vue'
import FlowEditor from './components/FlowEditor.vue'
import PropertiesPanel from './components/PropertiesPanel.vue'

// State
const scripts = ref([])
const activeScriptId = ref(null)
const selectedNode = ref(null)
const tabsScrollContainer = ref(null)
const hasScrollbar = ref(false)

const currentScript = computed(() => {
  return scripts.value.find(s => s.id === activeScriptId.value)
})

// 检测是否有滚动条
const checkScrollbar = () => {
  if (tabsScrollContainer.value) {
    hasScrollbar.value = tabsScrollContainer.value.scrollWidth > tabsScrollContainer.value.clientWidth
  }
}

// 监听scripts变化，检测滚动条
watch(scripts, async () => {
  await nextTick()
  checkScrollbar()
}, { deep: true })

// 自动保存定时器
let autoSaveInterval = null

// Lifecycle
onMounted(() => {
  loadScripts()
  if (scripts.value.length === 0) {
    addNewScript()
  }
  
  // 初始检测滚动条
  nextTick(() => {
    checkScrollbar()
  })
  
  // 监听窗口大小变化
  window.addEventListener('resize', checkScrollbar)
  
  // 启动自动保存：每30秒保存一次
  autoSaveInterval = setInterval(() => {
    localStorage.setItem('auto-click-scripts', JSON.stringify(scripts.value))
    console.log('自动保存完成', new Date().toLocaleTimeString())
  }, 30000)
})

onUnmounted(() => {
  // 清理定时器
  if (autoSaveInterval) {
    clearInterval(autoSaveInterval)
  }
  
  // 移除resize监听
  window.removeEventListener('resize', checkScrollbar)
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
          sourcePosition: 'right',
          deletable: false,
          data: { label: '开始' }
        },
        { 
          id: 'end-node', 
          type: 'output', // Standard output node as end
          label: '结束', 
          position: { x: 600, y: 50 },
          targetPosition: 'left',
          deletable: false,
          data: { label: '结束' }
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

const importScript = () => {
  // Create file input element
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  
  input.onchange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const content = JSON.parse(event.target.result)
        
        // Validate the imported content has nodes and edges
        if (!content.nodes || !content.edges) {
          alert('无效的脚本文件格式')
          return
        }
        
        // Create a new script with imported content
        const newId = Date.now().toString()
        const newScript = {
          id: newId,
          name: file.name.replace('.json', ''),
          content: content
        }
        
        scripts.value.push(newScript)
        activeScriptId.value = newId
        
        alert('脚本导入成功！')
      } catch (error) {
        console.error('Import error:', error)
        alert('导入失败：文件格式错误')
      }
    }
    
    reader.readAsText(file)
  }
  
  input.click()
}

const loadScripts = () => {
  const saved = localStorage.getItem('auto-click-scripts')
  if (saved) {
    try {
      scripts.value = JSON.parse(saved)
      
      // Fix: Remove dragHandle from existing start nodes to make them draggable
      scripts.value.forEach(script => {
        if (script.content && script.content.nodes) {
          const startNode = script.content.nodes.find(n => n.id === 'start-node')
          if (startNode) {
            if (startNode.dragHandle === '.drag-handle') {
              delete startNode.dragHandle
            }
            // Force source position to right (rotate 90 deg left)
            startNode.sourcePosition = 'right'
          }
          
          // Handle end node
          const endNode = script.content.nodes.find(n => n.id === 'end-node')
          if (endNode) {
            if (endNode.dragHandle === '.drag-handle') {
              delete endNode.dragHandle
            }
            // Force target position to left
            endNode.targetPosition = 'left'
          }
        }
      })

      if (scripts.value.length > 0) {
        activeScriptId.value = scripts.value[0].id
      }
    } catch (e) {
      console.error('Failed to load scripts', e)
    }
  }
}

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

.tabs-scroll-container {
  display: flex;
  flex: 1;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: thin;
  scrollbar-color: #bbb #f0f2f5;
}

.tabs-scroll-container::-webkit-scrollbar {
  height: 6px;
}

.tabs-scroll-container::-webkit-scrollbar-track {
  background: #f0f2f5;
}

.tabs-scroll-container::-webkit-scrollbar-thumb {
  background: #bbb;
  border-radius: 3px;
}

.tabs-scroll-container::-webkit-scrollbar-thumb:hover {
  background: #999;
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
  white-space: nowrap;
  flex-shrink: 0;
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
  flex-shrink: 0;
}
.add-tab:hover {
  background: #e6e6e6;
  border-radius: 4px;
}

.add-tab-inline {
  /* 内联在滚动容器内，跟随tab移动 */
  margin-left: 0;
}

.add-tab-fixed {
  /* 固定在右侧，不随滚动移动 */
  border-left: 1px solid #ddd;
  padding-left: 12px;
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

.top-actions {
  position: absolute;
  top: 16px;
  left: 16px;
  display: flex;
  gap: 8px;
  z-index: 10;
}

.right-panel {
  width: 250px;
  border-left: 1px solid #eee;
}

.action-btn {
  padding: 6px 14px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  font-size: 13px;
  color: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: all 0.2s;
}

.action-btn.import {
  background: #722ed1;
}
.action-btn.save {
  background: #1890ff;
}
.action-btn.execute {
  background: #52c41a;
}
.action-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: 0 3px 6px rgba(0,0,0,0.15);
}

.no-script {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #999;
}
</style>
