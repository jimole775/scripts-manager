<template>
<div>
  <FormEditor :layout="{ span: 24, label: 4, wrapper: 18 }" :data-source="formData" :form-items="formItems" />
  <a-button @click="() => openModal('test')">测试弹窗</a-button>
</div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import FormEditor from '@ui/components/form-editor.vue';
import EditableField from '@ui/components/editable-field.vue';
import EditableTable from '@ui/components/editable-table.vue';
import { updateBaseConfig, getBaseConfig, openModal } from '@ui/apis/uiService.js';
import { cloneDeep } from 'lodash'

const formData = ref({})
onMounted(async () => {
  const config = await getBaseConfig()
  formData.value = toFormData(config)
})

function toFormData(config) {
  return {
    ...config,
    ...config.user
  }
}
const formItems = [
  {
    key: 'name',
    label: '用户名',
    wrapperRender: (model, item, bridge, h) => {
      const value = model[item.key]
      return h(EditableField, {
        editComponent: 'a-input',
        modelValue: value,
        onConfirm: (val) => {
          updateBaseConfig('user', 'name', val)
        }
      });
    }
  },
  {
    key: 'hosts',
    label: '主机列表',
    wrapperRender: (model, item, bridge, h) => {
      // 使用 cloneDeep 阻断响应式，否则会无限循环
      const tableRows = cloneDeep(model[item.key] || [])
      return h(EditableTable, {
        columns: [
          { dataIndex: 'project', title: '项目' },
          { dataIndex: 'env', title: '环境' },
          { dataIndex: 'host', title: '主机' },
          { dataIndex: 'port', title: '端口' },
        ],
        modelValue: tableRows.map((row, index) => {
          if (row.fixed === 1) {
            row.editableCells = ['host', 'port']
            row.deletable = false
          }
          return row
        }),
        onChange: (tableData) => {
          model[item.key] = tableData
          updateBaseConfig('hosts', tableData)
        }
      });
    }
  },
  {
    key: 'accounts',
    label: '账号列表',
    wrapperRender: (model, item, bridge, h) => {
      // 使用 cloneDeep 阻断响应式，否则会无限循环
      const tableRows = cloneDeep(model[item.key] || [])
      return h(EditableTable, {
        columns: [
          { dataIndex: 'project', title: '项目' },
          { dataIndex: 'env', title: '环境' },
          { dataIndex: 'account', title: '账号' },
          { dataIndex: 'password', title: '密码' },
        ],
        modelValue: tableRows,
        onChange: (tableData) => {
          model[item.key] = tableData
          updateBaseConfig('accounts', tableData)
        }
      });
    }
  }
]

</script>
