/**
 * @ Author: Rongxis
 * @ Create Time: 2025-03-05 10:14:07
 * @ Description: antd 的辅助工具集
 */
import { isString } from 'lodash';
import { dash2camel } from './text';
import * as antd from 'ant-design-vue'

export const evalAntdComponent = (symbol) => {
  // 如果symbol是字符串
  if (isString(symbol)) {
    // 将symbol转换为驼峰命名
    const name = dash2camel(symbol.replace(/^a-/, '-'))
    // 返回对应的Antd组件
    return antd[name]
  } else {
    // 如果symbol不是字符串，则直接返回symbol
    return symbol
  }
}
