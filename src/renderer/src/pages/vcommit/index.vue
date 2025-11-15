<template><!-- 显示列表数据 -->
<div>
  <form-editor :layout="{ span: 24, label: 4, wrapper: 18 }" :dataSource="dataSource" :formItems="formItems"
    @change="formChanged" />
  <ExecuteButton module="vcommit" />
  <TerminateButton module="vcommit" />
</div>
</template>

<script setup>
import { onMounted } from 'vue'
import DirSelect from '@ui/components/dir-select.vue'
import { updateScriptConfig, getScriptConfig, terminateScript } from '@ui/apis/uiService'
import { message } from 'ant-design-vue'

const dataSource = ref({})

onMounted(async () => {
  const config = await getScriptConfig()
  dataSource.value = config.vcommit
  console.log("🚀 ~ onMounted ~ config.vcommit:", config.vcommit)
})

const formChanged = (formData) => {
  updateScriptConfig('vcommit', formData)
}

const formItems = [
  {
    label: '任务ID',
    key: 'tapd_tasks',
    component: 'a-input'
  },
  {
    label: '缺陷ID',
    key: 'tapd_bugs',
    component: 'a-input'
  },
  {
    label: '扫描目录',
    key: 'scan_dir',
    component: DirSelect
  },
  {
    label: '忽略文件夹',
    key: 'scan_ignore_folders',
    component: 'a-input'
  },
  {
    label: '发版分支',
    key: 'release_branch',
    component: 'a-input'
  }
]
</script>
