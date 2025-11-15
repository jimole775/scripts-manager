import { createRouter, createWebHistory } from 'vue-router'
import routes from './routes'

const router = createRouter({
  routes: [...routes],
  history: createWebHistory(import.meta.env.VITE_APP_BASE),
})

export default router
