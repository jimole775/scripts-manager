/**
 * @ Author: Rongxis
 * @ Create Time: 2025-06-11 13:43:13
 * @ Description: 进程管理器，用于管理所有的进程，包括主进程、子进程、子进程的子进程等等
 */
import loadScript from '@common/services/loadScript'
import { isString, isNumber } from '@common/utils/assert'
import { isDebug } from '@common/utils/system'
import { fork } from 'child_process'
import { channelCall } from './channel.manager.js'
const PROCESS_MAP = Object.create(null) // 脚本进程管理

// 创建线程
export const createProcess = (scriptName, endCallback) => {
  if (!PROCESS_MAP[scriptName]) {
    PROCESS_MAP[scriptName] = {
      status: 'init', // 'init' | 'running' | 'exit'
      entity: null,
      start: () => {},
      stop: () => {},
    }
  }
  const childProcess = PROCESS_MAP[scriptName];
  if (childProcess.status === 'running') { // 运行中，就直接返回
    return childProcess
  }

  const messageEvent = (preload) => {
    channelCall(preload.channel, preload.messages)
  }
  const exitEvent = (exitCode) => {
    childProcess.status = 'exit';
    childProcess.entity = null;
    endCallback && endCallback(exitCode);
  }

  childProcess.start = () => {
    childProcess.entity = fork(loadScript(scriptName), {
      execArgv: ['--inspect=9230'] // 指定调试端口为9230，避免与父进程或其他进程冲突
    })
    childProcess.status = 'running';

    // 监听进程退出事件
    childProcess.entity.on('exit', exitEvent);

    // 可选：监听错误事件
    childProcess.entity.on('error', exitEvent);

    childProcess.entity.on('message', messageEvent)
  }

  childProcess.stop = () => {
    if (childProcess.entity) {
      childProcess.entity.off('exit', exitEvent);
      childProcess.entity.off('error', exitEvent);
      childProcess.entity.off('message', messageEvent);
      childProcess.entity.kill('SIGTERM');
      childProcess.status = 'exit';
    } else {
      console.error('进程不存在')
    }
    exitEvent(0) // 手动调用退出回调
  }

  return childProcess
}

// 获取线程
export const getProcess = (nameOrId) => {
  if (isString(nameOrId)) { // 如果是字符串，就按照名称查找
    return PROCESS_MAP[nameOrId];
  } else if (isNumber(nameOrId)) { // 如果是数字，就按照id查找
    return Object.values(PROCESS_MAP).find((process) => process.entity?.pid === nameOrId);
  }
}

// 杀死线程，一般线程卡死时，需要手动杀死线程，否则会一直运行
export const killProcess = (nameOrId) => {
  const process = getProcess(nameOrId);
  if (process) { // 如果找到了进程，就杀死进程
    process.kill();
  }
}

// 获取所有的进程，返回一个数组，包含所有的进程信息，包括名称、id、状态等
export const getProcessAll = () => {
  return Object.values(PROCESS_MAP)
}
