<template>
  <div class="sidebar">
    <div class="title">节点库</div>
    <div class="node-list">
      <div 
        class="dnd-node image" 
        draggable="true" 
        @dragstart="onDragStart($event, 'image')"
      >
        图片节点
      </div>
      <div 
        class="dnd-node dom" 
        draggable="true" 
        @dragstart="onDragStart($event, 'dom')"
      >
        DOM 路径节点
      </div>
      <div 
        class="dnd-node" 
        draggable="true" 
        @dragstart="onDragStart($event, 'text')"
      >
        文本输入节点
      </div>
      <div 
        class="dnd-node sleep" 
        draggable="true" 
        @dragstart="onDragStart($event, 'sleep')"
      >
        睡眠节点
      </div>
    </div>
    <div class="instructions">
      <small>拖拽节点到画布</small>
    </div>
  </div>
</template>

<script setup>
const onDragStart = (event, nodeType) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('application/vueflow', nodeType)
    event.dataTransfer.effectAllowed = 'move'
  }
}
</script>

<style scoped>
.sidebar {
  padding: 15px;
  border-right: 1px solid #eee;
  background: #fff;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.title {
  font-weight: bold;
  margin-bottom: 10px;
}
.dnd-node {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: grab;
  background: white;
  transition: all 0.2s;
}
.dnd-node:hover {
  border-color: #1890ff;
  color: #1890ff;
  transform: translateX(5px);
}
.instructions {
  margin-top: auto;
  color: #999;
}
</style>
