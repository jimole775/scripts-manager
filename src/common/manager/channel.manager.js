/**
 * @ Author: Rongxis
 * @ Create Time: 2025-06-11 13:43:13
 * @ Description: 进程管理器，用于管理所有的进程，包括主进程、子进程、子进程的子进程等等
 */
import { getMain } from '@common/manager/window.manager'
// 全局共用一个 message 频道，用 map.channel 来规划子频道
const channelMap = {};
const DEFAULT_CHANNEL = 'DEFAULT_CHANNEL'
/**
 * @ Description: 注册指定频道的事件处理函数
 * @ Param {string} channel - 频道名称
 * @ Param {object} targetPrototype - 事件处理函数对象，包含多个事件处理函数
 * @ Return {void}
 */
export const channelRegister = (channelName, targetPrototype) => {
  if (targetPrototype) {
    channelMap[channelName] = targetPrototype;
  } else {
    return (target) => {
      // 返回增强后的类
      return class extends target {
        constructor(...args) {
          super(...args);
          channelMap[channelName] = this
          this.__channelName = channelName;
        }
      };
    }
  }
}

/**
 * @ Description: 调用指定频道的事件处理函数
 * @ Param {string} channelName - 频道名称
 * @ Param {any[]} msgs - 消息数组
 * @ Return {void}
 */
export const channelCall = (channelName, messages) => {
  // 主进程执行事件，子进程发送消息到主进程
  if (isMainProcess()) {
    const memberInstance = channelMap[channelName];
    if (!memberInstance) {
      return console.error(`channel ${channelName} not register`);
    }
    mainProcessInvoke(memberInstance, messages);
  } else {
    process.send({ channel: channelName, messages: messages });
  }
}

/**
 * @ Description: 注册指定频道的类
 * @ Param {string} channelName - 频道名称
 * @ Param {object} target - 类对象
 * @ Return {void}
 */
export const channelClass = (channelName) => {
  return (target) => {
    // 返回增强后的类
    return class extends target {
      constructor(...args) {
        super(...args);
        channelRegister(channelName, this);
        this.__channelName = channelName;
      }
    };
  }
}

/**
 * @ Description: 注册指定频道的类成员函数，使其可以自动处理跨进程调用事件
 * @ Param {string} channelName - 频道名称
 * @ Param {object} target - 类实例
 * @ Param {string} propertyName - 类成员函数名
 * @ Param {object} descriptor - 装饰器
 * @ Return {void}
 */
export function channelMethod ({
  channelName = DEFAULT_CHANNEL,
  noteWindow
}) {
  return function (target, propertyName, descriptor) {
    const method = descriptor.value;
    descriptor.value = function(...args) {
      const channel = this.__channelName || channelName;
      // 如果在子进程中，就发送日志信息到主进程中
      if (isMainProcess()) {
        try {
          method.apply(this, args);
          if (noteWindow === 'main') {
            getMain()?.webContents?.send(channel, [{ function: propertyName, argv: args }]);
          }
        } catch (error) {
          console.error(`channel message ${JSON.stringify({ function: propertyName, argv: args })} error: ${error}`);
        }
      } else {
        // 主进程执行事件，子进程发送消息到主进程
        process.send({ channel, messages: [{ function: propertyName, argv: args }] });
      }
      return target;
    };
    return descriptor;
  }
}

/**
 * @ Description: 判断当前是否在主进程中
 * @ Return {boolean} - 是否在主进程中
 */
export const isMainProcess = () => {
  return !process.send;
}

/**
 * @ Description: 调用指定频道的事件处理函数
 * @ Param {object} memberInstance - 成员函数的实例对象，包含多个事件处理函数
 * @ Param {string} channelName - 频道名称
 * @ Param {any[]} channelMessages - 消息数组
 * @ Return {void}
 */
function mainProcessInvoke(memberInstance, channelMessages) {
  if (!Array.isArray(channelMessages)) {
    channelMessages = [channelMessages];
  }
  channelMessages.forEach((message) => {
    const funcName = message.function;
    if (!funcName) {
      return console.error(`${memberInstance.__channelName} channel message has not function name`);
    }
    const func = memberInstance[funcName];
    if (!func) {
      return console.error(`${memberInstance.__channelName} channelMap has not class method ${funcName}`);
    }
    try {
      func.apply(memberInstance, message.argv || []);
    } catch (error) {
      console.error(`channel message ${JSON.stringify({ function: funcName, argv: message.argv })} error: ${error}`);
    }
  })
}
