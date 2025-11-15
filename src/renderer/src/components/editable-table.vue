<template>
<div class="editable-table">
  <Table :dataSource="tableData" :columns="finalColumns" :pagination="false" :class="'compact-table'">
    <template #bodyCell="{ column, record, index }">
      <template v-if="column.dataIndex !== 'action'">
        <editable-field :key="`${column.dataIndex}_${index}`" :editable="isCellEditable(record, column)"
          :edit-component="column.editComponent || 'a-input'" :modelValue="record?.[column.dataIndex]"
          @confirm="(value) => handleCellChange(value, column.dataIndex, index)" />
      </template>
      <template v-else-if="record?.deletable !== false">
        <Popconfirm title="确定要删除吗?" @confirm="handleDelete(index)">
          <DeleteOutlined :class="{ 'disabled-icon': record?.deletable }" style="color: red" />
        </Popconfirm>
      </template>
    </template>
  </Table>

  <Button type="dashed" block @click="handleAdd" style="margin-top: 16px">
    <PlusOutlined />
  </Button>
</div>
</template>

<script setup>
import { ref, defineProps, defineEmits, watch, computed } from 'vue'
import { Table, Button, Popconfirm } from 'ant-design-vue'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons-vue'
import EditableField from './editable-field.vue'
import { isFunction } from 'lodash'

const props = defineProps({
  columns: {
    type: Array,
    required: true
  },
  modelValue: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const tableData = ref([])

// 添加操作列
const finalColumns = computed(() => [...props.columns, {
  title: '操作',
  dataIndex: 'action',
  width: 100,
  fixed: 'right'
}])

// 判断单元格是否可编辑
const isCellEditable = (record, column) => {
  if (!record || column.editable === false) return false
  if (isFunction(column.editable)) {
    return column.editable(record)
  }
  if (record.editableCells && Array.isArray(record.editableCells)) {
    return record.editableCells.includes(column.dataIndex)
  }
  return true
}

// 添加新行
const handleAdd = () => {
  const newRow = props.columns.reduce((acc, col) => {
    if (col.dataIndex !== 'action') {
      acc[col.dataIndex] = ''
    }
    return acc
  }, {})
  debugger

  // tableData.value = [...(tableData.value || []), newRow]
  tableData.value.push(newRow)
  emitChange()
}

// 删除行
const handleDelete = (index) => {
  if (!tableData.value) return
  tableData.value = tableData.value.filter((_, idx) => idx !== index)
  emitChange()
}

// 单元格数据变更
const handleCellChange = (value, field, rowIndex) => {
  debugger
  if (!tableData.value) return
  // const index = tableData.value.indexOf(record)
  const newData = [...tableData.value]
  newData[rowIndex] = {
    ...newData[rowIndex],
    [field]: value
  }
  tableData.value = newData
  emitChange()
}

// 触发变更事件
const emitChange = () => {
  debugger
  emit('update:modelValue', tableData.value)
  emit('change', tableData.value)
}

// 监听 modelValue 变化
watch(() => props.modelValue, (newVal) => {
  debugger
  if (JSON.stringify(tableData.value) !== JSON.stringify(newVal)) {
    tableData.value = newVal || []
  }
}, { immediate: true })
</script>

<style lang="less" scoped>
.editable-table {
  width: 100%;
}

:deep(.compact-table) {
  .ant-table-cell {
    padding: 4px 8px !important;
  }
}
</style>
