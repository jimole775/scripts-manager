<script setup>
// 导入 FormViewer 组件
import FormViewer from './form-viewer.vue'

// 定义 props，设置默认值
const props = defineProps({
  group: {
    type: Array,
    default: () => [] // 默认组为空数组
  },
  dataSource: {
    type: Object,
    default: () => ({}) // 默认数据源为空对象
  },
  divid: {
    type: Boolean,
    default: () => true // 默认显示分隔符
  }
})
</script>
<template>
  <div v-bind="{ ...$attrs }">
    <div v-for="(config, index) in props.group" :key="index">
      <div class="group-header">
        <!-- header是函数，直接执行函数，并返回 vnode -->
        <component
          v-if="typeof config.header === 'function'"
          :is="config.header()"
        />
        <!-- 否则直接渲染 header -->
        <template v-else>{{ config.header }}</template>
      </div>
      <form-viewer
        v-bind="{ ...config }"
        :form-items="config.formItems"
        :data-source="props.dataSource"
      />
      <!-- 条件渲染分隔符 -->
      <a-divider v-if="props.divid && index !== props.group.length - 1" />
    </div>
  </div>
</template>
<style lang="less">
.group-header {
  color: rgba(0, 0, 0, 1);
  font-weight: 600;
  line-height: 24px;
}
</style>
