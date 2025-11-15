/**
 * @ Author: Rongxis
 * @ Create Time: 2025-04-18 08:46:58
 * @ Description: 全局modal数据管理
 */
import { ref } from 'vue'
import { defineStore } from 'pinia'
const { ipcRenderer } = window.electron

// app数据管理
export const useModalStore = defineStore('modal', () => {
  const scriptName = ref('')
  console.log('useModalStore run times')
  ipcRenderer.on('script-name', (event, name) => {
    scriptName.value = name;
  });
  // 返回状态和方法
  return {
    scriptName
  }
})
