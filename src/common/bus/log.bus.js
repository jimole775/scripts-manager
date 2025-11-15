/**
 * @ Author: Rongxis
 * @ Create Time: 2025-06-03 16:16:40
 * @ Description: 【log 交互总线】
 * 主要调用 @utils/logger 的 log 和 err 方法
 * 每次调用 log 或 err 方法时，需要判断：
 * 1. 如果当前是在主进程中，就不做额外处理，
 * 2. 如果是在 子进程中，就需要将日志信息发送到主进程中，然后在主进程中进行存储
 * 这样可以避免在子进程中直接操作文件，避免文件操作的并发问题
 */
import Logger from '@common/utils/logger';
import { cloneDeep } from 'lodash'
import { channelRegister, channelCall } from '@common/manager/channel.manager'

const LOGGER_CHENNEL = 'LOGGER_CHENNEL'

class LoggerBus extends Logger {
  static msgCaches = []; // 已写入的日志队列，作备份用，以支持多管道运行
  constructor(dir, name) {
    super(dir, name);
    this.scriptName = dir
    this.pipeGate = false; // 是否开启管道
    this.pipeEnities = []; // 多管道节点时，存储的管道实例
    this.usingEntity = () => {}; // 处理流的实例
    this.streaming = false; // 管道流动中，用来控制多管道传输的先后
    this.msgQueques = []; // 已写入的日志队列，作读取用
  }

  // 注册日志交互总线的通道，只需要注册一次
  registerChannel() {
    const instance = this;
    channelRegister(LOGGER_CHENNEL, instance);
  }

  init(dir, name) {
    // 如果在主进程，就初始化日志记录器
    if (this.isMainProcess()) {
      this.msgQueques.length = 0; // 清空队列
      LoggerBus.msgCaches.length = 0; // 清空缓存
      super.init(dir, name);
    } else {
      // 如果在子进程中，就发送日志信息到主进程中
      channelCall(LOGGER_CHENNEL, {function: 'init', argv: [dir, name]});
    }
  }

  isMainProcess() {
    return !process.send;
  }

  _cache (msg) {
    this.msgQueques.push(msg);
    LoggerBus.msgCaches.push(msg);
  }

  log(...messages) {
    if (this.isMainProcess()) {
      this._cache({ type: 'log', messages }); // 存储用于进程共享
      super.log(...messages); // 写本地日志文件
    } else {
      channelCall(LOGGER_CHENNEL, {function: 'log', argv: messages}); // 发送日志信息到主进程中
    }
  }

  err(...messages) {
    if (this.isMainProcess()) {
      this._cache({ type: 'err', messages }); // 存储用于进程共享
      super.err(...messages); // 写本地日志文件
    } else {
      channelCall(LOGGER_CHENNEL, {function: 'err', argv: messages}); // 发送日志信息到主进程中
    }
  }

  // 停止输出日志信息
  close() {
    this.pipeGate = false;
  }

  // 打开执行pipe流程
  open() {
    this.pipeGate = true;
    this._pipeLoop()
  }

  // 模拟 pipe，持续输出日志信息
  // 支持 pipe().pipe() 多管道串行输出
  pipe(callback) {
    if (this.streaming) {
      this.pipeEnities.push(callback);
    } else {
      // 装载数据
      this.usingEntity = callback;
      this.msgQueques = cloneDeep(LoggerBus.msgCaches);
      this.streaming = true;
    }
    return this;
  }

  _pipeLoop () {
    // 如果管道关闭，直接退出
    if (!this.pipeGate) return this;
    const msg = this.msgQueques.shift();
    // 如果队列消耗完毕，但是还有额外的管道节点
    // 则需要停掉上一个节点的流程，重新调用 pipe 装载下一个管道的流程
    if (!msg && this.pipeEnities.length) {
      this.streaming = false
      return this.pipe(this.pipeEnities.shift())
    }
    // 正常的管道流程
    msg && this.usingEntity(cloneDeep(msg));
    setTimeout(() => this._pipeLoop(), 100);
  }
}

export default LoggerBus;
