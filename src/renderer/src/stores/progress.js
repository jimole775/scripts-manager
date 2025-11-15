import { defineStore } from 'pinia';
import { waitBy } from '@ui/utils/flow';
import { isArray } from '@ui/utils/typeof';

const PROGRESS_CHENNEL = 'PROGRESS_CHENNEL'
const DEFAULT_CONFIG = {
  name: 'default',
  percent: 0, // 当前进度
  step: 1, // 步进值
  status: 'normal', // 'normal' | 'active' | 'success' | 'exception'
  strokeColor: '#1890ff', // 进度条颜色
  type: 'line', // 进度条类型 'line' | 'circle' | 'dashboard' | 'text' | 'dashboard'
  isCompleted: false, // 是否完成
}

export const useProgress = defineStore('progress', {
  state: () => ({
    ...DEFAULT_CONFIG,
    multipleCached: []
  }),

  actions: {
    // 初始化/重置进度
    init(name = 'default', extraConfig = {}) {
      console.log("🚀 ~ init progress name:", name)
      const initState = {
        ...DEFAULT_CONFIG,
        name: name,
        ...extraConfig
      }

      // 把状态切换到当前进度条
      this.switchProgressBar(name);

      Object.entries(initState).forEach(([key, value]) => {
        this.$state[key] = value;
      });

      // 把当前状态缓存起来
      this._cachedState();
    },

    // 设置属性
    setProperty(prop) {
      Object.assign(this.$state, prop);
      this._cachedState();
    },

    // 设置步进尺寸（默认100）
    setStepAmount(stepAmount = 100) {
      this.step = Math.ceil(100/stepAmount * 100)/100;
      this._cachedState();
    },

    // 更新进度（支持绝对值和增量）
    update(value) {
      if (typeof value === 'number') {
        // 如果传入的是数字，直接设置进度
        this.percent = Math.min(100, Math.max(0, value));
      } else {
        // 否则，就增加步进值
        this.percent = Math.min(100, Math.max(0, this.percent + this.step));
      }
      if (this.percent >= 100) {
        this.complete();
      } else {
        this.status = 'active';
      }
      this._cachedState();
    },

    // 标记完成
    complete() {
      this.percent = 100;
      this.status = 'success';
      this.isCompleted = true;
      this.strokeColor = '#52c41a';
      this._cachedState();
    },

    hasCompleted() {
      return this.status === 'success';
    },

    // 标记失败
    fail() {
      this.status = 'exception';
      this.strokeColor = '#ff4d4f';
      this._cachedState();
    },

    // 挂载跨进程事件监听器，提供给其他线程调用（全局只执行一次，重复注册会触发多个相同事件）
    mountEventListeners() {
      waitBy(() => window?.electron?.ipcRenderer).then((ipcRenderer) => {
        ipcRenderer.on(PROGRESS_CHENNEL, (event, messages) => {
          console.log("🚀 ~ mountEventListeners ~ messages:", messages)
          if (isArray(messages)) {
            messages.forEach((message) => {
              const progressName = message.progressName;
              progressName && this.switchProgressBar(progressName);
              this[message.function]?.apply?.(this, message.argv);
            })
          }
        })
      })
    },

    unmountEventListeners() {
      waitBy(() => window?.electron?.ipcRenderer).then((ipcRenderer) => {
        ipcRenderer.removeAllListeners(PROGRESS_CHENNEL);
      })
    },

    // 切换进度条
    switchProgressBar(name = 'default') {
      console.log("🚀 ~ switchProgressBar ~ name:", name, this.name)
      if (this.name === name) return;
      this.name = name;
      const state = this._getCachedState();
      Object.assign(this.$state, state);
    },

    // 获取当前状态
    _getCachedState() {
      return this.multipleCached.find(cached => cached.name === this.name) || {}
    },

    // 因为支持多进度条共用视图，所以，需要把每个进度条状态缓存起来
    // 调用的时候，根据进度条的 name 来获取对应的状态
    _cachedState() {
      const index = this.multipleCached.findIndex(cached => cached.name === this.name);
      const state = Object.keys(DEFAULT_CONFIG).reduce((acc, key) => {
        acc[key] = this.$state[key];
        return acc;
      }, {});
      if (index === -1) {
        this.multipleCached.push(state);
      } else {
        this.multipleCached[index] = state;
      }
    },

  }
});
