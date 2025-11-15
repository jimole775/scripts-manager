<template><!-- 显示列表数据 -->
<div>
  <form-editor :layout="{ span: 24, label: 4, wrapper: 18 }" :dataSource="dataSource" :formItems="formItems"
    @change="formChanged" />
  <ExecuteButton module="vmerge" @finish="scriptFinished" />
  <TerminateButton module="vmerge" />
</div>
</template>

<script setup>
import { onMounted } from 'vue'
// import FormEditor from '@ui/components/form-editor.vue'
import DirSelect from '@ui/components/dir-select.vue'
import { updateScriptConfig, getScriptConfig } from '@ui/apis/uiService'

const dataSource = ref({})

onMounted(async () => {
  const config = await getScriptConfig()
  dataSource.value = config.vmerge
  console.log("🚀 ~ onMounted ~ config.vmerge:", config.vmerge)
})
const formChanged = (formData) => {
  updateScriptConfig('vmerge', formData)
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
    description: 'xxxx',
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
