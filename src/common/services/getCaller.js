/**
 * @ Author: Rongxis
 * @ Create Time: 2025-03-14 16:30:07
 * @ Description: 非打包的脚本执行，可以使用这个方法来定位调用的 脚本名
 */
import fs from 'fs'
import path from 'path'
const scriptIgnore = []; // 非脚本目录，收集脚本名的时候进行忽略

/**
 * 获取是哪个【脚本项目】调用了这个方法（打包后调用链会变更，所以只适合开发环境调试用）
 * @returns String
 */
export default function getCaller(callersHome = './') {
  const originalFunc = Error.prepareStackTrace;
  let caller;
  const err = new Error();
  Error.prepareStackTrace = function (err, stack) {
    return stack;
  };
  const scriptNames = fs
    .readdirSync(callersHome)
    .filter((name) => !scriptIgnore.includes(`/${name}`));
  while (err.stack.length) {
    const stackTrace = err.stack.pop().getFileName();
    const scriptName = scriptNames.find((name) => stackTrace.includes(`${path.sep}${name}${path.sep}`));
    if (scriptName) {
      caller = scriptName;
      break;
    }
  }
  Error.prepareStackTrace = originalFunc;
  return caller;
};
