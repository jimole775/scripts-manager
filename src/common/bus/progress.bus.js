/**
 * @ Author: Rongxis
 * @ Create Time: 2025-06-03 16:16:40
 * @ Description: 跨线程的进度条 管理总线
 * 当前 app 只有一个全局进度条，而且需要跨进程管理，所以需要这么一个管理总线
 */
// import { getMain } from '@common/manager/window.manager'
import { isObject, isArray } from '@common/utils/assert'
import { channelRegister, channelMethod } from '@common/manager/channel.manager'

const PROGRESS_CHENNEL = 'PROGRESS_CHENNEL'

@channelRegister(PROGRESS_CHENNEL)
class ProgressBus {
  constructor(progressName) {
    this.progressName = progressName;
  }

  @channelMethod({ noteWindow: 'main' })
  init(progressName) {
    progressName && (this.progressName = progressName);
  }

  @channelMethod({ noteWindow: 'main' })
  update(msgs = []) {
    this._detectiveProgressName(msgs);
  }

  @channelMethod({ noteWindow: 'main' })
  setStepAmount(msgs = []) {
    this._detectiveProgressName(msgs);
  }

  @channelMethod({ noteWindow: 'main' })
  switchProgressBar(msgs = []) {
    this._detectiveProgressName(msgs);
  }

  // 把数据格式转换为 { progressName: '', argv: []}
  _detectiveProgressName(msgs) {
    if (isObject(msgs)) {
      msgs.progressName = msgs.progressName || this.progressName;
    }
    if (isArray(msgs)) {
      msgs.forEach(msg => {
        this._detectiveProgressName(msg);
      })
    }
    return msgs;
  }

}

export default ProgressBus;
