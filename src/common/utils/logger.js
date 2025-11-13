/**
 * @ Author: Rongxis
 * @ Create Time: 2025-01-21 16:18:23
 * @ Description: 处理 日志 的方法集
 */
import fs from 'fs'
import path from 'path'
import { getUTC8Time, getUTC8Date, dateToFileName } from '@common/utils/date'
import { append, write } from '@common/utils/file';
import { forEach, isFile } from '@common/utils/dir';

class Logger {
  // static msgCaches = []; // 已写入的日志队列，作备份用
  constructor(dir, name) {
    // 运行日志会根据
    this.logPath = null;
    this.logName = null;
    // 只要是报错信息，都会存储到 err 目录下，以日期为文件名
    this.errPath = null;
    this.errName = null;
    Logger.prototype.init.call(Logger.prototype, dir, name); // 避免被继承时出现指针问题
    // Logger.clearExpired(); // 每次初始化时，都尝试清理过期的日志
  }

  init(dir = 'main', name = `${dateToFileName()}.log`) {
    // 运行日志会根据
    this.logPath = path.join(LOG_HOME, dir);
    this.logName = path.join(this.logPath, name);
    // 只要是报错信息，都会存储到 err 目录下，以日期为文件名
    this.errPath = ERR_HOME;
    this.errName = path.join(this.errPath, name);
  }

  /**
   * 记录日志信息，需要按照脚本目录和时间戳来存储，脚本执行的日志信息
   * @param {...any} msgs - 要记录的日志信息
   */
  log(...msgs) {
    const line = `${getUTC8Time()} - ${msgs.join(' ')}\n`
    append(this.logName, line); // 日志追加存储
  }

  /**
   * 记录运行报错信息，主要记录 主进程 的报错信息，方便定位问题
   * @param {...any} msgs - 要记录的错误信息
   */
  err(...msgs) {
    const line = `${getUTC8Time()} - ${msgs.join(' ')}\n`
    append(this.errName, line); // 错误日志追加存储
  }

  /**
   * 清空当前正在读写的log日志
   */
  clearLog() {
    write(this.logName, ''); // 使用空字串覆写，而不是删除文件
  }

  /**
   * 清空当前正在读写的err日志
   */
  clearErr() {
    write(this.errName, ''); // 使用空字串覆写，而不是删除文件
  }

  /**
   * 循环清空所有日志（慎用）
   * @param {log|err} type - 要清空的日志类型(可选)
   */
  static clearAll(type) {
    const paths = [];
    switch (type) {
      case 'log':
        paths.push(LOG_HOME);
        break;
      case 'err':
        paths.push(ERR_HOME);
        break;
      default:
        paths.push(LOG_HOME, ERR_HOME);
        break;
    }
    forEach(paths, (filePath) => {
      isFile(filePath) && fs.unlinkSync(filePath, ''); // 使用空字串覆写，而不是删除文件
    });
  }

  /**
   * 清除超过一个月的日志
   */
  static clearExpired() {
    // 获取当前日期
    const currentDate = new Date(getUTC8Date());
    // 计算一个月前的日期
    const oneMonthAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, currentDate.getDate());

    // 遍历日志目录
    Logger._clearExpiredLogs(LOG_HOME, oneMonthAgo);
    // 同样处理错误日志目录
    Logger._clearExpiredLogs(ERR_HOME, oneMonthAgo);
  }

  /**
   * 私有方法：清除指定目录下超过一个月的日志
   * @param {string} directory - 要处理的目录
   * @param {Date} oneMonthAgo - 一个月前的日期
   */
  static _clearExpiredLogs(directory, oneMonthAgo) {
    forEach(directory, (filePath) => {
      if (isFile(filePath)) {
        // 假设日志文件名包含日期信息，这里简单提取文件名作为日期（根据实际情况修改）
        const fileName = path.basename(filePath) || '';
        // 兼容 YYYY-MM-DD.log 和 YYYY-MM-DD_hhmmss.log 两种格式，提取日期部分
        const fileDateStr = fileName.split('.')[0].split('_')[0];
        const fileDate = new Date(fileDateStr);

        // 如果文件日期早于一个月前，则删除该文件
        if (fileDate < oneMonthAgo) {
          fs.unlinkSync(filePath);
        }
      }
    });
  }
}

export default Logger;
