import { resolve, join } from 'path';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import AutoImport from 'unplugin-auto-import/vite'
import vue from '@vitejs/plugin-vue';
import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import Unocss from 'unocss/vite'
import os from 'os'
import yaml from 'js-yaml'
import { readFileSync } from 'fs'
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers'
// vite.config.js
import Components from 'unplugin-vue-components/vite'

// 配置存储目录
const STORE_HOME = join(os.homedir(), `.scripts-manager`)
const babelConfig = {
  // 排除 node_modules，不转换第三方库
  exclude: 'node_modules/**',
  // 指定 Babel 如何处理辅助函数，'bundled' 表示打包进最终代码
  babelHelpers: 'bundled',
  plugins: [
    ['@babel/plugin-proposal-decorators', { legacy: true }],
    ['@babel/plugin-proposal-class-properties', { legacy: true }],
  ],
}
export default defineConfig({
  main: {
    build: {
      sourcemap: true,  // 新增
      // ... existing code ...
    },
    define: {
      PROJECT_NAME: JSON.stringify('ScriptsManager'), // 项目名称
      STORE_HOME: JSON.stringify(STORE_HOME), // 存储目录
      CONFIG_SCHEDULE: JSON.stringify(yaml.load(readFileSync('./schedule.config.yml'))), // 任务配置
      SCRIPT_SCHEDULE: JSON.stringify(yaml.load(readFileSync('./schedule.script.yml'))), // 脚本配置
      SCRIPTS_HOME: JSON.stringify(resolve(__dirname, 'src/main/scripts')), // 脚本目录
      LOG_HOME: JSON.stringify(join(STORE_HOME, 'logs')), // 日志目录
      ERR_HOME: JSON.stringify(join(STORE_HOME, 'errs')), // 错误目录
    },
    resolve: {
      alias: {
        dayjs: 'dayjs/esm', // 指向 dayjs 的 ES 模块版本
        lodash: 'lodash-es', // 指向 lodash 的 ES 模块版本
        '@': resolve(__dirname, 'src'),
        '@main': resolve(__dirname, 'src/main'),
        '@common': resolve(__dirname, 'src/common'),
        '@utils': resolve(__dirname, 'src/common/utils'),
        '@services': resolve(__dirname, 'src/common/services'),
        '@assets': resolve(__dirname, 'src/common/assets'),
        '@packages': resolve(__dirname, 'src/common/packages'),
        '@preload': resolve(__dirname, 'src/preload'),
        '@scripts': resolve(__dirname, 'src/preload/scripts'),
      }
    },
    plugins: [
      commonjs(),
      nodeResolve(),
      externalizeDepsPlugin(),
      babel(babelConfig)
    ]
  },
  preload: {
    build: {
      target: 'node20', // Node.js 环境
      outDir: 'out/scripts',
      rollupOptions: {
        input: {
          preload: resolve(__dirname, 'src/preload/index.js'), // 脚本预载入口
          vcommit: resolve(__dirname, 'src/scripts/vcommit/main.js'), // 独立入口
          'api-scanner': resolve(__dirname, 'src/scripts/api-scanner/main.js'), // 独立入口
          vmerge: resolve(__dirname, 'src/scripts/vmerge/main.js'), // 独立入口
          // vbranch: resolve(__dirname, 'src/scripts/vbranch/main.js'), // 独立入口
        },
        output: {
          entryFileNames: '[name].js',
          format: 'cjs' // 指定 CommonJS 格式
        }
      }
    },
    define: {
      PROJECT_NAME: JSON.stringify('ScriptsManager'),
      STORE_HOME: JSON.stringify(join(STORE_HOME)),
      CONFIG_SCHEDULE: JSON.stringify(yaml.load(readFileSync('./schedule.config.yml'))),
      SCRIPT_SCHEDULE: JSON.stringify(yaml.load(readFileSync('./schedule.script.yml'))),
      SCRIPTS_HOME: JSON.stringify(resolve(__dirname, 'src/main/scripts')),
      LOG_HOME: JSON.stringify(join(STORE_HOME, 'logs')),
      ERR_HOME: JSON.stringify(join(STORE_HOME, 'errs')),
    },
    resolve: {
      alias: {
        dayjs: 'dayjs/esm', // 指向 dayjs 的 ES 模块版本
        lodash: 'lodash-es', // 指向 lodash 的 ES 模块版本
        '@': resolve(__dirname, 'src'),
        '@main': resolve(__dirname, 'src/main'),
        '@common': resolve(__dirname, 'src/common'),
        '@utils': resolve(__dirname, 'src/common/utils'),
        '@services': resolve(__dirname, 'src/common/services'),
        '@preload': resolve(__dirname, 'src/preload'),
      }
    },
    plugins: [
      commonjs(),
      nodeResolve(),
      externalizeDepsPlugin(),
      babel(babelConfig)
    ]
  },
  renderer: {
    build: {
      outDir: 'out/renderer',
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/renderer/index.html'),
          modal: resolve(__dirname, 'src/renderer/modal.html')
        }
      }
    },
    server: {
      port: 5200
    },
    resolve: {
      alias: {
        dayjs: 'dayjs/esm', // 指向 dayjs 的 ES 模块版本
        lodash: 'lodash-es', // 指向 lodash 的 ES 模块版本
        '@': resolve(__dirname, 'src'),
        '@ui': resolve(__dirname, 'src/renderer/src'),
        '@modal': resolve(__dirname, 'src/renderer/modal'),
        '@common': resolve(__dirname, 'src/common'),
        '@preload': resolve(__dirname, 'src/preload'),
      }
    },
    plugins: [
      AutoImport({
        imports: ['vue', 'vue-router', 'pinia'],
        dirs: [
          resolve(__dirname, 'src/renderer/src/stores')
        ],
        dts: true, // 生成自动导入的类型声明文件
      }),
      commonjs(),
      nodeResolve(),
      vue(),
      Unocss(),
      Components({
        resolvers: [
          AntDesignVueResolver({
            importStyle: 'css-in-js'
          })
        ],
      })
    ]
  }
});
