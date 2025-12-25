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
        <input type="file" accept="image/*" @change="handleImageUpload" />
        <div v-if="node.data.image" class="preview">
          <img :src="node.data.image" />
          <button @click="clearImage" class="btn-clear">清除</button>
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
        <select v-model="node.data.inputType">
          <option value="manual">手动</option>
          <option value="random">随机</option>
          <option value="fixed_random">固定+随机</option>
        </select>
      </div>
      <div class="form-item">
        <label>值模板</label>
        <input v-model="node.data.text" type="text" />
      </div>
    </div>

    <!-- Sleep Node -->
    <div v-if="node.type === 'sleep'" class="type-form">
      <div class="form-item">
        <label>模式</label>
        <select v-model="node.data.mode">
          <option value="fixed">固定</option>
          <option value="random">随机</option>
        </select>
      </div>
      <div class="form-item">
        <label>时长 (秒)</label>
        <input v-model.number="node.data.duration" type="number" step="0.1" />
      </div>
      <div v-if="node.data.mode === 'random'" class="form-item">
        <label>最大时长 (秒)</label>
        <input v-model.number="node.data.maxDuration" type="number" step="0.1" />
      </div>
    </div>
  </div>
  <div v-else class="properties-panel empty">
    选择一个节点以编辑属性
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  selectedNode: {
    type: Object,
    default: null
  }
})

// We use a computed property that returns the node, but since we modify properties 
// on the node.data object directly, Vue Reactivity handles it.
const node = computed(() => props.selectedNode)

const handleImageUpload = (event) => {
  const file = event.target.files[0]
  if (file && node.value) {
    const reader = new FileReader()
    reader.onload = (e) => {
      // Ensure data object exists
      if (!node.value.data) node.value.data = {}
      node.value.data.image = e.target.result
      node.value.data.imageName = file.name
    }
    reader.readAsDataURL(file)
  }
}

const clearImage = () => {
  if (node.value && node.value.data) {
    node.value.data.image = null
    node.value.data.imageName = null
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
.preview img {
  max-width: 100%;
  border: 1px solid #eee;
}
.btn-clear {
  margin-top: 5px;
  font-size: 10px;
  background: #f5f5f5;
  border: 1px solid #ccc;
  cursor: pointer;
}
</style>
