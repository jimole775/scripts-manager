export default [
  {
    path: '/',
    name: 'home',
    redirect: '/config-setting',
    meta: {
      title: '主页',
      module: 'home'
    }
  },
  {
    path: '/vmerge',
    name: 'vmerge',
    component: () => import('@ui/pages/vmerge/index.vue'),
    meta: {
      title: '合并分支',
      keepAlive: true,
      module: 'script'
    }
  },
  {
    path: '/vcommit',
    name: 'vcommit',
    component: () => import('@ui/pages/vcommit/index.vue'),
    meta: {
      title: '检查提交',
      keepAlive: true,
      module: 'script'
    }
  },
  {
    path: '/api-scanner',
    name: 'api-scanner',
    component: () => import('@ui/pages/api-scanner/index.vue'),
    meta: {
      title: '权限接口扫描',
      keepAlive: true,
      module: 'script'
    }
  },
  // {
  //   path: '/vbranch',
  //   name: 'vbranch',
  //   component: () => import('@ui/pages/vbranch/index.vue'),
  //   meta: {
  //     title: '创建分支',
  //     keepAlive: true,
  //     module: 'script'
  //   }
  // },
  {
    path: '/config-setting',
    name: 'config-setting',
    component: () => import('@ui/pages/config-setting/index.vue'),
    meta: {
      title: '配置设置',
      keepAlive: true,
      module: 'config'
    }
  },
  {
    path: '/auto-click-edit',
    name: 'auto-click-edit',
    component: () => import('@ui/pages/auto-click-edit/index.vue'),
    meta: {
      title: '自动点击编辑',
      keepAlive: true,
      module: 'script'
    }
  },
  {
    path: '/script-edit',
    name: 'script-edit',
    component: () => import('@ui/pages/script-edit/index.vue'),
    meta: {
      title: '脚本编辑',
      keepAlive: true,
      module: 'script'
    }
  },
]
