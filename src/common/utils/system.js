import os from 'os'
import { execSync } from 'node:child_process'
export const isWindows = os.platform() === 'win32'; // 检测操作系统

/**
 * 根据 key 值返回 参数值
 * 如果有参数，但是没值，就返回 true
 * 否则返回 false
 * @param {string} key - 参数的 key 值
 * @return {string|boolean|null}
 */
export const argv = (key) => {
  const args = process.argv || [];
  const param = args.find((arg) => arg.includes(`--${key}`));
  if (param && param.includes('=')) return param.split('=').pop();
  if (param && !param.includes('=')) return true;
  return null;
};

/**
 * 执行 系统 指令
 * @param {string} commandLine - 要执行的指令
 * @param {Object} [option={}] - 选项参数
 * @return {void}
 */
export const cmd = (commandLine, option = { log: true }) => {
  option.log && global.loggerBus.log(`执行指令: ${commandLine}`)
  try {
    return execSync(commandLine, {
      encoding: 'utf8',
      // stdio: 'inherit',
      ...option,
    })
  } catch (error) {
    global.loggerBus.err(error.message)
    return error.message
  }
}

export const isDev = () => {
  return process.env.NODE_ENV === 'development'
}

export const isDebug = () => {
  const args = process.execArgv.concat(process.argv) || []
  return !!args.find(i => /^--inspect/.test(i))
}
