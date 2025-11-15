import { reactive, ref, shallowRef } from 'vue'
import { defineStore } from 'pinia'
import { getBaseConfig, getScriptConfig } from '@ui/apis/uiService'

// app数据管理
export const useAppStore = defineStore('app', () => {
  const user = shallowRef({})
  const hosts = ref([])
  const accounts = ref([])
  const vmerge = ref({})
  const vcommit = ref({})
  const apiScanner = ref({})
  const vbranch = ref({})

  // 同步配置数据
  const initBaseConfig = async () => {
    const config = await getBaseConfig()
    user.value = config.user
    hosts.value = config.hosts
    accounts.value = config.accounts
  }

  // 同步脚本数据
  const initScriptConfig = async () => {
    const config = await getScriptConfig()
    vmerge.value = config.vmerge
    vcommit.value = config.vcommit
    vbranch.value = config.vbranch
    apiScanner.value = config.apiScanner
  }

  // 返回状态和方法
  return {
    user,
    hosts,
    accounts,
    vmerge,
    vcommit,
    vbranch,
    apiScanner,
    initBaseConfig,
    initScriptConfig,
  }
})
