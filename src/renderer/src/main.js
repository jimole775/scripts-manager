import './assets/main.css'
import 'uno.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { useAppStore } from '@ui/stores/app'
import App from './App.vue'
import router from '@ui/router'

const pinia = createPinia()
const app = createApp(App)
app.use(pinia)
app.use(router)
const appStore = useAppStore()
appStore.initBaseConfig() // 从配置文件获取基础配置，比如：姓名，ip地址，端口，
appStore.initScriptConfig() // 从配置文件获取脚本配置，比如：脚本路径，脚本参数，
app.mount('#app')
