<template><a-layout class="setting-container">
  <a-layout-sider width="8rem">
    <div class="user">
      <div class="user-avatar" @click="goConfig">
        {{ userInitial }}
      </div>
    </div>
    <a-menu mode="inline" v-model:selectedKeys="selectedKeys">
      <a-menu-item v-for="route in filteredRoutes" :key="route.name">
        <span class="nav-text">
          <RouterLink :to="route.path">
            {{ route.name }}
          </RouterLink>
        </span>
      </a-menu-item>
    </a-menu>
  </a-layout-sider>
  <a-layout>
    <a-layout-content style="position: relative" class="layout-content">
      <router-view #default="{ Component, route }">
        <keep-alive v-if="route.meta.keepAlive">
          <component :is="Component" />
        </keep-alive>
        <component v-else :is="Component" />
      </router-view>
    </a-layout-content>
  </a-layout>
</a-layout></template>

<script setup>
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '@ui/stores/app'
import routes from '@ui/router/routes'
const router = useRouter()
const route = useRoute()
const selectedKeys = ref(['1'])

const { user } = storeToRefs(useAppStore())

const filteredRoutes = routes.filter((route) => ['script'].includes(route.meta.module))

const userInitial = computed(() => {
  const name = user.value?.name || ''
  return name.charAt(0).toUpperCase()
})

const goConfig = () => {
  router.push('config-setting')
  selectedKeys.value = []
}

</script>

<style lang="less" scoped>
.user {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  flex-direction: column;
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: #1890ff;
  /* 背景颜色可以根据需要调整 */
  color: #fff;
  /* 字体颜色 */
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  /* 添加鼠标指针样式 */
}

.user-name {
  font-size: 16px;
  color: #333;
}

:deep(.ant-Layout.sider-children) {
  background: #fff;
}

#components-layout-demo-responsive .logo {
  height: 32px;
  margin: 16px;
}

.setting-container {
  // border-radius: 8px;
  overflow: hidden;
  height: 100vh;

  :deep(.ant-Layout.sider) {
    .ant-Layout.sider-children {
      margin-top: 0;
      padding-top: 0;

      .ant-menu {
        border-inline-end: 0;
      }
    }
  }
}

.layout-content {
  padding: 24px;
  background: #fff;
  height: 100%;
  overflow: auto;
}
</style>
